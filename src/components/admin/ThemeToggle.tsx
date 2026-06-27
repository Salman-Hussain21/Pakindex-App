"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "pakindex-dark-mode";

export default function ThemeToggle({ initialDarkMode }: { initialDarkMode: boolean }) {
  const [dark, setDark] = useState(initialDarkMode);

  useEffect(() => {
    // Reconcile with whatever the no-flash script already applied on <html>.
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setDark(stored === "true");
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem(STORAGE_KEY, String(dark));
  }, [dark]);

  async function toggle() {
    const next = !dark;
    setDark(next);
    try {
      await fetch("/api/admin/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ darkMode: next }),
      });
    } catch {
      // Non-fatal — localStorage already has it for this browser.
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-ink-900/60 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-gray-800"
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
