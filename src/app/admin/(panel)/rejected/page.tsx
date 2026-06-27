"use client";

import { useEffect, useState, useCallback } from "react";
import { getBusinesses, patchBusiness, deleteBusinessForever, bulkBusinessAction } from "@/lib/admin-api";
import BusinessDetailModal, { BusinessDetail } from "@/components/admin/BusinessDetailModal";
import BulkActionBar from "@/components/admin/BulkActionBar";

export default function RejectedRecordsPage() {
  const [rows, setRows] = useState<BusinessDetail[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<BusinessDetail | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const data: any = await getBusinesses({ status: "rejected", q: search, pageSize: 100 });
      setRows(data.businesses);
      setSelected(new Set());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(q), 300);
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

  async function restore(id: string) {
    setBusyId(id);
    try {
      await patchBusiness(id, { action: "restore" });
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function permanentDelete(id: string) {
    if (!confirm("Permanently delete this record? This cannot be undone.")) return;
    setBusyId(id);
    try {
      await deleteBusinessForever(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function bulkRestore() {
    setBulkBusy(true);
    try {
      await bulkBusinessAction({ action: "restore", ids: Array.from(selected) });
      setRows((prev) => prev.filter((r) => !selected.has(r.id)));
      setSelected(new Set());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkDeleteForever() {
    if (!confirm(`Permanently delete ${selected.size} record(s)? This cannot be undone.`)) return;
    setBulkBusy(true);
    try {
      await bulkBusinessAction({ action: "delete", ids: Array.from(selected) });
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
      <h1 className="mb-4 text-xl font-semibold text-ink-900 dark:text-gray-100">Rejected Records / Trash</h1>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search rejected records…"
        className="mb-4 w-full max-w-md rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
      />

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</p>}

      <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())}>
        <button
          disabled={bulkBusy}
          onClick={bulkRestore}
          className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:hover:bg-gray-800"
        >
          Restore Selected
        </button>
        <button
          disabled={bulkBusy}
          onClick={bulkDeleteForever}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          Delete Forever
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
              <th className="px-4 py-3">Rejection Reason</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/10">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-ink-900/40 dark:text-gray-500">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-ink-900/40 dark:text-gray-500">Nothing rejected.</td></tr>
            ) : (
              rows.map((b) => (
                <tr key={b.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${selected.has(b.id) ? "bg-brand-50/40 dark:bg-brand-900/10" : ""}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(b.id)}
                      onChange={() => toggle(b.id)}
                      className="rounded border-black/20"
                    />
                  </td>
                  <td
                    className="cursor-pointer px-4 py-3 font-medium text-ink-900 dark:text-gray-100"
                    onClick={() => setPreview(b)}
                  >
                    {b.name}
                  </td>
                  <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">{b.category_name || b.business_type || "—"}</td>
                  <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">{b.rejection_reason || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        disabled={busyId === b.id}
                        onClick={() => restore(b.id)}
                        className="rounded-lg border border-black/10 px-2.5 py-1 text-xs font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:hover:bg-gray-800"
                      >
                        Restore
                      </button>
                      <button
                        disabled={busyId === b.id}
                        onClick={() => permanentDelete(b.id)}
                        className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Delete Forever
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {preview && <BusinessDetailModal business={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
