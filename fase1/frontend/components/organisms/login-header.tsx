import { CardHeader } from "@heroui/card";
/**
 * LoginHeader - Organism component for the login page header.
 *
 * Renders a styled header with an icon, title, and subtitle for the login card.
 * Specific for the SIEPA environmental monitoring system.
 *
 * Features:
 * - SIEPA branding and styling
 * - Environmental monitoring context
 * - Responsive design
 *
 * @param {string} [title] - Title text for the header
 * @param {string} [subtitle] - Subtitle text for the header
 *
 * @returns {JSX.Element} The styled login header component
 *
 * @example
 * <LoginHeader title="Sistema SIEPA" subtitle="Monitoreo Ambiental" />
 */
import React from "react";

interface LoginHeaderProps {
  title?: string;
  subtitle?: string;
}

export const LoginHeader: React.FC<LoginHeaderProps> = ({
  title = "Sistema SIEPA",
  subtitle = "Monitoreo Ambiental Inteligente",
}) => {
  return (
    <CardHeader className="flex flex-col gap-1 items-center justify-center pt-12 pb-2">
      {/* Logo/Icono del sistema */}
      <div className="bg-gradient-to-br from-green-900/30 to-blue-800/50 p-6 rounded-full backdrop-blur-md shadow-lg shadow-green-500/10 border border-green-700/30 mb-4">
        <div className="text-3xl">🌱</div>
      </div>

      <h1 className="text-2xl font-bold text-foreground mt-2 text-center">
        {title}
      </h1>

      <p className="text-default-400 text-center text-small mt-1 max-w-xs">
        {subtitle}
      </p>

      <div className="flex items-center gap-2 mt-3 text-xs text-default-500">
        <span className="text-green-500">🌡️</span>
        <span>Temperatura</span>
        <span className="text-blue-500">💧</span>
        <span>Humedad</span>
        <span className="text-yellow-500">💡</span>
        <span>Luz</span>
        <span className="text-purple-500">💨</span>
        <span>Aire</span>
      </div>
    </CardHeader>
  );
};
