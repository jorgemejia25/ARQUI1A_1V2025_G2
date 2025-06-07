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

interface SystemStore {
  // Estado del sistema
  status: SystemStatus;
  alerts: Alert[];
  sensorData: SensorData[];

  // Configuración de umbrales
  thresholds: Record<string, SensorThreshold>;

  // Acciones para actualizar el estado del sistema
  updateConnectionStatus: (isConnected: boolean, mqttStatus: string) => void;
  setSyncStatus: (isSyncing: boolean) => void;
  checkSystemActivity: () => void;

  // Acciones para manejar datos de sensores
  addSensorData: (data: SensorData) => void;
  clearSensorData: () => void;

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
    // Para calidad del aire: 0 = bueno, 1 = malo
    max: 0, // Si es 1 (malo) = peligroso
    warningMax: 0, // Sin advertencia, directo a peligro
  },
  light: {
    // Para sensor de luz: 0 = no detectada, 1 = detectada
    // No necesita umbrales críticos, solo informativo
  },
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
            const newData = [data, ...state.sensorData.slice(0, 49)];

            // Evaluar riesgo si tenemos la información necesaria
            if (data.evaluationType && data.evalValue !== undefined) {
              // Llamar evaluateRisk en el próximo tick para evitar problemas de estado
              setTimeout(() => {
                get().evaluateRisk(data.evaluationType!, data.evalValue!);
              }, 0);
            }
            // Fallback para datos antiguos
            else if (data.sensor_type && typeof data.valor === "number") {
              // Mapear sensor_type a evaluationType
              const typeMap: Record<string, string> = {
                Temperatura: "temperature",
                Humedad: "humidity",
                Distancia: "distance",
                "Calidad del Aire": "air_quality",
                Luz: "light",
              };

              const evalType = typeMap[data.sensor_type];
              if (evalType) {
                setTimeout(() => {
                  get().evaluateRisk(evalType, data.valor);
                }, 0);
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
          }, 1000);
        },

        // Limpiar datos de sensores
        clearSensorData: () => {
          set((state) => ({
            sensorData: [],
          }));
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
                return type === "danger"
                  ? `💨 Calidad del aire MALA - ¡Ventilación necesaria inmediatamente!`
                  : `🌪️ Calidad del aire en observación`;
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
  };
  return names[sensorType] || sensorType;
}
