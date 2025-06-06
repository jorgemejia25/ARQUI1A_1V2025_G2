/**
 * EmailInput - Atom component for email input fields
 *
 * Renders a styled input field specifically for email addresses, including an icon,
 * validation feedback, and customizable label and placeholder. Designed for use in
 * authentication forms or any context where email input is required.
 *
 * Features:
 * - Email icon as start content
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
 * @returns {JSX.Element} The styled email input component
 *
 * @example
 * <EmailInput
 *   value={email}
 *   onValueChange={setEmail}
 *   isInvalid={!!error}
 *   errorMessage={error}
 * />
 */
import React from "react";
import { Input } from "@heroui/input";
import { Icon } from "@iconify/react";

interface EmailInputProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  isInvalid?: boolean;
  errorMessage?: string;
}

export const EmailInput: React.FC<EmailInputProps> = ({
  value,
  onValueChange,
  label = "Email",
  placeholder = "Ingresa tu correo electrónico",
  isInvalid = false,
  errorMessage,
}) => {
  return (
    <Input
      label={label}
      placeholder={placeholder}
      value={value}
      onValueChange={onValueChange}
      variant="bordered"
      isInvalid={isInvalid}
      errorMessage={errorMessage}
      classNames={{
        inputWrapper:
          "bg-content2/50 backdrop-blur-md border-content3/50 shadow-inner",
        input: "text-foreground-700",
      }}
      startContent={
        <Icon icon="lucide:mail" className="text-primary-400 w-4 h-4" />
      }
    />
  );
};
