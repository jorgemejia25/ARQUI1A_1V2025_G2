"use client";

import DashboardLayout from "@/components/templates/DashboardLayout";
import { MqttProvider } from "@/lib/providers/MqttProvider";
import React from "react";
import { useRequireAuth } from "@/lib/contexts/AuthContext";

export default function MqttSensorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Proteger la ruta - redirige a login si no está autenticado
  const { isAuthenticated, isLoading } = useRequireAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // No renderizar nada si no está autenticado
  if (!isAuthenticated) {
    return null;
  }

  return (
    <MqttProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </MqttProvider>
  );
}
