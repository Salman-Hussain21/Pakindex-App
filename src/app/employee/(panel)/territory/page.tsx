"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Route, MapPin, X } from "lucide-react";

// Map must be dynamically imported with SSR disabled because Leaflet uses the window object
const EmployeeLiveMap = dynamic(() => import("@/components/employee/EmployeeLiveMap"), { ssr: false });

export default function EmployeeTerritoryPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Routing Mode State
  const [routeMode, setRouteMode] = useState(false);
  const [routeList, setRouteList] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/employee/territory")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setBusinesses(data.businesses || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const toggleRouteItem = (id: string) => {
    setRouteList((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-900 dark:text-white">My Territory</h1>
          <p className="text-sm text-ink-900/60 dark:text-gray-400">
            {businesses.length} prospects found in your assigned zones.
          </p>
        </div>
        
        <button 
          onClick={() => {
            setRouteMode(!routeMode);
            if (routeMode) setRouteList([]); // clear on exit
          }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
            routeMode ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-400" : "bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-400"
          }`}
        >
          {routeMode ? <><X size={16} /> Exit Route Builder</> : <><Route size={16} /> Build Daily Route</>}
        </button>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* The Map */}
        <div className="flex-1 overflow-hidden rounded-2xl border border-black/5 shadow-sm dark:border-white/10 relative z-0">
          {error ? (
            <div className="flex h-full items-center justify-center bg-gray-50 dark:bg-gray-900 text-red-500">
              {error}
            </div>
          ) : loading ? (
            <div className="flex h-full items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-400">
              Loading map data...
            </div>
          ) : (
            <EmployeeLiveMap 
              businesses={businesses} 
              routeMode={routeMode} 
              routeList={routeList} 
              onToggleRoute={toggleRouteItem} 
            />
          )}
        </div>

        {/* Route Sidebar Panel */}
        {routeMode && (
          <div className="w-80 flex-shrink-0 flex flex-col rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900 overflow-hidden">
            <div className="border-b border-black/5 p-4 dark:border-white/10 bg-gray-50 dark:bg-gray-800">
              <h2 className="font-semibold text-ink-900 dark:text-white">Today's Itinerary</h2>
              <p className="text-xs text-ink-900/60 dark:text-gray-400 mt-1">Select markers on the map to add them to your route.</p>
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
                <button className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
                  Save Route
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
