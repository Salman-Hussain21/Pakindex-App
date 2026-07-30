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

  const approvedNum = Number(s.approved_records || 0);
  const pendingNum = Number(s.pending_approvals || 0);
  const rejectedNum = Number(s.rejected_records || 0);
  const totalNum = approvedNum + pendingNum + rejectedNum;

  const appPct = totalNum > 0 ? (approvedNum / totalNum) * 100 : 0;
  const penPct = totalNum > 0 ? (pendingNum / totalNum) * 100 : 0;
  const rejPct = totalNum > 0 ? (rejectedNum / totalNum) * 100 : 0;

  // Chart data calculations
  const jobs = [...(data.recentScrapes || [])].reverse();
  const maxVal = Math.max(...jobs.map((j) => Math.max(j.new_records || 0, j.duplicates || 0, 10)));
  const width = 500;
  const height = 150;
  const padding = 20;

  const points = jobs.map((job, idx) => {
    const x = padding + (idx * (width - 2 * padding)) / Math.max(1, jobs.length - 1);
    const yNew = height - padding - (((job.new_records || 0) / maxVal) * (height - 2 * padding));
    const yDup = height - padding - (((job.duplicates || 0) / maxVal) * (height - 2 * padding));
    // Extract location or keyword from query
    const label = job.query ? job.query.replace("restaurants ", "").replace(" Karachi", "") : `Batch ${idx + 1}`;
    return { x, yNew, yDup, label };
  });

  const newPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.yNew}`).join(" ");
  const dupPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.yDup}`).join(" ");

  const newAreaPath = points.length ? `${newPath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` : "";
  const dupAreaPath = points.length ? `${dupPath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` : "";

  return (
    <div className="space-y-6">
      {/* Premium Dashboard Metrics Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Card 1: HORECA Database Overview (Double Width) */}
        <div className="lg:col-span-2 rounded-2xl border border-black/[0.06] bg-gradient-to-br from-white to-gray-50/50 p-6 shadow-sm dark:border-white/[0.06] dark:bg-gradient-to-br dark:from-[#0c120f] dark:to-[#070b09] flex flex-col justify-between min-h-[170px] transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-[family-name:var(--font-montserrat)] text-[10px] font-bold uppercase tracking-widest text-ink-900/40 dark:text-gray-500">Core HORECA Database</p>
              <h3 className="mt-1 font-[family-name:var(--font-montserrat)] text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                {Number(s.total_businesses || 0).toLocaleString()}
              </h3>
              <p className="text-xs text-ink-900/50 dark:text-gray-400 mt-0.5">Total Karachi listings indexed & mapped</p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
              Live Database
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-black/[0.05] dark:border-white/[0.05] grid grid-cols-3 gap-2">
            <div>
              <span className="text-[10px] text-ink-900/40 dark:text-gray-500 block uppercase tracking-wider font-semibold">Approved</span>
              <span className="text-lg font-bold text-brand-600 dark:text-brand-400">{Number(s.approved_records || 0).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-ink-900/40 dark:text-gray-500 block uppercase tracking-wider font-semibold">Pending Review</span>
              <span className="text-lg font-bold text-amber-500 dark:text-amber-400">{Number(s.pending_approvals || 0).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-ink-900/40 dark:text-gray-500 block uppercase tracking-wider font-semibold">Rejected / Trash</span>
              <span className="text-lg font-bold text-red-500 dark:text-red-400">{Number(s.rejected_records || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Scraper Activity */}
        <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm dark:border-white/[0.06] dark:bg-[#0c120f] flex flex-col justify-between min-h-[170px] transition-all hover:shadow-md">
          <div>
            <p className="font-[family-name:var(--font-montserrat)] text-[10px] font-bold uppercase tracking-widest text-ink-900/40 dark:text-gray-500">Scraper Activity</p>
            <h3 className="mt-1 font-[family-name:var(--font-montserrat)] text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white">
              {Number(s.scraped_this_week || 0).toLocaleString()}
            </h3>
            <p className="text-xs text-ink-900/50 dark:text-gray-400 mt-0.5">Listings scraped this week</p>
          </div>
          <div className="mt-3 pt-3 border-t border-black/[0.05] dark:border-white/[0.05] flex items-center justify-between text-xs">
            <span className="text-ink-900/40 dark:text-gray-500">Scraped Today:</span>
            <span className="font-bold text-ink-900 dark:text-white">{Number(s.scraped_today || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Card 3: Partners & Workforce */}
        <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm dark:border-white/[0.06] dark:bg-[#0c120f] flex flex-col justify-between min-h-[170px] transition-all hover:shadow-md">
          <div>
            <p className="font-[family-name:var(--font-montserrat)] text-[10px] font-bold uppercase tracking-widest text-ink-900/40 dark:text-gray-500">Partner Roster</p>
            <h3 className="mt-1 font-[family-name:var(--font-montserrat)] text-2xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400">
              {Number(s.total_companies || 0).toLocaleString()}
            </h3>
            <p className="text-xs text-ink-900/50 dark:text-gray-400 mt-0.5">Active company subscriptions</p>
          </div>
          <div className="mt-3 pt-3 border-t border-black/[0.05] dark:border-white/[0.05] flex items-center justify-between text-xs">
            <span className="text-ink-900/40 dark:text-gray-500">Field Employees:</span>
            <span className="font-bold text-ink-900 dark:text-white">{Number(s.total_employees || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {Number(s.pending_approvals) > 0 && (
        <Link
          href="/admin/pending"
          className="block rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/30"
        >
          {s.pending_approvals} business{Number(s.pending_approvals) === 1 ? "" : "es"} waiting for your review →
        </Link>
      )}

      {/* Analytics Graphs Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Scrape Batch Yield Trend line/area chart */}
        <div className="lg:col-span-2 rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-[family-name:var(--font-montserrat)] text-sm font-bold text-ink-900 dark:text-gray-100">Scrape Yield & Batch Success</h2>
              <p className="text-[11px] text-ink-900/40 dark:text-gray-500">Compares new listings found against duplicate checks</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-brand-600 dark:text-brand-400">
                <span className="h-2 w-2 rounded-full bg-brand-500" />
                New Listings
              </span>
              <span className="flex items-center gap-1.5 font-medium text-amber-500 dark:text-amber-400">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Duplicates
              </span>
            </div>
          </div>

          <div className="relative w-full h-[160px]">
            {jobs.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-ink-900/40 dark:text-gray-500">
                No scraping activity recorded yet.
              </div>
            ) : (
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="dupGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                {[0.25, 0.5, 0.75, 1.0].map((pct, idx) => {
                  const y = padding + (pct * (height - 2 * padding));
                  return (
                    <line
                      key={idx}
                      x1={padding}
                      y1={y}
                      x2={width - padding}
                      y2={y}
                      stroke="rgba(255, 255, 255, 0.05)"
                      strokeWidth="0.5"
                      strokeDasharray="3 3"
                    />
                  );
                })}

                {/* Areas */}
                {newAreaPath && <path d={newAreaPath} fill="url(#newGrad)" />}
                {dupAreaPath && <path d={dupAreaPath} fill="url(#dupGrad)" />}

                {/* Lines */}
                {newPath && <path d={newPath} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />}
                {dupPath && <path d={dupPath} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1 1" />}

                {/* Markers & Labels */}
                {points.map((p, idx) => (
                  <g key={idx}>
                    <circle cx={p.x} cy={p.yNew} r="3" fill="#10b981" className="cursor-pointer" />
                    <circle cx={p.x} cy={p.yDup} r="2.5" fill="#f59e0b" className="cursor-pointer" />
                    {idx % 2 === 0 && (
                      <text
                        x={p.x}
                        y={height - 2}
                        textAnchor="middle"
                        fill="rgba(255, 255, 255, 0.3)"
                        fontSize="7"
                        className="font-[family-name:var(--font-mono)]"
                      >
                        {p.label}
                      </text>
                    )}
                  </g>
                ))}
              </svg>
            )}
          </div>
        </div>

        {/* HORECA composition status chart */}
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
          <h2 className="font-[family-name:var(--font-montserrat)] text-sm font-bold text-ink-900 dark:text-gray-100 mb-1">HORECA Status Composition</h2>
          <p className="text-[11px] text-ink-900/40 dark:text-gray-500 mb-5">Distribution of verified and pending records</p>

          <div className="space-y-5">
            {/* Stacked distribution bar */}
            <div className="h-3.5 w-full flex rounded-full overflow-hidden bg-gray-100 dark:bg-gray-850">
              <div style={{ width: `${appPct}%` }} className="bg-brand-500" title={`Approved: ${appPct.toFixed(1)}%`} />
              <div style={{ width: `${penPct}%` }} className="bg-amber-500" title={`Pending: ${penPct.toFixed(1)}%`} />
              <div style={{ width: `${rejPct}%` }} className="bg-red-500" title={`Rejected: ${rejPct.toFixed(1)}%`} />
            </div>

            {/* Legend with absolute counts and percentages */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-ink-900/70 dark:text-gray-400">
                  <span className="h-2.5 w-2.5 rounded bg-brand-500" />
                  Approved Core Database
                </span>
                <span className="font-semibold text-ink-900 dark:text-gray-200">
                  {approvedNum.toLocaleString()} ({appPct.toFixed(1)}%)
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-ink-900/70 dark:text-gray-400">
                  <span className="h-2.5 w-2.5 rounded bg-amber-500" />
                  Pending Scrape Inbox
                </span>
                <span className="font-semibold text-ink-900 dark:text-gray-200">
                  {pendingNum.toLocaleString()} ({penPct.toFixed(1)}%)
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-ink-900/70 dark:text-gray-400">
                  <span className="h-2.5 w-2.5 rounded bg-red-500" />
                  Rejected / Trash Partition
                </span>
                <span className="font-semibold text-ink-900 dark:text-gray-200">
                  {rejectedNum.toLocaleString()} ({rejPct.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
