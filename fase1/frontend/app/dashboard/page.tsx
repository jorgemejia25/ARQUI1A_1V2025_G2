/**
 * Dashboard - Main dashboard page component for the SIEPA system
 *
 * The primary dashboard view that provides a comprehensive overview of environmental
 * monitoring and energy consumption. Displays status cards, energy metrics, and
 * system alerts in a responsive grid layout.
 *
 * Features:
 * - Environmental status overview (temperature, humidity, air quality, lighting)
 * - Energy consumption breakdown by category
 * - System alerts and notifications
 * - Responsive layout optimized for all screen sizes
 *
 * @returns The main dashboard page with status overview, energy panel, and alerts
 *
 * @example
 * This component is automatically rendered when navigating to `/dashboard`
 * and uses the DashboardLayout template through Next.js app router.
 */

"use client";

import {
  Activity,
  Cloudy,
  Cpu,
  Droplets,
  Fan,
  Home,
  Lightbulb,
  Settings,
  Thermometer,
  Wind,
} from "lucide-react";
import { useEffect, useState } from "react";

import AlertsPanel from "@/components/organisms/AlertsPanel";
import FanControlPanel from "@/components/organisms/FanControlPanel";
import LEDControlPanel from "@/components/organisms/LEDControlPanel";
import StatusOverviewGrid from "@/components/organisms/StatusOverviewGrid";
import { useMqtt } from "../mqtt-sensors/useMqtt";

type StatusItem = {
  id: string;
  label: string;
  value: string;
  trend: string;
  icon: any;
  color: "success" | "danger" | "warning" | "primary";
};

type SensorId =
  | "temperature_humidity"
  | "air_quality"
  | "lighting"
  | "motion_detection"
  | "pressure"
  | "fan";

