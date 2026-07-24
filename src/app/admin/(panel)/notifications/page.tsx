"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

const TYPE_COLORS: Record<string, string> = {
  new_scrape:    "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  new_approval:  "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300",
  new_crm:       "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  company_activity: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  system_alert:  "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  lead_assigned: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  new_restaurant:"bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState("");

  const load = useCallback(async (pg: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/notifications?full=true&page=${pg}`);
      const data = await res.json();
      setItems(data.notifications || []);
      setUnread(data.unreadCount || 0);
      setTotal(data.total || 0);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  async function markAllRead() {
    await fetch("/api/admin/notifications/read-all", { method: "POST" });
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
  }

  async function markRead(id: string) {
    await fetch(`/api/admin/notifications/${id}`, { method: "PATCH" });
    setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnread(u => Math.max(0, u - 1));
  }

  const filtered = items.filter(n => {
    if (filter === "unread" && n.is_read) return false;
    if (typeFilter && n.type !== typeFilter) return false;
    return true;
  });

  const uniqueTypes = [...new Set(items.map(n => n.type))];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900 dark:text-gray-100">Notifications</h1>
          <p className="mt-0.5 text-sm text-ink-900/50 dark:text-gray-400">
            {total} total · {unread} unread
          </p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
            Mark all read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        <div className="flex rounded-lg border border-black/10 dark:border-white/10 overflow-hidden">
          {(["all", "unread"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm font-medium capitalize ${filter === f
                ? "bg-brand-600 text-white"
                : "bg-white text-ink-900/70 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"}`}>
              {f}
            </button>
          ))}
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm text-ink-900 outline-none dark:border-white/10 dark:bg-gray-800 dark:text-gray-100">
          <option value="">All types</option>
          {uniqueTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-ink-900/40 dark:text-gray-500">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 bg-white py-16 text-center dark:border-white/10 dark:bg-gray-900">
          <p className="text-sm font-medium text-ink-900/50 dark:text-gray-400">No notifications yet.</p>
          <p className="mt-1 text-xs text-ink-900/30 dark:text-gray-600">They will appear here as you approve businesses, create companies, and run scrapes.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => (
            <div key={n.id}
              className={`flex gap-3 rounded-xl border p-4 transition-colors ${
                !n.is_read
                  ? "border-brand-200 bg-brand-50/50 dark:border-brand-900/40 dark:bg-brand-900/10"
                  : "border-black/5 bg-white dark:border-white/10 dark:bg-gray-900"}`}>

              <div className="mt-0.5 flex-shrink-0">
                {!n.is_read && <span className="mt-1.5 block h-2 w-2 rounded-full bg-brand-600" />}
                {n.is_read && <span className="mt-1.5 block h-2 w-2 rounded-full bg-transparent" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium ${n.is_read ? "text-ink-900/80 dark:text-gray-300" : "text-ink-900 dark:text-gray-100"}`}>
                    {n.title}
                  </p>
                  <span className="flex-shrink-0 text-xs text-ink-900/40 dark:text-gray-500">{timeAgo(n.created_at)}</span>
                </div>
                {n.body && <p className="mt-0.5 text-sm text-ink-900/60 dark:text-gray-400">{n.body}</p>}
                <div className="mt-2 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${TYPE_COLORS[n.type] || "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
                    {n.type.replace(/_/g, " ")}
                  </span>
                  {n.link && (
                    <Link href={n.link} className="text-xs font-medium text-brand-700 hover:underline dark:text-brand-400">
                      View →
                    </Link>
                  )}
                  {!n.is_read && (
                    <button onClick={() => markRead(n.id)}
                      className="text-xs text-ink-900/40 hover:text-ink-900 dark:text-gray-500 dark:hover:text-gray-300">
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 100 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-ink-900/50 dark:text-gray-400">
            Page {page} of {Math.ceil(total / 100)}
          </p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="rounded-lg border border-black/10 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-white/10 dark:text-gray-200">
              ← Prev
            </button>
            <button disabled={page >= Math.ceil(total / 100)} onClick={() => setPage(p => p + 1)}
              className="rounded-lg border border-black/10 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-white/10 dark:text-gray-200">
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
