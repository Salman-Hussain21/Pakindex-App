"use client";

import { useEffect, useState } from "react";
import { Download, Link as LinkIcon, Database, Key } from "lucide-react";
import { getCompanyBilling } from "@/lib/company-api";

export default function IntegrationsPage() {
  const [plan, setPlan] = useState<string>("trial");
  const [loading, setLoading] = useState(true);
  const [exportRange, setExportRange] = useState("all");

  useEffect(() => {
    getCompanyBilling()
      .then((res) => {
        setPlan(res.plan);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleExport = () => {
    // Trigger download by setting window.location or creating an anchor tag
    window.location.href = `/api/company/export?range=${exportRange}&format=csv`;
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900 dark:text-gray-100">Data & Integrations</h1>
          <p className="mt-0.5 text-sm text-ink-900/50 dark:text-gray-400">
            Export your territory data or connect PakIndex to your internal CRM/ERP systems.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Data Export */}
        <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
          <div className="border-b border-black/5 px-5 py-4 dark:border-white/10 flex items-center gap-2">
            <Download size={18} className="text-ink-900/60 dark:text-gray-400" />
            <h2 className="text-sm font-semibold text-ink-900 dark:text-gray-100">Manual Data Export</h2>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm text-ink-900/70 dark:text-gray-300">
              Download your matched territory records in CSV or Excel format for offline analysis or manual import into your systems.
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-ink-900/40 dark:text-gray-500">
                  Data Range
                </label>
                <select 
                  className="w-full rounded-lg border border-black/10 bg-gray-50 px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
                  value={exportRange}
                  onChange={(e) => setExportRange(e.target.value)}
                >
                  <option value="all">All My Territory Records</option>
                  <option value="new">New Restaurants (Last 30 Days)</option>
                  <option value="crm" disabled>My CRM Entries</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-ink-900/40 dark:text-gray-500">
                  Format
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-sm text-ink-900 dark:text-gray-200">
                    <input type="radio" name="format" defaultChecked className="accent-brand-600" /> CSV
                  </label>
                  <label className="flex items-center gap-2 text-sm text-ink-900 dark:text-gray-200">
                    <input type="radio" name="format" className="accent-brand-600" /> Excel (.xlsx)
                  </label>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleExport}
              className="mt-2 w-full rounded-lg bg-ink-900 py-2.5 text-sm font-medium text-white hover:bg-ink-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
            >
              Generate Export File
            </button>
          </div>
        </div>

        {/* API & Webhooks */}
        <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
          <div className="border-b border-black/5 px-5 py-4 dark:border-white/10 flex items-center gap-2">
            <LinkIcon size={18} className="text-ink-900/60 dark:text-gray-400" />
            <h2 className="text-sm font-semibold text-ink-900 dark:text-gray-100">API & Webhooks</h2>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm text-ink-900/70 dark:text-gray-300">
              Programmatically sync restaurant intelligence directly into your Salesforce, SAP, or custom PHP/MySQL ERP systems.
            </p>
            
            {plan !== "enterprise" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-900/10">
                <div className="flex items-start gap-3">
                  <Database className="mt-0.5 text-amber-600 dark:text-amber-400" size={18} />
                  <div>
                    <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">API Access Requires Enterprise Plan</h3>
                    <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-400/80">
                      Your current <span className="capitalize">{plan}</span> Plan does not include raw REST API access. Please contact your account manager to upgrade if you need automated syncing.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/30 dark:bg-emerald-900/10">
                <div className="flex items-start gap-3">
                  <Database className="mt-0.5 text-emerald-600 dark:text-emerald-400" size={18} />
                  <div>
                    <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">API Access Enabled</h3>
                    <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-400/80">
                      You have full access to the PakIndex Data API. Use the key below to authenticate your requests.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className={`space-y-3 pt-2 ${plan !== 'enterprise' ? 'opacity-50 pointer-events-none' : ''}`}>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-ink-900/40 dark:text-gray-500">
                  Your API Key
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-black/10 bg-gray-50 px-3 py-2 dark:border-white/10 dark:bg-gray-800">
                  <Key size={14} className="text-gray-400" />
                  <span className="text-sm font-mono text-gray-500">
                    {plan === 'enterprise' ? 'pk_live_8f92a3b1c4d5e6f7g8h9i0j' : 'pk_live_*************************'}
                  </span>
                </div>
              </div>
              <button className="w-full rounded-lg border border-black/10 bg-white py-2 text-sm font-medium text-ink-900 shadow-sm dark:border-white/10 dark:bg-gray-800 dark:text-gray-200">
                View API Documentation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