export default function Dashboard() {
  // Estado inicial de los sensores
  const [sensorStates, setSensorStates] = useState<Record<SensorId, boolean>>({
    temperature_humidity: true,
    air_quality: true,
    lighting: true,
    motion_detection: true,
    pressure: true,
    fan: true,
  });

  // Estado para los LEDs y buzzer
  const [ledStates, setLedStates] = useState({
    manual_mode: false,
    leds: {
      temperature: false,
      humidity: false,
      light: false,
      air_quality: false,
    },
    buzzer: false,
    timestamp: undefined,
  });

  const [statusData, setStatusData] = useState<StatusItem[]>([
    {
      id: "temperature_humidity",
      label: "Temperatura y Humedad",
      value: "-- °C / -- %",
      trend: "Esperando datos...",
      icon: Thermometer,
      color: "warning",
    },
    {
      id: "air_quality",
      label: "Calidad del Aire",
      value: "Esperando...",
      trend: "Esperando datos...",
      icon: Wind,
      color: "warning",
    },
    {
      id: "lighting",
      label: "Iluminación",
      value: "Esperando...",
      trend: "Esperando datos...",
      icon: Lightbulb,
      color: "warning",
    },
    {
      id: "motion_detection",
      label: "Detección de Movimiento",
      value: "-- cm",
      trend: "Esperando datos...",
      icon: Activity,
      color: "warning",
    },
    {
      id: "pressure",
      label: "Presión Atmosférica",
      value: "-- hPa",
      trend: "Esperando datos...",
      icon: Cloudy,
      color: "warning",
    },
    {
      id: "fan",
      label: "Ventilador DC",
      value: "Apagado",
      trend: "Motor inactivo",
      icon: Fan,
      color: "danger",
    },
  ]);

  // Conectar al MQTT para obtener datos reales
  const { isConnected, sensorData, connectionStatus, publishCommand } = useMqtt(
    "wss://broker.hivemq.com:8884/mqtt",
    [
      "GRUPO2/sensores/rasp01",
      "GRUPO2/sensores/rasp01/+",
      "GRUPO2/actuadores/rasp01",
      "GRUPO2/actuadores/rasp01/+",
      "GRUPO2/status/rasp01/sensors/+",
      "GRUPO2/status/rasp01/leds",
      "GRUPO2/commands/rasp01/leds/+",
      "GRUPO2/commands/rasp01/buzzer",
    ],
    (sensorType: string, enabled: boolean) => {
      setSensorStates((prev) => ({
        ...prev,
        [sensorType]: enabled,
      }));
    }
  );

  // Procesar datos de LEDs y buzzer desde MQTT
  useEffect(() => {
    const ledData = sensorData.find(
      (data) => data.topic === "GRUPO2/status/rasp01/leds"
    );

    const buzzerData = sensorData.find(
      (data) => data.topic === "GRUPO2/actuadores/rasp01/buzzer"
    );

    console.log(`🔍 [LED Processing] LED Data encontrada:`, ledData);
    console.log(`🔍 [LED Processing] Buzzer Data encontrada:`, buzzerData);

    if (ledData) {
      let processedData = null;

      // El backend puede enviar datos en diferentes formatos
      if (typeof ledData.valor === "object") {
        processedData = ledData.valor;
      } else if (
        typeof ledData === "object" &&
        ledData.manual_mode !== undefined
      ) {
        processedData = ledData;
      }

      if (processedData) {
        console.log(`🔍 [LED Processing] Procesando datos:`, processedData);

        setLedStates((prev) => {
          const newState = {
            ...prev,
            manual_mode: processedData.manual_mode || false,
            leds: processedData.leds || {
              temperature: false,
              humidity: false,
              light: false,
              air_quality: false,
            },
            buzzer:
              processedData.buzzer !== undefined
                ? processedData.buzzer
                : prev.buzzer,
            timestamp: ledData.timestamp || new Date().toISOString(),
          };

          console.log(`🔍 [LED Processing] Nuevo estado de LEDs:`, newState);
          return newState;
        });
      }
    }

    // También procesar buzzer de su topic específico si existe
    if (buzzerData) {
      console.log(`🔍 [Buzzer Processing] Procesando buzzer data:`, buzzerData);

      setLedStates((prev) => ({
        ...prev,
        buzzer:
          buzzerData.valor === true ||
          buzzerData.valor === "ON" ||
          buzzerData.valor === "on",
        timestamp: buzzerData.timestamp || prev.timestamp,
      }));
    }
  }, [sensorData]);

  // Debug: Log cuando cambie el estado de LEDs
  useEffect(() => {
    console.log(`🔍 [LED State] Estado de LEDs actualizado:`, ledStates);
  }, [ledStates]);

  // Actualizar statusData cuando lleguen nuevos datos del MQTT
  useEffect(() => {
    if (sensorData.length > 0) {
      const latestData: { [key: string]: any } = {};

      // Filtrar solo datos reales de sensores, no mensajes de estado
      const actualSensorData = sensorData.filter((data) => {
        // Filtrar mensajes de estado de sensores
        if (data.topic.startsWith("GRUPO2/status/rasp01/sensors/")) {
          return false;
        }
        // Filtrar valores que sean objetos JSON de estado
        if (
          typeof data.valor === "object" &&
          data.valor?.sensor &&
          data.valor?.enabled !== undefined
        ) {
          return false;
        }
        return true;
      });

      // Obtener los datos más recientes de cada sensor real
      actualSensorData.forEach((data) => {
        const sensorType = data.sensor_type?.toLowerCase();
        if (
          sensorType &&
          (!latestData[sensorType] ||
            new Date(data.timestamp) >
              new Date(latestData[sensorType].timestamp))
        ) {
          latestData[sensorType] = data;
        }
      });

      setStatusData((prevData) =>
        prevData.map((item) => {
          switch (item.id) {
            case "temperature_humidity":
              const temp = latestData["temperatura"];
              const hum = latestData["humedad"];

              // Verificar si los sensores están habilitados
              const tempEnabled = sensorStates.temperature_humidity;
              const humEnabled = sensorStates.temperature_humidity;

              let tempValue = "--";
              let humValue = "--";

              if (
                tempEnabled &&
                temp?.valor &&
                typeof temp.valor === "number"
              ) {
                tempValue = temp.valor.toString();
              }

              if (humEnabled && hum?.valor && typeof hum.valor === "number") {
                humValue = hum.valor.toString();
              }

              return {
                ...item,
                value: `${tempValue} °C / ${humValue} %`,
                trend:
                  !tempEnabled || !humEnabled
                    ? "Sensor apagado"
                    : isConnected
                      ? "En línea"
                      : "Desconectado",
                color:
                  !tempEnabled || !humEnabled
                    ? ("danger" as const)
                    : temp?.valor && hum?.valor
                      ? ("success" as const)
                      : ("warning" as const),
              };

            case "air_quality":
              const airQuality = latestData["calidad del aire"];
              const airEnabled = sensorStates.air_quality;

              return {
                ...item,
                value: !airEnabled
                  ? "Apagado"
                  : airQuality?.valor || "Esperando...",
                trend: !airEnabled
                  ? "Sensor apagado"
                  : airQuality?.unidad || "Esperando datos...",
                color: !airEnabled
                  ? ("danger" as const)
                  : airQuality?.valor === "BUENA"
                    ? ("success" as const)
                    : airQuality?.valor === "MALA"
                      ? ("danger" as const)
                      : ("warning" as const),
              };

            case "lighting":
              const light = latestData["luz"];
              const lightEnabled = sensorStates.lighting;

              return {
                ...item,
                value: !lightEnabled
                  ? "Apagado"
                  : light?.valor || "Esperando...",
                trend: !lightEnabled
                  ? "Sensor apagado"
                  : light?.unidad || "Esperando datos...",
                color: !lightEnabled
                  ? ("danger" as const)
                  : light?.valor === "SI"
                    ? ("success" as const)
                    : light?.valor === "NO"
                      ? ("warning" as const)
                      : ("warning" as const),
              };

            case "motion_detection":
              const distance = latestData["distancia"];
              const distanceEnabled = sensorStates.motion_detection;

              return {
                ...item,
                value: !distanceEnabled
                  ? "Apagado"
                  : distance?.valor
                    ? `${distance.valor} cm`
                    : "-- cm",
                trend: !distanceEnabled
                  ? "Sensor apagado"
                  : distance
                    ? "Detectando"
                    : "Esperando datos...",
                color: !distanceEnabled
                  ? ("danger" as const)
                  : distance?.valor
                    ? ("primary" as const)
                    : ("warning" as const),
              };

            case "pressure":
              const pressure = latestData["presión"];
              const pressureEnabled = sensorStates.pressure;

              return {
                ...item,
                value: !pressureEnabled
                  ? "Apagado"
                  : pressure?.valor
                    ? `${pressure.valor} hPa`
                    : "-- hPa",
                trend: !pressureEnabled
                  ? "Sensor apagado"
                  : pressure?.valor
                    ? `${pressure.valor < 1010 ? "Baja presión" : pressure.valor > 1025 ? "Alta presión" : "Normal"}`
                    : "Esperando datos...",
                color: !pressureEnabled
                  ? ("danger" as const)
                  : pressure?.valor
                    ? pressure.valor < 1005 || pressure.valor > 1030
                      ? ("danger" as const)
                      : pressure.valor < 1010 || pressure.valor > 1025
                        ? ("warning" as const)
                        : ("success" as const)
                    : ("warning" as const),
              };

            case "fan":
              const fan = latestData["ventilador"];
              const fanEnabled = sensorStates.fan;

              return {
                ...item,
                value: !fanEnabled
                  ? "Apagado"
                  : fan?.valor === "ON"
                    ? "Encendido"
                    : fan?.valor === "OFF"
                      ? "Apagado"
                      : "Estado desconocido",
                trend: !fanEnabled
                  ? "Motor deshabilitado"
                  : fan?.valor === "ON"
                    ? "Motor funcionando"
                    : fan?.valor === "OFF"
                      ? "Motor detenido"
                      : "Esperando datos...",
                color: !fanEnabled
                  ? ("danger" as const)
                  : fan?.valor === "ON"
                    ? ("success" as const)
                    : fan?.valor === "OFF"
                      ? ("warning" as const)
                      : ("warning" as const),
              };

            default:
              return item;
          }
        })
      );
    }
  }, [sensorData, isConnected, sensorStates]);

  // Generar alertas basadas en los datos de sensores
  const [alerts, setAlerts] = useState([
    {
      id: "connection_status",
      title: "Estado de Conexión",
      description: `Sistema MQTT: ${connectionStatus}`,
      level: isConnected ? ("info" as const) : ("danger" as const),
      timestamp: "ahora",
    },
  ]);

  // Actualizar alertas basadas en datos de sensores
  useEffect(() => {
    const newAlerts = [
      {
        id: "connection_status",
        title: "Estado de Conexión",
        description: `Sistema MQTT: ${connectionStatus}`,
        level: isConnected ? ("info" as const) : ("danger" as const),
        timestamp: "ahora",
      },
    ];

    if (sensorData.length > 0) {
      const latestData: { [key: string]: any } = {};

      // Obtener los datos más recientes de cada sensor
      sensorData.forEach((data) => {
        const sensorType = data.sensor_type?.toLowerCase();
        if (
          sensorType &&
          (!latestData[sensorType] ||
            new Date(data.timestamp) >
              new Date(latestData[sensorType].timestamp))
        ) {
          latestData[sensorType] = data;
        }
      });

      // Alerta de calidad del aire
      const airQuality = latestData["calidad del aire"];
      if (airQuality?.valor === "MALA") {
        newAlerts.push({
          id: "air_quality_alert",
          title: "Calidad del Aire Mala",
          description: `Sensor reporta aire malo ${airQuality.unidad}`,
          level: "danger" as const,
          timestamp: airQuality.timestamp,
        });
      }

      // Alerta de temperatura (si está fuera del rango normal)
      const temp = latestData["temperatura"];
      if (temp?.valor && (temp.valor > 30 || temp.valor < 18)) {
        newAlerts.push({
          id: "temp_alert",
          title: temp.valor > 30 ? "Temperatura Elevada" : "Temperatura Baja",
          description: `Sensor reporta ${temp.valor}°C`,
          level: "danger" as const,
          timestamp: temp.timestamp,
        });
      }

      // Alerta de buzzer activo
      const buzzer = latestData["buzzer"];
      if (buzzer?.valor === "ON") {
        newAlerts.push({
          id: "buzzer_alert",
          title: "Buzzer Activado",
          description: "Sistema de alerta sonora activo",
          level: "danger" as const,
          timestamp: buzzer.timestamp,
        });
      }

      // Alerta de presión atmosférica anómala
      const pressure = latestData["presión"];
      if (pressure?.valor && (pressure.valor < 1005 || pressure.valor > 1030)) {
        newAlerts.push({
          id: "pressure_alert",
          title:
            pressure.valor < 1005 ? "Presión Muy Baja" : "Presión Muy Alta",
          description: `Sensor reporta ${pressure.valor} hPa - ${pressure.valor < 1005 ? "Posible mal tiempo" : "Condiciones atmosféricas inusuales"}`,
          level: "danger" as const,
          timestamp: pressure.timestamp,
        });
      } else if (
        pressure?.valor &&
        (pressure.valor < 1010 || pressure.valor > 1025)
      ) {
        newAlerts.push({
          id: "pressure_warning",
          title: pressure.valor < 1010 ? "Presión Baja" : "Presión Alta",
          description: `Sensor reporta ${pressure.valor} hPa - Monitoreo recomendado`,
          level: "warning" as const,
          timestamp: pressure.timestamp,
        });
      }

      // Alerta de ventilador
      const fan = latestData["ventilador"];
      if (fan?.valor === "ON" && sensorStates.fan) {
        newAlerts.push({
          id: "fan_active",
          title: "Ventilador Activo",
          description: "El ventilador DC está funcionando correctamente",
          level: "info" as const,
          timestamp: fan.timestamp,
        });
      } else if (fan?.valor === "ERROR") {
        newAlerts.push({
          id: "fan_error",
          title: "Error en Ventilador",
          description: "Se detectó un error en el ventilador DC",
          level: "danger" as const,
          timestamp: fan.timestamp,
        });
      }
    }

    setAlerts(newAlerts);
  }, [sensorData, isConnected, connectionStatus]);

  // Estado específico del ventilador
  const fanData = sensorData.find(
    (data) =>
      data.sensor_type?.toLowerCase() === "ventilador" ||
      data.topic.includes("fan") ||
      data.topic.includes("motor")
  );

  // Handler para comandos de LEDs y buzzer
  const handleLedCommand = (command: any) => {
    let topic = "";
    let payload = {};

    switch (command.type) {
      case "control":
        topic = "GRUPO2/commands/rasp01/leds/control";
        payload = {
          mode: command.mode,
          timestamp: new Date().toISOString(),
          source: "frontend",
        };

        // Actualizar estado local inmediatamente
        setLedStates((prev) => ({
          ...prev,
          manual_mode: command.mode === "manual",
          timestamp: new Date().toISOString(),
        }));
        break;

      case "individual":
        topic = "GRUPO2/commands/rasp01/leds/individual";
        payload = {
          led: command.led,
          action: command.action,
          timestamp: new Date().toISOString(),
          source: "frontend",
        };

        // Actualizar estado local inmediatamente
        if (command.action === "toggle") {
          setLedStates((prev) => ({
            ...prev,
            leds: {
              ...prev.leds,
              [command.led]: !prev.leds[command.led as keyof typeof prev.leds],
            },
            timestamp: new Date().toISOString(),
          }));
        }
        break;

      case "pattern":
        topic = "GRUPO2/commands/rasp01/leds/pattern";
        payload = {
          pattern: command.pattern,
          timestamp: new Date().toISOString(),
          source: "frontend",
        };

        // Actualizar estado local inmediatamente según el patrón
        let newLedStates = { ...ledStates.leds };
        switch (command.pattern) {
          case "all_on":
            newLedStates = {
              temperature: true,
              humidity: true,
              light: true,
              air_quality: true,
            };
            break;
          case "all_off":
            newLedStates = {
              temperature: false,
              humidity: false,
              light: false,
              air_quality: false,
            };
            break;
          case "alternate":
            newLedStates = {
              temperature: true,
              humidity: false,
              light: true,
              air_quality: false,
            };
            break;
          case "sequence":
            // Para secuencia, encendemos el primero inicialmente
            newLedStates = {
              temperature: true,
              humidity: false,
              light: false,
              air_quality: false,
            };
            break;
        }

        setLedStates((prev) => ({
          ...prev,
          leds: newLedStates,
          timestamp: new Date().toISOString(),
        }));
        break;

      case "buzzer":
        topic = "GRUPO2/commands/rasp01/buzzer";
        payload = {
          enabled: command.state,
          timestamp: new Date().toISOString(),
          source: "frontend",
        };

        // Actualizar estado local inmediatamente
        setLedStates((prev) => ({
          ...prev,
          buzzer: command.state,
          timestamp: new Date().toISOString(),
        }));
        break;

      default:
        console.error("Tipo de comando LED/Buzzer desconocido:", command.type);
        return;
    }

    console.log(
      `🔧 [LED Control] Enviando comando ${command.type === "buzzer" ? "Buzzer" : "LED"} a: ${topic}`
    );
    console.log(`🔧 [LED Control] Payload:`, payload);
    console.log(`🔧 [LED Control] Estado actual antes del comando:`, ledStates);

    const success = publishCommand(topic, payload);
    if (success) {
      console.log(
        `✅ [LED Control] Comando ${command.type === "buzzer" ? "Buzzer" : "LED"} enviado exitosamente`
      );
    } else {
      console.error(
        `❌ [LED Control] Error enviando comando ${command.type === "buzzer" ? "Buzzer" : "LED"}`
      );
    }
  };

  // Handler específico para el ventilador
  const handleToggleFan = () => {
    const newState = !sensorStates.fan;

    const payload = {
      enabled: newState,
      timestamp: new Date().toISOString(),
      source: "frontend",
    };

    console.log(
      `🔧 Sending fan command to: GRUPO2/commands/rasp01/actuators/fan`
    );
    console.log(`🔧 Payload:`, payload);
    console.log(`🔧 Current fan state: ${sensorStates.fan} -> ${newState}`);

    const success = publishCommand(
      "GRUPO2/commands/rasp01/actuators/fan",
      payload
    );
    if (success) {
      console.log(
        `✅ Fan command sent successfully: ${newState ? "ON" : "OFF"}`
      );
      setSensorStates((prev) => ({
        ...prev,
        fan: newState,
      }));
    } else {
      console.error(`❌ Error sending fan command`);
    }
  };

  // Add toggle handler
  const handleTogglePower = (id: string) => {
    setSensorStates((prev) => {
      const newState = !prev[id as SensorId];

      // Mapeo de comandos del dashboard a comandos MQTT
      const mqttCommands = [];

      switch (id) {
        case "temperature_humidity":
          mqttCommands.push(
            {
              topic: "GRUPO2/commands/rasp01/sensors/temperature",
              enabled: newState,
            },
            {
              topic: "GRUPO2/commands/rasp01/sensors/humidity",
              enabled: newState,
            }
          );
          break;
        case "lighting":
          mqttCommands.push({
            topic: "GRUPO2/commands/rasp01/sensors/light",
            enabled: newState,
          });
          break;
        case "motion_detection":
          mqttCommands.push({
            topic: "GRUPO2/commands/rasp01/sensors/distance",
            enabled: newState,
          });
          break;
        case "pressure":
          mqttCommands.push({
            topic: "GRUPO2/commands/rasp01/sensors/pressure",
            enabled: newState,
          });
          break;
        case "fan":
          mqttCommands.push({
            topic: "GRUPO2/commands/rasp01/actuators/fan",
            enabled: newState,
          });
          break;
        default:
          mqttCommands.push({
            topic: `GRUPO2/commands/rasp01/sensors/${id}`,
            enabled: newState,
          });
      }

      // Enviar todos los comandos MQTT necesarios
      let allCommandsSuccessful = true;
      mqttCommands.forEach(({ topic, enabled }) => {
        const payload = {
          enabled,
          timestamp: new Date().toISOString(),
          source: "frontend",
        };

        const success = publishCommand(topic, payload);
        if (success) {
          console.log(
            `✅ Command sent: ${topic} ${enabled ? "ENABLED" : "DISABLED"}`
          );
        } else {
          console.error(`❌ Error sending command for ${topic}`);
          allCommandsSuccessful = false;
        }
      });

      // Si algún comando falló, revertir explícitamente el estado
      if (!allCommandsSuccessful) {
        console.log(`🔄 Reverting state for ${id} due to MQTT command failure`);
        return {
          ...prev,
          [id]: !newState, // Revertir explícitamente al estado opuesto
        };
      }

      return {
        ...prev,
        [id]: newState,
      };
    });
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Resumen del Sistema SIEPA
          </h1>
          <p className="text-foreground-600 mt-1">
            Estado actual de los sensores ambientales - Conexión MQTT:{" "}
            {connectionStatus}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
          ></div>
          <span className="text-sm text-foreground-600">
            {isConnected ? "Conectado" : "Desconectado"}
          </span>
        </div>
      </div>

      {/* Status Overview Grid */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          Métricas Ambientales
        </h2>
        <StatusOverviewGrid
          statusData={statusData}
          onViewDetails={(id) => console.log("View details for:", id)}
          sensorStates={sensorStates}
          onTogglePower={handleTogglePower}
        />
      </section>

      {/* Fan Control Panel */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          Control de Actuadores
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FanControlPanel
            isConnected={isConnected}
            fanState={
              fanData
                ? {
                    valor: fanData.valor,
                    timestamp: fanData.timestamp,
                  }
                : undefined
            }
            onToggleFan={handleToggleFan}
            isEnabled={sensorStates.fan}
          />
          <LEDControlPanel
            isConnected={isConnected}
            ledStates={ledStates}
            onLedCommand={handleLedCommand}
          />
        </div>
      </section>

      {/* Alerts Panel */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          Alertas del Sistema
        </h2>
        <AlertsPanel
          alerts={alerts}
          onViewAll={() => console.log("View all alerts")}
          onSettings={() => console.log("Alert settings")}
        />
      </section>
    </div>
  );
}
