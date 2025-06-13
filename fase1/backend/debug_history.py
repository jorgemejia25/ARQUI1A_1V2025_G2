#!/usr/bin/env python3
"""
Script de debug para verificar el historial del sistema SIEPA
"""

import json
import time
import paho.mqtt.client as mqtt
from config.settings import MQTT_CONFIG

class HistoryDebugger:
    def __init__(self):
        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.connected = False
        self.history_received = False

    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            print("✅ Conectado al broker MQTT")
            self.connected = True
            # Suscribirse a historial y a todos los tópicos de sensores
            client.subscribe("siepa/history")
            client.subscribe("siepa/sensors/+")
            client.subscribe("siepa/sensors")
            print("📥 Suscrito a tópicos de sensores e historial")
        else:
            print(f"❌ Error conectando: {rc}")

    def on_message(self, client, userdata, msg):
        try:
            topic = msg.topic
            
            if topic == "siepa/history":
                print(f"\n🎉 HISTORIAL RECIBIDO!")
                payload = json.loads(msg.payload.decode())
                print(f"   Tipo: {payload.get('type')}")
                print(f"   Total puntos: {payload.get('total_points', 0)}")
                
                data = payload.get('data', [])
                if data:
                    print(f"   Ejemplo de datos:")
                    for i, point in enumerate(data[:3]):
                        print(f"     {i+1}. {point.get('sensor_type')}: {point.get('value')} ({point.get('formatted_time')})")
                    if len(data) > 3:
                        print(f"     ... y {len(data)-3} más")
                else:
                    print("   ⚠️  No hay datos en la respuesta")
                
                self.history_received = True
            else:
                # Datos de sensores en tiempo real
                try:
                    payload = json.loads(msg.payload.decode())
                    print(f"📊 Sensor {topic}: {payload}")
                except:
                    print(f"📊 Sensor {topic}: {msg.payload.decode()}")
                    
        except Exception as e:
            print(f"❌ Error procesando mensaje: {e}")

    def test_history_request(self):
        if not self.connected:
            print("❌ No conectado a MQTT")
            return False

        print("\n🔍 Enviando comando de historial...")
        command = {
            'sensor_type': 'all',
            'max_points': 20,
            'timestamp': time.time(),
            'source': 'debug_script'
        }
        
        result = self.client.publish("siepa/commands/history", json.dumps(command), qos=1)
        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            print("📤 Comando enviado exitosamente")
            return True
        else:
            print(f"❌ Error enviando comando: {result.rc}")
            return False

    def run_debug(self):
        print("🔍 DEBUGGER DE HISTORIAL SIEPA")
        print("=" * 40)
        
        try:
            print(f"🔗 Conectando a {MQTT_CONFIG['BROKER_HOST']}:{MQTT_CONFIG['BROKER_PORT']}")
            self.client.connect(MQTT_CONFIG['BROKER_HOST'], MQTT_CONFIG['BROKER_PORT'], 60)
            self.client.loop_start()
            
            # Esperar conexión
            timeout = 10
            while not self.connected and timeout > 0:
                time.sleep(0.5)
                timeout -= 0.5
            
            if not self.connected:
                print("❌ Timeout conectando a MQTT")
                return
            
            print("\n⏰ Esperando datos de sensores por 10 segundos...")
            time.sleep(10)
            
            # Probar comando de historial
            if self.test_history_request():
                print("\n⏰ Esperando respuesta de historial por 10 segundos...")
                
                timeout = 10
                while not self.history_received and timeout > 0:
                    time.sleep(0.5)
                    timeout -= 0.5
                
                if self.history_received:
                    print("\n✅ ¡Historial recibido correctamente!")
                else:
                    print("\n❌ No se recibió respuesta de historial")
                    print("   Posibles causas:")
                    print("   - El sistema SIEPA no está ejecutándose")
                    print("   - El sistema no está generando datos históricos")
                    print("   - Problema con el comando MQTT")
            
            print("\n🔍 Presiona Ctrl+C para salir...")
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\n🛑 Finalizando debug...")
                
        except Exception as e:
            print(f"❌ Error en debug: {e}")
        finally:
            self.client.loop_stop()
            self.client.disconnect()
            print("✅ Desconectado")

if __name__ == "__main__":
    debugger = HistoryDebugger()
    debugger.run_debug() 