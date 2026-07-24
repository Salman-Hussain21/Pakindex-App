"use client";

import { useEffect, useState } from "react";
import { X, Search, Plus, CheckCircle2, Building2 } from "lucide-react";
import { getProspects, claimProspect } from "@/lib/employee-api";

interface Prospect {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  category_name: string | null;
  area_name: string | null;
}

export default function NewProspectModal({
  onClose,
  onClaimed,
}: {
  onClose: () => void;
  onClaimed: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"available" | "custom">("available");
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // Custom prospect form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [savingCustom, setSavingCustom] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProspects = () => {
    setLoading(true);
    getProspects(search)
      .then((data) => setProspects(data.prospects || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(loadProspects, 250);
    return () => clearTimeout(timer);
  }, [search]);

  async function handleClaim(p: Prospect) {
    setClaimingId(p.id);
    try {
      await claimProspect({ businessId: p.id });
      onClaimed();
    } catch (err: any) {
      alert(err.message || "Failed to claim prospect.");
    } finally {
      setClaimingId(null);
    }
  }

  async function handleCreateCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSavingCustom(true);
    setError(null);
    try {
      await claimProspect({ name: name.trim(), phone: phone.trim(), address: address.trim() });
      onClaimed();
    } catch (err: any) {
      setError(err.message || "Failed to create prospect.");
    } finally {
      setSavingCustom(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/5 dark:border-white/10 max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 p-5">
          <div>
            <h2 className="text-base font-bold text-ink-900 dark:text-white">Add New Prospect</h2>
            <p className="text-xs text-gray-400 mt-0.5">Claim existing territory listings or add a new restaurant.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-black/5 dark:border-white/10 bg-gray-50 dark:bg-gray-800/50 px-5 pt-2 gap-2">
          <button
            onClick={() => setActiveTab("available")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "available"
                ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Claim from Territory
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "custom"
                ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Create Custom Entry
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 flex-1 overflow-y-auto">
          {activeTab === "available" ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-gray-800 px-3 py-2">
                <Search size={15} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search unassigned restaurants in your area..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-xs bg-transparent outline-none text-ink-900 dark:text-white"
                />
              </div>

              {loading ? (
                <div className="p-8 text-center text-xs text-gray-400 animate-pulse">Searching available listings…</div>
              ) : prospects.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  No unassigned restaurants found matching your query. Switch to "Create Custom Entry" tab to add one manually.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {prospects.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-gray-800 hover:border-brand-200 transition-colors"
                    >
                      <div>
                        <p className="text-xs font-bold text-ink-900 dark:text-white">{p.name}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {p.category_name || "Restaurant"} {p.area_name ? `· ${p.area_name}` : ""}
                        </p>
                        {p.address && <p className="text-[10px] text-gray-400 truncate max-w-xs">{p.address}</p>}
                      </div>
                      <button
                        onClick={() => handleClaim(p)}
                        disabled={claimingId === p.id}
                        className="flex items-center gap-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3 py-1.5 disabled:opacity-50 transition-colors"
                      >
                        <Plus size={13} /> {claimingId === p.id ? "Claiming…" : "Add Lead"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleCreateCustom} className="space-y-3">
              {error && (
                <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">{error}</div>
              )}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Spice Restaurant"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs outline-none focus:border-brand-500 bg-white dark:bg-gray-800 text-ink-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="+92 300 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs outline-none focus:border-brand-500 bg-white dark:bg-gray-800 text-ink-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Address (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Shop #12, Block 4, Clifton, Karachi"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs outline-none focus:border-brand-500 bg-white dark:bg-gray-800 text-ink-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCustom || !name.trim()}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors"
                >
                  {savingCustom ? "Adding..." : "Add to My Pipeline"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
