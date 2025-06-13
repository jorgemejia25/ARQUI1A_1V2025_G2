/**
 * LEDControlPanel - Organism component for controlling LED indicators
 *
 * A dedicated control panel for the LED system that provides:
 * - Individual LED control (temperature, humidity, light, air quality)
 * - Pattern control (all on/off, alternate, sequence)
 * - Manual/Automatic mode toggle
 * - Visual feedback with appropriate colors and states
 * - MQTT integration for real-time control
 *
 * @param props - Component props
 * @param props.isConnected - MQTT connection status
 * @param props.ledStates - Current LED states from MQTT data
 * @param props.onLedCommand - Callback to send LED commands
 *
 * @returns A control panel for the LED system
 */

import { Card, CardBody, CardHeader } from "@heroui/card";
import {
  Droplets,
  Lightbulb,
  Power,
  Settings,
  Sun,
  Thermometer,
  Volume2,
  Wind,
  Zap,
} from "lucide-react";
import { Select, SelectItem } from "@heroui/select";

import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Switch } from "@heroui/switch";

interface LEDControlPanelProps {
  isConnected: boolean;
  ledStates?: {
    manual_mode?: boolean;
    leds?: {
      temperature?: boolean;
      humidity?: boolean;
      light?: boolean;
      air_quality?: boolean;
    };
    buzzer?: boolean;
    timestamp?: string;
  };
  onLedCommand: (command: any) => void;
}

