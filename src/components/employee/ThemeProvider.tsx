"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "pakindex-dark-mode";

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
  // Initialise synchronously from localStorage on the client to avoid flash.
  // On the server (SSR) window is undefined so we fall back to the DB value.
  const [dark, setDarkState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) return stored === "true";
    }
    return initialDarkMode;
  });

  // Track whether we've already applied the initial dark class so the effect
  // below doesn't fire twice on mount and cause a flicker.
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;

      // On first mount, re-read localStorage (it may have been set by the
      // no-flash inline script in the root layout before React hydrated).
      const stored = localStorage.getItem(STORAGE_KEY);
      const resolvedDark = stored !== null ? stored === "true" : initialDarkMode;

      // Apply class immediately without a state update if already correct.
      document.documentElement.classList.toggle("dark", resolvedDark);

      // If there's a discrepancy between localStorage and the DB value that
      // was passed as a prop, sync the DB so future fresh loads are correct.
      if (resolvedDark !== initialDarkMode) {
        setDarkState(resolvedDark);
        fetch("/api/employee/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ darkMode: resolvedDark }),
        }).catch(() => {});
      }
      return;
    }

    // After the first mount, keep the class in sync with any explicit toggle.
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem(STORAGE_KEY, String(dark));
  }, [dark]); // eslint-disable-line react-hooks/exhaustive-deps

  function setDark(value: boolean) {
    setDarkState(value);
    localStorage.setItem(STORAGE_KEY, String(value));
    document.documentElement.classList.toggle("dark", value);
    fetch("/api/employee/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ darkMode: value }),
    }).catch(() => {});
  }

  return (
    <ThemeContext.Provider value={{ dark, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within an employee ThemeProvider");
  }
  return ctx;
}
