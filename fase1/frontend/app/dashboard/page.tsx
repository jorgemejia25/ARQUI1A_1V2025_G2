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
import EnergyConsumptionPanel from "@/components/organisms/EnergyConsumptionPanel";
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

export default function Dashboard() {
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
  ]);

  // Conectar al MQTT para obtener datos reales
  const { isConnected, sensorData, connectionStatus } = useMqtt(
    "wss://broker.hivemq.com:8884/mqtt",
    ["siepa/sensors", "siepa/sensors/+", "siepa/actuators/+"]
  );

  // Actualizar statusData cuando lleguen nuevos datos del MQTT
  useEffect(() => {
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

      setStatusData((prevData) =>
        prevData.map((item) => {
          switch (item.id) {
            case "temperature_humidity":
              const temp = latestData["temperatura"];
              const hum = latestData["humedad"];
              return {
                ...item,
                value: `${temp?.valor || "--"} °C / ${hum?.valor || "--"} %`,
                trend: isConnected ? "En línea" : "Desconectado",
                color:
                  temp?.valor && hum?.valor
                    ? ("success" as const)
                    : ("warning" as const),
              };

            case "air_quality":
              const airQuality = latestData["calidad del aire"];
              return {
                ...item,
                value: airQuality?.valor || "Esperando...",
                trend: airQuality?.unidad || "Esperando datos...",
                color:
                  airQuality?.valor === "BUENA"
                    ? ("success" as const)
                    : airQuality?.valor === "MALA"
                      ? ("danger" as const)
                      : ("warning" as const),
              };

            case "lighting":
              const light = latestData["luz"];
              return {
                ...item,
                value: light?.valor || "Esperando...",
                trend: light?.unidad || "Esperando datos...",
                color:
                  light?.valor === "SI"
                    ? ("success" as const)
                    : light?.valor === "NO"
                      ? ("warning" as const)
                      : ("warning" as const),
              };

            case "motion_detection":
              const distance = latestData["distancia"];
              return {
                ...item,
                value: distance?.valor ? `${distance.valor} cm` : "-- cm",
                trend: distance ? "Detectando" : "Esperando datos...",
                color: distance?.valor
                  ? ("primary" as const)
                  : ("warning" as const),
              };

            default:
              return item;
          }
        })
      );
    }
  }, [sensorData, isConnected]);

  const energyMetrics = [
    {
      id: "lighting_consumption",
      label: "Iluminación",
      value: "850 kWh",
      percentage: 65,
      color: "primary" as const,
    },
    {
      id: "hvac_consumption",
      label: "Climatización",
      value: "1.2 MWh",
      percentage: 85,
      color: "warning" as const,
    },
    {
      id: "equipment_consumption",
      label: "Equipos",
      value: "450 kWh",
      percentage: 45,
      color: "success" as const,
    },
    {
      id: "other_consumption",
      label: "Otros",
      value: "200 kWh",
      percentage: 25,
      color: "secondary" as const,
    },
  ];

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
    }

    setAlerts(newAlerts);
  }, [sensorData, isConnected, connectionStatus]);

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
        />
      </section>

      {/* Bottom panels */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          Monitoreo y Alertas
        </h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          {/* Energy Consumption Panel */}
          <EnergyConsumptionPanel
            totalConsumption="2.7 MWh"
            metrics={energyMetrics}
          />

          {/* Alerts Panel */}
          <AlertsPanel
            alerts={alerts}
            onViewAll={() => console.log("View all alerts")}
            onSettings={() => console.log("Alert settings")}
          />
        </div>
      </section>
    </div>
  );
}
