"use client";

import { useEffect, useState, useCallback } from "react";
import { getCompanies, createCompany } from "@/lib/admin-api";
import StatusBadge from "@/components/admin/StatusBadge";

interface Company {
  id: string;
  name: string;
  industry: string | null;
  admin_email: string | null;
  status: string;
  plan: string;
  employee_count: number;
  created_at: string;
}

export default function CompanyManagementPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    industry: "",
    adminFullName: "",
    adminEmail: "",
    adminPassword: "",
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data: any = await getCompanies();
      setCompanies(data.companies);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createCompany(form);
      setShowForm(false);
      setForm({ companyName: "", industry: "", adminFullName: "", adminEmail: "", adminPassword: "" });
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900 dark:text-gray-100">Company Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          + New Company
        </button>
      </div>

      {error && !showForm && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</p>
      )}

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-ink-900/40 dark:bg-gray-950 dark:text-gray-500">
            <tr>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Admin Email</th>
              <th className="px-4 py-3">Employees</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/10">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-ink-900/40 dark:text-gray-500">Loading…</td></tr>
            ) : companies.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-ink-900/40 dark:text-gray-500">No companies yet.</td></tr>
            ) : (
              companies.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 font-medium text-ink-900 dark:text-gray-100">{c.name}</td>
                  <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">{c.admin_email || "—"}</td>
                  <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">{c.employee_count}</td>
                  <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400 capitalize">{c.plan}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <form
            onSubmit={handleCreate}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900"
          >
            <h2 className="mb-4 text-lg font-semibold text-ink-900 dark:text-gray-100">New Company</h2>

            {error && (
              <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</p>
            )}

            <div className="space-y-3">
              <Input label="Company Name" value={form.companyName} onChange={(v) => setForm({ ...form, companyName: v })} required />
              <Input label="Industry" value={form.industry} onChange={(v) => setForm({ ...form, industry: v })} />
              <Input label="Admin Full Name" value={form.adminFullName} onChange={(v) => setForm({ ...form, adminFullName: v })} required />
              <Input label="Admin Email" type="email" value={form.adminEmail} onChange={(v) => setForm({ ...form, adminEmail: v })} required />
              <Input label="Admin Password" type="password" value={form.adminPassword} onChange={(v) => setForm({ ...form, adminPassword: v })} required />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(null); }}
                className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-white/10 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {saving ? "Creating…" : "Create Company"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink-900/60 dark:text-gray-400">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
      />
    </div>
  );
}
