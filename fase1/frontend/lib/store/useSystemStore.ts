import { devtools, persist } from "zustand/middleware";

import { create } from "zustand";

// Tipos para el sistema de alertas
export interface Alert {
  id: string;
  type: "danger" | "warning" | "info";
  sensor: string;
  message: string;
  value: any;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
}

export interface SensorThreshold {
  min?: number;
  max?: number;
  warningMin?: number;
  warningMax?: number;
}

export interface SystemStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastSync: Date | null;
  lastDataReceived: Date | null;
  mqttStatus: string;
  activeAlerts: number;
  systemMode: "normal" | "warning" | "danger";
  isSystemActive: boolean; // Indica si el sistema SIEPA está enviando datos
}

export interface SensorData {
  topic: string;
  valor: any;
  unidad: string;
  timestamp: string;
  sensor_type?: string;
  complete_data?: any;
  evaluationType?: string;
  evalValue?: number;
}

// Nuevo tipo para el historial en memoria
export interface SensorHistoryPoint {
  timestamp: Date;
  value: number;
  sensor_type: string;
  unit: string;
  formatted_time: string;
}

// Tipos para el sistema de gráficas/historial
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
  // Estado del sistema
  status: SystemStatus;
  alerts: Alert[];
  sensorData: SensorData[];

  // Buffer de historial en memoria (últimos 20 datos por sensor)
  sensorHistory: Record<string, SensorHistoryPoint[]>;

  // Datos para gráficas/historial
  chartData: Record<string, SensorChartData>;

  // Configuración de umbrales
  thresholds: Record<string, SensorThreshold>;

  // Acciones para actualizar el estado del sistema
  updateConnectionStatus: (isConnected: boolean, mqttStatus: string) => void;
  setSyncStatus: (isSyncing: boolean) => void;
  checkSystemActivity: () => void;

  // Acciones para manejar datos de sensores
  addSensorData: (data: SensorData) => void;
  clearSensorData: () => void;

  // Acciones para el historial en memoria
  getHistoryData: (sensorType?: string) => SensorHistoryPoint[];
  clearHistoryData: () => void;

  // Acciones para manejar datos de gráficas/historial
  addChartData: (
    sensorType: string,
    value: number,
    unit: string,
    timestamp?: Date
  ) => void;
  getChartData: (sensorType: string, maxPoints?: number) => ChartDataPoint[];
  getAllChartData: () => SensorChartData[];
  clearChartData: (sensorType?: string) => void;

  // Acciones para manejar alertas
  addAlert: (alert: Omit<Alert, "id" | "timestamp" | "acknowledged">) => void;
  acknowledgeAlert: (alertId: string) => void;
  clearAcknowledgedAlerts: () => void;
  clearAllAlerts: () => void;

  // Función para evaluar riesgos
  evaluateRisk: (sensorType: string, value: number) => void;

  // Configuración de umbrales
  updateThreshold: (sensorType: string, threshold: SensorThreshold) => void;
}

// Umbrales por defecto para cada tipo de sensor
const defaultThresholds: Record<string, SensorThreshold> = {
  temperature: {
    min: 5, // Muy frío - peligroso
    max: 40, // Muy caliente - peligroso
    warningMin: 10, // Frío - advertencia
    warningMax: 35, // Caliente - advertencia
  },
  humidity: {
    min: 20, // Muy seco - peligroso
    max: 80, // Muy húmedo - peligroso
    warningMin: 30, // Seco - advertencia
    warningMax: 70, // Húmedo - advertencia
  },
  distance: {
    min: 2, // Muy cerca - peligroso
    max: 300, // Muy lejos - peligroso
    warningMin: 5, // Cerca - advertencia
    warningMax: 200, // Lejos - advertencia
  },
  air_quality: {
    // Para calidad del aire en ppm
    max: 400, // Por encima de 400 ppm = peligroso
    warningMax: 300, // Por encima de 300 ppm = advertencia
  },
  light: {
    // Para sensor de luz en lux
    max: 900, // Por encima de 900 lux = muy brillante (advertencia)
    warningMax: 700, // Por encima de 700 lux = brillante
  },
  pressure: {
    // Para presión atmosférica en hPa
    min: 1000, // Por debajo de 1000 hPa = baja presión
    max: 1030, // Por encima de 1030 hPa = alta presión
    warningMin: 1005, // Advertencia presión baja
    warningMax: 1025, // Advertencia presión alta
  },
};

