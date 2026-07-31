"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { Route, MapPin, X, CheckCircle2 } from "lucide-react";
import RestaurantLeadModal from "@/components/employee/RestaurantLeadModal";
import type { MapBusiness } from "@/components/employee/EmployeeLiveMap";

interface EmployeeLiveMapProps {
  businesses: MapBusiness[];
  routeMode: boolean;
  routeList: string[];
  onToggleRoute: (id: string) => void;
  onSelectBusiness: (leadId: string) => void;
}

const EmployeeLiveMap = dynamic(() => import("@/components/employee/EmployeeLiveMap"), {
  ssr: false,
}) as ComponentType<EmployeeLiveMapProps>;

interface Territory {
  id: number;
  name: string;
  city_name: string | null;
}

export default function EmployeeTerritoryPage() {
  const [businesses, setBusinesses] = useState<MapBusiness[]>([]);
  const [territory, setTerritory] = useState<Territory | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [routeMode, setRouteMode] = useState(false);
  const [routeList, setRouteList] = useState<string[]>([]);
  const [visitedMode, setVisitedMode] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // ... rest of the file (loadData, toggleRouteItem, JSX) stays exactly the same

  const loadData = useCallback(() => {
    setLoading(true);
    fetch("/api/employee/territory")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setBusinesses(data.businesses || []);
        setTerritory(data.territory || null);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleRouteItem = (id: string) => {
    setRouteList((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const optimizeRoute = () => {
    if (routeList.length <= 1) return;
    const items = routeList.map((id) => businesses.find((b) => b.id === id)).filter(Boolean) as MapBusiness[];
    const unvisited = [...items];
    const optimized: string[] = [];

    let current = unvisited.shift()!;
    optimized.push(current.id);

    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const dist = Math.hypot(
          Number(unvisited[i].latitude) - Number(current.latitude),
          Number(unvisited[i].longitude) - Number(current.longitude)
        );
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      }

      current = unvisited.splice(nearestIdx, 1)[0];
      optimized.push(current.id);
    }

    setRouteList(optimized);
  };

  const visitedBusinesses = businesses.filter((b) => b.is_visited);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-900 dark:text-white">My Territory</h1>
          <p className="text-sm text-ink-900/60 dark:text-gray-400">
            {businesses.length} restaurant{businesses.length === 1 ? "" : "s"} assigned to you
            {territory && (
              <span className="ml-2 inline-flex items-center gap-1 text-brand-700 dark:text-brand-400 font-medium">
                <MapPin size={12} /> {territory.name}{territory.city_name ? ` · ${territory.city_name}` : ""}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setVisitedMode(!visitedMode); if (!visitedMode) setRouteMode(false); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              visitedMode ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400" : "bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            <CheckCircle2 size={16} /> Visited ({visitedBusinesses.length})
          </button>

          <button
            onClick={() => { setRouteMode(!routeMode); if (routeMode) setRouteList([]); if (!routeMode) setVisitedMode(false); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              routeMode ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-400" : "bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-400"
            }`}
          >
            {routeMode ? <><X size={16} /> Exit Route Builder</> : <><Route size={16} /> Build Daily Route</>}
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        <div className="flex-1 overflow-hidden rounded-2xl border border-black/5 shadow-sm dark:border-white/10 relative z-0">
          {error ? (
            <div className="flex h-full items-center justify-center bg-gray-50 dark:bg-gray-900 text-red-500">{error}</div>
          ) : loading ? (
            <div className="flex h-full items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-400">Loading map data...</div>
          ) : (
            <EmployeeLiveMap
              businesses={businesses}
              routeMode={routeMode}
              routeList={routeList}
              onToggleRoute={toggleRouteItem}
              onSelectBusiness={(leadId: string) => setSelectedLeadId(leadId)}
            />
          )}
        </div>

        {routeMode && (
          <div className="w-80 flex-shrink-0 flex flex-col rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900 overflow-hidden">
            <div className="border-b border-black/5 p-4 dark:border-white/10 bg-gray-50 dark:bg-gray-800 flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-ink-900 dark:text-white">Today's Itinerary</h2>
                <p className="text-xs text-ink-900/60 dark:text-gray-400 mt-0.5">Select markers on map to build route.</p>
              </div>
              {routeList.length > 1 && (
                <button
                  onClick={optimizeRoute}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 px-2 py-1 rounded-lg hover:bg-amber-100 transition-colors"
                  title="Shortest driving path sequence"
                >
                  ⚡ Optimize
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {routeList.length === 0 ? (
                <div className="text-center text-sm text-gray-400 mt-10">No stops selected yet.</div>
              ) : (
                routeList.map((id, index) => {
                  const b = businesses.find((b) => b.id === id);
                  return (
                    <div key={id} className="flex gap-3">
                      <div className="flex flex-col items-center mt-1">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">{index + 1}</span>
                        {index < routeList.length - 1 && <div className="h-full w-px bg-gray-200 dark:bg-gray-700 my-1" />}
                      </div>
                      <div className="pb-3">
                        <h3 className="text-sm font-semibold text-ink-900 dark:text-white">{b?.name}</h3>
                        <p className="text-xs text-gray-500 truncate">{b?.address}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {routeList.length > 0 && (
              <div className="p-4 border-t border-black/5 dark:border-white/10">
                <button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      for (const id of routeList) {
                        const b = businesses.find((item) => item.id === id);
                        if (b?.lead_id) {
                          await fetch(`/api/employee/leads/${b.lead_id}/notes`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ note: `Added to Daily Field Route (${routeList.indexOf(id) + 1} of ${routeList.length})` }),
                          });
                        }
                      }
                      alert(`Successfully saved itinerary with ${routeList.length} stops!`);
                      setRouteMode(false);
                      setRouteList([]);
                      loadData();
                    } catch (err: any) {
                      alert(err.message || "Failed to save route.");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors cursor-pointer"
                >
                  Save Route ({routeList.length} stops)
                </button>
              </div>
            )}
          </div>
        )}

        {visitedMode && (
          <div className="w-80 flex-shrink-0 flex flex-col rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900 overflow-hidden">
            <div className="border-b border-black/5 p-4 dark:border-white/10 bg-gray-50 dark:bg-gray-800">
              <h2 className="font-semibold text-ink-900 dark:text-white">Visited Restaurants</h2>
              <p className="text-xs text-ink-900/60 dark:text-gray-400 mt-1">Restaurants you've marked as visited.</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {visitedBusinesses.length === 0 ? (
                <div className="text-center text-sm text-gray-400 mt-10">No visits marked yet.</div>
              ) : (
                visitedBusinesses.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedLeadId(b.lead_id)}
                    className="w-full text-left flex items-start gap-2 rounded-lg border border-slate-100 dark:border-white/10 p-2.5 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-ink-900 dark:text-white">{b.name}</p>
                      <p className="text-[11px] text-gray-400">
                        Last visit: {b.last_visit_at ? new Date(b.last_visit_at).toLocaleDateString() : "—"}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {selectedLeadId && (
        <RestaurantLeadModal leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} onUpdated={loadData} />
      )}
    </div>
  );
}