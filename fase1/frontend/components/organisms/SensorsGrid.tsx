/**
 * SensorsGrid - Organism component for displaying a grid of sensor cards
 *
 * A responsive grid layout that displays multiple sensor cards with management
 * functionality including filtering, adding new sensors, and individual sensor
 * interactions. Provides a comprehensive overview of the sensor network.
 *
 * @param props - Component props
 * @param props.sensors - Array of sensor data objects to display
 * @param props.onSensorClick - Optional callback when a sensor card is clicked
 * @param props.onAddSensor - Optional callback for adding a new sensor
 * @param props.onFilterChange - Optional callback when filters are changed
 *
 * @returns A responsive grid of sensor cards with management controls
 *
 * @example
 * ```tsx
 * const sensors = [
 *   {
 *     id: "temp-01",
 *     name: "Temperature Sensor 01",
 *     type: "Temperature",
 *     location: "Room 205",
 *     value: "24.5°C",
 *     status: "active",
 *     battery: 85,
 *     lastUpdate: "2 minutes ago"
 *   }
 * ];
 *
 * <SensorsGrid
 *   sensors={sensors}
 *   onSensorClick={(id) => console.log("Sensor clicked:", id)}
 *   onAddSensor={() => console.log("Add new sensor")}
 *   onFilterChange={(filters) => console.log("Filters:", filters)}
 * />
 * ```
 */

import { Card, CardBody } from "@heroui/card";

import { Button } from "@heroui/button";
import MetricValue from "@/components/atoms/MetricValue";
import SensorCard from "@/components/molecules/SensorCard";

interface Sensor {
  id: string;
  name: string;
  location: string;
  status: "online" | "offline" | "maintenance";
  value: string;
  unit?: string;
  icon: React.ReactElement;
  lastUpdate?: string;
}

interface SensorsGridProps {
  sensors: Sensor[];
  onSensorAction?: (id: string) => void;
}

export default function SensorsGrid({
  sensors,
  onSensorAction,
}: SensorsGridProps) {
  const onlineSensors = sensors.filter((s) => s.status === "online").length;
  const offlineSensors = sensors.filter((s) => s.status === "offline").length;
  const maintenanceSensors = sensors.filter(
    (s) => s.status === "maintenance"
  ).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardBody className="text-center p-4">
            <MetricValue
              value={onlineSensors.toString()}
              size="xl"
              color="success"
            />
            <p className="text-sm text-foreground-500 mt-2">
              Sensores en línea
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center p-4">
            <MetricValue
              value={offlineSensors.toString()}
              size="xl"
              color="danger"
            />
            <p className="text-sm text-foreground-500 mt-2">
              Sensores desconectados
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center p-4">
            <MetricValue
              value={maintenanceSensors.toString()}
              size="xl"
              color="warning"
            />
            <p className="text-sm text-foreground-500 mt-2">En mantenimiento</p>
          </CardBody>
        </Card>
      </div>

      {/* Sensors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {sensors.map((sensor) => (
          <SensorCard
            key={sensor.id}
            id={sensor.id}
            name={sensor.name}
            location={sensor.location}
            status={sensor.status}
            value={sensor.value}
            unit={sensor.unit}
            icon={sensor.icon}
            lastUpdate={sensor.lastUpdate}
            onMoreOptions={onSensorAction}
          />
        ))}
      </div>
    </div>
  );
}
