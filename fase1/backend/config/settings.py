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
    
    # LDR - Fotorresistencia (MCP3008 Canal 0)
    'LDR_CHANNEL': 0,
    
    # MQ135 - Calidad del aire (MCP3008 Canal 1)
    'MQ135_CHANNEL': 1,
    
    # Buzzer
    'BUZZER_PIN': 22,
    
    # Motor
    'MOTOR_PIN': 21,
    
    
    # LEDs de Alerta
    'LED_TEMP': 5,      # LED Rojo - Temperatura
    'LED_HUM': 6,       # LED Amarillo - Humedad
    'LED_LUZ': 13,      # LED Verde - Luz
    'LED_AIRE': 19,     # LED Azul - Calidad del aire
    
    # BMP180 - Sensor de presión
    'BMP180_SEA_LEVEL_PRESSURE': 1013.25,  # hPa
    
    # Intervalos de lectura (segundos)
    'READ_INTERVAL': 2,
    'DISPLAY_REFRESH': 2,
    'ALERT_DURATION': 5,  # Duración de activación de LEDs
}

# ============== CONFIGURACIÓN DE DISPLAY ==============
DISPLAY_CONFIG = {
    'LCD_I2C_ADDRESS': 0x27,
    'LCD_COLS': 20,
    'LCD_ROWS': 4,
}

# ============== CONFIGURACIÓN MQTT ==============
MQTT_CONFIG = {
    'BROKER_HOST': 'broker.hivemq.com',  # Broker HiveMQ público
    'BROKER_PORT': 1883,
    'USERNAME': None,
    'PASSWORD': None,
    'TOPICS': {
        'SENSORS': 'GRUPO2/sensores/rasp01',
        'TEMPERATURE': 'GRUPO2/sensores/rasp01/temperatura',
        'HUMIDITY': 'GRUPO2/sensores/rasp01/humedad',
        'DISTANCE': 'GRUPO2/sensores/rasp01/distancia',
        'LIGHT': 'GRUPO2/sensores/rasp01/luz',
        'AIR_QUALITY': 'GRUPO2/sensores/rasp01/gas',
        'PRESSURE': 'GRUPO2/sensores/rasp01/presion',
        'BUZZER': 'GRUPO2/actuadores/rasp01/buzzer',
        'LEDS': 'GRUPO2/actuadores/rasp01/leds',
        'LED_CONTROL': 'GRUPO2/commands/rasp01/leds/control',  # Control manual de LEDs
        'LED_INDIVIDUAL': 'GRUPO2/commands/rasp01/leds/individual',  # Control individual
        'LED_PATTERN': 'GRUPO2/commands/rasp01/leds/pattern',  # Patrones de LEDs
        'LED_STATUS': 'GRUPO2/status/rasp01/leds',  # Estado de LEDs
        'MOTOR': 'GRUPO2/actuadores/rasp01/motor',
        'FAN': 'GRUPO2/actuadores/rasp01/fan',  # Alias para el motor
        'HISTORY': 'GRUPO2/history/rasp01',  # Para datos históricos
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
    'LIGHT': {'min': 0, 'max': 1000},  # lux
    'AIR_QUALITY': {'min': 0, 'max': 1000},  # ppm
    'PRESSURE': {'min': 1000, 'max': 1030},  # hPa
}

# ============== CONFIGURACIÓN DE ALERTAS ==============
ALERT_CONFIG = {
    'TEMPERATURE': {'min': 15, 'max': 30},  # °C - Activar LED si está fuera del rango
    'HUMIDITY': {'min': 30, 'max': 80},     # % - Activar LED si está fuera del rango
    'LIGHT': {'max': 900},                  # lux - Activar LED si > 900
    'AIR_QUALITY': {'max': 400},            # ppm - Activar LED y buzzer si > 400
    'BUZZER_ON_BAD_AIR': True,
    'LED_ALERT_DURATION': 5,  # segundos
}

# ============== UMBRALES DE SENSORES ==============
SENSOR_THRESHOLDS = {
    'LIGHT': {
        'DETECTION_THRESHOLD': 300,  # lux - Por encima de este valor hay luz detectada
    },
    'AIR_QUALITY': {
        'BAD_AIR_THRESHOLD': 400,    # ppm - Por encima de este valor el aire es malo
    },
} 