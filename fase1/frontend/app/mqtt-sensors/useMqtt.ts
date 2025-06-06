import mqtt, { MqttClient } from "mqtt";
import { useCallback, useEffect, useState } from "react";

interface SensorData {
  topic: string;
  valor: any;
  unidad: string;
  timestamp: string;
  sensor_type?: string;
  complete_data?: any;
}

interface UseMqttReturn {
  isConnected: boolean;
  sensorData: SensorData[];
  connectionStatus: string;
  clearData: () => void;
  reconnect: () => void;
  publishCommand: (topic: string, payload: any) => boolean;
}

export const useMqtt = (
  brokerUrl: string = "ws://localhost:9001", // Mosquitto WebSocket local
  topics: string[] = [
    "siepa/sensors",
    "siepa/sensors/+",
    "siepa/actuators/+",
    "siepa/status/sensors/+",
  ],
  onStatusMessage?: (sensorType: string, enabled: boolean) => void
): UseMqttReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [connectionStatus, setConnectionStatus] = useState("Desconectado");
  const [client, setClient] = useState<MqttClient | null>(null);

  const clearData = useCallback(() => {
    setSensorData([]);
  }, []);

  const publishCommand = useCallback(
    (topic: string, payload: any): boolean => {
      if (!client || !isConnected) {
        console.error("⚠️ Cliente MQTT no conectado");
        return false;
      }

      try {
        const message =
          typeof payload === "string" ? payload : JSON.stringify(payload);
        const result = client.publish(topic, message, { qos: 1 });

        if (result) {
          console.log(`📤 Comando enviado a ${topic}:`, payload);
          return true;
        } else {
          console.error(`❌ Error enviando comando a ${topic}`);
          return false;
        }
      } catch (error) {
        console.error(`❌ Error publicando comando:`, error);
        return false;
      }
    },
    [client, isConnected]
  );

  const getUnitsAndSensorType = (topic: string, value: any) => {
    const topicParts = topic.split("/");
    const sensorType = topicParts[topicParts.length - 1];

    switch (sensorType) {
      case "temperature":
        return { unidad: "°C", sensor_type: "Temperatura" };
      case "humidity":
        return { unidad: "%", sensor_type: "Humedad" };
      case "distance":
        return { unidad: "cm", sensor_type: "Distancia" };
      case "light":
        return {
          unidad: value ? "Detectada" : "No detectada",
          sensor_type: "Luz",
        };
      case "air_quality":
        return {
          unidad: value ? "Malo" : "Bueno",
          sensor_type: "Calidad del Aire",
        };
      case "buzzer":
        return {
          unidad: value ? "Activado" : "Desactivado",
          sensor_type: "Buzzer",
        };
      case "status":
        return {
          unidad: "Estado",
          sensor_type: "Estado del Sistema",
        };
      default:
        return { unidad: "", sensor_type: "Sensor" };
    }
  };

  const connect = useCallback(() => {
    if (client) {
      client.end();
    }

    // Configuración para conexión WebSocket local a Mosquitto
    const options = {
      keepalive: 60,
      clientId: `siepa_frontend_${Math.random().toString(16).substr(2, 8)}`,
      protocolId: "MQTT" as const,
      protocolVersion: 4 as const,
      clean: true,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
      will: {
        topic: "siepa/frontend/status",
        payload: "Frontend desconectado",
        qos: 0 as const,
        retain: false,
      },
    };

    console.log(`🔄 Conectando a Mosquitto local en ${brokerUrl}...`);
    const newClient = mqtt.connect(brokerUrl, options);
    setClient(newClient);

    newClient.on("connect", () => {
      console.log("✅ Conectado al broker Mosquitto local!");
      setIsConnected(true);
      setConnectionStatus("Conectado");

      // Suscribirse a todos los tópicos SIEPA
      topics.forEach((topic) => {
        newClient.subscribe(topic, (err) => {
          if (err) {
            console.error(`Error al suscribirse a ${topic}:`, err);
            setConnectionStatus("Error en suscripción");
          } else {
            console.log(`📡 Suscrito a ${topic}`);
          }
        });
      });

      setConnectionStatus("Conectado y suscrito");
    });

    newClient.on("message", (receivedTopic, message) => {
      try {
        const messageStr = message.toString();
        let parsedData;

        // Intentar parsear como JSON, sino usar como string directo
        try {
          parsedData = JSON.parse(messageStr);
        } catch {
          parsedData = messageStr;
        }

        // Manejar mensajes de estado de sensores
        if (
          receivedTopic.startsWith("siepa/status/sensors/") &&
          onStatusMessage
        ) {
          const sensorType = receivedTopic.split("/").pop();
          if (sensorType && parsedData.enabled !== undefined) {
            onStatusMessage(sensorType, parsedData.enabled);
            console.log(
              `📊 Estado del sensor ${sensorType}: ${parsedData.enabled ? "HABILITADO" : "DESHABILITADO"}`
            );
          }
        }

        let newSensorData: SensorData;

        if (
          receivedTopic === "siepa/sensors" &&
          typeof parsedData === "object"
        ) {
          // Datos completos del sistema
          newSensorData = {
            topic: receivedTopic,
            valor: "Datos completos del sistema",
            unidad: "",
            timestamp: new Date().toLocaleString(),
            sensor_type: "Sistema Completo",
            complete_data: parsedData,
          };
        } else {
          // Datos individuales de sensores
          const { unidad, sensor_type } = getUnitsAndSensorType(
            receivedTopic,
            parsedData
          );

          newSensorData = {
            topic: receivedTopic,
            valor:
              typeof parsedData === "object"
                ? parsedData.state !== undefined
                  ? parsedData.state
                  : JSON.stringify(parsedData)
                : parsedData,
            unidad,
            timestamp: new Date().toLocaleString(),
            sensor_type,
          };
        }

        console.log(
          `📥 ${receivedTopic}: ${newSensorData.valor} ${newSensorData.unidad}`
        );

        setSensorData((prevData) => [newSensorData, ...prevData.slice(0, 49)]);
      } catch (error) {
        console.error("Error al procesar mensaje MQTT:", error);
      }
    });

    newClient.on("error", (error) => {
      console.error("Error de conexión MQTT:", error);
      setConnectionStatus("Error de conexión");
      setIsConnected(false);
    });

    newClient.on("close", () => {
      console.log("Conexión MQTT cerrada");
      setConnectionStatus("Conexión cerrada");
      setIsConnected(false);
    });

    newClient.on("reconnect", () => {
      console.log("Reintentando conexión MQTT...");
      setConnectionStatus("Reconectando...");
    });

    newClient.on("disconnect", () => {
      console.log("Desconectado del broker MQTT");
      setConnectionStatus("Desconectado");
      setIsConnected(false);
    });

    newClient.on("offline", () => {
      console.log("Cliente MQTT offline");
      setConnectionStatus("Offline");
      setIsConnected(false);
    });

    return newClient;
  }, [brokerUrl, topics, client]);

  const reconnect = useCallback(() => {
    setConnectionStatus("Reconectando...");
    connect();
  }, [connect]);

  useEffect(() => {
    const mqttClient = connect();

    return () => {
      if (mqttClient) {
        mqttClient.end();
      }
    };
  }, []);

  return {
    isConnected,
    sensorData,
    connectionStatus,
    clearData,
    reconnect,
    publishCommand,
  };
};
