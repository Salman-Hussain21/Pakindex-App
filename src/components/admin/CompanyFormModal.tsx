"use client";

import { useEffect, useState } from "react";
import { getAreas, getCategories, createCompany, updateCompany } from "@/lib/admin-api";

const INDUSTRIES = [
  "FMCG Distribution",
  "Beverages",
  "Dairy",
  "Bakery Supplies",
  "Meat & Poultry",
  "Seafood Supply",
  "Packaging",
  "Kitchen Equipment",
  "Cleaning & Hygiene Supplies",
  "POS / Software",
  "Other",
];

const PLANS = [
  { value: "free", label: "Free", hint: "Limited to 5 rows total" },
  { value: "premium", label: "Premium", hint: "Half of their assigned area's data" },
  { value: "ultra_premium", label: "Ultra Premium", hint: "Full access to their assigned area" },
];

export interface CompanyEditData {
  id: string;
  name: string;
  legal_name: string | null;
  email: string;
  phone: string | null;
  industry: string | null;
  plan: string;
  max_employees: number;
  status: string;
  areaIds: number[];
  categoryIds: number[];
}

export default function CompanyFormModal({
  company,
  onClose,
  onSaved,
}: {
  company: CompanyEditData | null; // null = creating a new company
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!company;

  const [areas, setAreas] = useState<{ id: number; name: string; city_name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  const [companyName, setCompanyName] = useState(company?.name || "");
  const [legalName, setLegalName] = useState(company?.legal_name || "");
  const [adminContactName, setAdminContactName] = useState("");
  const [email, setEmail] = useState(company?.email || "");
  const [phone, setPhone] = useState(company?.phone || "");
  const [password, setPassword] = useState("");
  const [maxEmployees, setMaxEmployees] = useState(company?.max_employees || 5);
  const [industry, setIndustry] = useState(company?.industry || INDUSTRIES[0]);
  const [plan, setPlan] = useState(company?.plan && PLANS.some((p) => p.value === company.plan) ? company.plan : "free");
  const [areaIds, setAreaIds] = useState<Set<number>>(new Set(company?.areaIds || []));
  const [categoryIds, setCategoryIds] = useState<Set<number>>(new Set(company?.categoryIds || []));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAreas().then((d: any) => setAreas(d.areas)).catch(() => {});
    getCategories().then((d: any) => setCategories(d.categories)).catch(() => {});
  }, []);

  function toggleArea(id: number) {
    setAreaIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleCategory(id: number) {
    setCategoryIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (areaIds.size === 0) {
      setError("Assign at least one area — a company with no area sees no data.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        companyName,
        legalName: legalName || undefined,
        adminContactName: adminContactName || undefined,
        email,
        phone: phone || undefined,
        maxEmployees: Number(maxEmployees),
        industry,
        plan,
        areaIds: Array.from(areaIds),
        categoryIds: Array.from(categoryIds),
        ...(password ? { password } : {}),
      };
      if (isEdit) {
        await updateCompany(company!.id, payload);
      } else {
        if (!password) {
          setError("Password is required for a new company.");
          setSaving(false);
          return;
        }
        await createCompany(payload);
      }
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900"
      >
        <h2 className="mb-4 text-lg font-semibold text-ink-900 dark:text-gray-100">
          {isEdit ? `Edit ${company!.name}` : "New Company"}
        </h2>

        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Company Name" value={companyName} onChange={setCompanyName} required />
          <Field label="Company Legal Name" value={legalName} onChange={setLegalName} hint="Registered entity name, if different" />
          <Field label="Email (admin login)" type="email" value={email} onChange={setEmail} required />
          <Field label="Phone" value={phone} onChange={setPhone} />
          <Field
            label={isEdit ? "Reset Password" : "Password"}
            type="password"
            value={password}
            onChange={setPassword}
            required={!isEdit}
            hint={isEdit ? "Leave blank to keep current password" : undefined}
          />
          <Field
            label="No. of Employees"
            type="number"
            value={String(maxEmployees)}
            onChange={(v) => setMaxEmployees(Number(v) || 1)}
            required
          />
          {!isEdit && (
            <Field
              label="Admin Contact Name"
              value={adminContactName}
              onChange={setAdminContactName}
              hint="Defaults to company name if left blank"
            />
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-900/60 dark:text-gray-400">Industry</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
            >
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-medium text-ink-900/60 dark:text-gray-400">Package</label>
          <div className="grid grid-cols-3 gap-2">
            {PLANS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPlan(p.value)}
                className={`rounded-xl border p-3 text-left text-sm ${
                  plan === p.value
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                    : "border-black/10 dark:border-white/10"
                }`}
              >
                <p className={`font-semibold ${plan === p.value ? "text-brand-700 dark:text-brand-400" : "text-ink-900 dark:text-gray-100"}`}>{p.label}</p>
                <p className="mt-0.5 text-xs text-ink-900/50 dark:text-gray-500">{p.hint}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-900/60 dark:text-gray-400">
              Assigned Areas <span className="text-red-500">*</span>
            </label>
            <p className="mb-1.5 text-[11px] text-ink-900/40 dark:text-gray-500">Only businesses in these areas will ever be visible to this company.</p>
            <div className="max-h-44 overflow-y-auto rounded-lg border border-black/10 p-2 dark:border-white/10">
              {areas.map((a) => (
                <label key={a.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                  <input type="checkbox" checked={areaIds.has(a.id)} onChange={() => toggleArea(a.id)} className="rounded border-black/20" />
                  <span className="text-ink-900 dark:text-gray-100">{a.name}</span>
                  <span className="text-ink-900/40 dark:text-gray-500">· {a.city_name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-900/60 dark:text-gray-400">Visible Categories</label>
            <p className="mb-1.5 text-[11px] text-ink-900/40 dark:text-gray-500">Leave empty to allow every category within their areas.</p>
            <div className="max-h-44 overflow-y-auto rounded-lg border border-black/10 p-2 dark:border-white/10">
              {categories.map((c) => (
                <label key={c.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                  <input type="checkbox" checked={categoryIds.has(c.id)} onChange={() => toggleCategory(c.id)} className="rounded border-black/20" />
                  <span className="text-ink-900 dark:text-gray-100">{c.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-ink-900 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Company"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink-900/60 dark:text-gray-400">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
      />
      {hint && <p className="mt-0.5 text-[11px] text-ink-900/40 dark:text-gray-500">{hint}</p>}
    </div>
  );
}