/**
 * NavigationItem - Molecule component for dashboard navigation links
 *
 * A navigation link component that combines an icon, label, and interactive button
 * to provide consistent navigation throughout the dashboard. Features active state
 * styling and responsive design.
 *
 * @param props - Component props
 * @param props.href - Target URL for the navigation link
 * @param props.icon - Icon component to display alongside the label
 * @param props.label - Text label for the navigation item
 * @param props.isActive - Whether this navigation item is currently active
 * @param props.onClick - Optional callback function when the item is clicked
 *
 * @returns A styled navigation button with icon and label
 *
 * @example
 * ```tsx
 * <NavigationItem
 *   href="/dashboard/sensors"
 *   icon={Database}
 *   label="Sensores"
 *   isActive={true}
 *   onClick={() => console.log("Navigate to sensors")}
 * />
 * ```
 */

import { Button } from "@heroui/button";
import Link from "next/link";

interface NavigationItemProps {
  href: string;
  icon: any;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

export default function NavigationItem({
  href,
  icon: Icon,
  label,
  isActive = false,
  onClick,
}: NavigationItemProps) {
  return (
    <Link href={href} onClick={onClick}>
      <Button
        variant={isActive ? "flat" : "light"}
        color={isActive ? "primary" : "default"}
        className="w-full justify-start h-12 text-base"
        startContent={<Icon className="w-5 h-5" />}
      >
        {label}
      </Button>
    </Link>
  );
}
