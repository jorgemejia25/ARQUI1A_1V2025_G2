/**
 * ThemeToggle - Atom component for toggling between light and dark themes
 *
 * A styled toggle button that allows users to switch between light and dark modes.
 * Features smooth transitions, theme persistence via next-themes, and responsive
 * design with appropriate icons for each theme state.
 *
 * @returns A theme toggle button with animated icon transitions
 *
 * @example
 * ```tsx
 * <ThemeToggle />
 * ```
 *
 * @features
 * - Automatic theme detection and persistence
 * - Smooth icon transitions between sun and moon
 * - Hover and active states
 * - Accessible keyboard navigation
 * - SSR-safe rendering
 */

"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@heroui/button";
import { useIsSSR } from "@react-aria/ssr";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isSSR = useIsSSR();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // Don't render anything until mounted to avoid hydration issues
  if (!mounted || isSSR) {
    return (
      <Button
        isIconOnly
        variant="light"
        size="sm"
        className="w-10 h-10"
        isDisabled
      >
        <Sun className="w-5 h-5" />
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      isIconOnly
      variant="light"
      size="sm"
      className="w-10 h-10 transition-all duration-200 hover:bg-default-100 dark:hover:bg-default-200 border border-transparent hover:border-divider"
      onPress={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <div className="relative w-5 h-5">
        <Sun
          className={`absolute w-5 h-5 transition-all duration-300 text-warning-500 ${
            isDark
              ? "scale-0 rotate-90 opacity-0"
              : "scale-100 rotate-0 opacity-100"
          }`}
        />
        <Moon
          className={`absolute w-5 h-5 transition-all duration-300 text-primary-400 ${
            isDark
              ? "scale-100 rotate-0 opacity-100"
              : "scale-0 -rotate-90 opacity-0"
          }`}
        />
      </div>
    </Button>
  );
}
