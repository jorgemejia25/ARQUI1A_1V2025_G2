"""
Gestor MQTT del Sistema SIEPA
Maneja la comunicación MQTT de forma integrada
"""

import json
import time
from typing import Dict, Any, Optional, Callable
from config import MQTT_CONFIG

try:
    import paho.mqtt.client as mqtt
    MQTT_AVAILABLE = True
except ImportError:
    MQTT_AVAILABLE = False
    mqtt = None

class MQTTManager:
    """Gestor de comunicación MQTT"""
    
    def __init__(self, mode: str = 'testing'):
        self.mode = mode
        self.config = MQTT_CONFIG
        self.client = None
        self.connected = False
        self.on_message_callback = None
        
        print(f"🔧 Inicializando MQTTManager en modo: {mode}")
        
        # Inicializar cliente MQTT tanto en modo testing como real
        if MQTT_AVAILABLE:
            self._init_mqtt_client()
        else:
            print("⚠️  Biblioteca paho-mqtt no disponible")
    
    def _init_mqtt_client(self):
        """Inicializa el cliente MQTT"""
        try:
            self.client = mqtt.Client()
            
            # Configurar callbacks
            self.client.on_connect = self._on_connect
            self.client.on_disconnect = self._on_disconnect
            self.client.on_message = self._on_message
            self.client.on_publish = self._on_publish
            
            # Configurar credenciales si existen
            if self.config['USERNAME'] and self.config['PASSWORD']:
                self.client.username_pw_set(
                    self.config['USERNAME'], 
                    self.config['PASSWORD']
                )
                print("✅ Credenciales MQTT configuradas")
            
            print("✅ Cliente MQTT inicializado correctamente")
                
        except Exception as e:
            print(f"❌ Error inicializando cliente MQTT: {e}")
    
    def connect(self) -> bool:
        """Conecta al broker MQTT"""
        if not MQTT_AVAILABLE:
            print("⚠️  Paho MQTT no disponible. Funcionando sin MQTT.")
            return False
            
        if not self.client:
            print("❌ Cliente MQTT no inicializado")
            return False
            
        try:
            print(f"🔄 Conectando a {self.config['BROKER_HOST']}:{self.config['BROKER_PORT']}...")
            self.client.connect(
                self.config['BROKER_HOST'], 
                self.config['BROKER_PORT'], 
                60
            )
            self.client.loop_start()
            
            # Esperar a que se establezca conexión (hasta 10 segundos)
            timeout = 10
            while not self.connected and timeout > 0:
                time.sleep(0.1)
                timeout -= 0.1
            
            if self.connected:
                print("✅ Conexión MQTT establecida exitosamente")
                return True
            else:
                print("❌ Timeout en la conexión MQTT")
                return False
                
        except Exception as e:
            print(f"❌ Error conectando a MQTT: {e}")
            return False
    
    def disconnect(self):
        """Desconecta del broker MQTT"""
        if self.client and self.connected:
            print("🔌 Desconectando de MQTT...")
            self.client.loop_stop()
            self.client.disconnect()
    
    def publish_sensor_data(self, sensor_data: Dict[str, Any]) -> bool:
        """Publica datos de sensores"""
        if not self.connected:
            print("⚠️  MQTT no conectado - no se pueden enviar datos")
            return False
            
        try:
            # Publicar datos completos con información adicional
            payload = json.dumps({
                **sensor_data,
                'mode': self.mode,
                'timestamp': time.time(),
                'system': 'SIEPA'
            })
            
            # Publicar en tópico principal
            result = self.client.publish(
                self.config['TOPICS']['SENSORS'],
                payload,
                qos=self.config['QOS'],
                retain=self.config['RETAIN']
            )
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                print(f"📤 Datos publicados en {self.config['TOPICS']['SENSORS']}")
            else:
                print(f"❌ Error publicando datos principales: {result.rc}")
            
            # Publicar datos individuales
            self._publish_individual_readings(sensor_data)
            
            return result.rc == mqtt.MQTT_ERR_SUCCESS
            
        except Exception as e:
            print(f"❌ Error publicando datos: {e}")
            return False
    
    def _publish_individual_readings(self, sensor_data: Dict[str, Any]):
        """Publica lecturas individuales por tópico - formato mejorado para frontend"""
        current_timestamp = time.time()
        
        # Temperatura
        if sensor_data.get('temperature') is not None:
            temp_data = {
                'valor': round(sensor_data.get('temperature'), 2),
                'unidad': '°C',
                'timestamp': current_timestamp,
                'sensor_type': 'Temperatura',
                'evaluationType': 'temperature',
                'evalValue': sensor_data.get('temperature')
            }
            self._publish_topic_data('TEMPERATURE', temp_data)
        
        # Humedad
        if sensor_data.get('humidity') is not None:
            hum_data = {
                'valor': round(sensor_data.get('humidity'), 2),
                'unidad': '%',
                'timestamp': current_timestamp,
                'sensor_type': 'Humedad',
                'evaluationType': 'humidity',
                'evalValue': sensor_data.get('humidity')
            }
            self._publish_topic_data('HUMIDITY', hum_data)
        
        # Distancia
        if sensor_data.get('distance') is not None:
            dist_data = {
                'valor': round(sensor_data.get('distance'), 2),
                'unidad': 'cm',
                'timestamp': current_timestamp,
                'sensor_type': 'Distancia',
                'evaluationType': 'distance',
                'evalValue': sensor_data.get('distance')
            }
            self._publish_topic_data('DISTANCE', dist_data)
        
        # Luz (con lux y voltaje)
        if sensor_data.get('light_lux') is not None:
            light_data = {
                'valor': round(sensor_data.get('light_lux', 0), 1),
                'unidad': 'lux',
                'timestamp': current_timestamp,
                'sensor_type': 'Luz',
                'evaluationType': 'light',
                'evalValue': sensor_data.get('light_lux', 0),
                'detectada': sensor_data.get('light', False),
                'voltage': round(sensor_data.get('light_voltage', 0), 3),
                'extra_data': {
                    'lux_value': sensor_data.get('light_lux', 0),
                    'detection_status': sensor_data.get('light', False),
                    'raw_voltage': sensor_data.get('light_voltage', 0)
                }
            }
            self._publish_topic_data('LIGHT', light_data)
        
        # Calidad del aire (con ppm y voltaje)
        if sensor_data.get('air_quality_ppm') is not None:
            air_data = {
                'valor': round(sensor_data.get('air_quality_ppm', 0), 1),
                'unidad': 'ppm',
                'timestamp': current_timestamp,
                'sensor_type': 'Calidad del Aire',
                'evaluationType': 'air_quality',
                'evalValue': sensor_data.get('air_quality_ppm', 0),
                'malo': sensor_data.get('air_quality_bad', False),
                'voltage': round(sensor_data.get('air_quality_voltage', 0), 3),
                'extra_data': {
                    'ppm_value': sensor_data.get('air_quality_ppm', 0),
                    'bad_air_status': sensor_data.get('air_quality_bad', False),
                    'raw_voltage': sensor_data.get('air_quality_voltage', 0)
                }
            }
            self._publish_topic_data('AIR_QUALITY', air_data)
        
        # Presión (nuevo sensor BMP280)
        if sensor_data.get('pressure') is not None:
            pressure_data = {
                'valor': round(sensor_data.get('pressure'), 1),
                'unidad': 'hPa',
                'timestamp': current_timestamp,
                'sensor_type': 'Presión',
                'evaluationType': 'pressure',
                'evalValue': sensor_data.get('pressure')
            }
            self._publish_topic_data('PRESSURE', pressure_data)
    
    def _publish_topic_data(self, topic_key: str, data: Dict[str, Any]):
        """Publica datos en un tópico específico"""
        topic = self.config['TOPICS'][topic_key]
        try:
            payload = json.dumps(data)
            result = self.client.publish(topic, payload, qos=self.config['QOS'])
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                print(f"📤 {topic}: {data['valor']} {data['unidad']}")
            else:
                print(f"❌ Error publicando {topic}: {result.rc}")
        except Exception as e:
            print(f"❌ Error publicando {topic}: {e}")
    
    def publish_buzzer_state(self, state: bool) -> bool:
        """Publica estado del buzzer - formato igual que allin.py"""
        if not self.connected:
            print("⚠️  MQTT no conectado - no se puede enviar estado del buzzer")
            return False
            
        try:
            buzzer_data = {
                'valor': 'ON' if state else 'OFF',
                'unidad': 'Activado' if state else 'Desactivado',
                'timestamp': time.time(),
                'sensor_type': 'Buzzer'
            }
            
            payload = json.dumps(buzzer_data)
            
            result = self.client.publish(
                self.config['TOPICS']['BUZZER'],
                payload,
                qos=self.config['QOS']
            )
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                print(f"🔔 Buzzer: {buzzer_data['valor']}")
                return True
            else:
                print(f"❌ Error publicando estado buzzer: {result.rc}")
                return False
                
        except Exception as e:
            print(f"❌ Error publicando estado buzzer: {e}")
            return False

    def publish_motor_state(self, state: bool) -> bool:
        """Publica estado del motor/ventilador"""
        if not self.connected:
            print("⚠️  MQTT no conectado - no se puede enviar estado del motor")
            return False
            
        try:
            motor_data = {
                'valor': 'ON' if state else 'OFF',
                'unidad': 'Encendido' if state else 'Apagado',
                'timestamp': time.time(),
                'sensor_type': 'Ventilador',
                'evaluationType': 'fan',
                'evalValue': state
            }
            
            payload = json.dumps(motor_data)
            
            # Publicar en ambos tópicos (motor y fan para compatibilidad)
            topics = [self.config['TOPICS']['MOTOR'], self.config['TOPICS']['FAN']]
            
            success = True
            for topic in topics:
                result = self.client.publish(
                    topic,
                    payload,
                    qos=self.config['QOS']
                )
                
                if result.rc == mqtt.MQTT_ERR_SUCCESS:
                    print(f"🔧 Motor publicado en {topic}: {motor_data['valor']}")
                else:
                    print(f"❌ Error publicando estado motor en {topic}: {result.rc}")
                    success = False
                    
            return success
                
        except Exception as e:
            print(f"❌ Error publicando estado motor: {e}")
            return False

    # Sistema simplificado - Ya no maneja datos históricos
    # Los datos se envían únicamente en tiempo real
    
    def publish_led_status(self, led_states: Dict[str, bool]) -> bool:
        """Publica estado de los LEDs de alerta"""
        if not self.connected:
            print("⚠️  MQTT no conectado - no se puede enviar estado de LEDs")
            return False
            
        try:
            # Separar manual_control del resto de los estados de LEDs
            manual_control = led_states.pop('manual_control', False)
            
            led_data = {
                'leds': {
                    'temperature': led_states.get('temperature', False),
                    'humidity': led_states.get('humidity', False),
                    'light': led_states.get('light', False),
                    'air_quality': led_states.get('air_quality', False),
                    'pressure': led_states.get('pressure', False),
                },
                'manual_mode': manual_control,
                'timestamp': time.time(),
                'mode': self.mode
            }
            
            payload = json.dumps(led_data)
            
            result = self.client.publish(
                self.config['TOPICS']['LEDS'],
                payload,
                qos=self.config['QOS']
            )
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                active_leds = sum(led_states.values())
                mode_str = "Manual" if manual_control else "Automático"
                print(f"💡 LEDs ({mode_str}): {active_leds} activos")
                return True
            else:
                print(f"❌ Error publicando estado LEDs: {result.rc}")
                return False
                
        except Exception as e:
            print(f"❌ Error publicando estado LEDs: {e}")
            return False
    
    def publish_sensor_status(self, sensor_states: Dict[str, bool]) -> bool:
        """Publica el estado actual de todos los sensores"""
        if not self.connected:
            print("⚠️  MQTT no conectado - no se puede enviar estado de sensores")
            return False
            
        try:
            for sensor_type, enabled in sensor_states.items():
                topic = f"GRUPO2/status/rasp01/sensors/{sensor_type}"
                payload = json.dumps({
                    'sensor': sensor_type,
                    'enabled': enabled,
                    'timestamp': time.time(),
                    'mode': self.mode
                })
                
                result = self.client.publish(topic, payload, qos=self.config['QOS'])
                if result.rc == mqtt.MQTT_ERR_SUCCESS:
                    print(f"📤 Estado sensor {sensor_type}: {enabled}")
                else:
                    print(f"❌ Error publicando estado {sensor_type}: {result.rc}")
            
            return True
        except Exception as e:
            print(f"❌ Error publicando estados de sensores: {e}")
            return False
    
    def subscribe_to_commands(self, callback: Callable):
        """Suscribe a comandos del frontend"""
        if not self.connected:
            print("⚠️  MQTT no conectado - no se puede suscribir a comandos")
            return False
            
        self.on_message_callback = callback
        
        # Suscribirse a tópicos de comandos
        command_topics = [
            'GRUPO2/commands/rasp01/buzzer',
            'GRUPO2/commands/rasp01/system',
            'GRUPO2/commands/rasp01/sensors/+',  # Para control individual de sensores
            'GRUPO2/commands/rasp01/sensors/enable',  # Para habilitar/deshabilitar sensores
            'GRUPO2/commands/rasp01/actuators/+',  # Para control de actuadores (motor, fan, etc.)
            'GRUPO2/commands/rasp01/leds/+',  # Para comandos de LEDs (control, individual, pattern)
        ]
        
        for topic in command_topics:
            try:
                result = self.client.subscribe(topic)
                if result[0] == mqtt.MQTT_ERR_SUCCESS:
                    print(f"📥 Suscrito a {topic}")
                else:
                    print(f"❌ Error suscribiéndose a {topic}: {result[0]}")
            except Exception as e:
                print(f"❌ Error suscribiéndose a {topic}: {e}")
        
        return True
    
    def _on_connect(self, client, userdata, flags, rc):
        """Callback de conexión"""
        if rc == 0:
            self.connected = True
            print("✅ Conectado a MQTT broker")
        else:
            self.connected = False
            print(f"❌ Error conectando a MQTT (código {rc}): {self._get_connect_error_message(rc)}")
    
    def _on_disconnect(self, client, userdata, rc):
        """Callback de desconexión"""
        self.connected = False
        if rc != 0:
            print(f"⚠️  Desconexión inesperada de MQTT broker (código: {rc})")
        else:
            print("✅ Desconectado correctamente de MQTT broker")
    
    def _on_message(self, client, userdata, msg):
        """Callback de mensaje recibido"""
        if self.on_message_callback:
            try:
                topic = msg.topic
                payload = json.loads(msg.payload.decode())
                print(f"📥 Mensaje MQTT recibido en {topic}: {payload}")
                
                # Log especial para comandos de historial
                if 'history' in topic:
                    print(f"🔍 COMANDO DE HISTORIAL DETECTADO: {topic}")
                    print(f"🔍 Payload del comando: {payload}")
                
                self.on_message_callback(topic, payload)
            except Exception as e:
                print(f"❌ Error procesando mensaje MQTT: {e}")
                print(f"❌ Tópico: {msg.topic}")
                print(f"❌ Payload raw: {msg.payload}")
    
    def _on_publish(self, client, userdata, mid):
        """Callback de publicación exitosa"""
        pass  # Silencioso para evitar spam, pero se puede usar para debug
    
    def _get_connect_error_message(self, rc):
        """Obtiene mensaje de error de conexión"""
        error_messages = {
            1: "Versión de protocolo incorrecta",
            2: "Identificador de cliente inválido",
            3: "Servidor no disponible",
            4: "Usuario o contraseña incorrectos",
            5: "No autorizado"
        }
        return error_messages.get(rc, f"Error desconocido ({rc})")
    
    def publish_alert(self, alert_type: str, sensor: str, message: str, value: float, threshold: float) -> bool:
        """Publica una alerta del sistema"""
        if not self.connected:
            return False
            
        try:
            alert_data = {
                'type': alert_type,  # 'danger' o 'warning'
                'sensor': sensor,
                'message': message,
                'value': value,
                'threshold': threshold,
                'timestamp': time.time(),
                'system': 'SIEPA_Backend'
            }
            
            # Publicar en tópico de alertas
            result = self.client.publish(
                "GRUPO2/alerts/rasp01",
                json.dumps(alert_data),
                qos=1,  # QoS 1 para garantizar entrega
                retain=False
            )
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                print(f"🚨 Alerta publicada: {alert_type} - {message}")
                return True
            else:
                print(f"❌ Error publicando alerta: {result.rc}")
                return False
                
        except Exception as e:
            print(f"❌ Error enviando alerta: {e}")
            return False

    def is_connected(self) -> bool:
        """Verifica si está conectado"""
        return self.connected and self.client and self.client.is_connected() if MQTT_AVAILABLE else False 