export default function LEDControlPanel({
  isConnected,
  ledStates,
  onLedCommand,
}: LEDControlPanelProps) {
  const isManualMode = ledStates?.manual_mode || false;
  const leds = ledStates?.leds || {};
  const buzzerState = ledStates?.buzzer || false;

  const ledConfig = [
    {
      id: "temperature",
      name: "Temperatura",
      color: "red",
      icon: Thermometer,
      bgClass: "bg-red-100",
      textClass: "text-red-600",
      activeClass: "bg-red-500",
    },
    {
      id: "humidity",
      name: "Humedad",
      color: "yellow",
      icon: Droplets,
      bgClass: "bg-yellow-100",
      textClass: "text-yellow-600",
      activeClass: "bg-yellow-500",
    },
    {
      id: "light",
      name: "Luz",
      color: "green",
      icon: Sun,
      bgClass: "bg-green-100",
      textClass: "text-green-600",
      activeClass: "bg-green-500",
    },
    {
      id: "air_quality",
      name: "Calidad del Aire",
      color: "blue",
      icon: Wind,
      bgClass: "bg-blue-100",
      textClass: "text-blue-600",
      activeClass: "bg-blue-500",
    },
  ];

  const buzzerConfig = {
    id: "buzzer",
    name: "Buzzer",
    color: "purple",
    icon: Volume2,
    bgClass: "bg-purple-100",
    textClass: "text-purple-600",
    activeClass: "bg-purple-500",
  };

  const handleModeToggle = () => {
    const newMode = isManualMode ? "automatic" : "manual";

    console.log(
      `🔄 [LED Panel] Cambiando modo de ${isManualMode ? "manual" : "automático"} a ${newMode}`
    );
    console.log(`🔄 [LED Panel] Estado actual:`, { isManualMode, ledStates });

    // Enviar comando MQTT
    onLedCommand({
      type: "control",
      mode: newMode,
    });
  };

  const handleLedToggle = (ledId: string) => {
    onLedCommand({
      type: "individual",
      led: ledId,
      action: "toggle",
    });
  };

  const handleBuzzerToggle = () => {
    const newState = !buzzerState;

    console.log(
      `🔔 [LED Panel] Cambiando buzzer de ${buzzerState} a ${newState}`
    );
    console.log(`🔔 [LED Panel] Estado LEDs actual:`, {
      isManualMode,
      ledStates,
    });

    onLedCommand({
      type: "buzzer",
      state: newState,
    });
  };

  const handlePatternSelect = (pattern: string) => {
    onLedCommand({
      type: "pattern",
      pattern: pattern,
    });
  };

  const handleAllLedsControl = (action: "on" | "off") => {
    onLedCommand({
      type: "pattern",
      pattern: action === "on" ? "all_on" : "all_off",
    });
  };

  const getStatusColor = () => {
    if (!isConnected) return "warning";
    return isManualMode ? "primary" : "success";
  };

  const getStatusText = () => {
    if (!isConnected) return "Sin conexión";
    return isManualMode ? "Manual" : "Automático";
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                isManualMode
                  ? "bg-primary-100 text-primary-600"
                  : "bg-success-100 text-success-600"
              }`}
            >
              <Lightbulb className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Control de LEDs y Buzzer
              </h3>
              <p className="text-sm text-foreground-500">
                Sistema de indicadores visuales y auditivos
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

      <CardBody className="pt-0 space-y-4">
        {/* Mode Control */}
        <div className="flex justify-between items-center p-3 bg-default-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-foreground-600" />
            <span className="font-medium">Modo de Control</span>
          </div>
          <Switch
            isSelected={isManualMode}
            onValueChange={handleModeToggle}
            isDisabled={!isConnected}
            color="primary"
            size="sm"
          >
            {isManualMode ? "Manual" : "Automático"}
          </Switch>
        </div>

        {/* Manual Controls */}
        {isManualMode && (
          <>
            <Divider />

            {/* Individual LED Controls */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground-700">
                Control Individual de LEDs
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {ledConfig.map((led) => {
                  const LedIcon = led.icon;
                  const isOn = leds[led.id as keyof typeof leds];

                  return (
                    <Button
                      key={led.id}
                      variant={isOn ? "solid" : "bordered"}
                      color={isOn ? (led.color as any) : "default"}
                      size="sm"
                      className="h-12"
                      onPress={() => handleLedToggle(led.id)}
                      isDisabled={!isConnected}
                      startContent={<LedIcon className="w-4 h-4" />}
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-xs">{led.name}</span>
                        <span className="text-xs opacity-70">
                          {isOn ? "Encendido" : "Apagado"}
                        </span>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>

            <Divider />

            {/* Buzzer Control */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground-700">
                Control de Buzzer
              </h4>
              <Button
                variant={buzzerState ? "solid" : "bordered"}
                color={buzzerState ? "purple" : "default"}
                size="md"
                className="w-full h-12"
                onPress={handleBuzzerToggle}
                isDisabled={!isConnected}
                startContent={<Volume2 className="w-5 h-5" />}
              >
                <div className="flex flex-col items-center">
                  <span className="text-sm font-medium">
                    {buzzerConfig.name}
                  </span>
                  <span className="text-xs opacity-70">
                    {buzzerState ? "Activado" : "Desactivado"}
                  </span>
                </div>
              </Button>
            </div>

            <Divider />

            {/* Quick Actions */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground-700">
                Acciones Rápidas
              </h4>
              <div className="flex gap-2">
                <Button
                  color="success"
                  variant="flat"
                  size="sm"
                  className="flex-1"
                  onPress={() => handleAllLedsControl("on")}
                  isDisabled={!isConnected}
                  startContent={<Zap className="w-4 h-4" />}
                >
                  Todos ON
                </Button>
                <Button
                  color="danger"
                  variant="flat"
                  size="sm"
                  className="flex-1"
                  onPress={() => handleAllLedsControl("off")}
                  isDisabled={!isConnected}
                  startContent={<Power className="w-4 h-4" />}
                >
                  Todos OFF
                </Button>
              </div>
            </div>

            <Divider />

            {/* Pattern Controls */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground-700">
                Patrones
              </h4>
              <Select
                placeholder="Seleccionar patrón"
                size="sm"
                isDisabled={!isConnected}
                onChange={(e) => handlePatternSelect(e.target.value)}
              >
                <SelectItem key="alternate" value="alternate">
                  Alternado
                </SelectItem>
                <SelectItem key="sequence" value="sequence">
                  Secuencia
                </SelectItem>
                <SelectItem key="all_on" value="all_on">
                  Todos encendidos
                </SelectItem>
                <SelectItem key="all_off" value="all_off">
                  Todos apagados
                </SelectItem>
              </Select>
            </div>
          </>
        )}

        {/* Status Information */}
        <Divider />
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-foreground-600">Estado del sistema:</span>
            <span className="font-medium">
              {isManualMode
                ? "Control manual activo"
                : "Control automático por alertas"}
            </span>
          </div>

          {ledStates?.timestamp && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-foreground-600">Última actualización:</span>
              <span className="font-medium">
                {(() => {
                  try {
                    const date = new Date(ledStates.timestamp);
                    if (isNaN(date.getTime())) {
                      return "No disponible";
                    }
                    return date.toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: false,
                    });
                  } catch {
                    return "No disponible";
                  }
                })()}
              </span>
            </div>
          )}

          {!ledStates?.timestamp && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-foreground-600">Última actualización:</span>
              <span className="font-medium text-foreground-400">
                Esperando datos...
              </span>
            </div>
          )}

          {/* LED and Buzzer Status Indicators */}
          {isManualMode && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2 pt-2">
                {ledConfig.map((led) => {
                  const isOn = leds[led.id as keyof typeof leds];
                  return (
                    <div
                      key={led.id}
                      className="flex flex-col items-center gap-1"
                    >
                      <div
                        className={`w-3 h-3 rounded-full border-2 ${
                          isOn
                            ? `${led.activeClass} border-${led.color}-600`
                            : "bg-gray-200 border-gray-300"
                        }`}
                      />
                      <span className="text-xs text-foreground-500">
                        {led.name.split(" ")[0]}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Buzzer Status Indicator */}
              <div className="flex justify-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      buzzerState
                        ? "bg-purple-500 border-purple-600"
                        : "bg-gray-200 border-gray-300"
                    }`}
                  >
                    {buzzerState && <Volume2 className="w-2 h-2 text-white" />}
                  </div>
                  <span className="text-xs text-foreground-500">Buzzer</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {!isConnected && (
          <div className="text-xs text-warning-600 text-center p-2 bg-warning-50 rounded">
            ⚠️ Sin conexión MQTT - Controles deshabilitados
          </div>
        )}
      </CardBody>
    </Card>
  );
}
