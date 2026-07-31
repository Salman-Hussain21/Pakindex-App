"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, ClipboardCheck, Database, Radar, ShieldX, Users } from "lucide-react";
import { getDashboard } from "@/lib/admin-api";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";

interface DashboardData {
  stats: {
    total_businesses: string;
    pending_approvals: string;
    approved_records: string;
    rejected_records: string;
    total_companies: string;
    total_employees: string;
    scraped_today: string;
    scraped_this_week: string;
  };
  recentScrapes: any[];
  recentApprovals: any[];
  recentCompanies: any[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then((d: any) => setData(d))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-sm text-ink-900/50 dark:text-gray-400">Loading dashboard…</p>;

  const s = data.stats;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Businesses" value={s.total_businesses} icon={Database} />
        <StatCard label="Pending Approval" value={s.pending_approvals} tone="warning" icon={ClipboardCheck} />
        <StatCard label="Approved" value={s.approved_records} tone="brand" icon={Database} />
        <StatCard label="Rejected" value={s.rejected_records} tone="danger" icon={ShieldX} />
        <StatCard label="Companies" value={s.total_companies} icon={Building2} />
        <StatCard label="Employees" value={s.total_employees} icon={Users} />
        <StatCard label="Scraped Today" value={s.scraped_today} icon={Radar} />
        <StatCard label="Scraped This Week" value={s.scraped_this_week} icon={Radar} />
      </div>

      {Number(s.pending_approvals) > 0 && (
        <Link
          href="/admin/pending"
          className="block rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/30"
        >
          {s.pending_approvals} business{Number(s.pending_approvals) === 1 ? "" : "es"} waiting for
          your review →
        </Link>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
          <h2 className="mb-3 text-sm font-semibold text-ink-900 dark:text-gray-100">Recent Scrapes</h2>
          {data.recentScrapes.length === 0 ? (
            <p className="text-sm text-ink-900/40 dark:text-gray-500">No scrapes yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.recentScrapes.map((job) => (
                <li key={job.id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-ink-900/80 dark:text-gray-200">{job.query || "—"}</span>
                  <span className="ml-2 flex-shrink-0 text-ink-900/40 dark:text-gray-500">
                    {job.new_records ?? 0} new
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
          <h2 className="mb-3 text-sm font-semibold text-ink-900 dark:text-gray-100">Recent Approvals / Rejections</h2>
          {data.recentApprovals.length === 0 ? (
            <p className="text-sm text-ink-900/40 dark:text-gray-500">No activity yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.recentApprovals.map((b) => (
                <li key={b.id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-ink-900/80 dark:text-gray-200">{b.name}</span>
                  <StatusBadge status={b.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
