"use client";

import React from "react";
import { useScraping } from "@/components/providers/ScrapingContext";
import { Radar, Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, X, StopCircle } from "lucide-react";

export default function ScrapingProgressToast() {
  const { state, toggleMinimize, closeToast, cancelScraping } = useScraping();

  if (!state.isVisible) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[99999] w-80 sm:w-96 rounded-xl border border-brand-500/30 bg-white/95 p-4 shadow-2xl backdrop-blur-md transition-all duration-300 dark:border-brand-500/40 dark:bg-gray-900/95">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {state.status === "running" ? (
            <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : state.status === "completed" ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
              <span>Grid Scraper In Progress</span>
              <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[9px] font-bold text-brand-700 dark:bg-brand-900/60 dark:text-brand-300">
                Karachi
              </span>
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
              {state.query || "Active Data Ingestion"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleMinimize}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            title={state.isMinimized ? "Expand Details" : "Minimize"}
          >
            {state.isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {state.status !== "running" && (
            <button
              onClick={closeToast}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              title="Close Notification"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Body Details (when not minimized) */}
      {!state.isMinimized && (
        <div className="mt-3 space-y-2.5 border-t border-gray-100 pt-3 dark:border-gray-800">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">
              <span>Progress</span>
              <span>{Math.round(state.progress)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className={`h-full transition-all duration-300 ${
                  state.status === "completed"
                    ? "bg-emerald-500"
                    : state.status === "error"
                    ? "bg-red-500"
                    : "bg-brand-600"
                }`}
                style={{ width: `${state.progress}%` }}
              />
            </div>
          </div>

          {/* Scraped Record Count Badge */}
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-2.5 py-1.5 text-[11px] text-gray-600 dark:bg-gray-800/60 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Radar size={13} className="text-brand-500" />
              Scraped Outlets Found:
            </span>
            <span className="font-bold text-brand-600 dark:text-brand-400">
              {state.totalScraped} Restaurants
            </span>
          </div>

          {/* Status Message */}
          <p className="text-[11px] italic text-gray-500 dark:text-gray-400 leading-tight">
            {state.statusText}
          </p>

          {/* Cancel Scraping Button (when running) */}
          {state.status === "running" && (
            <div className="pt-1">
              <button
                onClick={cancelScraping}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
              >
                <StopCircle size={14} />
                Cancel Scraping
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
