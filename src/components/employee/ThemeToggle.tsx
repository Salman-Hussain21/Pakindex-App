"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function EmployeeThemeToggle() {
  const { dark, setDark } = useTheme();

  return (
    <button
      onClick={() => setDark(!dark)}
      aria-label="Toggle dark mode"
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.08] text-ink-900/50 hover:bg-gray-100 transition-all duration-200 dark:border-white/[0.08] dark:text-gray-400 dark:hover:bg-white/[0.06]"
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
