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
  BarChart,
  Bar,
} from "recharts";

// Datos quemados
const historicalData = [
  { time: "08:00", temperatura: 22.5, humedad: 55 },
  { time: "10:00", temperatura: 23.1, humedad: 58 },
  { time: "12:00", temperatura: 24.0, humedad: 62 },
  { time: "14:00", temperatura: 25.2, humedad: 66 },
  { time: "16:00", temperatura: 26.0, humedad: 65 },
];

const energyData = [
  { categoria: "Iluminación", consumo: 800 },
  { categoria: "Climatización", consumo: 1200 },
  { categoria: "Equipos", consumo: 500 },
  { categoria: "Otros", consumo: 200 },
];

const lightData = [
  { time: "08:00", lux: 150 },
  { time: "10:00", lux: 400 },
  { time: "12:00", lux: 1000 },
  { time: "14:00", lux: 800 },
  { time: "16:00", lux: 500 },
];

const co2Data = [
  { time: "08:00", ppm: 450 },
  { time: "10:00", ppm: 600 },
  { time: "12:00", ppm: 850 },
  { time: "14:00", ppm: 700 },
  { time: "16:00", ppm: 500 },
];

const pressureData = [
  { time: "08:00", hPa: 1010 },
  { time: "10:00", hPa: 1012 },
  { time: "12:00", hPa: 1013 },
  { time: "14:00", hPa: 1011 },
  { time: "16:00", hPa: 1010 },
];

export default function HistoryDashboardPage() {
  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold text-foreground">Reporte Histórico</h1>

      {/* Temperatura y humedad */}
      <section className="bg-white dark:bg-content2 rounded-xl p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-foreground">
          Temperatura y Humedad
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={historicalData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis yAxisId="left" unit=" °C" />
            <YAxis yAxisId="right" orientation="right" unit=" %" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="temperatura" stroke="#6366f1" />
            <Line yAxisId="right" type="monotone" dataKey="humedad" stroke="#10b981" />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* Iluminación */}
      <section className="bg-white dark:bg-content2 rounded-xl p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-foreground">
          Iluminación (LDR)
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={lightData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis unit=" lx" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="lux" stroke="#facc15" />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* Dióxido de carbono */}
      <section className="bg-white dark:bg-content2 rounded-xl p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-foreground">
          Niveles de CO₂ 
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={co2Data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis unit=" ppm" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="ppm" stroke="#ef4444" />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* Presión atmosférica */}
      <section className="bg-white dark:bg-content2 rounded-xl p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-foreground">
          Presión Atmosférica
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={pressureData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis unit=" hPa" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="hPa" stroke="#3b82f6" />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* Consumo energético */}
      <section className="bg-white dark:bg-content2 rounded-xl p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-foreground">
          Consumo Energético por Categoría
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={energyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="categoria" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="consumo" fill="#f59e0b" name="Consumo (kWh)" />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
