#!/usr/bin/env python3
"""
Test de Integración Completo - Sistema SIEPA Optimizado
Verifica el funcionamiento completo de almacenamiento y recuperación de historial
"""

import json
import time
import threading
from typing import Dict, Any

# Importar componentes del sistema
from core.history.history_manager import HistoryManager, HistoryPoint
from core.mqtt.mqtt_manager import MQTTManager
from core.sensors.sensor_manager import SensorManager
from core.system import SIEPASystem

def test_history_manager():
    """Test del gestor de historial"""
    print("🧪 TESTING: History Manager")
    print("=" * 40)
    
    # Inicializar gestor
    history_manager = HistoryManager(db_path="test_history.db")
    
    # Test 1: Agregar datos individuales
    print("📊 Test 1: Agregando datos individuales...")
    sensors = ['temperature', 'humidity', 'light', 'air_quality']
    
    for i in range(20):
        for sensor in sensors:
            value = 20 + i + (hash(sensor) % 10)  # Valores pseudo-aleatorios
            metadata = {'unit': 'test', 'iteration': i}
            history_manager.add_sensor_data(sensor, value, metadata)
        time.sleep(0.1)  # Pequeña pausa
    
    print(f"✅ Agregados datos individuales")
    
    # Test 2: Consultar datos
    print("📊 Test 2: Consultando datos...")
    
    all_data = history_manager.get_recent_data(max_points=50)
    print(f"   • Total puntos: {len(all_data)}")
    
    temp_data = history_manager.get_recent_data(sensor_type='temperature', max_points=10)
    print(f"   • Temperatura: {len(temp_data)} puntos")
    
    # Test 3: Estadísticas
    print("📊 Test 3: Generando estadísticas...")
    stats = history_manager.get_sensor_stats()
    print(f"   • Sensores con estadísticas: {len(stats)}")
    for sensor, stat in stats.items():
        print(f"     - {sensor}: {stat['count']} puntos, promedio {stat['avg_value']}")
    
    # Test 4: Datos en lote
    print("📊 Test 4: Agregando datos en lote...")
    batch_points = []
    current_time = time.time()
    
    for i in range(10):
        for sensor in sensors:
            point = HistoryPoint(
                sensor_type=sensor,
                value=30 + i,
                timestamp=current_time + i,
                metadata={'batch': True, 'test_id': i}
            )
            batch_points.append(point)
    
    history_manager.add_batch_sensor_data(batch_points)
    print(f"✅ Agregados {len(batch_points)} puntos en lote")
    
    # Test 5: Verificar datos finales
    final_data = history_manager.get_recent_data(max_points=100)
    print(f"📊 Total final: {len(final_data)} puntos")
    
    # Limpiar
    history_manager.close()
    print("✅ History Manager test completado\n")
    
    return len(final_data) > 0

def test_mqtt_history_communication():
    """Test de comunicación MQTT para historial"""
    print("🧪 TESTING: MQTT History Communication")
    print("=" * 40)
    
    received_messages = []
    
    def message_callback(topic: str, payload: Dict[str, Any]):
        received_messages.append({
            'topic': topic,
            'payload': payload,
            'timestamp': time.time()
        })
        print(f"📥 Mensaje recibido en {topic}: {len(str(payload))} caracteres")
    
    try:
        # Inicializar MQTT
        mqtt_manager = MQTTManager(mode='testing')
        connected = mqtt_manager.connect()
        
        if not connected:
            print("❌ No se pudo conectar a MQTT")
            return False
        
        # Suscribirse a comandos
        mqtt_manager.subscribe_to_commands(message_callback)
        time.sleep(2)  # Esperar suscripción
        
        # Test 1: Enviar comando de historial
        print("📤 Test 1: Enviando comando de historial...")
        history_command = {
            'sensor_type': 'all',
            'max_points': 20,
            'hours_back': 1,
            'include_stats': True,
            'source': 'integration_test'
        }
        
        mqtt_manager.client.publish(
            'siepa/commands/history',
            json.dumps(history_command),
            qos=1
        )
        
        # Esperar respuesta
        time.sleep(3)
        
        # Test 2: Publicar datos históricos simulados
        print("📤 Test 2: Publicando datos históricos simulados...")
        sample_history = [
            {
                'sensor_type': 'temperature',
                'value': 25.5,
                'timestamp': time.time() - 300,
                'formatted_time': '10:00:00'
            },
            {
                'sensor_type': 'humidity',
                'value': 60.2,
                'timestamp': time.time() - 240,
                'formatted_time': '10:01:00'
            }
        ]
        
        success = mqtt_manager.publish_historical_data(sample_history)
        print(f"📊 Publicación exitosa: {success}")
        
        time.sleep(2)
        
        # Verificar mensajes recibidos
        print(f"📊 Mensajes recibidos: {len(received_messages)}")
        for msg in received_messages:
            print(f"   • {msg['topic']}: {time.strftime('%H:%M:%S', time.localtime(msg['timestamp']))}")
        
        mqtt_manager.disconnect()
        print("✅ MQTT History Communication test completado\n")
        
        return len(received_messages) > 0
        
    except Exception as e:
        print(f"❌ Error en test MQTT: {e}")
        return False

