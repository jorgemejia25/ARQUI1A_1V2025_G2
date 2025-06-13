#!/usr/bin/env python3
"""
Script de Debug para Comunicación MQTT
Verifica que el backend publique correctamente los datos históricos
"""

import json
import time
import paho.mqtt.client as mqtt
from config.settings import MQTT_CONFIG

class MQTTDebugger:
    def __init__(self):
        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.connected = False
        self.messages_received = []

    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            print("✅ Debug conectado al broker MQTT")
            self.connected = True
            
            # Suscribirse a todos los tópicos relevantes
            topics = [
                "GRUPO2/history/rasp01",
                "GRUPO2/sensores/rasp01/+",
                "GRUPO2/sensores/rasp01",
                "GRUPO2/commands/rasp01/history",
                "GRUPO2/status/rasp01/+"
            ]
            
            for topic in topics:
                client.subscribe(topic)
                print(f"📡 Suscrito a {topic}")
        else:
            print(f"❌ Error conectando: {rc}")

    def on_message(self, topic, message):
        try:
            timestamp = time.strftime('%H:%M:%S')
            data = json.loads(message.toString())
            
            print(f"\n📥 [{timestamp}] Mensaje en {topic}")
            print(f"📊 Datos: {json.dumps(data, indent=2)}")
            
            # Análisis específico para historial
            if topic == "GRUPO2/history/rasp01":
                if data.get('type') == 'historical_data':
                    points = data.get('data', [])
                    print(f"🔍 DATOS HISTÓRICOS RECIBIDOS:")
                    print(f"   • Total puntos: {len(points)}")
                    
                    if points:
                        # Agrupar por sensor
                        sensors = {}
                        for point in points:
                            sensor_type = point.get('sensor_type')
                            if sensor_type not in sensors:
                                sensors[sensor_type] = 0
                            sensors[sensor_type] += 1
                        
                        print(f"   • Sensores presentes:")
                        for sensor, count in sensors.items():
                            print(f"     - {sensor}: {count} puntos")
                        
                        # Mostrar primeros 3 puntos como ejemplo
                        print(f"   • Ejemplos de datos:")
                        for i, point in enumerate(points[:3]):
                            formatted_time = point.get('formatted_time', 'N/A')
                            sensor_type = point.get('sensor_type', 'N/A')
                            value = point.get('value', 'N/A')
                            print(f"     [{i+1}] {formatted_time}: {sensor_type} = {value}")
                    else:
                        print(f"   ⚠️ No hay puntos de datos")
            
            self.messages_received.append({
                'topic': topic,
                'data': data,
                'timestamp': timestamp
            })
            
        except json.JSONDecodeError:
            print(f"⚠️ Mensaje no-JSON en {topic}: {message.toString()}")
        except Exception as e:
            print(f"❌ Error procesando mensaje: {e}")

    def send_history_request(self, sensor_type='all', max_points=30):
        """Envía solicitud de historial"""
        if not self.connected:
            print("❌ No conectado para enviar solicitud")
            return False

        command = {
            'sensor_type': sensor_type,
            'max_points': max_points,
            'hours_back': 24,
            'timestamp': time.time(),
            'source': 'debug_script',
            'include_stats': True
        }
        
        result = self.client.publish("GRUPO2/commands/rasp01/history", json.dumps(command), qos=1)
        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            print(f"📤 Solicitud de historial enviada para {sensor_type} ({max_points} puntos)")
            return True
        else:
            print(f"❌ Error enviando solicitud: {result.rc}")
            return False

    def run_debug_session(self):
        """Ejecuta sesión de debug completa"""
        print("🔍 INICIANDO DEBUG DE COMUNICACIÓN MQTT")
        print("=" * 50)
        
        try:
            # Conectar
            print(f"🔗 Conectando a {MQTT_CONFIG['BROKER_HOST']}:{MQTT_CONFIG['BROKER_PORT']}")
            self.client.connect(MQTT_CONFIG['BROKER_HOST'], MQTT_CONFIG['BROKER_PORT'], 60)
            self.client.loop_start()
            
            # Esperar conexión
            time.sleep(2)
            
            if not self.connected:
                print("❌ No se pudo conectar al broker MQTT")
                return
            
            print("\n📊 ESTADO INICIAL:")
            print(f"   • Mensajes recibidos: {len(self.messages_received)}")
            
            # Test 1: Solicitar historial completo
            print("\n🧪 TEST 1: Historial completo")
            self.send_history_request('all', 20)
            time.sleep(5)
            
            # Test 2: Solicitar historial específico
            print("\n🧪 TEST 2: Historial de temperatura")
            self.send_history_request('temperature', 15)
            time.sleep(5)
            
            # Test 3: Verificar que lleguen datos en tiempo real
            print("\n🧪 TEST 3: Monitoreo de datos en tiempo real (30 segundos)")
            start_time = time.time()
            initial_count = len(self.messages_received)
            
            while time.time() - start_time < 30:
                time.sleep(1)
                current_count = len(self.messages_received)
                if current_count > initial_count:
                    new_messages = current_count - initial_count
                    print(f"📈 {new_messages} nuevos mensajes recibidos")
                    initial_count = current_count
            
            # Resumen final
            print(f"\n📋 RESUMEN DE DEBUG:")
            print(f"   • Total mensajes recibidos: {len(self.messages_received)}")
            
            # Contar por tópico
            topic_counts = {}
            for msg in self.messages_received:
                topic = msg['topic']
                topic_counts[topic] = topic_counts.get(topic, 0) + 1
            
            print(f"   • Mensajes por tópico:")
            for topic, count in topic_counts.items():
                print(f"     - {topic}: {count}")
            
            # Verificar si se recibieron datos históricos
            history_messages = [msg for msg in self.messages_received if msg['topic'] == 'GRUPO2/history/rasp01']
            if history_messages:
                print(f"   ✅ Se recibieron {len(history_messages)} respuestas de historial")
                
                for i, msg in enumerate(history_messages):
                    data = msg['data']
                    if data.get('type') == 'historical_data':
                        points = len(data.get('data', []))
                        print(f"     Respuesta {i+1}: {points} puntos históricos")
            else:
                print(f"   ❌ No se recibieron datos históricos")
                print(f"   💡 Posibles problemas:")
                print(f"     - Backend no está enviando respuestas")
                print(f"     - Tópico incorrecto")
                print(f"     - Formato de datos incorrecto")
            
        except Exception as e:
            print(f"❌ Error en debug: {e}")
        finally:
            self.client.loop_stop()
            self.client.disconnect()
            print("\n✅ Debug finalizado")

def main():
    debugger = MQTTDebugger()
    debugger.run_debug_session()

if __name__ == "__main__":
    main() 