#!/usr/bin/env python3
"""
Script de diagnóstico avanzado para el sensor BMP180
Incluye verificaciones detalladas de I2C y hardware
"""

import time
import sys
import subprocess

print("🔍 DIAGNÓSTICO AVANZADO BMP180 - SISTEMA SIEPA")
print("=" * 60)

# 1. Verificar estado de I2C en el sistema
print("\n1. 🔧 Verificando configuración I2C del sistema...")
try:
    # Verificar si i2c-tools está instalado
    result = subprocess.run(['which', 'i2cdetect'], capture_output=True, text=True)
    if result.returncode != 0:
        print("⚠️ i2c-tools no está instalado")
        print("💡 Instalar con: sudo apt-get install i2c-tools")
    else:
        print("✅ i2c-tools disponible")
        
        # Ejecutar i2cdetect para ver dispositivos conectados
        print("\n   📡 Escaneando bus I2C con i2cdetect...")
        result = subprocess.run(['i2cdetect', '-y', '1'], capture_output=True, text=True)
        if result.returncode == 0:
            print("   Resultado de i2cdetect -y 1:")
            for line in result.stdout.split('\n'):
                if line.strip():
                    print(f"   {line}")
        else:
            print(f"   ❌ Error ejecutando i2cdetect: {result.stderr}")
    
except Exception as e:
    print(f"⚠️ Error verificando i2c-tools: {e}")

# 2. Verificar módulos del kernel
print("\n2. 🧰 Verificando módulos I2C del kernel...")
try:
    result = subprocess.run(['lsmod'], capture_output=True, text=True)
    i2c_modules = []
    for line in result.stdout.split('\n'):
        if 'i2c' in line.lower():
            i2c_modules.append(line.strip())
    
    if i2c_modules:
        print("✅ Módulos I2C cargados:")
        for module in i2c_modules:
            print(f"   {module}")
    else:
        print("❌ No se encontraron módulos I2C cargados")
        print("💡 Verificar que I2C esté habilitado en raspi-config")
        
except Exception as e:
    print(f"⚠️ Error verificando módulos: {e}")

# 3. Verificar librerías Python
print("\n3. 📦 Verificando librerías Python...")
try:
    import board
    import busio
    print("✅ Librerías board y busio disponibles")
except ImportError as e:
    print(f"❌ Error importando librerías base: {e}")
    sys.exit(1)

try:
    import bmp180
    print("✅ Librería bmp180 disponible")
except ImportError as e:
    print(f"❌ Error importando bmp180: {e}")
    print("💡 Instalar con: pip install bmp180")
    sys.exit(1)

# 4. Verificar conexión I2C básica
print("\n4. 🔌 Verificando bus I2C con Python...")
try:
    i2c = busio.I2C(board.SCL, board.SDA)
    print("✅ Bus I2C inicializado correctamente")
    print(f"   SCL pin: {board.SCL}")
    print(f"   SDA pin: {board.SDA}")
except Exception as e:
    print(f"❌ Error inicializando bus I2C: {e}")
    print("💡 Posibles causas:")
    print("   - I2C no habilitado en raspi-config")
    print("   - Problema con los pines GPIO")
    print("   - Conflicto con otro proceso usando I2C")
    sys.exit(1)

# 5. Escanear dispositivos I2C con Python
print("\n5. 🔍 Escaneando dispositivos I2C con Python...")

def scan_i2c_detailed():
    found_devices = []
    print("   Direcciones probadas:")
    
    for address in range(0x08, 0x78):
        try:
            i2c.try_lock()
            try:
                i2c.writeto(address, b'')
                found_devices.append(address)
                device_name = get_device_name(address)
                print(f"   0x{address:02X}: ✅ {device_name}")
            except OSError:
                # Solo mostrar algunas direcciones importantes que no respondieron
                if address in [0x27, 0x76, 0x77]:
                    print(f"   0x{address:02X}: ❌ Sin respuesta")
            finally:
                i2c.unlock()
        except Exception as e:
            print(f"   0x{address:02X}: ⚠️ Error: {e}")
    
    return found_devices

