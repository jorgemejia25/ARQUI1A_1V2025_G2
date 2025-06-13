#!/usr/bin/env python3
"""
Script de prueba para verificar el control de LEDs y buzzer
"""

import time
import json
from core.system import SIEPASystem
from config.settings import SENSOR_CONFIG

def test_led_control():
    """Prueba el control manual de LEDs paso a paso"""
    print("🧪 === TEST DE CONTROL DE LEDs ===")
    
    # Inicializar sistema en modo testing con MQTT
    print("\n1. Inicializando sistema SIEPA...")
    system = SIEPASystem(mode='testing', enable_mqtt=True)
    
    if not system.mqtt_manager or not system.mqtt_manager.is_connected():
        print("❌ MQTT no conectado - no se pueden hacer pruebas")
        return
    
    print("✅ Sistema inicializado con MQTT")
    
    # Test 1: Cambiar a modo manual
    print("\n2. Cambiando a modo manual...")
    manual_command = {
        'mode': 'manual',
        'timestamp': time.time(),
        'source': 'test_script'
    }
    
    system._handle_mqtt_command('GRUPO2/commands/rasp01/leds/control', manual_command)
    time.sleep(0.5)
    
    print(f"   - Modo manual activo: {system.sensor_manager.is_manual_led_control()}")
    print(f"   - Estado de LEDs: {system.sensor_manager.get_led_states()}")
    print(f"   - Estado de buzzer: {system.sensor_manager.get_buzzer_state()}")
    
    # Test 2: Controlar LED individual
    print("\n3. Encendiendo LED de temperatura...")
    individual_command = {
        'led': 'temperature',
        'action': 'on',
        'timestamp': time.time(),
        'source': 'test_script'
    }
    
    system._handle_mqtt_command('GRUPO2/commands/rasp01/leds/individual', individual_command)
    time.sleep(0.5)
    
    print(f"   - Estado de LEDs después: {system.sensor_manager.get_led_states()}")
    
    # Test 3: Toggle LED
    print("\n4. Haciendo toggle del LED de humedad...")
    toggle_command = {
        'led': 'humidity',
        'action': 'toggle',
        'timestamp': time.time(),
        'source': 'test_script'
    }
    
    system._handle_mqtt_command('GRUPO2/commands/rasp01/leds/individual', toggle_command)
    time.sleep(0.5)
    
    print(f"   - Estado de LEDs después del toggle: {system.sensor_manager.get_led_states()}")
    
    # Test 4: Patrón all_on
    print("\n5. Aplicando patrón 'all_on'...")
    pattern_command = {
        'pattern': 'all_on',
        'timestamp': time.time(),
        'source': 'test_script'
    }
    
    system._handle_mqtt_command('GRUPO2/commands/rasp01/leds/pattern', pattern_command)
    time.sleep(0.5)
    
    print(f"   - Estado de LEDs después del patrón: {system.sensor_manager.get_led_states()}")
    
    # Test 5: Control de buzzer
    print("\n6. Encendiendo buzzer...")
    buzzer_command = {
        'enabled': True,
        'timestamp': time.time(),
        'source': 'test_script'
    }
    
    system._handle_mqtt_command('GRUPO2/commands/rasp01/buzzer', buzzer_command)
    time.sleep(0.5)
    
    print(f"   - Estado de buzzer: {system.sensor_manager.get_buzzer_state()}")
    print(f"   - Modo manual buzzer: {system.sensor_manager.is_manual_buzzer_control()}")
    
    # Test 6: Volver a automático
    print("\n7. Volviendo a modo automático...")
    auto_command = {
        'mode': 'automatic',
        'timestamp': time.time(),
        'source': 'test_script'
    }
    
    system._handle_mqtt_command('GRUPO2/commands/rasp01/leds/control', auto_command)
    time.sleep(0.5)
    
    print(f"   - Modo manual activo: {system.sensor_manager.is_manual_led_control()}")
    print(f"   - Modo manual buzzer: {system.sensor_manager.is_manual_buzzer_control()}")
    
    # Test 7: Intentar control manual sin efecto (debería ser ignorado)
    print("\n8. Intentando control individual en modo automático (debería ser ignorado)...")
    ignored_command = {
        'led': 'light',
        'action': 'on',
        'timestamp': time.time(),
        'source': 'test_script'
    }
    
    # Este comando debería cambiar automáticamente a modo manual
    system._handle_mqtt_command('GRUPO2/commands/rasp01/leds/individual', ignored_command)
    time.sleep(0.5)
    
    print(f"   - Modo se cambió a manual: {system.sensor_manager.is_manual_led_control()}")
    print(f"   - Estado final de LEDs: {system.sensor_manager.get_led_states()}")
    
    print("\n✅ === PRUEBAS COMPLETADAS ===")
    
    # Limpiar
    system._shutdown()

def test_mqtt_messages():
    """Prueba el formato de mensajes MQTT"""
    print("\n🧪 === TEST DE MENSAJES MQTT ===")
    
    system = SIEPASystem(mode='testing', enable_mqtt=True)
    
    if not system.mqtt_manager or not system.mqtt_manager.is_connected():
        print("❌ MQTT no conectado")
        return
    
    # Probar formato de mensaje de estado de LEDs
    led_states = {
        'temperature': True,
        'humidity': False,
        'light': True,
        'air_quality': False,
        'manual_control': True
    }
    
    print(f"Publicando estado de LEDs: {led_states}")
    success = system.mqtt_manager.publish_led_status(led_states)
    print(f"Éxito: {success}")
    
    time.sleep(1)
    system._shutdown()

if __name__ == "__main__":
    try:
        test_led_control()
        print("\n" + "="*50)
        test_mqtt_messages()
    except KeyboardInterrupt:
        print("\n🛑 Prueba interrumpida por el usuario")
    except Exception as e:
        print(f"\n❌ Error en las pruebas: {e}")
        import traceback
        traceback.print_exc() 