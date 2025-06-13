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
            try:
                self.dht_sensor = adafruit_dht.DHT11(board.D4)
                print("✅ Sensor DHT11 inicializado correctamente")
            except (ValueError, OSError, RuntimeError) as e:
                self.dht_sensor = None
                self.enable_sensor('temperature', False)
                self.enable_sensor('humidity', False)
                print(f"⚠️  Sensor DHT11 no encontrado en pin D4")
                print(f"   Error: {e}")
                print("   Los sensores de temperatura y humedad serán deshabilitados")
            
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
            
            # Motor pin (igual que allin_w_display.py)
            GPIO.setup(self.config['MOTOR_PIN'], GPIO.OUT, initial=GPIO.LOW)
            print(f"✅ Motor configurado en pin {self.config['MOTOR_PIN']}")
            
            # I2C para BMP280
            try:
                i2c = busio.I2C(board.SCL, board.SDA)
                self.bmp280 = adafruit_bmp280.Adafruit_BMP280_I2C(i2c, address=self.config['BMP280_I2C_ADDRESS'])
                self.bmp280.sea_level_pressure = self.config['BMP280_SEA_LEVEL_PRESSURE']
                print("✅ Sensor BMP280 inicializado correctamente")
                self.bmp280_disponible = True
            except (ValueError, OSError) as e:
                self.bmp280 = None
                self.bmp280_disponible = False
                self.enable_sensor('pressure', False)
                print(f"⚠️ Error al inicializar BMP280: {e}")
                print("   El sensor de presión será deshabilitado")
            
            # MCP3008 CONFIG
            try:
                spi = busio.SPI(clock=board.SCK, MISO=board.MISO, MOSI=board.MOSI)
                cs = digitalio.DigitalInOut(board.D8)  # CE0 (GPIO8)
                mcp = MCP3008(spi, cs)
                
                # Canales analógicos (igual que allin_w_display.py)
                self.canal_ldr = AnalogIn(mcp, 0)      # CH0 = A0 del LDR
                self.canal_mq135 = AnalogIn(mcp, 1)    # CH1 = A0 del MQ135
                print("✅ Sensor MCP3008 inicializado correctamente")
            except (ValueError, OSError, RuntimeError) as e:
                self.canal_ldr = None
                self.canal_mq135 = None
                self.enable_sensor('light', False)
                self.enable_sensor('air_quality', False)
                print(f"⚠️  Sensor MCP3008 no encontrado")
                print(f"   Error: {e}")
                print("   Los sensores de luz y calidad de aire serán deshabilitados")
            
            self.GPIO = GPIO
            
        except ImportError:
            raise ImportError("Librerías de Raspberry Pi no disponibles. Use modo 'testing'")

    # ============== FUNCIONES IGUALES A ALLIN_W_DISPLAY.PY ==============
    
    def leer_dht11(self):
        """Función igual que en allin_w_display.py"""
        if self.mode == 'real':
            try:
                temp = self.dht_sensor.temperature
                hum = self.dht_sensor.humidity
                return temp, hum
            except:
                return None, None
        else:
            return self._read_dht11_simulated()

    def leer_ultrasonico(self):
        """Función igual que en allin_w_display.py"""
        if self.mode == 'real':
            self.GPIO.output(23, True)  # TRIG
            time.sleep(0.00001)
            self.GPIO.output(23, False)

            while self.GPIO.input(24) == 0:  # ECHO
                start = time.time()
            while self.GPIO.input(24) == 1:
                end = time.time()

            duracion = end - start
            distancia = (duracion * 34300) / 2
            return round(distancia, 2)
        else:
            return self._read_ultrasonic_simulated()

    def leer_ldr(self):
        """Función igual que en allin_w_display.py"""
        if self.mode == 'real':
            try:
                # Leer tanto el valor ADC crudo como el voltaje
                valor_adc = self.canal_ldr.value
                voltaje = self.canal_ldr.voltage
                
                # Validar que los valores sean razonables
                if valor_adc is None or voltaje is None:
                    print("⚠️ Sensor LDR: No se puede leer el valor")
                    return None
                    
                if valor_adc < 0 or valor_adc > 65535:
                    print(f"⚠️ Sensor LDR: Valor ADC fuera de rango ({valor_adc})")
                    return None
                    
                print(f"DEBUG ADC: Valor crudo = {valor_adc}, Voltaje = {voltaje:.4f}V")
                return voltaje
                
            except Exception as e:
                print(f"⚠️ Sensor LDR: Error al leer sensor - {e}")
                return None
        else:
            # En modo simulado, retornamos un voltaje simulado
            lux = round(random.uniform(self.simulation_ranges['LIGHT']['min'], self.simulation_ranges['LIGHT']['max']))
            voltaje_ldr = round((lux / 2000) * 3.3, 4)  # Conversión inversa para simular voltaje
            return voltaje_ldr

    def calcular_lux(self, voltaje, vcc_max=3.3):
        """
        Función igual que en allin_w_display.py
        Convierte el voltaje del sensor LDR a lux
        Sensor LDR: voltaje bajo = mucha luz, voltaje alto = poca luz
        """
        if voltaje <= 0.1:
            return 2000  # Voltaje muy bajo = máxima luz
        
        if voltaje >= vcc_max - 0.1:
            return 0  # Voltaje máximo = sin luz
        
        # Conversión inversa: menor voltaje = más luz
        # Basado en observaciones: 0.45V = luz, 1.8V+ = oscuro
        lux = 2000 * (vcc_max - voltaje) / vcc_max
        
        return round(max(0, lux), 1)

    def leer_mq135(self):
        """Función igual que en allin_w_display.py"""
        if self.mode == 'real':
            return self.canal_mq135.voltage
        else:
            # En modo simulado
            ppm = round(random.uniform(self.simulation_ranges['AIR_QUALITY']['min'], self.simulation_ranges['AIR_QUALITY']['max']))
            voltaje_mq135 = round((ppm / 1000) * 3.3, 2)  # Conversión inversa para simular voltaje
            return voltaje_mq135

    def leer_presion(self):
        """Función igual que en allin_w_display.py"""
        if self.mode == 'real':
            try:
                if not self.bmp280_disponible or self.bmp280 is None:
                    return None
                
                presion = self.bmp280.pressure  # Retorna en hPa
                
                # Validar que el valor sea razonable (rango típico: 300-1100 hPa)
                if presion < 300 or presion > 1100:
                    print(f"⚠️ Sensor BMP280: Valor de presión fuera de rango ({presion:.1f} hPa)")
                    return None
                    
                return presion
                
            except Exception as e:
                print(f"⚠️ Sensor BMP280: Error al leer presión - {e}")
                return None
        else:
            return self._read_bmp280_simulated()

    def controlar_buzzer(self, estado):
        """Función igual que en allin_w_display.py"""
        if self.mode == 'real':
            self.GPIO.output(self.config['BUZZER_PIN'], self.GPIO.LOW if estado else self.GPIO.HIGH)

    def controlar_motor(self, estado):
        """Función para controlar el motor igual que en allin_w_display.py"""
        if self.mode == 'real':
            self.GPIO.output(self.config['MOTOR_PIN'], self.GPIO.HIGH if estado else self.GPIO.LOW)
            print(f"🔧 Motor: {'ON' if estado else 'OFF'}")

    def activar_alerta(self, mensaje, gpio_led):
        """Función igual que en allin_w_display.py"""
        if self.mode == 'real':
            print(f"⚠️ {mensaje} ⚠️")
            self.GPIO.output(gpio_led, self.GPIO.HIGH)
            time.sleep(0.5)
            self.GPIO.output(gpio_led, self.GPIO.LOW)

    # ============== FUNCIONES DE COMPATIBILIDAD ==============
    
    def read_temperature_humidity(self) -> Tuple[Optional[float], Optional[float]]:
        """Lee temperatura y humedad"""
        return self.leer_dht11()
    
    def read_distance(self) -> float:
        """Lee distancia ultrasónica"""
        return self.leer_ultrasonico()
    
    def read_light(self) -> Tuple[bool, int, float]:
        """Lee sensor de luz - retorna tuple (hay_luz, lux, voltaje)"""
        voltaje_ldr = self.leer_ldr()
        
        if voltaje_ldr is not None:
            lux = self.calcular_lux(voltaje_ldr)
            # Debug: Mostrar información detallada del sensor LDR (igual que allin_w_display.py)
            print(f"DEBUG LDR: Voltaje raw = {voltaje_ldr:.4f}V, Lux calculado = {lux}")
            hay_luz = lux > 1000  # Más de 1000 lux se considera "hay luz" (igual que allin_w_display.py)
            return hay_luz, lux, voltaje_ldr
        else:
            print("DEBUG LDR: Sensor no disponible, usando valor por defecto")
            return False, 0, 0.0
    
    def read_air_quality(self) -> Tuple[bool, int, float]:
        """Lee calidad del aire - retorna tuple (aire_malo, ppm, voltaje)"""
        voltaje_mq135 = self.leer_mq135()
        ppm = round((voltaje_mq135 / 3.3) * 1000)  # Igual que allin_w_display.py
        aire_malo = ppm > 400  # Igual que allin_w_display.py
        return aire_malo, ppm, voltaje_mq135
    
    def read_pressure(self) -> float:
        """Lee presión atmosférica del BMP280"""
        return self.leer_presion()
    
    def control_buzzer(self, state: bool):
        """Controla el buzzer"""
        self.controlar_buzzer(state)
    
    def activate_alert_led(self, led_type: str, duration: float = None):
        """Activa un LED de alerta específico"""
        if self.mode == 'real':
            self._activate_alert_led_real(led_type, duration)
    
    def read_all_sensors(self) -> Dict[str, Any]:
        """Lee todos los sensores y retorna un diccionario - estilo allin_w_display.py"""
        data = {'timestamp': time.time()}
        
        # Solo leer sensores habilitados
        if self.is_sensor_enabled('temperature') or self.is_sensor_enabled('humidity'):
            temp, hum = self.leer_dht11()
            if self.is_sensor_enabled('temperature'):
                data['temperature'] = temp
            if self.is_sensor_enabled('humidity'):
                data['humidity'] = hum
        
        if self.is_sensor_enabled('distance'):
            data['distance'] = self.leer_ultrasonico()
            
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
            presion = self.leer_presion()
            data['pressure'] = presion
        
        # Verificar alertas y activar LEDs
        self._check_alerts(data)
        
        return data
    
    def _check_alerts(self, data: Dict[str, Any]):
        """Verifica las condiciones de alerta y activa LEDs correspondientes - estilo allin_w_display.py"""
        # Alerta de temperatura
        temp = data.get('temperature')
        if temp is not None and temp > 30:  # Igual que allin_w_display.py
            self.activar_alerta("Temp. muy alta", self.config['LED_TEMP'])

        # Alerta de humedad  
        hum = data.get('humidity')
        if hum is not None and hum > 0.50:  # Igual que allin_w_display.py
            self.activar_alerta("Humedad alta", self.config['LED_HUM'])

        # Alerta de luz
        lux = data.get('light_lux')
        if lux is not None and lux < 700:  # Igual que allin_w_display.py
            self.activar_alerta("No hay luz", self.config['LED_LUZ'])

        # Alerta de presión
        presion = data.get('pressure')
        if presion is not None and (presion < 980 or presion > 1030):  # Igual que allin_w_display.py
            self.activar_alerta("Presion anormal", self.config['LED_AIRE'])  # Usar LED azul para presión
    
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

    def _read_bmp280_simulated(self) -> float:
        """Simula presión atmosférica del BMP280"""
        return round(random.uniform(self.simulation_ranges['PRESSURE']['min'], self.simulation_ranges['PRESSURE']['max']), 2)

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

    def cleanup(self):
        """Limpia recursos del sensor manager"""
        if self.mode == 'real':
            try:
                self.GPIO.cleanup()
                print("🧹 Recursos GPIO limpiados")
            except:
                pass 