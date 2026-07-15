"use client";

import { useEffect, useState, useCallback } from "react";
import { getAuditLogs } from "@/lib/admin-api";

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  created_at: string;
  performed_by_name: string | null;
  performed_by_email: string | null;
  company_name: string | null;
}

const ACTION_COLORS: Record<string, string> = {
  approve: "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300",
  reject: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  delete: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  restore: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  create: "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300",
  update: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  login: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  logout: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  import: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  export: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

function summarize(log: AuditLog): string {
  const v = log.new_values || {};
  if (log.action === "import") return `"${v.searchQuery}" — ${v.newRecords} new, ${v.duplicates} duplicate`;
  if (v.bulkAction) return `${v.bulkAction} × ${v.count} record(s)${v.reason ? ` — ${v.reason}` : ""}`;
  if (v.name) return v.name;
  if (v.companyName) return v.companyName;
  if (v.categoryName) return v.categoryName;
  if (v.passwordChanged) return "Password changed";
  if (log.entity_type === "user" && (log.action === "login" || log.action === "logout")) return "Admin session";
  return "—";
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const data: any = await getAuditLogs({ entityType, action, pageSize: 50, page: pg });
      const fetchedTotal = data.pagination?.total || data.total || 0;
      
      setLogs(data.logs || []);
      setTotal(fetchedTotal);
      // Force calculate total pages manually so the buttons always show up if total > 50
      setTotalPages(Math.ceil(fetchedTotal / 50) || 1);
      setPage(pg);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [entityType, action]);

  useEffect(() => {
    load(1);
  }, [load]);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-ink-900 dark:text-gray-100">Audit Logs</h1>

      <div className="mb-4 flex gap-2">
        <select
          value={entityType}
          onChange={(e) => { setEntityType(e.target.value); load(1); }}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">All entities</option>
          <option value="business">Business</option>
          <option value="company">Company</option>
          <option value="user">User</option>
          <option value="scrape_job">Scrape Job</option>
          <option value="territory">Territory / Area</option>
        </select>
        <select
          value={action}
          onChange={(e) => { setAction(e.target.value); load(1); }}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">All actions</option>
          <option value="approve">Approve</option>
          <option value="reject">Reject</option>
          <option value="restore">Restore</option>
          <option value="delete">Delete</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="import">Import</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
        </select>
      </div>

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-ink-900/40 dark:bg-gray-950 dark:text-gray-500">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Who</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/10">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-ink-900/40 dark:text-gray-500">Loading…</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-ink-900/40 dark:text-gray-500">No activity recorded yet.</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="whitespace-nowrap px-4 py-3 text-ink-900/60 dark:text-gray-400">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-ink-900 dark:text-gray-100">{log.performed_by_name || "System"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${ACTION_COLORS[log.action] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-900/60 capitalize dark:text-gray-400">{log.entity_type.replace("_", " ")}</td>
                  <td className="px-4 py-3 text-ink-900/70 dark:text-gray-300">{summarize(log)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-ink-900/40 dark:text-gray-500">
          Showing {total === 0 ? 0 : ((page - 1) * 50) + 1}–{Math.min(page * 50, total)} of {total.toLocaleString()} logs
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => load(1)}
              className="rounded-lg border border-black/10 px-2.5 py-1 text-xs text-ink-900 hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800">«</button>
            <button disabled={page <= 1} onClick={() => load(page - 1)}
              className="rounded-lg border border-black/10 px-2.5 py-1 text-xs text-ink-900 hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800">‹ Prev</button>
            <span className="px-3 text-xs text-ink-900/60 dark:text-gray-400">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => load(page + 1)}
              className="rounded-lg border border-black/10 px-2.5 py-1 text-xs text-ink-900 hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800">Next ›</button>
            <button disabled={page >= totalPages} onClick={() => load(totalPages)}
              className="rounded-lg border border-black/10 px-2.5 py-1 text-xs text-ink-900 hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800">»</button>
          </div>
        )}
      </div>
    </div>
  );
}