"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Database,
  MapPin,
  ScrollText,
  Settings as SettingsIcon,
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
    items: [{ href: "/company", label: "Dashboard", exact: true, icon: LayoutDashboard }],
  },
  {
    label: "Workforce & Assets",
    items: [
      { href: "/company/employees", label: "Employee Management", icon: Users },
      { href: "/company/database", label: "Restaurant Database", icon: Database },
      { href: "/company/map", label: "HORECA Map", icon: MapPin },
    ],
  },
  {
    label: "Management",
    items: [
      { href: "/company/profile", label: "Company Profile", icon: Building2 },
      { href: "/company/audit-logs", label: "Audit Logs", icon: ScrollText },
    ],
  },
  {
    label: "Configuration",
    items: [
      { href: "/company/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
];

export default function CompanySidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r border-black/5 bg-white">
      {/* Brand Header Section matching Admin spacing exactly */}
      <div className="flex items-center gap-2 border-b border-black/5 px-5 py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-full.png" alt="PakIndex" className="h-7 w-auto" />
        <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
          Company
        </span>
      </div>

      {/* Structured Navigation with Admin Subgroup Styling */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-ink-900/35">
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
                          : "text-ink-900/70 hover:bg-brand-50 hover:text-brand-700"
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

      {/* Footer Version Stamp */}
      <div className="border-t border-black/5 px-5 py-4 text-[11px] text-ink-900/40">
        PakIndex Company Workspace v0.1
      </div>
    </aside>
  );
}