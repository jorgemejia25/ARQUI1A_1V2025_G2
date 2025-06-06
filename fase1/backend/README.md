# Sistema SIEPA - Backend

Sistema de monitoreo ambiental con sensores IoT, display LCD y comunicación MQTT.

## 🏗️ Estructura del Proyecto

```
backend/
├── main.py                     # Punto de entrada principal
├── config/                     # Configuraciones
│   ├── __init__.py
│   └── settings.py            # Configuración centralizada
├── core/                      # Lógica principal
│   ├── __init__.py
│   ├── system.py              # Sistema principal integrado
│   ├── sensors/               # Gestión de sensores
│   │   ├── __init__.py
│   │   └── sensor_manager.py  # Manager de sensores
│   ├── display/               # Gestión de display
│   │   ├── __init__.py
│   │   └── display_manager.py # Manager de display LCD
│   ├── mqtt/                  # Comunicación MQTT
│   │   ├── __init__.py
│   │   ├── mqtt_manager.py    # Manager MQTT integrado
│   │   ├── publisher.py       # Publicador MQTT original
│   │   └── subscriber.py      # Suscriptor MQTT original
│   └── utils/                 # Utilidades
├── tests/                     # Pruebas unitarias
├── docs/                      # Documentación adicional
├── sensores/                  # Código legacy (mantener)
└── mqtt/                      # Código MQTT legacy (mantener)
```

## 🚀 Uso del Sistema

### Instalación de dependencias
```bash
# Para modo testing (solo Python estándar)
pip install paho-mqtt  # Solo si usas MQTT

# Para modo real (Raspberry Pi)
pip install RPi.GPIO adafruit-circuitpython-dht RPLCD paho-mqtt
```

### Ejecución

#### Modo Testing (Por defecto)
```bash
python main.py                    # Solo sensores simulados
python main.py --mqtt            # Con MQTT habilitado
```

#### Modo Real (Raspberry Pi)
```bash
python main.py --mode real       # Sensores físicos
python main.py --mode real --mqtt # Modo completo con MQTT
```

### Opciones disponibles
```bash
python main.py --help           # Ver todas las opciones
python main.py --version        # Ver versión
```

## 📊 Sensores Soportados

| Sensor | Descripción | Pin |
|--------|-------------|-----|
| DHT11 | Temperatura y Humedad | GPIO 4 |
| HC-SR04 | Distancia Ultrasónica | TRIG: 23, ECHO: 24 |
| LDR | Fotorresistencia | GPIO 17 |
| MQ135 | Calidad del Aire | GPIO 27 |
| Buzzer | Alerta Sonora | GPIO 22 |
| LCD I2C | Display 20x4 | I2C 0x27 |

## 📡 Tópicos MQTT

### Publicación (Sistema → Frontend)
- `siepa/sensors` - Datos completos de todos los sensores
- `siepa/sensors/temperature` - Solo temperatura
- `siepa/sensors/humidity` - Solo humedad
- `siepa/sensors/distance` - Solo distancia
- `siepa/sensors/light` - Solo estado de luz
- `siepa/sensors/air_quality` - Solo calidad del aire
- `siepa/actuators/buzzer` - Estado del buzzer

### Suscripción (Frontend → Sistema)
- `siepa/commands/buzzer` - Control remoto del buzzer
- `siepa/commands/system` - Comandos del sistema

## ⚙️ Configuración

Toda la configuración está centralizada en `config/settings.py`:

- **SENSOR_CONFIG**: Configuración de pines y intervalos
- **DISPLAY_CONFIG**: Configuración del LCD
- **MQTT_CONFIG**: Configuración del broker MQTT
- **SIMULATION_RANGES**: Rangos para datos simulados
- **ALERT_CONFIG**: Configuración de alertas

## 🧪 Modo Testing vs Modo Real

### Testing
- ✅ No requiere hardware
- ✅ Datos simulados realistas
- ✅ LCD simulado en consola
- ✅ Desarrollo y pruebas rápidas

### Real
- 🔧 Requiere Raspberry Pi
- 🔧 Sensores físicos conectados
- 🔧 LCD I2C real
- 🔧 Librerías específicas instaladas

## 🔧 Desarrollo

### Arquitectura Modular
- **SensorManager**: Abstrae lectura de sensores reales/simulados
- **DisplayManager**: Abstrae display LCD real/simulado
- **MQTTManager**: Maneja comunicación MQTT opcional
- **SIEPASystem**: Integra todos los componentes

### Extensibilidad
- Agregar nuevos sensores en `SensorManager`
- Modificar formato de display en `DisplayManager`
- Agregar nuevos tópicos MQTT en `MQTTManager`
- Personalizar alertas en configuración

## 🐛 Solución de Problemas

### Error de importación en modo real
```
ImportError: Librerías de Raspberry Pi no disponibles
```
**Solución**: Use `--mode testing` para desarrollo sin hardware

### MQTT no conecta
```
Error conectando a MQTT: [Errno 111] Connection refused
```
**Solución**: Verifique que el broker MQTT esté ejecutándose

### Permisos GPIO
```
RuntimeError: No access to /dev/mem
```
**Solución**: Ejecute con `sudo` en Raspberry Pi

## 📈 Próximas Funcionalidades

- [ ] API REST para consulta de datos
- [ ] Base de datos para histórico
- [ ] Dashboard web integrado
- [ ] Alertas por email/SMS
- [ ] Calibración automática de sensores 