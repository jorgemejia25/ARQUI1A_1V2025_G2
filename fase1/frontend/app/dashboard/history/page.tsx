"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import { useSystemStore, mapSensorType } from "./useSystemStore";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { useMqtt } from "@/app/mqtt-sensors/useMqtt";

// Tipos de datos para las gráficas
type ChartEntry = {
  time: string;
  value: number;
};

export default function HistoryDashboardPage() {
  // Hooks del sistema
  const { chartData, addChartData, getChartData, clearChartData } =
    useSystemStore();

  // Hook MQTT para datos en tiempo real
  const { isConnected, sensorData } = useMqtt(
    "wss://broker.hivemq.com:8884/mqtt",
    [
      "siepa/sensors",
      "siepa/sensors/+",
      "siepa/actuators/+",
      "siepa/status/sensors/+",
    ]
  );

  // Estado para datos formateados para las gráficas
  const [formattedChartData, setFormattedChartData] = useState<{
    [key: string]: ChartEntry[];
  }>({});

  // Efecto para procesar datos MQTT y agregarlos al store
  useEffect(() => {
    if (sensorData.length > 0) {
      const latestData = sensorData[sensorData.length - 1];

      // Procesar datos completos del sistema
      if (latestData.complete_data) {
        const timestamp = new Date(latestData.timestamp);

        Object.entries(latestData.complete_data).forEach(([key, value]) => {
          if (key === "timestamp" || key === "mode" || key === "system") return;

          let sensorType = "";
          let numericValue = 0;
          let unit = "";

          switch (key) {
            case "temperature":
              sensorType = "temperature";
              numericValue = parseFloat(value as string);
              unit = "°C";
              break;
            case "humidity":
              sensorType = "humidity";
              numericValue = parseFloat(value as string);
              unit = "%";
              break;
            case "distance":
              sensorType = "distance";
              numericValue = parseFloat(value as string);
              unit = "cm";
              break;
            case "light":
              sensorType = "light";
              numericValue = value ? 1 : 0; // Convertir boolean a numérico
              unit = "estado";
              break;
            case "air_quality_bad":
              sensorType = "co2";
              numericValue = value ? 1 : 0; // Convertir boolean a numérico
              unit = "estado";
              break;
          }

          if (sensorType && !isNaN(numericValue)) {
            addChartData(sensorType, numericValue, unit, timestamp);
          }
        });
      }

      // Procesar datos individuales de sensores
      if (latestData.sensor_type && latestData.valor) {
        const mappedType = mapSensorType(latestData.sensor_type);
        const timestamp = new Date(latestData.timestamp);
        const value = parseFloat(latestData.valor);

        if (!isNaN(value)) {
          addChartData(mappedType, value, latestData.unidad || "", timestamp);
        }
      }
    }
  }, [sensorData, addChartData]);

  // Formatear datos para las gráficas
  useEffect(() => {
    const formatted: { [key: string]: ChartEntry[] } = {};

    Object.keys(chartData).forEach((sensorType) => {
      const data = getChartData(sensorType, 20);
      formatted[sensorType] = data.map((point) => ({
        time: new Date(point.x).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        value: point.y,
      }));
    });

    setFormattedChartData(formatted);
  }, [chartData, getChartData]);

  // Función para obtener datos de un sensor específico
  const getSensorChartData = (sensorType: string) => {
    return formattedChartData[sensorType] || [];
  };

  // Función para combinar temperatura y humedad
  const getTempHumidityData = () => {
    const tempData = getSensorChartData("temperature");
    const humidityData = getSensorChartData("humidity");

    const combined = tempData.map((temp, index) => ({
      time: temp.time,
      temperatura: temp.value,
      humedad: humidityData[index]?.value || 0,
    }));

    return combined;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">
          Reporte Histórico
        </h1>
        <div className="flex gap-2 items-center">
          <Chip color={isConnected ? "success" : "danger"} variant="flat">
            {isConnected ? "🟢 MQTT Conectado" : "🔴 MQTT Desconectado"}
          </Chip>
          <Button
            size="sm"
            variant="bordered"
            onClick={() => clearChartData()}
            disabled={Object.keys(chartData).length === 0}
          >
            Limpiar Gráficas
          </Button>
        </div>
      </div>

      {!isConnected && (
        <Card>
          <CardBody>
            <div className="text-center py-4">
              <p className="text-warning">
                ⚠️ Sin conexión MQTT - Mostrando datos simulados
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Conecte a MQTT para ver datos en tiempo real del sistema SIEPA
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Temperatura y humedad */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl font-semibold text-foreground">
              🌡️ Temperatura y Humedad
            </h2>
            <Chip size="sm" variant="bordered">
              {getTempHumidityData().length} puntos
            </Chip>
          </div>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getTempHumidityData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" unit=" °C" />
              <YAxis yAxisId="right" orientation="right" unit=" %" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="temperatura"
                stroke="#6366f1"
                name="Temperatura"
                dot={false}
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="humedad"
                stroke="#10b981"
                name="Humedad"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Iluminación */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl font-semibold text-foreground">
              💡 Iluminación (LDR)
            </h2>
            <Chip size="sm" variant="bordered">
              {getSensorChartData("light").length} puntos
            </Chip>
          </div>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getSensorChartData("light")}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis unit=" lx" />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#facc15"
                name="Luz"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Calidad del aire / CO₂ */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl font-semibold text-foreground">
              💨 Calidad del Aire
            </h2>
            <Chip size="sm" variant="bordered">
              {getSensorChartData("co2").length} puntos
            </Chip>
          </div>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getSensorChartData("co2")}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis unit=" estado" />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#ef4444"
                name="Calidad del Aire"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Distancia */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl font-semibold text-foreground">
              📏 Distancia
            </h2>
            <Chip size="sm" variant="bordered">
              {getSensorChartData("distance").length} puntos
            </Chip>
          </div>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getSensorChartData("distance")}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis unit=" cm" />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#8b5cf6"
                name="Distancia"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

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
