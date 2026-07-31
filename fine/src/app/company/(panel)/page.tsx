"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Store, BookOpen, UserCheck, Star, Trophy, AlertTriangle, Activity, PieChart, Clock, FileDown } from "lucide-react";
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
  stale_leads?: string;
}

interface CompanyDashboardData {
  stats: DashboardStats;
  pipeline: Record<string, number>;
  recentRestaurants: any[];
  employeePerformance: any[];
  todayVisits?: any[];
  competitorIntel?: any[];
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
      {/* Header with Export */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-900 dark:text-white">Company Intelligence Dashboard</h1>
          <p className="text-sm text-ink-900/60 dark:text-gray-400">Real-time overview of territory, pipeline, and field activity.</p>
        </div>
        <a
          href="/api/company/report"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-4 py-2.5 rounded-xl transition-colors"
        >
          <FileDown size={14} /> Export Executive Report
        </a>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Restaurants" value={s.total_restaurants} icon={Store} />
        <StatCard label="New Restaurants" value={s.new_restaurants} tone="brand" icon={Star} />
        <StatCard label="CRM Entries" value={s.crm_entries} icon={BookOpen} />
        <StatCard label="Active Employees" value={s.total_employees} icon={UserCheck} />
        <StatCard label="Active Leads" value={s.active_leads} tone="warning" icon={Activity} />
        <StatCard label="Won Leads" value={s.won_leads} tone="brand" icon={Trophy} />
      </div>

      {/* Warnings & Quick Banners */}
      <div className="space-y-2">
        {Number(s.stale_leads || 0) > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 px-4 py-3 text-sm font-medium text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-600" />
              <span>
                <strong>{s.stale_leads} lead(s)</strong> have not been visited or contacted in over 14 days ("Stale Leads").
              </span>
            </div>
            <Link href="/company/employees" className="text-xs font-bold text-amber-900 dark:text-amber-200 underline">
              Manage Rep Assignments →
            </Link>
          </div>
        )}

        {Number(s.new_restaurants) > 0 && (
          <Link
            href="/company/database?filter=new"
            className="block rounded-xl border border-brand-200 dark:border-brand-900/30 bg-brand-50 dark:bg-brand-900/10 px-4 py-3 text-sm font-medium text-brand-800 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/20 transition-colors"
          >
            {s.new_restaurants} unassigned new restaurant profiles matched your pipeline territory rules. View records →
          </Link>
        )}
      </div>

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
            <p className="text-sm text-ink-900/40 dark:text-gray-500">No CRM leads in the pipeline yet. Employees automatically sync restaurants in their assigned areas.</p>
          ) : (
            <div className="space-y-3">
              {[
                { stage: "new",       label: "New",       color: "bg-blue-500" },
                { stage: "contacted", label: "Contacted", color: "bg-purple-500" },
                { stage: "interested",label: "Interested",color: "bg-amber-500" },
                { stage: "meeting",   label: "Meeting",   color: "bg-indigo-500" },
                { stage: "proposal",  label: "Proposal",  color: "bg-orange-500" },
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

      {/* Advanced Intelligence & Field Activity Split Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Live Field Activity Feed */}
        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ink-900 dark:text-white flex items-center gap-2">
              <Activity size={16} className="text-brand-600" /> Live Field Activity &amp; Check-ins
            </h2>
            <span className="text-xs text-ink-900/40 dark:text-gray-500">Real-time Stream</span>
          </div>
          {!data.todayVisits || data.todayVisits.length === 0 ? (
            <p className="text-sm text-ink-900/40 dark:text-gray-500 py-4">No field check-ins logged yet today.</p>
          ) : (
            <ul className="space-y-3">
              {data.todayVisits.map((v) => (
                <li key={v.id} className="flex items-start gap-3 border-b border-black/5 dark:border-white/5 pb-2.5 last:border-0 text-xs">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex-shrink-0 mt-0.5">
                    📍
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink-900 dark:text-gray-200">
                      {v.agent_name} <span className="font-normal text-gray-500">visited</span> {v.business_name}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">{v.title} {v.body ? `· ${v.body}` : ""}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Clock size={11} /> {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Competitor Market Share Breakdown */}
        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ink-900 dark:text-white flex items-center gap-2">
              <PieChart size={16} className="text-purple-600" /> Competitor Market Share Aggregator
            </h2>
            <span className="text-xs text-ink-900/40 dark:text-gray-500">Logged by Reps</span>
          </div>
          {!data.competitorIntel || data.competitorIntel.length === 0 ? (
            <p className="text-sm text-ink-900/40 dark:text-gray-500 py-4">No competitor intelligence logged yet by field agents.</p>
          ) : (
            <div className="space-y-3 pt-1">
              {data.competitorIntel.map((item, idx) => {
                const totalCount = data.competitorIntel!.reduce((acc, c) => acc + Number(c.count), 0);
                const pct = totalCount > 0 ? Math.round((Number(item.count) / totalCount) * 100) : 0;
                return (
                  <div key={idx}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink-900 dark:text-gray-200">{item.supplier}</span>
                      <span className="text-gray-500 dark:text-gray-400">{item.count} stores ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div className="h-full rounded-full bg-purple-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}