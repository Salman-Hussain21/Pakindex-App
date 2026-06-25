"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { determineBusinessStatus } from "@/lib/detectors";

// ── Types ──────────────────────────────────────────────────────────────────
// We are receiving the raw JSON object from HasData for each business.
type RawBusiness = any;

interface SearchResult {
  query:      string;
  ll:         string;
  page:       number;
  count:      number;
  businesses: RawBusiness[];
  error?:     string;
  pagesUsed?:   number;
  creditsUsed?: number;
  fetchedAll?:  boolean;
}

// ── Quick-search chips ─────────────────────────────────────────────────────
const QUICK_SEARCHES = [
  { label: "🍖 PECHS",          q: "restaurants in PECHS Karachi" },
  { label: "🥩 DHA",            q: "restaurants in DHA Karachi" },
  { label: "☕ Clifton",        q: "cafes in Clifton Karachi" },
  { label: "🍕 Gulshan",        q: "restaurants in Gulshan Karachi" },
  { label: "🍜 Lahore",         q: "restaurants in Gulberg Lahore" },
  { label: "🏨 Islamabad F-7",  q: "restaurants in F-7 Islamabad" },
];

// ── Icons & Helpers ────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`w-3.5 h-3.5 ${rating >= s ? "text-amber-500" : "text-white/20"}`}
          viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </span>
  );
}

