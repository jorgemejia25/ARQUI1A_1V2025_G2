const mqtt = require("mqtt");

// Configuración del cliente para usar WebSocket (compatible con el navegador)
const brokerUrl = "wss://broker.hivemq.com:8884/mqtt";

const options = {
  keepalive: 60,
  clientId: `mqtt_sender_${Math.random().toString(16).substr(2, 8)}`,
  protocolId: "MQTT",
  protocolVersion: 4,
  clean: true,
  reconnectPeriod: 1000,
  connectTimeout: 30 * 1000,
};

// Conectar al broker MQTT
console.log(`🔄 Conectando a ${brokerUrl}...`);
const client = mqtt.connect(brokerUrl, options);

// Datos de prueba para diferentes sensores
const sensorsData = [
  {
    topic: "GRUPO2/sensores/temperatura/ambiente",
    getData: () => ({
      valor: parseFloat((20 + Math.random() * 15).toFixed(1)),
      unidad: "°C",
    }),
  },
  {
    topic: "GRUPO2/sensores/humedad/ambiente",
    getData: () => ({
      valor: parseFloat((40 + Math.random() * 40).toFixed(1)),
      unidad: "%",
    }),
  },
  {
    topic: "GRUPO2/sensores/presion/atmosferica",
    getData: () => ({
      valor: parseFloat((990 + Math.random() * 40).toFixed(1)),
      unidad: "hPa",
    }),
  },
  {
    topic: "GRUPO2/sensores/luz/ambiente",
    getData: () => ({
      valor: Math.floor(Math.random() * 1000),
      unidad: "lux",
    }),
  },
  {
    topic: "GRUPO2/sensores/sonido/ambiente",
    getData: () => ({
      valor: parseFloat((30 + Math.random() * 50).toFixed(1)),
      unidad: "dB",
    }),
  },
  {
    topic: "GRUPO2/sensores/movimiento/detectado",
    getData: () => ({
      valor: Math.random() > 0.7 ? 1 : 0,
      unidad: "bool",
    }),
  },
];

client.on("connect", () => {
  console.log("✅ Cliente de prueba conectado al broker MQTT!");
  console.log("🚀 Iniciando envío de datos de prueba...\n");

  // Enviar datos cada 5 segundos
  const interval = setInterval(() => {
    // Seleccionar un sensor aleatorio
    const sensor = sensorsData[Math.floor(Math.random() * sensorsData.length)];
    const data = sensor.getData();

    const message = JSON.stringify(data);

    client.publish(sensor.topic, message, { qos: 0 }, (err) => {
      if (err) {
        console.error("❌ Error al publicar:", err);
      } else {
        console.log(`📤 ${sensor.topic}: ${data.valor} ${data.unidad}`);
      }
    });
  }, 5000);

  // Enviar ráfaga inicial de datos
  sensorsData.forEach((sensor, index) => {
    setTimeout(() => {
      const data = sensor.getData();
      const message = JSON.stringify(data);

      client.publish(sensor.topic, message, { qos: 0 }, (err) => {
        if (err) {
          console.error("❌ Error al publicar:", err);
        } else {
          console.log(`📤 ${sensor.topic}: ${data.valor} ${data.unidad}`);
        }
      });
    }, index * 1000);
  });

  // Guardar el interval para poder limpiarlo
  global.sensorInterval = interval;
});

client.on("error", (error) => {
  console.error("❌ Error de conexión:", error);
});

client.on("close", () => {
  console.log("🔌 Conexión cerrada");
});

client.on("reconnect", () => {
  console.log("🔄 Reintentando conexión...");
});

// Manejar cierre limpio
process.on("SIGINT", () => {
  console.log("\n🛑 Cerrando cliente de prueba...");

  if (global.sensorInterval) {
    clearInterval(global.sensorInterval);
  }

  client.end(() => {
    console.log("✅ Cliente desconectado correctamente");
    process.exit(0);
  });
});

console.log("🔄 Intentando conectar al broker MQTT WebSocket...");
console.log("📍 Broker: broker.hivemq.com:8884/mqtt");
console.log("📡 Tópicos: GRUPO2/sensores/*/");
console.log("⏹️  Presiona Ctrl+C para detener el envío de datos\n");
