"""
Gestor de sensores del Sistema SIEPA
Abstrae la lógica de lectura de sensores reales y simulados
"""

import time
import random
from typing import Dict, Any, Optional, Tuple
from config import SENSOR_CONFIG, SIMULATION_RANGES

class SensorManager:
    """Gestor principal de sensores"""
    
    def __init__(self, mode: str = 'testing'):
        self.mode = mode
        self.config = SENSOR_CONFIG
        self.simulation_ranges = SIMULATION_RANGES
        
        # Estado de habilitación de sensores
        self.sensors_enabled = {
            'temperature': True,
            'humidity': True,
            'distance': True,
            'light': True,
            'air_quality': True,
        }
        
        if mode == 'real':
            self._init_real_sensors()
        
    def _init_real_sensors(self):
        """Inicializa los sensores físicos"""
        try:
            import board
            import adafruit_dht
            import RPi.GPIO as GPIO
            
            # Configurar GPIO
            GPIO.setmode(GPIO.BCM)
            
            # DHT11
            self.dht_sensor = adafruit_dht.DHT11(board.D4)
            
            # HC-SR04
            GPIO.setup(self.config['ULTRASONIC_TRIG_PIN'], GPIO.OUT)
            GPIO.setup(self.config['ULTRASONIC_ECHO_PIN'], GPIO.IN)
            
            # LDR
            GPIO.setup(self.config['LDR_PIN'], GPIO.IN)
            
            # MQ135
            GPIO.setup(self.config['MQ135_PIN'], GPIO.IN)
            
            # Buzzer
            GPIO.setup(self.config['BUZZER_PIN'], GPIO.OUT)
            GPIO.output(self.config['BUZZER_PIN'], GPIO.LOW)
            
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
    
    def read_light(self) -> bool:
        """Lee sensor de luz"""
        if self.mode == 'real':
            return self._read_ldr_real()
        else:
            return self._read_ldr_simulated()
    
    def read_air_quality(self) -> bool:
        """Lee calidad del aire"""
        if self.mode == 'real':
            return self._read_mq135_real()
        else:
            return self._read_mq135_simulated()
    
    def control_buzzer(self, state: bool):
        """Controla el buzzer"""
        if self.mode == 'real':
            self._control_buzzer_real(state)
        # En modo simulado no hace nada visible
    
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
            data['light'] = self.read_light()
            
        if self.is_sensor_enabled('air_quality'):
            data['air_quality_bad'] = self.read_air_quality()
        
        return data
    
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
    
    def _read_ldr_real(self) -> bool:
        """Lee LDR real"""
        return self.GPIO.input(self.config['LDR_PIN']) == self.GPIO.LOW
    
    def _read_mq135_real(self) -> bool:
        """Lee MQ135 real"""
        return self.GPIO.input(self.config['MQ135_PIN']) == self.GPIO.LOW
    
    def _control_buzzer_real(self, state: bool):
        """Controla buzzer real"""
        self.GPIO.output(self.config['BUZZER_PIN'], self.GPIO.HIGH if state else self.GPIO.LOW)
    
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
    
    def _read_ldr_simulated(self) -> bool:
        """Simula LDR"""
        return random.random() < self.simulation_ranges['LIGHT_PROBABILITY']
    
    def _read_mq135_simulated(self) -> bool:
        """Simula MQ135"""
        return random.random() < self.simulation_ranges['BAD_AIR_PROBABILITY']
    
    def cleanup(self):
        """Limpia recursos"""
        if self.mode == 'real' and hasattr(self, 'GPIO'):
            self.GPIO.cleanup() 