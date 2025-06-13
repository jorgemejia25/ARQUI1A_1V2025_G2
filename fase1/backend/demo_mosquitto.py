#!/usr/bin/env python3
"""
Demostración completa del Sistema SIEPA con Mosquitto
Muestra todas las funcionalidades de sensores + MQTT + monitoring
"""

import sys
import os
import time
import subprocess
import threading
import signal

# Agregar el directorio actual al path para imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.system import SIEPASystem

def run_mqtt_monitor():
    """Ejecuta el monitor MQTT en un hilo separado"""
    try:
        subprocess.run([sys.executable, "monitor_mqtt.py"], check=True)
    except subprocess.CalledProcessError:
        print("❌ Error ejecutando monitor MQTT")
    except KeyboardInterrupt:
        pass

def demo_complete_system(mode='testing', duration=60):
    """
    Demostración completa del sistema SIEPA con Mosquitto
    
    Args:
        mode: 'testing' o 'real'
        duration: duración de la demostración en segundos
    """
    print("=" * 70)
    print("🌟 DEMOSTRACIÓN SISTEMA SIEPA + MOSQUITTO")
    print("=" * 70)
    print(f"📋 Modo: {mode.upper()}")
    print(f"⏱️  Duración: {duration} segundos")
    print(f"🦟 Broker: Mosquitto Local (localhost:1883)")
    print("=" * 70)
    
    # Verificar que Mosquitto esté corriendo
    try:
        result = subprocess.run(['mosquitto_pub', '-h', 'localhost', '-t', 'test', '-m', 'test'], 
                               capture_output=True, text=True, timeout=5)
        if result.returncode != 0:
            print("❌ Mosquitto no está corriendo. Iniciando...")
            subprocess.run(['sudo', 'systemctl', 'start', 'mosquitto'], check=True)
            time.sleep(2)
    except Exception as e:
        print(f"⚠️  No se pudo verificar/iniciar Mosquitto: {e}")
    
    print("\n🔧 Componentes del sistema:")
    print("   📊 SensorManager - Genera datos de sensores")
    print("   📡 MQTTManager - Comunica con Mosquitto")
    print("   🖥️  DisplayManager - Simula display LCD")
    print("   🦟 Mosquitto - Broker MQTT local")
    
    # Crear sistema SIEPA
    system = SIEPASystem(mode=mode, enable_mqtt=True)
    
    # Iniciar monitor MQTT en hilo separado
    print("\n🚀 Iniciando monitor MQTT...")
    monitor_thread = threading.Thread(target=run_mqtt_monitor, daemon=True)
    monitor_thread.start()
    time.sleep(2)  # Dar tiempo al monitor para conectarse
    
    # Conectar MQTT
    print("\n🔄 Conectando sistema a Mosquitto...")
    mqtt_connected = system.mqtt_manager.connect()
    
    if not mqtt_connected:
        print("❌ No se pudo conectar a Mosquitto")
        return False
    
    print("✅ Sistema conectado a Mosquitto")
    
    # Configurar suscripción a comandos
    system.mqtt_manager.subscribe_to_commands(lambda topic, payload: 
        print(f"\n📥 Comando recibido: {topic} -> {payload}"))
    
    print(f"\n🚀 Iniciando demostración de {duration} segundos...")
    print("📡 Los datos se están enviando a los siguientes tópicos MQTT:")
    print("   • GRUPO2/sensores/rasp01 (datos completos)")
    print("   • GRUPO2/sensores/rasp01/temperatura")
    print("   • GRUPO2/sensores/rasp01/humedad") 
    print("   • GRUPO2/sensores/rasp01/distancia")
    print("   • GRUPO2/sensores/rasp01/luz")
    print("   • GRUPO2/sensores/rasp01/gas")
    print("   • GRUPO2/actuadores/rasp01/buzzer (cuando aire malo)")
    print("\n💡 Para ver los mensajes en tiempo real, abra otra terminal y ejecute:")
    print("   python3 monitor_mqtt.py")
    print("\n📊 Lecturas del sistema:")
    
    start_time = time.time()
    reading_count = 0
    
    try:
        while time.time() - start_time < duration:
            # Leer sensores
            sensor_data = system.get_sensor_reading()
            reading_count += 1
            
            # Mostrar resumen de la lectura
            print(f"\n📊 Lectura #{reading_count} - {time.strftime('%H:%M:%S')}")
            print(f"   🌡️  {sensor_data.get('temperature', 'N/A')}°C  |  💧 {sensor_data.get('humidity', 'N/A')}%  |  📏 {sensor_data.get('distance', 'N/A')}cm")
            print(f"   💡 {'Luz' if sensor_data.get('light') else 'Oscuro'}  |  💨 {'Aire malo' if sensor_data.get('air_quality_bad') else 'Aire bueno'}")
            
            # Enviar por MQTT
            if system.mqtt_manager.is_connected():
                success = system.mqtt_manager.publish_sensor_data(sensor_data)
                if success:
                    print("   📡 ✅ Enviado por MQTT")
                    
                    # Si hay aire malo, activar buzzer
                    if sensor_data.get('air_quality_bad'):
                        system.mqtt_manager.publish_buzzer_state(True)
                        print("   🔔 ⚠️  Buzzer activado por aire malo")
                else:
                    print("   📡 ❌ Error enviando por MQTT")
            
            time.sleep(5)  # Esperar 5 segundos entre lecturas
            
    except KeyboardInterrupt:
        print("\n🛑 Demostración interrumpida por el usuario")
    
    # Resumen final
    print(f"\n📈 RESUMEN DE LA DEMOSTRACIÓN:")
    print(f"   📊 Total de lecturas enviadas: {reading_count}")
    print(f"   📡 MQTT funcionando con Mosquitto: ✅")
    print(f"   🌡️  Modo de sensores: {mode.upper()}")
    print(f"   ⏱️  Tiempo transcurrido: {int(time.time() - start_time)} segundos")
    
    # Limpiar recursos
    print("\n🧹 Limpiando recursos...")
    if system.mqtt_manager:
        system.mqtt_manager.disconnect()
    
    print("✅ Demostración completada")
    return True

