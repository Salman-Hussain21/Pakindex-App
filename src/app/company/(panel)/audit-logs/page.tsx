"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCompanyAuditLogs } from "@/lib/company-api";

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
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const ACTION_COLORS: Record<string, string> = {
  approve:  "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300",
  reject:   "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  delete:   "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  restore:  "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  create:   "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300",
  update:   "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  assign:   "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  login:    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  logout:   "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

function summarize(log: AuditLog): string {
  const v = log.new_values || {};
  if (log.entity_type === "crm_lead") {
    if (v.stageTo) return `Lead moved: ${v.stageFrom ?? "—"} → ${v.stageTo}`;
    if (v.businessName) return v.businessName;
  }
  if (log.entity_type === "employee") {
    if (v.fullName) return v.fullName;
    if (v.passwordChanged) return "Password changed";
    if (v.statusChanged) return `Status → ${v.statusChanged}`;
  }
  if (log.entity_type === "user" && (log.action === "login" || log.action === "logout")) {
    return "Employee session";
  }
  if (v.name) return v.name;
  if (v.note) return v.note;
  return "—";
}

export default function CompanyAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data: any = await getCompanyAuditLogs({
        entityType,
        action,
        page,
        pageSize: 50,
      });
      setLogs(data.logs ?? []);
      setPagination(data.pagination ?? null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [entityType, action, page]);

  useEffect(() => { load(); }, [load]);

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [entityType, action]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900 dark:text-gray-100">Audit Logs</h1>
          <p className="mt-0.5 text-sm text-ink-900/50 dark:text-gray-400">
            {pagination ? `${pagination.total.toLocaleString()} total events` : "Loading…"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">All activity</option>
          <option value="user">User Activity</option>
          <option value="company">Company Activity</option>
          <option value="crm_lead">CRM Activity</option>
          <option value="employee">Employee Activity</option>
        </select>

        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">All actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="assign">Assign</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
        </select>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-ink-900/40 dark:bg-gray-950 dark:text-gray-500">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-ink-900/40 dark:text-gray-500 animate-pulse">
                    Loading…
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-ink-900/40 dark:text-gray-500">
                    No activity recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-900/60 dark:text-gray-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-ink-900 dark:text-gray-100">
                        {log.performed_by_name || "System"}
                      </span>
                      {log.performed_by_email && (
                        <span className="ml-1 text-xs text-ink-900/40 dark:text-gray-500">
                          ({log.performed_by_email})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${ACTION_COLORS[log.action] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize text-xs text-ink-900/60 dark:text-gray-400">
                      {log.entity_type.replace("_", " ")}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-900/60 dark:text-gray-400">
                      {summarize(log)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-black/5 px-4 py-3 dark:border-white/10">
            <p className="text-xs text-ink-900/40 dark:text-gray-500">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total.toLocaleString()} events
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/10 text-ink-900/60 hover:bg-gray-50 disabled:opacity-30 dark:border-white/10 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/10 text-ink-900/60 hover:bg-gray-50 disabled:opacity-30 dark:border-white/10 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}