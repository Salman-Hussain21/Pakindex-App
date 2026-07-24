"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getScrapeJobs, bulkApproveScrapeJobs } from "@/lib/admin-api";
import BulkActionBar from "@/components/admin/BulkActionBar";

interface ScrapeJob {
  id: string;
  query: string | null;
  status: string;
  total_found: number;
  new_records: number;
  duplicates: number;
  failed_records: number;
  started_at: string;
  completed_at: string | null;
  initiated_by_name: string | null;
  area_name: string | null;
  city_name: string | null;
  still_pending: number;
}

const STATUS_COLOR: Record<string, string> = {
  completed: "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300",
  running: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  failed: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  partial: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

export default function ScrapedDataPage() {
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const data: any = await getScrapeJobs({ pageSize: 50, page: pg });
      const fetchedTotal = data.pagination?.total || data.total || 0;
      
      setJobs(data.jobs || []);
      setTotal(fetchedTotal);
      setTotalPages(data.pagination?.totalPages || Math.ceil(fetchedTotal / 50) || 1);
      setPage(pg);
      setSelected(new Set());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  
  function toggleAll() {
    setSelected((prev) => (prev.size === jobs.length ? new Set() : new Set(jobs.map((j) => j.id))));
  }

  async function bulkApprove() {
    if (!confirm(`Approve every still-pending business scraped by these ${selected.size} job(s)?`)) return;
    setBulkBusy(true);
    try {
      const result: any = await bulkApproveScrapeJobs(Array.from(selected));
      alert(`Approved ${result.approved} business(es).`);
      load(page); // Reload the current page to reflect changes
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900 dark:text-gray-100">New Scraped Data</h1>
        <Link
          href="/admin/scraping"
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Run a New Scrape
        </Link>
      </div>
      <p className="mb-4 text-sm text-ink-900/50 dark:text-gray-400">
        Every batch your team has pulled in, separate from the per-business Pending Approval queue —
        useful for seeing which search produced what, and bulk-approving an entire trusted batch at once.
      </p>

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</p>}

      <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())}>
        <button
          disabled={bulkBusy}
          onClick={bulkApprove}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Approve All Pending From Selected
        </button>
      </BulkActionBar>

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-ink-900/40 dark:bg-gray-950 dark:text-gray-500">
            <tr>
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={jobs.length > 0 && selected.size === jobs.length} onChange={toggleAll} className="rounded border-black/20" />
              </th>
              <th className="px-4 py-3">Query</th>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Found / New / Dup</th>
              <th className="px-4 py-3">Still Pending</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/10">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-ink-900/40 dark:text-gray-500">Loading…</td></tr>
            ) : jobs.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-ink-900/40 dark:text-gray-500">No scrapes yet — run one from the Scraping Center.</td></tr>
            ) : (
              jobs.map((j) => (
                <tr key={j.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${selected.has(j.id) ? "bg-brand-50/40 dark:bg-brand-900/10" : ""}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(j.id)} onChange={() => toggle(j.id)} className="rounded border-black/20" />
                  </td>
                  <td className="px-4 py-3 font-medium text-ink-900 dark:text-gray-100">{j.query || "—"}</td>
                  <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">{j.area_name || j.city_name || "—"}</td>
                  <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">{j.total_found} / {j.new_records} / {j.duplicates}</td>
                  <td className="px-4 py-3">
                    {Number(j.still_pending) > 0 ? (
                      <Link href="/admin/pending" className="text-amber-700 underline dark:text-amber-400">{j.still_pending} waiting</Link>
                    ) : (
                      <span className="text-ink-900/40 dark:text-gray-500">All reviewed</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLOR[j.status] || ""}`}>
                      {j.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-900/60 dark:text-gray-400">
                    {new Date(j.started_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href="/admin/pending"
                      className="rounded-lg border border-black/10 px-2.5 py-1 text-xs font-medium text-ink-900 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-ink-900/40 dark:text-gray-500">
          Showing {total === 0 ? 0 : ((page - 1) * 50) + 1}–{Math.min(page * 50, total)} of {total.toLocaleString()} scrape jobs
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
    </div>
  );
}