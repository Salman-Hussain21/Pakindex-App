"use client";

import { useEffect, useState, useCallback } from "react";
import { getBusinesses, patchBusiness, deleteBusinessForever } from "@/lib/admin-api";
import BusinessDetailModal, { BusinessDetail } from "@/components/admin/BusinessDetailModal";

export default function RejectedRecordsPage() {
  const [rows, setRows] = useState<BusinessDetail[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<BusinessDetail | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const data: any = await getBusinesses({ status: "rejected", q: search, pageSize: 100 });
      setRows(data.businesses);
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

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-ink-900">Rejected Records / Trash</h1>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search rejected records…"
        className="mb-4 w-full max-w-md rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
      />

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-ink-900/40">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Rejection Reason</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-ink-900/40">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-ink-900/40">Nothing rejected.</td></tr>
            ) : (
              rows.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td
                    className="cursor-pointer px-4 py-3 font-medium text-ink-900"
                    onClick={() => setPreview(b)}
                  >
                    {b.name}
                  </td>
                  <td className="px-4 py-3 text-ink-900/60">{b.category_name || b.business_type || "—"}</td>
                  <td className="px-4 py-3 text-ink-900/60">{b.rejection_reason || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        disabled={busyId === b.id}
                        onClick={() => restore(b.id)}
                        className="rounded-lg border border-black/10 px-2.5 py-1 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
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
