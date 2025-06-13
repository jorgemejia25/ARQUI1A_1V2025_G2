"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Select, SelectItem } from "@heroui/select";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Switch } from "@heroui/switch";
import { useMqtt } from "../../mqtt-sensors/useMqtt";

// Configuración de sensores disponibles
const SENSOR_CONFIG = {
  temperatura: {
    label: "🌡️ Temperatura",
    color: "#ef4444",
    unit: "°C",
  },
  humedad: {
    label: "💧 Humedad",
    color: "#3b82f6",
    unit: "%",
  },
  luz: {
    label: "💡 Iluminación",
    color: "#facc15",
    unit: "lux",
  },
  gas: {
    label: "💨 Calidad del Aire",
    color: "#8b5cf6",
    unit: "ppm",
  },
  presion: {
    label: "🌬️ Presión",
    color: "#10b981",
    unit: "hPa",
  },
  distancia: {
    label: "📏 Distancia",
    color: "#f59e0b",
    unit: "cm",
  },
};

type SensorType = keyof typeof SENSOR_CONFIG;

interface SensorDataItem {
  topic: string;
  valor: any;
  unidad: string;
  timestamp: string;
  sensor_type?: string;
  complete_data?: any;
}

interface ProcessedDataPoint {
  time: string;
  value: number;
  timestamp: number;
  unit: string;
  originalTimestamp: string;
}

// Mapeo de topics a tipos de sensores - ACTUALIZADO PARA GRUPO2
const mapTopicToSensorType = (topicSuffix: string): string | null => {
  const mapping: Record<string, string> = {
    temperatura: "temperatura",
    temperature: "temperatura",
    humedad: "humedad",
    humidity: "humedad",
    luz: "luz",
    light: "luz",
    gas: "gas",
    air_quality: "gas",
    presion: "presion",
    pressure: "presion",
    distancia: "distancia",
    distance: "distancia",
  };
  return mapping[topicSuffix] || null;
};

