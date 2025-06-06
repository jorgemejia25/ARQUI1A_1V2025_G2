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



