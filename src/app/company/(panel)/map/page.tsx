"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
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

interface Area {
  id: number;
  name: string;
  city_name: string;
}

export default function CompanyHorecaMapPage() {
  const [businesses, setBusinesses] = useState<MapBusiness[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [areaFilter, setAreaFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const delayDebounce = setTimeout(() => {
      const params = new URLSearchParams();
      if (areaFilter) params.set("area", areaFilter);
      if (search) params.set("search", search);

      fetch(`/api/company/map?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
      })
        .then(async (res) => {
          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Server returned a non-JSON response.");
          }
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (!isMounted) return;
          if (data.success) {
            setBusinesses(data.businesses || []);
            setAreas(data.areas || []);
            setError(null);
          } else {
            throw new Error(data.error || "Failed to load map data.");
          }
        })
        .catch((err) => {
          if (isMounted) setError(err.message);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(delayDebounce);
    };
  }, [areaFilter, search]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-ink-900 dark:text-gray-100">HORECA Map</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-900/50 dark:text-gray-400">
            {loading ? "Loading…" : `${businesses.length} pinned`}
          </span>
          <input
            type="text"
            placeholder="Search name, address, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
          />
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="">All assigned areas</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} · {a.city_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="mb-3 flex gap-4 text-xs text-ink-900/60 dark:text-gray-400">
        <Legend color="#03603d" label="Approved" />
        {areaFilter && (
          <button
            onClick={() => setAreaFilter("")}
            className="ml-auto text-brand-700 underline dark:text-brand-400"
          >
            Clear area filter
          </button>
        )}
      </div>

      <div
        className="flex-1 overflow-hidden rounded-2xl border border-black/5 dark:border-white/10"
        style={{ minHeight: 480 }}
      >
        <LiveMap businesses={businesses} />
      </div>

      <p className="mt-2 text-xs text-ink-900/40 dark:text-gray-500">
        Showing only approved businesses within your company's assigned areas.
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