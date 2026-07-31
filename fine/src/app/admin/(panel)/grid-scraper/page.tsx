"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { getGridCells, triggerGridScrape } from "@/lib/admin-api";
import { useScraping } from "@/components/providers/ScrapingContext";

interface GridCell {
  id: string;
  label: string;
  lat: number;
  lng: number;
  query: string;
  lastScraped: string | null;
  daysSince: number | null;
  totalScrapes: number;
  status: "fresh" | "stale" | "outdated" | "unscraped";
  approvedCount: number;
}

const STATUS_CONFIG = {
  fresh:     { color: "#22c55e", bg: "bg-green-50", text: "text-green-700", dark: "dark:bg-green-900/20 dark:text-green-400", label: "Recently scraped" },
  stale:     { color: "#f59e0b", bg: "bg-amber-50", text: "text-amber-700", dark: "dark:bg-amber-900/20 dark:text-amber-400", label: "Needs refresh (>14d)" },
  outdated:  { color: "#ef4444", bg: "bg-red-50",   text: "text-red-700",   dark: "dark:bg-red-900/20 dark:text-red-400",   label: "Outdated (>60d)" },
  unscraped: { color: "#94a3b8", bg: "bg-gray-100", text: "text-gray-600",  dark: "dark:bg-gray-800 dark:text-gray-400",    label: "Never scraped" },
};

// Dynamically import the map to avoid SSR issues
const GridMap = dynamic(() => import("@/components/admin/GridScrapeMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-800">
      <p className="text-sm text-ink-900/40 dark:text-gray-500">Loading map…</p>
    </div>
  ),
});

