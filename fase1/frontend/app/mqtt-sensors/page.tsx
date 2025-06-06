"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";

import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { useMqtt } from "./useMqtt";

export default function MqttSensorsPage() {
  const { isConnected, sensorData, connectionStatus, clearData, reconnect } =
    useMqtt();

  const getTopicParts = (topic: string) => {
    const parts = topic.split("/");
    return {
      sensor: parts[2] || "Desconocido",
      metric: parts[3] || "Desconocido",
    };
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
    return Object.values(latest);
  };

  const latestData = getLatestByTopic();

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Monitor de Sensores MQTT</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Conectado a: broker.hivemq.com:8884/mqtt (WebSocket) | Tópico: GRUPO2/sensores/+/+
        </p>
      </div>

      {/* Estado de conexión */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl font-semibold">Estado de Conexión</h2>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="bordered"
                onClick={clearData}
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
          <div className="flex items-center gap-3">
            <Chip color={getChipColor(connectionStatus)} variant="flat">
              {connectionStatus}
            </Chip>
            <span className="text-sm text-gray-500">
              {isConnected ? "🟢" : "🔴"}
              {isConnected ? " Recibiendo datos" : " Sin conexión"}
            </span>
          </div>
        </CardBody>
      </Card>

      {/* Resumen de sensores activos */}
      {latestData.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-xl font-semibold">Sensores Activos</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {latestData.map((data, index) => {
                const { sensor, metric } = getTopicParts(data.topic);
                return (
                  <div
                    key={index}
                    className="border rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20"
                  >
                    <div className="flex gap-2 mb-2">
                      <Chip size="sm" variant="bordered" color="primary">
                        {sensor}
                      </Chip>
                      <Chip size="sm" variant="bordered" color="secondary">
                        {metric}
                      </Chip>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {data.valor}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {data.unidad}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Última actualización: {data.timestamp}
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
            <h2 className="text-xl font-semibold">Historial de Datos</h2>
            <Chip variant="bordered" size="sm">
              {sensorData.length} mensajes recibidos
            </Chip>
          </div>
        </CardHeader>
        <CardBody>
          {sensorData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Esperando datos de sensores...</p>
              <p className="text-sm mt-2">
                Los datos aparecerán aquí cuando se reciban mensajes MQTT
              </p>
              {!isConnected && (
                <Button className="mt-4" color="primary" onClick={reconnect}>
                  Conectar al Broker MQTT
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sensorData.map((data, index) => {
                const { sensor, metric } = getTopicParts(data.topic);
                return (
                  <div
                    key={index}
                    className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2">
                        <Chip size="sm" variant="bordered" color="primary">
                          {sensor}
                        </Chip>
                        <Chip size="sm" variant="bordered" color="secondary">
                          {metric}
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

