/**
 * FanControlPanel - Organism component for controlling DC fan motor
 *
 * A dedicated control panel for the DC fan motor that provides:
 * - Current status display (On/Off)
 * - Power toggle functionality
 * - Visual feedback with appropriate colors and icons
 * - MQTT integration for real-time control
 *
 * @param props - Component props
 * @param props.isConnected - MQTT connection status
 * @param props.fanState - Current fan state from MQTT data
 * @param props.onToggleFan - Callback to toggle fan power
 *
 * @returns A control panel for the DC fan motor
 */

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Fan, Power, Zap } from "lucide-react";

interface FanControlPanelProps {
  isConnected: boolean;
  fanState?: {
    valor: "ON" | "OFF" | string;
    timestamp?: string;
  };
  onToggleFan: () => void;
  isEnabled: boolean;
}

export default function FanControlPanel({
  isConnected,
  fanState,
  onToggleFan,
  isEnabled,
}: FanControlPanelProps) {
  const isOn = fanState?.valor === "ON";
  const isOff = fanState?.valor === "OFF";

  const getStatusColor = () => {
    if (!isEnabled) return "danger";
    if (!isConnected) return "warning";
    if (isOn) return "success";
    if (isOff) return "default";
    return "warning";
  };

  const getStatusText = () => {
    if (!isEnabled) return "Deshabilitado";
    if (!isConnected) return "Sin conexión";
    if (isOn) return "Funcionando";
    if (isOff) return "Apagado";
    return "Estado desconocido";
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                isOn && isEnabled
                  ? "bg-success-100 text-success-600"
                  : isEnabled
                    ? "bg-default-100 text-default-600"
                    : "bg-danger-100 text-danger-600"
              }`}
            >
              <Fan
                className={`w-6 h-6 ${isOn && isEnabled ? "animate-spin" : ""}`}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Ventilador DC
              </h3>
              <p className="text-sm text-foreground-500">
                Control del motor ventilador
              </p>
            </div>
          </div>
          <Chip
            size="sm"
            color={getStatusColor()}
            variant="flat"
            className="font-medium"
          >
            {getStatusText()}
          </Chip>
        </div>
      </CardHeader>

      <CardBody className="pt-0">
        <div className="space-y-4">
          {/* Status Information */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-foreground-600">Estado actual:</span>
            <span className="font-medium">
              {!isEnabled
                ? "Motor deshabilitado"
                : isOn
                  ? "Motor en funcionamiento"
                  : isOff
                    ? "Motor detenido"
                    : "Esperando datos..."}
            </span>
          </div>

          {fanState?.timestamp && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-foreground-600">Última actualización:</span>
              <span className="font-medium">
                {new Date(fanState.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              color={isEnabled && isOn ? "danger" : "success"}
              variant={isEnabled ? "solid" : "bordered"}
              className="flex-1"
              onPress={onToggleFan}
              isDisabled={!isConnected}
              startContent={
                isEnabled && isOn ? (
                  <Power className="w-4 h-4" />
                ) : (
                  <Zap className="w-4 h-4" />
                )
              }
            >
              {isEnabled && isOn ? "Apagar" : "Encender"} Ventilador
            </Button>
          </div>

          {!isConnected && (
            <div className="text-xs text-warning-600 text-center">
              ⚠️ Sin conexión MQTT - Controles deshabilitados
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