def test_system_integration():
    """Test de integración completa del sistema"""
    print("🧪 TESTING: System Integration")
    print("=" * 40)
    
    try:
        # Inicializar sistema en modo testing
        system = SIEPASystem(mode='testing', enable_mqtt=True)
        
        # Generar algunos datos de sensores simulados
        print("📊 Generando datos de sensores simulados...")
        
        for i in range(5):
            # Simular lectura de sensores
            sensor_data = {
                'temperature': 20 + i,
                'humidity': 50 + i * 2,
                'light_lux': 300 + i * 10,
                'air_quality_ppm': 400 + i,
                'pressure': 1013 + i * 0.1,
                'distance': 100 - i * 5,
                'motor_state': i % 2 == 0,
                'buzzer_state': False
            }
            
            # Almacenar en historial
            system._store_sensor_data_optimized(sensor_data)
            
            print(f"   • Iteración {i+1}: datos almacenados")
            time.sleep(0.5)
        
        # Forzar flush del buffer
        system._flush_sensor_buffer()
        
        # Verificar datos en historia
        recent_data = system.history_manager.get_recent_data(max_points=50)
        print(f"📊 Datos en historial: {len(recent_data)} puntos")
        
        # Simular comando de historial vía MQTT
        if system.mqtt_manager and system.mqtt_manager.is_connected():
            print("📤 Simulando comando de historial...")
            
            test_command = {
                'sensor_type': 'all',
                'max_points': 30,
                'hours_back': 1,
                'include_stats': True,
                'source': 'system_integration_test'
            }
            
            # Simular recepción del comando
            system._handle_mqtt_command('siepa/commands/history', test_command)
            
            time.sleep(2)
        
        # Obtener estadísticas finales
        stats = system.history_manager.get_sensor_stats()
        print(f"📈 Estadísticas finales:")
        for sensor, stat in stats.items():
            print(f"   • {sensor}: {stat['count']} puntos")
        
        # Limpiar sistema
        system._shutdown()
        print("✅ System Integration test completado\n")
        
        return len(recent_data) > 0
        
    except Exception as e:
        print(f"❌ Error en test de integración: {e}")
        return False

def main():
    """Ejecutar todos los tests"""
    print("🚀 INICIANDO TESTS DE INTEGRACIÓN")
    print("🔧 Sistema SIEPA Optimizado para Raspberry Pi")
    print("=" * 60)
    print()
    
    results = {
        'history_manager': False,
        'mqtt_communication': False,
        'system_integration': False
    }
    
    # Ejecutar tests
    try:
        results['history_manager'] = test_history_manager()
        results['mqtt_communication'] = test_mqtt_history_communication()
        results['system_integration'] = test_system_integration()
        
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrumpidos por el usuario")
    except Exception as e:
        print(f"\n❌ Error general en tests: {e}")
    
    # Resumen de resultados
    print("📋 RESUMEN DE TESTS")
    print("=" * 30)
    
    total_tests = len(results)
    passed_tests = sum(results.values())
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nTests pasados: {passed_tests}/{total_tests}")
    
    if passed_tests == total_tests:
        print("🎉 ¡TODOS LOS TESTS PASARON!")
        print("✅ El sistema está listo para producción en Raspberry Pi")
    else:
        print("⚠️ Algunos tests fallaron")
        print("🔧 Revisar la configuración y dependencias")
    
    return passed_tests == total_tests

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1) 