/**
 * IconWrapper - Atom component for consistent icon container styling
 *
 * A wrapper component that provides consistent styling for icons with background, padding,
 * and color variants. Part of the Atomic Design system as a fundamental building block.
 *
 * @param props - Component props
 * @param props.children - Icon component to be wrapped (typically Lucide React icons)
 * @param props.color - Color variant that affects background and icon colors (default: "primary")
 * @param props.size - Size variant that determines container dimensions (default: "md")
 * @param props.variant - Visual style variant (default: "solid")
 * @param props.className - Additional CSS classes to apply
 *
 * @returns A styled container wrapping the provided icon
 *
 * @example
 * ```tsx
 * <IconWrapper color="success" size="lg" variant="shadow">
 *   <CheckIcon className="w-6 h-6" />
 * </IconWrapper>
 *
 * <IconWrapper color="warning" size="sm" variant="outline">
 *   <AlertIcon className="w-4 h-4" />
 * </IconWrapper>
 * ```
 */

import { ReactNode } from "react";

interface IconWrapperProps {
  children: ReactNode;
  color?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "default";
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "flat" | "solid" | "bordered" | "shadow";
  className?: string;
}

export default function IconWrapper({
  children,
  color = "primary",
  size = "md",
  variant = "flat",
  className = "",
}: IconWrapperProps) {
  const sizeClasses = {
    sm: "w-8 h-8 p-1.5",
    md: "w-10 h-10 p-2",
    lg: "w-12 h-12 p-3",
    xl: "w-16 h-16 p-4",
  };

  const getVariantClasses = (color: string, variant: string) => {
    const baseClasses = "rounded-xl flex items-center justify-center";

    switch (variant) {
      case "flat":
        return `${baseClasses} bg-${color}/20`;
      case "solid":
        return `${baseClasses} bg-${color} text-${color}-foreground`;
      case "bordered":
        return `${baseClasses} border-2 border-${color} text-${color}`;
      case "shadow":
        return `${baseClasses} bg-${color}/20 shadow-lg`;
      default:
        return `${baseClasses} bg-${color}/20`;
    }
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${getVariantClasses(color, variant)}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
