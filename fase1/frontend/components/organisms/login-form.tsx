/**
 * LoginForm - Organism component for user authentication.
 *
 * Renders a login form with email and password fields, validation, and loading state.
 * Handles user input, displays validation errors, and simulates authentication logic.
 *
 * Features:
 * - Email and password input fields with validation
 * - Error messages for invalid or missing credentials
 * - Loading state on submit
 * - Redirects to dashboard on successful login (mock)
 *
 * @returns {JSX.Element} The login form component
 *
 * @example
 * <LoginForm />
 */
"use client";

import React from "react";
import { Button } from "@heroui/button";
import { EmailInput } from "../atoms/EmailInput";
import { PasswordInput } from "../atoms/PasswordInput";

export const LoginForm = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{
    email?: string;
    password?: string;
  }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = "Email es obligatorio";
    }

    if (!password) {
      newErrors.password = "Contraseña es obligatoria";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      setIsLoading(true);

      const validEmail = "admin@ejemplo.com";
      const validPassword = "123456";

      setTimeout(() => {
        if (email === validEmail && password === validPassword) {
          window.location.href = "/dashboard";
        } else {
          setErrors({ password: "Email o contraseña incorrectos" });
        }
        setIsLoading(false);
      }, 1500);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <EmailInput
        value={email}
        onValueChange={setEmail}
        isInvalid={!!errors.email}
        errorMessage={errors.email}
      />

      <PasswordInput
        value={password}
        onValueChange={setPassword}
        isInvalid={!!errors.password}
        errorMessage={errors.password}
      />

      <Button
        type="submit"
        color="primary"
        className="mt-2 bg-gradient-to-r from-primary-600 to-primary-500 shadow-lg shadow-primary-500/20"
        isLoading={isLoading}
        fullWidth
      >
        Sign In
      </Button>
    </form>
  );
};
