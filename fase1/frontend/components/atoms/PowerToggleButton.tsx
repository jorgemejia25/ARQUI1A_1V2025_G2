/**
 * PowerToggleButton - Atom component for toggling power state
 *
 * A stylized button that allows toggling the on/off state of a device,
 * displaying a power icon and the current state. Uses color and visual variants
 * to clearly indicate the state. Part of the atomic design system.
 *
 * @param props - Component props
 * @param props.isOn - Current state (true = on, false = off)
 * @param props.onToggle - Callback function executed when the button is pressed
 * @param props.className - Optional additional CSS classes
 *
 * @returns A button with an icon and text indicating the power state
 *
 * @example
 * ```tsx
 * <PowerToggleButton isOn={true} onToggle={() => console.log("Toggled!")} />
 * ```
 */

import { Button } from "@heroui/button";
import { Power } from "lucide-react";

interface PowerToggleButtonProps {
  isOn: boolean;
  onToggle: () => void;
  className?: string;
}

export default function PowerToggleButton({ isOn, onToggle, className }: PowerToggleButtonProps) {
  return (
    <Button
      size="sm"
      color={isOn ? "success" : "danger"}
      variant="flat"
      className={`w-full mt-2 flex items-center justify-center gap-2 ${className ?? ""}`}
      onPress={onToggle}
    >
      <Power className="w-4 h-4" />
      {isOn ? "Encendido" : "Apagado"}
    </Button>
  );
}