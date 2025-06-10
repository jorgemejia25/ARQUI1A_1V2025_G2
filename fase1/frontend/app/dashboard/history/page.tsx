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
import { useCallback, useEffect, useState } from "react";

import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Switch } from "@heroui/switch";
import { useMqttContext } from "@/lib/providers/MqttProvider";
import { useSystemStore } from "@/lib/store/useSystemStore";

// Tipos de datos para las gráficas
type ChartEntry = {
  time: string;
  value: number;
  timestamp: Date;
};

// Función auxiliar para mapear nombres de sensores
function mapSensorType(sensorType: string): string {
  const mappings: Record<string, string> = {
    temperatura: "temperature",
    humedad: "humidity",
    luz: "light",
    ldr: "light",
    co2: "air_quality",
    "calidad del aire": "air_quality",
    presion: "pressure",
    presión: "pressure",
    distancia: "distance",
    temperature: "temperature",
    humidity: "humidity",
    light: "light",
    air_quality: "air_quality",
    pressure: "pressure",
    distance: "distance",
  };

  return mappings[sensorType.toLowerCase()] || sensorType;
}

export default function HistoryDashboardPage() {
  // Hooks del sistema - ahora todo desde el store global
  const {
    chartData,
    getChartData,
    clearChartData,
    sensorData,
    status,
    checkSystemActivity,
  } = useSystemStore();

  // Usar el contexto MQTT global
  const { isConnected: mqttConnected, connectionStatus: mqttStatus } =
    useMqttContext();

  // Estado para datos formateados para las gráficas
  const [formattedChartData, setFormattedChartData] = useState<{
    [key: string]: ChartEntry[];
  }>({});

  // Estado para controlar si los datos necesitan actualización
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Monitor de actividad del sistema (verificar cada 5 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      checkSystemActivity();
      // Marcar que necesita actualización si hay nuevos datos
      setNeedsUpdate(true);
    }, 5000); // Reducido para mejor responsividad

    return () => clearInterval(interval);
  }, [checkSystemActivity]);

  // Detectar cuando hay nuevos datos MQTT
  useEffect(() => {
    if (sensorData.length > 0) {
      setNeedsUpdate(true);
    }
  }, [sensorData.length]);

  // Función para actualizar las gráficas manualmente
  const updateCharts = useCallback(() => {
    const formatted: { [key: string]: ChartEntry[] } = {};

    Object.keys(chartData).forEach((sensorType) => {
      const data = getChartData(sensorType, 30); // Aumentado a 30 puntos
      formatted[sensorType] = data
        .map((point) => ({
          time: new Date(point.x).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          value: point.y,
          timestamp: new Date(point.x),
        }))
        .reverse(); // Mostrar más recientes al final
    });

    setFormattedChartData(formatted);
    setNeedsUpdate(false);
    setLastUpdateTime(new Date());
  }, [chartData, getChartData]);

  // Actualización inicial
  useEffect(() => {
    updateCharts();
  }, []);

  // Auto-refresh cuando está habilitado
  useEffect(() => {
    if (autoRefresh && needsUpdate) {
      updateCharts();
    }
  }, [autoRefresh, needsUpdate, updateCharts]);

  // Función para obtener datos de un sensor específico
  const getSensorChartData = (sensorType: string) => {
    return formattedChartData[sensorType] || [];
  };

  // Función para obtener el último valor de un sensor
  const getLastValue = (sensorType: string) => {
    const data = getSensorChartData(sensorType);
    if (data.length === 0) return null;
    const lastPoint = data[data.length - 1];
    return {
      value: lastPoint.value,
      time: lastPoint.timestamp.toLocaleTimeString(),
      date: lastPoint.timestamp.toLocaleDateString(),
    };
  };

  // Función para obtener la unidad de un sensor
  const getSensorUnit = (sensorType: string) => {
    const units: Record<string, string> = {
      temperature: "°C",
      humidity: "%",
      light: "lux",
      air_quality: "ppm",
      pressure: "hPa",
      distance: "cm",
    };
    return units[sensorType] || "";
  };

  // Función para combinar temperatura y humedad
  const getTempHumidityData = () => {
    const tempData = getSensorChartData("temperature");
    const humidityData = getSensorChartData("humidity");

    const maxLength = Math.max(tempData.length, humidityData.length);
    const combined = [];

    for (let i = 0; i < maxLength; i++) {
      combined.push({
        time: tempData[i]?.time || humidityData[i]?.time || "",
        temperatura: tempData[i]?.value || 0,
        humedad: humidityData[i]?.value || 0,
      });
    }

    return combined;
  };

  // Componente para mostrar el último valor de un sensor
  const LastValueChip = ({ sensorType }: { sensorType: string }) => {
    const lastValue = getLastValue(sensorType);
    const unit = getSensorUnit(sensorType);

    if (!lastValue) return null;

    return (
      <div className="flex flex-col gap-1">
        <Chip size="sm" variant="bordered" color="success">
          Último: {lastValue.value}
          {unit}
        </Chip>
        <span className="text-xs text-gray-500">
          {lastValue.time} - {lastValue.date}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">
          📈 Reporte Histórico
        </h1>
        <div className="flex gap-2 items-center flex-wrap">
          <Chip color={mqttConnected ? "success" : "danger"} variant="flat">
            {mqttConnected ? "🟢 MQTT Conectado" : "🔴 MQTT Desconectado"}
          </Chip>
          <Chip
            color={status.isSystemActive ? "success" : "warning"}
            variant="flat"
            size="sm"
          >
            {status.isSystemActive ? "📊 Sistema Activo" : "⏳ Sin Datos"}
          </Chip>
          {status.isSyncing && (
            <Chip color="primary" variant="flat" size="sm">
              🔄 Sincronizando...
            </Chip>
          )}
          {needsUpdate && !autoRefresh && (
            <Chip color="warning" variant="flat" size="sm">
              ⚠️ Datos nuevos disponibles
            </Chip>
          )}
          {autoRefresh && (
            <Chip color="success" variant="flat" size="sm">
              🔄 Auto-actualización activa
            </Chip>
          )}
          {lastUpdateTime && (
            <span className="text-xs text-gray-500">
              Última actualización: {lastUpdateTime.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Controles de actualización */}
      <Card>
        <CardBody>
          <div className="flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <Button
                color="primary"
                onClick={updateCharts}
                disabled={
                  (!needsUpdate && Object.keys(chartData).length === 0) ||
                  autoRefresh
                }
              >
                🔄 Actualizar Gráficas
              </Button>
              <Button
                size="sm"
                variant="bordered"
                onClick={() => clearChartData()}
                disabled={Object.keys(chartData).length === 0}
              >
                🗑️ Limpiar Todas las Gráficas
              </Button>
              <div className="flex items-center gap-2">
                <Switch
                  size="sm"
                  isSelected={autoRefresh}
                  onValueChange={setAutoRefresh}
                  color="success"
                />
                <span className="text-sm text-gray-600">Auto-actualizar</span>
              </div>
            </div>
            <div className="flex gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>{Object.keys(chartData).length} sensores con datos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>{sensorData.length} mensajes MQTT recibidos</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {!mqttConnected && (
        <Card>
          <CardBody>
            <div className="text-center py-4">
              <p className="text-warning">
                ⚠️ Sin conexión MQTT - No se reciben datos en tiempo real
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Conecte a MQTT para ver datos en tiempo real del sistema SIEPA
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {Object.keys(formattedChartData).length === 0 && (
        <Card>
          <CardBody>
            <div className="text-center py-8">
              <p className="text-lg text-gray-500 mb-2">
                📈 No hay datos de historial disponibles
              </p>
              <p className="text-sm text-gray-400">
                Los datos aparecerán aquí cuando el sistema SIEPA publique
                información y presione "Actualizar Gráficas"
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Temperatura y humedad */}
      {(getSensorChartData("temperature").length > 0 ||
        getSensorChartData("humidity").length > 0) && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center w-full">
              <h2 className="text-xl font-semibold text-foreground">
                🌡️ Temperatura y Humedad
              </h2>
              <div className="flex gap-4 items-center">
                <LastValueChip sensorType="temperature" />
                <LastValueChip sensorType="humidity" />
                <Chip size="sm" variant="bordered">
                  {getTempHumidityData().length} puntos
                </Chip>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getTempHumidityData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => [
                    `${value}${name === "temperatura" ? "°C" : "%"}`,
                    name === "temperatura" ? "Temperatura" : "Humedad",
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="temperatura"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Temperatura"
                />
                <Line
                  type="monotone"
                  dataKey="humedad"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Humedad"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      )}

      {/* Iluminación */}
      {getSensorChartData("light").length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center w-full">
              <h2 className="text-xl font-semibold text-foreground">
                💡 Nivel de Luz
              </h2>
              <div className="flex gap-4 items-center">
                <LastValueChip sensorType="light" />
                <Chip size="sm" variant="bordered">
                  {getSensorChartData("light").length} puntos
                </Chip>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getSensorChartData("light")}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [`${value} lux`, "Nivel de Luz"]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#facc15"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Luz (lux)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      )}

      {/* Calidad del aire */}
      {getSensorChartData("air_quality").length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center w-full">
              <h2 className="text-xl font-semibold text-foreground">
                💨 Calidad del Aire (CO2/Gases)
              </h2>
              <div className="flex gap-4 items-center">
                <LastValueChip sensorType="air_quality" />
                <Chip size="sm" variant="bordered">
                  {getSensorChartData("air_quality").length} puntos
                </Chip>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getSensorChartData("air_quality")}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`${value} ppm`, "Gases/CO2"]} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Calidad del Aire (ppm)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      )}

      {/* Distancia */}
      {getSensorChartData("distance").length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center w-full">
              <h2 className="text-xl font-semibold text-foreground">
                📏 Sensor de Distancia
              </h2>
              <div className="flex gap-4 items-center">
                <LastValueChip sensorType="distance" />
                <Chip size="sm" variant="bordered">
                  {getSensorChartData("distance").length} puntos
                </Chip>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getSensorChartData("distance")}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`${value} cm`, "Distancia"]} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Distancia (cm)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      )}

      {/* Presión Atmosférica */}
      {getSensorChartData("pressure").length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center w-full">
              <h2 className="text-xl font-semibold text-foreground">
                🌬️ Presión Atmosférica
              </h2>
              <div className="flex gap-4 items-center">
                <LastValueChip sensorType="pressure" />
                <Chip size="sm" variant="bordered">
                  {getSensorChartData("pressure").length} puntos
                </Chip>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getSensorChartData("pressure")}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`${value} hPa`, "Presión"]} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Presión Atmosférica (hPa)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      )}

      {/* Información de estado */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {Object.keys(chartData).length}
              </div>
              <div className="text-sm text-gray-500">Sensores Activos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Object.values(chartData).reduce(
                  (acc, sensor) => acc + sensor.data.length,
                  0
                )}
              </div>
              <div className="text-sm text-gray-500">Puntos de Datos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {sensorData.length}
              </div>
              <div className="text-sm text-gray-500">Mensajes MQTT</div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
