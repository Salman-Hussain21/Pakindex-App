"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { employeeLogin } from "@/lib/employee-api";
import { LogIn } from "lucide-react";

export default function EmployeeLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await employeeLogin(email, password);
      router.push("/employee");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white p-8 shadow-2xl dark:border-white/10 dark:bg-gray-900">
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-full.png" alt="PakIndex" className="mx-auto mb-4 h-10 w-auto dark:brightness-0 dark:invert" />
          <h1 className="text-xl font-bold text-ink-900 dark:text-gray-100">Field Agent Portal</h1>
          <p className="mt-1 text-sm text-ink-900/60 dark:text-gray-400">Sign in to access your territory</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}
          
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900 dark:text-gray-200">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-black/10 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-gray-800 dark:text-white dark:focus:border-brand-400 dark:focus:bg-gray-900"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900 dark:text-gray-200">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-black/10 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-gray-800 dark:text-white dark:focus:border-brand-400 dark:focus:bg-gray-900"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-600"
          >
            {loading ? "Signing in..." : <><LogIn size={18} /> Sign In</>}
          </button>
        </form>
      </div>
    </div>
  );
}