// Configuración de colores para cada sensor
const SENSOR_COLORS: Record<string, string> = {
  temperature: "#6366f1", // violeta
  humidity: "#10b981", // verde
  light: "#facc15", // amarillo
  co2: "#ef4444", // rojo
  air_quality: "#ef4444", // rojo
  pressure: "#3b82f6", // azul
  distance: "#8b5cf6", // morado
};

// Unidades por defecto para cada sensor
const SENSOR_UNITS: Record<string, string> = {
  temperature: "°C",
  humidity: "%",
  light: "lux",
  co2: "ppm",
  air_quality: "ppm",
  pressure: "hPa",
  distance: "cm",
};

export const useSystemStore = create<SystemStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        status: {
          isConnected: false,
          isSyncing: false,
          lastSync: null,
          lastDataReceived: null,
          mqttStatus: "Desconectado",
          activeAlerts: 0,
          systemMode: "normal",
          isSystemActive: false,
        },
        alerts: [],
        sensorData: [],
        sensorHistory: {},
        chartData: {},
        thresholds: defaultThresholds,

        // Actualizar estado de conexión
        updateConnectionStatus: (isConnected, mqttStatus) => {
          set((state) => ({
            status: {
              ...state.status,
              isConnected,
              mqttStatus,
              lastSync: isConnected ? new Date() : state.status.lastSync,
            },
          }));
        },

        // Actualizar estado de sincronización
        setSyncStatus: (isSyncing) => {
          set((state) => ({
            status: {
              ...state.status,
              isSyncing,
              lastSync: isSyncing ? new Date() : state.status.lastSync,
            },
          }));
        },

        // Agregar datos de sensor
        addSensorData: (data) => {
          set((state) => {
            // Verificar duplicados con tolerancia de tiempo más precisa
            const isDuplicate = state.sensorData.some((existing) => {
              const timeDiff = Math.abs(
                new Date(existing.timestamp).getTime() -
                  new Date(data.timestamp).getTime()
              );
              return (
                existing.topic === data.topic &&
                existing.valor === data.valor &&
                timeDiff < 1000 // 1 segundo de tolerancia
              );
            });

            if (isDuplicate) {
              console.log("🔄 Dato duplicado detectado, ignorando...");
              return state;
            }

            // Mantener más datos para mejor historial
            const newData = [data, ...state.sensorData.slice(0, 99)];

            // Procesar timestamp - manejar tanto Unix timestamp como ISO string
            const getTimestamp = (ts: any): Date => {
              if (!ts) return new Date();
              if (typeof ts === "number") {
                // Si es un timestamp Unix (segundos), convertir a milisegundos
                return new Date(ts < 1e12 ? ts * 1000 : ts);
              }
              return new Date(ts);
            };

            // Procesar datos del historial (nuevo formato optimizado)
            if (data.complete_data?.type === "historical_data") {
              const historyData = data.complete_data.data || [];
              console.log(
                `📊 Procesando datos históricos: ${historyData.length} puntos`
              );

              // Procesar cada punto histórico
              historyData.forEach((point: any) => {
                if (
                  point.sensor_type &&
                  point.value !== undefined &&
                  !point.sensor_type.startsWith("_")
                ) {
                  const timestamp = getTimestamp(point.timestamp);
                  const numericValue =
                    typeof point.value === "number"
                      ? point.value
                      : parseFloat(String(point.value));

                  if (!isNaN(numericValue)) {
                    setTimeout(() => {
                      get().addChartData(
                        point.sensor_type,
                        numericValue,
                        point.unit || SENSOR_UNITS[point.sensor_type] || "",
                        timestamp
                      );
                    }, 0);
                  }
                }
              });

              return {
                sensorData: newData,
                status: {
                  ...state.status,
                  isSyncing: true,
                  lastSync: new Date(),
                  lastDataReceived: new Date(),
                  isSystemActive: true,
                },
              };
            }

            // Priorizar nuevo formato con evaluationType del backend mejorado
            if (data.evaluationType && data.evalValue !== undefined) {
              const timestamp = getTimestamp(data.timestamp);
              const numericValue =
                typeof data.evalValue === "number"
                  ? data.evalValue
                  : parseFloat(String(data.evalValue));

              if (!isNaN(numericValue)) {
                // Agregar al historial en memoria
                const historyPoint: SensorHistoryPoint = {
                  timestamp,
                  value: numericValue,
                  sensor_type: data.evaluationType!,
                  unit: data.unidad,
                  formatted_time: timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  }),
                };

                // Agregar al buffer de historial (máximo 20 datos por sensor)
                const currentHistory =
                  state.sensorHistory[data.evaluationType!] || [];
                const newHistory = [historyPoint, ...currentHistory].slice(
                  0,
                  20
                );

                setTimeout(() => {
                  get().addChartData(
                    data.evaluationType!,
                    numericValue,
                    data.unidad,
                    timestamp
                  );
                  get().evaluateRisk(data.evaluationType!, numericValue);
                }, 0);

                return {
                  sensorData: newData,
                  sensorHistory: {
                    ...state.sensorHistory,
                    [data.evaluationType!]: newHistory,
                  },
                  status: {
                    ...state.status,
                    isSyncing: true,
                    lastSync: new Date(),
                    lastDataReceived: new Date(),
                    isSystemActive: true,
                  },
                };
              }
            }
            // Fallback mejorado para datos con sensor_type
            else if (data.sensor_type && data.valor !== undefined) {
              const typeMap: Record<string, string> = {
                Temperatura: "temperature",
                Humedad: "humidity",
                Distancia: "distance",
                "Calidad del Aire": "air_quality",
                Luz: "light",
                Presión: "pressure",
                "Presión Atmosférica": "pressure",
                "Sensor de Distancia": "distance",
                "Nivel de Luz": "light",
                "CO2/Gases": "air_quality",
                temperature: "temperature",
                humidity: "humidity",
                light: "light",
                air_quality: "air_quality",
                pressure: "pressure",
                distance: "distance",
              };

              const evalType = typeMap[data.sensor_type];
              if (evalType) {
                const timestamp = getTimestamp(data.timestamp);
                const numericValue =
                  typeof data.valor === "number"
                    ? data.valor
                    : parseFloat(String(data.valor));

                if (!isNaN(numericValue)) {
                  // Agregar al historial en memoria
                  const historyPoint: SensorHistoryPoint = {
                    timestamp,
                    value: numericValue,
                    sensor_type: evalType,
                    unit: data.unidad,
                    formatted_time: timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    }),
                  };

                  // Agregar al buffer de historial (máximo 20 datos por sensor)
                  const currentHistory = state.sensorHistory[evalType] || [];
                  const newHistory = [historyPoint, ...currentHistory].slice(
                    0,
                    20
                  );

                  setTimeout(() => {
                    get().addChartData(
                      evalType,
                      numericValue,
                      data.unidad,
                      timestamp
                    );
                    get().evaluateRisk(evalType, numericValue);
                  }, 0);

                  return {
                    sensorData: newData,
                    sensorHistory: {
                      ...state.sensorHistory,
                      [evalType]: newHistory,
                    },
                    status: {
                      ...state.status,
                      isSyncing: true,
                      lastSync: new Date(),
                      lastDataReceived: new Date(),
                      isSystemActive: true,
                    },
                  };
                }
              }
            }

            return {
              sensorData: newData,
              status: {
                ...state.status,
                isSyncing: true,
                lastSync: new Date(),
                lastDataReceived: new Date(),
                isSystemActive: true,
              },
            };
          });

          // Detener sincronización después de un breve delay
          setTimeout(() => {
            set((state) => ({
              status: {
                ...state.status,
                isSyncing: false,
              },
            }));
          }, 300); // Más rápido para mejor UX
        },

        // Limpiar datos de sensores
        clearSensorData: () => {
          set((state) => ({
            sensorData: [],
          }));
        },

        // Obtener datos del historial en memoria
        getHistoryData: (sensorType) => {
          const history = get().sensorHistory;
          if (sensorType) {
            return history[sensorType] || [];
          }
          // Si no se especifica sensor, devolver todos los datos
          return Object.values(history).flat().sort((a, b) => 
            b.timestamp.getTime() - a.timestamp.getTime()
          );
        },

        // Limpiar historial en memoria
        clearHistoryData: () => {
          set((state) => ({
            sensorHistory: {},
          }));
        },

        // Agregar datos a las gráficas
        addChartData: (sensorType, value, unit, timestamp = new Date()) => {
          set((state) => {
            // Validaciones de entrada para prevenir errores
            if (!sensorType || value === null || value === undefined) {
              console.warn("addChartData: Datos inválidos", {
                sensorType,
                value,
                unit,
                timestamp,
              });
              return state;
            }

            // Convertir value a número de forma segura
            const numericValue =
              typeof value === "number" ? value : parseFloat(String(value));
            if (isNaN(numericValue)) {
              console.warn("addChartData: Valor no numérico", {
                sensorType,
                value,
              });
              return state;
            }

            // Validar timestamp
            const validTimestamp =
              timestamp instanceof Date ? timestamp : new Date();

            const currentChartData = state.chartData[sensorType] || {
              sensorType,
              data: [],
              unit: unit || SENSOR_UNITS[sensorType] || "",
              color: SENSOR_COLORS[sensorType],
            };

            const newDataPoint: ChartDataPoint = {
              x: validTimestamp,
              y: Math.round(numericValue * 100) / 100, // Redondear a 2 decimales de forma segura
            };

            // Verificar si ya existe un punto muy similar (evitar duplicados)
            const isDuplicatePoint = currentChartData.data.some((point) => {
              // Validar que point.x sea Date antes de usar getTime()
              if (!(point.x instanceof Date)) {
                console.warn("Punto de datos con timestamp inválido", point);
                return false;
              }

              const timeDiff = Math.abs(
                point.x.getTime() - validTimestamp.getTime()
              );
              const valueDiff = Math.abs(point.y - newDataPoint.y);
              return timeDiff < 2000 && valueDiff < 0.1; // 2 segundos y 0.1 de diferencia
            });

            if (isDuplicatePoint) {
              return state; // No agregar punto duplicado
            }

            // Filtrar puntos con timestamps inválidos y agregar nuevo punto
            const validData = currentChartData.data.filter(
              (point) => point.x instanceof Date
            );
            const updatedData = [...validData, newDataPoint]
              .sort((a, b) => a.x.getTime() - b.x.getTime()) // Ordenar por tiempo
              .slice(-100); // Mantener los últimos 100 puntos

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
          return chartData ? chartData.data.slice(-maxPoints) : [];
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

        // Agregar nueva alerta
        addAlert: (alertData) => {
          const newAlert: Alert = {
            ...alertData,
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            acknowledged: false,
          };

          set((state) => {
            // Mantener solo las 20 alertas más recientes
            const newAlerts = [newAlert, ...state.alerts].slice(0, 20);
            const activeAlerts = newAlerts.filter(
              (a) => !a.acknowledged
            ).length;

            // Determinar modo del sistema basado en alertas activas
            let systemMode: "normal" | "warning" | "danger" = "normal";
            const hasActiveDanger = newAlerts.some(
              (a) => !a.acknowledged && a.type === "danger"
            );
            const hasActiveWarning = newAlerts.some(
              (a) => !a.acknowledged && a.type === "warning"
            );

            if (hasActiveDanger) {
              systemMode = "danger";
            } else if (hasActiveWarning) {
              systemMode = "warning";
            }

            return {
              alerts: newAlerts,
              status: {
                ...state.status,
                activeAlerts,
                systemMode,
              },
            };
          });
        },

        // Reconocer alerta
        acknowledgeAlert: (alertId) => {
          set((state) => {
            const updatedAlerts = state.alerts.map((alert) =>
              alert.id === alertId ? { ...alert, acknowledged: true } : alert
            );

            const activeAlerts = updatedAlerts.filter(
              (a) => !a.acknowledged
            ).length;

            // Recalcular modo del sistema
            let systemMode: "normal" | "warning" | "danger" = "normal";
            const hasActiveDanger = updatedAlerts.some(
              (a) => !a.acknowledged && a.type === "danger"
            );
            const hasActiveWarning = updatedAlerts.some(
              (a) => !a.acknowledged && a.type === "warning"
            );

            if (hasActiveDanger) {
              systemMode = "danger";
            } else if (hasActiveWarning) {
              systemMode = "warning";
            }

            return {
              alerts: updatedAlerts,
              status: {
                ...state.status,
                activeAlerts,
                systemMode,
              },
            };
          });
        },

        // Limpiar alertas reconocidas
        clearAcknowledgedAlerts: () => {
          set((state) => ({
            alerts: state.alerts.filter((alert) => !alert.acknowledged),
          }));
        },

        // Limpiar todas las alertas
        clearAllAlerts: () => {
          set((state) => ({
            alerts: [],
            status: {
              ...state.status,
              activeAlerts: 0,
              systemMode: "normal",
            },
          }));
        },

        // Evaluar riesgo basado en umbrales
        evaluateRisk: (sensorType, value) => {
          const state = get();
          const threshold = state.thresholds[sensorType];

          if (!threshold) return;

          const sensorDisplayName = getSensorDisplayName(sensorType);

          // Evitar alertas duplicadas recientes (últimos 30 segundos)
          const recentAlerts = state.alerts.filter(
            (alert) =>
              alert.sensor === sensorType &&
              !alert.acknowledged &&
              new Date().getTime() - alert.timestamp.getTime() < 30000
          );

          if (recentAlerts.length > 0) return;

          // Generar mensaje específico según el sensor y valor
          const generateMessage = (
            type: "danger" | "warning",
            sensor: string,
            val: number
          ) => {
            switch (sensor) {
              case "temperature":
                if (type === "danger") {
                  return val < (threshold.min || 0)
                    ? `🥶 Temperatura extremadamente baja: ${val}°C - ¡Riesgo de congelación!`
                    : `🔥 Temperatura extremadamente alta: ${val}°C - ¡Riesgo de sobrecalentamiento!`;
                } else {
                  return val < (threshold.warningMin || 0)
                    ? `❄️ Temperatura baja: ${val}°C - Fuera del rango recomendado`
                    : `🌡️ Temperatura alta: ${val}°C - Monitoreo requerido`;
                }
              case "humidity":
                if (type === "danger") {
                  return val < (threshold.min || 0)
                    ? `🏜️ Humedad extremadamente baja: ${val}% - Ambiente muy seco`
                    : `💧 Humedad extremadamente alta: ${val}% - Riesgo de condensación`;
                } else {
                  return val < (threshold.warningMin || 0)
                    ? `🌵 Humedad baja: ${val}% - Ambiente seco`
                    : `☔ Humedad alta: ${val}% - Ambiente húmedo`;
                }
              case "air_quality":
                if (type === "danger") {
                  return `💨 Calidad del aire MALA: ${val} ppm - ¡Ventilación necesaria inmediatamente!`;
                } else {
                  return `🌪️ Calidad del aire en observación: ${val} ppm - Monitoreo requerido`;
                }
              case "light":
                if (type === "danger") {
                  return `☀️ Luz muy intensa: ${val} lux - ¡Posible deslumbramiento!`;
                } else {
                  return `💡 Luz brillante: ${val} lux - Nivel elevado detectado`;
                }
              case "pressure":
                if (type === "danger") {
                  return val < (threshold.min || 0)
                    ? `⬇️ Presión muy baja: ${val} hPa - Posible mal tiempo`
                    : `⬆️ Presión muy alta: ${val} hPa - Condiciones atmosféricas inusuales`;
                } else {
                  return val < (threshold.warningMin || 0)
                    ? `📉 Presión baja: ${val} hPa - Cambio atmosférico`
                    : `📈 Presión alta: ${val} hPa - Monitoreo recomendado`;
                }
              case "distance":
                if (type === "danger") {
                  return val < (threshold.min || 0)
                    ? `⚠️ Objeto muy cerca detectado: ${val}cm - ¡Riesgo de colisión!`
                    : `📡 Sensor fuera de rango: ${val}cm - Verificar conexión`;
                } else {
                  return val < (threshold.warningMin || 0)
                    ? `🔍 Objeto cerca detectado: ${val}cm`
                    : `📏 Distancia elevada: ${val}cm`;
                }
              default:
                return `${sensorDisplayName}: ${val} ${type === "danger" ? "fuera del rango seguro" : "en rango de advertencia"}`;
            }
          };

          // Verificar si está en rango peligroso
          if (
            (threshold.min !== undefined && value < threshold.min) ||
            (threshold.max !== undefined && value > threshold.max)
          ) {
            state.addAlert({
              type: "danger",
              sensor: sensorType,
              message: generateMessage("danger", sensorType, value),
              value,
              threshold:
                threshold.min !== undefined && value < threshold.min
                  ? threshold.min
                  : threshold.max!,
            });
          }
          // Verificar si está en rango de advertencia
          else if (
            (threshold.warningMin !== undefined &&
              value < threshold.warningMin) ||
            (threshold.warningMax !== undefined && value > threshold.warningMax)
          ) {
            state.addAlert({
              type: "warning",
              sensor: sensorType,
              message: generateMessage("warning", sensorType, value),
              value,
              threshold:
                threshold.warningMin !== undefined &&
                value < threshold.warningMin
                  ? threshold.warningMin
                  : threshold.warningMax!,
            });
          }
        },

        // Actualizar umbral
        updateThreshold: (sensorType, threshold) => {
          set((state) => ({
            thresholds: {
              ...state.thresholds,
              [sensorType]: threshold,
            },
          }));
        },

        // Verificar actividad del sistema (heartbeat)
        checkSystemActivity: () => {
          set((state) => {
            const now = new Date();
            const lastData = state.status.lastDataReceived;

            // Si no hay datos recientes (más de 30 segundos), marcar como inactivo
            const isActive =
              lastData && now.getTime() - lastData.getTime() < 30000;

            return {
              status: {
                ...state.status,
                isSystemActive: !!isActive,
              },
            };
          });
        },
      }),
      {
        name: "siepa-system-store",
        partialize: (state) => ({
          thresholds: state.thresholds,
          alerts: state.alerts.filter((a) => !a.acknowledged), // Solo persistir alertas no reconocidas
          chartData: Object.fromEntries(
            Object.entries(state.chartData).map(([key, value]) => [
              key,
              {
                ...value,
                data: value.data.slice(-20), // Solo persistir los últimos 20 puntos por sensor
              },
            ])
          ),
        }),
      }
    ),
    {
      name: "siepa-system-store",
    }
  )
);

// Función auxiliar para obtener nombres de sensores
function getSensorDisplayName(sensorType: string): string {
  const names: Record<string, string> = {
    temperature: "Temperatura",
    humidity: "Humedad",
    distance: "Distancia",
    light: "Luz",
    air_quality: "Calidad del Aire",
    pressure: "Presión",
  };
  return names[sensorType] || sensorType;
}
