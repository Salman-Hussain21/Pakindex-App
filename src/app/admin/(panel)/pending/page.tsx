"use client";

import { useEffect, useState, useCallback } from "react";
import { getBusinesses, patchBusiness } from "@/lib/admin-api";
import BusinessDetailModal, { BusinessDetail } from "@/components/admin/BusinessDetailModal";

export default function PendingApprovalPage() {
  const [rows, setRows] = useState<BusinessDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<BusinessDetail | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data: any = await getBusinesses({ status: "pending", pageSize: 100 });
      setRows(data.businesses);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(id: string) {
    setBusyId(id);
    try {
      await patchBusiness(id, { action: "approve" });
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string, reason: string) {
    setBusyId(id);
    try {
      await patchBusiness(id, { action: "reject", reason });
      setRows((prev) => prev.filter((r) => r.id !== id));
      setRejectFor(null);
      setRejectReason("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900">Pending Approval</h1>
        <span className="text-sm text-ink-900/50">{rows.length} waiting</span>
      </div>

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-ink-900/40">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-ink-900/40">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-ink-900/40">Nothing pending. 🎉</td></tr>
            ) : (
              rows.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-ink-900">{b.name}</td>
                  <td className="px-4 py-3 text-ink-900/60">{b.category_name || b.business_type || "—"}</td>
                  <td className="px-4 py-3 text-ink-900/60">{(b as any).area_name || "—"}</td>
                  <td className="px-4 py-3 text-ink-900/60">{b.phone || "—"}</td>
                  <td className="px-4 py-3 text-ink-900/60">{b.rating ? `★ ${b.rating}` : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setPreview(b)}
                        className="rounded-lg border border-black/10 px-2.5 py-1 text-xs font-medium hover:bg-gray-50"
                      >
                        Preview
                      </button>
                      <button
                        disabled={busyId === b.id}
                        onClick={() => approve(b.id)}
                        className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        disabled={busyId === b.id}
                        onClick={() => setRejectFor(b.id)}
                        className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {preview && (
        <BusinessDetailModal
          business={preview}
          onClose={() => setPreview(null)}
          actions={
            <>
              <button
                onClick={() => { approve(preview.id); setPreview(null); }}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Approve
              </button>
              <button
                onClick={() => { setRejectFor(preview.id); setPreview(null); }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Reject
              </button>
            </>
          }
        />
      )}

      {rejectFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-3 text-sm font-semibold text-ink-900">Reason for rejection</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="e.g. Duplicate of another listing"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { setRejectFor(null); setRejectReason(""); }}
                className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => reject(rejectFor, rejectReason || "Rejected by admin")}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
