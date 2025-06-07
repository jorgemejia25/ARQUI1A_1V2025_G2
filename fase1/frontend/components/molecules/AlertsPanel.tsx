/**
 * AlertsPanel - Molecule component for displaying system alerts
 *
 * A comprehensive panel that displays active system alerts with the ability
 * to acknowledge individual alerts and show different alert types (danger, warning, info).
 * Features real-time updates from the system store and intuitive alert management.
 *
 * @returns A panel with active alerts and management controls
 *
 * @example
 * ```tsx
 * <AlertsPanel />
 * ```
 */

"use client";

import { AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import { Card, CardBody, CardHeader } from "@heroui/card";

import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { useSystemStore } from "@/lib/store/useSystemStore";

export default function AlertsPanel() {
  const { alerts, acknowledgeAlert, clearAcknowledgedAlerts } =
    useSystemStore();
  const activeAlerts = alerts.filter((alert) => !alert.acknowledged);
  const acknowledgedAlerts = alerts.filter((alert) => alert.acknowledged);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "danger":
        return <AlertTriangle className="w-4 h-4 text-danger" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case "info":
        return <Info className="w-4 h-4 text-primary" />;
      default:
        return <Info className="w-4 h-4 text-default" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "danger":
        return "danger";
      case "warning":
        return "warning";
      case "info":
        return "primary";
      default:
        return "default";
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (alerts.length === 0) {
    return (
      <Card>
        <CardBody className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Sin Alertas Activas
          </h3>
          <p className="text-foreground-500">
            El sistema está funcionando dentro de los parámetros normales.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alertas Activas */}
      {activeAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center w-full">
              <h3 className="text-lg font-semibold text-foreground">
                🚨 Alertas Activas ({activeAlerts.length})
              </h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 ${
                    alert.type === "danger"
                      ? "border-danger-200 bg-danger-50 dark:border-danger-800 dark:bg-danger-900/20"
                      : alert.type === "warning"
                        ? "border-warning-200 bg-warning-50 dark:border-warning-800 dark:bg-warning-900/20"
                        : "border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Chip
                            size="sm"
                            color={getAlertColor(alert.type) as any}
                            variant="flat"
                          >
                            {alert.type.toUpperCase()}
                          </Chip>
                          <span className="text-xs text-foreground-500">
                            {formatTimestamp(alert.timestamp)}
                          </span>
                        </div>
                        <p className="text-foreground font-medium mb-1">
                          {alert.message}
                        </p>
                        <div className="text-sm text-foreground-600">
                          <span>Sensor: {alert.sensor}</span>
                          <span className="mx-2">•</span>
                          <span>Valor: {alert.value}</span>
                          <span className="mx-2">•</span>
                          <span>Umbral: {alert.threshold}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="light"
                      color={getAlertColor(alert.type) as any}
                      onPress={() => acknowledgeAlert(alert.id)}
                      startContent={<CheckCircle className="w-4 h-4" />}
                    >
                      Reconocer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Alertas Reconocidas */}
      {acknowledgedAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center w-full">
              <h3 className="text-lg font-semibold text-foreground">
                ✅ Alertas Reconocidas ({acknowledgedAlerts.length})
              </h3>
              <Button
                size="sm"
                variant="light"
                color="default"
                onPress={clearAcknowledgedAlerts}
                startContent={<X className="w-4 h-4" />}
              >
                Limpiar
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {acknowledgedAlerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className="border rounded-lg p-3 bg-default-50 dark:bg-default-100/50"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Chip size="sm" color="default" variant="bordered">
                          {alert.type.toUpperCase()}
                        </Chip>
                        <span className="text-xs text-foreground-500">
                          {formatTimestamp(alert.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground-600">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {acknowledgedAlerts.length > 5 && (
                <p className="text-center text-sm text-foreground-500">
                  ... y {acknowledgedAlerts.length - 5} alertas más
                </p>
              )}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
