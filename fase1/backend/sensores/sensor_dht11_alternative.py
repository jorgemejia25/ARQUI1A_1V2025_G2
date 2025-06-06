#!/usr/bin/env python3
"""
Lectura de sensor DHT11 usando una implementación básica
Esta versión funciona cuando las librerías de Adafruit tienen problemas
"""

import time
import RPi.GPIO as GPIO

# Configuración del pin
DHT_PIN = 4

def read_dht11():
    """
    Lee datos del sensor DHT11 usando protocolo de comunicación directo
    Retorna tuple (humedad, temperatura) o (None, None) si hay error
    """
    # Setup GPIO
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(DHT_PIN, GPIO.OUT)
    GPIO.output(DHT_PIN, GPIO.HIGH)
    
    # Iniciar comunicación
    GPIO.output(DHT_PIN, GPIO.LOW)
    time.sleep(0.018)  # 18ms delay
    GPIO.output(DHT_PIN, GPIO.HIGH)
    time.sleep(0.00002)  # 20-40us delay
    
    GPIO.setup(DHT_PIN, GPIO.IN)
    
    # Leer datos
    data = []
    j = 0
    while j < 40:
        # Esperar inicio de bit
        while GPIO.input(DHT_PIN) == GPIO.LOW:
            continue
        
        # Tiempo de inicio
        start_time = time.time()
        
        # Esperar fin de bit
        while GPIO.input(DHT_PIN) == GPIO.HIGH:
            continue
            
        # Calcular duración
        duration = time.time() - start_time
        
        # Si duración > 0.00005s entonces es '1', sino '0'
        if duration > 0.00005:
            data.append(1)
        else:
            data.append(0)
        j += 1
    
    # Cleanup
    GPIO.cleanup()
    
    # Procesar datos
    if len(data) == 40:
        # Convertir bits a bytes
        humidity_byte1 = data[0:8]
        humidity_byte2 = data[8:16]
        temperature_byte1 = data[16:24]
        temperature_byte2 = data[24:32]
        checksum = data[32:40]
        
        # Convertir a valores decimales
        humidity = sum([humidity_byte1[i] * (2 ** (7-i)) for i in range(8)])
        temperature = sum([temperature_byte1[i] * (2 ** (7-i)) for i in range(8)])
        checksum_value = sum([checksum[i] * (2 ** (7-i)) for i in range(8)])
        
        # Verificar checksum
        if checksum_value == (humidity + temperature) % 256:
            return humidity, temperature
    
    return None, None

def main():
    """Función principal"""
    try:
        print("Leyendo sensor DHT11...")
        humidity, temperature = read_dht11()
        
        if humidity is not None and temperature is not None:
            print(f"Temperature: {temperature}°C, Humidity: {humidity}%")
        else:
            print("Failed to retrieve data from sensor")
            
    except KeyboardInterrupt:
        print("\nPrograma interrumpido por el usuario")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        GPIO.cleanup()

if __name__ == "__main__":
    main() 