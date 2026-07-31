"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { companyLogout } from "@/lib/company-api";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";

interface TopbarProps {
  fullName?: string;
  email?: string;
  title?: string;
}

export default function Topbar({ fullName, email, title }: TopbarProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await companyLogout();
    } catch (err) {
      console.warn("Server logout returned an error, forcing local client cookie purge fallback:", err);
    } finally {
      document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      window.location.href = "/company/login";
    }
  }

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-black/5 bg-white px-6 dark:border-white/10 dark:bg-gray-900">
      <h1 className="text-lg font-semibold text-ink-900 dark:text-gray-100">{title || "Company Dashboard"}</h1>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <NotificationBell />

        <div className="mx-1 h-6 w-px bg-black/10 dark:bg-white/10" />

        <div className="text-right">
          <p className="text-sm font-medium text-ink-900 dark:text-gray-100">{fullName || "Corporate Admin"}</p>
          <p className="text-xs text-ink-900/40 dark:text-gray-500">{email || "admin@company.com"}</p>
        </div>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          aria-label="Log out"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-ink-900/60 hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer dark:border-white/10 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}