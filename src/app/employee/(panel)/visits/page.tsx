"use client";

import { useEffect, useState, useCallback } from "react";
import { Navigation, CheckCircle2, Circle, Clock } from "lucide-react";
import LogCheckinModal from "@/components/employee/LogCheckinModal";
import { getEmployeeVisits } from "@/lib/employee-api";

export default function EmployeeVisitsPage() {
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);

  const loadVisits = useCallback(() => {
    setLoading(true);
    getEmployeeVisits()
      .then((data) => {
        setVisits(data.visits || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadVisits();
  }, [loadVisits]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-900 dark:text-white">Field Route & Visits</h1>
          <p className="text-sm text-ink-900/60 dark:text-gray-400">
            Track your daily physical check-ins and client meetings.
          </p>
        </div>
        <button
          onClick={() => setCheckinModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors shadow-sm cursor-pointer"
        >
          <Navigation size={16} /> Log Check-in
        </button>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900 overflow-hidden flex-1">
        {loading ? (
          <div className="flex h-64 items-center justify-center text-gray-500 animate-pulse">Loading route history...</div>
        ) : visits.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-gray-500">
            <Navigation size={48} className="text-gray-300 dark:text-gray-700 mb-4" />
            <p className="text-sm font-medium">No field visits logged yet.</p>
            <p className="text-xs text-gray-400 mt-1">Click "Log Check-in" above to record a visit.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-ink-900 dark:text-gray-300">
              <thead className="bg-gray-50 text-xs uppercase text-ink-900/50 dark:bg-gray-800 dark:text-gray-400 border-b border-black/5 dark:border-white/10">
                <tr>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Prospect</th>
                  <th className="px-6 py-4 font-medium">Date & Time</th>
                  <th className="px-6 py-4 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {visits.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      {v.visit_completed ? (
                        <span className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400 font-medium text-xs bg-brand-50 dark:bg-brand-900/20 px-2.5 py-1 rounded-full w-fit">
                          <CheckCircle2 size={14} /> Completed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium text-xs bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full w-fit">
                          <Circle size={14} /> Unvisited / Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-ink-900 dark:text-gray-100">{v.business_name}</div>
                      <div className="text-xs text-ink-900/50 dark:text-gray-500 mt-0.5">{v.address || "No address"}</div>
                    </td>
                    <td className="px-6 py-4 text-ink-900/70 dark:text-gray-400">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Clock size={14} className="text-gray-400" />
                        {new Date(v.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-ink-900/70 dark:text-gray-400 text-xs">
                      {v.body || <span className="italic opacity-50">No notes recorded</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {checkinModalOpen && (
        <LogCheckinModal
          onClose={() => setCheckinModalOpen(false)}
          onSaved={() => {
            setCheckinModalOpen(false);
            loadVisits();
          }}
        />
      )}
    </div>
  );
}