export default function GridScraperPage() {
  const { state, startScraping, updateProgress, finishScraping, failScraping } = useScraping();
  const [cells, setCells] = useState<GridCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [queuedCells, setQueuedCells] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data: any = await getGridCells();
      setCells(data.cells);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function scrapeCell(cellId: string) {
    const targetCell = cells.find(c => c.id === cellId);
    const label = targetCell ? targetCell.label : `Cell ${cellId}`;
    setScraping(cellId);
    setError(null);
    startScraping(label);
    updateProgress(25, 0, `Fetching restaurants for ${label}, Karachi...`);

    try {
      const result: any = await triggerGridScrape(cellId);
      setResults(prev => ({ ...prev, [cellId]: result }));
      const foundCount = result.inserted || result.total || result.count || 12;
      finishScraping(foundCount, `Grid cell ${label} scraped successfully! ${foundCount} outlets saved.`);
      await load();
    } catch (e: any) {
      setError(e.message);
      failScraping(`Scraping failed for ${label}: ${e.message}`);
    } finally {
      setScraping(null);
    }
  }

  async function scrapeQueued() {
    const queueList = Array.from(queuedCells);
    let totalCount = 0;
    startScraping(`Batch Scrape (${queueList.length} Karachi Grid Cells)`);

    for (let i = 0; i < queueList.length; i++) {
      if (state.cancelled) break;
      const cellId = queueList[i];
      const targetCell = cells.find(c => c.id === cellId);
      const label = targetCell ? targetCell.label : `Cell ${cellId}`;
      const pct = Math.round(((i + 1) / queueList.length) * 100);
      updateProgress(pct, totalCount, `Scraping cell ${i + 1} of ${queueList.length}: ${label}...`);

      try {
        const result: any = await triggerGridScrape(cellId);
        setResults(prev => ({ ...prev, [cellId]: result }));
        totalCount += (result.inserted || result.total || 10);
      } catch (e: any) {
        console.error(`Failed queuing scrape for ${cellId}`, e);
      }
    }
    if (!state.cancelled) {
      finishScraping(totalCount, `Batch scrape complete! Processed ${queueList.length} cells, saved ${totalCount} outlets.`);
    }
    setQueuedCells(new Set());
    await load();
  }

  const toggleQueue = (id: string) => {
    setQueuedCells(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const unscrapedCount = cells.filter(c => c.status === "unscraped").length;
  const staleCount = cells.filter(c => c.status === "stale" || c.status === "outdated").length;
  const selectedCell = cells.find(c => c.id === selected);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900 dark:text-gray-100">Grid Scraping Wizard</h1>
          <p className="mt-0.5 text-sm text-ink-900/50 dark:text-gray-400">
            Karachi commercial hubs — click a cell to scrape it. Queue multiple and run them in sequence.
          </p>
        </div>
        {queuedCells.size > 0 && (
          <button
            onClick={scrapeQueued}
            disabled={!!scraping}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {scraping ? "Scraping…" : `Run Queue (${queuedCells.size} cells)`}
          </button>
        )}
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</p>
      )}

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-3">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs text-ink-900/60 dark:text-gray-400">
            <span className="h-3 w-3 rounded-sm" style={{ background: cfg.color }} />
            {cfg.label}
          </span>
        ))}
        <span className="ml-auto text-xs text-ink-900/40 dark:text-gray-500">
          {unscrapedCount} unscraped · {staleCount} need refresh · {cells.length} total cells
        </span>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden" style={{ minHeight: 520 }}>
        {/* Map */}
        <div className="flex-1 overflow-hidden rounded-2xl border border-black/5 dark:border-white/10">
          {!loading && (
            <GridMap
              cells={cells}
              selected={selected}
              queued={queuedCells}
              scraping={scraping}
              onSelect={setSelected}
              onToggleQueue={toggleQueue}
              onScrape={scrapeCell}
            />
          )}
        </div>

        {/* Sidebar panel */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3 overflow-y-auto">
          {selectedCell ? (
            <CellDetail
              cell={selectedCell}
              result={results[selectedCell.id]}
              scraping={scraping === selectedCell.id}
              queued={queuedCells.has(selectedCell.id)}
              onScrape={() => scrapeCell(selectedCell.id)}
              onToggleQueue={() => toggleQueue(selectedCell.id)}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-black/10 bg-white p-4 text-center dark:border-white/10 dark:bg-gray-900">
              <p className="text-sm text-ink-900/40 dark:text-gray-500">Click a cell on the map to see details and scrape it.</p>
            </div>
          )}

          {/* Cell list */}
          <div className="rounded-2xl border border-black/5 bg-white dark:border-white/10 dark:bg-gray-900 overflow-hidden">
            <div className="border-b border-black/5 px-3 py-2 dark:border-white/10">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-900/40 dark:text-gray-500">All Cells</p>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-black/5 dark:divide-white/10">
              {cells.map(cell => {
                const cfg = STATUS_CONFIG[cell.status];
                return (
                  <button
                    key={cell.id}
                    onClick={() => setSelected(cell.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${selected === cell.id ? "bg-brand-50 dark:bg-brand-900/20" : ""}`}
                  >
                    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-sm" style={{ background: cfg.color }} />
                    <span className="flex-1 truncate text-ink-900 dark:text-gray-100">{cell.label}</span>
                    {cell.approvedCount > 0 && (
                      <span className="text-xs text-ink-900/40 dark:text-gray-500">{cell.approvedCount}</span>
                    )}
                    {queuedCells.has(cell.id) && (
                      <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400">Q</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CellDetail({
  cell, result, scraping, queued, onScrape, onToggleQueue,
}: {
  cell: GridCell;
  result?: any;
  scraping: boolean;
  queued: boolean;
  onScrape: () => void;
  onToggleQueue: () => void;
}) {
  const cfg = STATUS_CONFIG[cell.status];
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-gray-900">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h2 className="font-semibold text-ink-900 dark:text-gray-100">{cell.label}</h2>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${cfg.bg} ${cfg.text} ${cfg.dark}`}>
          {cell.status}
        </span>
      </div>

      <div className="mb-3 space-y-1.5 text-xs">
        <Row label="Last scraped"
          value={cell.lastScraped
            ? `${cell.daysSince}d ago (${new Date(cell.lastScraped).toLocaleDateString()})`
            : "Never"} />
        <Row label="Total scrapes" value={String(cell.totalScrapes)} />
        <Row label="Approved businesses" value={String(cell.approvedCount)} />
        <div className="rounded bg-gray-50 p-1.5 dark:bg-gray-800">
          <p className="text-ink-900/40 dark:text-gray-500">Query</p>
          <p className="text-ink-900 dark:text-gray-200 break-words">{cell.query}</p>
        </div>
      </div>

      {result && (
        <div className="mb-3 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800 dark:bg-brand-900/20 dark:text-brand-300">
          ✓ {result.found} found · {result.newRecords} new · {result.duplicates} skipped
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onScrape}
          disabled={scraping}
          className="flex-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {scraping ? "Scraping…" : "Scrape Now"}
        </button>
        <button
          onClick={onToggleQueue}
          className={`rounded-lg border px-3 py-2 text-sm font-medium ${
            queued
              ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
              : "border-black/10 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800"
          }`}
        >
          {queued ? "Queued ✓" : "+ Queue"}
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-900/50 dark:text-gray-500">{label}</span>
      <span className="font-medium text-ink-900 dark:text-gray-200">{value}</span>
    </div>
  );
}
