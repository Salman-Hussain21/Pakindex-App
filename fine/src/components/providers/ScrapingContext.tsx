"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface ScrapingState {
  isScraping: boolean;
  query: string;
  progress: number;
  totalScraped: number;
  status: "idle" | "running" | "completed" | "error";
  statusText: string;
  isMinimized: boolean;
  isVisible: boolean;
  cancelled: boolean;
}

interface ScrapingContextType {
  state: ScrapingState;
  startScraping: (query: string) => void;
  updateProgress: (progress: number, totalScraped: number, statusText?: string) => void;
  finishScraping: (totalScraped: number, statusText?: string) => void;
  failScraping: (errorMsg: string) => void;
  cancelScraping: () => void;
  toggleMinimize: () => void;
  closeToast: () => void;
}

const defaultState: ScrapingState = {
  isScraping: false,
  query: "",
  progress: 0,
  totalScraped: 0,
  status: "idle",
  statusText: "",
  isMinimized: false,
  isVisible: false,
  cancelled: false,
};

const ScrapingContext = createContext<ScrapingContextType>({
  state: defaultState,
  startScraping: () => {},
  updateProgress: () => {},
  finishScraping: () => {},
  failScraping: () => {},
  cancelScraping: () => {},
  toggleMinimize: () => {},
  closeToast: () => {},
});

export const ScrapingProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<ScrapingState>(defaultState);

  // Restore state from localStorage if job was active
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pakindex_active_scrape");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isScraping && parsed.status === "running") {
          setState(parsed);
        }
      }
    } catch (e) {
      console.warn("Could not parse saved scraping state:", e);
    }
  }, []);

  // Save active scraping state
  useEffect(() => {
    if (state.isScraping || state.isVisible) {
      try {
        localStorage.setItem("pakindex_active_scrape", JSON.stringify(state));
      } catch (e) {}
    } else {
      localStorage.removeItem("pakindex_active_scrape");
    }
  }, [state]);

  const startScraping = (query: string) => {
    setState({
      isScraping: true,
      query,
      progress: 5,
      totalScraped: 0,
      status: "running",
      statusText: `Initializing Karachi OSM/Google scrape for "${query}"...`,
      isMinimized: false,
      isVisible: true,
      cancelled: false,
    });
  };

  const updateProgress = (progress: number, totalScraped: number, statusText?: string) => {
    setState((prev) => {
      if (prev.cancelled) return prev;
      return {
        ...prev,
        progress: Math.min(99, Math.max(prev.progress, progress)),
        totalScraped,
        statusText: statusText || prev.statusText,
      };
    });
  };

  const finishScraping = (totalScraped: number, statusText?: string) => {
    setState((prev) => ({
      ...prev,
      isScraping: false,
      progress: 100,
      totalScraped,
      status: "completed",
      statusText: statusText || `Scraping completed! ${totalScraped} outlets saved to database.`,
      isVisible: true,
    }));
  };

  const failScraping = (errorMsg: string) => {
    setState((prev) => ({
      ...prev,
      isScraping: false,
      status: "error",
      statusText: errorMsg || "Scraping job failed.",
      isVisible: true,
    }));
  };

  const cancelScraping = () => {
    setState((prev) => ({
      ...prev,
      isScraping: false,
      status: "error",
      statusText: "Scraping cancelled by user.",
      cancelled: true,
      isVisible: true,
    }));
  };

  const toggleMinimize = () => {
    setState((prev) => ({ ...prev, isMinimized: !prev.isMinimized }));
  };

  const closeToast = () => {
    setState((prev) => ({ ...prev, isVisible: false }));
  };

  return (
    <ScrapingContext.Provider
      value={{
        state,
        startScraping,
        updateProgress,
        finishScraping,
        failScraping,
        cancelScraping,
        toggleMinimize,
        closeToast,
      }}
    >
      {children}
    </ScrapingContext.Provider>
  );
};

export const useScraping = () => useContext(ScrapingContext);
