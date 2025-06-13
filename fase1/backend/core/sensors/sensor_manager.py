"""
Gestor de sensores del Sistema SIEPA
Abstrae la lógica de lectura de sensores reales y simulados
Implementa EXACTAMENTE la misma lógica que allin_w_display.py
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
        
        # Sistema de gestión de LEDs EXACTO de allin_w_display.py
        self.leds_activos = {}  # Diccionario para manejar los LEDs activos y su tiempo de apagado
        
        # Control manual de LEDs
        self.manual_led_control = False  # Si está en modo manual, no controlar automáticamente
        self.manual_led_states = {  # Estado manual de cada LED
            'temperature': False,
            'humidity': False,
            'light': False,
            'air_quality': False,
            'pressure': False
        }
        
        # Control manual del buzzer
        self.manual_buzzer_control = False
        self.manual_buzzer_state = False
        
        # Estado de habilitación de sensores
        self.sensors_enabled = {
            'temperature': True,
            'humidity': True,
            'distance': True,
            'light': True,
            'air_quality': True,
            'pressure': True,  # Sensor BMP180
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
            import bmp180
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
            
            # I2C para BMP180 - Inicialización igual que allin_w_display.py
            try:
                i2c = busio.I2C(board.SCL, board.SDA)
                self.bmp180_sensor = bmp180.BMP180(i2c)
                print("✅ Sensor BMP180 inicializado correctamente")
                self.bmp180_disponible = True
            except Exception as e:
                print(f"⚠️ Error al inicializar BMP180: {e}")
                self.bmp180_sensor = None
                self.bmp180_disponible = False
                self.enable_sensor('pressure', False)
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

    # ============== SISTEMA DE GESTIÓN DE LEDS (EXACTO DE ALLIN_W_DISPLAY.PY) ==============
    
    def gestionar_leds(self):
        """
        Gestiona el apagado automático de LEDs después de 5 segundos
        FUNCIÓN EXACTA de allin_w_display.py
        """
        if self.mode == 'testing':
            return  # En modo testing no manejamos LEDs físicos
            
        tiempo_actual = time.time()
        leds_a_apagar = []
        
        for gpio_led, tiempo_apagado in self.leds_activos.items():
            if tiempo_actual >= tiempo_apagado:
                self.GPIO.output(gpio_led, self.GPIO.LOW)
                leds_a_apagar.append(gpio_led)
        
        # Remover LEDs que ya se apagaron
        for led in leds_a_apagar:
            del self.leds_activos[led]

    def activar_alerta(self, mensaje, gpio_led):
        """
        Activa una alerta encendiendo el LED por 5 segundos
        FUNCIÓN EXACTA de allin_w_display.py
        """
        print(f"🚨 ALERTA: {mensaje}")
        
        # Solo activar alertas automáticas si no está en modo manual
        if not self.manual_led_control and self.mode == 'real':
            # Encender el LED y programar su apagado en 5 segundos
            self.GPIO.output(gpio_led, self.GPIO.HIGH)
            self.leds_activos[gpio_led] = time.time() + 5.0  # 5 segundos desde ahora
        elif self.manual_led_control:
            print("   ⚠️ Control manual activo - alerta no aplicada a LEDs")

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
            self.GPIO.output(self.config['ULTRASONIC_TRIG_PIN'], True)
            time.sleep(0.00001)
            self.GPIO.output(self.config['ULTRASONIC_TRIG_PIN'], False)

            while self.GPIO.input(self.config['ULTRASONIC_ECHO_PIN']) == 0:
                start = time.time()
            while self.GPIO.input(self.config['ULTRASONIC_ECHO_PIN']) == 1:
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
            # En modo simulado, retornamos un voltaje simulado realista
            lux = round(random.uniform(self.simulation_ranges['LIGHT']['min'], self.simulation_ranges['LIGHT']['max']))
            # Conversión inversa para simular voltaje (voltaje bajo = mucha luz)
            voltaje_ldr = round(3.3 - (lux / 2000) * 3.3, 4)
            print(f"DEBUG LDR: Voltaje raw = {voltaje_ldr:.4f}V, Lux calculado = {lux}")
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
            # En modo simulado, simular voltaje MQ135
            ppm = round(random.uniform(200, 600))
            voltaje_mq135 = round((ppm / 1000) * 3.3, 4)
            return voltaje_mq135

    def leer_presion(self):
        """
        Función igual que en allin_w_display.py
        Lee la presión del sensor BMP180 con manejo robusto de errores
        """
        if self.mode == 'real':
            try:
                if not self.bmp180_disponible or self.bmp180_sensor is None:
                    return None
                
                # Intentar lectura con reintentos
                max_intentos = 3
                for intento in range(max_intentos):
                    try:
                        presion = self.bmp180_sensor.pressure  # Retorna en hPa
                        
                        # Validar que el valor sea razonable (rango típico: 300-1100 hPa)
                        if presion < 300 or presion > 1100:
                            print(f"⚠️ Sensor BMP180: Valor de presión fuera de rango ({presion:.1f} hPa)")
                            return None
                            
                        return presion
                        
                    except OSError as e:
                        if "Input/output error" in str(e) or e.errno == 5:
                            if intento < max_intentos - 1:
                                print(f"⚠️ BMP180: Error I/O en intento {intento + 1}, reintentando...")
                                time.sleep(0.1)  # Esperar un poco antes de reintentar
                                continue
                            else:
                                print(f"❌ BMP180: Error I/O persistente después de {max_intentos} intentos")
                                print("💡 Verificar conexiones I2C (SDA, SCL, VCC, GND)")
                                self.bmp180_disponible = False  # Marcar como no disponible
                                return None
                        else:
                            raise e  # Re-lanzar otros errores OSError
                            
                    except Exception as e:
                        if intento < max_intentos - 1:
                            print(f"⚠️ BMP180: Error en intento {intento + 1}: {e}")
                            time.sleep(0.1)
                            continue
                        else:
                            raise e
                            
            except Exception as e:
                print(f"⚠️ Sensor BMP180: Error al leer presión - {e}")
                return None
        else:
            return self._read_bmp180_simulated()

    def controlar_buzzer(self, estado):
        """Función igual que en allin_w_display.py"""
        # Si está en modo manual, no permitir control automático
        if self.manual_buzzer_control:
            print(f"⚠️ Buzzer en modo manual - ignorando control automático")
            return
            
        if self.mode == 'real':
            self.GPIO.output(self.config['BUZZER_PIN'], self.GPIO.LOW if estado else self.GPIO.HIGH)
            print(f"🔔 Buzzer: {'ON' if estado else 'OFF'} (automático)")
        else:
            # En modo testing, solo mostrar estado
            print(f"🔔 Buzzer: {'ON' if estado else 'OFF'} (modo simulado, automático)")

    def controlar_motor(self, estado):
        """Función igual que en allin_w_display.py"""
        if self.mode == 'real':
            self.GPIO.output(self.config['MOTOR_PIN'], self.GPIO.HIGH if estado else self.GPIO.LOW)
        else:
            # En modo testing, solo mostrar estado
            print(f"🔧 Motor: {'ON' if estado else 'OFF'} (modo simulado)")

    # ============== FUNCIONES DE LECTURA ADAPTADAS ==============

    def read_all_sensors(self) -> Dict[str, Any]:
        """
        Lee todos los sensores usando las funciones exactas de allin_w_display.py
        """
        # Gestionar LEDs activos (apagar después de 5 segundos)
        self.gestionar_leds()
        
        # Leer sensores EXACTAMENTE igual que allin_w_display.py
        temp, hum = self.leer_dht11()
        distancia = self.leer_ultrasonico()
        voltaje_ldr = self.leer_ldr()
        
        # Calcular lux igual que allin_w_display.py
        if voltaje_ldr is not None:
            lux = self.calcular_lux(voltaje_ldr)
        else:
            lux = None
            
        voltaje_mq135 = self.leer_mq135()
        ppm = round((voltaje_mq135 / 3.3) * 1000) if voltaje_mq135 else 0
        presion = self.leer_presion()

        # Determinar si hay luz basándose en voltaje del LDR (EXACTO de allin_w_display.py)
        if voltaje_ldr is not None:
            hay_luz = voltaje_ldr <= 0.45  # 0.45V o menos = hay luz
            no_hay_luz = voltaje_ldr >= 1.2  # 1.2V o más = no hay luz
        else:
            hay_luz = False
            no_hay_luz = False
        
        aire_malo = ppm > 400

        # Determinar el estado del buzzer
        if self.manual_buzzer_control:
            buzzer_state = self.manual_buzzer_state
        else:
            buzzer_state = aire_malo  # Automático: se activa cuando el aire es malo

        return {
            'temperature': temp,
            'humidity': hum,
            'distance': distancia,
            'light': hay_luz,
            'light_lux': lux,
            'light_voltage': voltaje_ldr,
            'air_quality_bad': aire_malo,
            'air_quality_ppm': ppm,
            'air_quality_voltage': voltaje_mq135,
            'pressure': presion,
            'no_hay_luz': no_hay_luz,  # Variable adicional para alertas
            'mode': self.mode,
            'timestamp': time.time(),
            'buzzer_state': buzzer_state,
            'buzzer_manual_control': self.manual_buzzer_control
        }

    # ============== FUNCIONES SIMULADAS ==============

    def enable_sensor(self, sensor_type: str, enabled: bool = True):
        """Habilita o deshabilita un sensor"""
        if sensor_type in self.sensors_enabled:
            self.sensors_enabled[sensor_type] = enabled
            status = "habilitado" if enabled else "deshabilitado"
            print(f"📊 Sensor {sensor_type}: {status}")
            return True
        return False

    def get_sensor_status(self) -> Dict[str, bool]:
        """Obtiene el estado actual de todos los sensores"""
        return self.sensors_enabled.copy()

    def is_sensor_enabled(self, sensor_type: str) -> bool:
        """Verifica si un sensor está habilitado"""
        return self.sensors_enabled.get(sensor_type, False)

    def _read_dht11_simulated(self) -> Tuple[float, float]:
        """Simula lectura de DHT11"""
        if not self.is_sensor_enabled('temperature') or not self.is_sensor_enabled('humidity'):
            return None, None
        
        temp = round(random.uniform(
            self.simulation_ranges['TEMPERATURE']['min'],
            self.simulation_ranges['TEMPERATURE']['max']
        ), 1)
        
        humidity = round(random.uniform(
            self.simulation_ranges['HUMIDITY']['min'],
            self.simulation_ranges['HUMIDITY']['max']
        ), 1)
        
        return temp, humidity

    def _read_ultrasonic_simulated(self) -> float:
        """Simula lectura ultrasónica"""
        if not self.is_sensor_enabled('distance'):
            return 0.0
        
        return round(random.uniform(
            self.simulation_ranges['DISTANCE']['min'],
            self.simulation_ranges['DISTANCE']['max']
        ), 2)

    def _read_bmp180_simulated(self) -> float:
        """Simula lectura de presión BMP180"""
        if not self.is_sensor_enabled('pressure'):
            return None
        
        return round(random.uniform(
            self.simulation_ranges['PRESSURE']['min'],
            self.simulation_ranges['PRESSURE']['max']
        ), 1)

    def cleanup(self):
        """Limpia recursos del sensor manager"""
        if self.mode == 'real':
            try:
                # Apagar todos los LEDs activos
                for gpio_led in self.leds_activos:
                    self.GPIO.output(gpio_led, self.GPIO.LOW)
                self.leds_activos.clear()
                
                # Apagar otros componentes
                self.GPIO.output(self.config['BUZZER_PIN'], self.GPIO.HIGH)  # Apagar buzzer
                self.GPIO.output(self.config['MOTOR_PIN'], self.GPIO.LOW)    # Apagar motor
                
                self.GPIO.cleanup()
                print("✅ Recursos GPIO limpiados correctamente")
            except Exception as e:
                print(f"⚠️ Error limpiando recursos GPIO: {e}")

    # ============== CONTROL MANUAL DE LEDS ==============
    
    def set_manual_led_control(self, enabled: bool):
        """Habilita o deshabilita el control manual de LEDs"""
        self.manual_led_control = enabled
        status = "MANUAL" if enabled else "AUTOMÁTICO"
        print(f"🔧 Control de LEDs: {status}")
        
        if not enabled:
            # Al deshabilitar control manual, apagar todos los LEDs manuales
            self.turn_off_all_manual_leds()
    
    def is_manual_led_control(self) -> bool:
        """Verifica si el control de LEDs está en modo manual"""
        return self.manual_led_control
    
    def set_led_state(self, led_type: str, state: bool) -> bool:
        """
        Controla un LED específico manualmente
        
        Args:
            led_type: 'temperature', 'humidity', 'light', 'air_quality', 'pressure'
            state: True para encender, False para apagar
            
        Returns:
            bool: True si se controló correctamente, False si hubo error
        """
        if led_type not in self.manual_led_states:
            print(f"❌ Tipo de LED inválido: {led_type}")
            return False
        
        # Mapeo de tipos de LED a pines GPIO
        led_pin_map = {
            'temperature': self.config['LED_TEMP'],    # LED Rojo
            'humidity': self.config['LED_HUM'],        # LED Amarillo
            'light': self.config['LED_LUZ'],           # LED Verde
            'air_quality': self.config['LED_AIRE'],    # LED Azul
            'pressure': self.config['LED_AIRE']        # LED Azul (compartido con air_quality)
        }
        
        pin = led_pin_map[led_type]
        
        # Actualizar estado interno
        self.manual_led_states[led_type] = state
        
        if self.mode == 'real':
            try:
                self.GPIO.output(pin, self.GPIO.HIGH if state else self.GPIO.LOW)
                print(f"💡 LED {led_type}: {'ON' if state else 'OFF'} (pin {pin})")
                return True
            except Exception as e:
                print(f"❌ Error controlando LED {led_type}: {e}")
                return False
        else:
            # En modo testing, solo mostrar estado
            print(f"💡 LED {led_type}: {'ON' if state else 'OFF'} (modo simulado)")
            return True
    
    def toggle_led(self, led_type: str) -> bool:
        """
        Alterna el estado de un LED específico
        
        Args:
            led_type: 'temperature', 'humidity', 'light', 'air_quality', 'pressure'
            
        Returns:
            bool: True si se controló correctamente
        """
        if led_type not in self.manual_led_states:
            return False
        
        current_state = self.manual_led_states[led_type]
        return self.set_led_state(led_type, not current_state)
    
    def get_led_states(self) -> Dict[str, bool]:
        """Obtiene el estado actual de todos los LEDs"""
        return self.manual_led_states.copy()
    
    def turn_off_all_manual_leds(self):
        """Apaga todos los LEDs en modo manual"""
        for led_type in self.manual_led_states.keys():
            self.set_led_state(led_type, False)
        print("🔴 Todos los LEDs manuales apagados")
    
    def turn_on_all_manual_leds(self):
        """Enciende todos los LEDs en modo manual"""
        for led_type in self.manual_led_states.keys():
            self.set_led_state(led_type, True)
        print("🔴 Todos los LEDs manuales encendidos")
    
    def set_led_pattern(self, pattern: str):
        """
        Establece un patrón específico de LEDs
        
        Args:
            pattern: 'all_on', 'all_off', 'alternate', 'sequence'
        """
        if pattern == 'all_on':
            self.turn_on_all_manual_leds()
        elif pattern == 'all_off':
            self.turn_off_all_manual_leds()
        elif pattern == 'alternate':
            # Alternar LEDs (temperatura y luz ON, humedad y aire OFF)
            self.set_led_state('temperature', True)
            self.set_led_state('humidity', False)
            self.set_led_state('light', True)
            self.set_led_state('air_quality', False)
            self.set_led_state('pressure', False)
            print("🔄 Patrón alternado activado")
        elif pattern == 'sequence':
            # Secuencia: solo temperatura encendida
            self.turn_off_all_manual_leds()
            self.set_led_state('temperature', True)
            print("📶 Patrón secuencial activado")
        else:
            print(f"❌ Patrón desconocido: {pattern}")

    # ============== FUNCIONES DE COMPATIBILIDAD (para mantener API existente) ==============

    def read_temperature_humidity(self) -> Tuple[Optional[float], Optional[float]]:
        """Función de compatibilidad"""
        return self.leer_dht11()

    def read_distance(self) -> float:
        """Función de compatibilidad"""
        return self.leer_ultrasonico()

    def read_light(self) -> Tuple[bool, int, float]:
        """Función de compatibilidad"""
        voltaje_ldr = self.leer_ldr()
        if voltaje_ldr is not None:
            lux = self.calcular_lux(voltaje_ldr)
            hay_luz = voltaje_ldr <= 0.45
            return hay_luz, lux, voltaje_ldr
        else:
            return False, 0, 0.0

    def read_air_quality(self) -> Tuple[bool, int, float]:
        """Función de compatibilidad"""
        voltaje_mq135 = self.leer_mq135()
        ppm = round((voltaje_mq135 / 3.3) * 1000) if voltaje_mq135 else 0
        aire_malo = ppm > 400
        return aire_malo, ppm, voltaje_mq135

    def read_pressure(self) -> float:
        """Función de compatibilidad"""
        return self.leer_presion()

    def control_buzzer(self, state: bool):
        """Función de compatibilidad"""
        self.controlar_buzzer(state)

    def control_motor(self, state: bool):
        """Función de compatibilidad"""
        self.controlar_motor(state)

    # ============== CONTROL MANUAL DEL BUZZER ==============
    
    def set_manual_buzzer_control(self, enabled: bool):
        """Habilita o deshabilita el control manual del buzzer"""
        self.manual_buzzer_control = enabled
        status = "MANUAL" if enabled else "AUTOMÁTICO"
        print(f"🔧 Control del Buzzer: {status}")
        
        if not enabled:
            # Al deshabilitar control manual, apagar el buzzer
            self.set_buzzer_state(False)
    
    def is_manual_buzzer_control(self) -> bool:
        """Verifica si el control del buzzer está en modo manual"""
        return self.manual_buzzer_control
    
    def set_buzzer_state(self, state: bool):
        """
        Controla el buzzer manualmente
        
        Args:
            state: True para activar, False para desactivar
        """
        self.manual_buzzer_state = state
        
        if self.mode == 'real':
            try:
                # El buzzer es activo bajo, así que invertimos la lógica
                self.GPIO.output(self.config['BUZZER_PIN'], self.GPIO.LOW if state else self.GPIO.HIGH)
                print(f"🔔 Buzzer: {'ON' if state else 'OFF'} (manual)")
            except Exception as e:
                print(f"❌ Error controlando buzzer: {e}")
        else:
            # En modo testing, solo mostrar estado
            print(f"🔔 Buzzer: {'ON' if state else 'OFF'} (modo simulado, manual)")
    
    def toggle_buzzer(self):
        """Alterna el estado del buzzer"""
        self.set_buzzer_state(not self.manual_buzzer_state)
    
    def get_buzzer_state(self) -> bool:
        """Obtiene el estado actual del buzzer"""
        return self.manual_buzzer_state 