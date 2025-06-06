import RPi.GPIO as GPIO
import time

# Configuración del pin digital donde está conectado D0 del sensor
sensor_pin = 17  # GPIO17 (pin físico 11)

# Inicializar GPIO
GPIO.setmode(GPIO.BCM)
GPIO.setup(sensor_pin, GPIO.IN)

print("Iniciando lectura del sensor MD-FR060 (D0 - digital)...")
print("Presiona Ctrl+C para salir.\n")

try:
    while True:
        estado = GPIO.input(sensor_pin)

        if estado == GPIO.LOW:
            print("💡 LUZ DETECTADA (GPIO17 = 1, D0 en HIGH)")
        else:
            print("🌑 OSCURIDAD DETECTADA (GPIO17 = 0, D0 en LOW)")

        time.sleep(1)

except KeyboardInterrupt:
    print("\nPrograma finalizado por el usuario.")
    GPIO.cleanup()