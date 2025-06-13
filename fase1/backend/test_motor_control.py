#!/usr/bin/env python3
"""
Script de prueba para el control del motor via MQTT
Permite enviar comandos de encendido/apagado del motor desde la línea de comandos
"""

import json
import time
import sys
import paho.mqtt.client as mqtt

# Configuración
BROKER_HOST = 'broker.hivemq.com'
BROKER_PORT = 1883
TOPIC_COMMAND = 'GRUPO2/commands/rasp01/actuators/fan'
TOPIC_STATUS = 'GRUPO2/actuadores/rasp01/fan'

class MotorTestClient:
    def __init__(self):
        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.connected = False
    
    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self.connected = True
            print("✅ Conectado al broker MQTT")
            # Suscribirse al estado del motor
            client.subscribe(TOPIC_STATUS)
            print(f"📥 Suscrito a {TOPIC_STATUS}")
        else:
            print(f"❌ Error conectando: {rc}")
    
    def on_message(self, client, userdata, msg):
        try:
            topic = msg.topic
            payload = json.loads(msg.payload.decode())
            print(f"📨 Mensaje recibido en {topic}:")
            print(f"   Estado: {payload.get('valor', 'Desconocido')}")
            print(f"   Timestamp: {payload.get('timestamp', 'N/A')}")
        except Exception as e:
            print(f"❌ Error procesando mensaje: {e}")
    
    def connect(self):
        try:
            print(f"🔄 Conectando a {BROKER_HOST}:{BROKER_PORT}...")
            self.client.connect(BROKER_HOST, BROKER_PORT, 60)
            self.client.loop_start()
            
            # Esperar conexión
            timeout = 10
            while not self.connected and timeout > 0:
                time.sleep(0.1)
                timeout -= 0.1
            
            return self.connected
        except Exception as e:
            print(f"❌ Error conectando: {e}")
            return False
    
    def send_motor_command(self, enabled: bool):
        if not self.connected:
            print("❌ No conectado al broker")
            return False
        
        payload = {
            'enabled': enabled,
            'timestamp': time.time(),
            'source': 'test_script'
        }
        
        try:
            result = self.client.publish(TOPIC_COMMAND, json.dumps(payload))
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                print(f"✅ Comando enviado: Motor {'ON' if enabled else 'OFF'}")
                return True
            else:
                print(f"❌ Error enviando comando: {result.rc}")
                return False
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    
    def disconnect(self):
        self.client.loop_stop()
        self.client.disconnect()

def main():
    print("🔧 Test de Control de Motor SIEPA")
    print("=" * 40)
    
    client = MotorTestClient()
    
    if not client.connect():
        print("❌ No se pudo conectar al broker")
        return
    
    try:
        while True:
            print("\nComandos disponibles:")
            print("1. Encender motor")
            print("2. Apagar motor")
            print("3. Salir")
            
            choice = input("\nSeleccione una opción (1-3): ").strip()
            
            if choice == '1':
                client.send_motor_command(True)
            elif choice == '2':
                client.send_motor_command(False)
            elif choice == '3':
                print("👋 Saliendo...")
                break
            else:
                print("❌ Opción inválida")
            
            # Esperar un poco para ver respuesta
            time.sleep(1)
    
    except KeyboardInterrupt:
        print("\n👋 Interrupción del usuario")
    
    finally:
        client.disconnect()

if __name__ == "__main__":
    main() 