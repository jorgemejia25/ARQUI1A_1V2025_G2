# Sistema SIEPA - Backend




## Arquitectura del Sistema

```
┌─────────────────┐    MQTT     ┌─────────────────┐    WebSocket    ┌─────────────────┐
│   Sensores IoT  │ ──────────► │   Mosquitto     │ ──────────────► │    Frontend     │
│                 │             │   Broker        │                 │   (Next.js)     │
│ • DHT11         │             │                 │                 │                 │
│ • HC-SR04       │             │ • Puerto 1883   │                 │ • Monitor MQTT  │
│ • LDR           │             │ • Puerto 9001   │                 │ • Dashboard     │
│ • MQ135         │             │   (WebSocket)   │                 │ • Control       │
│ • Buzzer        │             │                 │                 │                 │
└─────────────────┘             └─────────────────┘                 └─────────────────┘
         │                               │
         │                               │
         ▼                               ▼
┌─────────────────┐             ┌─────────────────┐
│  Sistema SIEPA  │◄────────────│  Display LCD    │
│   (Python)      │             │   (20x4 I2C)    │
│                 │             │                 │
│ • SensorManager │             │ • Estado        │
│ • DisplayManager│             │ • Lecturas      │
│ • MQTTManager   │             │ • Alertas       │
└─────────────────┘             └─────────────────┘
```

## Requisitos del Sistema

### Sistema Operativo
- **Ubuntu 20.04+** / **Debian 10+** / **Raspberry Pi OS**
- **Python 3.8+**
- **Node.js 18+**
- **npm** o **pnpm**

### Hardware (Modo Real)
- **Raspberry Pi** (cualquier modelo con GPIO)
- **DHT11** - Sensor de temperatura y humedad
- **HC-SR04** - Sensor ultrasónico de distancia
- **LDR** - Fotorresistencia
- **MQ135** - Sensor de calidad del aire
- **Buzzer** - Alerta sonora
- **Display LCD 20x4 I2C** - Pantalla de estado

## Librerías Utilizadas

### 📦 **Dependencias Core**

#### **paho-mqtt (≥1.6.0)**
- **Descripción:** Cliente MQTT para Python que permite la comunicación bidireccional con brokers MQTT
- **Uso en SIEPA:** 
  - Publicación de datos de sensores al broker Mosquitto
  - Suscripción a comandos desde el frontend
  - Gestión de conexiones MQTT con reconexión automática
- **Archivos que la usan:** `mqtt_manager.py`, `publisher.py`, `subscriber.py`, `monitor_mqtt.py`

### 🔧 **Dependencias de Hardware (Raspberry Pi)**

#### **RPi.GPIO (≥0.7.0)**
- **Descripción:** Librería para controlar los pines GPIO de Raspberry Pi
- **Uso en SIEPA:**
  - Control del sensor ultrasónico HC-SR04 (trigger y echo)
  - Lectura de fotorresistencia LDR
  - Control del buzzer para alertas
  - Lectura del sensor de calidad del aire MQ135
- **Archivos que la usan:** `sensor_manager.py`

#### **adafruit-circuitpython-dht (≥3.7.0)**
- **Descripción:** Librería de Adafruit para sensores DHT (temperatura y humedad)
- **Uso en SIEPA:**
  - Lectura de temperatura y humedad del sensor DHT11
  - Manejo de errores de lectura del sensor
- **Archivos que la usan:** `sensor_manager.py`
- **Dependencia:** Requiere `adafruit-blinka`

#### **RPLCD (≥1.3.0)**
- **Descripción:** Librería para controlar displays LCD mediante I2C o GPIO
- **Uso en SIEPA:**
  - Mostrar estado del sistema en LCD 20x4
  - Visualizar lecturas de sensores en tiempo real
  - Mostrar alertas y mensajes de estado
- **Archivos que la usan:** `display_manager.py`

#### **adafruit-blinka (≥8.0.0)**
- **Descripción:** Capa de compatibilidad que permite usar librerías CircuitPython en Raspberry Pi
- **Uso en SIEPA:**
  - Base para el funcionamiento de sensores Adafruit
  - Abstracción de hardware para GPIO
- **Dependencia:** Requerida por `adafruit-circuitpython-dht`

### 🧪 **Dependencias de Desarrollo**

#### **pytest (≥7.0.0)**
- **Descripción:** Framework de testing para Python
- **Uso en SIEPA:**
  - Pruebas unitarias de los managers
  - Pruebas de integración MQTT
  - Validación de funcionalidad del sistema

#### **pytest-cov (≥4.0.0)**
- **Descripción:** Plugin para pytest que genera reportes de cobertura de código
- **Uso en SIEPA:**
  - Análisis de cobertura de pruebas
  - Identificación de código no testeado

#### **loguru (≥0.6.0)**
- **Descripción:** Librería avanzada de logging con formato mejorado
- **Uso en SIEPA:**
  - Logging estructurado del sistema
  - Rotación automática de logs
  - Formato colorido para desarrollo

