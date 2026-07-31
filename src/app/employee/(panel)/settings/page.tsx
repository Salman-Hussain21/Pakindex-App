"use client";

import { useState } from "react";
import { Lock, Moon, Sun, Shield } from "lucide-react";
import { useTheme } from "@/components/employee/ThemeProvider";

export default function EmployeeSettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-montserrat)] text-xl font-bold text-ink-900 dark:text-white">Account Settings</h1>
        <p className="mt-1 text-sm text-ink-900/50 dark:text-gray-400">Manage your preferences and security credentials.</p>
      </div>

      <AppearanceCard />
      <PasswordCard />
    </div>
  );
}

function AppearanceCard() {
  const { dark, setDark } = useTheme();

  function handleToggle(value: boolean) {
    setDark(value);
    fetch("/api/employee/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ darkMode: value }),
    }).catch(() => {});
  }

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm dark:border-white/[0.06] dark:bg-[#0c120f]">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
          {dark ? <Moon size={16} className="text-indigo-600 dark:text-indigo-400" /> : <Sun size={16} className="text-indigo-600 dark:text-indigo-400" />}
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-montserrat)] text-sm font-bold text-ink-900 dark:text-white">Appearance</h2>
          <p className="text-xs text-ink-900/50 dark:text-gray-400">Choose your preferred theme for the field app.</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => handleToggle(false)}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all ${
            !dark
              ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-900/30 dark:text-brand-400"
              : "border-black/[0.08] text-ink-900/60 hover:border-black/20 dark:border-white/[0.08] dark:text-gray-400 dark:hover:border-white/20"
          }`}
        >
          <Sun size={15} /> Light Mode
        </button>
        <button
          onClick={() => handleToggle(true)}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all ${
            dark
              ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-900/30 dark:text-brand-400"
              : "border-black/[0.08] text-ink-900/60 hover:border-black/20 dark:border-white/[0.08] dark:text-gray-400 dark:hover:border-white/20"
          }`}
        >
          <Moon size={15} /> Dark Mode
        </button>
      </div>
    </div>
  );
}

function PasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      return setError("New passwords do not match.");
    }
    if (newPassword.length < 8) {
      return setError("New password must be at least 8 characters.");
    }

    setSaving(true);
    try {
      const res = await fetch("/api/employee/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password.");
      setSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full rounded-xl border border-black/[0.08] bg-gray-50 px-4 py-2.5 text-sm text-ink-900 outline-none transition-colors placeholder:text-ink-900/30 focus:border-brand-500 focus:bg-white dark:border-white/[0.08] dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-brand-500 dark:focus:bg-gray-800";

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm dark:border-white/[0.06] dark:bg-[#0c120f]">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30">
          <Shield size={16} className="text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-montserrat)] text-sm font-bold text-ink-900 dark:text-white">Change Password</h2>
          <p className="text-xs text-ink-900/50 dark:text-gray-400">Update your login credentials. Changes take effect immediately.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-900/50 dark:text-gray-400">
            Current Password
          </label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClass}
            placeholder="Enter your current password"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-900/50 dark:text-gray-400">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              placeholder="Min. 8 characters"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-900/50 dark:text-gray-400">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              placeholder="Repeat new password"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400">
            <Lock size={13} /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-400">
            ✓ {success}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 disabled:opacity-50"
          >
            <Shield size={14} />
            {saving ? "Updating…" : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
}
