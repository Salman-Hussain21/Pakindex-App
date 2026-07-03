"use client";

import { useEffect, useState } from "react";

type Tab = "profile" | "security";

interface Category {
  id: number;
  name: string;
}

interface Area {
  id: number;
  name: string;
  city_name?: string;
}

interface CompanyProfileData {
  id: string;
  name: string;
  legal_name: string | null;
  industry: string | null;
  email: string;
  phone: string | null;
  status: string;
  plan: string;
  max_employees: number;
  employee_count: number;
  created_at: string;
  categories?: Category[];
  company_categories?: Category[];
  areas?: Area[];
  territories?: Area[];
  company_areas?: Area[];
}


export default function CompanySettingsDashboard() {
  const [tab, setTab] = useState<Tab>("profile");

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Workspace Settings</h1>
        <p className="text-xs text-slate-400">View corporate indicators, check regional jurisdictions, or update security parameters.</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
        {([
          ["profile", "Company Profile Summary"],
          ["security", "Change Password Security"],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              tab === key
                ? "bg-white text-brand-700 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {tab === "profile" && <ReadOnlyProfileTab />}
        {tab === "security" && <SecuritySettingsTab />}
      </div>
    </div>
  );
}

function ReadOnlyProfileTab() {
  const [profile, setProfile] = useState<CompanyProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/company/profile")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load workspace dimensions.");
        return res.json();
      })
      .then((data) => {
        // Fallback validation layout to cleanly capture root keys or nested objects safely
        const targetProfile = data.profile || data;
        
        if (targetProfile) {
          const resolvedCategories = data.categories || targetProfile.categories || data.company_categories || targetProfile.company_categories || [];
          const resolvedAreas = data.territories || data.areas || targetProfile.areas || data.company_areas || targetProfile.company_areas || [];
          
          setProfile({
            ...targetProfile,
            // Fallback checking to match your custom payload variants safely
            employee_count: targetProfile.employee_count ?? data.employee_count ?? data.seatsUtilized ?? targetProfile.seatsUtilized ?? 0,
            categories: resolvedCategories,
            areas: resolvedAreas,
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-6 text-xs text-slate-400 animate-pulse text-center">Loading workspace profiles...</div>;
  if (error) return <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700">{error}</p>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-2xl border border-black/5 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-800 mb-2">Corporate Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Workspace Brand Name</span>
            <div className="mt-1 px-3 py-2 bg-gray-50 border border-black/5 rounded-lg text-xs font-medium text-slate-700 select-all">{profile?.name || "—"}</div>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Legal Name</span>
            <div className="mt-1 px-3 py-2 bg-gray-50 border border-black/5 rounded-lg text-xs font-medium text-slate-700 select-all">{profile?.legal_name || "—"}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Official Email Contact</span>
            <div className="mt-1 px-3 py-2 bg-gray-50 border border-black/5 rounded-lg text-xs font-medium text-slate-700 select-all">{profile?.email || "—"}</div>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Official Phone Line</span>
            <div className="mt-1 px-3 py-2 bg-gray-50 border border-black/5 rounded-lg text-xs font-medium text-slate-700 select-all">{profile?.phone || "—"}</div>
          </div>
        </div>

        <div>
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Industry Vertical Sector</span>
          <div className="mt-1 px-3 py-2 bg-gray-50 border border-black/5 rounded-lg text-xs font-medium text-slate-700">{profile?.industry || "—"}</div>
        </div>

        {/* Dynamic Classifications Display */}
        <div className="pt-2">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Operations Classifications</span>
          <div className="flex flex-wrap gap-1.5">
            {!profile?.categories || profile.categories.length === 0 ? (
              <span className="text-xs text-slate-400 italic">No category tags mapped.</span>
            ) : (
              profile.categories.map((cat) => (
                <span key={cat.id} className="px-2.5 py-1 rounded-md bg-slate-100 border border-black/5 text-[11px] font-medium text-slate-600">{cat.name}</span>
              ))
            )}
          </div>
        </div>

        {/* Dynamic Areas Display */}
        <div className="pt-2">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Assigned Coverage Jurisdictions</span>
          <div className="flex flex-wrap gap-1.5">
            {!profile?.areas || profile.areas.length === 0 ? (
              <span className="text-xs text-slate-400 italic">No operational sectors linked.</span>
            ) : (
              profile.areas.map((area) => (
                <span key={area.id} className="px-2.5 py-1 rounded-md bg-brand-50/50 border border-brand-100 text-[11px] font-medium text-brand-700">
                  {area.name} {area.city_name ? `(${area.city_name})` : ""}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Allocations & Live Employee Seat Metrics Sidebar */}
      <div className="bg-white rounded-2xl border border-black/5 p-5 shadow-sm space-y-4 h-fit">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-gray-100 pb-2">Status & Allocations</h3>
        
        <div>
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Personnel Seat Limit (Live Counter)</span>
          <div className="mt-1 flex items-center justify-between text-xs bg-gray-50 p-3 border border-black/5 rounded-lg">
            <span className="text-slate-600 font-medium">Seats Utilized:</span>
            <span className="font-bold text-brand-700 bg-white border px-2 py-0.5 rounded shadow-sm text-sm">
              {profile?.employee_count} / {profile?.max_employees}
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
            <div 
              className="bg-brand-600 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, ((profile?.employee_count || 0) / (profile?.max_employees || 1)) * 100)}%` }}
            />
          </div>
        </div>

        <div>
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subscription Plan</span>
          <span className="inline-block mt-1 font-bold rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 px-2.5 py-0.5 capitalize">{profile?.plan || "Free"} Tier</span>
        </div>

        <div>
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deployment Status</span>
          <span className="inline-block mt-1 font-bold rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 uppercase px-2.5 py-0.5">{profile?.status || "active"}</span>
        </div>
      </div>
    </div>
  );
}

function SecuritySettingsTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setStatus(null);
    if (newPassword !== confirmPassword) return setError("New password specifications do not match.");
    if (newPassword.length < 8) return setError("Target security phrase must be at least 8 characters long.");

    setSaving(true);
    try {
      // Corrected from /api/company/profile/password to avoid the 404 HTML fallback crash
      const res = await fetch("/api/company/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update security credentials.");
      setStatus("Security key changed successfully.");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl bg-white rounded-2xl border border-black/5 p-6 shadow-sm">
      <h2 className="text-sm font-bold text-slate-800 mb-1">Update Security Key</h2>
      <p className="text-xs text-slate-400 mb-4">Changes take effect immediately across all sessions.</p>
      <form onSubmit={handlePasswordUpdate} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Current Security Key</label>
          <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">New Security Phrase</label>
          <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Confirm Target Security Phrase</label>
          <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-500" />
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}
        {status && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">{status}</p>}
        <button type="submit" disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 transition-all cursor-pointer disabled:opacity-50">{saving ? "Updating..." : "Update Security Key"}</button>
      </form>
    </div>
  );
}