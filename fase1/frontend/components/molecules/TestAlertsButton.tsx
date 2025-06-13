/**
 * TestAlertsButton - Component for testing the alert system
 *
 * A development utility component that allows testing the alert system
 * by simulating dangerous sensor values and triggering alerts.
 */

"use client";

import { Button } from "@heroui/button";
import { useSystemStore } from "@/lib/store/useSystemStore";

export default function TestAlertsButton() {
  const { addAlert, evaluateRisk } = useSystemStore();

  const simulateTemperatureAlert = () => {
    evaluateRisk("temperature", 45); // Temperatura muy alta (peligrosa)
  };

  const simulateHumidityWarning = () => {
    evaluateRisk("humidity", 75); // Humedad alta (advertencia)
  };

  const simulateAirQualityAlert = () => {
    evaluateRisk("air_quality", 1); // Calidad del aire mala
  };

  const simulateMultipleAlerts = () => {
    evaluateRisk("temperature", 50);
    evaluateRisk("humidity", 10);
    evaluateRisk("distance", 2);
  };

  const addCustomAlert = () => {
    addAlert({
      type: "info",
      sensor: "system",
      message: "Alerta de prueba personalizada",
      value: "test",
      threshold: 0,
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        color="danger"
        variant="bordered"
        onClick={simulateTemperatureAlert}
      >
        🌡️ Simular Temp. Alta
      </Button>
      <Button
        size="sm"
        color="warning"
        variant="bordered"
        onClick={simulateHumidityWarning}
      >
        💧 Simular Humedad
      </Button>
      <Button
        size="sm"
        color="danger"
        variant="bordered"
        onClick={simulateAirQualityAlert}
      >
        💨 Simular Aire Malo
      </Button>
      <Button
        size="sm"
        color="secondary"
        variant="bordered"
        onClick={simulateMultipleAlerts}
      >
        🚨 Múltiples Alertas
      </Button>
      <Button
        size="sm"
        color="primary"
        variant="bordered"
        onClick={addCustomAlert}
      >
        ℹ️ Alerta Info
      </Button>
    </div>
  );
}
