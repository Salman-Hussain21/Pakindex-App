"use client";

import { useEffect, useState, useCallback } from "react";
import { getBusinesses, bulkBusinessAction } from "@/lib/admin-api";
import BusinessDetailModal, { BusinessDetail } from "@/components/admin/BusinessDetailModal";
import StatusBadge from "@/components/admin/StatusBadge";
import BulkActionBar from "@/components/admin/BulkActionBar";

function isRecent(createdAt?: string): boolean {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < 48 * 60 * 60 * 1000;
}

export default function HorecaDatabasePage() {
  const [rows, setRows] = useState<BusinessDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<BusinessDetail | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const data: any = await getBusinesses({ status: "approved", q: search, pageSize: 100 });
      setRows(data.businesses);
      setTotal(data.pagination.total);
      setSelected(new Set());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(q), 300); // debounce search
    return () => clearTimeout(t);
  }, [q, load]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.id))));
  }

  async function bulkRemove() {
    if (!confirm(`Move ${selected.size} record(s) to Rejected / Trash?`)) return;
    setBulkBusy(true);
    try {
      await bulkBusinessAction({ action: "reject", ids: Array.from(selected), reason: "Bulk removed from database" });
      setRows((prev) => prev.filter((r) => !selected.has(r.id)));
      setSelected(new Set());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900 dark:text-gray-100">HORECA Database</h1>
        <a
          href={`/api/admin/businesses/export?status=approved&q=${encodeURIComponent(q)}`}
          className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-white/10 dark:hover:bg-gray-800"
        >
          Export CSV
        </a>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name, address or phone…"
        className="mb-4 w-full max-w-md rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
      />

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</p>}

      <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())}>
        <button
          disabled={bulkBusy}
          onClick={bulkRemove}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          Delete Selected
        </button>
      </BulkActionBar>

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-ink-900/40 dark:bg-gray-950 dark:text-gray-500">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selected.size === rows.length}
                  onChange={toggleAll}
                  className="rounded border-black/20"
                />
              </th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Reviews</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/10">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-ink-900/40 dark:text-gray-500">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-ink-900/40 dark:text-gray-500">No approved businesses yet.</td></tr>
            ) : (
              rows.map((b) => (
                <tr
                  key={b.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${selected.has(b.id) ? "bg-brand-50/40 dark:bg-brand-900/10" : ""}`}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(b.id)}
                      onChange={() => toggle(b.id)}
                      className="rounded border-black/20"
                    />
                  </td>
                  <td className="cursor-pointer px-4 py-3 font-medium text-ink-900 dark:text-gray-100" onClick={() => setPreview(b)}>{b.name}</td>
                  <td className="cursor-pointer px-4 py-3 text-ink-900/60 dark:text-gray-400" onClick={() => setPreview(b)}>{b.category_name || b.business_type || "—"}</td>
                  <td className="cursor-pointer px-4 py-3 text-ink-900/60 dark:text-gray-400" onClick={() => setPreview(b)}>{b.rating ? `★ ${b.rating}` : "—"}</td>
                  <td className="cursor-pointer px-4 py-3 text-ink-900/60 dark:text-gray-400" onClick={() => setPreview(b)}>{b.review_count ?? 0}</td>
                  <td className="cursor-pointer px-4 py-3 text-ink-900/60 dark:text-gray-400" onClick={() => setPreview(b)}>{b.phone || "—"}</td>
                  <td className="cursor-pointer px-4 py-3 text-ink-900/60 dark:text-gray-400" onClick={() => setPreview(b)}>{(b as any).area_name || "—"}</td>
                  <td className="cursor-pointer px-4 py-3" onClick={() => setPreview(b)}>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={b.status} />
                      {isRecent(b.created_at) && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          New
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-ink-900/40 dark:text-gray-500">Showing {rows.length} of {total} approved businesses.</p>

      {preview && <BusinessDetailModal business={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
