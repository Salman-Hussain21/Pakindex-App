"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "@/lib/admin-api";

export default function Topbar({
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
      await logout();
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-black/5 bg-white px-6">
      <h1 className="text-lg font-semibold text-ink-900">{title || "Admin Panel"}</h1>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-ink-900">{fullName}</p>
          <p className="text-xs text-ink-900/40">{email}</p>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium text-ink-900/70 hover:bg-gray-50 disabled:opacity-50"
        >
          {loggingOut ? "Logging out…" : "Log out"}
        </button>
      </div>
    </header>
  );
}
