/**
 * useSystemMonitor - Hook for monitoring system activity
 *
 * Monitors system activity by checking if data is being received from the backend.
 * Runs periodic checks to update the system status.
 */

import { useEffect } from "react";
import { useSystemStore } from "@/lib/store/useSystemStore";

export function useSystemMonitor() {
  const { checkSystemActivity } = useSystemStore();

  useEffect(() => {
    // Verificar actividad del sistema cada 10 segundos
    const interval = setInterval(() => {
      checkSystemActivity();
    }, 10000);

    // Verificación inicial
    checkSystemActivity();

    return () => clearInterval(interval);
  }, [checkSystemActivity]);
}
