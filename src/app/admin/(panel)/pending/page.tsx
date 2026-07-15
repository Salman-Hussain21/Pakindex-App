"use client";

import { useEffect, useState, useCallback } from "react";
import { getBusinesses, patchBusiness, bulkBusinessAction } from "@/lib/admin-api";
import type { BusinessDetail } from "@/components/admin/BusinessDetailModal";
import BulkActionBar from "@/components/admin/BulkActionBar";
import PreviewMapButtons from "@/components/admin/PreviewMapButtons";

export default function PendingApprovalPage() {
  const [rows, setRows] = useState<BusinessDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try { 
      const d: any = await getBusinesses({ status: "pending", pageSize: 50, page: pg }); 
      setRows(d.businesses || []); 
      setTotal(d.pagination?.total || 0);
      setTotalPages(d.pagination?.totalPages || 1);
      setPage(pg);
      setSelected(new Set()); 
    }
    catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(1); }, [load]);

  const toggle = (id: string) => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(p => p.size === rows.length ? new Set() : new Set(rows.map(r => r.id)));

  async function approve(id: string) {
    setBusyId(id);
    try { 
      await patchBusiness(id, { action: "approve" }); 
      setRows(p => p.filter(r => r.id !== id)); 
      setTotal(t => Math.max(0, t - 1));
    }
    catch (e: any) { setError(e.message); } finally { setBusyId(null); }
  }

  async function reject(id: string, reason: string) {
    setBusyId(id);
    try { 
      await patchBusiness(id, { action: "reject", reason }); 
      setRows(p => p.filter(r => r.id !== id)); 
      setTotal(t => Math.max(0, t - 1));
      setRejectFor(null); 
      setRejectReason(""); 
    }
    catch (e: any) { setError(e.message); } finally { setBusyId(null); }
  }

  async function bulkApprove() {
    setBulkBusy(true);
    try { 
      await bulkBusinessAction({ action: "approve", ids: Array.from(selected) }); 
      setRows(p => p.filter(r => !selected.has(r.id))); 
      setTotal(t => Math.max(0, t - selected.size));
      setSelected(new Set()); 
    }
    catch (e: any) { setError(e.message); } finally { setBulkBusy(false); }
  }

  async function bulkReject() {
    setBulkBusy(true);
    try { 
      await bulkBusinessAction({ action: "reject", ids: Array.from(selected), reason: "Bulk rejected by admin" }); 
      setRows(p => p.filter(r => !selected.has(r.id))); 
      setTotal(t => Math.max(0, t - selected.size));
      setSelected(new Set()); 
    }
    catch (e: any) { setError(e.message); } finally { setBulkBusy(false); }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900 dark:text-gray-100">Pending Approval</h1>
        <span className="text-sm text-ink-900/50 dark:text-gray-400">{total.toLocaleString()} waiting</span>
      </div>
      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</p>}

      <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())}>
        <button disabled={bulkBusy} onClick={bulkApprove} className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50">Approve Selected</button>
        <button disabled={bulkBusy} onClick={bulkReject} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">Reject Selected</button>
      </BulkActionBar>

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-ink-900/40 dark:bg-gray-950 dark:text-gray-500">
            <tr>
              <th className="w-10 px-4 py-3"><input type="checkbox" checked={rows.length > 0 && selected.size === rows.length} onChange={toggleAll} className="rounded border-black/20" /></th>
              <th className="px-4 py-3">Name</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Area</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Rating</th><th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/10">
            {loading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-ink-900/40 dark:text-gray-500">Loading…</td></tr>
            : rows.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-ink-900/40 dark:text-gray-500">Nothing pending 🎉</td></tr>
            : rows.map(b => (
              <tr key={b.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${selected.has(b.id) ? "bg-brand-50/40 dark:bg-brand-900/10" : ""}`}>
                <td className="px-4 py-3"><input type="checkbox" checked={selected.has(b.id)} onChange={() => toggle(b.id)} className="rounded border-black/20" /></td>
                <td className="px-4 py-3 font-medium text-ink-900 dark:text-gray-100">{b.name}</td>
                <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">{b.category_name || b.business_type || "—"}</td>
                <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">{(b as any).area_name || "—"}</td>
                <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">{b.phone || "—"}</td>
                <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">{b.rating ? `★ ${b.rating}` : "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-row flex-nowrap items-center justify-end gap-1">
                    <PreviewMapButtons business={b} />
                    <button disabled={busyId === b.id} onClick={() => approve(b.id)} className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50">Approve</button>
                    <button disabled={busyId === b.id} onClick={() => setRejectFor(b.id)} className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">Reject</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-ink-900/40 dark:text-gray-500">
          Showing {total === 0 ? 0 : ((page - 1) * 50) + 1}–{Math.min(page * 50, total)} of {total.toLocaleString()} pending businesses
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => load(1)}
              className="rounded-lg border border-black/10 px-2.5 py-1 text-xs text-ink-900 hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800">«</button>
            <button disabled={page <= 1} onClick={() => load(page - 1)}
              className="rounded-lg border border-black/10 px-2.5 py-1 text-xs text-ink-900 hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800">‹ Prev</button>
            <span className="px-3 text-xs text-ink-900/60 dark:text-gray-400">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => load(page + 1)}
              className="rounded-lg border border-black/10 px-2.5 py-1 text-xs text-ink-900 hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800">Next ›</button>
            <button disabled={page >= totalPages} onClick={() => load(totalPages)}
              className="rounded-lg border border-black/10 px-2.5 py-1 text-xs text-ink-900 hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800">»</button>
          </div>
        )}
      </div>

      {rejectFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h3 className="mb-3 text-sm font-semibold text-ink-900 dark:text-gray-100">Rejection reason</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
              placeholder="e.g. Duplicate listing" />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { setRejectFor(null); setRejectReason(""); }} className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium text-ink-900 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800">Cancel</button>
              <button onClick={() => reject(rejectFor, rejectReason || "Rejected by admin")} className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700">Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}