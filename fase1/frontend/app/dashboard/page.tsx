/**
 * Dashboard - Main dashboard page component for the SIEPA system
 *
 * The primary dashboard view that provides a comprehensive overview of environmental
 * monitoring and energy consumption. Displays status cards, energy metrics, and
 * system alerts in a responsive grid layout.
 *
 * Features:
 * - Environmental status overview (temperature, humidity, air quality, lighting)
 * - Energy consumption breakdown by category
 * - System alerts and notifications
 * - Responsive layout optimized for all screen sizes
 *
 * @returns The main dashboard page with status overview, energy panel, and alerts
 *
 * @example
 * This component is automatically rendered when navigating to `/dashboard`
 * and uses the DashboardLayout template through Next.js app router.
 */

"use client";

import {
  Activity,
  Cloudy,
  Cpu,
  Droplets,
  Home,
  Lightbulb,
  Settings,
  Thermometer,
  Wind,
} from "lucide-react";
import { useEffect, useState } from "react";

import AlertsPanel from "@/components/organisms/AlertsPanel";
import StatusOverviewGrid from "@/components/organisms/StatusOverviewGrid";
import { useMqtt } from "../mqtt-sensors/useMqtt";

type StatusItem = {
  id: string;
  label: string;
  value: string;
  trend: string;
  icon: any;
  color: "success" | "danger" | "warning" | "primary";
};

type SensorId =
  | "temperature_humidity"
  | "air_quality"
  | "lighting"
  | "motion_detection"
  | "pressure";

