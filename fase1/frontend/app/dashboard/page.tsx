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

import AlertsPanel from "@/components/organisms/AlertsPanel";
import EnergyConsumptionPanel from "@/components/organisms/EnergyConsumptionPanel";
import StatusOverviewGrid from "@/components/organisms/StatusOverviewGrid";

export default function Dashboard() {
  // Mock data for demonstration
  const statusData = [
    {
      id: "temperature_humidity",
      label: "Temperatura y Humedad",
      value: "24.5°C",
      trend: "Normal",
      icon: Thermometer,
      color: "success" as const,
    },
    {
      id: "air_quality",
      label: "Calidad del Aire",
      value: "Buena",
      trend: "Estable",
      icon: Wind,
      color: "success" as const,
    },
    {
      id: "lighting",
      label: "Iluminación",
      value: "450 lux",
      trend: "Óptimo",
      icon: Lightbulb,
      color: "primary" as const,
    },
    {
      id: "atmospheric_pressure",
      label: "Precion Atmosferica",
      value: "500 hPa",
      trend: "Óptimo",
      icon: Cloudy,
      color: "primary" as const,
    },
    {
      id: "motion_detection",
      label: "Detección de Movimiento",
      value: "50 cm",
      trend: "Normal",
      icon: Activity,
      color: "primary" as const,
    },

  ];

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

  const alerts = [
    {
      id: "temp_alert",
      title: "Temperatura Elevada",
      description: "Sensor del aula 205 reporta 28°C",
      level: "warning" as const,
      timestamp: "hace 15 min",
    },
    {
      id: "sensor_offline",
      title: "Sensor Desconectado",
      description: "Sensor de humedad en laboratorio 3",
      level: "danger" as const,
      timestamp: "hace 1 hora",
    },
    {
      id: "maintenance",
      title: "Mantenimiento Programado",
      description: "Sistema HVAC requiere revisión",
      level: "info" as const,
      timestamp: "en 2 días",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Resumen del Sistema
          </h1>
          <p className="text-foreground-600 mt-1">
            Estado actual de los sensores ambientales y consumo energético
          </p>
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
