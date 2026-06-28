"use client";

import { useState } from "react";
import { X, Save } from "lucide-react";

interface IntelligenceModalProps {
  businessId: string;
  leadId?: string;
  businessName: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function IntelligenceModal({ businessId, leadId, businessName, onClose, onSaved }: IntelligenceModalProps) {
  const [supplier, setSupplier] = useState("");
  const [volume, setVolume] = useState("");
  const [painPoints, setPainPoints] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await fetch("/api/employee/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          leadId,
          intelligenceData: {
            current_supplier: supplier,
            weekly_volume: volume,
            pain_points: painPoints,
            logged_at: new Date().toISOString()
          }
        })
      });
      onSaved();
    } catch (err) {
      console.error(err);
      alert("Failed to save intelligence.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-black/5 dark:border-white/10">
        <div className="flex items-center justify-between border-b border-black/5 px-6 py-4 dark:border-white/10">
          <h2 className="text-lg font-bold text-ink-900 dark:text-gray-100">Market Intelligence</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500 mb-4">Logging intel for <strong className="text-ink-900 dark:text-white">{businessName}</strong></p>
          
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900 dark:text-gray-200">Current Primary Supplier</label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="e.g. Unilever Food Solutions"
              className="w-full rounded-xl border border-black/10 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-gray-800 dark:text-white"
            />
          </div>
          
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900 dark:text-gray-200">Estimated Weekly Volume (Rs)</label>
            <select
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select Range</option>
              <option value="< 50,000">Less than 50,000</option>
              <option value="50,000 - 150,000">50,000 - 150,000</option>
              <option value="150,000 - 500,000">150,000 - 500,000</option>
              <option value="> 500,000">Greater than 500,000</option>
            </select>
          </div>
          
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900 dark:text-gray-200">Key Pain Points</label>
            <textarea
              value={painPoints}
              onChange={(e) => setPainPoints(e.target.value)}
              placeholder="e.g. Late deliveries, high prices..."
              rows={3}
              className="w-full rounded-xl border border-black/10 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-gray-800 dark:text-white resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-black/5 bg-gray-50 px-6 py-4 dark:border-white/10 dark:bg-gray-800/50 rounded-b-2xl">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <Save size={16} /> {loading ? "Saving..." : "Save Intel"}
          </button>
        </div>
      </div>
    </div>
  );
}