function OpenBadge({ openState }: { openState?: string | null }) {
  if (!openState) return null;
  const isOpen   = openState.toLowerCase().includes("open");
  const isClosed = openState.toLowerCase().includes("closed");
  
  let colorClass = "bg-amber-500/15 text-amber-400"; // Default
  if (isOpen) colorClass = "bg-green-500/15 text-green-400";
  if (isClosed) colorClass = "bg-red-500/15 text-red-400";

  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${colorClass}`}>{openState}</span>;
}

// ── Shimmer skeleton card ──────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 animate-pulse">
      <div className="flex gap-4 items-start">
        <div className="w-16 h-16 rounded-xl bg-white/10 flex-shrink-0" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 bg-white/10 rounded w-3/4" />
          <div className="h-3 bg-white/10 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2 mt-2">
        <div className="h-3 bg-white/10 rounded w-full" />
        <div className="h-3 bg-white/10 rounded w-5/6" />
      </div>
    </div>
  );
}

// ── Modal / Profile Card ───────────────────────────────────────────────────
function BusinessModal({ biz, onClose }: { biz: RawBusiness; onClose: () => void }) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "unset"; };
  }, []);

  const rating = biz.rating || 0;
  const reviews = biz.reviews || 0;
  const extensions = biz.extensions || {};
  const photos = biz.menu?.overview?.menuPhotos || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-zinc-800/50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-800 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
              {biz.thumbnail ? (
                <img src={biz.thumbnail} alt={biz.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
              )}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">{biz.title}</h2>
              <p className="text-sm text-zinc-400 mt-1">{biz.type || biz.types?.[0]}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {rating > 0 && (
                  <div className="flex items-center gap-1.5 bg-zinc-800/80 px-2 py-1 rounded-lg">
                    <Stars rating={Math.round(rating)} />
                    <span className="text-sm font-semibold text-amber-400">{rating.toFixed(1)}</span>
                    <span className="text-xs text-zinc-400">({reviews.toLocaleString()})</span>
                  </div>
                )}
                {biz.priceDescription && (
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                    {biz.priceDescription}
                  </span>
                )}
                <OpenBadge openState={biz.openState} />
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors self-start"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Column: Info & Actions */}
            <div className="md:col-span-1 space-y-6">
              
              {/* Contact Actions */}
              <div className="flex flex-col gap-2">
                {biz.phone && (
                  <a href={`tel:${biz.phone}`} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25 transition-colors font-medium">
                    📞 Call {biz.phone}
                  </a>
                )}
                {biz.website && (
                  <a href={biz.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20 hover:bg-purple-500/25 transition-colors font-medium">
                    🌐 Visit Website
                  </a>
                )}
                {biz.gpsCoordinates && (
                  <a href={biz.placeId ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(biz.title)}&query_place_id=${biz.placeId}` : `https://maps.google.com/?q=${biz.gpsCoordinates.latitude},${biz.gpsCoordinates.longitude}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 transition-colors font-medium">
                    📍 Open in Maps
                  </a>
                )}
              </div>

              {/* Address */}
              {biz.address && (
                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Address</h3>
                  <p className="text-sm text-zinc-200 leading-relaxed">{biz.address}</p>
                </div>
              )}

              {/* Working Hours */}
              {biz.workingHours?.days && biz.workingHours.days.length > 0 && (
                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Hours</h3>
                  <div className="space-y-2">
                    {biz.workingHours.days.map((d: any, i: number) => {
                      const isToday = new Date().toLocaleDateString('en-US', {weekday: 'long'}) === d.day;
                      return (
                        <div key={i} className={`flex justify-between text-sm ${isToday ? 'text-white font-semibold' : 'text-zinc-400'}`}>
                          <span>{d.day}</span>
                          <span>{d.time}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Details & Photos */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Service Options */}
              {biz.serviceOptions && biz.serviceOptions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <span>✨</span> Service Options
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {biz.serviceOptions.map((opt: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-300">
                        {opt}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Extension Attributes */}
              {Object.keys(extensions).length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(extensions).map(([key, vals]) => {
                    if (!Array.isArray(vals) || vals.length === 0) return null;
                    if (key === 'serviceOptions') return null; // already shown
                    
                    const title = key.replace(/([A-Z])/g, ' $1').trim();
                    const formattedTitle = title.charAt(0).toUpperCase() + title.slice(1);
                    
                    return (
                      <div key={key} className="bg-white/5 border border-white/5 rounded-xl p-4">
                        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">{formattedTitle}</h4>
                        <ul className="space-y-1">
                          {vals.map((v, i) => (
                            <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                              <span className="text-zinc-600 mt-0.5">•</span> {v}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Menu Photos */}
              {photos.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <span>📸</span> Menu & Photos
                  </h3>
                  <div className="flex overflow-x-auto gap-3 pb-4 custom-scrollbar">
                    {photos.map((photo: any, i: number) => (
                      <img 
                        key={i} 
                        src={photo.url} 
                        alt="Menu" 
                        className="h-32 sm:h-40 w-auto object-cover rounded-xl border border-white/10 flex-shrink-0 bg-zinc-800 cursor-pointer hover:opacity-80 transition-opacity"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onClick={() => setSelectedPhoto(photo.url)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Raw JSON Toggle (Optional for debugging) */}
              <details className="mt-8 border border-white/10 rounded-xl overflow-hidden">
                <summary className="bg-white/5 p-3 text-sm font-medium text-zinc-400 cursor-pointer hover:bg-white/10 transition-colors">
                  View Raw JSON Data
                </summary>
                <div className="p-4 bg-black/50 overflow-auto max-h-60 custom-scrollbar">
                  <pre className="text-[10px] text-zinc-500 font-mono">
                    {JSON.stringify(biz, null, 2)}
                  </pre>
                </div>
              </details>

            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Photo Overlay */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setSelectedPhoto(null)}>
          <button className="absolute top-6 right-6 text-white/50 hover:text-white text-4xl">&times;</button>
          <img src={selectedPhoto} className="max-w-full max-h-full object-contain rounded-xl" alt="Enlarged menu photo" referrerPolicy="no-referrer" />
        </div>
      )}
    </div>
  );
}

// ── Business card ──────────────────────────────────────────────────────────
function BusinessCard({ biz, onClick }: { biz: RawBusiness; onClick: () => void }) {
  const rating = biz.rating || 0;
  const reviewsCount = biz.reviews || 0;
  const statusData = determineBusinessStatus(biz);
  const isClosed = statusData.status === "CLOSED";
  const isNew = statusData.status === "NEW_OPENING";

  return (
    <div
      onClick={onClick}
      className={`group relative bg-white/5 border ${isClosed ? 'border-red-500/20 opacity-80' : 'border-white/10'} rounded-2xl p-5 flex flex-col gap-4 cursor-pointer hover:bg-white/10 hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10`}
    >
      {/* Header */}
      <div className="flex gap-4 items-start">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 border border-white/10 relative">
          {biz.thumbnail ? (
            <img src={biz.thumbnail} alt={biz.title} className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isClosed ? 'grayscale' : ''}`} referrerPolicy="no-referrer" />
          ) : (
            <span className="w-full h-full flex items-center justify-center text-2xl">🍽️</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-semibold text-base text-white truncate pr-2">{biz.title}</h3>
            <div className="flex items-center gap-2">
              {statusData.status === 'CLOSED' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider whitespace-nowrap bg-red-500/10 text-red-400 border-red-500/20">
                  Business Closed
                </span>
              )}
              {statusData.status === 'NEW_OPENING' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider whitespace-nowrap bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  New Opening
                </span>
              )}
              {statusData.status === 'ACTIVE' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider whitespace-nowrap bg-blue-500/10 text-blue-400 border-blue-500/20">
                  Active
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5 truncate">{biz.type || biz.types?.[0] || 'Restaurant'}</p>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {rating > 0 && (
              <div className="flex items-center gap-1">
                <Stars rating={Math.round(rating)} />
                <span className="text-xs font-semibold text-amber-400 ml-1">{rating.toFixed(1)}</span>
              </div>
            )}
            {reviewsCount > 0 && (
              <span className="text-[10px] text-zinc-500">({reviewsCount.toLocaleString()})</span>
            )}
          </div>
        </div>
      </div>

      {/* Address */}
      {biz.address && (
        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
          📍 {biz.address}
        </p>
      )}

      {/* Badges footer */}
      <div className="mt-auto flex items-center justify-between pt-2">
        <OpenBadge openState={biz.openState} />
        {biz.price && (
          <span className="text-xs font-medium text-emerald-400">{biz.price}</span>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
type SearchMode = "standard" | "fetchAll" | "deepScan";

interface ScanProgress {
  cellsDone: number;
  totalCells: number;
  totalRaw: number;
  currentCell: string;
}

export default function Home() {
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState<SearchResult | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [page,     setPage]     = useState(0);
  const [searchMode, setSearchMode] = useState<SearchMode>("standard");
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [scanDensity, setScanDensity] = useState(3);
  const [strictMode, setStrictMode] = useState(true);
  
  const [selectedBiz, setSelectedBiz] = useState<RawBusiness | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Deep Scan via SSE
  const deepScan = useCallback(async (q: string, density: number, strict: boolean) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);
    setScanProgress({ cellsDone: 0, totalCells: density * density, totalRaw: 0, currentCell: "" });

    try {
      const res = await fetch(`/api/deepscan?q=${encodeURIComponent(q)}&density=${density}&strict=${strict}`);
      if (!res.ok || !res.body) {
        setError("Deep scan failed to connect.");
        setLoading(false);
        setScanProgress(null);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === "progress") {
              setScanProgress({
                cellsDone: event.cellsDone,
                totalCells: event.totalCells,
                totalRaw: event.totalRaw,
                currentCell: event.currentCell,
              });
            } else if (event.type === "complete") {
              setResults({
                query: event.query,
                ll: `Grid ${event.density}×${event.density}`,
                page: 0,
                count: event.uniqueCount,
                businesses: event.businesses,
                pagesUsed: event.cellsScanned,
                creditsUsed: event.creditsUsed,
                fetchedAll: true,
              });
              setScanProgress(null);
            } else if (event.type === "error") {
              setScanProgress(prev => prev ? { ...prev, cellsDone: event.cellsDone, totalCells: event.totalCells } : null);
            }
          } catch { /* skip malformed events */ }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error during deep scan.");
      setScanProgress(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const search = useCallback(async (q: string, p = 0, mode: SearchMode = "standard", strict = true) => {
    if (!q.trim()) return;

    if (mode === "deepScan") {
      deepScan(q, scanDensity, strict);
      return;
    }

    setLoading(true);
    setError(null);
    if (p === 0) setResults(null);

    try {
      if (mode === "fetchAll") {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}&fetchAll=true&strict=${strict}`);
        const data = (await res.json()) as SearchResult;

        if (!res.ok || data.error) {
          setError(data.error || "Something went wrong.");
        } else {
          setResults(data);
          setPage(0);
        }
      } else {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}&page=${p}&strict=${strict}`);
        const data = (await res.json()) as SearchResult;

        if (!res.ok || data.error) {
          setError(data.error || "Something went wrong.");
        } else {
          setResults(prev =>
            p === 0
              ? data
              : {
                  ...data,
                  businesses: [...(prev?.businesses ?? []), ...data.businesses],
                  creditsUsed: (prev?.creditsUsed ?? 0) + (data.creditsUsed ?? 5),
                  pagesUsed: (prev?.pagesUsed ?? 0) + (data.pagesUsed ?? 1),
                }
          );
          setPage(p);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error.");
    } finally {
      setLoading(false);
    }
  }, [deepScan, scanDensity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(query, 0, searchMode, strictMode);
  };

  const handleQuick = (q: string) => {
    setQuery(q);
    search(q, 0, searchMode, strictMode);
    inputRef.current?.blur();
  };

  const exportJSON = () => {
    if (!results || results.businesses.length === 0) return;
    const exportData = {
      exportedAt: new Date().toISOString(),
      query: results.query,
      location: results.ll,
      totalResults: results.businesses.length,
      businesses: results.businesses.map((biz: any) => ({
        title: biz.title,
        type: biz.type || biz.types?.[0] || null,
        rating: biz.rating || null,
        reviews: biz.reviews || null,
        phone: biz.phone || null,
        address: biz.address || null,
        website: biz.website || null,
        openState: biz.openState || null,
        priceDescription: biz.priceDescription || null,
        placeId: biz.placeId || null,
        gpsCoordinates: biz.gpsCoordinates || null,
        serviceOptions: biz.serviceOptions || [],
        workingHours: biz.workingHours || null,
        thumbnail: biz.thumbnail || null,
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pakindex_${results.query.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* Background gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* ── Header ── */}
        <header className="px-6 pt-12 pb-8 text-center max-w-3xl mx-auto w-full">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/20 border border-blue-400/20">
              🗂️
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              PakIndex
            </h1>
          </div>
          <p className="text-zinc-400 text-sm sm:text-base mb-8">
            Pakistan&apos;s HORECA Intelligence Dashboard. Search verified restaurant data instantly.
          </p>

          {/* ── Search bar ── */}
          <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
            <div className="relative flex items-center gap-3 bg-zinc-900/80 border border-white/10 p-2 rounded-2xl backdrop-blur-xl focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
              <span className="pl-4 text-zinc-400 text-xl">🔍</span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder='Try "restaurant, cafe, bakery, coffee shop"'
                className="flex-1 bg-transparent border-none outline-none text-zinc-100 placeholder:text-zinc-600 px-2 py-3 w-full"
              />
              {query && (
                <button type="button" onClick={() => { setQuery(""); setResults(null); setError(null); }} className="p-2 text-zinc-500 hover:text-zinc-300">
                  ✕
                </button>
              )}
              <button 
                type="submit"
                disabled={loading || !query.trim()}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium transition-colors shadow-lg shadow-blue-900/20"
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </form>

          {/* Quick-search chips */}
          <div className="flex flex-wrap gap-2 mt-6 justify-center">
            {QUICK_SEARCHES.map(({ label, q }) => (
              <button key={q} onClick={() => handleQuick(q)} className="text-xs px-4 py-2 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-all whitespace-nowrap">
                {label}
              </button>
            ))}
          </div>

          {/* Search Mode Selector */}
          <div className="mt-6 flex flex-col items-center gap-4">
            <div className="inline-flex rounded-xl bg-zinc-800/60 border border-white/5 p-1 gap-1">
              {[
                { mode: "standard" as SearchMode, label: "Standard", icon: "🔍", desc: "20 results" },
                { mode: "fetchAll" as SearchMode, label: "Fetch All", icon: "📄", desc: "~60-100" },
                { mode: "deepScan" as SearchMode, label: "Deep Scan", icon: "🛰️", desc: "Max data" },
              ].map(({ mode, label, icon, desc }) => (
                <button
                  key={mode}
                  onClick={() => setSearchMode(mode)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                    searchMode === mode
                      ? mode === "deepScan"
                        ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-300 border border-orange-500/30 shadow-lg shadow-orange-500/10"
                        : "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                      : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                  }`}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                  <span className="text-[10px] opacity-60">{desc}</span>
                </button>
              ))}
            </div>

            {/* Deep Scan density slider */}
            {searchMode === "deepScan" && (
              <div className="flex items-center gap-4 bg-zinc-800/40 border border-orange-500/10 rounded-xl px-5 py-3">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-orange-300">Grid Density: {scanDensity}×{scanDensity}</span>
                  <span className="text-[10px] text-zinc-500">{scanDensity * scanDensity} cells · ~{scanDensity * scanDensity * 5} credits</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={7}
                  value={scanDensity}
                  onChange={(e) => setScanDensity(parseInt(e.target.value))}
                  className="w-32 accent-orange-500"
                />
                <div className="flex gap-1">
                  {Array.from({ length: scanDensity }).map((_, r) => (
                    <div key={r} className="flex flex-col gap-0.5">
                      {Array.from({ length: scanDensity }).map((_, c) => (
                        <div key={c} className="w-1.5 h-1.5 rounded-[1px] bg-orange-500/40" />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchMode !== "standard" && (
              <p className="text-[10px] text-zinc-600 max-w-md text-center">
                {searchMode === "fetchAll"
                  ? "Auto-paginates through all available pages for a single location point. Good for focused searches."
                  : "Splits the area into a geographic grid and scans each cell independently. Best for comprehensive extraction. Use commas for multiple categories (e.g. \"restaurant, cafe, bakery\")."}
              </p>
            )}

            {/* Strict Mode Toggle */}
            <div className="flex items-center gap-3 mt-2">
              <label className="relative inline-flex items-center cursor-pointer group" htmlFor="strictModeToggle">
                <input
                  id="strictModeToggle"
                  type="checkbox"
                  checked={strictMode}
                  onChange={(e) => setStrictMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 rounded-full bg-zinc-700 peer-checked:bg-emerald-600 transition-colors relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5 after:shadow-sm" />
                <span className="ml-2.5 text-xs font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors">
                  Require Phone Numbers
                </span>
              </label>
              <span className="text-[10px] text-zinc-600 bg-zinc-800/50 px-2 py-1 rounded-md border border-white/5" title="If disabled, you will get significantly more data, but many businesses may be missing contact information.">
                ℹ️ Disable to get maximum data
              </span>
            </div>
          </div>

          {/* Deep Scan Progress */}
          {scanProgress && (
            <div className="mt-5 max-w-md mx-auto">
              <div className="bg-zinc-800/60 border border-orange-500/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-orange-300 font-medium">🛰️ Scanning grid...</span>
                  <span className="text-zinc-400">{scanProgress.cellsDone}/{scanProgress.totalCells} cells</span>
                </div>
                <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
                    style={{ width: `${(scanProgress.cellsDone / scanProgress.totalCells) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500">
                  <span>{scanProgress.totalRaw} raw results found</span>
                  <span className="font-mono">{scanProgress.currentCell}</span>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* ── Results Section ── */}
        <section className="px-4 pb-20 max-w-7xl mx-auto w-full flex-1">
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center mb-8 max-w-2xl mx-auto text-sm">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          {results && !loading && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-lg font-medium text-white">
                  {results.businesses.length} results for <span className="text-blue-400">&quot;{results.query}&quot;</span>
                </h2>
                <p className="text-sm text-zinc-500 mt-1">Found in {results.ll}</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
                  ⚡ {results.creditsUsed ?? 5} Credits · {results.pagesUsed ?? 1} {(results.pagesUsed ?? 1) === 1 ? 'Page' : 'Pages'}
                </div>
                <button
                  onClick={exportJSON}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export JSON
                </button>
              </div>
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {loading && Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            
            {results && results.businesses.map((biz, i) => (
              <BusinessCard 
                key={`${biz.title}-${i}`} 
                biz={biz} 
                onClick={() => setSelectedBiz(biz)} 
              />
            ))}
          </div>

          {/* Empty / Initial States */}
          {!loading && !error && !results && (
            <div className="py-24 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
              <div className="text-5xl mb-4">🌍</div>
              <h3 className="text-lg font-medium text-zinc-300">Discover locations</h3>
              <p className="text-sm text-zinc-500 mt-2 max-w-sm mx-auto">
                Search for any restaurant, cafe, or food business in Pakistan to see deep insights.
              </p>
            </div>
          )}

          {results && results.businesses.length === 0 && !loading && (
            <div className="py-24 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
              <div className="text-5xl mb-4">👻</div>
              <h3 className="text-lg font-medium text-zinc-300">No results found</h3>
              <p className="text-sm text-zinc-500 mt-2">Try searching a different location or category.</p>
            </div>
          )}

          {/* Pagination — only show when NOT in fetchAll mode */}
          {results && results.count === 20 && !loading && !results.fetchedAll && (
            <div className="mt-12 text-center">
              <button 
                onClick={() => search(query, page + 1)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
              >
                Load More Results <span className="text-xs text-zinc-500">(5 Credits)</span>
              </button>
            </div>
          )}

          {/* Fetch All / Deep Scan completion message */}
          {results && results.fetchedAll && !loading && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-400/80 text-sm">
                ✅ {results.businesses.length} unique businesses found
                {results.ll?.startsWith("Grid")
                  ? ` via ${results.ll} deep scan`
                  : ` across ${results.pagesUsed} pages`
                }
                {results.creditsUsed ? ` · ${results.creditsUsed} credits used` : ""}
              </div>
            </div>
          )}

        </section>

        {/* Footer */}
        <footer className="py-6 text-center border-t border-white/5 mt-auto">
          <p className="text-xs text-zinc-600">
            Powered by HasData & Google Maps · PakIndex Internal Dashboard
          </p>
        </footer>
      </div>

      {/* Modal Profile Card */}
      {selectedBiz && (
        <BusinessModal 
          biz={selectedBiz} 
          onClose={() => setSelectedBiz(null)} 
        />
      )}

      {/* Global styles for custom scrollbar within components */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}} />
    </main>
  );
}
