import fs from "fs";
import path from "path";
import Link from "next/link";
import { determineBusinessStatus } from "@/lib/detectors";

// ── Types ──────────────────────────────────────────────────────────────────
type ProcessedBusiness = {
  id: string;
  title: string;
  thumbnail: string | null;
  address: string;
  category: string;
  statusData: ReturnType<typeof determineBusinessStatus>;
};

// ── Data Loader ────────────────────────────────────────────────────────────
async function loadData(): Promise<{ open: ProcessedBusiness[], closed: ProcessedBusiness[] }> {
  const filePath = path.join(process.cwd(), "hasdata_output_test.json");
  const fileContent = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(fileContent);
  const businesses = data.localResults || [];

  const open: ProcessedBusiness[] = [];
  const closed: ProcessedBusiness[] = [];

  businesses.forEach((biz: any) => {
    const statusData = determineBusinessStatus(biz);
    
    const processed: ProcessedBusiness = {
      id: biz.placeId || biz.dataId || Math.random().toString(),
      title: biz.title || "Unknown",
      thumbnail: biz.thumbnail || null,
      address: biz.address || "No address provided",
      category: biz.type || biz.types?.[0] || "Restaurant",
      statusData,
    };

    if (statusData.status === "NEW_OPENING" || statusData.status === "ACTIVE") {
      open.push(processed);
    } else {
      closed.push(processed);
    }
  });

  return { open, closed };
}

// ── Component ──────────────────────────────────────────────────────────────
export default async function TrendsDashboard() {
  const { open, closed } = await loadData();

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-blue-500/30 selection:text-blue-200 p-4 md:p-8">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <Link href="/" className="text-zinc-500 hover:text-zinc-300 text-sm flex items-center gap-2 mb-4 transition-colors">
              <span>←</span> Back to Map
            </Link>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
              Market Trends
            </h1>
            <p className="text-zinc-400 mt-2 text-lg">
              Automated Opening & Closure Detection based on 30-day activity.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
              <span className="block text-emerald-400 text-sm font-semibold">Active Openings</span>
              <span className="text-2xl font-bold">{open.length}</span>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl">
              <span className="block text-red-400 text-sm font-semibold">Flagged Closures</span>
              <span className="text-2xl font-bold">{closed.length}</span>
            </div>
          </div>
        </header>

        {/* Board Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* OPEN COLUMN */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
              🟢 Recently Active <span className="text-sm font-normal text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">{open.length}</span>
            </h2>
            <div className="flex flex-col gap-4">
              {open.map(biz => (
                <BusinessCard key={biz.id} biz={biz} />
              ))}
              {open.length === 0 && (
                <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02] text-zinc-500">
                  No active businesses found.
                </div>
              )}
            </div>
          </div>

          {/* CLOSED COLUMN */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold text-red-400 flex items-center gap-2">
              🔴 Inactive / Closed <span className="text-sm font-normal text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">{closed.length}</span>
            </h2>
            <div className="flex flex-col gap-4">
              {closed.map(biz => (
                <BusinessCard key={biz.id} biz={biz} />
              ))}
              {closed.length === 0 && (
                <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02] text-zinc-500">
                  No closures detected.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Shared Card Component ──────────────────────────────────────────────────
function BusinessCard({ biz }: { biz: ProcessedBusiness }) {
  const isOpen = biz.statusData.status === "NEW_OPENING" || biz.statusData.status === "ACTIVE";
  const badgeColor = isOpen ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30";
  
  return (
    <div className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-2xl p-4 sm:p-5 transition-all group flex flex-col gap-4 shadow-lg shadow-black/20">
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-zinc-800 border border-white/10 flex-shrink-0">
          {biz.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={biz.thumbnail} alt={biz.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-lg font-semibold text-zinc-100 truncate">{biz.title}</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${badgeColor} whitespace-nowrap`}>
              {biz.statusData.status}
            </span>
          </div>
          <p className="text-sm text-zinc-400 truncate mt-0.5">{biz.category}</p>
          <p className="text-xs text-zinc-500 truncate mt-1 max-w-[90%]">{biz.address}</p>
        </div>
      </div>

      {/* Reason Footer */}
      <div className={`mt-auto text-xs px-3 py-2 rounded-lg border ${isOpen ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-300/80' : 'bg-red-500/5 border-red-500/10 text-red-300/80'}`}>
        ℹ️ {biz.statusData.reason}
      </div>
    </div>
  );
}
