/**
 * PasswordInput - Atom component for password input fields
 *
 * Renders a styled input field for passwords, including an icon, visibility toggle,
 * validation feedback, and customizable label and placeholder. Designed for use in
 * authentication forms or any context where password input is required.
 *
 * Features:
 * - Key icon as start content
 * - Show/hide password toggle with eye icon
 * - Customizable label and placeholder
 * - Validation state and error message display
 * - Styled with blurred background and border
 *
 * @param {string} value - The current value of the input
 * @param {(value: string) => void} onValueChange - Callback for input value changes
 * @param {string} [label] - Optional label for the input
 * @param {string} [placeholder] - Optional placeholder text
 * @param {boolean} [isInvalid] - Validation state
 * @param {string} [errorMessage] - Error message to display
 *
 * @returns {JSX.Element} The styled password input component
 *
 * @example
 * <PasswordInput
 *   value={password}
 *   onValueChange={setPassword}
 *   isInvalid={!!error}
 *   errorMessage={error}
 * />
 */
import React from "react";
import { Input } from "@heroui/input";
import { Icon } from "@iconify/react";

interface PasswordInputProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  isInvalid?: boolean;
  errorMessage?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onValueChange,
  label = "Contraseña",
  placeholder = "Ingresa tu contraseña",
  isInvalid = false,
  errorMessage,
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);

  return (
    <Input
      label={label}
      placeholder={placeholder}
      value={value}
      onValueChange={onValueChange}
      type={isVisible ? "text" : "password"}
      variant="bordered"
      isInvalid={isInvalid}
      errorMessage={errorMessage}
      classNames={{
        inputWrapper:
          "bg-content2/50 backdrop-blur-md border-content3/50 shadow-inner",
        input: "text-foreground-700",
      }}
      startContent={
        <Icon icon="lucide:key" className="text-primary-400 w-4 h-4" />
      }
      endContent={
        <button
          type="button"
          onClick={toggleVisibility}
          className="focus:outline-none"
        >
          {isVisible ? (
            <Icon icon="lucide:eye-off" className="text-default-400 w-4 h-4" />
          ) : (
            <Icon icon="lucide:eye" className="text-default-400 w-4 h-4" />
          )}
        </button>
      }
    />
  );
};
