"use client";


import { useState } from "react";
import { ingestBusinesses } from "@/lib/admin-api";

interface RawBusiness {
  title?: string;
  rating?: number;
  reviews?: number;
  address?: string;
  phone?: string;
  type?: string;
}

export default function ScrapingCenterPage() {
  const [query, setQuery] = useState("restaurants in DHA Karachi");
  const [fetchAll, setFetchAll] = useState(true);
  const [strict, setStrict] = useState(true);
  const [results, setResults] = useState<RawBusiness[]>([]);
  const [meta, setMeta] = useState<{ pagesUsed?: number; creditsUsed?: number } | null>(null);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ingestResult, setIngestResult] = useState<any>(null);

  async function handleSearch() {
    setSearching(true);
    setError(null);
    setIngestResult(null);
    setResults([]);
    setMeta(null);
    try {
      const params = new URLSearchParams({ q: query, fetchAll: String(fetchAll), strict: String(strict) });
      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setResults(data.businesses || []);
      setMeta({ pagesUsed: data.pagesUsed, creditsUsed: data.creditsUsed });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSearching(false);
    }
  }

  async function handleSendToQueue() {
    setSending(true);
    setError(null);
    try {
      const result = await ingestBusinesses({ searchQuery: query, businesses: results });
      setIngestResult(result);
      setResults([]);
      setMeta(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold text-ink-900 dark:text-gray-100">Scraping Center</h1>
      <p className="mb-4 text-sm text-ink-900/50 dark:text-gray-400">
        Search pulls up to 1,000 results (50 pages × 20 each). Each page costs 5 HasData credits.
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. cafes in Clifton Karachi"
          className="w-full max-w-lg rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button
          onClick={handleSearch}
          disabled={searching}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {searching ? "Searching…" : "Search"}
        </button>
      </div>

      <div className="mb-4 flex gap-4 text-sm">
        <label className="flex items-center gap-2 text-ink-900/70 dark:text-gray-300">
          <input type="checkbox" checked={fetchAll} onChange={(e) => setFetchAll(e.target.checked)} className="rounded border-black/20" />
          Fetch all pages (up to 1,000 results)
        </label>
        <label className="flex items-center gap-2 text-ink-900/70 dark:text-gray-300">
          <input type="checkbox" checked={strict} onChange={(e) => setStrict(e.target.checked)} className="rounded border-black/20" />
          Strict mode (require phone number)
        </label>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
          {error.includes("HASDATA_API_KEY") && (
            <p className="mt-1 text-red-600/80">
              Add your key to <code className="rounded bg-white/60 px-1">.env</code> as{" "}
              <code className="rounded bg-white/60 px-1">HASDATA_API_KEY=...</code> and restart.
            </p>
          )}
        </div>
      )}

      {ingestResult && (
        <div className="mb-4 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800 dark:bg-brand-900/20 dark:text-brand-300">
          ✓ Sent to Pending Approval: <strong>{ingestResult.newRecords}</strong> new,{" "}
          {ingestResult.duplicates} duplicate{ingestResult.duplicates !== 1 ? "s" : ""} skipped,{" "}
          {ingestResult.failedRecords} failed.
        </div>
      )}

      {results.length > 0 && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm text-ink-900/60 dark:text-gray-400">
              <span className="font-semibold text-ink-900 dark:text-gray-100">{results.length}</span> results
              {meta && (
                <span className="ml-2 text-xs">
                  · {meta.pagesUsed} page{meta.pagesUsed !== 1 ? "s" : ""} · {meta.creditsUsed} credits used
                </span>
              )}
            </div>
            <button
              onClick={handleSendToQueue}
              disabled={sending}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {sending ? "Sending…" : `Send ${results.length} to Pending Approval →`}
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-ink-900/40 dark:bg-gray-950 dark:text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/10">
                {results.map((b, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 font-medium text-ink-900 dark:text-gray-100">{b.title}</td>
                    <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">{b.type || "—"}</td>
                    <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">{b.address || "—"}</td>
                    <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">{(b as any).phone || "—"}</td>
                    <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">{b.rating ? `★ ${b.rating}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
