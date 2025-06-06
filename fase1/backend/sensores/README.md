# Proyecto de Sensores DHT11

Este proyecto lee datos de temperatura y humedad desde un sensor DHT11 conectado a una Raspberry Pi.

## Requisitos del Hardware

- Raspberry Pi
- Sensor DHT11
- Cables de conexión

## Conexión del Sensor

Conecta el sensor DHT11 de la siguiente manera:
- VCC del sensor → Pin 3.3V o 5V de la Raspberry Pi
- GND del sensor → Pin GND de la Raspberry Pi
- DATA del sensor → Pin GPIO 4 de la Raspberry Pi

## Instalación

1. Clona o descarga este proyecto
2. Activa el entorno virtual:
   ```bash
   source sensor_env/bin/activate
   ```
3. Las dependencias ya están instaladas en el entorno virtual

## Scripts Disponibles

### 1. `sensor_dht11.py` - Versión Original
El código original usando Adafruit-DHT. Puede requerir instalación manual:
```bash
python sensor_dht11.py
```

### 2. `sensor_dht11_modern.py` - Versión Moderna
Usa la librería moderna adafruit-circuitpython-dht (ya instalada):
```bash
python sensor_dht11_modern.py
```

### 3. `sensor_dht11_alternative.py` - Versión Alternativa
Implementación directa usando RPi.GPIO, más confiable en algunos casos:
```bash
python sensor_dht11_alternative.py
```

## Uso Recomendado

1. **Prueba primero**: `sensor_dht11_modern.py`
2. **Si falla**: `sensor_dht11_alternative.py`
3. **Para compatibilidad específica**: `sensor_dht11.py`

## Ejecución con Permisos

Si obtienes errores de permisos GPIO, ejecuta con sudo:
```bash
sudo /home/jorgis/Documents/sensores/sensor_env/bin/python sensor_dht11_alternative.py
```

## Troubleshooting

### Problemas Comunes

1. **Error de permisos GPIO**:
   - Ejecuta con `sudo`
   - Agrega tu usuario al grupo gpio: `sudo usermod -a -G gpio $USER`

2. **Lecturas None o errores**:
   - Verifica las conexiones físicas
   - Asegúrate de que el sensor esté bien alimentado
   - Intenta con diferentes scripts
   - Espera unos segundos entre lecturas

3. **Error de importación**:
   - Asegúrate de estar en el entorno virtual: `source sensor_env/bin/activate`
   - Verifica que las librerías estén instaladas: `pip list`

### Verificar Conexiones

Usa este comando para verificar si el pin GPIO está funcionando:
```bash
gpio readall
```

## Archivos del Proyecto

- `sensor_dht11.py` - Script original con Adafruit-DHT
- `sensor_dht11_modern.py` - Script moderno con CircuitPython
- `sensor_dht11_alternative.py` - Script alternativo con RPi.GPIO
- `requirements.txt` - Dependencias del proyecto
- `sensor_env/` - Entorno virtual de Python

## Notas Técnicas

- El sensor DHT11 tiene una precisión de ±1°C para temperatura y ±1% para humedad
- La frecuencia máxima de lectura es 1Hz (una lectura por segundo)
- El sensor puede tardar hasta 2 segundos en estabilizarse tras el encendido 