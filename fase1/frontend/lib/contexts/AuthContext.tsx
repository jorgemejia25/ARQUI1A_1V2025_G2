"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

import { useRouter } from "next/navigation";

interface User {
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Credenciales fijas
const VALID_CREDENTIALS = {
  username: "admin",
  password: "admin",
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = () => {
      try {
        const savedUser = localStorage.getItem("siepa_user");
        const authToken = localStorage.getItem("siepa_auth");

        if (savedUser && authToken === "authenticated") {
          const userData = JSON.parse(savedUser);
          setUser(userData);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        // Limpiar localStorage en caso de error
        localStorage.removeItem("siepa_user");
        localStorage.removeItem("siepa_auth");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      // Simular delay de red
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Validar credenciales
      if (
        username === VALID_CREDENTIALS.username &&
        password === VALID_CREDENTIALS.password
      ) {
        const userData: User = {
          username: username,
          role: "administrator",
        };

        // Guardar en localStorage
        localStorage.setItem("siepa_user", JSON.stringify(userData));
        localStorage.setItem("siepa_auth", "authenticated");
        localStorage.setItem("siepa_login_time", new Date().toISOString());

        // También establecer cookie para el middleware
        document.cookie = "siepa_auth=authenticated; path=/; max-age=86400"; // 24 horas

        setUser(userData);

        // Redirigir al dashboard
        router.push("/dashboard");

        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    // Limpiar localStorage
    localStorage.removeItem("siepa_user");
    localStorage.removeItem("siepa_auth");
    localStorage.removeItem("siepa_login_time");

    // Limpiar cookie
    document.cookie =
      "siepa_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    // Limpiar estado
    setUser(null);

    // Redirigir al login
    router.push("/login");
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Hook para proteger rutas
export const useRequireAuth = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  return { isAuthenticated, isLoading };
};
