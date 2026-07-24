"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Navigation, TrendingUp, Calendar } from "lucide-react";
import { getEmployeeDashboard } from "@/lib/employee-api";
import StatCard from "@/components/admin/StatCard"; // Reusing admin stat card

interface DashboardData {
  stats: {
    leads_assigned: string | number;
    visits_completed: string | number;
    leads_won: string | number;
    leads_in_progress: string | number;
    conversion_rate_pct: string | number;
  };
  recentLeads: any[];
  followUps: any[];
}

export default function EmployeeDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEmployeeDashboard()
      .then((d: any) => setData(d))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-sm text-ink-900/50 dark:text-gray-400">Loading your territory data…</p>;

  const s = data.stats;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Assigned Leads" value={s.leads_assigned} icon={Users} />
        <StatCard label="Leads In Progress" value={s.leads_in_progress} tone="warning" icon={TrendingUp} />
        <StatCard label="Visits Completed" value={s.visits_completed} tone="brand" icon={Navigation} />
        <StatCard label="Leads Won" value={s.leads_won} tone="brand" icon={Users} />
        
        {/* CEO Gamification Module: Performance/Commission Estimator */}
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-sm dark:border-indigo-900/40 dark:from-indigo-900/20 dark:to-blue-900/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-800 dark:text-blue-300">Target Attainment</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">{Number(s.leads_won) * 10}%</span>
            <span className="text-sm font-medium text-blue-700/70 dark:text-blue-300/60">of monthly quota</span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-blue-200/50 dark:bg-blue-900/50">
            <div className="h-full bg-blue-600 dark:bg-blue-400" style={{ width: `${Math.min(Number(s.leads_won) * 10, 100)}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ink-900 dark:text-gray-100">Upcoming Follow-ups</h2>
            <Link href="/employee/crm" className="text-xs text-brand-600 hover:underline">View all</Link>
          </div>
          {data.followUps.length === 0 ? (
            <p className="text-sm text-ink-900/40 dark:text-gray-500">No pending follow-ups. You're all caught up!</p>
          ) : (
            <ul className="space-y-3">
              {data.followUps.map((f) => (
                <li key={f.id} className="flex items-center gap-3 text-sm border-b border-black/5 pb-2 last:border-0 dark:border-white/5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex-shrink-0">
                    <Calendar size={15} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-ink-900 dark:text-gray-200">{f.name}</p>
                    <p className="truncate text-xs text-ink-900/50 dark:text-gray-400">{f.note || "No notes attached"}</p>
                  </div>
                  <span className="text-xs font-medium text-ink-900/50 dark:text-gray-400 whitespace-nowrap">
                    {new Date(f.due_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ink-900 dark:text-gray-100">Recently Assigned Leads</h2>
          </div>
          {data.recentLeads.length === 0 ? (
            <p className="text-sm text-ink-900/40 dark:text-gray-500">No new leads assigned.</p>
          ) : (
            <ul className="space-y-2">
              {data.recentLeads.map((lead) => (
                <li key={lead.id} className="flex items-center justify-between text-sm py-1.5 border-b border-black/5 last:border-0 dark:border-white/5">
                  <div className="min-w-0 flex-1 pr-4">
                    <span className="block truncate font-medium text-ink-900 dark:text-gray-200">{lead.name}</span>
                    <span className="block truncate text-xs text-ink-900/40 dark:text-gray-500">{lead.address}</span>
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-md ${
                    lead.stage === 'new' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    lead.stage === 'contacted' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {lead.stage}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
