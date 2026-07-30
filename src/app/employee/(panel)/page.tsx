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
    <div className="space-y-6 font-[family-name:var(--font-poppins)]">
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
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111827] hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-2 mb-2">
            <Target size={14} className="text-brand-500" />
            <p className="font-[family-name:var(--font-montserrat)] text-[10px] font-bold uppercase tracking-widest text-ink-900/40 dark:text-gray-500">Monthly Quota</p>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-[family-name:var(--font-montserrat)] text-2xl font-black tracking-tight text-ink-900 dark:text-gray-100">{quotaPct}%</span>
            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">{won} / {MONTHLY_QUOTA} Won</span>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-500 transition-all duration-700"
              style={{ width: `${quotaPct}%` }}
            />
          </div>
        </div>

        {/* Commission Estimator */}
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111827] hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-amber-500" />
            <p className="font-[family-name:var(--font-montserrat)] text-[10px] font-bold uppercase tracking-widest text-ink-900/40 dark:text-gray-500">Estimated Commission</p>
          </div>
          <div className="mt-2">
            <span className="font-[family-name:var(--font-montserrat)] text-2xl font-black tracking-tight text-ink-900 dark:text-gray-100">
              PKR {estimatedCommission.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between mt-3 text-[11px] text-ink-900/40 dark:text-gray-500 font-medium">
            <span>{won} Won × PKR {COMMISSION_PER_WON.toLocaleString()}</span>
            {won < MONTHLY_QUOTA && (
              <span className="text-brand-600 dark:text-brand-400 font-bold">+PKR {COMMISSION_PER_WON.toLocaleString()} next close</span>
            )}
          </div>
        </div>

        {/* Performance Streak / Motivator */}
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111827] hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={14} className="text-red-500 animate-pulse" />
            <p className="font-[family-name:var(--font-montserrat)] text-[10px] font-bold uppercase tracking-widest text-ink-900/40 dark:text-gray-500">Streak & Status</p>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-3xl">{streak.emoji}</span>
            <div>
              <span className="block text-sm font-bold text-ink-900 dark:text-gray-200">{streak.label}</span>
              <span className="text-[11px] font-medium text-ink-900/40 dark:text-gray-500">
                {won} deals closed this month
              </span>
            </div>
          </div>
          {won > 0 && (
            <div className="flex gap-1 mt-3.5">
              {Array.from({ length: Math.min(won, 10) }).map((_, i) => (
                <span key={i} className="h-1.5 w-1.5 rounded-full bg-brand-500 dark:bg-brand-400 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Split Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Follow-ups */}
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111827]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-[family-name:var(--font-montserrat)] text-xs font-bold uppercase tracking-wider text-ink-900 dark:text-gray-100">Upcoming Follow-ups</h2>
            <Link href="/employee/crm" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5">
              View pipeline <ChevronRight size={12} />
            </Link>
          </div>
          {data.followUps.length === 0 ? (
            <p className="text-sm text-ink-900/40 dark:text-gray-500 py-6 text-center">No pending follow-ups. You&apos;re all caught up!</p>
          ) : (
            <ul className="space-y-3">
              {data.followUps.map((f) => (
                <li
                  key={f.id}
                  onClick={() => f.lead_id && setSelectedLeadId(f.lead_id)}
                  className="flex items-center gap-3 text-sm border-b border-black/[0.04] pb-2.5 last:border-0 dark:border-white/[0.04] cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] p-2 rounded-xl transition-colors"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 flex-shrink-0">
                    <Calendar size={15} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold text-ink-900 dark:text-gray-200">{f.name}</p>
                    <p className="truncate text-xs text-ink-900/50 dark:text-gray-400">{f.note || "No notes attached"}</p>
                  </div>
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/40 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    {new Date(f.due_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recently Assigned Leads */}
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111827]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-[family-name:var(--font-montserrat)] text-xs font-bold uppercase tracking-wider text-ink-900 dark:text-gray-100">Recently Assigned Leads</h2>
            <Link href="/employee/restaurants" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5">
              Data table <ChevronRight size={12} />
            </Link>
          </div>
          {data.recentLeads.length === 0 ? (
            <p className="text-sm text-ink-900/40 dark:text-gray-500 py-6 text-center">No new leads assigned yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.recentLeads.map((lead) => (
                <li
                  key={lead.lead_id}
                  onClick={() => setSelectedLeadId(lead.lead_id)}
                  className="flex items-center justify-between text-sm py-2.5 px-2 border-b border-black/[0.04] last:border-0 dark:border-white/[0.04] cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] rounded-xl transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <span className="block truncate font-semibold text-ink-900 dark:text-gray-200">{lead.name}</span>
                    <span className="block truncate text-xs text-ink-900/40 dark:text-gray-500">{lead.address || "No address"}</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full border ${
                      lead.stage === "new"
                        ? "bg-blue-50 text-blue-700 border-blue-200/50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40"
                        : lead.stage === "contacted"
                        ? "bg-purple-50 text-purple-700 border-purple-200/50 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/40"
                        : "bg-gray-50 text-gray-600 border-gray-200/50 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700/40"
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
