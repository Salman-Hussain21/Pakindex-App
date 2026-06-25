"use client";

import { useEffect, useState, useCallback } from "react";
import { getBusinesses } from "@/lib/admin-api";
import BusinessDetailModal, { BusinessDetail } from "@/components/admin/BusinessDetailModal";
import StatusBadge from "@/components/admin/StatusBadge";

export default function HorecaDatabasePage() {
  const [rows, setRows] = useState<BusinessDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<BusinessDetail | null>(null);

  const load = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const data: any = await getBusinesses({ status: "approved", q: search, pageSize: 100 });
      setRows(data.businesses);
      setTotal(data.pagination.total);
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

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900">HORECA Database</h1>
        <a
          href={`/api/admin/businesses/export?status=approved&q=${encodeURIComponent(q)}`}
          className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
        >
          Export CSV
        </a>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name, address or phone…"
        className="mb-4 w-full max-w-md rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
      />

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-ink-900/40">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Reviews</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-ink-900/40">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-ink-900/40">No approved businesses yet.</td></tr>
            ) : (
              rows.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => setPreview(b)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-ink-900">{b.name}</td>
                  <td className="px-4 py-3 text-ink-900/60">{b.category_name || b.business_type || "—"}</td>
                  <td className="px-4 py-3 text-ink-900/60">{b.rating ? `★ ${b.rating}` : "—"}</td>
                  <td className="px-4 py-3 text-ink-900/60">{b.review_count ?? 0}</td>
                  <td className="px-4 py-3 text-ink-900/60">{b.phone || "—"}</td>
                  <td className="px-4 py-3 text-ink-900/60">{(b as any).area_name || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-ink-900/40">Showing {rows.length} of {total} approved businesses.</p>

      {preview && <BusinessDetailModal business={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
