/**
 * LoginForm - Organism component for user authentication.
 *
 * Renders a login form with username and password fields, validation, and loading state.
 * Handles user input, displays validation errors, and uses the AuthContext for authentication.
 *
 * Features:
 * - Username and password input fields with validation
 * - Error messages for invalid or missing credentials
 * - Loading state on submit
 * - Redirects to dashboard on successful login
 * - Uses admin/admin as valid credentials
 *
 * @returns {JSX.Element} The login form component
 *
 * @example
 * <LoginForm />
 */
"use client";

import { Button } from "@heroui/button";
import { EyeFilledIcon } from "@heroui/shared-icons";
import { EyeSlashFilledIcon } from "@heroui/shared-icons";
import { Input } from "@heroui/input";
import React from "react";
import { useAuth } from "@/lib/contexts/AuthContext";

export const LoginForm = () => {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isVisible, setIsVisible] = React.useState(false);
  const [errors, setErrors] = React.useState<{
    username?: string;
    password?: string;
    general?: string;
  }>({});

  const { login, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const validateForm = () => {
    const newErrors: { username?: string; password?: string } = {};

    if (!username.trim()) {
      newErrors.username = "Usuario es obligatorio";
    }

    if (!password.trim()) {
      newErrors.password = "Contraseña es obligatoria";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Limpiar errores previos
    setErrors({});

    if (validateForm()) {
      setIsLoading(true);

      try {
        const success = await login(username.trim(), password);

        if (!success) {
          setErrors({
            general: "Credenciales incorrectas.",
          });
        }
      } catch (error) {
        setErrors({
          general: "Error de conexión. Intente nuevamente.",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (errors.username) {
      setErrors((prev) => ({ ...prev, username: undefined }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Input
        label="Usuario"
        placeholder="Ingrese su usuario"
        value={username}
        onValueChange={handleUsernameChange}
        isInvalid={!!errors.username}
        errorMessage={errors.username}
        variant="bordered"
        startContent={
          <div className="pointer-events-none flex items-center">
            <span className="text-default-400 text-small">👤</span>
          </div>
        }
      />

      <Input
        label="Contraseña"
        placeholder="Ingrese su contraseña"
        value={password}
        onValueChange={handlePasswordChange}
        isInvalid={!!errors.password}
        errorMessage={errors.password}
        variant="bordered"
        endContent={
          <button
            className="focus:outline-none"
            type="button"
            onClick={toggleVisibility}
          >
            {isVisible ? (
              <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
            ) : (
              <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
            )}
          </button>
        }
        type={isVisible ? "text" : "password"}
        startContent={
          <div className="pointer-events-none flex items-center">
            <span className="text-default-400 text-small">🔐</span>
          </div>
        }
      />

      {errors.general && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400 text-center">
            {errors.general}
          </p>
        </div>
      )}

      <Button
        type="submit"
        color="primary"
        className="mt-2 bg-gradient-to-r from-primary-600 to-primary-500 shadow-lg shadow-primary-500/20"
        isLoading={isLoading || authLoading}
        fullWidth
        size="lg"
      >
        {isLoading || authLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
      </Button>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          Sistema SIEPA - Monitoreo Ambiental
        </p>
      </div>
    </form>
  );
};
