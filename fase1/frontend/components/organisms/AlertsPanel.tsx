/**
 * AlertsPanel - Organism component for displaying system alerts and notifications
 *
 * A comprehensive panel that displays system alerts with filtering, actions, and
 * management capabilities. Shows alert count, individual alerts with different
 * severity levels, and provides quick access to alert management functions.
 *
 * @param props - Component props
 * @param props.alerts - Array of alert objects with details and severity levels
 * @param props.title - Optional custom title for the panel (default: "Alertas del Sistema")
 * @param props.maxVisible - Maximum number of alerts to show (default: 3)
 * @param props.onViewAll - Optional callback when "view all alerts" is clicked
 * @param props.onSettings - Optional callback when alert settings is clicked
 * @param props.onDismissAlert - Optional callback when an alert is dismissed
 *
 * @returns A card panel displaying system alerts with management options
 *
 * @example
 * ```tsx
 * const alerts = [
 *   {
 *     id: "temp_alert",
 *     title: "Temperatura Elevada",
 *     description: "Sensor del aula 205 reporta 28°C",
 *     level: "warning",
 *     timestamp: "hace 15 min"
 *   }
 * ];
 *
 * <AlertsPanel
 *   alerts={alerts}
 *   onViewAll={() => navigate('/alerts')}
 *   onSettings={() => navigate('/settings/alerts')}
 *   onDismissAlert={(id) => handleDismiss(id)}
 * />
 * ```
 */

import { AlertTriangle, Settings } from "lucide-react";
import { Card, CardBody, CardHeader } from "@heroui/card";

import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import IconWrapper from "@/components/atoms/IconWrapper";

interface Alert {
  id: string;
  title: string;
  description: string;
  level: "info" | "warning" | "danger";
  timestamp: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
  title?: string;
  maxVisible?: number;
  onViewAll?: () => void;
  onSettings?: () => void;
  onDismissAlert?: (id: string) => void;
}

export default function AlertsPanel({
  alerts,
  title = "Alertas del Sistema",
  maxVisible = 3,
  onViewAll,
  onSettings,
  onDismissAlert,
}: AlertsPanelProps) {
  const visibleAlerts = alerts.slice(0, maxVisible);
  const alertCount = alerts.length;

  const getLevelColor = (level: Alert["level"]) => {
    switch (level) {
      case "danger":
        return "danger";
      case "warning":
        return "warning";
      case "info":
        return "primary";
      default:
        return "primary";
    }
  };

  const getLevelIcon = (level: Alert["level"]) => {
    return AlertTriangle;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <IconWrapper color="danger" size="lg" variant="shadow">
              <AlertTriangle className="w-6 h-6" />
            </IconWrapper>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{title}</h3>
                <Chip color="danger" variant="flat" size="sm">
                  {alertCount}
                </Chip>
              </div>
              <p className="text-sm text-foreground-500">
                {alertCount === 0
                  ? "No hay alertas activas"
                  : `${alertCount} alerta${alertCount > 1 ? "s" : ""} activa${alertCount > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {onSettings && (
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onPress={onSettings}
                aria-label="Configuración de alertas"
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-4">
        {visibleAlerts.length > 0 ? (
          <>
            {/* Alert List */}
            <div className="space-y-3">
              {visibleAlerts.map((alert) => {
                const LevelIcon = getLevelIcon(alert.level);
                return (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-content2 hover:bg-content3 transition-colors"
                  >
                    <IconWrapper
                      color={getLevelColor(alert.level)}
                      size="sm"
                      variant="flat"
                    >
                      <LevelIcon className="w-4 h-4" />
                    </IconWrapper>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-foreground truncate">
                          {alert.title}
                        </h4>
                        <span className="text-xs text-foreground-500 ml-2">
                          {alert.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-foreground-600 mb-2">
                        {alert.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <Chip
                          color={getLevelColor(alert.level)}
                          variant="flat"
                          size="sm"
                          className="text-xs"
                        >
                          {alert.level === "danger"
                            ? "Alta"
                            : alert.level === "warning"
                              ? "Media"
                              : "Info"}
                        </Chip>
                        {onDismissAlert && (
                          <Button
                            variant="light"
                            size="sm"
                            onPress={() => onDismissAlert(alert.id)}
                            className="text-xs"
                          >
                            Descartar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* View All Button */}
            {alertCount > maxVisible && onViewAll && (
              <Button
                variant="flat"
                color="primary"
                size="sm"
                onPress={onViewAll}
                className="w-full"
              >
                Ver todas las alertas ({alertCount})
              </Button>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-foreground-400 mb-2">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            </div>
            <p className="text-sm text-foreground-500">
              No hay alertas activas en este momento
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
