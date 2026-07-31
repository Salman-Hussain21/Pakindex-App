"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { dark, setDark } = useTheme();

  return (
    <button
      onClick={() => setDark(!dark)}
      aria-label="Toggle dark mode"
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-ink-900/60 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-gray-800"
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}