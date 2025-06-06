import Adafruit_DHT

sensor = Adafruit_DHT.DHT11
gpio_pin = 4

humidity, temperature = Adafruit_DHT.read_retry(sensor, gpio_pin)

if humidity is not None and temperature is not None:
    print(f"Temperature: {temperature}°C, Humidity: {humidity}%")
else:
    print("Failed to retrieve data from sensor") 