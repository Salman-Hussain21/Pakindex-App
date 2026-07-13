"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Radar,
  Map,
  Inbox,
  ClipboardCheck,
  Database,
  Trash2,
  Building2,
  MapPin,
  ScrollText,
  Settings as SettingsIcon,
  Package,
  Bell,
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
    items: [{ href: "/admin", label: "Dashboard", exact: true, icon: LayoutDashboard }],
  },
  {
    label: "Data Pipeline",
    items: [
      { href: "/admin/scraping", label: "Scraping Center", icon: Radar },
      { href: "/admin/grid-scraper", label: "Grid Scraper", icon: Map },
      { href: "/admin/scraped-data", label: "New Scraped Data", icon: Inbox },
      { href: "/admin/pending", label: "Pending Approval", icon: ClipboardCheck },
      { href: "/admin/rejected", label: "Rejected / Trash", icon: Trash2 },
    ],
  },
  {
    label: "Directory",
    items: [
      { href: "/admin/database", label: "HORECA Database", icon: Database },
      { href: "/admin/map", label: "HORECA Map", icon: MapPin },
    ],
  },
  {
    label: "Accounts",
    items: [
      { href: "/admin/companies", label: "Company Management", icon: Building2 },
      { href: "/admin/packages", label: "Subscription Packages", icon: Package },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
      { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
      { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r border-black/5 bg-white dark:border-white/10 dark:bg-gray-900">
      <div className="flex items-center gap-2 border-b border-black/5 px-5 py-5 dark:border-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-full.png" alt="PakIndex" className="h-7 w-auto dark:brightness-0 dark:invert" />
        <span className="ml-auto rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
          Admin
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-ink-900/35 dark:text-gray-600">
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
          </div>
        ))}
      </nav>

      <div className="border-t border-black/5 px-5 py-4 text-[11px] text-ink-900/40 dark:border-white/10 dark:text-gray-500">
        PakIndex Admin Panel v0.3
      </div>
    </aside>
  );
}
