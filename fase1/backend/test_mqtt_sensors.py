#!/usr/bin/env python3
"""
Script de prueba para verificar que los datos de sensores
se envíen correctamente por MQTT en ambos modos (testing y real)
"""

import sys
import os
import time
import json

# Agregar el directorio actual al path para imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.system import SIEPASystem

def test_sensor_mqtt_integration(mode='testing', duration=30):
    """
    Prueba la integración de sensores con MQTT
    
    Args:
        mode: 'testing' o 'real'
        duration: duración de la prueba en segundos
    """
    print("=" * 60)
    print(f"🧪 PRUEBA DE INTEGRACIÓN SENSORES-MQTT")
    print(f"📋 Modo: {mode.upper()}")
    print(f"⏱️  Duración: {duration} segundos")
    print("=" * 60)
    
    # Crear sistema con MQTT habilitado
    system = SIEPASystem(mode=mode, enable_mqtt=True)
    
    print("\n🔍 Verificando componentes del sistema:")
    print(f"   📊 SensorManager: {'✅' if system.sensor_manager else '❌'}")
    print(f"   🖥️  DisplayManager: {'✅' if system.display_manager else '❌'}")
    print(f"   📡 MQTTManager: {'✅' if system.mqtt_manager else '❌'}")
    
    if not system.mqtt_manager:
        print("❌ MQTT Manager no disponible")
        return False
    
    # Intentar conectar MQTT
    print("\n🔄 Conectando a broker MQTT...")
    mqtt_connected = system.mqtt_manager.connect()
    
    if not mqtt_connected:
        print("⚠️  No se pudo conectar a MQTT broker")
        print("💡 El sistema funcionará sin MQTT")
    else:
        print("✅ Conectado a MQTT broker")
    
    print(f"\n🚀 Iniciando prueba de {duration} segundos...")
    print("📤 Datos que se estarán enviando por MQTT:")
    
    start_time = time.time()
    readings_count = 0
    
    try:
        while time.time() - start_time < duration:
            # Obtener lectura de sensores
            sensor_data = system.get_sensor_reading()
            readings_count += 1
            
            print(f"\n📊 Lectura #{readings_count}:")
            print(f"   🌡️  Temperatura: {sensor_data.get('temperature', 'N/A')}°C")
            print(f"   💧 Humedad: {sensor_data.get('humidity', 'N/A')}%")
            print(f"   📏 Distancia: {sensor_data.get('distance', 'N/A')} cm")
            print(f"   💡 Luz detectada: {'Sí' if sensor_data.get('light') else 'No'}")
            print(f"   💨 Aire malo: {'Sí' if sensor_data.get('air_quality_bad') else 'No'}")
            
            # Verificar si se envió por MQTT
            if system.mqtt_manager and system.mqtt_manager.is_connected():
                success = system.mqtt_manager.publish_sensor_data(sensor_data)
                print(f"   📡 Enviado por MQTT: {'✅' if success else '❌'}")
                
                # Mostrar tópicos donde se publican los datos
                print("   📤 Tópicos MQTT:")
                print(f"      • siepa/sensors (datos completos)")
                print(f"      • siepa/sensors/temperature: {sensor_data.get('temperature')}")
                print(f"      • siepa/sensors/humidity: {sensor_data.get('humidity')}")
                print(f"      • siepa/sensors/distance: {sensor_data.get('distance')}")
                print(f"      • siepa/sensors/light: {sensor_data.get('light')}")
                print(f"      • siepa/sensors/air_quality: {sensor_data.get('air_quality_bad')}")
                
                # Si hay aire malo, enviar estado del buzzer
                if sensor_data.get('air_quality_bad'):
                    buzzer_success = system.mqtt_manager.publish_buzzer_state(True)
                    print(f"      • siepa/actuators/buzzer: True {'✅' if buzzer_success else '❌'}")
            else:
                print("   📡 MQTT no conectado - datos no enviados")
            
            time.sleep(3)  # Esperar 3 segundos entre lecturas
            
    except KeyboardInterrupt:
        print("\n🛑 Prueba interrumpida por el usuario")
    
    print(f"\n📈 RESUMEN DE LA PRUEBA:")
    print(f"   📊 Total de lecturas: {readings_count}")
    print(f"   📡 MQTT conectado: {'✅' if system.mqtt_manager and system.mqtt_manager.is_connected() else '❌'}")
    print(f"   🌡️  Modo de sensores: {mode.upper()}")
    
    # Limpiar recursos
    if system.mqtt_manager:
        system.mqtt_manager.disconnect()
    
    return True

def main():
    if len(sys.argv) > 1:
        mode = sys.argv[1]
        if mode not in ['testing', 'real']:
            print("❌ Modo debe ser 'testing' o 'real'")
            sys.exit(1)
    else:
        mode = 'testing'
    
    duration = 30  # 30 segundos por defecto
    if len(sys.argv) > 2:
        try:
            duration = int(sys.argv[2])
        except ValueError:
            print("❌ Duración debe ser un número entero")
            sys.exit(1)
    
    try:
        test_sensor_mqtt_integration(mode, duration)
    except Exception as e:
        print(f"❌ Error durante la prueba: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 