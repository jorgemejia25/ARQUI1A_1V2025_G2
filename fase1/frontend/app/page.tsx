"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir directamente al dashboard - SPA sin autenticación
    router.push("/dashboard");
  }, [router]);

  // Mostrar loading mientras redirige
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-content1 to-content2">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🌱</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Sistema SIEPA</h1>
        <p className="text-default-500">Monitoreo Ambiental Inteligente</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-default-400">Cargando aplicación...</p>
      </div>
    </div>
  );
}
