"""
Configuración centralizada del Sistema SIEPA
"""

# ============== CONFIGURACIÓN DE SENSORES ==============
SENSOR_CONFIG = {
    # DHT11 - Temperatura y Humedad
    'DHT11_PIN': 4,
    
    # HC-SR04 - Ultrasonico
    'ULTRASONIC_TRIG_PIN': 23,
    'ULTRASONIC_ECHO_PIN': 24,
    
    # LDR - Fotorresistencia
    'LDR_PIN': 17,
    
    # MQ135 - Calidad del aire
    'MQ135_PIN': 27,
    
    # Buzzer
    'BUZZER_PIN': 22,
    
    # Intervalos de lectura (segundos)
    'READ_INTERVAL': 2,
    'DISPLAY_REFRESH': 2,
}

# ============== CONFIGURACIÓN DE DISPLAY ==============
DISPLAY_CONFIG = {
    'LCD_I2C_ADDRESS': 0x27,
    'LCD_COLS': 20,
    'LCD_ROWS': 4,
}

# ============== CONFIGURACIÓN MQTT ==============
MQTT_CONFIG = {
    'BROKER_HOST': 'localhost',  # Broker Mosquitto local
    'BROKER_PORT': 1883,
    'USERNAME': None,
    'PASSWORD': None,
    'TOPICS': {
        'SENSORS': 'siepa/sensors',
        'TEMPERATURE': 'siepa/sensors/temperature',
        'HUMIDITY': 'siepa/sensors/humidity',
        'DISTANCE': 'siepa/sensors/distance',
        'LIGHT': 'siepa/sensors/light',
        'AIR_QUALITY': 'siepa/sensors/air_quality',
        'BUZZER': 'siepa/actuators/buzzer',
    },
    'QOS': 1,
    'RETAIN': False,
}

# ============== CONFIGURACIÓN GENERAL ==============
SYSTEM_CONFIG = {
    'MODE': 'testing',  # 'real' o 'testing'
    'DEBUG': True,
    'LOG_LEVEL': 'INFO',
    'VERSION': '1.0.0',
}

# ============== RANGOS DE SIMULACIÓN ==============
SIMULATION_RANGES = {
    'TEMPERATURE': {'min': 18, 'max': 32},
    'HUMIDITY': {'min': 40, 'max': 80},
    'DISTANCE': {'min': 5, 'max': 200},
    'LIGHT_PROBABILITY': 0.5,  # 50% probabilidad de luz
    'BAD_AIR_PROBABILITY': 0.2,  # 20% probabilidad de aire malo
}

# ============== CONFIGURACIÓN DE ALERTAS ==============
ALERT_CONFIG = {
    'TEMPERATURE': {'min': 15, 'max': 35},
    'HUMIDITY': {'min': 30, 'max': 90},
    'DISTANCE': {'min': 10, 'max': 150},
    'BUZZER_ON_BAD_AIR': True,
} 