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
  requestHistoricalData: (sensorType?: string, maxPoints?: number) => boolean;
}

export const useMqtt = (
  brokerUrl: string = "wss://broker.hivemq.com:8884/mqtt", // HiveMQ público
  topics: string[] = [
    "GRUPO2/sensores/rasp01",
    "GRUPO2/sensores/rasp01/+",
    "GRUPO2/actuadores/rasp01",
    "GRUPO2/actuadores/rasp01/+",
    "GRUPO2/status/rasp01/sensors/+",
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
      console.log(
        `🔍 Intentando enviar comando - Cliente: ${!!client}, Conectado: ${isConnected}, Tópico: ${topic}`
      );

      if (!client) {
        console.error("⚠️ Cliente MQTT no existe");
        return false;
      }

      // Sincronizar estado si hay discrepancia
      if (client.connected && !isConnected) {
        console.log(
          "🔄 Sincronizando estado - Cliente conectado pero estado interno falso"
        );
        setIsConnected(true);
        setConnectionStatus("Conectado");
        updateConnectionStatus(true, "Conectado");
      }

      if (!client.connected) {
        console.error(
          `⚠️ Cliente MQTT no conectado - Estado interno: ${isConnected}, Estado cliente: ${client.connected}`
        );
        // Intentar reconectar si el estado interno dice que debería estar conectado
        if (isConnected) {
          console.log("🔄 Intentando reconectar automáticamente...");
          connect();
        }
        return false;
      }

      try {
        const message =
          typeof payload === "string" ? payload : JSON.stringify(payload);
        console.log(`📤 Enviando mensaje a ${topic}:`, message);

        const result = client.publish(topic, message, { qos: 1 }, (error) => {
          if (error) {
            console.error(
              `❌ Error en callback de publish para ${topic}:`,
              error
            );
          } else {
            console.log(`✅ Mensaje confirmado enviado a ${topic}`);
          }
        });

        if (result) {
          console.log(`📤 Comando encolado exitosamente para ${topic}`);
          return true;
        } else {
          console.error(`❌ Error al encolar comando para ${topic}`);
          return false;
        }
      } catch (error) {
        console.error(`❌ Excepción enviando comando a ${topic}:`, error);
        return false;
      }
    },
    [client, isConnected]
  );

  const getUnitsAndSensorType = (topic: string, value: any) => {
    const topicParts = topic.split("/");
    const sensorType = topicParts[topicParts.length - 1];

    // Si el valor ya viene con formato del backend (con sensor_type), usarlo directamente
    if (typeof value === "object" && value.sensor_type) {
      return {
        unidad: value.unidad || "",
        sensor_type: value.sensor_type,
        evaluationType: sensorType,
      };
    }

    // Fallback para compatibilidad con formato anterior
    switch (sensorType) {
      case "temperature":
        return {
          unidad: "°C",
          sensor_type: "Temperatura",
          evaluationType: "temperature",
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
          evaluationType: null,
        };
      case "status":
        return {
          unidad: "Estado",
          sensor_type: "Estado del Sistema",
          evaluationType: null,
        };
      case "fan":
      case "motor":
        return {
          unidad:
            value === "ON" || value === "on" || value === true
              ? "Encendido"
              : value === "OFF" || value === "off" || value === false
                ? "Apagado"
                : String(value),
          sensor_type: "Ventilador",
          evaluationType: "fan",
        };
      // Casos en español que el backend podría enviar
      case "temperatura":
        return {
          unidad: "°C",
          sensor_type: "Temperatura",
          evaluationType: "temperature",
        };
      case "humedad":
        return {
          unidad: "%",
          sensor_type: "Humedad",
          evaluationType: "humidity",
        };
      case "distancia":
        return {
          unidad: "cm",
          sensor_type: "Distancia",
          evaluationType: "distance",
        };
      case "luz":
        return {
          unidad: typeof value === "number" ? "lux" : "Estado",
          sensor_type: "Luz",
          evaluationType: "light",
        };
      case "gas":
        return {
          unidad: typeof value === "number" ? "ppm" : "Estado",
          sensor_type: "Calidad del Aire",
          evaluationType: "air_quality",
        };
      case "presion":
        return {
          unidad: "hPa",
          sensor_type: "Presión",
          evaluationType: "pressure",
        };
      case "leds":
        return {
          unidad: "Estado",
          sensor_type: "LEDs",
          evaluationType: "leds",
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
    console.log(
      `🔍 useMqtt connect() llamado - Cliente actual: ${!!client}, Conectado: ${isConnected}`
    );

    if (client && client.connected) {
      console.log("✅ Cliente ya conectado, no reconectar");
      return client;
    }

    if (client) {
      console.log("🔄 Cerrando cliente anterior");
      client.end();
    }

    // Configuración para conexión WebSocket MQTT más robusta
    const options = {
      keepalive: 60,
      clientId: `siepa_frontend_${Math.random().toString(16).substr(2, 8)}`,
      protocolId: "MQTT" as const,
      protocolVersion: 4 as const,
      clean: true,
      reconnectPeriod: 3000, // Reconectar cada 3 segundos
      connectTimeout: 15 * 1000, // Timeout más corto
      rejectUnauthorized: false,
      will: {
        topic: "GRUPO2/frontend/rasp01/status",
        payload: JSON.stringify({
          status: "offline",
          timestamp: Date.now(),
          clientId: `siepa_frontend_${Math.random().toString(16).substr(2, 8)}`,
        }),
        qos: 0 as const,
        retain: false,
      },
    };

    console.log(`🔄 Conectando a broker MQTT en ${brokerUrl}...`);

    let newClient;
    try {
      newClient = mqtt.connect(brokerUrl, options);
      setClient(newClient);
    } catch (error) {
      console.error("❌ Error creando cliente MQTT:", error);
      setConnectionStatus("Error al crear cliente");
      setIsConnected(false);
      updateConnectionStatus(false, "Error al crear cliente");
      return null;
    }

    newClient.on("connect", () => {
      console.log("✅ Conectado al broker MQTT!");
      setIsConnected(true);
      setConnectionStatus("Conectado");
      updateConnectionStatus(true, "Conectado");

      // Verificar estado del cliente después de conectar
      console.log(
        `🔍 Estado post-conexión - Cliente conectado: ${newClient.connected}, Estado interno: true`
      );

      // Suscribirse a todos los tópicos SIEPA con mejor manejo de errores
      let subscriptionCount = 0;
      let successfulSubscriptions = 0;

      const subscribeToTopics = () => {
        topics.forEach((topic, index) => {
          // Añadir un pequeño delay entre suscripciones para evitar sobrecarga
          setTimeout(() => {
            if (newClient.connected) {
              newClient.subscribe(topic, { qos: 0 }, (err) => {
                subscriptionCount++;
                if (err) {
                  console.error(`❌ Error al suscribirse a ${topic}:`, err);
                  if (subscriptionCount === topics.length) {
                    setConnectionStatus(
                      `Conectado (${successfulSubscriptions}/${topics.length} suscripciones)`
                    );
                    updateConnectionStatus(
                      successfulSubscriptions > 0,
                      `Conectado (${successfulSubscriptions}/${topics.length} suscripciones)`
                    );
                  }
                } else {
                  successfulSubscriptions++;
                  console.log(`📡 Suscrito a ${topic}`);
                  if (subscriptionCount === topics.length) {
                    setConnectionStatus("Conectado y suscrito");
                    updateConnectionStatus(true, "Conectado y suscrito");
                  }
                }
              });
            } else {
              console.warn(
                `⚠️ Cliente desconectado, no se puede suscribir a ${topic}`
              );
            }
          }, index * 100); // 100ms de delay entre cada suscripción
        });
      };

      // Ejecutar suscripciones después de una pequeña pausa para asegurar que la conexión esté estable
      setTimeout(subscribeToTopics, 500);
    });

    newClient.on("message", (receivedTopic, message) => {
      try {
        const messageStr = message.toString();
        let parsedData;

        // Log para debugging
        console.log(`📥 MQTT Message received:`, {
          topic: receivedTopic,
          message: messageStr,
        });

        // Intentar parsear como JSON, sino usar como string directo
        try {
          parsedData = JSON.parse(messageStr);
        } catch {
          parsedData = messageStr;
        }

        // Manejar mensajes de estado de sensores
        if (
          receivedTopic.startsWith("GRUPO2/status/rasp01/sensors/") &&
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
          receivedTopic === "GRUPO2/sensores/rasp01" &&
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

          // Si el mensaje viene del nuevo formato del backend
          let sensorValue, sensorUnit, timestamp;
          if (
            typeof parsedData === "object" &&
            parsedData.valor !== undefined
          ) {
            sensorValue = parsedData.valor;
            sensorUnit = parsedData.unidad || unidad;
            timestamp = parsedData.timestamp
              ? new Date(parsedData.timestamp * 1000).toLocaleString()
              : new Date().toLocaleString();
          } else {
            // Formato anterior
            sensorValue =
              typeof parsedData === "object"
                ? parsedData.state !== undefined
                  ? parsedData.state
                  : parsedData.value !== undefined
                    ? parsedData.value
                    : JSON.stringify(parsedData)
                : parsedData;
            sensorUnit = unidad;
            timestamp = new Date().toLocaleString();
          }

          newSensorData = {
            topic: receivedTopic,
            valor: sensorValue,
            unidad: sensorUnit,
            timestamp: timestamp,
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
                  sensorValue.toLowerCase() === "malo" ||
                  sensorValue.toLowerCase() === "mala" ||
                  sensorValue === "1"
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
      console.error("❌ Error de conexión MQTT:", error);
      setConnectionStatus(`Error: ${error.message || "Conexión falló"}`);
      setIsConnected(false);
      updateConnectionStatus(
        false,
        `Error: ${error.message || "Conexión falló"}`
      );
    });

    newClient.on("close", () => {
      console.log("🔌 Conexión MQTT cerrada");
      setConnectionStatus("Conexión cerrada");
      setIsConnected(false);
      updateConnectionStatus(false, "Conexión cerrada");
    });

    newClient.on("reconnect", () => {
      console.log("🔄 Reintentando conexión MQTT...");
      setConnectionStatus("Reconectando...");
      updateConnectionStatus(false, "Reconectando...");
      setIsConnected(false);
    });

    newClient.on("disconnect", (packet) => {
      console.log(
        "📡 Desconectado del broker MQTT",
        packet ? `- Razón: ${packet.reasonCode}` : ""
      );
      setConnectionStatus("Desconectado");
      setIsConnected(false);
      updateConnectionStatus(false, "Desconectado");
    });

    newClient.on("offline", () => {
      console.log("📴 Cliente MQTT offline");
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
    console.log("🔍 useMqtt useEffect ejecutándose - inicializando conexión");

    let mqttClient = null;

    // Solo conectar si no hay cliente o no está conectado
    if (!client || !client.connected) {
      mqttClient = connect();
    } else {
      console.log("✅ Cliente ya existente y conectado, reutilizando");
      mqttClient = client;
    }

    return () => {
      console.log("🔍 useMqtt cleanup ejecutándose");
      // No cerrar automáticamente para mantener conexión entre navegaciones
      // Solo cerrar si realmente se está desmontando todo el provider
    };
  }, []); // Sin dependencias para evitar reconexiones

  const requestHistoricalData = useCallback(
    (sensorType: string = "all", maxPoints: number = 30): boolean => {
      if (!client || !isConnected) {
        console.error("⚠️ Cliente MQTT no conectado");
        return false;
      }

      try {
        const payload = {
          sensor_type: sensorType,
          max_points: maxPoints,
          timestamp: new Date().toISOString(),
          source: "frontend",
        };

        const message = JSON.stringify(payload);
        const result = client.publish(
          "GRUPO2/commands/rasp01/history",
          message,
          {
            qos: 1,
          }
        );

        if (result) {
          console.log(
            `📤 Solicitando historial de ${sensorType} (${maxPoints} puntos)`
          );
          return true;
        } else {
          console.error(`❌ Error solicitando historial`);
          return false;
        }
      } catch (error) {
        console.error(`❌ Error solicitando historial:`, error);
        return false;
      }
    },
    [client, isConnected]
  );

  return {
    isConnected,
    sensorData,
    connectionStatus,
    clearData,
    reconnect,
    publishCommand,
    requestHistoricalData,
  };
};
