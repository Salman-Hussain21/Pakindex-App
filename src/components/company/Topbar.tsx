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
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-black/[0.06] bg-white/80 backdrop-blur-xl px-6 dark:border-white/[0.06] dark:bg-[#070b09]/80">
      <h1 className="font-[family-name:var(--font-montserrat)] text-lg font-bold tracking-tight text-ink-900 dark:text-gray-100">{title || "Company Dashboard"}</h1>

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
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.08] text-ink-900/50 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-150 disabled:opacity-50 dark:border-white/[0.08] dark:text-gray-400 dark:hover:bg-red-950/20 dark:hover:text-red-400 dark:hover:border-red-900/30"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}