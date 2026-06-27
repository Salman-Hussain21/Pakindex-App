"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getMapBusinesses } from "@/lib/admin-api";
import type { MapBusiness } from "@/components/admin/LiveMap";

// Leaflet touches `window` at import time, so it must never run during SSR.
const LiveMap = dynamic(() => import("@/components/admin/LiveMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-ink-900/40 dark:text-gray-500">
      Loading map…
    </div>
  ),
});

const FILTERS = [
  { value: "approved,pending", label: "All Live" },
  { value: "approved", label: "Approved only" },
  { value: "pending", label: "Pending only" },
  { value: "approved,pending,rejected", label: "Everything" },
];

export default function HorecaMapPage() {
  const [businesses, setBusinesses] = useState<MapBusiness[]>([]);
  const [filter, setFilter] = useState(FILTERS[0].value);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getMapBusinesses(filter)
      .then((d: any) => setBusinesses(d.businesses))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900 dark:text-gray-100">HORECA Map</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-900/50 dark:text-gray-400">
            {loading ? "Loading…" : `${businesses.length} pinned`}
          </span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
          >
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</p>}

      <div className="mb-3 flex gap-4 text-xs text-ink-900/60 dark:text-gray-400">
        <Legend color="#03603d" label="Approved" />
        <Legend color="#f59e0b" label="Pending" />
        <Legend color="#dc2626" label="Rejected" />
      </div>

      <div className="flex-1 overflow-hidden rounded-2xl border border-black/5 dark:border-white/10" style={{ minHeight: 480 }}>
        <LiveMap businesses={businesses} />
      </div>

      <p className="mt-2 text-xs text-ink-900/40 dark:text-gray-500">
        Pulled live from the database every time this page loads — approve, reject, or scrape new
        businesses and refresh to see them move between colors.
      </p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
