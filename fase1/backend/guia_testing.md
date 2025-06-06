# Guía Testing - Arqui 1

## Instalación Rápida

### 1. Instalar Mosquitto MQTT
```bash
# Instalar broker MQTT
sudo apt update
sudo apt install mosquitto mosquitto-clients -y

# Configurar WebSocket para frontend
sudo tee /etc/mosquitto/conf.d/websocket.conf << 'EOF'
listener 1883 127.0.0.1
protocol mqtt

listener 9001 127.0.0.1  
protocol websockets
allow_anonymous true
EOF

# Iniciar y habilitar el servicio
sudo systemctl enable mosquitto
sudo systemctl start mosquitto
```

### 2. Instalar Dependencia Python MQTT
```bash
# Solo necesitamos paho-mqtt para las pruebas
sudo apt install python3-paho-mqtt -y
```

##  Ejecución del Backend

### 1. Verificar Mosquitto
```bash
# Verificar que está corriendo
sudo systemctl status mosquitto

# Debe mostrar "active (running)"
```

### 2. Probar Conexión MQTT
```bash
# En terminal 1: Escuchar mensajes
mosquitto_sub -h localhost -t "siepa/#"

# En terminal 2: Enviar mensaje de prueba
mosquitto_pub -h localhost -t "siepa/test" -m "Hola MQTT"
```

### 3. Ejecutar Backend SIEPA (Modo Testing)
```bash
cd backend

# Prueba rápida (10 segundos)
python3 demo_mosquitto.py test

# Prueba extendida (60 segundos)
python3 demo_mosquitto.py testing 60

# Ejecución continua hasta Ctrl+C
python3 demo_mosquitto.py testing
```
