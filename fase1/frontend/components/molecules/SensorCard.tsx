/**
 * SensorCard - Molecule component for displaying sensor information and status
 *
 * A comprehensive card that displays sensor data including name, location, current value,
 * status indicator, and last update time. Provides visual feedback through color-coded
 * status indicators and interactive elements for sensor management.
 *
 * @param props - Component props
 * @param props.id - Unique identifier for the sensor
 * @param props.name - Display name of the sensor
 * @param props.location - Physical location where the sensor is installed
 * @param props.status - Current operational status of the sensor
 * @param props.value - Current reading value from the sensor
 * @param props.unit - Optional measurement unit for the value
 * @param props.icon - Icon component representing the sensor type
 * @param props.lastUpdate - Optional timestamp of the last data update
 * @param props.onMoreOptions - Optional callback for additional actions menu
 *
 * @returns A card displaying comprehensive sensor information with status indicators
 *
 * @example
 * ```tsx
 * <SensorCard
 *   id="temp-01"
 *   name="Temperature Sensor 01"
 *   location="Room 205"
 *   status="online"
 *   value="24.5"
 *   unit="°C"
 *   icon={<Thermometer />}
 *   lastUpdate="2 minutes ago"
 *   onMoreOptions={(id) => console.log("Options for:", id)}
 * />
 * ```
 */

import { Card, CardBody } from "@heroui/card";

import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import IconWrapper from "@/components/atoms/IconWrapper";
import MetricValue from "@/components/atoms/MetricValue";
import { MoreVertical } from "lucide-react";
import StatusIndicator from "@/components/atoms/StatusIndicator";

interface SensorCardProps {
  id: string;
  name: string;
  location: string;
  status: "online" | "offline" | "maintenance";
  value: string;
  unit?: string;
  icon: React.ReactElement;
  lastUpdate?: string;
  onMoreOptions?: (id: string) => void;
}

export default function SensorCard({
  id,
  name,
  location,
  status,
  value,
  unit,
  icon,
  lastUpdate,
  onMoreOptions,
}: SensorCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "success";
      case "offline":
        return "danger";
      case "maintenance":
        return "warning";
      default:
        return "primary";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return "En línea";
      case "offline":
        return "Desconectado";
      case "maintenance":
        return "Mantenimiento";
      default:
        return "Desconocido";
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardBody className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <IconWrapper
              color={getStatusColor(status)}
              variant="flat"
              size="lg"
            >
              {icon}
            </IconWrapper>
            <div>
              <h4 className="font-semibold text-foreground">{name}</h4>
              <p className="text-sm text-foreground-500">{location}</p>
            </div>
          </div>

          {onMoreOptions && (
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={() => onMoreOptions(id)}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {/* Value Display */}
          <div className="text-center py-2">
            <MetricValue
              value={`${value}${unit ? ` ${unit}` : ""}`}
              size="lg"
              color={getStatusColor(status)}
            />
          </div>

          {/* Status and Last Update */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIndicator
                color={getStatusColor(status) as any}
                animate={status === "online"}
              />
              <Chip
                size="sm"
                color={getStatusColor(status) as any}
                variant="flat"
              >
                {getStatusText(status)}
              </Chip>
            </div>
          </div>

          {lastUpdate && (
            <p className="text-xs text-foreground-400 text-center">
              Actualizado: {lastUpdate}
            </p>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
