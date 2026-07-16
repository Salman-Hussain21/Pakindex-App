"use client";

import { useEffect, useState } from "react";
import { CreditCard, Zap, Building } from "lucide-react";
import { getCompanyBilling } from "@/lib/company-api";

interface BillingData {
  name: string;
  plan: string;
  plan_expires_at: string | null;
  max_employees: number;
  max_territories: number;
  active_employees: number;
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [territoriesUsed, setTerritoriesUsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getCompanyBilling(),
      fetch("/api/company/areas").then(r => r.json()),
    ])
      .then(([billing, areasData]) => {
        setData(billing);
        setTerritoriesUsed((areasData.areas || []).length);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (error) {
    return <div className="p-6 text-sm font-medium text-red-600">{error}</div>;
  }

  if (loading || !data) {
    return <div className="p-6 text-sm text-ink-900/50 dark:text-gray-400 animate-pulse">Loading billing details...</div>;
  }

  const employeeUsagePercent = Math.min(100, Math.round((data.active_employees / data.max_employees) * 100)) || 0;
  
  // Format expiration date
  const expiresText = data.plan_expires_at 
    ? new Date(data.plan_expires_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : "Never";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900 dark:text-gray-100">Billing & Subscriptions</h1>
          <p className="mt-0.5 text-sm text-ink-900/50 dark:text-gray-400">
            Manage your subscription plan, payment methods, and billing history.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Current Plan Card */}
        <div className="col-span-1 lg:col-span-2 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
          <div className="border-b border-black/5 px-5 py-4 dark:border-white/10">
            <h2 className="text-sm font-semibold text-ink-900 dark:text-gray-100">Current Plan Overview</h2>
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold uppercase text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                  <Zap size={14} /> {data.plan} Plan
                </span>
                <p className="mt-3 text-3xl font-bold text-ink-900 dark:text-gray-100 capitalize">
                  {data.plan}
                </p>
                <p className="mt-2 text-sm text-ink-900/60 dark:text-gray-400">
                  Your plan renews on <strong>{expiresText}</strong>.
                </p>
              </div>
              <button className="rounded-lg bg-ink-900 px-4 py-2 text-sm font-medium text-white hover:bg-ink-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200">
                Upgrade Plan
              </button>
            </div>

            <div className="mt-6 border-t border-black/5 pt-6 dark:border-white/10">
              <h3 className="mb-4 text-sm font-semibold text-ink-900 dark:text-gray-100">Plan Usage</h3>
              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-ink-900 dark:text-gray-200">Employee Accounts</span>
                    <span className="text-ink-900/60 dark:text-gray-400">{data.active_employees} / {data.max_employees} used</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${employeeUsagePercent}%` }} />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-ink-900 dark:text-gray-200">Territories / Assigned Areas</span>
                    <span className="text-ink-900/60 dark:text-gray-400">{territoriesUsed} / {data.max_territories} used</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, data.max_territories > 0 ? Math.round((territoriesUsed / data.max_territories) * 100) : 0)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
            <div className="border-b border-black/5 px-5 py-4 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink-900 dark:text-gray-100">Payment Method</h2>
              <button className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">Edit</button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 rounded-xl border border-black/5 bg-gray-50 p-4 dark:border-white/10 dark:bg-gray-800/50">
                <CreditCard className="text-ink-900/40 dark:text-gray-500" size={24} />
                <div>
                  <p className="text-sm font-medium text-ink-900 dark:text-gray-200">Invoice Billing</p>
                  <p className="text-xs text-ink-900/50 dark:text-gray-400">Via Bank Transfer</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
            <div className="border-b border-black/5 px-5 py-4 dark:border-white/10">
              <h2 className="text-sm font-semibold text-ink-900 dark:text-gray-100">Company Information</h2>
            </div>
            <div className="p-5 text-sm text-ink-900/70 dark:text-gray-300">
              <div className="flex items-center gap-2 mb-2">
                <Building size={16} className="text-ink-900/40 dark:text-gray-500" />
                <span className="font-medium">{data.name}</span>
              </div>
              <p>Verified Corporate Account</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
