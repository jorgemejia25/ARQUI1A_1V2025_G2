/**
 * MqttProvider - Provider for global MQTT connection management
 *
 * Maintains MQTT connection active throughout the entire dashboard application.
 * Integrates with the system store to provide real-time system status updates.
 */

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import mqtt from "mqtt";

// Tipos optimizados
export interface SensorData {
  topic: string;
  timestamp: Date;
  value: any;
  complete_data?: any;
}

interface MqttContextType {
  isConnected: boolean;
  sensorData: SensorData[];
  connectionStatus: string;
  clearData: () => void;
  reconnect: () => void;
  publishCommand: (topic: string, payload: any) => boolean;
  requestHistoricalData: (sensorType?: string, maxPoints?: number) => boolean;
  dataQuality: number;
  lastDataTime: Date | null;
  connectionLatency: number;
}

const MqttContext = createContext<MqttContextType | undefined>(undefined);

// Configuración optimizada para Raspberry Pi
const MQTT_CONFIG = {
  brokerUrl: "wss://broker.hivemq.com:8884/mqtt",
  options: {
    clientId: `siepa_frontend_${Math.random().toString(16).substr(2, 8)}`,
    clean: true,
    connectTimeout: 10000, // 10 segundos
    reconnectPeriod: 5000, // 5 segundos
    keepalive: 30, // 30 segundos
    protocolVersion: 4,
    queueQoSZero: false, // No acumular mensajes QoS 0
    reschedulePings: true,
    maxReconnectAttempts: 10, // Máximo 10 intentos
  },
  topics: {
    sensors: "GRUPO2/sensores/rasp01/+",
    sensorsMain: "GRUPO2/sensores/rasp01",
    history: "GRUPO2/history/rasp01",
    system: "GRUPO2/status/rasp01/+",
    commands: "GRUPO2/commands/rasp01/+",
    buzzer: "GRUPO2/actuadores/rasp01/buzzer",
    systemCmd: "GRUPO2/commands/rasp01/system",
    sensorsEnable: "GRUPO2/commands/rasp01/sensors/enable",
    actuators: "GRUPO2/actuadores/rasp01/+",
    actuatorsMain: "GRUPO2/actuadores/rasp01",
  },
  dataRetentionLimit: 500, // Máximo 500 mensajes en memoria
  debounceTime: 100, // 100ms debounce
  maxBufferSize: 50, // Buffer máximo de 50 mensajes
};

// Hook para debouncing optimizado
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

