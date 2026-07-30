"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch("/api/admin/notifications");
      const data = await res.json();
      setItems(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch {
      // ignore — bell just stays at last known state
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function markAllRead() {
    await fetch("/api/admin/notifications/read-all", { method: "POST" });
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
  }

  async function markRead(id: string) {
    await fetch(`/api/admin/notifications/${id}`, { method: "PATCH" });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
  }

  return (
    <div className="relative z-999" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-ink-900/60 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-black/5 bg-white shadow-lg dark:border-white/10 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-black/5 px-4 py-3 dark:border-white/10">
            <p className="text-sm font-semibold text-ink-900 dark:text-gray-100">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs font-medium text-brand-700 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-ink-900/40 dark:text-gray-500">
                No notifications yet.
              </p>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  href={n.link || "#"}
                  onClick={() => !n.is_read && markRead(n.id)}
                  className={`block border-b border-black/5 px-4 py-3 text-sm last:border-0 hover:bg-gray-50 dark:border-white/10 dark:hover:bg-gray-800 ${
                    !n.is_read ? "bg-brand-50/50 dark:bg-brand-900/10" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read && <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-600" />}
                    <div className={n.is_read ? "pl-3.5" : ""}>
                      <p className="font-medium text-ink-900 dark:text-gray-100">{n.title}</p>
                      {n.body && <p className="mt-0.5 text-xs text-ink-900/60 dark:text-gray-400">{n.body}</p>}
                      <p className="mt-1 text-[11px] text-ink-900/40 dark:text-gray-500">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
          <div className="border-t border-black/5 px-4 py-2.5 text-center dark:border-white/10">
            <Link
              href="/admin/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
