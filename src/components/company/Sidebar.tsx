"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/company", label: "Dashboard", exact: true },
  { href: "/company/profile", label: "Company Profile" },
  { href: "/company/employees", label: "Employee Management" },
  { href: "/company/database", label: "Restaurant Database" },
  { href: "/company/map", label: "HORECA Map" },
  { href: "/company/crm", label: "CRM Management" },
  { href: "/company/analytics", label: "Employee Analytics" },
  { href: "/company/settings", label: "Settings" },
];

export default function CompanySidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r border-black/5 bg-white">
      <div className="flex items-center gap-2 border-b border-black/5 px-5 py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-full.png" alt="PakIndex" className="h-7 w-auto" />
        <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
          Company
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-600 text-white"
                      : "text-ink-900/70 hover:bg-brand-50 hover:text-brand-700"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-black/5 px-5 py-4 text-[11px] text-ink-900/40">
        PakIndex Company Workspace v0.1
      </div>
    </aside>
  );
}