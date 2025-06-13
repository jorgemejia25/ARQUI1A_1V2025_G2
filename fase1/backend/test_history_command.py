#!/usr/bin/env python3
"""
Script de prueba para comandos de historial MQTT
"""

import json
import time
import paho.mqtt.client as mqtt
from config.settings import MQTT_CONFIG

def on_connect(client, userdata, flags, rc):
    """Callback de conexión"""
    if rc == 0:
        print("✅ Conectado al broker MQTT")
        # Suscribirse a respuestas de historial
        client.subscribe("siepa/history")
        print("📥 Suscrito a siepa/history")
    else:
        print(f"❌ Error conectando: {rc}")

def on_message(client, userdata, msg):
    """Callback de mensaje recibido"""
    try:
        topic = msg.topic
        payload = json.loads(msg.payload.decode())
        
        if topic == "siepa/history":
            print(f"\n📈 DATOS HISTÓRICOS RECIBIDOS:")
            print(f"   Tipo: {payload.get('type')}")
            print(f"   Total puntos: {payload.get('total_points', 0)}")
            print(f"   Timestamp: {payload.get('timestamp')}")
            
            data = payload.get('data', [])
            if data:
                print(f"   Primeros 3 puntos:")
                for i, point in enumerate(data[:3]):
                    print(f"     {i+1}. Sensor: {point.get('sensor_type')}, Valor: {point.get('value')}, Tiempo: {point.get('formatted_time')}")
                if len(data) > 3:
                    print(f"     ... y {len(data)-3} puntos más")
            else:
                print("   No hay datos disponibles")
    except Exception as e:
        print(f"❌ Error procesando mensaje: {e}")

def send_history_command(client, sensor_type='all', max_points=30):
    """Envía comando para solicitar historial"""
    command_payload = {
        'sensor_type': sensor_type,
        'max_points': max_points,
        'timestamp': time.time(),
        'source': 'test_script'
    }
    
    message = json.dumps(command_payload)
    result = client.publish("siepa/commands/history", message, qos=1)
    
    if result.rc == mqtt.MQTT_ERR_SUCCESS:
        print(f"📤 Comando enviado: Solicitar historial de '{sensor_type}' (max {max_points} puntos)")
        return True
    else:
        print(f"❌ Error enviando comando: {result.rc}")
        return False

def main():
    print("🧪 PRUEBA DE COMANDOS DE HISTORIAL MQTT")
    print("=" * 50)
    
    # Configurar cliente MQTT
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message
    
    # Conectar al broker
    try:
        print(f"🔗 Conectando a {MQTT_CONFIG['BROKER_HOST']}:{MQTT_CONFIG['BROKER_PORT']}")
        client.connect(MQTT_CONFIG['BROKER_HOST'], MQTT_CONFIG['BROKER_PORT'], 60)
        client.loop_start()
        
        # Esperar conexión
        time.sleep(2)
        
        # Pruebas
        print("\n🔍 PRUEBA 1: Solicitar historial completo")
        send_history_command(client, 'all', 20)
        time.sleep(3)
        
        print("\n🔍 PRUEBA 2: Solicitar historial de temperatura")
        send_history_command(client, 'temperature', 15)
        time.sleep(3)
        
        print("\n🔍 PRUEBA 3: Solicitar historial de calidad del aire")
        send_history_command(client, 'air_quality', 10)
        time.sleep(3)
        
        print("\n🔍 PRUEBA 4: Solicitar historial de luz")
        send_history_command(client, 'light', 25)
        time.sleep(3)
        
        print("\n✅ Pruebas completadas. Presiona Ctrl+C para salir.")
        
        # Mantener activo
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 Finalizando pruebas...")
            
    except Exception as e:
        print(f"❌ Error en pruebas: {e}")
    finally:
        client.loop_stop()
        client.disconnect()
        print("✅ Desconectado del broker MQTT")

if __name__ == "__main__":
    main() 