"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "pakindex-company-dark-mode";

interface ThemeContextValue {
  dark: boolean;
  setDark: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  initialDarkMode,
  children,
}: {
  initialDarkMode: boolean;
  children: React.ReactNode;
}) {
  const [dark, setDarkState] = useState(initialDarkMode);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setDarkState(stored === "true");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem(STORAGE_KEY, String(dark));
  }, [dark]);

  function setDark(value: boolean) {
    setDarkState(value);
    fetch("/api/company/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ darkMode: value }),
    }).catch(() => {
      // localStorage already has it for this browser regardless.
    });
  }

  return <ThemeContext.Provider value={{ dark, setDark }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider (it wraps the whole company panel layout)");
  }
  return ctx;
}