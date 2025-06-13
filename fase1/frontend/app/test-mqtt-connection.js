// Test simple de conexión MQTT desde el navegador
// Abrir este archivo como página web para probar la conexión

const testMqttConnection = () => {
  console.log("🧪 INICIANDO PRUEBA DE CONEXIÓN MQTT");

  // Usar la biblioteca MQTT.js desde CDN
  const script = document.createElement("script");
  script.src = "https://unpkg.com/mqtt@4.3.7/dist/mqtt.min.js";
  script.onload = () => {
    console.log("📦 Biblioteca MQTT.js cargada");

    const brokerUrl = "wss://broker.hivemq.com:8884/mqtt";
    console.log(`🔗 Intentando conectar a: ${brokerUrl}`);

    const options = {
      clientId: `test_frontend_${Math.random().toString(16).substr(2, 8)}`,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 15000,
      keepalive: 60,
    };

    console.log("⚙️ Opciones de conexión:", options);

    try {
      const client = mqtt.connect(brokerUrl, options);

      client.on("connect", () => {
        console.log("✅ ¡CONECTADO AL BROKER MQTT!");

        // Probar suscripción
        client.subscribe("siepa/test", (err) => {
          if (err) {
            console.error("❌ Error suscribiendo:", err);
          } else {
            console.log("📡 Suscrito a siepa/test");

            // Probar envío de mensaje
            client.publish(
              "siepa/test",
              JSON.stringify({
                test: true,
                timestamp: Date.now(),
                source: "test_script",
              }),
              (err) => {
                if (err) {
                  console.error("❌ Error enviando mensaje:", err);
                } else {
                  console.log("📤 Mensaje de prueba enviado");
                }
              }
            );
          }
        });

        // Probar historial
        setTimeout(() => {
          console.log("🔍 Probando comando de historial...");
          client.publish(
            "siepa/commands/history",
            JSON.stringify({
              sensor_type: "all",
              max_points: 10,
              timestamp: new Date().toISOString(),
              source: "test_script",
            }),
            (err) => {
              if (err) {
                console.error("❌ Error enviando comando de historial:", err);
              } else {
                console.log("📤 Comando de historial enviado");
              }
            }
          );
        }, 2000);
      });

      client.on("message", (topic, message) => {
        console.log(`📥 Mensaje recibido en ${topic}:`, message.toString());
        try {
          const parsed = JSON.parse(message.toString());
          console.log("📊 Datos parseados:", parsed);
        } catch (e) {
          console.log("📊 Mensaje como texto:", message.toString());
        }
      });

      client.on("error", (error) => {
        console.error("❌ Error MQTT:", error);
      });

      client.on("close", () => {
        console.log("🔌 Conexión cerrada");
      });

      client.on("disconnect", () => {
        console.log("📡 Desconectado");
      });

      client.on("offline", () => {
        console.log("📴 Offline");
      });

      client.on("reconnect", () => {
        console.log("🔄 Reconectando...");
      });
    } catch (error) {
      console.error("❌ Error creando cliente:", error);
    }
  };

  document.head.appendChild(script);
};

// Auto-ejecutar cuando se carga la página
if (typeof window !== "undefined") {
  window.addEventListener("load", testMqttConnection);
}

console.log(
  "📝 Script de prueba MQTT cargado. La prueba iniciará cuando se cargue la página."
);
