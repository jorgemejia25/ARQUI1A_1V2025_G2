/**
 * ProgressMeter - Molecule component for displaying progress with label and value
 * 
 * A progress indicator that combines a label, progress bar, value, and percentage display.
 * Used primarily for showing energy consumption metrics or completion status.
 * 
 * @param props - Component props
 * @param props.label - Descriptive label for the progress meter
 * @param props.value - Textual value to display (e.g., "850 kWh")
 * @param props.percentage - Progress percentage (0-100)
 * @param props.color - Color variant for the progress bar
 * @param props.size - Size variant for the progress bar (default: "md")
 * @param props.showPercentage - Whether to show percentage text (default: true)
 * 
 * @returns A progress meter with label, bar, and value display
 * 
 * @example
 * ```tsx
 * <ProgressMeter
 *   label="Iluminación"
 *   value="850 kWh"
 *   percentage={65}
 *   color="primary"
 *   size="lg"
 * />
 * 
 * <ProgressMeter
 *   label="HVAC"
 *   value="1.2 MWh"
 *   percentage={85}
 *   color="warning"
 *   showPercentage={false}
 * />
 * ```
 */

import MetricValue from "@/components/atoms/MetricValue";
import { Progress } from "@heroui/progress";

interface ProgressMeterProps {
  label: string;
  value: string;
  percentage: number;
  color: "primary" | "secondary" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  showPercentage?: boolean;
}

export default function ProgressMeter({
  label,
  value,
  percentage,
  color,
  size = "md",
  showPercentage = true,
}: ProgressMeterProps) {
  return (
    <div className="space-y-3">
      {/* Label and Value */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-foreground-700">{label}</span>
        <div className="flex items-center gap-2">
          <MetricValue value={value} size="sm" weight="semibold" />
          {showPercentage && (
            <span className="text-xs text-foreground-500">({percentage}%)</span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <Progress
        value={percentage}
        color={color}
        size={size}
        className="w-full"
        aria-label={`${label}: ${percentage}%`}
      />
    </div>
  );
}
