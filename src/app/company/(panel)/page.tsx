"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, ClipboardCheck, Database, Radar, ShieldX, Users, Store, BookOpen, UserCheck, Star, Trophy } from "lucide-react";
import { getCompanyDashboard } from "@/lib/company-api";
import StatusBadge from "@/components/company/StatusBadge";
import StatCard from "@/components/company/StatCard";


interface DashboardStats {
  total_restaurants: string;
  new_restaurants: string;
  crm_entries: string;
  total_employees: string;
  active_leads: string;
  won_leads: string;
}

interface CompanyDashboardData {
  stats: DashboardStats;
  pipeline: Record<string, number>;
  recentRestaurants: any[];
  employeePerformance: any[];
}

export default function CompanyDashboardPage() {
  const [data, setData] = useState<CompanyDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCompanyDashboard()
      .then((d: any) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (error) return <p className="text-sm text-red-600 dark:text-red-400 font-medium p-4">{error}</p>;
  if (loading || !data) return <p className="text-sm text-ink-900/50 dark:text-gray-500 p-4 animate-pulse">Loading company intelligence data…</p>;

  const s = data.stats;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Restaurants" value={s.total_restaurants} icon={Store} />
        <StatCard label="New Restaurants" value={s.new_restaurants} tone="brand" icon={Star} />
        <StatCard label="CRM Entries" value={s.crm_entries} icon={BookOpen} />
        <StatCard label="Active Employees" value={s.total_employees} icon={UserCheck} />
        <StatCard label="Active Leads" value={s.active_leads} tone="warning" icon={Radar} />
        <StatCard label="Won Leads" value={s.won_leads} tone="brand" icon={Trophy} />
      </div>

      {/* Quick Action Banner */}
      {Number(s.new_restaurants) > 0 && (
        <Link
          href="/company/database?filter=new"
          className="block rounded-xl border border-brand-200 dark:border-brand-900/30 bg-brand-50 dark:bg-brand-900/10 px-4 py-3 text-sm font-medium text-brand-800 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/20 transition-colors"
        >
          {s.new_restaurants} unassigned new restaurant profiles matched your pipeline territory rules. View records →
        </Link>
      )}

      {/* Main Insights Split Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Pipeline Acquisitions */}
        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-ink-900 dark:text-white">Recent Restaurant Additions</h2>
          {data.recentRestaurants.length === 0 ? (
            <p className="text-sm text-ink-900/40 dark:text-gray-500">No restaurant accounts synchronized yet.</p>
          ) : (
            <ul className="divide-y divide-black/5 dark:divide-white/10">
              {data.recentRestaurants.map((restaurant) => (
                <li key={restaurant.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="truncate pr-4">
                    <span className="block font-medium text-ink-900 dark:text-gray-200 truncate">{restaurant.name}</span>
                    <span className="text-xs text-ink-900/40 dark:text-gray-500">{restaurant.area_name || "Territory Unassigned"}</span>
                  </div>
                  <StatusBadge status={restaurant.status || "new"} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* CRM Pipeline Summary */}
        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-ink-900 dark:text-white">CRM Pipeline Overview</h2>
          {Object.keys(data.pipeline).length === 0 ? (
            <p className="text-sm text-ink-900/40 dark:text-gray-500">No CRM leads in the pipeline yet. Assign employees to restaurants to start tracking.</p>
          ) : (
            <div className="space-y-3">
              {[
                { stage: "new",       label: "New",       color: "bg-blue-500" },
                { stage: "contacted", label: "Contacted", color: "bg-amber-500" },
                { stage: "qualified", label: "Qualified", color: "bg-purple-500" },
                { stage: "won",       label: "Won",       color: "bg-emerald-500" },
                { stage: "lost",      label: "Lost",      color: "bg-red-400" },
              ].map(({ stage, label, color }) => {
                const count = data.pipeline[stage] || 0;
                const total = Object.values(data.pipeline).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={stage}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-ink-900 dark:text-gray-200">{label}</span>
                      <span className="text-ink-900/50 dark:text-gray-400">{count} leads · {pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Employee Performance Tracking Column */}
        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-ink-900 dark:text-white">Employee Lead Conversions</h2>
          {data.employeePerformance.length === 0 ? (
            <p className="text-sm text-ink-900/40 dark:text-gray-500">No employee active records found.</p>
          ) : (
            <div className="space-y-3">
              {data.employeePerformance.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between text-sm border-b border-black/5 dark:border-white/10 pb-2 last:border-none">
                  <div>
                    <span className="block font-medium text-ink-900 dark:text-gray-200">{emp.full_name}</span>
                    <span className="text-xs text-ink-900/40 dark:text-gray-500">{emp.assigned_leads || 0} Leads Assigned</span>
                  </div>
                  <div className="text-right">
                    <span className="block font-semibold text-brand-600 dark:text-brand-400">{emp.converted_leads || 0} Won</span>
                    <span className="text-xs text-ink-900/40 dark:text-gray-500">CRMs Updated</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}