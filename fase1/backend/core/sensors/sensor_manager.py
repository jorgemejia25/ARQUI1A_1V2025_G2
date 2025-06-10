"""
Gestor de sensores del Sistema SIEPA
Abstrae la lógica de lectura de sensores reales y simulados
"""

import time
import random
from typing import Dict, Any, Optional, Tuple
from config import SENSOR_CONFIG, SIMULATION_RANGES, ALERT_CONFIG, SENSOR_THRESHOLDS

class SensorManager:
    """Gestor principal de sensores"""
    
    def __init__(self, mode: str = 'testing'):
        self.mode = mode
        self.config = SENSOR_CONFIG
        self.simulation_ranges = SIMULATION_RANGES
        self.alert_config = ALERT_CONFIG
        self.thresholds = SENSOR_THRESHOLDS
        
        # Estado de habilitación de sensores
        self.sensors_enabled = {
            'temperature': True,
            'humidity': True,
            'distance': True,
            'light': True,
            'air_quality': True,
            'pressure': True,  # Nuevo sensor BMP280
        }
        
        if mode == 'real':
            self._init_real_sensors()
        
    def _init_real_sensors(self):
        """Inicializa los sensores físicos"""
        try:
            import board
            import busio
            import digitalio
            import adafruit_dht
            import adafruit_bmp280
            import RPi.GPIO as GPIO
            from adafruit_mcp3xxx.mcp3008 import MCP3008
            from adafruit_mcp3xxx.analog_in import AnalogIn
            
            # Configurar GPIO
            GPIO.setmode(GPIO.BCM)
            
            # DHT11
            self.dht_sensor = adafruit_dht.DHT11(board.D4)
            
            # HC-SR04
            GPIO.setup(self.config['ULTRASONIC_TRIG_PIN'], GPIO.OUT)
            GPIO.setup(self.config['ULTRASONIC_ECHO_PIN'], GPIO.IN)
            
            # Buzzer
            GPIO.setup(self.config['BUZZER_PIN'], GPIO.OUT, initial=GPIO.HIGH)  # Buzzer apagado al inicio
            
            # LEDs de Alerta
            GPIO.setup(self.config['LED_TEMP'], GPIO.OUT, initial=GPIO.LOW)
            GPIO.setup(self.config['LED_HUM'], GPIO.OUT, initial=GPIO.LOW)
            GPIO.setup(self.config['LED_LUZ'], GPIO.OUT, initial=GPIO.LOW)
            GPIO.setup(self.config['LED_AIRE'], GPIO.OUT, initial=GPIO.LOW)
            
            # I2C para BMP280
            i2c = busio.I2C(board.SCL, board.SDA)
            self.bmp280 = adafruit_bmp280.Adafruit_BMP280_I2C(i2c, address=self.config['BMP280_I2C_ADDRESS'])
            self.bmp280.sea_level_pressure = self.config['BMP280_SEA_LEVEL_PRESSURE']
            
            # MCP3008 CONFIG
            spi = busio.SPI(clock=board.SCK, MISO=board.MISO, MOSI=board.MOSI)
            cs = digitalio.DigitalInOut(board.D8)  # CE0 (GPIO8)
            mcp = MCP3008(spi, cs)
            
            # Canales analógicos
            self.canal_ldr = AnalogIn(mcp, self.config['LDR_CHANNEL'])      # CH0 = A0 del LDR
            self.canal_mq135 = AnalogIn(mcp, self.config['MQ135_CHANNEL'])  # CH1 = A0 del MQ135
            
            self.GPIO = GPIO
            
        except ImportError:
            raise ImportError("Librerías de Raspberry Pi no disponibles. Use modo 'testing'")
    
    def read_temperature_humidity(self) -> Tuple[Optional[float], Optional[float]]:
        """Lee temperatura y humedad"""
        if self.mode == 'real':
            return self._read_dht11_real()
        else:
            return self._read_dht11_simulated()
    
    def read_distance(self) -> float:
        """Lee distancia ultrasónica"""
        if self.mode == 'real':
            return self._read_ultrasonic_real()
        else:
            return self._read_ultrasonic_simulated()
    
    def read_light(self) -> Tuple[bool, int, float]:
        """Lee sensor de luz - retorna tuple (hay_luz, lux, voltaje)"""
        if self.mode == 'real':
            return self._read_ldr_real()
        else:
            return self._read_ldr_simulated()
    
    def read_air_quality(self) -> Tuple[bool, int, float]:
        """Lee calidad del aire - retorna tuple (aire_malo, ppm, voltaje)"""
        if self.mode == 'real':
            return self._read_mq135_real()
        else:
            return self._read_mq135_simulated()
    
    def read_pressure(self) -> float:
        """Lee presión atmosférica del BMP280"""
        if self.mode == 'real':
            return self._read_bmp280_real()
        else:
            return self._read_bmp280_simulated()
    
    def control_buzzer(self, state: bool):
        """Controla el buzzer"""
        if self.mode == 'real':
            self._control_buzzer_real(state)
        # En modo simulado no hace nada visible
    
    def activate_alert_led(self, led_type: str, duration: float = None):
        """Activa un LED de alerta específico"""
        if self.mode == 'real':
            self._activate_alert_led_real(led_type, duration)
    
    def read_all_sensors(self) -> Dict[str, Any]:
        """Lee todos los sensores y retorna un diccionario"""
        data = {'timestamp': time.time()}
        
        # Solo leer sensores habilitados
        if self.is_sensor_enabled('temperature') or self.is_sensor_enabled('humidity'):
            temp, hum = self.read_temperature_humidity()
            if self.is_sensor_enabled('temperature'):
                data['temperature'] = temp
            if self.is_sensor_enabled('humidity'):
                data['humidity'] = hum
        
        if self.is_sensor_enabled('distance'):
            data['distance'] = self.read_distance()
            
        if self.is_sensor_enabled('light'):
            hay_luz, lux, voltaje_ldr = self.read_light()
            data['light'] = hay_luz
            data['light_lux'] = lux
            data['light_voltage'] = voltaje_ldr
            
        if self.is_sensor_enabled('air_quality'):
            aire_malo, ppm, voltaje_mq135 = self.read_air_quality()
            data['air_quality_bad'] = aire_malo
            data['air_quality_ppm'] = ppm
            data['air_quality_voltage'] = voltaje_mq135
            
        if self.is_sensor_enabled('pressure'):
            data['pressure'] = self.read_pressure()
        
        # Verificar alertas y activar LEDs
        self._check_alerts(data)
        
        return data
    
    def _check_alerts(self, data: Dict[str, Any]):
        """Verifica las condiciones de alerta y activa LEDs correspondientes"""
        # Alerta de temperatura
        temp = data.get('temperature')
        if temp is not None:
            if temp < self.alert_config['TEMPERATURE']['min'] or temp > self.alert_config['TEMPERATURE']['max']:
                self.activate_alert_led('temperature')
        
        # Alerta de humedad
        hum = data.get('humidity')
        if hum is not None:
            if hum < self.alert_config['HUMIDITY']['min'] or hum > self.alert_config['HUMIDITY']['max']:
                self.activate_alert_led('humidity')
        
        # Alerta de luz
        lux = data.get('light_lux')
        if lux is not None:
            if lux > self.alert_config['LIGHT']['max']:
                self.activate_alert_led('light')
        
        # Alerta de calidad del aire
        ppm = data.get('air_quality_ppm')
        if ppm is not None:
            if ppm > self.alert_config['AIR_QUALITY']['max']:
                self.activate_alert_led('air_quality')
    
    def enable_sensor(self, sensor_type: str, enabled: bool = True):
        """Habilita o deshabilita un sensor específico"""
        if sensor_type in self.sensors_enabled:
            self.sensors_enabled[sensor_type] = enabled
            print(f"📊 Sensor {sensor_type}: {'HABILITADO' if enabled else 'DESHABILITADO'}")
            return True
        else:
            print(f"❌ Tipo de sensor desconocido: {sensor_type}")
            return False
    
    def get_sensor_status(self) -> Dict[str, bool]:
        """Retorna el estado de habilitación de todos los sensores"""
        return self.sensors_enabled.copy()
    
    def is_sensor_enabled(self, sensor_type: str) -> bool:
        """Verifica si un sensor está habilitado"""
        return self.sensors_enabled.get(sensor_type, False)
    
    # ============== MÉTODOS PARA SENSORES REALES ==============
    
    def _read_dht11_real(self) -> Tuple[Optional[float], Optional[float]]:
        """Lee DHT11 real"""
        try:
            temp = self.dht_sensor.temperature
            hum = self.dht_sensor.humidity
            return temp, hum
        except:
            return None, None
    
    def _read_ultrasonic_real(self) -> float:
        """Lee sensor ultrasónico real"""
        self.GPIO.output(self.config['ULTRASONIC_TRIG_PIN'], True)
        time.sleep(0.00001)
        self.GPIO.output(self.config['ULTRASONIC_TRIG_PIN'], False)

        while self.GPIO.input(self.config['ULTRASONIC_ECHO_PIN']) == 0:
            start = time.time()

        while self.GPIO.input(self.config['ULTRASONIC_ECHO_PIN']) == 1:
            end = time.time()

        duration = end - start
        distance = (duration * 34300) / 2
        return round(distance, 2)
    
    def _read_ldr_real(self) -> Tuple[bool, int, float]:
        """Lee LDR real - retorna (hay_luz, lux, voltaje)"""
        voltaje_ldr = self.canal_ldr.voltage  # Voltaje 0 - 3.3V
        lux = round((voltaje_ldr / 3.3) * 1000)  # Conversión a lux como en allin_w_display.py
        hay_luz = lux > self.thresholds['LIGHT']['DETECTION_THRESHOLD']  # 300 lux
        return hay_luz, lux, round(voltaje_ldr, 2)
    
    def _read_mq135_real(self) -> Tuple[bool, int, float]:
        """Lee MQ135 real - retorna (aire_malo, ppm, voltaje)"""
        voltaje_mq135 = self.canal_mq135.voltage  # Voltaje 0 - 3.3V
        ppm = round((voltaje_mq135 / 3.3) * 1000)  # Conversión a ppm como en allin_w_display.py
        aire_malo = ppm > self.thresholds['AIR_QUALITY']['BAD_AIR_THRESHOLD']  # 400 ppm
        return aire_malo, ppm, round(voltaje_mq135, 2)
    
    def _control_buzzer_real(self, state: bool):
        """Controla buzzer real"""
        # Buzzer activado cuando hay aire malo (estado True)
        self.GPIO.output(self.config['BUZZER_PIN'], self.GPIO.LOW if state else self.GPIO.HIGH)
    
    def _activate_alert_led_real(self, led_type: str, duration: float = None):
        """Activa un LED de alerta específico"""
        if duration is None:
            duration = self.alert_config['LED_ALERT_DURATION']
        
        led_pin_map = {
            'temperature': self.config['LED_TEMP'],
            'humidity': self.config['LED_HUM'],
            'light': self.config['LED_LUZ'],
            'air_quality': self.config['LED_AIRE'],
        }
        
        if led_type in led_pin_map:
            pin = led_pin_map[led_type]
            # Activar LED
            self.GPIO.output(pin, self.GPIO.HIGH)
            print(f"🚨 LED {led_type} activado por {duration} segundos")
            
            # Programar apagado (esto se puede mejorar con threading si es necesario)
            import threading
            def turn_off_led():
                time.sleep(duration)
                self.GPIO.output(pin, self.GPIO.LOW)
                print(f"💡 LED {led_type} desactivado")
            
            thread = threading.Thread(target=turn_off_led)
            thread.daemon = True
            thread.start()
    
    def _read_bmp280_real(self) -> float:
        """Lee presión atmosférica del BMP280"""
        return round(self.bmp280.pressure, 2)
    
    # ============== MÉTODOS PARA SENSORES SIMULADOS ==============
    
    def _read_dht11_simulated(self) -> Tuple[float, float]:
        """Simula DHT11"""
        temp_range = self.simulation_ranges['TEMPERATURE']
        hum_range = self.simulation_ranges['HUMIDITY']
        
        temp = round(random.uniform(temp_range['min'], temp_range['max']), 1)
        hum = round(random.uniform(hum_range['min'], hum_range['max']), 1)
        
        return temp, hum
    
    def _read_ultrasonic_simulated(self) -> float:
        """Simula sensor ultrasónico"""
        dist_range = self.simulation_ranges['DISTANCE']
        return round(random.uniform(dist_range['min'], dist_range['max']), 2)
    
    def _read_ldr_simulated(self) -> Tuple[bool, int, float]:
        """Simula LDR con lux y voltaje"""
        lux = round(random.uniform(self.simulation_ranges['LIGHT']['min'], self.simulation_ranges['LIGHT']['max']))
        voltaje_ldr = round((lux / 1000) * 3.3, 2)  # Conversión inversa para simular voltaje
        hay_luz = lux > self.thresholds['LIGHT']['DETECTION_THRESHOLD']
        return hay_luz, lux, voltaje_ldr
    
    def _read_mq135_simulated(self) -> Tuple[bool, int, float]:
        """Simula MQ135 con ppm y voltaje"""
        ppm = round(random.uniform(self.simulation_ranges['AIR_QUALITY']['min'], self.simulation_ranges['AIR_QUALITY']['max']))
        voltaje_mq135 = round((ppm / 1000) * 3.3, 2)  # Conversión inversa para simular voltaje
        aire_malo = ppm > self.thresholds['AIR_QUALITY']['BAD_AIR_THRESHOLD']
        return aire_malo, ppm, voltaje_mq135

    def _read_bmp280_simulated(self) -> float:
        """Simula presión atmosférica del BMP280"""
        return round(random.uniform(self.simulation_ranges['PRESSURE']['min'], self.simulation_ranges['PRESSURE']['max']), 2)

    def cleanup(self):
        """Limpia recursos del sensor manager"""
        if self.mode == 'real':
            try:
                self.GPIO.cleanup()
                print("🧹 Recursos GPIO limpiados")
            except:
                pass 