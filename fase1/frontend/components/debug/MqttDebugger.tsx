"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { useEffect, useState } from "react";

import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { useMqttContext } from "@/lib/providers/MqttProvider";

interface DebugMessage {
  topic: string;
  timestamp: Date;
  data: any;
  type: "history" | "sensor" | "other";
}

export default function MqttDebugger() {
  const {
    isConnected,
    sensorData,
    connectionStatus,
    requestHistoricalData,
    dataQuality,
    connectionLatency,
  } = useMqttContext();

  const [debugMessages, setDebugMessages] = useState<DebugMessage[]>([]);
  const [historyRequests, setHistoryRequests] = useState<number>(0);
  const [historyResponses, setHistoryResponses] = useState<number>(0);
  const [isDebugging, setIsDebugging] = useState(false);

  // Procesar mensajes MQTT entrantes
  useEffect(() => {
    const newMessages = sensorData.slice(-10).map((data) => {
      let type: "history" | "sensor" | "other" = "other";

      if (data.topic === "GRUPO2/history/rasp01") {
        type = "history";
      } else if (data.topic.startsWith("GRUPO2/sensores/rasp01")) {
        type = "sensor";
      }

      return {
        topic: data.topic,
        timestamp: data.timestamp,
        data: data.complete_data,
        type,
      };
    });

    setDebugMessages((prev) => [...prev.slice(-50), ...newMessages]);

    // Contar respuestas de historial
    const historyMessages = newMessages.filter((msg) => msg.type === "history");
    if (historyMessages.length > 0) {
      setHistoryResponses((prev) => prev + historyMessages.length);
    }
  }, [sensorData]);

  const handleHistoryRequest = (sensorType: string, maxPoints: number) => {
    console.log(
      `🔍 [DEBUG] Solicitando historial: ${sensorType}, ${maxPoints} puntos`
    );

    const success = requestHistoricalData(sensorType, maxPoints);
    if (success) {
      setHistoryRequests((prev) => prev + 1);
      console.log(`📤 [DEBUG] Solicitud enviada exitosamente`);
    } else {
      console.error(`❌ [DEBUG] Error enviando solicitud`);
    }
  };

  const clearDebug = () => {
    setDebugMessages([]);
    setHistoryRequests(0);
    setHistoryResponses(0);
  };

  const groupedMessages = debugMessages.reduce(
    (acc, msg) => {
      if (!acc[msg.type]) {
        acc[msg.type] = [];
      }
      acc[msg.type].push(msg);
      return acc;
    },
    {} as Record<string, DebugMessage[]>
  );

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">🔍 MQTT Debugger - Raspberry Pi</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div
                className={`w-4 h-4 rounded-full mx-auto mb-2 ${isConnected ? "bg-green-500" : "bg-red-500"}`}
              />
              <div className="text-sm">Estado: {connectionStatus}</div>
              {connectionLatency > 0 && (
                <div className="text-xs text-gray-500">
                  Latencia: {connectionLatency}ms
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{dataQuality}%</div>
              <div className="text-sm">Calidad de datos</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{debugMessages.length}</div>
              <div className="text-sm">Mensajes capturados</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Card>
              <CardHeader>
                <h3 className="font-semibold">📊 Estadísticas de Historial</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Solicitudes enviadas:</span>
                    <Chip size="sm" color="primary">
                      {historyRequests}
                    </Chip>
                  </div>
                  <div className="flex justify-between">
                    <span>Respuestas recibidas:</span>
                    <Chip size="sm" color="success">
                      {historyResponses}
                    </Chip>
                  </div>
                  <div className="flex justify-between">
                    <span>Tasa de éxito:</span>
                    <Chip
                      size="sm"
                      color={
                        historyRequests > 0 &&
                        historyResponses === historyRequests
                          ? "success"
                          : "warning"
                      }
                    >
                      {historyRequests > 0
                        ? Math.round((historyResponses / historyRequests) * 100)
                        : 0}
                      %
                    </Chip>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-semibold">🧪 Tests de Historial</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  <Button
                    size="sm"
                    color="primary"
                    onPress={() => handleHistoryRequest("all", 20)}
                    disabled={!isConnected}
                    className="w-full"
                  >
                    📊 Historial completo (20 puntos)
                  </Button>
                  <Button
                    size="sm"
                    color="secondary"
                    onPress={() => handleHistoryRequest("temperature", 15)}
                    disabled={!isConnected}
                    className="w-full"
                  >
                    🌡️ Solo temperatura (15 puntos)
                  </Button>
                  <Button
                    size="sm"
                    color="warning"
                    onPress={() => handleHistoryRequest("humidity", 10)}
                    disabled={!isConnected}
                    className="w-full"
                  >
                    💧 Solo humedad (10 puntos)
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="flex gap-2 mb-4">
            <Button size="sm" variant="bordered" onPress={clearDebug}>
              🗑️ Limpiar Debug
            </Button>
            <Button
              size="sm"
              variant="bordered"
              onPress={() => setIsDebugging(!isDebugging)}
              color={isDebugging ? "warning" : "default"}
            >
              {isDebugging ? "⏸️ Pausar" : "▶️ Activar"} Debug Detallado
            </Button>
          </div>

          {isDebugging && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold">📋 Mensajes por Tipo</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {Object.entries(groupedMessages).map(([type, messages]) => (
                    <div key={type}>
                      <h4 className="font-medium mb-2 capitalize">
                        {type === "history"
                          ? "📊 Historial"
                          : type === "sensor"
                            ? "🔬 Sensores"
                            : "📡 Otros"}
                        ({messages.length})
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {messages.slice(-5).map((msg, idx) => (
                          <div
                            key={idx}
                            className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-mono text-xs">
                                {msg.topic}
                              </span>
                              <span className="text-gray-500">
                                {msg.timestamp.toLocaleTimeString("es-ES", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                  hour12: false,
                                })}
                              </span>
                            </div>
                            {type === "history" &&
                              msg.data?.type === "historical_data" && (
                                <div className="text-green-600 dark:text-green-400">
                                  ✅ {msg.data.data?.length || 0} puntos
                                  históricos recibidos
                                  {msg.data.data?.length > 0 && (
                                    <div className="text-gray-600 dark:text-gray-300 mt-1">
                                      Sensores:{" "}
                                      {
                                        new Set(
                                          msg.data.data.map(
                                            (d: any) => d.sensor_type
                                          )
                                        ).size
                                      }
                                    </div>
                                  )}
                                </div>
                              )}
                            {type === "sensor" && (
                              <div className="text-blue-600 dark:text-blue-400">
                                Valor:{" "}
                                {msg.data?.value || msg.data?.valor || "N/A"}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {groupedMessages.history && groupedMessages.history.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold">
                  🔍 Último Mensaje de Historial
                </h3>
              </CardHeader>
              <CardBody>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-sm">
                  <pre>
                    {JSON.stringify(
                      groupedMessages.history[
                        groupedMessages.history.length - 1
                      ].data,
                      null,
                      2
                    )}
                  </pre>
                </div>
              </CardBody>
            </Card>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
