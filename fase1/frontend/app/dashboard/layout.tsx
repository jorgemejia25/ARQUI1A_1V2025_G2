"use client";

import DashboardLayout from "@/components/templates/DashboardLayout";
import { MqttProvider } from "@/lib/providers/MqttProvider";
import React from "react";

export default function DashboardLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  // Eliminado guard de autenticación - SPA libre
  return (
    <MqttProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </MqttProvider>
  );
}