export default function Dashboard() {
  // Estado inicial de los sensores
  const [sensorStates, setSensorStates] = useState<Record<SensorId, boolean>>({
    temperature_humidity: true,
    air_quality: true,
    lighting: true,
    motion_detection: true,
    pressure: true,
  });

  const [statusData, setStatusData] = useState<StatusItem[]>([
    {
      id: "temperature_humidity",
      label: "Temperatura y Humedad",
      value: "-- °C / -- %",
      trend: "Esperando datos...",
      icon: Thermometer,
      color: "warning",
    },
    {
      id: "air_quality",
      label: "Calidad del Aire",
      value: "Esperando...",
      trend: "Esperando datos...",
      icon: Wind,
      color: "warning",
    },
    {
      id: "lighting",
      label: "Iluminación",
      value: "Esperando...",
      trend: "Esperando datos...",
      icon: Lightbulb,
      color: "warning",
    },
    {
      id: "motion_detection",
      label: "Detección de Movimiento",
      value: "-- cm",
      trend: "Esperando datos...",
      icon: Activity,
      color: "warning",
    },
    {
      id: "pressure",
      label: "Presión Atmosférica",
      value: "-- hPa",
      trend: "Esperando datos...",
      icon: Cloudy,
      color: "warning",
    },
  ]);

  // Conectar al MQTT para obtener datos reales
  const { isConnected, sensorData, connectionStatus, publishCommand } = useMqtt(
    "wss://broker.hivemq.com:8884/mqtt",
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

  // Actualizar statusData cuando lleguen nuevos datos del MQTT
  useEffect(() => {
    if (sensorData.length > 0) {
      const latestData: { [key: string]: any } = {};

      // Filtrar solo datos reales de sensores, no mensajes de estado
      const actualSensorData = sensorData.filter((data) => {
        // Filtrar mensajes de estado de sensores
        if (data.topic.startsWith("siepa/status/sensors/")) {
          return false;
        }
        // Filtrar valores que sean objetos JSON de estado
        if (
          typeof data.valor === "object" &&
          data.valor?.sensor &&
          data.valor?.enabled !== undefined
        ) {
          return false;
        }
        return true;
      });

      // Obtener los datos más recientes de cada sensor real
      actualSensorData.forEach((data) => {
        const sensorType = data.sensor_type?.toLowerCase();
        if (
          sensorType &&
          (!latestData[sensorType] ||
            new Date(data.timestamp) >
              new Date(latestData[sensorType].timestamp))
        ) {
          latestData[sensorType] = data;
        }
      });

      setStatusData((prevData) =>
        prevData.map((item) => {
          switch (item.id) {
            case "temperature_humidity":
              const temp = latestData["temperatura"];
              const hum = latestData["humedad"];

              // Verificar si los sensores están habilitados
              const tempEnabled = sensorStates.temperature_humidity;
              const humEnabled = sensorStates.temperature_humidity;

              let tempValue = "--";
              let humValue = "--";

              if (
                tempEnabled &&
                temp?.valor &&
                typeof temp.valor === "number"
              ) {
                tempValue = temp.valor.toString();
              }

              if (humEnabled && hum?.valor && typeof hum.valor === "number") {
                humValue = hum.valor.toString();
              }

              return {
                ...item,
                value: `${tempValue} °C / ${humValue} %`,
                trend:
                  !tempEnabled || !humEnabled
                    ? "Sensor apagado"
                    : isConnected
                      ? "En línea"
                      : "Desconectado",
                color:
                  !tempEnabled || !humEnabled
                    ? ("danger" as const)
                    : temp?.valor && hum?.valor
                      ? ("success" as const)
                      : ("warning" as const),
              };

            case "air_quality":
              const airQuality = latestData["calidad del aire"];
              const airEnabled = sensorStates.air_quality;

              return {
                ...item,
                value: !airEnabled
                  ? "Apagado"
                  : airQuality?.valor || "Esperando...",
                trend: !airEnabled
                  ? "Sensor apagado"
                  : airQuality?.unidad || "Esperando datos...",
                color: !airEnabled
                  ? ("danger" as const)
                  : airQuality?.valor === "BUENA"
                    ? ("success" as const)
                    : airQuality?.valor === "MALA"
                      ? ("danger" as const)
                      : ("warning" as const),
              };

            case "lighting":
              const light = latestData["luz"];
              const lightEnabled = sensorStates.lighting;

              return {
                ...item,
                value: !lightEnabled
                  ? "Apagado"
                  : light?.valor || "Esperando...",
                trend: !lightEnabled
                  ? "Sensor apagado"
                  : light?.unidad || "Esperando datos...",
                color: !lightEnabled
                  ? ("danger" as const)
                  : light?.valor === "SI"
                    ? ("success" as const)
                    : light?.valor === "NO"
                      ? ("warning" as const)
                      : ("warning" as const),
              };

            case "motion_detection":
              const distance = latestData["distancia"];
              const distanceEnabled = sensorStates.motion_detection;

              return {
                ...item,
                value: !distanceEnabled
                  ? "Apagado"
                  : distance?.valor
                    ? `${distance.valor} cm`
                    : "-- cm",
                trend: !distanceEnabled
                  ? "Sensor apagado"
                  : distance
                    ? "Detectando"
                    : "Esperando datos...",
                color: !distanceEnabled
                  ? ("danger" as const)
                  : distance?.valor
                    ? ("primary" as const)
                    : ("warning" as const),
              };

            case "pressure":
              const pressure = latestData["presión"];
              const pressureEnabled = sensorStates.pressure;

              return {
                ...item,
                value: !pressureEnabled
                  ? "Apagado"
                  : pressure?.valor
                    ? `${pressure.valor} hPa`
                    : "-- hPa",
                trend: !pressureEnabled
                  ? "Sensor apagado"
                  : pressure?.valor
                    ? `${pressure.valor < 1010 ? "Baja presión" : pressure.valor > 1025 ? "Alta presión" : "Normal"}`
                    : "Esperando datos...",
                color: !pressureEnabled
                  ? ("danger" as const)
                  : pressure?.valor
                    ? pressure.valor < 1005 || pressure.valor > 1030
                      ? ("danger" as const)
                      : pressure.valor < 1010 || pressure.valor > 1025
                        ? ("warning" as const)
                        : ("success" as const)
                    : ("warning" as const),
              };

            default:
              return item;
          }
        })
      );
    }
  }, [sensorData, isConnected, sensorStates]);

  // Generar alertas basadas en los datos de sensores
  const [alerts, setAlerts] = useState([
    {
      id: "connection_status",
      title: "Estado de Conexión",
      description: `Sistema MQTT: ${connectionStatus}`,
      level: isConnected ? ("info" as const) : ("danger" as const),
      timestamp: "ahora",
    },
  ]);

  // Actualizar alertas basadas en datos de sensores
  useEffect(() => {
    const newAlerts = [
      {
        id: "connection_status",
        title: "Estado de Conexión",
        description: `Sistema MQTT: ${connectionStatus}`,
        level: isConnected ? ("info" as const) : ("danger" as const),
        timestamp: "ahora",
      },
    ];

    if (sensorData.length > 0) {
      const latestData: { [key: string]: any } = {};

      // Obtener los datos más recientes de cada sensor
      sensorData.forEach((data) => {
        const sensorType = data.sensor_type?.toLowerCase();
        if (
          sensorType &&
          (!latestData[sensorType] ||
            new Date(data.timestamp) >
              new Date(latestData[sensorType].timestamp))
        ) {
          latestData[sensorType] = data;
        }
      });

      // Alerta de calidad del aire
      const airQuality = latestData["calidad del aire"];
      if (airQuality?.valor === "MALA") {
        newAlerts.push({
          id: "air_quality_alert",
          title: "Calidad del Aire Mala",
          description: `Sensor reporta aire malo ${airQuality.unidad}`,
          level: "danger" as const,
          timestamp: airQuality.timestamp,
        });
      }

      // Alerta de temperatura (si está fuera del rango normal)
      const temp = latestData["temperatura"];
      if (temp?.valor && (temp.valor > 30 || temp.valor < 18)) {
        newAlerts.push({
          id: "temp_alert",
          title: temp.valor > 30 ? "Temperatura Elevada" : "Temperatura Baja",
          description: `Sensor reporta ${temp.valor}°C`,
          level: "danger" as const,
          timestamp: temp.timestamp,
        });
      }

      // Alerta de buzzer activo
      const buzzer = latestData["buzzer"];
      if (buzzer?.valor === "ON") {
        newAlerts.push({
          id: "buzzer_alert",
          title: "Buzzer Activado",
          description: "Sistema de alerta sonora activo",
          level: "danger" as const,
          timestamp: buzzer.timestamp,
        });
      }

      // Alerta de presión atmosférica anómala
      const pressure = latestData["presión"];
      if (pressure?.valor && (pressure.valor < 1005 || pressure.valor > 1030)) {
        newAlerts.push({
          id: "pressure_alert",
          title:
            pressure.valor < 1005 ? "Presión Muy Baja" : "Presión Muy Alta",
          description: `Sensor reporta ${pressure.valor} hPa - ${pressure.valor < 1005 ? "Posible mal tiempo" : "Condiciones atmosféricas inusuales"}`,
          level: "danger" as const,
          timestamp: pressure.timestamp,
        });
      } else if (
        pressure?.valor &&
        (pressure.valor < 1010 || pressure.valor > 1025)
      ) {
        newAlerts.push({
          id: "pressure_warning",
          title: pressure.valor < 1010 ? "Presión Baja" : "Presión Alta",
          description: `Sensor reporta ${pressure.valor} hPa - Monitoreo recomendado`,
          level: "warning" as const,
          timestamp: pressure.timestamp,
        });
      }
    }

    setAlerts(newAlerts);
  }, [sensorData, isConnected, connectionStatus]);

  // Add toggle handler
  const handleTogglePower = (id: string) => {
    setSensorStates((prev) => {
      const newState = !prev[id as SensorId];

      // Mapeo de comandos del dashboard a comandos MQTT
      const mqttCommands = [];

      switch (id) {
        case "temperature_humidity":
          mqttCommands.push(
            { topic: "siepa/commands/sensors/temperature", enabled: newState },
            { topic: "siepa/commands/sensors/humidity", enabled: newState }
          );
          break;
        case "lighting":
          mqttCommands.push({
            topic: "siepa/commands/sensors/light",
            enabled: newState,
          });
          break;
        case "motion_detection":
          mqttCommands.push({
            topic: "siepa/commands/sensors/distance",
            enabled: newState,
          });
          break;
        case "pressure":
          mqttCommands.push({
            topic: "siepa/commands/sensors/pressure",
            enabled: newState,
          });
          break;
        default:
          mqttCommands.push({
            topic: `siepa/commands/sensors/${id}`,
            enabled: newState,
          });
      }

      // Enviar todos los comandos MQTT necesarios
      let allCommandsSuccessful = true;
      mqttCommands.forEach(({ topic, enabled }) => {
        const payload = {
          enabled,
          timestamp: new Date().toISOString(),
          source: "frontend",
        };

        const success = publishCommand(topic, payload);
        if (success) {
          console.log(
            `✅ Command sent: ${topic} ${enabled ? "ENABLED" : "DISABLED"}`
          );
        } else {
          console.error(`❌ Error sending command for ${topic}`);
          allCommandsSuccessful = false;
        }
      });

      // Si algún comando falló, revertir explícitamente el estado
      if (!allCommandsSuccessful) {
        console.log(`🔄 Reverting state for ${id} due to MQTT command failure`);
        return {
          ...prev,
          [id]: !newState, // Revertir explícitamente al estado opuesto
        };
      }

      return {
        ...prev,
        [id]: newState,
      };
    });
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Resumen del Sistema SIEPA
          </h1>
          <p className="text-foreground-600 mt-1">
            Estado actual de los sensores ambientales - Conexión MQTT:{" "}
            {connectionStatus}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
          ></div>
          <span className="text-sm text-foreground-600">
            {isConnected ? "Conectado" : "Desconectado"}
          </span>
        </div>
      </div>

      {/* Status Overview Grid */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          Métricas Ambientales
        </h2>
        <StatusOverviewGrid
          statusData={statusData}
          onViewDetails={(id) => console.log("View details for:", id)}
          sensorStates={sensorStates}
          onTogglePower={handleTogglePower}
        />
      </section>

      {/* Alerts Panel */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          Alertas del Sistema
        </h2>
        <AlertsPanel
          alerts={alerts}
          onViewAll={() => console.log("View all alerts")}
          onSettings={() => console.log("Alert settings")}
        />
      </section>
    </div>
  );
}
