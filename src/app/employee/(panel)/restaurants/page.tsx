"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Search, ArrowUpDown, Flame, Download } from "lucide-react";
import RestaurantLeadModal from "@/components/employee/RestaurantLeadModal";
import { calculateB2BLeadScore, type LeadScoreFactors } from "@/lib/lead-scoring";

interface RestaurantRow extends LeadScoreFactors {
  id: string; name: string; business_status: string; category_name: string | null;
  lead_id: string; stage: string; assigned_at: string; last_visit_at: string | null;
}

const STAGES = ["new", "contacted", "interested", "meeting", "proposal", "won", "lost"];
const STAGE_COLORS: Record<string, string> = {
  new: "bg-slate-100 text-slate-600", contacted: "bg-blue-50 text-blue-700",
  interested: "bg-purple-50 text-purple-700", meeting: "bg-amber-50 text-amber-700",
  proposal: "bg-indigo-50 text-indigo-700", won: "bg-emerald-50 text-emerald-700",
  lost: "bg-red-50 text-red-700",
};

function downloadCSV(rows: RestaurantRow[]) {
  const header = "Name,Category,Stage,B2B Score,Tier,Rating,Reviews,Phone,Last Visit,Assigned Date\n";
  const body = rows.map((r) => {
    const b2b = calculateB2BLeadScore(r);
    return [
      `"${r.name}"`, r.category_name || "—", r.stage, b2b.score, b2b.tier,
      r.rating || "—", r.review_count || 0, r.phone || "—",
      r.last_visit_at ? new Date(r.last_visit_at).toLocaleDateString() : "Not visited",
      new Date(r.assigned_at).toLocaleDateString(),
    ].join(",");
  }).join("\n");
  const blob = new Blob([header + body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `territory-data-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

export default function EmployeeRestaurantDataTablePage() {
  const [rows, setRows] = useState<RestaurantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "assigned_date" | "last_visit" | "score">("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    const apiSort = sortBy === "score" ? "name" : sortBy;
    const params = new URLSearchParams({ search, stage: stageFilter, sortBy: apiSort, sortDir });
    fetch(`/api/employee/restaurants?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setRows(data.restaurants || []);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [search, stageFilter, sortBy, sortDir]);

  useEffect(() => {
    const debounce = setTimeout(loadData, 300);
    return () => clearTimeout(debounce);
  }, [loadData]);

  // Client-side sort by B2B score
  const sortedRows = useMemo(() => {
    if (sortBy !== "score") return rows;
    return [...rows].sort((a, b) => {
      const scoreA = calculateB2BLeadScore(a).score;
      const scoreB = calculateB2BLeadScore(b).score;
      return sortDir === "desc" ? scoreB - scoreA : scoreA - scoreB;
    });
  }, [rows, sortBy, sortDir]);

  function toggleSort(column: "name" | "assigned_date" | "last_visit" | "score") {
    if (sortBy === column) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(column); setSortDir(column === "score" ? "desc" : "asc"); }
  }

  // Score distribution summary
  const scoreSummary = useMemo(() => {
    let high = 0, warm = 0, standard = 0;
    for (const r of rows) {
      const s = calculateB2BLeadScore(r).score;
      if (s >= 75) high++; else if (s >= 50) warm++; else standard++;
    }
    return { high, warm, standard };
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-900 dark:text-white">Restaurant Data Table</h1>
          <p className="text-sm text-ink-900/60 dark:text-gray-400">All restaurants currently assigned to you with B2B intelligence scoring.</p>
        </div>
        <button
          onClick={() => downloadCSV(sortedRows)}
          className="inline-flex items-center gap-2 text-xs font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-400 border border-brand-200 dark:border-brand-800 px-3 py-2 rounded-xl transition-colors"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Score Distribution Mini-Strip */}
      {rows.length > 0 && (
        <div className="flex items-center gap-4 bg-white dark:bg-gray-900 border border-black/5 dark:border-white/10 rounded-2xl px-4 py-2.5 shadow-sm text-xs">
          <span className="text-gray-500 dark:text-gray-400 font-medium">Score Distribution:</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> {scoreSummary.high} High Potential
          </span>
          <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> {scoreSummary.warm} Warm Prospect
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-gray-400 font-semibold">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400" /> {scoreSummary.standard} Standard
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-900 border border-black/5 dark:border-white/10 rounded-2xl px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search restaurant name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none text-ink-900 dark:text-white placeholder:text-gray-400"
          />
        </div>
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-800 px-3 py-1.5 outline-none focus:border-brand-500 capitalize"
        >
          <option value="">All Statuses</option>
          {STAGES.map((s) => (<option key={s} value={s} className="capitalize">{s}</option>))}
        </select>
      </div>

      {error ? (
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 text-sm text-red-700 dark:text-red-400">⚠️ {error}</div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm overflow-hidden">
          <div className="overflow-x-auto" style={{ overflowY: "auto", maxHeight: "560px" }}>
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-black/5 dark:border-white/10 sticky top-0 z-10">
                <tr className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="px-5 py-3.5 cursor-pointer select-none" onClick={() => toggleSort("name")}>
                    <span className="inline-flex items-center gap-1">Restaurant Name <ArrowUpDown size={11} /></span>
                  </th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5 cursor-pointer select-none" onClick={() => toggleSort("score")}>
                    <span className="inline-flex items-center gap-1"><Flame size={11} /> B2B Score <ArrowUpDown size={11} /></span>
                  </th>
                  <th className="px-5 py-3.5">Stage</th>
                  <th className="px-5 py-3.5 cursor-pointer select-none" onClick={() => toggleSort("last_visit")}>
                    <span className="inline-flex items-center gap-1">Last Visit <ArrowUpDown size={11} /></span>
                  </th>
                  <th className="px-5 py-3.5 cursor-pointer select-none" onClick={() => toggleSort("assigned_date")}>
                    <span className="inline-flex items-center gap-1">Assigned Date <ArrowUpDown size={11} /></span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/4 dark:divide-white/5">
                {loading ? (
                  <tr><td colSpan={6} className="p-12 text-center text-gray-400 animate-pulse">Loading…</td></tr>
                ) : sortedRows.length === 0 ? (
                  <tr><td colSpan={6} className="p-12 text-center text-gray-400 italic">No restaurants assigned to you yet.</td></tr>
                ) : (
                  sortedRows.map((r) => {
                    const b2b = calculateB2BLeadScore(r);
                    return (
                      <tr key={r.id} onClick={() => setSelectedLeadId(r.lead_id)} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors cursor-pointer">
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-ink-900 dark:text-white">{r.name}</span>
                          {r.rating && <span className="ml-2 text-[10px] text-amber-600 font-medium">★ {r.rating}</span>}
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">{r.category_name || "—"}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className={`font-black text-sm tabular-nums ${b2b.color}`}>{b2b.score}</span>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${b2b.badgeBg}`}>{b2b.tier}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider capitalize ${STAGE_COLORS[r.stage] || "bg-slate-100 text-slate-600"}`}>{r.stage}</span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">{r.last_visit_at ? new Date(r.last_visit_at).toLocaleDateString() : "Not visited"}</td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">{new Date(r.assigned_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedLeadId && (
        <RestaurantLeadModal leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} onUpdated={loadData} />
      )}
    </div>
  );
}