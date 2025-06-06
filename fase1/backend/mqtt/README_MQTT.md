# Comunicación IoT con MQTT

## 🤔 ¿Qué es MQTT?

**MQTT** (Message Queuing Telemetry Transport) es un protocolo de mensajería ligero diseñado para comunicación máquina a máquina (M2M) e Internet de las Cosas (IoT).

### Características principales:

- **Ligero**: Mínimo overhead de datos
- **Confiable**: Diferentes niveles de QoS (Quality of Service)
- **Asíncrono**: Comunicación desacoplada
- **Escalable**: Soporta miles de clientes
- **Simple**: Fácil de implementar

## 🏗️ Arquitectura MQTT

```
   Publisher    ┌─────────────┐    Subscriber
      │         │             │         │
      │ publish │   BROKER    │ receive │
      ├────────►│   (Server)  │◄────────┤
      │         │             │         │
      │         └─────────────┘         │
   Sensores                         Aplicaciones
```

### Componentes:

1. **Broker**: Servidor central que recibe y distribuye mensajes
2. **Publisher**: Cliente que envía datos (ej: sensores)
3. **Subscriber**: Cliente que recibe datos (ej: aplicaciones)
4. **Tópicos**: Canales para organizar mensajes

## 📍 Sistema de Tópicos

Los tópicos son como "direcciones" para los mensajes:

```
GRUPO1/sensores/rasp01/temperatura
├─────┬──────┬──────┬──────┬──────
│     │      │      │      └── Tipo de sensor
│     │      │      └── Dispositivo específico
│     │      └── Categoría (sensores, actuadores, etc.)
│     └── Subcategoría
└── Grupo o área
```

### Wildcards (comodines):

- `+`: Un nivel (ej: `GRUPO1/sensores/+/temperatura`)
- `#`: Múltiples niveles (ej: `GRUPO1/sensores/#`)

## 🔄 Niveles de QoS

| QoS | Descripción | Uso |
|-----|-------------|-----|
| 0 | At most once | Datos no críticos, máximo rendimiento |
| 1 | At least once | Datos importantes, puede haber duplicados |
| 2 | Exactly once | Datos críticos, sin duplicados |

## 💾 Estructura de Datos

Nuestros ejemplos usan este formato JSON:

```json
{
  "valor": 23.5,
  "timestamp": "2024-01-15T14:30:00",
  "dispositivo": "rasp01",
  "sensor": "temperatura",
  "unidad": "°C"
}
```

## 🚀 Usar los Ejemplos

### 1. Configurar Dependencias

```bash
# Instalar dependencias MQTT
./setup.sh
```

### 2. Ejecutar Publisher (Simulador de Sensores)

```bash
# Terminal 1: Publicar datos
./mqtt_publish.sh
```

**Salida esperada:**
```
🌡️  MQTT Publisher - Simulador de Sensores IoT
==================================================
✅ Conectado al broker MQTT: broker.hivemq.com:1883
🚀 Iniciando ciclo de publicación cada 3 segundos
📡 GRUPO1/sensores/rasp01/temperatura: 21.8 °C
📡 GRUPO1/sensores/rasp01/humedad: 52.3 %
📡 GRUPO1/sensores/rasp02/temperatura: 23.1 °C
```

### 3. Ejecutar Subscriber (Monitor)

```bash
# Terminal 2: Escuchar datos
./mqtt_subscribe.sh
```

**Salida esperada:**
```
📡 MQTT Subscriber - Monitor de Sensores IoT
==================================================
✅ Conectado al broker MQTT: broker.hivemq.com:1883
🔔 Suscrito a: GRUPO1/sensores/+/+
📥 GRUPO1/sensores/rasp01/temperatura
   └── 21.8 °C [2024-01-15T14:30:00.123456]
```

## 🎛️ Personalización

### Cambiar Grupo:

Edita los archivos `mqtt/publisher.py` y `mqtt/subscriber.py`:

```python
# Cambiar línea:
grupo="GRUPO1"
# Por:
grupo="GRUPO5"  # Tu número de grupo
```

### Agregar Nuevos Sensores:

En `mqtt/publisher.py`, modifica el diccionario `sensores`:

```python
self.sensores = {
    "rasp01": {"temperatura": 20.0, "humedad": 50.0, "presion": 1013.25},
    "arduino02": {"ph": 7.0, "conductividad": 500},
    # Agregar más dispositivos...
}
```

### Cambiar Broker:

Para usar un broker privado:

```python
# En lugar de:
broker_host="broker.hivemq.com"
# Usar:
broker_host="tu-broker.com"
```

## 🔍 Monitoreo y Debug

### Ver Datos en Tiempo Real:

```bash
# Usar cliente MQTT de línea de comandos (si está instalado)
mosquitto_sub -h broker.hivemq.com -t "GRUPO1/sensores/#" -v
```

### Publicar Manualmente:

```bash
# Publicar un mensaje específico
mosquitto_pub -h broker.hivemq.com -t "GRUPO1/sensores/test/temperatura" -m '{"valor":25.0,"timestamp":"2024-01-15T14:30:00","dispositivo":"test","sensor":"temperatura","unidad":"°C"}'
```

### Ver Base de Datos:

```bash
# Entrar al modo desarrollo
./dev.sh

# Conectar a SQLite
sqlite3 mqtt/sensor_data.db

# Ver datos
SELECT * FROM lecturas_sensores ORDER BY fecha_recepcion DESC LIMIT 10;
```

## 🛠️ Casos de Uso Reales

### 1. Monitoreo Ambiental
```
GRUPO1/sensores/exterior/temperatura
GRUPO1/sensores/exterior/humedad
GRUPO1/sensores/interior/co2
```

### 2. Sistema de Riego
```
GRUPO1/sensores/huerto/humedad_suelo
GRUPO1/actuadores/huerto/bomba_agua
GRUPO1/sensores/huerto/nivel_tanque
```

### 3. Seguridad
```
GRUPO1/sensores/puerta_principal/movimiento
GRUPO1/sensores/ventana_1/apertura
GRUPO1/actuadores/alarma/estado
```

## ⚠️ Consideraciones de Seguridad

Para producción:

1. **Autenticación**: Usar usuario/contraseña
2. **Encriptación**: TLS/SSL (puerto 8883)
3. **Autorización**: Restringir tópicos por cliente
4. **Validación**: Verificar formato de datos

```python
# Ejemplo con autenticación
client.username_pw_set("usuario", "contraseña")
client.tls_set()  # Habilitar TLS
```

## 🔧 Troubleshooting

### Error de Conexión:
- Verificar conectividad a internet
- Probar con broker público diferente
- Revisar firewall/proxy

### Mensajes No Llegan:
- Verificar tópicos (case-sensitive)
- Comprobar QoS
- Revisar wildcards en subscriber

### Performance:
- Ajustar intervalo de publicación
- Usar QoS 0 para datos no críticos
- Implementar retain para estados importantes

## 📚 Recursos Adicionales

- [MQTT.org](https://mqtt.org/) - Especificación oficial
- [Paho MQTT Python](https://pypi.org/project/paho-mqtt/) - Librería usada
- [HiveMQ](https://www.hivemq.com/) - Broker público para pruebas
- [MQTT Explorer](http://mqtt-explorer.com/) - Cliente gráfico 