"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { employeeLogout } from "@/lib/employee-api";
import ThemeToggle from "@/components/admin/ThemeToggle"; // Reuse admin toggle

export default function EmployeeTopbar({
  fullName,
  email,
  title,
}: {
  fullName: string;
  email: string;
  title?: string;
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await employeeLogout();
    } finally {
      router.push("/employee/login");
      router.refresh();
    }
  }

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-black/5 bg-white px-6 dark:border-white/10 dark:bg-gray-900">
      <h1 className="text-lg font-semibold text-ink-900 dark:text-gray-100">{title || "Field Dashboard"}</h1>
      <div className="flex items-center gap-3">
        <ThemeToggle />
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
