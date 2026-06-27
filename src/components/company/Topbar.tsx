"use client"; // Required because we are handling the click event and routing

import { useRouter } from "next/navigation";
import { useState } from "react";
import { companyLogout } from "@/lib/company-api"; // Make sure your logout helper is imported here

interface TopbarProps {
  fullName?: string;
  email?: string;
}

export default function Topbar({ fullName, email }: TopbarProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await companyLogout();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      // Forcefully send them to the company login and refresh the server state
      router.push("/company/login");
      router.refresh();
    }
  }

  return (
    <header className="h-16 border-b border-black/5 bg-white px-6 flex items-center justify-between">
      <h1 className="">
        Company Dashboard
      </h1>
      
      <div className="flex items-center gap-4">
        {/* Profile Info */}
        <div className="text-right">
          <span className="block text-sm font-semibold text-ink-900">{fullName || "Corporate Admin"}</span>
          <span className="block text-xs text-ink-900/40">{email || "admin@company.com"}</span>
        </div>

        {/* Avatar */}
        <div className="h-9 w-9 rounded-full bg-brand-600 flex items-center justify-center text-white font-medium text-sm">
          {(fullName || "C").charAt(0).toUpperCase()}
        </div>

        {/* Fixed Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="ml-2 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium text-ink-900/70 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {isLoggingOut ? "Signing out..." : "Log out"}
        </button>
      </div>
    </header>
  );
}