export function MqttProvider({ children }: { children: React.ReactNode }) {
  // Estados principales
  const [isConnected, setIsConnected] = useState(false);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [connectionStatus, setConnectionStatus] = useState("Desconectado");
  const [lastDataTime, setLastDataTime] = useState<Date | null>(null);
  const [connectionLatency, setConnectionLatency] = useState<number>(0);

  // Referencias para optimización
  const clientRef = useRef<mqtt.MqttClient | null>(null);
  const messageBufferRef = useRef<SensorData[]>([]);
  const lastFlushRef = useRef<number>(Date.now());
  const pingStartRef = useRef<number>(0);
  const reconnectAttemptsRef = useRef<number>(0);

  // Buffer de mensajes con debounce
  const debouncedBuffer = useDebounce(
    messageBufferRef.current,
    MQTT_CONFIG.debounceTime
  );

  // Función para limpiar datos antiguos (optimización de memoria)
  const cleanupOldData = useCallback(() => {
    setSensorData((prevData) => {
      if (prevData.length <= MQTT_CONFIG.dataRetentionLimit) return prevData;

      console.log(
        `🧹 Limpiando datos antiguos: ${prevData.length} -> ${MQTT_CONFIG.dataRetentionLimit}`
      );
      return prevData.slice(-MQTT_CONFIG.dataRetentionLimit);
    });
  }, []);

  // Función para procesar buffer de mensajes
  const flushMessageBuffer = useCallback(() => {
    if (messageBufferRef.current.length === 0) return;

    const now = Date.now();
    const messages = [...messageBufferRef.current];
    messageBufferRef.current = [];
    lastFlushRef.current = now;

    setSensorData((prevData) => {
      const newData = [...prevData, ...messages];
      // Optimización: mantener solo los últimos N mensajes
      if (newData.length > MQTT_CONFIG.dataRetentionLimit) {
        return newData.slice(-MQTT_CONFIG.dataRetentionLimit);
      }
      return newData;
    });

    if (messages.length > 0) {
      setLastDataTime(new Date());
    }
  }, []);

  // Efecto para flush periódico del buffer
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastFlushRef.current > MQTT_CONFIG.debounceTime) {
        flushMessageBuffer();
      }
    }, MQTT_CONFIG.debounceTime);

    return () => clearInterval(interval);
  }, [flushMessageBuffer]);

  // Efecto para limpieza periódica de memoria
  useEffect(() => {
    const interval = setInterval(cleanupOldData, 30000); // Cada 30 segundos
    return () => clearInterval(interval);
  }, [cleanupOldData]);

  // Función para conectar con optimizaciones
  const connect = useCallback(() => {
    if (clientRef.current?.connected) {
      console.log("✅ Ya conectado a MQTT");
      return;
    }

    setConnectionStatus("Conectando...");

    try {
      const client = mqtt.connect(MQTT_CONFIG.brokerUrl, MQTT_CONFIG.options);
      clientRef.current = client;

      client.on("connect", () => {
        console.log("✅ Conectado al broker MQTT optimizado");
        setIsConnected(true);
        setConnectionStatus("Conectado");
        reconnectAttemptsRef.current = 0;

        // Suscribirse a tópicos con QoS optimizado
        Object.values(MQTT_CONFIG.topics).forEach((topic) => {
          client.subscribe(topic, { qos: 0 }, (err) => {
            if (err) {
              console.error(`❌ Error suscribiendo a ${topic}:`, err);
            } else {
              console.log(`📡 Suscrito a ${topic}`);
            }
          });
        });

        // Iniciar medición de latencia
        pingStartRef.current = Date.now();
        client.publish(
          "GRUPO2/ping/rasp01",
          JSON.stringify({ timestamp: Date.now() }),
          { qos: 0 }
        );
      });

      client.on("message", (topic, message) => {
        try {
          const data = JSON.parse(message.toString());

          // Medir latencia si es un ping
          if (topic === "GRUPO2/pong/rasp01" && pingStartRef.current > 0) {
            const latency = Date.now() - pingStartRef.current;
            setConnectionLatency(latency);
            pingStartRef.current = 0;
            return;
          }

          const sensorMessage: SensorData = {
            topic,
            timestamp: new Date(),
            value: data.valor || data.value || data,
            complete_data: data,
          };

          // Agregar al buffer en lugar de directamente al estado
          messageBufferRef.current.push(sensorMessage);

          // Flush inmediato si el buffer está lleno
          if (messageBufferRef.current.length >= MQTT_CONFIG.maxBufferSize) {
            flushMessageBuffer();
          }
        } catch (error) {
          console.warn(`⚠️ Error procesando mensaje de ${topic}:`, error);
        }
      });

      client.on("disconnect", () => {
        console.log("📡 Desconectado del broker MQTT");
        setIsConnected(false);
        setConnectionStatus("Desconectado");
      });

      client.on("offline", () => {
        console.log("📴 Cliente MQTT offline");
        setIsConnected(false);
        setConnectionStatus("Fuera de línea");
      });

      client.on("error", (error) => {
        console.error("❌ Error MQTT:", error);
        setIsConnected(false);
        setConnectionStatus(`Error: ${error.message}`);

        reconnectAttemptsRef.current++;
        if (
          reconnectAttemptsRef.current >=
          MQTT_CONFIG.options.maxReconnectAttempts
        ) {
          console.error("❌ Máximo número de reconexiones alcanzado");
          client.end();
        }
      });

      client.on("reconnect", () => {
        console.log("🔄 Intentando reconectar...");
        setConnectionStatus("Reconectando...");
      });
    } catch (error) {
      console.error("❌ Error al conectar MQTT:", error);
      setConnectionStatus(`Error de conexión: ${error}`);
    }
  }, [flushMessageBuffer]);

  // Funciones de utilidad optimizadas
  const clearData = useCallback(() => {
    setSensorData([]);
    messageBufferRef.current = [];
    setLastDataTime(null);
    console.log("🗑️ Datos limpiados");
  }, []);

  const reconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.end();
      clientRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
    setTimeout(connect, 1000);
  }, [connect]);

  const publishCommand = useCallback((topic: string, payload: any): boolean => {
    if (!clientRef.current?.connected) {
      console.error("⚠️ No conectado a MQTT");
      return false;
    }

    try {
      const message =
        typeof payload === "string" ? payload : JSON.stringify(payload);
      const result = clientRef.current.publish(topic, message, { qos: 1 });

      if (result) {
        console.log(`📤 Comando enviado a ${topic}`);
        return true;
      } else {
        console.error(`❌ Error enviando comando a ${topic}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error publicando en ${topic}:`, error);
      return false;
    }
  }, []);

  // Sistema simplificado - Ya no solicita datos históricos del backend
  // Los datos se manejan en tiempo real únicamente
  const requestHistoricalData = useCallback(
    (sensorType?: string, maxPoints?: number): boolean => {
      console.log("ℹ️ Sistema simplificado - Sin solicitud de historial");
      console.log(
        "📊 Los datos históricos se mantienen en memoria del frontend"
      );
      return true; // Simular éxito para evitar errores en el frontend
    },
    []
  );

  // Calcular calidad de datos
  const dataQuality = useMemo(() => {
    if (sensorData.length === 0) return 0;

    const now = Date.now();
    const recentData = sensorData.filter(
      (d) => now - d.timestamp.getTime() < 300000 // Últimos 5 minutos
    );

    const expectedTopics = Object.values(MQTT_CONFIG.topics).length;
    const receivedTopics = new Set(recentData.map((d) => d.topic)).size;

    return Math.round((receivedTopics / expectedTopics) * 100);
  }, [sensorData]);

  // Inicializar conexión
  useEffect(() => {
    connect();

    return () => {
      if (clientRef.current) {
        clientRef.current.end();
        clientRef.current = null;
      }
    };
  }, [connect]);

  // Ping periódico para medir latencia
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      if (clientRef.current?.connected && pingStartRef.current === 0) {
        pingStartRef.current = Date.now();
        clientRef.current.publish(
          "GRUPO2/ping/rasp01",
          JSON.stringify({ timestamp: Date.now() }),
          { qos: 0 }
        );
      }
    }, 30000); // Cada 30 segundos

    return () => clearInterval(interval);
  }, [isConnected]);

  const value: MqttContextType = {
    isConnected,
    sensorData,
    connectionStatus,
    clearData,
    reconnect,
    publishCommand,
    requestHistoricalData,
    dataQuality,
    lastDataTime,
    connectionLatency,
  };

  return <MqttContext.Provider value={value}>{children}</MqttContext.Provider>;
}

export function useMqttContext() {
  const context = useContext(MqttContext);
  if (context === undefined) {
    throw new Error("useMqttContext debe usarse dentro de un MqttProvider");
  }
  return context;
}
