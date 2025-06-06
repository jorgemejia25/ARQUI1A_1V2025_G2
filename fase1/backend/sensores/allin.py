import time
import board
import adafruit_dht
import RPi.GPIO as GPIO

# ---------------- GPIO CONFIG ----------------
GPIO.setmode(GPIO.BCM)

# DHT11
dht_sensor = adafruit_dht.DHT11(board.D4)

# HC-SR04
TRIG = 23
ECHO = 24
GPIO.setup(TRIG, GPIO.OUT)
GPIO.setup(ECHO, GPIO.IN)

# LDR
LDR_PIN = 17
GPIO.setup(LDR_PIN, GPIO.IN)

# MQ135
MQ135_PIN = 27
GPIO.setup(MQ135_PIN, GPIO.IN)

# Buzzer
BUZZER_PIN = 22
GPIO.setup(BUZZER_PIN, GPIO.OUT)
GPIO.output(BUZZER_PIN, GPIO.LOW)

# ---------------- FUNCIONES ----------------

def leer_dht11():
    try:
        temp = dht_sensor.temperature
        hum = dht_sensor.humidity
        return temp, hum
    except:
        return None, None

def leer_ultrasonico():
    GPIO.output(TRIG, True)
    time.sleep(0.00001)
    GPIO.output(TRIG, False)

    while GPIO.input(ECHO) == 0:
        start = time.time()

    while GPIO.input(ECHO) == 1:
        end = time.time()

    duracion = end - start
    distancia = (duracion * 34300) / 2
    return round(distancia, 2)

def leer_ldr():
    return GPIO.input(LDR_PIN) == GPIO.LOW  # True si hay luz

def leer_mq135():
    return GPIO.input(MQ135_PIN) == GPIO.LOW  # True si aire malo

def controlar_buzzer(estado):
    GPIO.output(BUZZER_PIN, GPIO.HIGH if estado else GPIO.LOW)

# ---------------- LOOP PRINCIPAL ----------------

print("Sistema SIEPA iniciado. Leyendo sensores...\n")

try:
    while True:
        temp, hum = leer_dht11()
        distancia = leer_ultrasonico()
        hay_luz = leer_ldr()
        aire_malo = leer_mq135()

        # Buzzer (Ejemplo: suena si aire malo)
        controlar_buzzer(1 if aire_malo else 0)

        # Mostrar en consola
        print("----- Lectura actual -----")
        print(f"🌡️  Temperatura: {temp or '-'} °C")
        print(f"💧 Humedad: {hum or '-'} %")
        print(f"📏 Distancia: {distancia} cm")
        print(f"💡 Luz: {'SI' if hay_luz else 'NO'}")
        print(f"🫁 Calidad del aire: {'MALA' if aire_malo else 'BUENA'}")
        print(f"🔔 Buzzer: {'ON' if aire_malo else 'OFF'}")
        print("--------------------------\n")

        time.sleep(2)

except KeyboardInterrupt:
    print("\nFinalizando programa...")
    GPIO.cleanup()
