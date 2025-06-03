/**
 * EnergyConsumptionPanel - Organism component for displaying energy consumption metrics
 *
 * A comprehensive panel that shows total energy consumption and detailed breakdown
 * by category using progress meters. Features a header with total consumption
 * and a list of individual consumption metrics.
 *
 * @param props - Component props
 * @param props.totalConsumption - Total energy consumption value (e.g., "2.7 MWh")
 * @param props.metrics - Array of energy metric objects with consumption details
 * @param props.title - Optional custom title for the panel (default: "Consumo Energético")
 * @param props.subtitle - Optional subtitle (default: "Últimas 24 horas")
 * @param props.onViewAll - Optional callback for "view all" action
 *
 * @returns A card panel displaying energy consumption information
 *
 * @example
 * ```tsx
 * const energyMetrics = [
 *   {
 *     id: "lighting",
 *     label: "Iluminación",
 *     value: "850 kWh",
 *     percentage: 65,
 *     color: "primary"
 *   }
 * ];
 *
 * <EnergyConsumptionPanel
 *   totalConsumption="2.7 MWh"
 *   metrics={energyMetrics}
 *   onViewAll={() => navigate('/energy')}
 * />
 * ```
 */

import { Card, CardBody, CardHeader } from "@heroui/card";

import { Button } from "@heroui/button";
import IconWrapper from "@/components/atoms/IconWrapper";
import MetricValue from "@/components/atoms/MetricValue";
import ProgressMeter from "@/components/molecules/ProgressMeter";
import { Zap } from "lucide-react";

interface EnergyMetric {
  id: string;
  label: string;
  value: string;
  percentage: number;
  color: "primary" | "secondary" | "success" | "warning" | "danger";
}

interface EnergyConsumptionPanelProps {
  totalConsumption: string;
  metrics: EnergyMetric[];
  title?: string;
  subtitle?: string;
  onViewAll?: () => void;
}

export default function EnergyConsumptionPanel({
  totalConsumption,
  metrics,
  title = "Consumo Energético",
  subtitle = "Últimas 24 horas",
  onViewAll,
}: EnergyConsumptionPanelProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <IconWrapper color="warning" size="lg" variant="shadow">
              <Zap className="w-6 h-6" />
            </IconWrapper>
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-sm text-foreground-500">{subtitle}</p>
            </div>
          </div>
          {onViewAll && (
            <Button
              variant="light"
              size="sm"
              onPress={onViewAll}
              className="text-primary"
            >
              Ver todo
            </Button>
          )}
        </div>
      </CardHeader>

      <CardBody className="space-y-6">
        {/* Total Consumption */}
        <div className="text-center p-6 bg-content2 rounded-xl">
          <p className="text-sm text-foreground-600 mb-2">Consumo Total</p>
          <MetricValue
            value={totalConsumption}
            size="xl"
            weight="bold"
            color="primary"
          />
        </div>

        {/* Consumption Breakdown */}
        <div className="space-y-4">
          {metrics.map((metric) => (
            <ProgressMeter
              key={metric.id}
              label={metric.label}
              value={metric.value}
              percentage={metric.percentage}
              color={metric.color}
            />
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
