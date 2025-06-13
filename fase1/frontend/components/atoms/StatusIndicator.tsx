/**
 * StatusIndicator - Atom component for displaying colored status indicators
 *
 * A simple visual indicator that shows status through color coding with optional animation.
 * Part of the Atomic Design system as a fundamental building block.
 *
 * @param props - Component props
 * @param props.color - Status color variant that determines the visual appearance
 * @param props.animate - Whether to show pulsing animation (default: false)
 *
 * @returns A colored circular indicator element
 *
 * @example
 * ```tsx
 * <StatusIndicator color="success" animate />
 * <StatusIndicator color="warning" />
 * <StatusIndicator color="danger" animate />
 * ```
 */

interface StatusIndicatorProps {
  color: "success" | "warning" | "danger" | "primary" | "secondary";
  animate?: boolean;
}

export default function StatusIndicator({
  color,
  animate = false,
}: StatusIndicatorProps) {
  const colorClasses = {
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    primary: "bg-primary",
    secondary: "bg-secondary",
  };

  return (
    <div
      className={`
        w-3 h-3 rounded-full
        ${colorClasses[color]}
        ${animate ? "animate-pulse" : ""}
      `}
    />
  );
}
