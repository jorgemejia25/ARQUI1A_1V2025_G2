/**
 * DashboardLayout - Template component for the main dashboard layout structure
 *
 * A comprehensive layout template that provides the complete dashboard structure
 * including sidebar navigation, header with notifications, and main content area.
 * Features responsive design with mobile navigation support and system status
 * indicators throughout the interface.
 *
 * @param props - Component props
 * @param props.children - Content to be rendered in the main content area
 *
 * @returns A complete dashboard layout with sidebar, header, and content area
 *
 * @example
 * ```tsx
 * <DashboardLayout>
 *   <div>
 *     <h1>Dashboard Content</h1>
 *     <p>Your dashboard widgets and components go here</p>
 *   </div>
 * </DashboardLayout>
 * ```
 *
 * @features
 * - Responsive sidebar navigation with predefined menu items
 * - Mobile-friendly overlay navigation
 * - Header with system status indicators and notifications
 * - Dark/light mode toggle with persistent theme preference
 * - Notification badge with alert count
 * - Consistent spacing and typography
 * - Automatic active state management for navigation items
 */

"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Bell, Menu, Home, Leaf, Database } from "lucide-react";
import { Chip } from "@heroui/chip";
import DashboardSidebar from "@/components/organisms/DashboardSidebar";
import ThemeToggle from "@/components/atoms/ThemeToggle";
import { useSystemStore } from "@/lib/store/useSystemStore";
import { useAuth } from "@/lib/contexts/AuthContext";
import { LogOut, User } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Obtener estado del sistema desde el store
  const { status, alerts } = useSystemStore();
  const activeAlerts = alerts.filter((alert) => !alert.acknowledged);

  // Obtener información de autenticación
  const { user, logout } = useAuth();

  // Define sidebar items directly in the client component
  const sidebarItems = [
    { id: "overview", label: "Resumen", icon: Home, href: "/dashboard" },
    {
      id: "environmental",
      label: "Histórico",
      icon: Leaf,
      href: "/dashboard/history",
    },
    { id: "alerts", label: "Alertas", icon: Bell, href: "/dashboard/alerts" },
  ];

  return (
    <div className="flex h-screen bg-default-50 dark:bg-default-100">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <DashboardSidebar
        items={sidebarItems}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-content1 border-b border-divider p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                className="lg:hidden"
                onPress={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-foreground">
                  Panel de Control Ambiental
                </h2>
                <p className="text-sm lg:text-base text-foreground-500 mt-1">
                  Monitoreo en tiempo real del Sistema SIEPA
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* User Info */}
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-default-500" />
                <span className="text-default-700 font-medium">
                  {user?.username || "Usuario"}
                </span>
              </div>

              {/* Theme Switch */}
              <ThemeToggle />

              {/* Notifications */}
              <div className="relative">
                <Button
                  isIconOnly
                  variant="light"
                  color={status.systemMode === "danger" ? "danger" : "default"}
                  className="w-10 h-10"
                >
                  <Bell className="w-5 h-5" />
                </Button>
                {activeAlerts.length > 0 && (
                  <Chip
                    size="sm"
                    color={
                      status.systemMode === "danger" ? "danger" : "warning"
                    }
                    variant="solid"
                    className="absolute -top-1 -right-1 min-w-5 h-5 text-xs"
                  >
                    {activeAlerts.length > 99 ? "99+" : activeAlerts.length}
                  </Chip>
                )}
              </div>

              {/* Logout Button */}
              <Button
                isIconOnly
                variant="light"
                color="danger"
                className="w-10 h-10"
                onPress={logout}
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto bg-default-100/50 dark:bg-default-50/50">
          {children}
        </main>
      </div>
    </div>
  );
}