### ⚙️ **Dependencias de Configuración**

#### **python-dotenv (≥0.19.0)**
- **Descripción:** Carga variables de entorno desde archivos .env
- **Uso en SIEPA:**
  - Configuración de parámetros MQTT
  - Variables de entorno para diferentes modos
  - Gestión de secretos y configuraciones

### 🌐 **Dependencias Futuras (API REST)**

#### **fastapi (≥0.85.0)**
- **Descripción:** Framework web moderno y rápido para crear APIs REST
- **Uso planificado:**
  - API REST para configuración remota
  - Endpoints para histórico de datos
  - Interfaz web alternativa

#### **uvicorn (≥0.18.0)**
- **Descripción:** Servidor ASGI para aplicaciones FastAPI
- **Uso planificado:**
  - Servidor para la API REST
  - Manejo de WebSockets

### 🗃️ **Dependencias de Base de Datos**

#### **sqlite3**
- **Descripción:** Base de datos embebida (incluida en Python estándar)
- **Uso en SIEPA:**
  - Almacenamiento de histórico de sensores
  - Logs del sistema
  - Configuraciones persistentes

#### **sqlalchemy (≥1.4.0)**
- **Descripción:** ORM (Object-Relational Mapping) para Python
- **Uso planificado:**
  - Abstracción de base de datos
  - Modelos de datos estructurados
  - Migraciones de esquema

### 📚 **Librerías Estándar de Python Utilizadas**

#### **time**
- **Uso:** Temporización de lecturas, delays entre mediciones

#### **json**
- **Uso:** Serialización de datos para MQTT, configuración

#### **signal**
- **Uso:** Manejo de señales del sistema (SIGINT, SIGTERM)

#### **sys**
- **Uso:** Argumentos de línea de comandos, gestión del sistema

#### **threading**
- **Uso:** Ejecución concurrente de sensores y MQTT

#### **typing**
- **Uso:** Type hints para mejor documentación del código

#### **argparse**
- **Uso:** Parsing de argumentos de línea de comandos

#### **random**
- **Uso:** Generación de datos simulados en modo testing

#### **datetime**
- **Uso:** Timestamps, formateo de fechas

#### **subprocess**
- **Uso:** Ejecución de comandos del sistema (instalación de Mosquitto)

## Modos de Instalación

### 🧑‍💻 **Modo Testing (Desarrollo)**
```bash
pip install paho-mqtt
```
Suficiente para desarrollo y pruebas sin hardware.

### 🔌 **Modo Real (Raspberry Pi)**
```bash
pip install -r requirements.txt
```
Instala todas las dependencias incluyendo hardware.

### 📦 **Instalación Selectiva**
```bash
# Solo MQTT
pip install paho-mqtt

# Solo sensores Raspberry Pi
pip install RPi.GPIO adafruit-circuitpython-dht RPLCD adafruit-blinka

# Solo desarrollo
pip install pytest pytest-cov loguru

# Solo configuración
pip install python-dotenv

# Solo API REST (futuro)
pip install fastapi uvicorn sqlalchemy
```

### 4. Estructura del Proyecto Backend
```
backend/
├── config/
│   └── settings.py          # Configuración centralizada
├── core/
│   ├── system.py            # Sistema principal SIEPA
│   ├── sensors/
│   │   └── sensor_manager.py # Gestión de sensores
│   ├── display/
│   │   └── display_manager.py # Gestión del display
│   └── mqtt/
│       └── mqtt_manager.py   # Gestión de MQTT
├── main.py                  # Punto de entrada principal
├── demo_mosquitto.py        # Demostración completa
├── test_mqtt_sensors.py     # Pruebas de integración
├── monitor_mqtt.py          # Monitor de mensajes MQTT
└── requirements.txt         # Dependencias Python
```
## Tópicos MQTT

### Publicación (Sistema → Frontend)
```
siepa/sensors                    # Datos completos (JSON)
siepa/sensors/temperature        # Temperatura (°C)
siepa/sensors/humidity          # Humedad (%)
siepa/sensors/distance          # Distancia (cm)
siepa/sensors/light             # Luz (true/false)
siepa/sensors/air_quality       # Calidad aire (true=malo)
siepa/actuators/buzzer          # Estado buzzer (JSON)
```

### Suscripción (Frontend → Sistema)
```
siepa/commands/buzzer           # Control del buzzer
siepa/commands/system           # Comandos del sistema
siepa/commands/sensors/+        # Control de sensores
```

### Formato de Datos
```json
// siepa/sensors
{
  "temperature": 25.6,
  "humidity": 60.3,
  "distance": 123.45,
  "light": true,
  "air_quality_bad": false,
  "timestamp": 1749175125.395273,
  "mode": "testing",
  "system": "SIEPA"
}

// siepa/actuators/buzzer
{
  "state": true,
  "timestamp": 1749175125.395273,
  "mode": "testing"
}
```



