from RPLCD.i2c import CharLCD
import time

# Dirección del LCD (ajustar si es 0x3F en lugar de 0x27)
lcd = CharLCD('PCF8574', 0x27, cols=20, rows=4)

# Limpiar y escribir mensaje
lcd.clear()
lcd.write_string("¡Hola desde SIEPA!\n")
lcd.cursor_pos = (1, 0)
lcd.write_string("Sensor conectado")

time.sleep(3)
lcd.clear()
lcd.write_string("Monitoreo iniciado")

# Puedes usar bucles, sensores, etc. aquí

# Al final del programa:
# lcd.clear()
# lcd.close()