def show_help():
    """Muestra ayuda del script"""
    print("""
🌟 DEMOSTRACIÓN SISTEMA SIEPA + MOSQUITTO

Uso:
    python3 demo_mosquitto.py [modo] [duración]
    
Parámetros:
    modo      - 'testing' (por defecto) o 'real'
    duración  - Segundos de duración (60 por defecto)
    
Ejemplos:
    python3 demo_mosquitto.py                    # Demo 60s en modo testing
    python3 demo_mosquitto.py testing 30         # Demo 30s en modo testing
    python3 demo_mosquitto.py real 120           # Demo 120s en modo real
    
Comandos adicionales:
    python3 demo_mosquitto.py monitor            # Solo monitor MQTT
    python3 demo_mosquitto.py test               # Prueba rápida (10s)
    python3 demo_mosquitto.py help               # Mostrar esta ayuda
    
Requisitos:
    - Mosquitto instalado y corriendo
    - Biblioteca paho-mqtt instalada
    """)

def main():
    if len(sys.argv) > 1:
        arg1 = sys.argv[1].lower()
        
        if arg1 == 'help':
            show_help()
            return
        elif arg1 == 'monitor':
            print("🚀 Iniciando monitor MQTT...")
            run_mqtt_monitor()
            return
        elif arg1 == 'test':
            demo_complete_system('testing', 10)
            return
    
    # Parámetros por defecto
    mode = 'testing'
    duration = 60
    
    # Procesar argumentos
    if len(sys.argv) > 1:
        mode = sys.argv[1]
        if mode not in ['testing', 'real']:
            print("❌ Modo debe ser 'testing' o 'real'")
            show_help()
            sys.exit(1)
    
    if len(sys.argv) > 2:
        try:
            duration = int(sys.argv[2])
        except ValueError:
            print("❌ Duración debe ser un número entero")
            sys.exit(1)
    
    try:
        demo_complete_system(mode, duration)
    except KeyboardInterrupt:
        print("\n🛑 Programa interrumpido")
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 