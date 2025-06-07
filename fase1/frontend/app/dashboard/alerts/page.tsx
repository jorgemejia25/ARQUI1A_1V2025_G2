"use client";

import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Info,
  RotateCcw,
  Search,
  Shield,
  Trash2,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Select, SelectItem } from "@heroui/select";
import { useMemo, useState } from "react";

import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";
import { useSystemStore } from "@/lib/store/useSystemStore";

export default function AlertsPage() {
  const { alerts, status, clearAllAlerts } = useSystemStore();

  // Estados locales para filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("timestamp");

  // Constante para límite de alertas mostradas
  const ALERTS_LIMIT = 20;

  // Estadísticas de alertas
  const alertStats = useMemo(() => {
    const danger = alerts.filter((a) => a.type === "danger");
    const warning = alerts.filter((a) => a.type === "warning");
    const info = alerts.filter((a) => a.type === "info");

    return {
      total: alerts.length,
      danger: danger.length,
      warning: warning.length,
      info: info.length,
    };
  }, [alerts]);

  // Filtrar y ordenar alertas
  const { filteredAlerts, totalFiltered } = useMemo(() => {
    let filtered = alerts;

    // Filtro por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(
        (alert) =>
          alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
          alert.sensor.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtro por tipo
    if (filterType !== "all") {
      filtered = filtered.filter((alert) => alert.type === filterType);
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "timestamp":
          return (
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        case "type":
          const typeOrder = { danger: 3, warning: 2, info: 1 };
          return typeOrder[b.type] - typeOrder[a.type];
        case "sensor":
          return a.sensor.localeCompare(b.sensor);
        default:
          return 0;
      }
    });

    const totalFiltered = filtered.length;
    // Limitar a ALERTS_LIMIT alertas
    const limitedFiltered = filtered.slice(0, ALERTS_LIMIT);

    return { filteredAlerts: limitedFiltered, totalFiltered };
  }, [alerts, searchQuery, filterType, sortBy, ALERTS_LIMIT]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "danger":
        return <AlertOctagon className="w-5 h-5 text-danger" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case "info":
        return <Info className="w-5 h-5 text-primary" />;
      default:
        return <Info className="w-5 h-5 text-default" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "danger":
        return "danger";
      case "warning":
        return "warning";
      case "info":
        return "primary";
      default:
        return "default";
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `hace ${days} día${days > 1 ? "s" : ""}`;
    if (hours > 0) return `hace ${hours} hora${hours > 1 ? "s" : ""}`;
    if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? "s" : ""}`;
    return "hace unos segundos";
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Centro de Alertas
          </h1>
          <p className="text-foreground-600 mt-1">
            Gestión y monitoreo de alertas del sistema SIEPA
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            color="danger"
            variant="bordered"
            onClick={clearAllAlerts}
            disabled={alerts.length === 0}
            startContent={<Trash2 className="w-4 h-4" />}
          >
            Limpiar Todas las Alertas
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          Resumen de Alertas
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-6">
          <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardBody className="p-0">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="mb-3">
                <p className="text-sm text-foreground-500 font-medium mb-2">
                  Total de Alertas
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {alertStats.total}
                </p>
              </div>
              <div className="flex items-center justify-start">
                <Chip
                  size="sm"
                  color="primary"
                  variant="flat"
                  className="font-medium"
                >
                  {alertStats.total === 0 ? "Sin alertas" : "Registradas"}
                </Chip>
              </div>
            </CardBody>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardBody className="p-0">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-danger/10 rounded-lg flex items-center justify-center">
                  <AlertOctagon className="w-5 h-5 text-danger" />
                </div>
              </div>
              <div className="mb-3">
                <p className="text-sm text-foreground-500 font-medium mb-2">
                  Alertas Críticas
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {alertStats.danger}
                </p>
              </div>
              <div className="flex items-center justify-start">
                <Chip
                  size="sm"
                  color="danger"
                  variant="flat"
                  className="font-medium"
                >
                  {alertStats.danger === 0
                    ? "Sin críticas"
                    : "Requieren atención"}
                </Chip>
              </div>
            </CardBody>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardBody className="p-0">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                </div>
              </div>
              <div className="mb-3">
                <p className="text-sm text-foreground-500 font-medium mb-2">
                  Advertencias
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {alertStats.warning}
                </p>
              </div>
              <div className="flex items-center justify-start">
                <Chip
                  size="sm"
                  color="warning"
                  variant="flat"
                  className="font-medium"
                >
                  {alertStats.warning === 0 ? "Sin advertencias" : "Monitoreo"}
                </Chip>
              </div>
            </CardBody>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardBody className="p-0">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Info className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="mb-3">
                <p className="text-sm text-foreground-500 font-medium mb-2">
                  Información
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {alertStats.info}
                </p>
              </div>
              <div className="flex items-center justify-start">
                <Chip
                  size="sm"
                  color="primary"
                  variant="flat"
                  className="font-medium"
                >
                  {alertStats.info === 0 ? "Sin información" : "Notificaciones"}
                </Chip>
              </div>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Filtros y Gestión */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          Filtros y Gestión
        </h2>
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardBody className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
              <div className="space-y-2">
                <label className="text-sm text-foreground-500 font-medium">
                  Buscar
                </label>
                <Input
                  placeholder="Buscar alertas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  startContent={
                    <Search className="w-4 h-4 text-foreground-400" />
                  }
                  variant="bordered"
                  className="transition-all duration-200 hover:shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-foreground-500 font-medium">
                  Tipo de Alerta
                </label>
                <Select
                  placeholder="Seleccionar tipo"
                  selectedKeys={filterType ? [filterType] : []}
                  onSelectionChange={(keys) =>
                    setFilterType(Array.from(keys)[0] as string)
                  }
                  variant="bordered"
                  className="transition-all duration-200 hover:shadow-sm"
                >
                  <SelectItem key="all">Todos los tipos</SelectItem>
                  <SelectItem key="danger">🔴 Críticas</SelectItem>
                  <SelectItem key="warning">🟡 Advertencias</SelectItem>
                  <SelectItem key="info">🔵 Información</SelectItem>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-foreground-500 font-medium">
                  Ordenar Por
                </label>
                <Select
                  placeholder="Seleccionar orden"
                  selectedKeys={sortBy ? [sortBy] : []}
                  onSelectionChange={(keys) =>
                    setSortBy(Array.from(keys)[0] as string)
                  }
                  variant="bordered"
                  className="transition-all duration-200 hover:shadow-sm"
                >
                  <SelectItem key="timestamp">📅 Más recientes</SelectItem>
                  <SelectItem key="type">⚠️ Por severidad</SelectItem>
                  <SelectItem key="sensor">🔧 Por sensor</SelectItem>
                </Select>
              </div>
            </div>

            <Divider className="my-4" />

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <p className="text-sm text-foreground-600">
                  Mostrando{" "}
                  <span className="font-semibold">{filteredAlerts.length}</span>{" "}
                  de <span className="font-semibold">{totalFiltered}</span>{" "}
                  alertas
                </p>
                {totalFiltered > ALERTS_LIMIT && (
                  <Chip
                    size="sm"
                    color="warning"
                    variant="flat"
                    className="font-medium"
                  >
                    Limitado a {ALERTS_LIMIT}
                  </Chip>
                )}
              </div>
              {totalFiltered > ALERTS_LIMIT && (
                <p className="text-xs text-foreground-500">
                  +{totalFiltered - ALERTS_LIMIT} más disponibles
                </p>
              )}
            </div>
          </CardBody>
        </Card>
      </section>

      {/* Lista de Alertas */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          Registro de Alertas
        </h2>
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardBody className="p-6">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-success/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {alerts.length === 0
                    ? "Sin Alertas Registradas"
                    : "No se encontraron alertas"}
                </h3>
                <p className="text-foreground-600">
                  {alerts.length === 0
                    ? "El sistema está funcionando dentro de los parámetros normales."
                    : "Intenta ajustar los filtros de búsqueda."}
                </p>
                <Chip
                  size="sm"
                  color="success"
                  variant="flat"
                  className="mt-3 font-medium"
                >
                  {alerts.length === 0 ? "Sistema Normal" : "Sin resultados"}
                </Chip>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`bg-content1 rounded-lg border transition-all duration-200 hover:shadow-sm hover:border-foreground-200 ${
                      alert.type === "danger"
                        ? "border-l-4 border-l-danger border-r-0 border-t-0 border-b-0"
                        : alert.type === "warning"
                          ? "border-l-4 border-l-warning border-r-0 border-t-0 border-b-0"
                          : "border-l-4 border-l-primary border-r-0 border-t-0 border-b-0"
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            alert.type === "danger"
                              ? "text-danger"
                              : alert.type === "warning"
                                ? "text-warning"
                                : "text-primary"
                          }`}
                        >
                          {alert.type === "danger" ? (
                            <AlertOctagon className="w-4 h-4" />
                          ) : alert.type === "warning" ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : (
                            <Info className="w-4 h-4" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-semibold px-2 py-1 rounded ${
                                  alert.type === "danger"
                                    ? "text-danger bg-danger/10"
                                    : alert.type === "warning"
                                      ? "text-warning bg-warning/10"
                                      : "text-primary bg-primary/10"
                                }`}
                              >
                                {alert.type === "danger"
                                  ? "CRÍTICA"
                                  : alert.type === "warning"
                                    ? "ADVERTENCIA"
                                    : "INFORMACIÓN"}
                              </span>
                              <span className="text-xs text-foreground-500 px-2 py-1 bg-default-100 rounded">
                                {alert.sensor}
                              </span>
                            </div>
                            <span className="text-xs text-foreground-400">
                              {getTimeAgo(alert.timestamp)}
                            </span>
                          </div>

                          <p className="text-sm text-foreground mb-2 leading-relaxed">
                            {alert.message}
                          </p>

                          <div className="flex items-center gap-3 text-xs text-foreground-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimestamp(alert.timestamp)}
                            </span>
                            <span className="hidden md:inline">•</span>
                            <span className="hidden md:inline">
                              Valor: {alert.value}
                            </span>
                            <span className="hidden lg:inline">•</span>
                            <span className="hidden lg:inline">
                              Umbral: {alert.threshold}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {totalFiltered > ALERTS_LIMIT && (
                  <div className="text-center py-6 border-t border-divider">
                    <Chip
                      size="sm"
                      color="warning"
                      variant="flat"
                      className="font-medium mb-2"
                    >
                      Mostrando {ALERTS_LIMIT} de {totalFiltered} alertas
                    </Chip>
                    <p className="text-sm text-foreground-500">
                      Usa los filtros para encontrar alertas específicas
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </section>

      {/* Estado del Sistema */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          Estado del Sistema
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
          <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardBody className="p-0">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="mb-3">
                <p className="text-sm text-foreground-500 font-medium mb-2">
                  Estado de Conexión
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground-600">MQTT:</span>
                    <Chip
                      size="sm"
                      color={status.isConnected ? "success" : "danger"}
                      variant="flat"
                      className="font-medium"
                    >
                      {status.isConnected ? "Conectado" : "Desconectado"}
                    </Chip>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground-600">
                      Backend:
                    </span>
                    <Chip
                      size="sm"
                      color={status.isSystemActive ? "success" : "danger"}
                      variant="flat"
                      className="font-medium"
                    >
                      {status.isSystemActive ? "Activo" : "Inactivo"}
                    </Chip>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardBody className="p-0">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-success" />
                </div>
              </div>
              <div className="mb-3">
                <p className="text-sm text-foreground-500 font-medium mb-2">
                  Actividad del Sistema
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground-600">
                      Última sync:
                    </span>
                    <span className="text-xs text-foreground-600 max-w-32 truncate">
                      {status.lastSync ? getTimeAgo(status.lastSync) : "Nunca"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground-600">Modo:</span>
                    <Chip
                      size="sm"
                      color={
                        status.systemMode === "danger"
                          ? "danger"
                          : status.systemMode === "warning"
                            ? "warning"
                            : "success"
                      }
                      variant="flat"
                      className="font-medium"
                    >
                      {status.systemMode === "danger"
                        ? "CRÍTICO"
                        : status.systemMode === "warning"
                          ? "ADVERTENCIA"
                          : "NORMAL"}
                    </Chip>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </section>
    </div>
  );
}
