/**
 * AlertItem - Molecule component for displaying individual alert notifications
 *
 * A notification item that combines multiple atoms to display alert information including
 * title, description, severity level, and timestamp. Features color-coded styling based
 * on alert level and interactive hover states.
 *
 * @param props - Component props
 * @param props.title - Alert title/heading text
 * @param props.description - Detailed description of the alert
 * @param props.level - Severity level that determines styling and priority
 * @param props.timestamp - Optional timestamp or relative time text
 *
 * @returns A styled alert item with status indicator, content, and severity chip
 *
 * @example
 * ```tsx
 * <AlertItem
 *   title="Temperature Alert"
 *   description="Sensor reading above normal threshold"
 *   level="warning"
 *   timestamp="2 minutes ago"
 * />
 * ```
 */

import { Chip } from "@heroui/chip";
import StatusIndicator from "@/components/atoms/StatusIndicator";

interface AlertItemProps {
  title: string;
  description: string;
  level: "info" | "warning" | "danger";
  timestamp?: string;
}

export default function AlertItem({
  title,
  description,
  level,
  timestamp,
}: AlertItemProps) {
  const levelConfig = {
    info: {
      bgColor: "bg-success/10",
      borderColor: "border-success/20",
      hoverBg: "hover:bg-success/20",
      chipColor: "success" as const,
      statusColor: "success" as const,
    },
    warning: {
      bgColor: "bg-warning/10",
      borderColor: "border-warning/20",
      hoverBg: "hover:bg-warning/20",
      chipColor: "warning" as const,
      statusColor: "warning" as const,
    },
    danger: {
      bgColor: "bg-danger/10",
      borderColor: "border-danger/20",
      hoverBg: "hover:bg-danger/20",
      chipColor: "danger" as const,
      statusColor: "danger" as const,
    },
  };

  const config = levelConfig[level];

  const getLevelText = (level: string) => {
    switch (level) {
      case "info":
        return "Info";
      case "warning":
        return "Media";
      case "danger":
        return "Alta";
      default:
        return "Info";
    }
  };

  return (
    <div
      className={`
      flex items-center gap-4 p-4 rounded-xl border 
      ${config.bgColor} ${config.borderColor} ${config.hoverBg} 
      transition-colors duration-200
    `}
    >
      <StatusIndicator color={config.statusColor} />
      <div className="flex-1">
        <p className="text-base font-medium">{title}</p>
        <p className="text-sm text-foreground-500">
          {description}
          {timestamp && ` - ${timestamp}`}
        </p>
      </div>
      <Chip size="sm" color={config.chipColor} variant="flat">
        {getLevelText(level)}
      </Chip>
    </div>
  );
}
