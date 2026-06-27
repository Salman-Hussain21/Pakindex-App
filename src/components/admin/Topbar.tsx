"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { logout } from "@/lib/admin-api";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";

export default function Topbar({
  fullName,
  email,
  title,
  darkMode,
}: {
  fullName: string;
  email: string;
  title?: string;
  darkMode: boolean;
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-black/5 bg-white px-6 dark:border-white/10 dark:bg-gray-900">
      <h1 className="text-lg font-semibold text-ink-900 dark:text-gray-100">{title || "Admin Panel"}</h1>
      <div className="flex items-center gap-3">
        <ThemeToggle initialDarkMode={darkMode} />
        <NotificationBell />
        <div className="mx-1 h-6 w-px bg-black/10 dark:bg-white/10" />
        <div className="text-right">
          <p className="text-sm font-medium text-ink-900 dark:text-gray-100">{fullName}</p>
          <p className="text-xs text-ink-900/40 dark:text-gray-500">{email}</p>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          aria-label="Log out"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-ink-900/60 hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
