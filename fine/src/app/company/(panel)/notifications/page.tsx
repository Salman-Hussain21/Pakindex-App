"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, AlertCircle, Info, Users, Store } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function notifIcon(type: string) {
  if (type?.includes("employee") || type?.includes("user")) return <Users size={16} className="text-blue-500" />;
  if (type?.includes("restaurant") || type?.includes("business")) return <Store size={16} className="text-emerald-500" />;
  if (type?.includes("error") || type?.includes("warn")) return <AlertCircle size={16} className="text-amber-500" />;
  return <Info size={16} className="text-brand-500" />;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/company/notifications")
      .then((r) => {
        if (!r.ok) throw new Error(`Error ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  async function markAllRead() {
    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    // Fire-and-forget — mark read endpoint (graceful if missing)
    await fetch("/api/company/notifications", { method: "PATCH" }).catch(() => {});
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900 dark:text-gray-100">Notifications</h1>
          <p className="mt-0.5 text-sm text-ink-900/50 dark:text-gray-400">
            {loading ? "Loading…" : unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium text-ink-900/70 hover:bg-gray-50 dark:border-white/10 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</p>
      )}

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
        {loading ? (
          <div className="px-4 py-12 text-center text-sm text-ink-900/40 dark:text-gray-500 animate-pulse">
            Loading notifications…
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
            <Bell size={40} className="mb-4 text-ink-900/10 dark:text-gray-700" />
            <p className="text-sm font-medium text-ink-900/40 dark:text-gray-500">No notifications yet</p>
            <p className="mt-1 text-xs text-ink-900/30 dark:text-gray-600">
              New openings, employee activity, and system updates will appear here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                  !n.is_read ? "bg-brand-50/40 dark:bg-brand-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }`}
              >
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  {notifIcon(n.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${!n.is_read ? "text-ink-900 dark:text-gray-100" : "text-ink-900/80 dark:text-gray-300"}`}>
                      {n.title}
                      {!n.is_read && (
                        <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-brand-500 align-middle" />
                      )}
                    </p>
                    <span className="flex-shrink-0 text-xs text-ink-900/40 dark:text-gray-500">{timeAgo(n.created_at)}</span>
                  </div>
                  {n.body && (
                    <p className="mt-0.5 text-xs text-ink-900/60 dark:text-gray-400">{n.body}</p>
                  )}
                  {n.link && (
                    <a href={n.link} className="mt-1 inline-block text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
                      View →
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}