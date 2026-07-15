"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Database,
  MapPin,
  ScrollText,
  Settings as SettingsIcon,
  Bell,
  LineChart,
  CreditCard,
  Download,
} from "lucide-react";

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
    items: [
      { href: "/company", label: "Dashboard", exact: true, icon: LayoutDashboard },
      { href: "/company/analytics", label: "Territory Analytics", icon: LineChart },
    ],
  },
  {
    label: "Directory",
    items: [
      { href: "/company/database", label: "Restaurant Database", icon: Database },
      { href: "/company/map", label: "HORECA Map", icon: MapPin },
    ],
  },
  {
    label: "Workforce",
    items: [
      { href: "/company/employees", label: "Employee Management", icon: Users },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/company/notifications", label: "Notifications", icon: Bell },
      { href: "/company/integrations", label: "Data & Integrations", icon: Download },
      { href: "/company/billing", label: "Billing & Plan", icon: CreditCard },
      { href: "/company/audit-logs", label: "Audit Logs", icon: ScrollText },
      { href: "/company/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
];

export default function CompanySidebar({ plan = "free" }: { plan?: string }) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("/api/company/notifications")
      .then((r) => r.json())
      .then((data) => setUnreadCount(data.unreadCount || 0))
      .catch(() => {});
  }, [pathname]); // re-check whenever user navigates

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r border-black/5 bg-white dark:bg-gray-900 dark:border-white/10">
      {/* Brand Header Section matching Admin spacing exactly */}
      <div className="flex items-center gap-2 border-b border-black/5 px-5 py-5 dark:border-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-full.png" alt="PakIndex" className="h-7 w-auto dark:brightness-0 dark:invert" />
        <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          Company
        </span>
      </div>

      {/* Structured Navigation with Admin Subgroup Styling */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => {
          // Filter out HORECA map for free/trial users
          const isFree = plan === "free" || plan === "trial";
          const visibleItems = group.items.filter(
            (item) => !(isFree && item.label === "HORECA Map")
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label} className="mb-5">
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-ink-900/35 dark:text-gray-500">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
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
                            ? "bg-brand-600 text-white dark:bg-brand-700"
                            : "text-ink-900/70 hover:bg-brand-50 hover:text-brand-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                        }`}
                      >
                        <Icon size={16} className="flex-shrink-0" />
                        {item.label}
                        {item.href === "/company/notifications" && unreadCount > 0 && (
                          <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Footer Version Stamp */}
      <div className="border-t border-black/5 px-5 py-4 text-[11px] text-ink-900/40 dark:border-white/10 dark:text-gray-600">
        PakIndex Company Workspace v0.1
      </div>
    </aside>
  );
}