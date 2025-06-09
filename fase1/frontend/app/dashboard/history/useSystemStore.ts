import { devtools, persist } from "zustand/middleware";
import { create } from "zustand";

// Tipos para el sistema de gráficas
export interface ChartDataPoint {
  x: Date; // timestamp
  y: number; // valor
}

export interface SensorChartData {
  sensorType: string;
  data: ChartDataPoint[];
  unit: string;
  color?: string;
}

interface SystemStore {
  // Datos para gráficas
  chartData: Record<string, SensorChartData>;
  
  // Acciones para manejar datos de gráficas
  addChartData: (sensorType: string, value: number, unit: string, timestamp?: Date) => void;
  getChartData: (sensorType: string, maxPoints?: number) => ChartDataPoint[];
  getAllChartData: () => SensorChartData[];
  clearChartData: (sensorType?: string) => void;
}

// Configuración de colores para cada sensor
const SENSOR_COLORS: Record<string, string> = {
  temperature: "#6366f1",  // violeta
  humidity: "#10b981",     // verde
  light: "#facc15",        // amarillo
  co2: "#ef4444",          // rojo
  pressure: "#3b82f6",     // azul
  distance: "#8b5cf6",     // morado
};

// Unidades por defecto para cada sensor
const SENSOR_UNITS: Record<string, string> = {
  temperature: "°C",
  humidity: "%",
  light: "lx",
  co2: "ppm",
  pressure: "hPa",
  distance: "m",
};

export const useSystemStore = create<SystemStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        chartData: {},
        
        // Agregar datos a las gráficas
        addChartData: (sensorType, value, unit, timestamp = new Date()) => {
          set((state) => {
            const currentChartData = state.chartData[sensorType] || {
              sensorType,
              data: [],
              unit: unit || SENSOR_UNITS[sensorType] || "",
              color: SENSOR_COLORS[sensorType],
            };
            
            const newDataPoint: ChartDataPoint = {
              x: timestamp,
              y: parseFloat(value.toFixed(2)),
            };
            
            // Agregar nuevo punto al final y mantener solo los últimos 20
            const updatedData = [...currentChartData.data, newDataPoint].slice(-20);
            
            return {
              chartData: {
                ...state.chartData,
                [sensorType]: {
                  ...currentChartData,
                  data: updatedData,
                },
              },
            };
          });
        },
        
        // Obtener datos para un sensor específico (más recientes primero)
        getChartData: (sensorType, maxPoints = 20) => {
          const chartData = get().chartData[sensorType];
          return chartData ? chartData.data.slice(-maxPoints).reverse() : [];
        },
        
        // Obtener todos los datos de gráficas
        getAllChartData: () => {
          return Object.values(get().chartData);
        },
        
        // Limpiar datos de gráficas
        clearChartData: (sensorType) => {
          if (sensorType) {
            set((state) => {
              const newChartData = { ...state.chartData };
              delete newChartData[sensorType];
              return { chartData: newChartData };
            });
          } else {
            set({ chartData: {} });
          }
        },
      }),
      {
        name: "siepa-chart-data",
        partialize: (state) => ({
          // Persistir los datos de gráficas con límite para evitar almacenamiento excesivo
          chartData: Object.fromEntries(
            Object.entries(state.chartData).map(([key, value]) => [
              key,
              {
                ...value,
                data: value.data.slice(-20) // Solo persistir los últimos 20 puntos
              }
            ])
          )
        }),
      }
    ),
    {
      name: "siepa-chart-data",
    }
  )
);

// Función auxiliar para mapear nombres de sensores
export function mapSensorType(sensorType: string): string {
  const mappings: Record<string, string> = {
    temperatura: "temperature",
    humedad: "humidity",
    luz: "light",
    ldr: "light",
    co2: "co2",
    presion: "pressure",
    distancia: "distance",
  };
  
  return mappings[sensorType.toLowerCase()] || sensorType;
}