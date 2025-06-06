import RPi.GPIO as GPIO
import time

# Pines
TRIG = 23  # GPIO23
ECHO = 24  # GPIO24

# Configurar GPIO
GPIO.setmode(GPIO.BCM)
GPIO.setup(TRIG, GPIO.OUT)
GPIO.setup(ECHO, GPIO.IN)

print("Iniciando medición con HC-SR04...")
time.sleep(2)  # Estabilizar el sensor

try:
    while True:
        # Disparo de 10us
        GPIO.output(TRIG, True)
        time.sleep(0.00001)
        GPIO.output(TRIG, False)

        # Medir tiempo de subida de ECHO
        while GPIO.input(ECHO) == 0:
            inicio = time.time()

        while GPIO.input(ECHO) == 1:
            fin = time.time()

        # Calcular distancia (cm)
        duracion = fin - inicio
        distancia = (duracion * 34300) / 2  # velocidad sonido = 34300 cm/s

        print(f"📏 Distancia: {distancia:.2f} cm")
        time.sleep(1)

except KeyboardInterrupt:
    print("\nMedición interrumpida. Cerrando...")
    GPIO.cleanup()      