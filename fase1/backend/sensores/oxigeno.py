import RPi.GPIO as GPIO
import time

# Configurar pin donde se conecta D0 del MQ135
sensor_pin = 17  # GPIO17

GPIO.setmode(GPIO.BCM)
GPIO.setup(sensor_pin, GPIO.IN)

print("Iniciando lectura del sensor MQ135 (D0 - digital)...\n")

try:
    while True:
        estado = GPIO.input(sensor_pin)

        if estado == GPIO.LOW:
            print("⚠️  Aire contaminado (D0 = 0)")
        else:
            print("✅ Aire limpio (D0 = 1)")

        time.sleep(1)

except KeyboardInterrupt:
    print("\nLectura interrumpida.")
    GPIO.cleanup()