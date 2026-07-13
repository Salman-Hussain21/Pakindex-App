"use client";

import { useEffect, useState, useCallback } from "react";
import { getBusinesses, bulkBusinessAction } from "@/lib/admin-api";
import type { BusinessDetail } from "@/components/admin/BusinessDetailModal";
import StatusBadge from "@/components/admin/StatusBadge";
import BulkActionBar from "@/components/admin/BulkActionBar";
import PreviewMapButtons from "@/components/admin/PreviewMapButtons";

function isRecent(d?: string) { return d ? Date.now() - new Date(d).getTime() < 48 * 3600000 : false; }

export default function HorecaDatabasePage() {
  const [rows, setRows] = useState<BusinessDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = useCallback(async (search: string) => {
    setLoading(true);
    try { const d: any = await getBusinesses({ status: "approved", q: search, pageSize: 100 }); setRows(d.businesses); setTotal(d.pagination.total); setSelected(new Set()); }
    catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { const t = setTimeout(() => load(q), 300); return () => clearTimeout(t); }, [q, load]);

  const toggle = (id: string) => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(p => p.size === rows.length ? new Set() : new Set(rows.map(r => r.id)));

  async function bulkRemove() {
    if (!confirm(`Move ${selected.size} record(s) to Trash?`)) return;
    setBulkBusy(true);
    try { await bulkBusinessAction({ action: "reject", ids: Array.from(selected), reason: "Bulk removed" }); setRows(p => p.filter(r => !selected.has(r.id))); setSelected(new Set()); }
    catch (e: any) { setError(e.message); } finally { setBulkBusy(false); }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900 dark:text-gray-100">HORECA Database</h1>
        <a href={`/api/admin/businesses/export?status=approved&q=${encodeURIComponent(q)}`}
          className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800">
          Export CSV
        </a>
      </div>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name, address or phone…"
        className="mb-4 w-full max-w-md rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100" />
      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</p>}

      <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())}>
        <button disabled={bulkBusy} onClick={bulkRemove} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">Delete Selected</button>
      </BulkActionBar>

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-ink-900/40 dark:bg-gray-950 dark:text-gray-500">
            <tr>
              <th className="w-10 px-4 py-3"><input type="checkbox" checked={rows.length > 0 && selected.size === rows.length} onChange={toggleAll} className="rounded border-black/20" /></th>
              <th className="px-4 py-3">Name</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Rating</th><th className="px-4 py-3">Reviews</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Area</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/10">
            {loading ? <tr><td colSpan={9} className="px-4 py-8 text-center text-ink-900/40 dark:text-gray-500">Loading…</td></tr>
            : rows.length === 0 ? <tr><td colSpan={9} className="px-4 py-8 text-center text-ink-900/40 dark:text-gray-500">No approved businesses yet.</td></tr>
            : rows.map(b => (
              <tr key={b.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${selected.has(b.id) ? "bg-brand-50/40 dark:bg-brand-900/10" : ""}`}>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.has(b.id)} onChange={() => toggle(b.id)} className="rounded border-black/20" /></td>
                <td className="px-4 py-3 font-medium text-ink-900 dark:text-gray-100">{b.name}</td>
                <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">{b.category_name || b.business_type || "—"}</td>
                <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">{b.rating ? `★ ${b.rating}` : "—"}</td>
                <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">{b.review_count ?? 0}</td>
                <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">{b.phone || "—"}</td>
                <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">{(b as any).area_name || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={b.status} />
                    {isRecent(b.created_at) && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">New</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end flex-wrap gap-1.5">
                    <PreviewMapButtons business={b} />
                    {selected.has(b.id) && (
                      <button disabled={bulkBusy} onClick={bulkRemove} className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink-900/40 dark:text-gray-500">Showing {rows.length} of {total} approved businesses.</p>
    </div>
  );
}
