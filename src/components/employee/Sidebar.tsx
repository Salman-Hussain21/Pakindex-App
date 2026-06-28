"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MapPin, Users, Navigation } from "lucide-react";

const NAV = [
  { href: "/employee", label: "Dashboard", exact: true, icon: LayoutDashboard },
  { href: "/employee/territory", label: "My Territory", icon: MapPin },
  { href: "/employee/crm", label: "CRM / Leads", icon: Users },
  { href: "/employee/visits", label: "Field Visits", icon: Navigation },
];

export default function EmployeeSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r border-black/5 bg-white dark:border-white/10 dark:bg-gray-900">
      <div className="flex items-center gap-2 border-b border-black/5 px-5 py-5 dark:border-white/10">
        <img src="/brand/logo-full.png" alt="PakIndex" className="h-7 w-auto dark:brightness-0 dark:invert" />
        <span className="ml-auto rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          Agent
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-600 text-white"
                      : "text-ink-900/70 hover:bg-brand-50 hover:text-brand-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-brand-400"
                  }`}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-black/5 px-5 py-4 text-[11px] text-ink-900/40 dark:border-white/10 dark:text-gray-500">
        PakIndex Field App v1.0
      </div>
    </aside>
  );
}
