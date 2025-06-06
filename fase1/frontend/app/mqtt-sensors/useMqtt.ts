import mqtt, { MqttClient } from "mqtt";
import { useCallback, useEffect, useState } from "react";

interface SensorData {
  topic: string;
  valor: number;
  unidad: string;
  timestamp: string;
}

interface UseMqttReturn {
  isConnected: boolean;
  sensorData: SensorData[];
  connectionStatus: string;
  clearData: () => void;
  reconnect: () => void;
}

export const useMqtt = (
  brokerUrl: string = "wss://broker.hivemq.com:8884/mqtt",
  topic: string = "GRUPO2/sensores/+/+"
): UseMqttReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [connectionStatus, setConnectionStatus] = useState("Desconectado");
  const [client, setClient] = useState<MqttClient | null>(null);

  const clearData = useCallback(() => {
    setSensorData([]);
  }, []);

  const connect = useCallback(() => {
    if (client) {
      client.end();
    }

    // Configuración específica para WebSocket en navegador
    const options = {
      keepalive: 60,
      clientId: `mqtt_client_${Math.random().toString(16).substr(2, 8)}`,
      protocolId: "MQTT",
      protocolVersion: 4,
      clean: true,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
      will: {
        topic: "WillMsg",
        payload: "Connection Closed abnormally.!",
        qos: 0,
        retain: false,
      },
    };

    console.log(`🔄 Conectando a ${brokerUrl}...`);
    const newClient = mqtt.connect(brokerUrl, options);
    setClient(newClient);

    newClient.on("connect", () => {
      console.log("✅ Conectado al broker MQTT!");
      setIsConnected(true);
      setConnectionStatus("Conectado");

      newClient.subscribe(topic, (err) => {
        if (err) {
          console.error("Error al suscribirse:", err);
          setConnectionStatus("Error en suscripción");
        } else {
          console.log(`📡 Suscrito a ${topic}`);
          setConnectionStatus("Conectado y suscrito");
        }
      });
    });

    newClient.on("message", (receivedTopic, message) => {
      try {
        const data = JSON.parse(message.toString());
        const newSensorData: SensorData = {
          topic: receivedTopic,
          valor: data.valor,
          unidad: data.unidad,
          timestamp: new Date().toLocaleString(),
        };

        console.log(`📥 ${receivedTopic}: ${data.valor} ${data.unidad}`);

        setSensorData((prevData) => [newSensorData, ...prevData.slice(0, 49)]);
      } catch (error) {
        console.error("Error al parsear mensaje MQTT:", error);
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
  }, [brokerUrl, topic, client]);

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
  };
};
