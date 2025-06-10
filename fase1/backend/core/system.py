"""
Sistema Principal SIEPA
Integra sensores, display y comunicación MQTT
"""

import time
import signal
import sys
import json
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
        
        # Inicializar componentes
        self.sensor_manager = SensorManager(mode)
        self.display_manager = DisplayManager(mode)
        self.mqtt_manager = MQTTManager(mode) if enable_mqtt else None
        
        # Configurar manejo de señales para shutdown limpio
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
        print(f"🚀 Sistema SIEPA inicializado - Modo: {mode.upper()}")
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
        """Loop principal del sistema"""
        while self.running:
            # Leer todos los sensores
            sensor_data = self.sensor_manager.read_all_sensors()
            
            # Controlar buzzer basado en calidad del aire (igual que allin_w_display.py)
            aire_malo = sensor_data.get('air_quality_bad', False)
            if ALERT_CONFIG['BUZZER_ON_BAD_AIR']:
                self.sensor_manager.control_buzzer(aire_malo)  # Buzzer ON si el aire es malo
            
            # Agregar estado del buzzer a los datos
            sensor_data['buzzer_state'] = aire_malo
            
            # Determinar qué LEDs están activos (las alertas se manejan automáticamente en sensor_manager)
            led_states = {
                'temperature': sensor_data.get('temperature') is not None and (
                    sensor_data.get('temperature') < ALERT_CONFIG['TEMPERATURE']['min'] or 
                    sensor_data.get('temperature') > ALERT_CONFIG['TEMPERATURE']['max']),
                'humidity': sensor_data.get('humidity') is not None and (
                    sensor_data.get('humidity') < ALERT_CONFIG['HUMIDITY']['min'] or 
                    sensor_data.get('humidity') > ALERT_CONFIG['HUMIDITY']['max']),
                'light': sensor_data.get('light_lux') is not None and 
                    sensor_data.get('light_lux') > ALERT_CONFIG['LIGHT']['max'],
                'air_quality': aire_malo
            }
            
            # Mostrar en display
            self.display_manager.display_sensor_data(sensor_data)
            
            # Enviar por MQTT si está habilitado
            if self.mqtt_manager and self.mqtt_manager.is_connected():
                self.mqtt_manager.publish_sensor_data(sensor_data)
                # Publicar estado del buzzer
                self.mqtt_manager.publish_buzzer_state(aire_malo)
                # Publicar estado de los LEDs
                self.mqtt_manager.publish_led_status(led_states)
            
            # Esperar antes de la siguiente lectura
            time.sleep(SENSOR_CONFIG['READ_INTERVAL'])
    
    def _handle_mqtt_command(self, topic: str, payload: Dict[str, Any]):
        """Maneja comandos recibidos por MQTT"""
        print(f"📥 Comando MQTT recibido: {topic} -> {payload}")
        
        if topic == 'siepa/commands/buzzer':
            state = payload.get('state', False)
            self.sensor_manager.control_buzzer(state)
        
        elif topic == 'siepa/commands/system':
            command = payload.get('command')
            if command == 'shutdown':
                print("🛑 Comando de apagado recibido por MQTT")
                self._shutdown()
        
        elif topic.startswith('siepa/commands/sensors/'):
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
                        response_topic = f"siepa/status/sensors/{sensor_name}"
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
                    response_topic = f"siepa/status/sensors/{sensor_type}"
                    response_payload = {
                        'sensor': sensor_type,
                        'enabled': enabled,
                        'timestamp': time.time()
                    }
                    self.mqtt_manager.client.publish(response_topic, json.dumps(response_payload))
    
    def _signal_handler(self, signum, frame):
        """Maneja señales del sistema"""
        print(f"\n📡 Señal recibida: {signum}")
        self._shutdown()
    
    def _shutdown(self):
        """Apaga el sistema de forma limpia"""
        print("\n🛑 Finalizando programa...")
        
        self.running = False
        
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