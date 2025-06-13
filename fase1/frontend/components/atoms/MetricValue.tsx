/**
 * MetricValue - Atom component for displaying metric values with consistent typography
 *
 * A text component specifically designed for metric values with standardized sizing and styling.
 * Part of the Atomic Design system as a fundamental building block for data display.
 *
 * @param props - Component props
 * @param props.value - The metric value to display (string or number)
 * @param props.size - Typography size variant (default: "md")
 * @param props.weight - Font weight variant (default: "semibold")
 * @param props.color - Text color variant (default: "foreground")
 * @param props.className - Additional CSS classes to apply
 *
 * @returns A styled text element displaying the metric value
 *
 * @example
 * ```tsx
 * <MetricValue value="24.5°C" size="lg" weight="bold" />
 * <MetricValue value={1234} size="sm" color="muted" />
 * <MetricValue value="85%" />
 * ```
 */

interface MetricValueProps {
  value: string | number;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  weight?: "normal" | "medium" | "semibold" | "bold";
  color?: "foreground" | "muted" | "primary" | "success" | "warning" | "danger";
  className?: string;
}

export default function MetricValue({
  value,
  size = "md",
  weight = "semibold",
  color = "foreground",
  className = "",
}: MetricValueProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
    xl: "text-2xl",
    "2xl": "text-3xl",
  };

  const weightClasses = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  };

  const colorClasses = {
    foreground: "text-foreground",
    muted: "text-foreground-500",
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  };

  return (
    <span
      className={`
        ${sizeClasses[size]}
        ${weightClasses[weight]}
        ${colorClasses[color]}
        leading-none
        ${className}
      `}
    >
      {value}
    </span>
  );
}
