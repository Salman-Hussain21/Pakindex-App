"use client";

import { useEffect, useState } from "react";
import { MapPin, TrendingUp, Users, Activity } from "lucide-react";
import dynamic from "next/dynamic";
import StatCard from "@/components/company/StatCard";
import type { MapBusiness } from "@/components/admin/LiveMap";

// Leaflet touches `window` at import time — never run during SSR
const LiveMap = dynamic(() => import("@/components/admin/LiveMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-ink-900/40 dark:text-gray-500">
      Loading map…
    </div>
  ),
});

interface RepPerformance {
  name: string;
  area: string;
  count: number;
  total: number;
}

interface AnalyticsData {
  total_reachable_market: number;
  active_reps: number;
  net_market_growth: number;
  market_penetration: string;
  reps: RepPerformance[];
}

export default function TerritoryAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [mapBusinesses, setMapBusinesses] = useState<MapBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState("30d");
  const [planRestricted, setPlanRestricted] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/company/analytics?range=${range}`).then(async (res) => {
        const json = await res.json();
        if (res.status === 403 && json?.planRestricted) {
          setPlanRestricted(true);
          return null;
        }
        if (!res.ok) throw new Error(json?.error || "Failed to load analytics");
        return json;
      }),
      fetch("/api/company/map").then((r) => r.json()),
    ])
      .then(([analytics, mapData]) => {
        if (analytics) setData(analytics);
        if (mapData?.success) setMapBusinesses(mapData.businesses || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [range]);

  if (error) {
    return <div className="p-6 text-sm font-medium text-red-600">{error}</div>;
  }

  if (planRestricted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 text-2xl">
          📈
        </div>
        <div>
          <h1 className="text-base font-bold text-ink-900 dark:text-gray-100">
            Territory Analytics requires a Premium plan
          </h1>
          <p className="mt-1.5 text-sm text-ink-900/50 dark:text-gray-400 max-w-md">
            Upgrade to Premium or Ultra Premium to access full territory analytics, market density maps, and sales rep performance tracking.
          </p>
        </div>
        <a
          href="/company/billing"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          View Billing &amp; Upgrade →
        </a>
      </div>
    );
  }

  if (loading || !data) {
    return <div className="p-6 text-sm text-ink-900/50 dark:text-gray-400 animate-pulse">Loading territory analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900 dark:text-gray-100">Territory Analytics</h1>
          <p className="mt-0.5 text-sm text-ink-900/50 dark:text-gray-400">
            Market coverage, performance metrics, and density reports for your assigned zones.
          </p>
        </div>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="1y">This Year</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Reachable Market" value={data.total_reachable_market.toString()} hint="Restaurants in your zone" icon={MapPin} />
        <StatCard label="Market Penetration" value={data.market_penetration} hint="Already your customers" tone="brand" icon={TrendingUp} />
        <StatCard label="Active Reps" value={data.active_reps.toString()} hint="Field agents deployed" icon={Users} />
        <StatCard label="Net Market Growth" value={`+${data.net_market_growth}`} hint="New this month" tone="warning" icon={Activity} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="col-span-1 lg:col-span-2 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
          <div className="border-b border-black/5 px-5 py-4 dark:border-white/10 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-900 dark:text-gray-100">Market Density Map</h2>
            <span className="text-xs text-ink-900/50 dark:text-gray-400">{mapBusinesses.length} locations plotted</span>
          </div>
          <div className="h-[400px] w-full overflow-hidden">
            <LiveMap businesses={mapBusinesses} />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
          <div className="border-b border-black/5 px-5 py-4 dark:border-white/10">
            <h2 className="text-sm font-semibold text-ink-900 dark:text-gray-100">Sales Rep Performance</h2>
          </div>
          <div className="p-5">
            {data.reps.length === 0 ? (
              <p className="text-sm text-ink-900/50 dark:text-gray-400">No active sales reps found.</p>
            ) : (
              <ul className="space-y-4">
                {data.reps.map((rep, idx) => (
                  <li key={idx}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-ink-900 dark:text-gray-200">{rep.name}</span>
                      <span className="font-semibold text-brand-600 dark:text-brand-400">{rep.count} Leads</span>
                    </div>
                    <div className="mb-1 flex items-center justify-between text-xs text-ink-900/50 dark:text-gray-400">
                      <span>{rep.area}</span>
                      <span>{rep.total} Total Assigned</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${Math.min(100, (rep.count / rep.total) * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
