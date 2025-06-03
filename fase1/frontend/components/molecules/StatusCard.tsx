/**
 * StatusCard - Molecule component for displaying environmental status information
 *
 * A card component that combines multiple atoms to display status information including
 * label, value, trend, and an icon with consistent styling. Part of the Atomic Design system.
 *
 * @param props - Component props
 * @param props.label - Descriptive label for the status metric
 * @param props.value - Current value of the metric
 * @param props.trend - Trend indicator text (e.g., "Normal", "Alto", "Bajo")
 * @param props.icon - Icon component to display (passed as component reference)
 * @param props.color - Color variant that affects the overall card theme
 * @param props.onViewDetails - Optional callback function when view details is clicked
 *
 * @returns A card displaying status information with icon, value, and trend
 *
 * @example
 * ```tsx
 * <StatusCard
 *   label="Temperatura"
 *   value="24.5°C"
 *   trend="Normal"
 *   icon={Thermometer}
 *   color="success"
 *   onViewDetails={() => console.log("View temperature details")}
 * />
 * ```
 */

import { Card, CardBody } from "@heroui/card";

import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Eye } from "lucide-react";
import IconWrapper from "@/components/atoms/IconWrapper";
import MetricValue from "@/components/atoms/MetricValue";

interface StatusCardProps {
  label: string;
  value: string;
  trend: string;
  icon: any;
  color: "primary" | "secondary" | "success" | "warning" | "danger" | "default";
  onViewDetails?: () => void;
}

export default function StatusCard({
  label,
  value,
  trend,
  icon: Icon,
  color,
  onViewDetails,
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
      </CardBody>
    </Card>
  );
}
