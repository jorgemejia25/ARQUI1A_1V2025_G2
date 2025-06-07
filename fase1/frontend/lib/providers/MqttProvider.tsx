/**
 * MqttProvider - Provider for global MQTT connection management
 *
 * Maintains MQTT connection active throughout the entire dashboard application.
 * Integrates with the system store to provide real-time system status updates.
 */

"use client";

import { createContext, useContext, useState } from "react";

import { useMqtt } from "@/app/mqtt-sensors/useMqtt";
import { useSystemMonitor } from "@/hooks/useSystemMonitor";

interface MqttContextType {
  isConnected: boolean;
  connectionStatus: string;
  reconnect: () => void;
  publishCommand: (topic: string, payload: any) => boolean;
}

const MqttContext = createContext<MqttContextType | undefined>(undefined);

interface MqttProviderProps {
  children: React.ReactNode;
}

export function MqttProvider({ children }: MqttProviderProps) {
  // Inicializar monitoreo del sistema
  useSystemMonitor();

  // Estado local para los switches de sensores (se podría mover al store también)
  const [sensorStates, setSensorStates] = useState({
    temperature: true,
    humidity: true,
    distance: true,
    light: true,
    air_quality: true,
  });

  // Hook MQTT con configuración global
  const { isConnected, connectionStatus, reconnect, publishCommand } = useMqtt(
    "ws://localhost:9001", // Mosquitto WebSocket local
    [
      "siepa/sensors",
      "siepa/sensors/+",
      "siepa/actuators/+",
      "siepa/status/sensors/+",
    ],
    (sensorType: string, enabled: boolean) => {
      setSensorStates((prev) => ({
        ...prev,
        [sensorType]: enabled,
      }));
    }
  );

  const contextValue: MqttContextType = {
    isConnected,
    connectionStatus,
    reconnect,
    publishCommand,
  };

  return (
    <MqttContext.Provider value={contextValue}>{children}</MqttContext.Provider>
  );
}

// Hook para usar el contexto MQTT
export function useMqttContext() {
  const context = useContext(MqttContext);
  if (context === undefined) {
    throw new Error("useMqttContext must be used within a MqttProvider");
  }
  return context;
}

// Hook opcional para obtener estados de sensores (si se necesita)
export function useSensorStates() {
  // Este podría moverse al store también si es necesario
  return useState({
    temperature: true,
    humidity: true,
    distance: true,
    light: true,
    air_quality: true,
  });
}
