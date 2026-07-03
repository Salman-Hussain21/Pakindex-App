"use client";

import { useEffect, useState } from "react";

interface Restaurant {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  approval_status: string;
  area_name: string;
  city_name: string | null;
}

export default function RestaurantDatabasePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const delayDebounce = setTimeout(() => {
      // Hitting the exact API endpoint directory path specified
      fetch(`/api/company/database?search=${encodeURIComponent(search)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      })
        .then(async (res) => {
          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Server returned HTML formatting. Ensure your root middleware allows background /api traffic without cookie drops.");
          }
          if (!res.ok) throw new Error(`HTTP System Failure Code: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (isMounted) {
            if (data.success || data.restaurants) {
              setRestaurants(data.restaurants || []);
              setError(null);
            } else {
              throw new Error(data.error || "Failed to process database records payload.");
            }
            setLoading(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setError(err.message);
            setLoading(false);
          }
        });
    }, 300); // 300ms network layout typing debouncer

    return () => {
      isMounted = false;
      clearTimeout(delayDebounce);
    };
  }, [search]);

  // Master Bulk Toggle Switch
  const toggleSelectAll = () => {
    if (selectedIds.length === restaurants.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(restaurants.map((item) => item.id));
    }
  };

  // Row Tracker Mapper
  const toggleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((rowId) => rowId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4 font-sans select-none">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <span className="p-1.5 bg-brand-50 text-brand-700 rounded-lg text-xs">🟢</span>
          Restaurant Database Portfolio
        </h1>
        <p className="text-xs text-slate-400">
          Viewing dynamically populated restaurant nodes matching your workspace geographical areas.
        </p>
      </div>

      {/* Control Utility Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-black/5 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by restaurant name, territory segment, or phone line..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-black/10 outline-none focus:border-brand-500 text-slate-800 bg-gray-50/50 transition-all select-text"
          />
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          {selectedIds.length > 0 && (
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
              Selected Rows: {selectedIds.length}
            </div>
          )}
          <div className="text-[11px] font-medium text-slate-500 bg-slate-50 border border-black/5 px-2.5 py-1 rounded-md">
            Operational Pool: <span className="font-bold text-brand-700">{restaurants.length}</span>
          </div>
        </div>
      </div>

      {/* Data Render Swapper */}
      {error ? (
        <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-xs font-medium text-red-700 space-y-2 select-text">
          <p className="font-bold">⚠️ Data Connection Lifecycle Error Flagged:</p>
          <p className="font-mono bg-white/70 p-2 rounded border border-red-200/50 text-[11px]">{error}</p>
          <p className="text-[11px] text-red-600/80">
            Fix confirmation: Files are operating out of your exact directory setup. If this error message stays visible, your authentication middleware is dropping user cookies when hitting root paths.
          </p>
        </div>
      ) : loading ? (
        <div className="p-16 text-xs text-slate-400 animate-pulse text-center tracking-widest font-mono">
          PARSING ALLOCATED TERRITORY RELATIONS...
        </div>
      ) : restaurants.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/5 p-12 text-center shadow-xs">
          <p className="text-xs text-slate-400 italic">No approved restaurant assets linked with your active coverage criteria assignments.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs select-text">
              <thead>
                <tr className="bg-slate-50 border-b border-black/5 text-slate-400 font-bold uppercase tracking-wider text-[10px] select-none">
                  <th className="w-12 px-5 py-3">
                    <input 
                      type="checkbox" 
                      className="rounded accent-brand-600 h-3.5 w-3.5 cursor-pointer block"
                      checked={restaurants.length > 0 && selectedIds.length === restaurants.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-5 py-3">Restaurant Information</th>
                  <th className="px-5 py-3">Assigned Area Mapping</th>
                  <th className="px-5 py-3">Primary Contact Line</th>
                  <th className="px-5 py-3">Verification Badge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-slate-700">
                {restaurants.map((item) => {
                  const isChecked = selectedIds.includes(item.id);
                  return (
                    <tr key={item.id} className={`transition-all duration-150 ${isChecked ? "bg-brand-50/20" : "hover:bg-slate-50/40"}`}>
                      <td className="px-5 py-3.5 select-none">
                        <input 
                          type="checkbox" 
                          className="rounded accent-brand-600 h-3.5 w-3.5 cursor-pointer block"
                          checked={isChecked}
                          onChange={() => toggleSelectRow(item.id)}
                        />
                      </td>
                      <td className="px-5 py-3.5 max-w-xs">
                        <p className="font-bold text-slate-800 text-[13px] tracking-tight">{item.name}</p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
                          📍 {item.address || "Street label address absent."}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center rounded-md bg-brand-50 border border-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                          {item.area_name} {item.city_name ? `(${item.city_name})` : ""}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-600 text-[11px]">
                        {item.phone ? `📞 ${item.phone}` : <span className="text-slate-400 italic font-sans">None</span>}
                      </td>
                      <td className="px-5 py-3.5 select-none">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 border border-emerald-200">
                          {item.approval_status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}