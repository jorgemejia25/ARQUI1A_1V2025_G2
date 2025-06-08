"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";

import AlertsDemo from "@/components/molecules/AlertsDemo";
import AlertsPanel from "@/components/molecules/AlertsPanel";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Switch } from "@heroui/switch";
import TestAlertsButton from "@/components/molecules/TestAlertsButton";
import { useMqtt } from "./useMqtt";
import { useState } from "react";
import { useSystemStore } from "@/lib/store/useSystemStore";

export default function MqttSensorsPage() {
  // Obtener datos del store del sistema
  const {
    sensorData: storeSensorData,
    status,
    clearSensorData,
  } = useSystemStore();

  // Estado local para los switches de sensores
  const [sensorStates, setSensorStates] = useState({
    temperature: true,
    humidity: true,
    distance: true,
    light: true,
    air_quality: true,
  });

  const {
    isConnected,
    sensorData,
    connectionStatus,
    clearData,
    reconnect,
    publishCommand,
  } = useMqtt(
    "wss://broker.hivemq.com:8884/mqtt",
    [
      "siepa/sensors",
      "siepa/sensors/+",
      "siepa/actuators/+",
      "siepa/status/sensors/+",
    ],
    (sensorType: string, enabled: boolean) => {
      setSensorStates((prev) => ({
        ...prev,
        [sensorType]: enabled,
      }));
    }
  );

  // Función para limpiar todos los datos
  const handleClearData = () => {
    clearData();
    clearSensorData();
  };

  // Función para manejar el cambio de estado de un sensor
  const handleSensorToggle = (sensorType: string, enabled: boolean) => {
    setSensorStates((prev) => ({
      ...prev,
      [sensorType]: enabled,
    }));

    // Enviar comando MQTT
    const topic = `siepa/commands/sensors/${sensorType}`;
    const payload = {
      enabled: enabled,
      timestamp: new Date().toISOString(),
      source: "frontend",
    };

    const success = publishCommand(topic, payload);
    if (success) {
      console.log(
        `✅ Comando enviado: ${sensorType} ${enabled ? "HABILITADO" : "DESHABILITADO"}`
      );
    } else {
      console.error(`❌ Error enviando comando para ${sensorType}`);
      // Revertir el estado local si falla
      setSensorStates((prev) => ({
        ...prev,
        [sensorType]: !enabled,
      }));
    }
  };

  // Función para obtener el icono del sensor
  const getSensorDisplayInfo = (sensorType: string) => {
    switch (sensorType) {
      case "temperature":
        return { icon: "🌡️", name: "Temperatura", color: "danger" as const };
      case "humidity":
        return { icon: "💧", name: "Humedad", color: "primary" as const };
      case "distance":
        return { icon: "📏", name: "Distancia", color: "secondary" as const };
      case "light":
        return { icon: "💡", name: "Luz", color: "warning" as const };
      case "air_quality":
        return {
          icon: "💨",
          name: "Calidad del Aire",
          color: "success" as const,
        };
      default:
        return { icon: "📡", name: "Sensor", color: "default" as const };
    }
  };

  const getChipColor = (status: string) => {
    switch (status) {
      case "Conectado y suscrito":
        return "success";
      case "Conectado":
        return "primary";
      case "Reconectando...":
        return "warning";
      case "Desconectado":
      case "Offline":
        return "default";
      default:
        return "danger";
    }
  };

  const getSensorIcon = (sensorType: string) => {
    switch (sensorType) {
      case "Temperatura":
        return "🌡️";
      case "Humedad":
        return "💧";
      case "Distancia":
        return "📏";
      case "Luz":
        return "💡";
      case "Calidad del Aire":
        return "💨";
      case "Buzzer":
        return "🔔";
      case "Sistema Completo":
        return "📊";
      default:
        return "📡";
    }
  };

  const getSensorChipColor = (sensorType: string) => {
    switch (sensorType) {
      case "Temperatura":
        return "danger";
      case "Humedad":
        return "primary";
      case "Distancia":
        return "secondary";
      case "Luz":
        return "warning";
      case "Calidad del Aire":
        return "success";
      case "Buzzer":
        return "default";
      case "Sistema Completo":
        return "primary";
      default:
        return "default";
    }
  };

  const getLatestByTopic = () => {
    const latest: { [key: string]: (typeof sensorData)[0] } = {};
    sensorData.forEach((data) => {
      if (
        !latest[data.topic] ||
        new Date(data.timestamp) > new Date(latest[data.topic].timestamp)
      ) {
        latest[data.topic] = data;
      }
    });
    return Object.values(latest).filter(
      (data) => data.topic !== "siepa/sensors"
    );
  };

  const getCompleteSystemData = () => {
    return sensorData.find(
      (data) => data.topic === "siepa/sensors" && data.complete_data
    );
  };

  const latestData = getLatestByTopic();
  const systemData = getCompleteSystemData();

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          🌟 Sistema SIEPA - Monitor MQTT
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Conectado a: Mosquitto Local (ws://localhost:9001) | Tópicos:
          siepa/sensors/*
        </p>
      </div>

      {/* Estado de conexión */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl font-semibold">Estado de Conexión MQTT</h2>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="bordered"
                onClick={handleClearData}
                disabled={sensorData.length === 0}
              >
                Limpiar Datos
              </Button>
              <Button
                size="sm"
                color="primary"
                onClick={reconnect}
                disabled={isConnected}
              >
                Reconectar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Chip color={getChipColor(connectionStatus)} variant="flat">
                {connectionStatus}
              </Chip>
              <span className="text-sm text-gray-500">
                {isConnected ? "🟢" : "🔴"}
                {isConnected
                  ? " Recibiendo datos del sistema SIEPA"
                  : " Sin conexión a Mosquitto"}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    status.systemMode === "danger"
                      ? "bg-danger animate-pulse"
                      : status.systemMode === "warning"
                        ? "bg-warning"
                        : "bg-success"
                  }`}
                ></div>
                <span className="text-foreground-600">
                  {status.systemMode === "danger"
                    ? "Estado Crítico"
                    : status.systemMode === "warning"
                      ? "Advertencias"
                      : "Normal"}
                </span>
              </div>
              {status.activeAlerts > 0 && (
                <Chip
                  size="sm"
                  color={status.systemMode === "danger" ? "danger" : "warning"}
                  variant="flat"
                >
                  {status.activeAlerts} alertas
                </Chip>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Panel de Alertas */}
      <div className="mb-6">
        <AlertsPanel />
      </div>

      {/* Demostración de Alertas Automáticas */}
      <div className="mb-6">
        <AlertsDemo />
      </div>

      {/* Control de Sensores */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl font-semibold">🎛️ Control de Sensores</h2>
            <Chip
              variant="bordered"
              size="sm"
              color={isConnected ? "success" : "danger"}
            >
              {isConnected ? "Comandos disponibles" : "Desconectado"}
            </Chip>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(sensorStates).map(([sensorType, enabled]) => {
              const { icon, name, color } = getSensorDisplayInfo(sensorType);
              return (
                <div
                  key={sensorType}
                  className="border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{icon}</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {name}
                      </span>
                    </div>
                    <Switch
                      size="sm"
                      color={color}
                      isSelected={enabled}
                      onValueChange={(value) =>
                        handleSensorToggle(sensorType, value)
                      }
                      isDisabled={!isConnected}
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    Estado: {enabled ? "Habilitado" : "Deshabilitado"}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Tópico: siepa/commands/sensors/{sensorType}
                  </div>
                </div>
              );
            })}
          </div>
          {!isConnected && (
            <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-sm text-orange-700 dark:text-orange-300">
                ⚠️ Conecte a MQTT para habilitar el control de sensores
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Datos completos del sistema */}
      {systemData && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-xl font-semibold">
              📊 Datos Completos del Sistema SIEPA
            </h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {systemData.complete_data &&
                Object.entries(systemData.complete_data).map(([key, value]) => {
                  if (key === "timestamp" || key === "mode" || key === "system")
                    return null;

                  let displayKey = key;
                  let displayValue = value as any;
                  let unit = "";

                  switch (key) {
                    case "temperature":
                      displayKey = "🌡️ Temperatura";
                      unit = "°C";
                      break;
                    case "humidity":
                      displayKey = "💧 Humedad";
                      unit = "%";
                      break;
                    case "distance":
                      displayKey = "📏 Distancia";
                      unit = "cm";
                      break;
                    case "light":
                      displayKey = "💡 Luz";
                      displayValue = value ? "Detectada" : "No detectada";
                      break;
                    case "air_quality_bad":
                      displayKey = "💨 Calidad del Aire";
                      displayValue = value ? "Malo" : "Bueno";
                      break;
                  }

                  return (
                    <div
                      key={key}
                      className="border rounded-lg p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {displayKey}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          {displayValue}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Modo: {systemData.complete_data?.mode?.toUpperCase()} | Última
              actualización: {systemData.timestamp}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Sensores individuales activos */}
      {latestData.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-xl font-semibold">
              🔧 Sensores Individuales Activos
            </h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {latestData.map((data, index) => {
                const { icon, name, color } = getSensorDisplayInfo(
                  data.sensor_type || "Sensor"
                );
                return (
                  <div
                    key={index}
                    className="border rounded-lg p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
                  >
                    <div className="flex gap-2 mb-2">
                      <Chip size="sm" variant="bordered" color={color}>
                        {icon} {name}
                      </Chip>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-green-600 dark:text-green-400">
                        {data.valor}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {data.unidad}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Última actualización: {data.timestamp}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Tópico: {data.topic}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Historial de datos */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl font-semibold">
              📊 Historial de Datos MQTT
            </h2>
            <Chip variant="bordered" size="sm">
              {sensorData.length} mensajes recibidos
            </Chip>
          </div>
        </CardHeader>
        <CardBody>
          {sensorData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg mb-2">
                ⏳ Esperando datos del sistema SIEPA...
              </p>
              <p className="text-sm mt-2 mb-4">
                Los datos aparecerán aquí cuando el sistema SIEPA publique en
                MQTT
              </p>
              {!isConnected && (
                <div>
                  <Button className="mt-4" color="primary" onClick={reconnect}>
                    🔗 Conectar al Broker Mosquitto
                  </Button>
                  <p className="text-xs mt-2 text-gray-400">
                    Asegúrese de que Mosquitto esté ejecutándose con WebSocket
                    en puerto 9001
                  </p>
                </div>
              )}
              {isConnected && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    💡 Conectado a MQTT pero sin datos.
                    <br />
                    Ejecute el sistema SIEPA en el backend para ver datos aquí.
                  </p>
                  <code className="text-xs block mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    python3 demo_mosquitto.py test
                  </code>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sensorData.map((data, index) => {
                const { icon, name, color } = getSensorDisplayInfo(
                  data.sensor_type || "Sensor"
                );
                return (
                  <div
                    key={index}
                    className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2">
                        <Chip size="sm" variant="bordered" color={color}>
                          {icon} {name}
                        </Chip>
                      </div>
                      <span className="text-xs text-gray-500">
                        {data.timestamp}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {data.valor}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {data.unidad}
                      </span>
                    </div>
                    <Divider className="mt-2" />
                    <div className="text-xs text-gray-500 mt-2">
                      Tópico: {data.topic}
                    </div>
                    {data.complete_data && (
                      <div className="text-xs text-gray-400 mt-1">
                        <details>
                          <summary className="cursor-pointer">
                            Ver datos completos
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto">
                            {JSON.stringify(data.complete_data, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
