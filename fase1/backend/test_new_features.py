#!/usr/bin/env python3
"""
Test de las nuevas funcionalidades del Sistema SIEPA
Demostra: LEDs de alerta, sensor BMP280, lux y ppm
Actualizado según allin_w_display.py
"""

import time
import json
from core.sensors.sensor_manager import SensorManager
from core.mqtt.mqtt_manager import MQTTManager

def print_banner():
    """Imprime banner inicial"""
    print("=" * 60)
    print("🌟 SISTEMA SIEPA - TEST DE NUEVAS FUNCIONALIDADES")
    print("=" * 60)
    print("✨ Nuevas características:")
    print("   • LEDs de alerta por sensor")
    print("   • Sensor BMP280 de presión")
    print("   • Unidades: Luz en lux, Calidad aire en ppm")
    print("   • Sistema de alertas automático")
    print("=" * 60)

def test_sensor_readings():
    """Prueba las lecturas de sensores con nuevas unidades"""
    print("\n📊 PROBANDO LECTURAS DE SENSORES...")
    
    # Inicializar en modo testing
    sensor_manager = SensorManager(mode='testing')
    
    for i in range(5):
        print(f"\n--- Lectura {i+1} ---")
        
        # Leer temperatura y humedad
        temp, hum = sensor_manager.read_temperature_humidity()
        print(f"🌡️  Temperatura: {temp}°C")
        print(f"💧 Humedad: {hum}%")
        
        # Leer distancia
        distance = sensor_manager.read_distance()
        print(f"📏 Distancia: {distance} cm")
        
        # Leer luz (nueva funcionalidad con lux)
        hay_luz, lux, voltage = sensor_manager.read_light()
        print(f"💡 Luz: {lux} lux ({'Detectada' if hay_luz else 'No detectada'}) - {voltage}V")
        
        # Leer calidad del aire (nueva funcionalidad con ppm)
        aire_malo, ppm, voltage = sensor_manager.read_air_quality()
        print(f"💨 Calidad aire: {ppm} ppm ({'MALA' if aire_malo else 'BUENA'}) - {voltage}V")
        
        # Leer presión (nuevo sensor BMP280)
        pressure = sensor_manager.read_pressure()
        print(f"🌬️  Presión: {pressure} hPa")
        
        time.sleep(2)

def test_alert_system():
    """Prueba el sistema de alertas y LEDs"""
    print("\n🚨 PROBANDO SISTEMA DE ALERTAS...")
    
    sensor_manager = SensorManager(mode='testing')
    
    # Simular diferentes condiciones de alerta
    test_cases = [
        {"name": "Temperatura alta", "temp": 35, "hum": 50},
        {"name": "Humedad baja", "temp": 25, "hum": 25},
        {"name": "Luz muy intensa", "light_lux": 950},
        {"name": "Aire contaminado", "air_quality_ppm": 500},
        {"name": "Condiciones normales", "temp": 22, "hum": 55, "light_lux": 200, "air_quality_ppm": 300}
    ]
    
    for case in test_cases:
        print(f"\n🧪 Caso: {case['name']}")
        
        # Simular datos de sensores
        sensor_data = {
            'temperature': case.get('temp', 22),
            'humidity': case.get('hum', 55),
            'light_lux': case.get('light_lux', 200),
            'air_quality_ppm': case.get('air_quality_ppm', 300),
            'pressure': 1013.25
        }
        
        # Verificar alertas
        sensor_manager._check_alerts(sensor_data)
        
        print(f"   Datos: {json.dumps(sensor_data, indent=4)}")
        time.sleep(2)

def test_mqtt_integration():
    """Prueba la integración MQTT con nuevos tópicos"""
    print("\n📡 PROBANDO INTEGRACIÓN MQTT...")
    
    # Inicializar managers
    sensor_manager = SensorManager(mode='testing')
    mqtt_manager = MQTTManager(mode='testing')
    
    # Conectar MQTT
    if mqtt_manager.connect():
        print("✅ Conectado a MQTT")
        
        # Realizar lecturas y publicar
        for i in range(3):
            print(f"\n--- Publicación {i+1} ---")
            
            # Leer todos los sensores
            sensor_data = sensor_manager.read_all_sensors()
            
            # Publicar datos completos
            mqtt_manager.publish_sensor_data(sensor_data)
            
            # Publicar buzzer state
            aire_malo = sensor_data.get('air_quality_bad', False)
            mqtt_manager.publish_buzzer_state(aire_malo)
            
            # Publicar estado de LEDs (simulado)
            led_states = {
                'temperature': sensor_data.get('temperature', 0) > 30,
                'humidity': sensor_data.get('humidity', 0) > 80,
                'light': sensor_data.get('light_lux', 0) > 900,
                'air_quality': aire_malo
            }
            mqtt_manager.publish_led_status(led_states)
            
            print(f"📤 Datos publicados: {len(sensor_data)} campos")
            time.sleep(3)
        
        mqtt_manager.disconnect()
        print("✅ Desconectado de MQTT")
    else:
        print("❌ No se pudo conectar a MQTT")

def test_complete_system():
    """Prueba completa del sistema actualizado"""
    print("\n🎯 PRUEBA COMPLETA DEL SISTEMA...")
    
    sensor_manager = SensorManager(mode='testing')
    
    print("\n📋 Estado inicial de sensores:")
    status = sensor_manager.get_sensor_status()
    for sensor, enabled in status.items():
        print(f"   {sensor}: {'✅ Habilitado' if enabled else '❌ Deshabilitado'}")
    
    print("\n🔄 Ejecutando ciclo completo...")
    
    # Simular el ciclo principal como en allin_w_display.py
    for cycle in range(3):
        print(f"\n--- Ciclo {cycle+1} ---")
        
        # Leer todos los sensores
        sensor_data = sensor_manager.read_all_sensors()
        
        # Mostrar información como en allin_w_display.py
        print("----- Lectura actual -----")
        temp = sensor_data.get('temperature', '-')
        hum = sensor_data.get('humidity', '-')
        distance = sensor_data.get('distance', '-')
        lux = sensor_data.get('light_lux', 0)
        ppm = sensor_data.get('air_quality_ppm', 0)
        pressure = sensor_data.get('pressure', 0)
        
        hay_luz = lux > 300
        aire_malo = ppm > 400
        
        print(f"🌡️  Temperatura: {temp} °C")
        print(f"💧 Humedad: {hum} %")
        print(f"📏 Distancia: {distance} cm")
        print(f"💡 Luz: {'SI' if hay_luz else 'NO'} ({lux} lux)")
        print(f"🌬️  Presión: {pressure:.2f} hPa")
        print(f"🫁 Calidad del aire: {'MALA' if aire_malo else 'BUENA'} ({ppm} ppm)")
        print(f"🔔 Buzzer: {'ON' if aire_malo else 'OFF'}")
        print("--------------------------")
        
        time.sleep(2)

def main():
    """Función principal"""
    print_banner()
    
    try:
        # Ejecutar todas las pruebas
        test_sensor_readings()
        test_alert_system()
        test_mqtt_integration()
        test_complete_system()
        
        print("\n" + "=" * 60)
        print("✅ TODAS LAS PRUEBAS COMPLETADAS")
        print("🎉 El sistema está actualizado según allin_w_display.py")
        print("=" * 60)
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Pruebas interrumpidas por el usuario")
    except Exception as e:
        print(f"\n❌ Error durante las pruebas: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main() 