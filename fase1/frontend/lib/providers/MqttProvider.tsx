/**
 * MqttProvider - Provider for global MQTT connection management
 *
 * Maintains MQTT connection active throughout the entire dashboard application.
 * Integrates with the system store to provide real-time system status updates.
 */

"use client";

import { createContext, useContext } from "react";

import { useMqtt } from "@/app/mqtt-sensors/useMqtt";
import { useSystemMonitor } from "@/hooks/useSystemMonitor";
import { useSystemStore } from "@/lib/store/useSystemStore";

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

  // Hook MQTT con configuración global
  const { isConnected, connectionStatus, reconnect, publishCommand } = useMqtt(
    "wss://broker.hivemq.com:8884/mqtt", // Broker HiveMQ público para pruebas
    [
      "siepa/sensors",
      "siepa/sensors/+",
      "siepa/actuators/+",
      "siepa/status/sensors/+",
    ],
    (sensorType: string, enabled: boolean) => {
      // Aquí podrías integrar con el store si necesitas mantener el estado de los sensores
      console.log(
        `📊 Estado del sensor ${sensorType}: ${enabled ? "HABILITADO" : "DESHABILITADO"}`
      );
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
