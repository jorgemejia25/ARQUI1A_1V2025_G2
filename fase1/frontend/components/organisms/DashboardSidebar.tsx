/**
 * DashboardSidebar - Organism component for the main dashboard navigation sidebar
 *
 * A comprehensive sidebar navigation component that includes the application logo,
 * navigation menu items, and system status indicators. Features responsive design
 * with mobile overlay support and collapsible functionality.
 *
 * @param props - Component props
 * @param props.items - Array of navigation items with id, label, icon, and href
 * @param props.isOpen - Whether the sidebar is currently open (for mobile)
 * @param props.onClose - Callback function to close the sidebar (for mobile)
 *
 * @returns A fully featured sidebar with navigation and status indicators
 *
 * @example
 * ```tsx
 * const sidebarItems = [
 *   { id: "dashboard", label: "Dashboard", icon: Home, href: "/dashboard" },
 *   { id: "sensors", label: "Sensors", icon: Database, href: "/sensors" }
 * ];
 *
 * <DashboardSidebar
 *   items={sidebarItems}
 *   isOpen={true}
 *   onClose={() => setSidebarOpen(false)}
 * />
 * ```
 */

"use client";

import { Leaf, X } from "lucide-react";

import { Button } from "@heroui/button";
import NavigationItem from "@/components/molecules/NavigationItem";
import StatusIndicator from "@/components/atoms/StatusIndicator";
import { usePathname } from "next/navigation";
import { useSystemStore } from "@/lib/store/useSystemStore";

interface SidebarItem {
  id: string;
  label: string;
  icon: any;
  href: string;
}

interface DashboardSidebarProps {
  items: SidebarItem[];
  isOpen?: boolean;
  onClose?: () => void;
}

export default function DashboardSidebar({
  items,
  isOpen = true,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const { status, alerts } = useSystemStore();
  const activeAlerts = alerts.filter((alert) => !alert.acknowledged);

  const isActivePage = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Función para obtener el color del indicador según el estado del sistema
  const getSystemStatusColor = () => {
    if (!status.isConnected || !status.isSystemActive) return "danger";
    switch (status.systemMode) {
      case "danger":
        return "danger";
      case "warning":
        return "warning";
      default:
        return "success";
    }
  };

  // Función para obtener el texto del estado del sistema
  const getSystemStatusText = () => {
    if (!status.isConnected) return "MQTT Desconectado";
    if (!status.isSystemActive) return "Backend Inactivo";
    switch (status.systemMode) {
      case "danger":
        return "Estado Crítico";
      case "warning":
        return "Advertencias Activas";
      default:
        return "Sistema Activo";
    }
  };

  // Función para obtener el color del indicador MQTT
  const getMqttStatusColor = () => {
    if (!status.isConnected) return "danger";
    switch (status.mqttStatus) {
      case "Conectado y suscrito":
        return "success";
      case "Conectado":
        return "primary";
      case "Reconectando...":
        return "warning";
      case "Desconectado":
      case "Offline":
      case "Conexión cerrada":
        return "danger";
      case "Error de conexión":
      case "Error en suscripción":
        return "danger";
      default:
        return "secondary";
    }
  };

  // Función para obtener texto descriptivo del estado MQTT
  const getMqttStatusText = () => {
    switch (status.mqttStatus) {
      case "Conectado y suscrito":
        return "Conectado";
      case "Conectado":
        return "Conectando";
      case "Reconectando...":
        return "Reconectando";
      case "Desconectado":
        return "Desconectado";
      case "Offline":
        return "Sin conexión";
      case "Conexión cerrada":
        return "Conexión cerrada";
      case "Error de conexión":
      case "Error en suscripción":
        return "Error";
      default:
        return status.mqttStatus;
    }
  };

  return (
    <div
      className={`
      fixed lg:static inset-y-0 left-0 z-50 w-64 xl:w-80 bg-content1 border-r border-divider
      transform ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
      transition-transform duration-300 ease-in-out
    `}
    >
      <div className="flex flex-col h-full">
        {/* Logo and Header */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                <Leaf className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">SIEPA</h1>
                <p className="text-sm text-foreground-500">Grupo 2</p>
              </div>
            </div>
            {onClose && (
              <Button
                isIconOnly
                variant="light"
                size="sm"
                className="lg:hidden"
                onPress={onClose}
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Navigation */}
          <nav className="space-y-3">
            {items.map((item) => (
              <NavigationItem
                key={item.id}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={isActivePage(item.href)}
                onClick={onClose}
              />
            ))}
          </nav>
        </div>

        {/* System Status - Bottom of sidebar */}
        <div className="mt-auto p-6 border-t border-divider">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <StatusIndicator
                color={getSystemStatusColor()}
                animate={status.systemMode === "danger"}
              />
              <span className="text-foreground-600">
                {getSystemStatusText()}
              </span>
            </div>
            {status.isSyncing && (
              <div className="flex items-center gap-3 text-sm">
                <StatusIndicator color="primary" animate />
                <span className="text-foreground-600">Sincronizando</span>
              </div>
            )}

            <div className="flex items-center gap-3 text-sm">
              <StatusIndicator
                color={status.isSystemActive ? "success" : "danger"}
                animate={!status.isSystemActive}
              />
              <span className="text-foreground-600">
                Backend: {status.isSystemActive ? "Activo" : "Inactivo"}
              </span>
            </div>
            {activeAlerts.length > 0 && (
              <div className="flex items-center gap-3 text-sm">
                <StatusIndicator
                  color={status.systemMode === "danger" ? "danger" : "warning"}
                  animate={status.systemMode === "danger"}
                />
                <span className="text-foreground-600">
                  {activeAlerts.length}{" "}
                  {activeAlerts.length === 1 ? "Alerta" : "Alertas"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
