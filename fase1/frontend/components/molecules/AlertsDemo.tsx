/**
 * AlertsDemo - Componente de demostración para probar alertas automáticas
 *
 * Simula datos reales del sistema SIEPA para demostrar cómo se generan
 * las alertas automáticamente cuando se detectan valores peligrosos.
 */

"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";

import { Button } from "@heroui/button";
import { useSystemStore } from "@/lib/store/useSystemStore";

export default function AlertsDemo() {
  const { addSensorData } = useSystemStore();

  const simulateTemperatureHigh = () => {
    const data = {
      topic: "siepa/sensors/temperature",
      valor: 42,
      unidad: "°C",
      timestamp: new Date().toLocaleString(),
      sensor_type: "Temperatura",
      evaluationType: "temperature",
      evalValue: 42,
    };
    addSensorData(data);
  };

  const simulateTemperatureLow = () => {
    const data = {
      topic: "siepa/sensors/temperature",
      valor: 3,
      unidad: "°C",
      timestamp: new Date().toLocaleString(),
      sensor_type: "Temperatura",
      evaluationType: "temperature",
      evalValue: 3,
    };
    addSensorData(data);
  };

  const simulateHumidityHigh = () => {
    const data = {
      topic: "siepa/sensors/humidity",
      valor: 85,
      unidad: "%",
      timestamp: new Date().toLocaleString(),
      sensor_type: "Humedad",
      evaluationType: "humidity",
      evalValue: 85,
    };
    addSensorData(data);
  };

  const simulateAirQualityBad = () => {
    const data = {
      topic: "siepa/sensors/air_quality",
      valor: "Malo",
      unidad: "Malo",
      timestamp: new Date().toLocaleString(),
      sensor_type: "Calidad del Aire",
      evaluationType: "air_quality",
      evalValue: 1, // 1 = malo
    };
    addSensorData(data);
  };

  const simulateDistanceClose = () => {
    const data = {
      topic: "siepa/sensors/distance",
      valor: 1,
      unidad: "cm",
      timestamp: new Date().toLocaleString(),
      sensor_type: "Distancia",
      evaluationType: "distance",
      evalValue: 1,
    };
    addSensorData(data);
  };

  const simulateHumidityWarning = () => {
    const data = {
      topic: "siepa/sensors/humidity",
      valor: 75,
      unidad: "%",
      timestamp: new Date().toLocaleString(),
      sensor_type: "Humedad",
      evaluationType: "humidity",
      evalValue: 75,
    };
    addSensorData(data);
  };

  const simulateNormalData = () => {
    // Simular datos normales
    const normalData = [
      {
        topic: "siepa/sensors/temperature",
        valor: 22,
        unidad: "°C",
        timestamp: new Date().toLocaleString(),
        sensor_type: "Temperatura",
        evaluationType: "temperature",
        evalValue: 22,
      },
      {
        topic: "siepa/sensors/humidity",
        valor: 45,
        unidad: "%",
        timestamp: new Date().toLocaleString(),
        sensor_type: "Humedad",
        evaluationType: "humidity",
        evalValue: 45,
      },
      {
        topic: "siepa/sensors/air_quality",
        valor: "Bueno",
        unidad: "Bueno",
        timestamp: new Date().toLocaleString(),
        sensor_type: "Calidad del Aire",
        evaluationType: "air_quality",
        evalValue: 0,
      },
    ];

    normalData.forEach((data, index) => {
      setTimeout(() => addSensorData(data), index * 500);
    });
  };

  return (
    <Card className="border-dashed border-primary">
      <CardHeader>
        <h3 className="text-lg font-semibold text-primary">
          🚨 Demostración de Alertas Automáticas
        </h3>
      </CardHeader>
      <CardBody>
        <p className="text-sm text-foreground-600 mb-4">
          Simula datos del sistema SIEPA para ver cómo se generan las alertas
          automáticamente:
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Alertas de Peligro */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-danger">🔴 Peligro</h4>
            <Button
              size="sm"
              color="danger"
              variant="flat"
              className="w-full"
              onClick={simulateTemperatureHigh}
            >
              🌡️ Temp. 42°C
            </Button>
            <Button
              size="sm"
              color="danger"
              variant="flat"
              className="w-full"
              onClick={simulateTemperatureLow}
            >
              🥶 Temp. 3°C
            </Button>
            <Button
              size="sm"
              color="danger"
              variant="flat"
              className="w-full"
              onClick={simulateHumidityHigh}
            >
              💧 Humedad 85%
            </Button>
            <Button
              size="sm"
              color="danger"
              variant="flat"
              className="w-full"
              onClick={simulateAirQualityBad}
            >
              💨 Aire Malo
            </Button>
            <Button
              size="sm"
              color="danger"
              variant="flat"
              className="w-full"
              onClick={simulateDistanceClose}
            >
              📏 Distancia 1cm
            </Button>
          </div>

          {/* Alertas de Advertencia */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-warning">
              🟡 Advertencia
            </h4>
            <Button
              size="sm"
              color="warning"
              variant="flat"
              className="w-full"
              onClick={simulateHumidityWarning}
            >
              💧 Humedad 75%
            </Button>
          </div>

          {/* Datos Normales */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-success">🟢 Normal</h4>
            <Button
              size="sm"
              color="success"
              variant="flat"
              className="w-full"
              onClick={simulateNormalData}
            >
              ✅ Datos Normales
            </Button>
          </div>
        </div>

        <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
          <p className="text-xs text-primary-700 dark:text-primary-300">
            💡 <strong>Umbrales configurados:</strong>
            <br />
            • Temperatura: Peligro &lt;5°C o &gt;40°C | Advertencia &lt;10°C o
            &gt;35°C
            <br />
            • Humedad: Peligro &lt;20% o &gt;80% | Advertencia &lt;30% o &gt;70%
            <br />
            • Distancia: Peligro &lt;2cm o &gt;300cm | Advertencia &lt;5cm o
            &gt;200cm
            <br />• Calidad del Aire: Peligro = Malo (sin advertencia)
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
