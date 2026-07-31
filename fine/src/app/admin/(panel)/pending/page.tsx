"use client";

import { useEffect, useState, useCallback } from "react";
import { getBusinesses, patchBusiness, bulkBusinessAction, getAreas, getCategories } from "@/lib/admin-api";
import type { BusinessDetail } from "@/components/admin/BusinessDetailModal";
import BulkActionBar from "@/components/admin/BulkActionBar";
import PreviewMapButtons from "@/components/admin/PreviewMapButtons";

const SEL = "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100";

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

  // Filters
  const [q, setQ] = useState("");
  const [areaId, setAreaId] = useState("");
  const [catId, setCatId] = useState("");
  const [minRating, setMinRating] = useState("");
  const [areas, setAreas] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    getAreas().then((d: any) => setAreas(d.areas || [])).catch(() => {});
    getCategories().then((d: any) => setCategories(d.categories || [])).catch(() => {});
  }, []);

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const d: any = await getBusinesses({
        status: "pending",
        pageSize: 50,
        page: pg,
        q: q || undefined,
        area_id: areaId || undefined,
        category_id: catId || undefined,
        min_rating: minRating || undefined,
      });
      setRows(d.businesses || []);
      setTotal(d.pagination?.total || 0);
      setTotalPages(d.pagination?.totalPages || 1);
      setPage(pg);
      setSelected(new Set());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [q, areaId, catId, minRating]);

  useEffect(() => {
    const t = setTimeout(() => load(1), 300);
    return () => clearTimeout(t);
  }, [q, areaId, catId, minRating, load]);

  const toggle = (id: string) =>
    setSelected((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const toggleAll = () =>
    setSelected((p) => (p.size === rows.length ? new Set() : new Set(rows.map((r) => r.id))));

  async function approve(id: string) {
    setBusyId(id);
    try {
      await patchBusiness(id, { action: "approve" });
      setRows((p) => p.filter((r) => r.id !== id));
      setTotal((t) => Math.max(0, t - 1));
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
      setRows((p) => p.filter((r) => r.id !== id));
      setTotal((t) => Math.max(0, t - 1));
      setRejectFor(null);
      setRejectReason("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function bulkApprove() {
    setBulkBusy(true);
    try {
      await bulkBusinessAction({ action: "approve", ids: Array.from(selected) });
      setRows((p) => p.filter((r) => !selected.has(r.id)));
      setTotal((t) => Math.max(0, t - selected.size));
      setSelected(new Set());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkReject() {
    const reason = prompt("Rejection reason for selected records:", "Bulk rejected by admin");
    if (reason === null) return;
    setBulkBusy(true);
    try {
      await bulkBusinessAction({ action: "reject", ids: Array.from(selected), reason });
      setRows((p) => p.filter((r) => !selected.has(r.id)));
      setTotal((t) => Math.max(0, t - selected.size));
      setSelected(new Set());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBulkBusy(false);
    }
  }

  async function deleteAllPending() {
    if (!confirm("Are you sure you want to permanently delete ALL pending records from the database? This cannot be undone.")) return;
    setLoading(true);
    try {
      await bulkBusinessAction({ action: "delete_all", status: "pending" });
      setRows([]);
      setTotal(0);
      setTotalPages(1);
      setSelected(new Set());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function approveAllPending() {
    if (!confirm("Are you sure you want to approve ALL pending records? This will publish them to the core database.")) return;
    setLoading(true);
    try {
      await bulkBusinessAction({ action: "approve_all", status: "pending" });
      setRows([]);
      setTotal(0);
      setTotalPages(1);
      setSelected(new Set());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const clearFilters = () => {
    setQ("");
    setAreaId("");
    setCatId("");
    setMinRating("");
  };

  const hasFilters = q || areaId || catId || minRating;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900 dark:text-gray-100">Pending Approvals</h1>
          <p className="mt-0.5 text-sm text-ink-900/50 dark:text-gray-400">
            Review and publish newly scraped or submitted Karachi HORECA listings into the core database.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={approveAllPending}
            disabled={loading}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 shadow-sm transition-colors duration-150"
          >
            Approve All Pending
          </button>
          <button
            onClick={deleteAllPending}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 shadow-sm transition-colors duration-150"
          >
            Delete All Pending
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search pending records…"
          className={SEL + " w-56"}
        />
        <select value={areaId} onChange={(e) => setAreaId(e.target.value)} className={SEL}>
          <option value="">All areas</option>
          {areas.map((a: any) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select value={catId} onChange={(e) => setCatId(e.target.value)} className={SEL}>
          <option value="">All types</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={minRating} onChange={(e) => setMinRating(e.target.value)} className={SEL}>
          <option value="">Any rating</option>
          <option value="4.0">★ 4.0+</option>
          <option value="3.0">★ 3.0+</option>
        </select>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm text-ink-900/60 hover:bg-gray-50 dark:border-white/10 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Clear ✕
          </button>
        )}
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())}>
        <button
          disabled={bulkBusy}
          onClick={bulkApprove}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Approve Selected ({selected.size})
        </button>
        <button
          disabled={bulkBusy}
          onClick={bulkReject}
          className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium text-ink-900 hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Reject Selected
        </button>
      </BulkActionBar>

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-ink-900/40 dark:bg-gray-950 dark:text-gray-500">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selected.size > 0 && selected.size === rows.length}
                  onChange={toggleAll}
                  className="rounded border-black/20"
                />
              </th>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Area</th>
              <th className="px-4 py-3 font-semibold">Rating</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/10">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-900/40 dark:text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-900/40 dark:text-gray-500">
                  No records pending approval.
                </td>
              </tr>
            ) : (
              rows.map((b) => (
                <tr
                  key={b.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    selected.has(b.id) ? "bg-brand-50/40 dark:bg-brand-900/10" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(b.id)}
                      onChange={() => toggle(b.id)}
                      className="rounded border-black/20"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-ink-900 dark:text-gray-100">{b.name}</td>
                  <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">
                    {b.category_name || b.business_type || "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">{(b as any).area_name || "—"}</td>
                  <td className="px-4 py-3">
                    {b.rating ? (
                      <span className="font-medium text-amber-600 dark:text-amber-400">
                        ★ {Number(b.rating).toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-ink-900/30 dark:text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">{b.phone || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-row flex-nowrap items-center justify-end gap-1">
                      <PreviewMapButtons business={b} />
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
                        className="rounded-lg border border-black/10 px-2.5 py-1 text-xs font-medium text-ink-900 hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800"
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

      {rejectFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-900">
            <h3 className="text-base font-semibold text-ink-900 dark:text-gray-100">Reject Record</h3>
            <p className="mt-1 text-xs text-ink-900/50 dark:text-gray-400">Specify why this listing is being rejected.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Duplicate listing, permanently closed, incomplete address…"
              rows={3}
              className="mt-3 w-full rounded-lg border border-black/10 bg-white p-2.5 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setRejectFor(null);
                  setRejectReason("");
                }}
                className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium text-ink-900 dark:border-white/10 dark:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => reject(rejectFor, rejectReason)}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
              >
                Reject Record
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-ink-900/40 dark:text-gray-500">
          {total === 0 ? "No results" : `${(page - 1) * 50 + 1}–${Math.min(page * 50, total)} of ${total.toLocaleString()}`}
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => load(1)}
              className="rounded-lg border border-black/10 px-2.5 py-1 text-xs text-ink-900 hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              «
            </button>
            <button
              disabled={page <= 1}
              onClick={() => load(page - 1)}
              className="rounded-lg border border-black/10 px-2.5 py-1 text-xs text-ink-900 hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              ‹
            </button>
            <span className="px-3 text-xs text-ink-900/60 dark:text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => load(page + 1)}
              className="rounded-lg border border-black/10 px-2.5 py-1 text-xs text-ink-900 hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              ›
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => load(totalPages)}
              className="rounded-lg border border-black/10 px-2.5 py-1 text-xs text-ink-900 hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              »
            </button>
          </div>
        )}
      </div>
    </div>
  );
}