def get_device_name(address):
    device_names = {
        0x27: "LCD (PCF8574)",
        0x48: "ADS1115 o similar",
        0x68: "RTC DS1307 o MPU6050",
        0x76: "BMP280/BME280",
        0x77: "BMP180/BMP085/BMP280",
        0x3C: "OLED Display",
        0x3D: "OLED Display (alt)",
    }
    return device_names.get(address, "Dispositivo desconocido")

devices = scan_i2c_detailed()
print(f"\n   📊 Resumen: {len(devices)} dispositivos encontrados")

# 6. Prueba específica del BMP180
print("\n6. 🧪 Prueba específica del sensor BMP180...")

bmp180_found = False
bmp180_sensor = None

if 0x77 not in devices:
    print("❌ BMP180 no detectado en dirección 0x77")
    print("💡 El BMP180 típicamente usa la dirección 0x77")
    print("   Verificar:")
    print("   - Conexiones: VCC (3.3V), GND, SDA (GPIO2), SCL (GPIO3)")
    print("   - Soldaduras del módulo")
    print("   - Cables y conectores")
else:
    print("✅ Dispositivo detectado en 0x77 (posible BMP180)")
    
    try:
        print("   🔍 Inicializando BMP180...")
        bmp180_sensor = bmp180.BMP180(i2c)
        
        print("   📊 Intentando primera lectura...")
        pressure = bmp180_sensor.pressure
        temperature = bmp180_sensor.temperature
        
        print(f"   ✅ BMP180 funcionando correctamente!")
        print(f"      Presión: {pressure:.2f} hPa")
        print(f"      Temperatura: {temperature:.2f} °C")
        
        bmp180_found = True
        
    except OSError as e:
        if e.errno == 5:
            print(f"   ❌ Error I/O (errno 5): {e}")
            print("   💡 Posibles causas:")
            print("      - Conexiones flojas o intermitentes")
            print("      - Alimentación insuficiente o inestable")
            print("      - Interferencia electromagnética")
            print("      - Sensor dañado")
            print("      - Resistencias pull-up faltantes (4.7kΩ en SDA y SCL)")
        else:
            print(f"   ❌ Error OSError: {e}")
            
    except Exception as e:
        print(f"   ❌ Error inesperado: {e}")

# 7. Prueba de estabilidad (si el sensor funciona)
if bmp180_found:
    print("\n7. 📈 Prueba de estabilidad (10 lecturas)...")
    errores = 0
    lecturas_exitosas = 0
    
    for i in range(10):
        try:
            pressure = bmp180_sensor.pressure
            temperature = bmp180_sensor.temperature
            print(f"   {i+1:2d}. ✅ P: {pressure:7.2f} hPa, T: {temperature:5.2f} °C")
            lecturas_exitosas += 1
            time.sleep(0.5)
        except Exception as e:
            print(f"   {i+1:2d}. ❌ Error: {e}")
            errores += 1
            time.sleep(0.5)
    
    print(f"\n   📊 Resultados: {lecturas_exitosas}/10 lecturas exitosas, {errores} errores")
    
    if errores > 0:
        print(f"   ⚠️ Se detectaron {errores} errores - conexión inestable")
        print("   💡 Revisar conexiones físicas y alimentación")
    else:
        print("   ✅ Sensor estable y funcionando correctamente")

# 8. Resultado final y recomendaciones
print("\n" + "=" * 60)
if bmp180_found:
    print("🎉 BMP180 FUNCIONANDO")
    print("\n💡 Para uso estable:")
    print("   - Verificar que todas las conexiones estén firmes")
    print("   - Usar cables cortos y de buena calidad")
    print("   - Asegurar alimentación estable de 3.3V")
    print("   - Considerar agregar resistencias pull-up de 4.7kΩ")
else:
    print("❌ BMP180 NO FUNCIONA")
    print("\n🔧 Lista de verificación:")
    print("   □ I2C habilitado en raspi-config")
    print("   □ Conexión VCC a 3.3V (NO 5V)")
    print("   □ Conexión GND")
    print("   □ SDA conectado a GPIO2")
    print("   □ SCL conectado a GPIO3")
    print("   □ Soldaduras del módulo BMP180")
    print("   □ Cables en buen estado")
    print("   □ Resistencias pull-up 4.7kΩ (opcional pero recomendado)")

print(f"\n🏁 Diagnóstico completado") 