"use client";

import React, { useState } from "react";
import { Sparkles, Loader2, X, Check, Copy, AlertCircle, MessageSquare, TrendingUp, ShoppingBag } from "lucide-react";

interface AIPitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: {
    id?: string;
    name: string;
    category?: string;
    area?: string;
    city?: string;
    rating?: number | null;
    review_count?: number | null;
    price_range?: string | null;
    phone?: string | null;
    address?: string | null;
  };
}

export default function AIPitchModal({ isOpen, onClose, business }: AIPitchModalProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [aiData, setAiData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function fetchAIAnalysis() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/qualify-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          name: business.name,
          category: business.category,
          area: business.area,
          city: business.city || "Karachi",
          rating: business.rating,
          review_count: business.review_count,
          price_range: business.price_range,
          address: business.address,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze lead");
      setAiData(data.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCopyPitch() {
    if (!aiData?.romanUrduPitch) return;
    navigator.clipboard.writeText(aiData.romanUrduPitch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-black/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-md">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                PakIndex AI Sales Intelligence
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Powered by OpenRouter LLM (`openai/gpt-oss-20b`)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Business Summary Header */}
        <div className="mt-4 rounded-xl bg-brand-50/60 p-3.5 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/40">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                Target Restaurant
              </span>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">{business.name}</h4>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {business.category || "HORECA Outlet"} • {business.area || "Karachi"}
              </p>
            </div>
            {!aiData && !loading && (
              <button
                onClick={fetchAIAnalysis}
                className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-brand-700 transition-colors"
              >
                <Sparkles size={14} />
                Generate AI Intelligence
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="my-8 flex flex-col items-center justify-center py-6 text-center">
            <Loader2 size={32} className="animate-spin text-brand-600 mb-3" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Analyzing business metrics with OpenRouter AI...
            </p>
            <p className="text-xs text-gray-400 mt-1">Evaluating footfall, price tier & B2B purchasing potential</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="my-4 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* AI Results */}
        {aiData && !loading && (
          <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Score & Tier Banner */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-900/20">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <TrendingUp size={15} />
                  <span>Supplier Potential Score</span>
                </div>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                    {aiData.score}/100
                  </span>
                  <span className="rounded-full bg-emerald-200/60 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-800/80 dark:text-emerald-200">
                    {aiData.tier}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3.5 dark:border-indigo-900/50 dark:bg-indigo-900/20">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                  <ShoppingBag size={15} />
                  <span>Est. Monthly Purchasing</span>
                </div>
                <div className="mt-1.5 text-lg font-bold text-indigo-900 dark:text-indigo-200">
                  {aiData.estimatedMonthlyCapacityPKR}
                </div>
              </div>
            </div>

            {/* Recommended Catalog Categories */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Recommended Supplier Categories
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {aiData.recommendedCatalogCategories.map((cat: string, i: number) => (
                  <span
                    key={i}
                    className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    📦 {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Roman Urdu Sales Script for Field Agents */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/40 dark:bg-amber-900/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <MessageSquare size={15} />
                  <span>Field Agent Sales Script (Roman Urdu)</span>
                </div>
                <button
                  onClick={handleCopyPitch}
                  className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-900 dark:text-amber-400"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copied ? "Copied" : "Copy Script"}</span>
                </button>
              </div>
              <p className="text-xs leading-relaxed text-amber-950 dark:text-amber-200 font-medium italic">
                &ldquo;{aiData.romanUrduPitch}&rdquo;
              </p>
            </div>

            {/* Key Pitch Bullet Points */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Key Pitch Angles
              </h5>
              <ul className="space-y-1.5">
                {aiData.keyPitchPoints.map((point: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                    <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-500" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 flex justify-end border-t border-gray-100 pt-3 dark:border-gray-800">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
