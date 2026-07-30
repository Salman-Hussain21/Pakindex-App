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
  minPlan?: "premium" | "ultra_premium"; // undefined = available on all plans
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
      { href: "/company/analytics", label: "Territory Analytics", icon: LineChart, minPlan: "premium" },
    ],
  },
  {
    label: "Directory",
    items: [
      { href: "/company/database", label: "Restaurant Database", icon: Database },
      { href: "/company/map", label: "HORECA Map", icon: MapPin, minPlan: "premium" },
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
      { href: "/company/integrations", label: "Data & Integrations", icon: Download, minPlan: "premium" },
      { href: "/company/billing", label: "Billing & Plan", icon: CreditCard },
      { href: "/company/audit-logs", label: "Audit Logs", icon: ScrollText, minPlan: "premium" },
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
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r border-black/[0.06] bg-white dark:border-white/[0.06] dark:bg-[#070b09]">
      {/* Brand Header Section matching Admin spacing exactly */}
      <div className="flex items-center gap-2 border-b border-black/[0.06] px-5 py-4 dark:border-white/[0.06]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-full.png" alt="PakIndex" className="h-10 w-auto dark:brightness-0 dark:invert" />
        <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          Company
        </span>
      </div>

      {/* Structured Navigation with Admin Subgroup Styling */}
      <nav className="flex-1 overflow-y-auto py-4">
        {NAV_GROUPS.map((group) => {
        // Determine which plans are accessible based on the current company plan
          const isPremiumOrAbove = plan === "premium" || plan === "ultra_premium" || plan === "basic" || plan === "pro" || plan === "enterprise";
          const visibleItems = group.items.filter((item) => {
            if (!item.minPlan) return true; // no restriction
            if (item.minPlan === "premium") return isPremiumOrAbove;
            if (item.minPlan === "ultra_premium") return plan === "ultra_premium" || plan === "pro" || plan === "enterprise";
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label} className="mb-5">
              <p className="mb-1.5 px-4 font-[family-name:var(--font-montserrat)] text-[10px] font-bold uppercase tracking-widest text-ink-900/35 dark:text-gray-500">
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
                        className={`flex items-center gap-2.5 border-l-3 py-2 px-4 text-[13px] font-medium transition-all duration-150 ${
                          isActive
                            ? "border-brand-500 bg-brand-50/60 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400"
                            : "border-transparent text-ink-900/60 hover:bg-gray-50 hover:text-ink-900 dark:text-gray-400 dark:hover:bg-white/[0.02] dark:hover:text-gray-200"
                        }`}
                      >
                        <Icon size={15} className="flex-shrink-0 opacity-80" />
                        {item.label}
                        {item.href === "/company/notifications" && unreadCount > 0 && (
                          <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
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
      <div className="border-t border-black/[0.06] px-5 py-4 text-[10px] font-medium tracking-wide text-ink-900/30 dark:border-white/[0.06] dark:text-gray-600">
        PakIndex Company Workspace v0.1
      </div>
    </aside>
  );
}