import RPi.GPIO as GPIO
import time

buzzer_pin = 18  # GPIO18 (pin físico 12)

GPIO.setmode(GPIO.BCM)
GPIO.setup(buzzer_pin, GPIO.OUT)

print("Activando buzzer MD1212...")

try:
    while True:
        GPIO.output(buzzer_pin, GPIO.HIGH)
        print("🔊 Buzzer ON")
        time.sleep(1)

        GPIO.output(buzzer_pin, GPIO.LOW)
        print("🔇 Buzzer OFF")
        time.sleep(1)

except KeyboardInterrupt:
    print("\nPrograma interrumpido. Limpiando...")
    GPIO.cleanup()