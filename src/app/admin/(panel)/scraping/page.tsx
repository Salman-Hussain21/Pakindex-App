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
  const [results, setResults] = useState<RawBusiness[]>([]);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ingestResult, setIngestResult] = useState<any>(null);

  async function handleSearch() {
    setSearching(true);
    setError(null);
    setIngestResult(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&fetchAll=false`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setResults(data.businesses || []);
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
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-ink-900 dark:text-gray-100">Scraping Center</h1>

      <div className="mb-4 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. cafes in Clifton Karachi"
          className="w-full max-w-md rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
        <button
          onClick={handleSearch}
          disabled={searching}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {searching ? "Searching…" : "Search"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
          {error.includes("HASDATA_API_KEY") && (
            <p className="mt-1 text-red-600/80">
              Add your HasData key to <code className="rounded bg-white/60 px-1">.env</code> as{" "}
              <code className="rounded bg-white/60 px-1">HASDATA_API_KEY=...</code> and restart the dev
              server.
            </p>
          )}
        </div>
      )}

      {ingestResult && (
        <div className="mb-4 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
          Sent to Pending Approval: {ingestResult.newRecords} new, {ingestResult.duplicates} duplicates
          skipped, {ingestResult.failedRecords} failed.
        </div>
      )}

      {results.length > 0 && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-ink-900/60 dark:text-gray-400">{results.length} results found</p>
            <button
              onClick={handleSendToQueue}
              disabled={sending}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {sending ? "Sending…" : `Send ${results.length} to Pending Approval →`}
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-white shadow-sm dark:bg-gray-900 dark:shadow-none">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-ink-900/40 dark:text-gray-500 dark:bg-gray-950 dark:text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/10">
                {results.map((b, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-medium text-ink-900 dark:text-gray-100">{b.title}</td>
                    <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">{b.type || "—"}</td>
                    <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">{b.address || "—"}</td>
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
