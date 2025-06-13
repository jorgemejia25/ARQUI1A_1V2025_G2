/**
 * StatusCard - Molecule component for displaying environmental status information
 *
 * A card component that combines multiple atoms to display status information including
 * label, value, trend, and an icon with consistent styling. Part of the Atomic Design system.
 * Optionally, it can display a power toggle button to control the on/off state of a device.
 *
 * @param props - Component props
 * @param props.label - Descriptive label for the status metric
 * @param props.value - Current value of the metric
 * @param props.trend - Trend indicator text (e.g., "Normal", "High", "Low")
 * @param props.icon - Icon component to display (passed as component reference)
 * @param props.color - Color variant that affects the overall card theme
 * @param props.onViewDetails - Optional callback function when view details is clicked
 * @param props.powerOn - Optional boolean indicating the current power state (true = on, false = off)
 * @param props.onTogglePower - Optional callback function executed when the power toggle button is pressed
 *
 * @returns A card displaying status information with icon, value, trend, and optional power toggle
 *
 * @example
 * ```tsx
 * <StatusCard
 *   label="Temperature"
 *   value="24.5°C"
 *   trend="Normal"
 *   icon={Thermometer}
 *   color="success"
 *   onViewDetails={() => console.log("View temperature details")}
 *   powerOn={true}
 *   onTogglePower={() => console.log("Toggled power!")}
 * />
 * ```
 */

import { Card, CardBody } from "@heroui/card";

import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Eye } from "lucide-react";
import IconWrapper from "@/components/atoms/IconWrapper";
import MetricValue from "@/components/atoms/MetricValue";
import PowerToggleButton from "@/components/atoms/PowerToggleButton"; 

interface StatusCardProps {
  label: string;
  value: string;
  trend: string;
  icon: any;
  color: "primary" | "secondary" | "success" | "warning" | "danger" | "default";
  onViewDetails?: () => void;
  powerOn?: boolean;
  onTogglePower?: () => void;
}

export default function StatusCard({
  label,
  value,
  trend,
  icon: Icon,
  color,
  onViewDetails,
  powerOn,
  onTogglePower,
}: StatusCardProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      <CardBody className="p-0">
        <div className="flex items-center justify-between mb-4">
          <IconWrapper color={color} size="md" variant="flat">
            <Icon className="w-5 h-5" />
          </IconWrapper>
          {onViewDetails && (
            <Button
              isIconOnly
              variant="light"
              size="sm"
              className="w-8 h-8 opacity-60 hover:opacity-100"
              onPress={onViewDetails}
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="mb-3">
          <p className="text-sm text-foreground-500 font-medium mb-2">
            {label}
          </p>
          <MetricValue value={value} size="xl" />
        </div>

        <div className="flex items-center justify-start">
          <Chip size="sm" color={color} variant="flat" className="font-medium">
            {trend}
          </Chip>
        </div>

        {/* Power Toggle Button */}
        {typeof powerOn === "boolean" && onTogglePower && (
        <PowerToggleButton 
          isOn={powerOn} 
          onToggle={onTogglePower}
        />
      )}
      </CardBody>
    </Card>
  );
}
