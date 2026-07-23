"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Users, Navigation, TrendingUp, Calendar, ChevronRight, Trophy, Zap, Target, Flame } from "lucide-react";
import { getEmployeeDashboard } from "@/lib/employee-api";
import StatCard from "@/components/admin/StatCard";
import RestaurantLeadModal from "@/components/employee/RestaurantLeadModal";

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

const COMMISSION_PER_WON = 5000; // PKR per won deal
const MONTHLY_QUOTA = 10; // default target
const STREAK_MESSAGES = [
  { min: 0, emoji: "🔥", label: "Get your first win!" },
  { min: 1, emoji: "⚡", label: "Off to a great start!" },
  { min: 3, emoji: "🚀", label: "Building momentum!" },
  { min: 5, emoji: "💎", label: "Top performer territory!" },
  { min: 8, emoji: "🏆", label: "Almost at quota!" },
  { min: 10, emoji: "👑", label: "Quota crushed! Keep going!" },
];

function getStreakMessage(won: number) {
  let msg = STREAK_MESSAGES[0];
  for (const m of STREAK_MESSAGES) {
    if (won >= m.min) msg = m;
  }
  return msg;
}

export default function EmployeeDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const loadDashboard = useCallback(() => {
    getEmployeeDashboard()
      .then((d: any) => setData(d))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (error) return <p className="text-sm text-red-600 p-4">{error}</p>;
  if (!data) return <p className="text-sm text-ink-900/50 dark:text-gray-400 p-4 animate-pulse">Loading your territory data…</p>;

  const s = data.stats;
  const won = Number(s.leads_won) || 0;
  const assigned = Number(s.leads_assigned) || 0;
  const conversionPct = assigned > 0 ? Math.round((won / assigned) * 100) : 0;
  const quotaPct = Math.min(Math.round((won / MONTHLY_QUOTA) * 100), 100);
  const estimatedCommission = won * COMMISSION_PER_WON;
  const streak = getStreakMessage(won);

  return (
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Assigned Leads" value={s.leads_assigned} icon={Users} />
        <StatCard label="Leads In Progress" value={s.leads_in_progress} tone="warning" icon={TrendingUp} />
        <StatCard label="Visits Completed" value={s.visits_completed} tone="brand" icon={Navigation} />
        <StatCard label="Leads Won" value={s.leads_won} tone="brand" icon={Trophy} />
        <StatCard label="Conversion Rate" value={`${conversionPct}%`} icon={Target} />
      </div>

      {/* Gamification & Commission Estimator Strip */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Quota Progress */}
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-sm dark:border-indigo-900/40 dark:from-indigo-900/20 dark:to-blue-900/10">
          <div className="flex items-center gap-2 mb-1">
            <Target size={16} className="text-blue-600 dark:text-blue-400" />
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-800 dark:text-blue-300">Monthly Quota</p>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-900 dark:text-blue-100">{quotaPct}%</span>
            <span className="text-sm font-medium text-blue-700/70 dark:text-blue-300/60">{won}/{MONTHLY_QUOTA} deals</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-blue-200/50 dark:bg-blue-900/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-700"
              style={{ width: `${quotaPct}%` }}
            />
          </div>
        </div>

        {/* Commission Estimator */}
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 shadow-sm dark:border-emerald-900/40 dark:from-emerald-900/20 dark:to-teal-900/10">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-emerald-600 dark:text-emerald-400" />
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">Estimated Commission</p>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-900 dark:text-emerald-100">
              PKR {estimatedCommission.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-emerald-700/70 dark:text-emerald-300/60 mt-1">
            {won} Won × PKR {COMMISSION_PER_WON.toLocaleString()} per deal
          </p>
          {won < MONTHLY_QUOTA && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
              +PKR {COMMISSION_PER_WON.toLocaleString()} for each additional close →
            </p>
          )}
        </div>

        {/* Performance Streak / Motivator */}
        <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-fuchsia-50 p-5 shadow-sm dark:border-purple-900/40 dark:from-purple-900/20 dark:to-fuchsia-900/10">
          <div className="flex items-center gap-2 mb-1">
            <Flame size={16} className="text-purple-600 dark:text-purple-400" />
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-800 dark:text-purple-300">Performance Streak</p>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-4xl">{streak.emoji}</span>
            <div>
              <span className="block text-lg font-black text-purple-900 dark:text-purple-100">{streak.label}</span>
              <span className="text-xs text-purple-600/80 dark:text-purple-300/60">
                {won} deal{won !== 1 ? "s" : ""} closed this month
              </span>
            </div>
          </div>
          {won > 0 && (
            <div className="flex gap-1 mt-3">
              {Array.from({ length: Math.min(won, 12) }).map((_, i) => (
                <span key={i} className="h-3 w-3 rounded-full bg-purple-500 dark:bg-purple-400 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Split Content */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Upcoming Follow-ups */}
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ink-900 dark:text-gray-100">Upcoming Follow-ups</h2>
            <Link href="/employee/crm" className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5">
              View all pipeline <ChevronRight size={12} />
            </Link>
          </div>
          {data.followUps.length === 0 ? (
            <p className="text-sm text-ink-900/40 dark:text-gray-500 py-4">No pending follow-ups. You're all caught up!</p>
          ) : (
            <ul className="space-y-3">
              {data.followUps.map((f) => (
                <li
                  key={f.id}
                  onClick={() => f.lead_id && setSelectedLeadId(f.lead_id)}
                  className="flex items-center gap-3 text-sm border-b border-black/5 pb-2.5 last:border-0 dark:border-white/5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-1.5 rounded-xl transition-colors"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex-shrink-0">
                    <Calendar size={15} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold text-ink-900 dark:text-gray-200">{f.name}</p>
                    <p className="truncate text-xs text-ink-900/50 dark:text-gray-400">{f.note || "No notes attached"}</p>
                  </div>
                  <span className="text-xs font-medium text-amber-700 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {new Date(f.due_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recently Assigned Leads */}
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ink-900 dark:text-gray-100">Recently Assigned Leads</h2>
            <Link href="/employee/restaurants" className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5">
              Data table <ChevronRight size={12} />
            </Link>
          </div>
          {data.recentLeads.length === 0 ? (
            <p className="text-sm text-ink-900/40 dark:text-gray-500 py-4">No new leads assigned yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.recentLeads.map((lead) => (
                <li
                  key={lead.lead_id}
                  onClick={() => setSelectedLeadId(lead.lead_id)}
                  className="flex items-center justify-between text-sm py-2 px-1.5 border-b border-black/5 last:border-0 dark:border-white/5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <span className="block truncate font-semibold text-ink-900 dark:text-gray-200">{lead.name}</span>
                    <span className="block truncate text-xs text-ink-900/40 dark:text-gray-500">{lead.address || "No address"}</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                      lead.stage === "new"
                        ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                        : lead.stage === "contacted"
                        ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800"
                        : "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                    }`}
                  >
                    {lead.stage}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Lead Detail Modal */}
      {selectedLeadId && (
        <RestaurantLeadModal
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
          onUpdated={loadDashboard}
        />
      )}
    </div>
  );
}
