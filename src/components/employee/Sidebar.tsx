"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MapPin, Users, Navigation, Table2 } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: any;
  exact?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/employee", label: "Dashboard", exact: true, icon: LayoutDashboard }],
  },
  {
    label: "Directory",
    items: [
      { href: "/employee/territory", label: "My Territory", icon: MapPin },
      { href: "/employee/restaurants", label: "Restaurant Data Table", icon: Table2 },
    ],
  },
  {
    label: "Workforce",
    items: [
      { href: "/employee/crm", label: "CRM / Leads", icon: Users },
      { href: "/employee/visits", label: "Field Visits", icon: Navigation },
    ],
  },
];

export default function EmployeeSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r border-black/[0.06] bg-white dark:border-white/[0.06] dark:bg-[#070b09]">
      <div className="flex items-center gap-2 border-b border-black/[0.06] px-5 py-4 dark:border-white/[0.06]">
        <img src="/brand/logo-full.png" alt="PakIndex" className="h-10 w-auto dark:brightness-0 dark:invert" />
        <span className="ml-auto rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          Agent
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-1.5 px-4 font-[family-name:var(--font-montserrat)] text-[10px] font-bold uppercase tracking-widest text-ink-900/35 dark:text-gray-500">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2.5 border-l-3 py-2 px-4 text-[13px] font-medium transition-all duration-150 ${
                        isActive
                          ? "border-brand-500 bg-brand-50/50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400"
                          : "border-transparent text-ink-900/60 hover:bg-gray-50 hover:text-ink-900 dark:text-gray-400 dark:hover:bg-white/[0.02] dark:hover:text-gray-200"
                      }`}
                    >
                      <Icon size={15} className="flex-shrink-0 opacity-80" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-black/[0.06] px-5 py-4 text-[10px] font-medium tracking-wide text-ink-900/30 dark:border-white/[0.06] dark:text-gray-600">
        PakIndex Field App v1.0
      </div>
    </aside>
  );
}
