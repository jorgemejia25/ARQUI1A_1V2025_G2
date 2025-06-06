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
        """Publica lecturas individuales por tópico"""
        readings = {
            'TEMPERATURE': sensor_data.get('temperature'),
            'HUMIDITY': sensor_data.get('humidity'),
            'DISTANCE': sensor_data.get('distance'),
            'LIGHT': sensor_data.get('light'),
            'AIR_QUALITY': sensor_data.get('air_quality_bad')
        }
        
        for topic_key, value in readings.items():
            if value is not None:
                topic = self.config['TOPICS'][topic_key]
                try:
                    result = self.client.publish(topic, str(value), qos=self.config['QOS'])
                    if result.rc == mqtt.MQTT_ERR_SUCCESS:
                        print(f"📤 {topic}: {value}")
                    else:
                        print(f"❌ Error publicando {topic}: {result.rc}")
                except Exception as e:
                    print(f"❌ Error publicando {topic}: {e}")
    
    def publish_buzzer_state(self, state: bool) -> bool:
        """Publica estado del buzzer"""
        if not self.connected:
            print("⚠️  MQTT no conectado - no se puede enviar estado del buzzer")
            return False
            
        try:
            payload = json.dumps({
                'state': state, 
                'timestamp': time.time(),
                'mode': self.mode
            })
            
            result = self.client.publish(
                self.config['TOPICS']['BUZZER'],
                payload,
                qos=self.config['QOS']
            )
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                print(f"📤 Estado buzzer publicado: {state}")
                return True
            else:
                print(f"❌ Error publicando estado buzzer: {result.rc}")
                return False
                
        except Exception as e:
            print(f"❌ Error publicando estado buzzer: {e}")
            return False
    
    def publish_sensor_status(self, sensor_states: Dict[str, bool]) -> bool:
        """Publica el estado actual de todos los sensores"""
        if not self.connected:
            print("⚠️  MQTT no conectado - no se puede enviar estado de sensores")
            return False
            
        try:
            for sensor_type, enabled in sensor_states.items():
                topic = f"siepa/status/sensors/{sensor_type}"
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
            'siepa/commands/buzzer',
            'siepa/commands/system',
            'siepa/commands/sensors/+',  # Para control individual de sensores
            'siepa/commands/sensors/enable',  # Para habilitar/deshabilitar sensores
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
                print(f"📥 Mensaje recibido en {topic}: {payload}")
                self.on_message_callback(topic, payload)
            except Exception as e:
                print(f"❌ Error procesando mensaje MQTT: {e}")
    
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
    
    def is_connected(self) -> bool:
        """Verifica si está conectado"""
        return self.connected and self.client and self.client.is_connected() if MQTT_AVAILABLE else False 