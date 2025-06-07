import mqtt, { MqttClient } from "mqtt";
import { useCallback, useEffect, useState } from "react";

import { useSystemStore } from "@/lib/store/useSystemStore";

interface SensorData {
  topic: string;
  valor: any;
  unidad: string;
  timestamp: string;
  sensor_type?: string;
  complete_data?: any;
  evaluationType?: string;
  evalValue?: number;
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

  // Integrar con el store del sistema
  const {
    updateConnectionStatus,
    addSensorData,
    clearSensorData: clearStoreData,
  } = useSystemStore();

  const clearData = useCallback(() => {
    setSensorData([]);
    clearStoreData();
  }, [clearStoreData]);

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
        return {
          unidad: "°C",
          sensor_type: "Temperatura",
          evaluationType: "temperature", // Para usar en evaluateRisk
        };
      case "humidity":
        return {
          unidad: "%",
          sensor_type: "Humedad",
          evaluationType: "humidity",
        };
      case "distance":
        return {
          unidad: "cm",
          sensor_type: "Distancia",
          evaluationType: "distance",
        };
      case "light":
        return {
          unidad: value ? "Detectada" : "No detectada",
          sensor_type: "Luz",
          evaluationType: "light",
        };
      case "air_quality":
        return {
          unidad: value ? "Malo" : "Bueno",
          sensor_type: "Calidad del Aire",
          evaluationType: "air_quality",
        };
      case "buzzer":
        return {
          unidad: value ? "Activado" : "Desactivado",
          sensor_type: "Buzzer",
          evaluationType: null, // No evaluar riesgos
        };
      case "status":
        return {
          unidad: "Estado",
          sensor_type: "Estado del Sistema",
          evaluationType: null, // No evaluar riesgos
        };
      default:
        return {
          unidad: "",
          sensor_type: "Sensor",
          evaluationType: null,
        };
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
      updateConnectionStatus(true, "Conectado");

      // Suscribirse a todos los tópicos SIEPA
      topics.forEach((topic) => {
        newClient.subscribe(topic, (err) => {
          if (err) {
            console.error(`Error al suscribirse a ${topic}:`, err);
            setConnectionStatus("Error en suscripción");
            updateConnectionStatus(false, "Error en suscripción");
          } else {
            console.log(`📡 Suscrito a ${topic}`);
          }
        });
      });

      setConnectionStatus("Conectado y suscrito");
      updateConnectionStatus(true, "Conectado y suscrito");
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
          const { unidad, sensor_type, evaluationType } = getUnitsAndSensorType(
            receivedTopic,
            parsedData
          );

          const sensorValue =
            typeof parsedData === "object"
              ? parsedData.state !== undefined
                ? parsedData.state
                : parsedData.value !== undefined
                  ? parsedData.value
                  : JSON.stringify(parsedData)
              : parsedData;

          newSensorData = {
            topic: receivedTopic,
            valor: sensorValue,
            unidad,
            timestamp: new Date().toLocaleString(),
            sensor_type,
          };

          // Almacenar info para evaluación de riesgo
          if (evaluationType) {
            let evalValue = sensorValue;

            // Para air_quality, convertir booleano a número si es necesario
            if (evaluationType === "air_quality") {
              if (typeof parsedData === "boolean") {
                evalValue = parsedData ? 1 : 0;
              } else if (typeof sensorValue === "string") {
                evalValue =
                  sensorValue.toLowerCase() === "malo" || sensorValue === "1"
                    ? 1
                    : 0;
              }
            }

            // Agregar info de evaluación al objeto de datos
            newSensorData.evaluationType = evaluationType;
            newSensorData.evalValue = evalValue;
          }
        }

        console.log(
          `📥 ${receivedTopic}: ${newSensorData.valor} ${newSensorData.unidad}`
        );

        setSensorData((prevData) => [newSensorData, ...prevData.slice(0, 49)]);
        addSensorData(newSensorData);
      } catch (error) {
        console.error("Error al procesar mensaje MQTT:", error);
      }
    });

    newClient.on("error", (error) => {
      console.error("Error de conexión MQTT:", error);
      setConnectionStatus("Error de conexión");
      setIsConnected(false);
      updateConnectionStatus(false, "Error de conexión");
    });

    newClient.on("close", () => {
      console.log("Conexión MQTT cerrada");
      setConnectionStatus("Conexión cerrada");
      setIsConnected(false);
      updateConnectionStatus(false, "Conexión cerrada");
    });

    newClient.on("reconnect", () => {
      console.log("Reintentando conexión MQTT...");
      setConnectionStatus("Reconectando...");
      updateConnectionStatus(false, "Reconectando...");
    });

    newClient.on("disconnect", () => {
      console.log("Desconectado del broker MQTT");
      setConnectionStatus("Desconectado");
      setIsConnected(false);
      updateConnectionStatus(false, "Desconectado");
    });

    newClient.on("offline", () => {
      console.log("Cliente MQTT offline");
      setConnectionStatus("Offline");
      setIsConnected(false);
      updateConnectionStatus(false, "Offline");
    });

    return newClient;
  }, [brokerUrl, topics, client, updateConnectionStatus]);

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
