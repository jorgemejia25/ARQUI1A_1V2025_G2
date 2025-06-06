/**
 * LoginHeader - Organism component for the login page header.
 *
 * Renders a styled header with an icon, title, and subtitle for the login card.
 * Useful for branding and providing context to authentication forms.
 *
 * Features:
 * - Customizable icon (via Iconify)
 * - Customizable title and subtitle
 * - Styled wrapper for consistent appearance
 *
 * @param {string} [title] - Title text for the header
 * @param {string} [subtitle] - Subtitle text for the header
 * @param {string} [icon] - Iconify icon name (e.g., "lucide:lock")
 *
 * @returns {JSX.Element} The styled login header component
 *
 * @example
 * <LoginHeader title="Welcome" subtitle="Sign in to your account" icon="lucide:lock" />
 */
import React from "react";
import { CardHeader } from "@heroui/card";
import { IconWrapper } from "../atoms/IconWrapperIconify";

interface LoginHeaderProps {
  title?: string;
  subtitle?: string;
  icon?: string;
}

export const LoginHeader: React.FC<LoginHeaderProps> = ({
  title = "Bienvenido",
  subtitle = "Inicia sesión para continuar a tu cuenta",
  icon = "lucide:lock",
}) => {
  return (
    <CardHeader className="flex flex-col gap-1 items-center justify-center pt-12 pb-2">
      <IconWrapper
        icon={icon}
        wrapperClassName="bg-gradient-to-br from-primary-900/30 to-primary-800/50 p-5 rounded-full backdrop-blur-md shadow-lg shadow-primary-500/10 border border-primary-700/30"
        className="text-primary-400 text-2xl"
      />
      <h1 className="text-2xl font-semibold text-foreground mt-4">
        Bienvenido
      </h1>
      <p className="text-default-400 text-center text-small mt-1">
        Inicia sesión para continuar a tu cuenta
      </p>
    </CardHeader>
  );
};
