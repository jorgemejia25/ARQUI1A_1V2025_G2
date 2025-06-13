"""
Sistema Principal SIEPA
Integra sensores, display y comunicación MQTT
Optimizado para Raspberry Pi con gestión eficiente de historial
"""

import time
import signal
import sys
import json
import logging
from typing import Dict, Any
from config import SENSOR_CONFIG, ALERT_CONFIG

from .sensors.sensor_manager import SensorManager
from .display.display_manager import DisplayManager
from .mqtt.mqtt_manager import MQTTManager


class SIEPASystem:
    """Sistema Principal SIEPA"""
    
    def __init__(self, mode: str = 'testing', enable_mqtt: bool = False):
        self.mode = mode
        self.enable_mqtt = enable_mqtt
        self.running = False
        
        # Configurar logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.StreamHandler(),
                logging.FileHandler('siepa_system.log') if mode == 'real' else logging.NullHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
        
        # Estado del motor (para control manual y automático)
        self.motor_state = False
        self.motor_manual_control = False  # Si está en modo manual, no controlar automáticamente
        
        # Inicializar componentes
        self.sensor_manager = SensorManager(mode)
        self.display_manager = DisplayManager(mode)
        self.mqtt_manager = MQTTManager(mode) if enable_mqtt else None
        

        
        # Configurar manejo de señales para shutdown limpio
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
        print(f"🚀 Sistema SIEPA inicializado - Modo: {mode.upper()}")
        print(f"📊 Datos en tiempo real - Sin almacenamiento local")
        if enable_mqtt:
            print("📡 MQTT habilitado")
    
    def start(self):
        """Inicia el sistema principal"""
        print("Sistema SIEPA iniciado. Leyendo sensores...\n")
        
        # Conectar MQTT si está habilitado
        if self.mqtt_manager:
            mqtt_connected = self.mqtt_manager.connect()
            if mqtt_connected:
                self.mqtt_manager.subscribe_to_commands(self._handle_mqtt_command)
                # Publicar estado inicial de sensores
                sensor_status = self.sensor_manager.get_sensor_status()
                self.mqtt_manager.publish_sensor_status(sensor_status)
        
        self.running = True
        
        try:
            self._main_loop()
        except KeyboardInterrupt:
            self._shutdown()
        except Exception as e:
            print(f"❌ Error inesperado: {e}")
            self._shutdown()
    
    def _main_loop(self):
        """Loop principal del sistema - estilo allin_w_display.py"""
        while self.running:
            # Leer todos los sensores
            sensor_data = self.sensor_manager.read_all_sensors()
            
            # Extraer variables igual que allin_w_display.py
            temp = sensor_data.get('temperature')
            hum = sensor_data.get('humidity')
            distancia = sensor_data.get('distance')
            lux = sensor_data.get('light_lux')
            voltaje_ldr = sensor_data.get('light_voltage')
            ppm = sensor_data.get('air_quality_ppm')
            voltaje_mq135 = sensor_data.get('air_quality_voltage')
            presion = sensor_data.get('pressure')
            hay_luz = sensor_data.get('light', False)
            aire_malo = sensor_data.get('air_quality_bad', False)

            # Controlar buzzer basado en calidad del aire (igual que allin_w_display.py)
            self.sensor_manager.controlar_buzzer(aire_malo)
            
            # Agregar estado del buzzer a los datos
            sensor_data['buzzer_state'] = aire_malo
            
            # Mostrar en display (que ya tiene el formato de allin_w_display.py)
            self.display_manager.display_sensor_data(sensor_data)

            # Controlar motor: automático por aire malo o manual desde frontend
            if not self.motor_manual_control:
                # Control automático basado en calidad del aire
                if aire_malo:
                    self._set_motor_state(True)
                    self.sensor_manager.activar_alerta("Aire contaminado", SENSOR_CONFIG['LED_AIRE'])
                    
                    # Mostrar mensaje en LCD igual que allin_w_display.py
                    if hasattr(self.display_manager, 'lcd'):
                        self.display_manager.clear()
                        self.display_manager.write_at(0, 0, "⚠️ Aire contaminado ⚠️")
                        self.display_manager.write_at(1, 0, "Toma precauciones")
                    
                    time.sleep(0.5)
                    continue
                else:
                    # Desactivar motor si aire está bien y no hay control manual
                    self._set_motor_state(False)
            
            # Agregar estado del motor a los datos de sensores
            sensor_data['motor_state'] = self.motor_state
            


            # Verificar alertas críticas EXACTAMENTE igual que allin_w_display.py
            if temp is not None and temp > 30:
                self.sensor_manager.activar_alerta("Temp. muy alta", SENSOR_CONFIG['LED_TEMP'])

            if hum is not None and hum > 60:  # CAMBIO: 60% como en allin_w_display.py
                self.sensor_manager.activar_alerta("Humedad alta", SENSOR_CONFIG['LED_HUM'])

            # Usar no_hay_luz como en allin_w_display.py (basado en voltaje >= 1.2V)
            no_hay_luz = sensor_data.get('no_hay_luz', False)
            if voltaje_ldr is not None and no_hay_luz:
                self.sensor_manager.activar_alerta("No hay luz", SENSOR_CONFIG['LED_LUZ'])

            if presion is not None and (presion < 980 or presion > 1030):
                self.sensor_manager.activar_alerta("Presion anormal", SENSOR_CONFIG['LED_AIRE'])  # Usar LED azul para presión
            
            # Determinar qué LEDs están activos (automático vs manual)
            if self.sensor_manager.is_manual_led_control():
                # En modo manual, usar estados manuales
                led_states = self.sensor_manager.get_led_states().copy()
                led_states['manual_control'] = True
            else:
                # En modo automático, usar alertas como siempre
                led_states = {
                    'temperature': temp is not None and temp > 30,
                    'humidity': hum is not None and hum > 60,  # 60% como en allin_w_display.py
                    'light': voltaje_ldr is not None and no_hay_luz,  # Usar no_hay_luz
                    'air_quality': aire_malo,
                    'pressure': presion is not None and (presion < 980 or presion > 1030),
                    'manual_control': False
                }
            
            # Enviar por MQTT si está habilitado
            if self.mqtt_manager and self.mqtt_manager.is_connected():
                self.mqtt_manager.publish_sensor_data(sensor_data)
                
                # Publicar estado del buzzer solo si no está en modo manual
                if not self.sensor_manager.is_manual_buzzer_control():
                    self.mqtt_manager.publish_buzzer_state(aire_malo)
                else:
                    # En modo manual, publicar el estado manual actual
                    self.mqtt_manager.publish_buzzer_state(self.sensor_manager.get_buzzer_state())
                
                # Publicar estado del motor
                self.mqtt_manager.publish_motor_state(self.motor_state)
                # Publicar estado de los LEDs
                self.mqtt_manager.publish_led_status(led_states)
            
            # Esperar antes de la siguiente lectura (igual que allin_w_display.py usa 0.5 segundos)
            time.sleep(0.5)
    
    def _handle_mqtt_command(self, topic: str, payload: Dict[str, Any]):
        """Maneja comandos recibidos por MQTT"""
        print(f"📥 Comando MQTT recibido: {topic} -> {payload}")
        
        if topic == 'GRUPO2/commands/rasp01/buzzer':
            enabled = payload.get('enabled', False)
            
            # Activar modo manual del buzzer al recibir comando del frontend
            if not self.sensor_manager.is_manual_buzzer_control():
                self.sensor_manager.set_manual_buzzer_control(True)
                print("🎛️  Buzzer cambiado a modo manual por comando frontend")
            
            # Controlar el buzzer manualmente
            self.sensor_manager.set_buzzer_state(enabled)
            
            # Enviar confirmación por MQTT
            if self.mqtt_manager:
                self.mqtt_manager.publish_buzzer_state(enabled)
        
        elif topic == 'GRUPO2/commands/rasp01/system':
            command = payload.get('command')
            if command == 'shutdown':
                print("🛑 Comando de apagado recibido por MQTT")
                self._shutdown()
        
        elif topic.startswith('GRUPO2/commands/rasp01/actuators/'):
            # Comando de control de actuadores (motor, fan, etc.)
            actuator_type = topic.split('/')[-1]  # Obtener el tipo de actuador del tópico
            
            if actuator_type in ['motor', 'fan']:
                enabled = payload.get('enabled', False)
                self._control_motor_from_frontend(enabled)
                
                # Enviar confirmación
                if self.mqtt_manager:
                    response_topic = f"GRUPO2/status/rasp01/actuators/{actuator_type}"
                    response_payload = {
                        'actuator': actuator_type,
                        'enabled': enabled,
                        'state': 'ON' if enabled else 'OFF',
                        'manual_control': self.motor_manual_control,
                        'timestamp': time.time()
                    }
                    self.mqtt_manager.client.publish(response_topic, json.dumps(response_payload))
        
        elif topic.startswith('GRUPO2/commands/rasp01/sensors/'):
            # Comando de control de sensores individuales
            sensor_type = topic.split('/')[-1]  # Obtener el tipo de sensor del tópico
            
            if sensor_type == 'enable':
                # Comando general para habilitar/deshabilitar sensores
                sensor_name = payload.get('sensor')
                enabled = payload.get('enabled', True)
                if sensor_name:
                    success = self.sensor_manager.enable_sensor(sensor_name, enabled)
                    if success and self.mqtt_manager:
                        # Enviar confirmación
                        response_topic = f"GRUPO2/status/rasp01/sensors/{sensor_name}"
                        response_payload = {
                            'sensor': sensor_name,
                            'enabled': enabled,
                            'timestamp': time.time()
                        }
                        self.mqtt_manager.client.publish(response_topic, json.dumps(response_payload))
            else:
                # Comando específico para un sensor
                enabled = payload.get('enabled', True)
                success = self.sensor_manager.enable_sensor(sensor_type, enabled)
                if success and self.mqtt_manager:
                    # Enviar confirmación
                    response_topic = f"GRUPO2/status/rasp01/sensors/{sensor_type}"
                    response_payload = {
                        'sensor': sensor_type,
                        'enabled': enabled,
                        'timestamp': time.time()
                    }
                    self.mqtt_manager.client.publish(response_topic, json.dumps(response_payload))
        
        elif topic.startswith('GRUPO2/commands/rasp01/leds/'):
            # Comandos de control de LEDs
            led_command_type = topic.split('/')[-1]  # control, individual, pattern
            
            if led_command_type == 'control':
                # Control general de LEDs (manual/automático)
                mode = payload.get('mode', 'automatic')  # 'manual' o 'automatic'
                manual_mode = mode == 'manual'
                
                self.sensor_manager.set_manual_led_control(manual_mode)
                
                # También controlar el buzzer con el mismo modo que los LEDs
                self.sensor_manager.set_manual_buzzer_control(manual_mode)
                
                # Enviar confirmación
                if self.mqtt_manager:
                    response_payload = {
                        'manual_mode': manual_mode,
                        'leds': self.sensor_manager.get_led_states(),
                        'buzzer': self.sensor_manager.get_buzzer_state(),
                        'timestamp': time.time()
                    }
                    self.mqtt_manager.client.publish('GRUPO2/status/rasp01/leds', json.dumps(response_payload))
            
            elif led_command_type == 'individual':
                # Control individual de LEDs
                led_type = payload.get('led')  # temperature, humidity, light, air_quality, pressure
                action = payload.get('action', 'toggle')  # toggle, on, off
                
                print(f"🔧 [LED Backend] Control individual - LED: {led_type}, Acción: {action}")
                
                if led_type:
                    # Activar modo manual si no está activo
                    if not self.sensor_manager.is_manual_led_control():
                        self.sensor_manager.set_manual_led_control(True)
                        print("🎛️  LEDs cambiados a modo manual por comando individual")
                    
                    success = False
                    if action == 'toggle':
                        success = self.sensor_manager.toggle_led(led_type)
                    elif action == 'on':
                        success = self.sensor_manager.set_led_state(led_type, True)
                    elif action == 'off':
                        success = self.sensor_manager.set_led_state(led_type, False)
                    
                    # Enviar confirmación
                    if success and self.mqtt_manager:
                        response_payload = {
                            'manual_mode': self.sensor_manager.is_manual_led_control(),
                            'leds': self.sensor_manager.get_led_states(),
                            'buzzer': self.sensor_manager.get_buzzer_state(),
                            'timestamp': time.time()
                        }
                        self.mqtt_manager.client.publish('GRUPO2/status/rasp01/leds', json.dumps(response_payload))
            
            elif led_command_type == 'pattern':
                # Patrones de LEDs
                pattern = payload.get('pattern')  # all_on, all_off, alternate, sequence
                
                print(f"🔧 [LED Backend] Patrón solicitado: {pattern}")
                
                if pattern:
                    # Activar modo manual si no está activo
                    if not self.sensor_manager.is_manual_led_control():
                        self.sensor_manager.set_manual_led_control(True)
                        print("🎛️  LEDs cambiados a modo manual por comando de patrón")
                    
                    self.sensor_manager.set_led_pattern(pattern)
                    
                    # Enviar confirmación
                    if self.mqtt_manager:
                        response_payload = {
                            'manual_mode': self.sensor_manager.is_manual_led_control(),
                            'leds': self.sensor_manager.get_led_states(),
                            'buzzer': self.sensor_manager.get_buzzer_state(),
                            'timestamp': time.time()
                        }
                        self.mqtt_manager.client.publish('GRUPO2/status/rasp01/leds', json.dumps(response_payload))
        
        # El sistema ya no maneja comandos de historial
        # Los datos se envían en tiempo real únicamente
    
    def _signal_handler(self, signum, frame):
        """Maneja señales del sistema"""
        print(f"\n📡 Señal recibida: {signum}")
        self._shutdown()
    
    def _shutdown(self):
        """Apaga el sistema de forma limpia"""
        print("\n🛑 Finalizando programa...")
        
        self.running = False
        
        # Sistema simplificado - no hay buffers ni historial que cerrar
        
        # Desconectar MQTT
        if self.mqtt_manager:
            self.mqtt_manager.disconnect()
        
        # Mostrar mensaje de apagado en display
        self.display_manager.display_shutdown()
        
        # Limpiar recursos de sensores
        self.sensor_manager.cleanup()
        
        print("✅ Sistema SIEPA finalizado correctamente")
        sys.exit(0)
    
    def get_sensor_reading(self) -> Dict[str, Any]:
        """Obtiene una lectura única de sensores (útil para testing)"""
        return self.sensor_manager.read_all_sensors()
    
    def display_custom_message(self, message: str):
        """Muestra un mensaje personalizado en el display"""
        self.display_manager.display_message(message)
    
    def _set_motor_state(self, state: bool):
        """Establece el estado del motor y lo controla físicamente"""
        if self.motor_state != state:
            self.motor_state = state
            self.sensor_manager.controlar_motor(state)
            print(f"🔧 Motor {'encendido' if state else 'apagado'} {'(automático)' if not self.motor_manual_control else '(manual)'}")
    
    def _control_motor_from_frontend(self, enabled: bool):
        """Controla el motor desde comandos del frontend"""
        print(f"📥 Comando de motor recibido desde frontend: {'ON' if enabled else 'OFF'}")
        
        # Activar modo manual al recibir comando del frontend
        self.motor_manual_control = True
        self._set_motor_state(enabled)
        
        print(f"🎛️  Motor en modo manual: {'ON' if enabled else 'OFF'}")
    
    def reset_motor_to_automatic(self):
        """Regresa el motor al modo automático"""
        self.motor_manual_control = False
        print("🤖 Motor regresado al modo automático")
    
 