#!/usr/bin/env python3
"""
Monitor MQTT - Monitorea mensajes MQTT del sistema SIEPA
Utiliza Mosquitto local para suscribirse a todos los tópicos
"""

import json
import time
import signal
import sys
from datetime import datetime

try:
    import paho.mqtt.client as mqtt
    MQTT_AVAILABLE = True
except ImportError:
    print("❌ paho-mqtt no disponible. Instalando...")
    sys.exit(1)

class SIEPAMQTTMonitor:
    """Monitor de mensajes MQTT del sistema SIEPA"""
    
    def __init__(self, broker_host='localhost', broker_port=1883):
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.client = mqtt.Client()
        self.connected = False
        
        # Configurar callbacks
        self.client.on_connect = self.on_connect
        self.client.on_disconnect = self.on_disconnect
        self.client.on_message = self.on_message
        
        # Configurar manejo de señales
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
    def connect(self):
        """Conecta al broker MQTT"""
        try:
            print(f"🔄 Conectando a Mosquitto en {self.broker_host}:{self.broker_port}...")
            self.client.connect(self.broker_host, self.broker_port, 60)
            self.client.loop_start()
            return True
        except Exception as e:
            print(f"❌ Error conectando: {e}")
            return False
    
    def disconnect(self):
        """Desconecta del broker"""
        if self.connected:
            self.client.loop_stop()
            self.client.disconnect()
    
    def on_connect(self, client, userdata, flags, rc):
        """Callback de conexión"""
        if rc == 0:
            self.connected = True
            print("✅ Conectado a Mosquitto broker")
            
            # Suscribirse a todos los tópicos GRUPO2
            topics = [
                'GRUPO2/sensores/rasp01',
                'GRUPO2/sensores/rasp01/+',  # Wildcard para todos los sensores individuales
                'GRUPO2/actuadores/rasp01/+',  # Wildcard para todos los actuadores
                'GRUPO2/commands/rasp01/+'   # Wildcard para todos los comandos
            ]
            
            for topic in topics:
                client.subscribe(topic)
                print(f"📥 Suscrito a: {topic}")
                
        else:
            print(f"❌ Error de conexión: {rc}")
    
    def on_disconnect(self, client, userdata, rc):
        """Callback de desconexión"""
        self.connected = False
        if rc != 0:
            print("⚠️  Desconexión inesperada")
        else:
            print("✅ Desconectado correctamente")
    
    def on_message(self, client, userdata, msg):
        """Callback de mensaje recibido"""
        try:
            topic = msg.topic
            timestamp = datetime.now().strftime("%H:%M:%S")
            
            # Intentar decodificar como JSON
            try:
                payload = json.loads(msg.payload.decode())
                formatted_payload = json.dumps(payload, indent=2)
            except:
                # Si no es JSON, mostrar como string
                formatted_payload = msg.payload.decode()
            
            # Mostrar el mensaje con formato
            print(f"\n📡 [{timestamp}] {topic}")
            print(f"📦 {formatted_payload}")
            print("-" * 50)
            
        except Exception as e:
            print(f"❌ Error procesando mensaje: {e}")
    
    def signal_handler(self, signum, frame):
        """Maneja señales del sistema"""
        print(f"\n📡 Señal recibida: {signum}")
        self.disconnect()
        sys.exit(0)
    
    def start_monitoring(self):
        """Inicia el monitoreo"""
        print("=" * 60)
        print("📡 MONITOR MQTT - SISTEMA SIEPA")
        print("=" * 60)
        
        if not self.connect():
            return False
        
        print("\n🚀 Monitoreando mensajes MQTT...")
        print("💡 Presiona Ctrl+C para detener\n")
        
        try:
            # Mantener el script corriendo
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 Monitoreo detenido por el usuario")
        finally:
            self.disconnect()
        
        return True

def main():
    broker_host = 'localhost'
    if len(sys.argv) > 1:
        broker_host = sys.argv[1]
    
    monitor = SIEPAMQTTMonitor(broker_host)
    monitor.start_monitoring()

if __name__ == "__main__":
    main() 