export default function HistoryPage() {
  // Estados locales
  const [selectedSensor, setSelectedSensor] =
    useState<SensorType>("temperatura");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Conexión MQTT - TOPICS ACTUALIZADOS PARA GRUPO2
  const { isConnected, sensorData, connectionStatus, clearData } = useMqtt(
    "wss://broker.hivemq.com:8884/mqtt",
    [
      "GRUPO2/sensores/rasp01/+",
      "GRUPO2/sensores/rasp01/temperatura",
      "GRUPO2/sensores/rasp01/humedad",
      "GRUPO2/sensores/rasp01/luz",
      "GRUPO2/sensores/rasp01/gas",
      "GRUPO2/sensores/rasp01/presion",
      "GRUPO2/sensores/rasp01/distancia",
      "GRUPO2/actuadores/rasp01/+",
      "GRUPO2/status/rasp01/+",
    ]
  );

  // Procesar datos por sensor manteniendo los últimos 20 de cada uno
  const processedDataBySensor = useMemo(() => {
    const dataBySensor: Record<string, ProcessedDataPoint[]> = {};

    // Inicializar arrays para cada sensor
    Object.keys(SENSOR_CONFIG).forEach((sensor) => {
      dataBySensor[sensor] = [];
    });

    // Filtrar datos válidos - ACTUALIZADO PARA GRUPO2
    const validSensorData = sensorData.filter((item: SensorDataItem) => {
      if (item.topic.startsWith("GRUPO2/status/")) return false;
      if (
        typeof item.valor === "object" &&
        item.valor?.sensor &&
        item.valor?.enabled !== undefined
      )
        return false;
      return true;
    });

    console.log(
      "📊 Historial - Procesando datos:",
      validSensorData.length,
      "elementos válidos"
    );

    // Agrupar datos por sensor
    validSensorData.forEach((item: SensorDataItem) => {
      const sensorType = item.sensor_type?.toLowerCase();
      if (!sensorType || !SENSOR_CONFIG[sensorType as SensorType]) {
        // Intentar extraer tipo del topic si no viene en sensor_type
        const topicParts = item.topic.split("/");
        const potentialType = topicParts[topicParts.length - 1];
        const mappedType = mapTopicToSensorType(potentialType);

        if (!mappedType) {
          console.log(
            "⚠️ No se pudo mapear:",
            sensorType || potentialType,
            "Topic:",
            item.topic
          );
          return;
        }

        // Usar el tipo mapeado
        item.sensor_type = mappedType;
      }

      const finalSensorType = item.sensor_type!.toLowerCase();
      const value =
        typeof item.valor === "number" ? item.valor : parseFloat(item.valor);
      if (isNaN(value)) return;

      const timestamp = new Date(item.timestamp);

      dataBySensor[finalSensorType].push({
        time: timestamp.toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        value,
        timestamp: timestamp.getTime(),
        unit: item.unidad || SENSOR_CONFIG[finalSensorType as SensorType].unit,
        originalTimestamp: item.timestamp,
      });

      console.log(
        "✅ Historial - Agregado:",
        finalSensorType,
        value,
        "del topic:",
        item.topic
      );
    });

    // Mantener solo los últimos 20 datos por sensor, ordenados cronológicamente
    Object.keys(dataBySensor).forEach((sensor) => {
      dataBySensor[sensor] = dataBySensor[sensor]
        .sort((a, b) => b.timestamp - a.timestamp) // Más recientes primero
        .slice(0, 20) // Últimos 20
        .reverse(); // Mostrar cronológicamente (más antiguos primero)
    });

    return dataBySensor;
  }, [sensorData]);

  // Datos del sensor seleccionado
  const selectedSensorData = processedDataBySensor[selectedSensor] || [];
  const selectedConfig = SENSOR_CONFIG[selectedSensor];

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setLastUpdate(new Date());
      }, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Actualizar cuando llegan nuevos datos
  useEffect(() => {
    if (sensorData.length > 0) {
      setLastUpdate(new Date());
    }
  }, [sensorData]);

  // Handlers
  const handleClearData = useCallback(() => {
    clearData();
    setLastUpdate(new Date());
  }, [clearData]);

  const handleSensorChange = useCallback((keys: any) => {
    const selected = Array.from(keys)[0] as SensorType;
    setSelectedSensor(selected);
  }, []);

  // Estadísticas
  const totalDataPoints = Object.values(processedDataBySensor).reduce(
    (sum, data) => sum + data.length,
    0
  );
  const activeSensors = Object.entries(processedDataBySensor).filter(
    ([_, data]) => data.length > 0
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Historial de Sensores
          </h1>
          <p className="text-foreground-600 mt-1">
            GRUPO2/sensores/rasp01 - Últimos 20 datos en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-sm text-foreground-600">
            {isConnected ? "Conectado" : "Desconectado"}
          </span>
          {lastUpdate && (
            <span className="text-xs text-foreground-500">
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Controles */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sensor a mostrar:</label>
              <Select
                selectedKeys={[selectedSensor]}
                onSelectionChange={handleSensorChange}
                size="sm"
                className="max-w-xs"
              >
                {Object.entries(SENSOR_CONFIG).map(([key, config]) => {
                  const hasData = processedDataBySensor[key]?.length > 0;
                  return (
                    <SelectItem
                      key={key}
                      className={!hasData ? "opacity-50" : ""}
                    >
                      {config.label}{" "}
                      {hasData
                        ? `(${processedDataBySensor[key].length} datos)`
                        : "(Sin datos)"}
                    </SelectItem>
                  );
                })}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Auto-actualizar:</label>
              <div className="flex items-center gap-2">
                <Switch
                  size="sm"
                  isSelected={autoRefresh}
                  onValueChange={setAutoRefresh}
                  color="success"
                />
                <span className="text-xs text-foreground-600">
                  {autoRefresh ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Intervalo:</label>
              <Select
                selectedKeys={[refreshInterval.toString()]}
                onSelectionChange={(keys) =>
                  setRefreshInterval(parseInt(Array.from(keys)[0] as string))
                }
                size="sm"
                className="max-w-xs"
                isDisabled={!autoRefresh}
              >
                <SelectItem key="2">2 segundos</SelectItem>
                <SelectItem key="5">5 segundos</SelectItem>
                <SelectItem key="10">10 segundos</SelectItem>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="bordered"
                size="sm"
                onPress={handleClearData}
                isDisabled={totalDataPoints === 0}
              >
                🗑️ Limpiar datos
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Estadísticas del sensor seleccionado */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-primary">
              {selectedSensorData.length}
            </div>
            <div className="text-sm text-foreground-600">Datos del sensor</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-success">
              {activeSensors}
            </div>
            <div className="text-sm text-foreground-600">Sensores activos</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-warning">
              {sensorData.length}
            </div>
            <div className="text-sm text-foreground-600">Total datos MQTT</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <div
              className={`text-2xl font-bold ${isConnected ? "text-success" : "text-danger"}`}
            >
              {isConnected ? "🟢" : "🔴"}
            </div>
            <div className="text-sm text-foreground-600">Estado MQTT</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <div className="text-lg font-bold text-secondary">
              {selectedSensorData.length > 0
                ? `${selectedSensorData[selectedSensorData.length - 1]?.value} ${selectedConfig.unit}`
                : "---"}
            </div>
            <div className="text-sm text-foreground-600">Último valor</div>
          </CardBody>
        </Card>
      </div>

      {/* Gráfica del sensor seleccionado */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <h3 className="text-xl font-semibold">{selectedConfig.label}</h3>
            <div className="flex items-center gap-2">
              <Chip size="sm" variant="bordered" color="primary">
                Últimos {selectedSensorData.length}/20 datos
              </Chip>
              {selectedSensorData.length > 0 && (
                <Chip size="sm" color="success">
                  Actualizándose en tiempo real
                </Chip>
              )}
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {selectedSensorData.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">
                {selectedConfig.label.split(" ")[0]}
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Sin datos para {selectedConfig.label}
              </h3>
              <p className="text-gray-600 mb-4">
                Los datos aparecerán cuando el sensor envíe información
              </p>
              <div className="text-sm text-gray-500 space-y-1">
                <p>
                  Estado MQTT: <strong>{connectionStatus}</strong>
                </p>
                <p>
                  Conexión:{" "}
                  <strong>
                    {isConnected ? "✅ Conectado" : "❌ Desconectado"}
                  </strong>
                </p>
                <p>
                  Topics: <strong>GRUPO2/sensores/rasp01/*</strong>
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={450}>
              <LineChart
                data={selectedSensorData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => [
                    `${value} ${selectedConfig.unit}`,
                    selectedConfig.label,
                  ]}
                  labelFormatter={(label) => `Hora: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={selectedConfig.color}
                  strokeWidth={3}
                  dot={{ r: 4, fill: selectedConfig.color }}
                  activeDot={{ r: 6 }}
                  name={`${selectedConfig.label} (${selectedConfig.unit})`}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>

      {/* Debug info */}
      <Card>
        <CardBody>
          <div className="text-xs text-gray-500">
            <p>
              <strong>🔧 Debug:</strong> {isConnected ? "✅" : "❌"} | Estado:{" "}
              {connectionStatus} | Total MQTT: {sensorData.length} | Sensor
              actual: {selectedSensorData.length} datos
            </p>
            {selectedSensorData.length > 0 && (
              <p>
                <strong>Último dato:</strong>{" "}
                {
                  selectedSensorData[selectedSensorData.length - 1]
                    ?.originalTimestamp
                }
              </p>
            )}
            <p>
              <strong>Topics suscritos:</strong> GRUPO2/sensores/rasp01/+,
              GRUPO2/actuadores/rasp01/+, GRUPO2/status/rasp01/+
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Footer */}
      <Card>
        <CardBody>
          <div className="flex justify-between items-center text-xs text-foreground-600">
            <span>📊 GRUPO2/sensores/rasp01</span>
            <span>💾 Últimos 20 datos por sensor</span>
            <span>🔄 Actualización continua sin límites</span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
