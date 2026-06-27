"use client";

import { useEffect, useState } from "react";

interface CompanyMetadata {
  id: string;
  name: string;
  slug: string;
  industry: string;
  status: string;
  plan: string;
  created_at: string;
}

interface TerritoryArea {
  id: string;
  name: string;
  city: string;
}

export default function CompanyProfileModule() {
  const [profile, setProfile] = useState<CompanyMetadata | null>(null);
  const [territories, setTerritories] = useState<TerritoryArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states matching database columns
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  function loadCompanyProfile() {
    fetch("/api/company/profile")
      .then((res) => {
        if (!res.ok) throw new Error("Could not retrieve company profile information.");
        return res.json();
      })
      .then((data) => {
        setProfile(data.profile);
        setTerritories(data.territories || []);
        setName(data.profile.name || "");
        setIndustry(data.profile.industry || "");
        setLoading(false);
      })
      .catch((err) => {
        setGlobalError(err.message);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadCompanyProfile();
  }, []);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setFormSubmitting(true);
    setGlobalError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/company/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, industry }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile changes.");

      setSuccessMessage("Company profile settings updated successfully.");
      loadCompanyProfile();
    } catch (err: any) {
      setGlobalError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs animate-pulse min-h-screen flex items-center justify-center">
        Fetching company registration profiles...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 font-sans antialiased text-slate-900 bg-slate-50/50 min-h-screen">
      {/* Header Panel */}
      <div className="border-b border-slate-200/60 pb-5">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Company Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">Manage your workspace identity, coordinate corporate metrics, and review active premium subscriptions.</p>
      </div>

      {/* Status Notifications */}
      {globalError && <p className="text-xs text-rose-600 bg-rose-50 px-4 py-3 rounded-xl border border-rose-100">{globalError}</p>}
      {successMessage && <p className="text-xs text-emerald-600 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100">{successMessage}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Editing Layout Block */}
        <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4">Corporate Identity Parameters</h3>
          
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Legal Business Name *</label>
                <input 
                  type="text" 
                  required 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-all" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Industry Operational Scope *</label>
                <input 
                  type="text" 
                  required 
                  value={industry} 
                  onChange={(e) => setIndustry(e.target.value)} 
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-all" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Workspace Slug Identifier</label>
                <input type="text" disabled value={profile?.slug || ""} className="w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-400 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">System Status Context</label>
                <input type="text" disabled value={profile?.status || ""} className="w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-400 uppercase tracking-wider font-semibold cursor-not-allowed" />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button type="submit" disabled={formSubmitting} className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-50 shadow-sm">
                {formSubmitting ? "Saving Changes..." : "Save Profile Settings"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Info Panels: Subscription & Territories */}
        <div className="space-y-6">
          {/* Subscription Status Card */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-900 mb-3">Subscription Status</h3>
            <p className="text-xs text-slate-400 mb-4">Your current operational workspace subscription context.</p>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-xs font-semibold text-slate-600">Current Plan</span>
              <span className="inline-flex items-center rounded-md bg-brand-50 border border-brand-200 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-brand-700">
                {profile?.plan || "Basic"} Tier
              </span>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-400 space-y-1.5">
              <div className="flex justify-between"><span>Account ID:</span><span className="font-mono text-slate-600">{profile?.id ? `${profile.id.substring(0, 8)}...` : "N/A"}</span></div>
              <div className="flex justify-between"><span>Registration Context:</span><span>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/A"}</span></div>
            </div>
          </div>

          {/* Mapped Territories Card */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">Assigned Territories</h3>
            <p className="text-xs text-slate-400 mb-3">Operational regions linked to your profile.</p>

            {territories.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 text-center">No mapped territories configured.</p>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {territories.map((area) => (
                  <li key={area.id} className="flex items-center justify-between text-xs bg-slate-50/60 border border-slate-200/60 p-2.5 rounded-xl">
                    <span className="font-semibold text-slate-700">{area.name}</span>
                    <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">{area.city}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}