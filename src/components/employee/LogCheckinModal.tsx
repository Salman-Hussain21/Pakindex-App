"use client";

import { useEffect, useState } from "react";
import { X, Navigation, CheckCircle2 } from "lucide-react";
import { getEmployeeCRMLeads, toggleLeadVisit, addLeadNote } from "@/lib/employee-api";

interface LeadOption {
  id: string;
  business_name: string;
  address: string | null;
}

export default function LogCheckinModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [notes, setNotes] = useState("");
  const [completed, setCompleted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEmployeeCRMLeads()
      .then((data) => {
        setLeads(data.leads || []);
        if (data.leads && data.leads.length > 0) {
          setSelectedLeadId(data.leads[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLeadId) return;
    setSaving(true);
    setError(null);

    let locationData: { lat?: number; lng?: number } | undefined = undefined;

    if (typeof window !== "undefined" && "geolocation" in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
        });
        locationData = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch (e) {
        // Geolocation denied or timed out, continue without location
      }
    }

    try {
      // 1. Mark visit with GPS coordinates
      const res: any = await toggleLeadVisit(selectedLeadId, completed, locationData);

      // 2. Add note if present
      if (notes.trim()) {
        await addLeadNote(selectedLeadId, `Check-in Visit Note: "${notes.trim()}"`);
      }

      if (res?.isGeofencedVerified) {
        alert("📍 Visit Verified On-Site via GPS!");
      }
      onSaved();
    } catch (err: any) {
      setError(err.message || "Failed to log check-in.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/5 dark:border-white/10 max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Navigation className="text-brand-600 dark:text-brand-400" size={18} />
            <h2 className="text-base font-bold text-ink-900 dark:text-white">Log Field Visit / Check-in</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">{error}</div>
        )}

        {loading ? (
          <div className="p-8 text-center text-xs text-gray-400 animate-pulse">Loading assigned restaurants...</div>
        ) : leads.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-400">
            No assigned restaurants in your pipeline to log check-ins for. Add prospects first!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Select Restaurant / Prospect *
              </label>
              <select
                required
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="w-full border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs outline-none focus:border-brand-500 bg-white dark:bg-gray-800 text-ink-900 dark:text-white"
              >
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.business_name} {l.address ? `(${l.address})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Visit Outcome / Status
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2 cursor-pointer flex-1 justify-center">
                  <input
                    type="radio"
                    name="completed"
                    checked={completed === true}
                    onChange={() => setCompleted(true)}
                    className="accent-emerald-600"
                  />
                  Visit Completed
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 cursor-pointer flex-1 justify-center">
                  <input
                    type="radio"
                    name="completed"
                    checked={completed === false}
                    onChange={() => setCompleted(false)}
                    className="accent-amber-600"
                  />
                  Unvisited / Follow-up
                </label>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Visit Notes & Observation
              </label>
              <textarea
                rows={3}
                placeholder="Spoke with manager, demonstrated product sample, requested price quote..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs outline-none focus:border-brand-500 bg-white dark:bg-gray-800 text-ink-900 dark:text-white resize-none"
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
                disabled={saving || !selectedLeadId}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : "Record Visit"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
