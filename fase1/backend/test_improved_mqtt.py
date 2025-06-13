#!/usr/bin/env python3
"""
Script de prueba para verificar el funcionamiento mejorado del sistema SIEPA
con el frontend actualizado. Envía datos de prueba con el nuevo formato.
"""

import time
import json
from core.system import SiepaSystem
from core.mqtt.mqtt_manager import MQTTManager

def test_improved_system():
    """Prueba el sistema SIEPA mejorado con el frontend"""
    print("🧪 Iniciando prueba del sistema SIEPA mejorado...")
    
    # Inicializar sistema en modo testing
    system = SiepaSystem(mode='testing')
    
    # Conectar MQTT
    if not system.mqtt_manager.connect():
        print("❌ Error conectando a MQTT")
        return
    
    print("✅ Sistema iniciado correctamente")
    print("📊 Iniciando envío de datos de prueba...")
    
    try:
        for i in range(20):  # Enviar 20 muestras de datos
            print(f"\n📤 Enviando muestra {i + 1}/20...")
            
            # Leer todos los sensores
            sensor_data = system.sensor_manager.read_all_sensors()
            
            # Mostrar datos leídos
            print("🔍 Datos leídos:")
            for key, value in sensor_data.items():
                if key != 'timestamp':
                    unit = {
                        'temperature': '°C',
                        'humidity': '%',
                        'distance': 'cm',
                        'light_lux': 'lux',
                        'light_voltage': 'V',
                        'air_quality_ppm': 'ppm',
                        'air_quality_voltage': 'V',
                        'pressure': 'hPa'
                    }.get(key, '')
                    print(f"   • {key}: {value} {unit}")
            
            # Publicar datos con el formato mejorado
            if system.mqtt_manager.publish_sensor_data(sensor_data):
                print("✅ Datos publicados exitosamente")
            else:
                print("❌ Error publicando datos")
            
            # Obtener estado de LEDs y buzzer
            led_states = {
                'temperature': sensor_data.get('temperature', 20) > 30,
                'humidity': sensor_data.get('humidity', 50) > 80,
                'light': sensor_data.get('light_lux', 100) > 900,
                'air_quality': sensor_data.get('air_quality_ppm', 100) > 400
            }
            
            # Publicar estado de LEDs si alguno está activo
            if any(led_states.values()):
                system.mqtt_manager.publish_led_status(led_states)
                print(f"💡 LEDs activos: {[k for k, v in led_states.items() if v]}")
            
            # Controlar buzzer según calidad del aire
            buzzer_state = sensor_data.get('air_quality_ppm', 100) > 400
            if buzzer_state != getattr(test_improved_system, 'last_buzzer_state', False):
                system.mqtt_manager.publish_buzzer_state(buzzer_state)
                test_improved_system.last_buzzer_state = buzzer_state
                print(f"🔔 Buzzer: {'ON' if buzzer_state else 'OFF'}")
            
            # Pausa entre envíos
            time.sleep(3)
            
    except KeyboardInterrupt:
        print("\n\n⏹️ Prueba interrumpida por el usuario")
    except Exception as e:
        print(f"\n❌ Error durante la prueba: {e}")
    finally:
        print("\n🔌 Desconectando sistema...")
        system.cleanup()
        print("✅ Sistema desconectado correctamente")

def test_individual_sensors():
    """Prueba sensores individuales"""
    print("\n🔬 Probando sensores individuales...")
    
    system = SiepaSystem(mode='testing')
    if not system.mqtt_manager.connect():
        print("❌ Error conectando a MQTT")
        return
    
    sensors_to_test = ['temperature', 'humidity', 'distance', 'light', 'air_quality', 'pressure']
    
    for sensor in sensors_to_test:
        print(f"\n📊 Probando sensor: {sensor}")
        
        # Habilitar solo este sensor
        for s in sensors_to_test:
            system.sensor_manager.enable_sensor(s, s == sensor)
        
        # Leer y enviar datos
        sensor_data = system.sensor_manager.read_all_sensors()
        
        if system.mqtt_manager.publish_sensor_data(sensor_data):
            print(f"✅ Sensor {sensor} enviado correctamente")
        else:
            print(f"❌ Error enviando sensor {sensor}")
        
        time.sleep(2)
    
    # Rehabilitar todos los sensores
    for sensor in sensors_to_test:
        system.sensor_manager.enable_sensor(sensor, True)
    
    system.cleanup()

def validate_data_format():
    """Valida que el formato de datos sea compatible con el frontend"""
    print("\n🔍 Validando formato de datos...")
    
    system = SiepaSystem(mode='testing')
    sensor_data = system.sensor_manager.read_all_sensors()
    
    required_fields = [
        'temperature', 'humidity', 'distance', 
        'light_lux', 'light_voltage', 
        'air_quality_ppm', 'air_quality_voltage', 
        'pressure'
    ]
    
    print("📋 Campos esperados por el frontend:")
    for field in required_fields:
        if field in sensor_data:
            print(f"   ✅ {field}: {sensor_data[field]}")
        else:
            print(f"   ❌ {field}: FALTANTE")
    
    print(f"\n📊 Datos completos generados: {len(sensor_data)} campos")
    print(f"📄 JSON ejemplo:")
    print(json.dumps(sensor_data, indent=2, default=str))

if __name__ == "__main__":
    print("🌟 === PRUEBA DEL SISTEMA SIEPA MEJORADO ===")
    print("Seleccione una opción:")
    print("1. Prueba completa del sistema (20 muestras)")
    print("2. Prueba de sensores individuales")
    print("3. Validar formato de datos")
    print("4. Ejecutar todas las pruebas")
    
    try:
        choice = input("\nIngrese su opción (1-4): ").strip()
        
        if choice == "1":
            test_improved_system()
        elif choice == "2":
            test_individual_sensors()
        elif choice == "3":
            validate_data_format()
        elif choice == "4":
            validate_data_format()
            test_individual_sensors()
            test_improved_system()
        else:
            print("❌ Opción no válida")
            
    except KeyboardInterrupt:
        print("\n\n👋 Programa terminado por el usuario")
    except Exception as e:
        print(f"\n❌ Error: {e}") 