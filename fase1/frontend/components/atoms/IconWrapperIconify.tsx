/**
 * IconWrapper - Atom component for displaying an Iconify icon inside a styled wrapper.
 *
 * Renders an Iconify icon with customizable size, color, and background wrapper.
 * Useful for consistent icon presentation in cards, lists, or buttons.
 *
 * Features:
 * - Customizable icon (via Iconify)
 * - Adjustable icon size and color via className
 * - Adjustable wrapper style via wrapperClassName
 *
 * @param {string} icon - The Iconify icon name (e.g., "lucide:mail")
 * @param {string} [className] - Additional classes for the icon (size, color, etc.)
 * @param {string} [wrapperClassName] - Additional classes for the wrapper div
 *
 * @returns {JSX.Element} The styled icon wrapper component
 *
 * @example
 * <IconWrapper icon="lucide:mail" />
 * <IconWrapper icon="mdi:account" className="text-xl" wrapperClassName="bg-gray-100 p-2 rounded" />
 */
import React from "react";
import { Icon } from "@iconify/react";

interface IconWrapperProps {
  icon: string;
  className?: string;
  wrapperClassName?: string;
}

export const IconWrapper: React.FC<IconWrapperProps> = ({
  icon,
  className = "text-2xl",
  wrapperClassName = "bg-primary-900/20 p-4 rounded-full",
}) => {
  return (
    <div className={wrapperClassName}>
      <Icon icon={icon} className={`text-primary-500 ${className}`} />
    </div>
  );
};
