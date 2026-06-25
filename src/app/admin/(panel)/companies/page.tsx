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
        <h1 className="text-xl font-semibold text-ink-900">Company Management</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          {showForm ? "Cancel" : "+ New Company"}
        </button>
      </div>

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 grid grid-cols-2 gap-3 rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
        >
          <Input label="Company Name" value={form.companyName} onChange={(v) => setForm({ ...form, companyName: v })} required />
          <Input label="Industry" value={form.industry} onChange={(v) => setForm({ ...form, industry: v })} />
          <Input label="Admin Full Name" value={form.adminFullName} onChange={(v) => setForm({ ...form, adminFullName: v })} required />
          <Input label="Admin Email" type="email" value={form.adminEmail} onChange={(v) => setForm({ ...form, adminEmail: v })} required />
          <Input label="Admin Password" type="password" value={form.adminPassword} onChange={(v) => setForm({ ...form, adminPassword: v })} required />
          <div className="col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create Company"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-ink-900/40">
            <tr>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Admin Email</th>
              <th className="px-4 py-3">Employees</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-ink-900/40">Loading…</td></tr>
            ) : companies.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-ink-900/40">No companies yet.</td></tr>
            ) : (
              companies.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-ink-900">{c.name}</td>
                  <td className="px-4 py-3 text-ink-900/60">{c.admin_email || "—"}</td>
                  <td className="px-4 py-3 text-ink-900/60">{c.employee_count}</td>
                  <td className="px-4 py-3 text-ink-900/60 capitalize">{c.plan}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
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
      <label className="mb-1 block text-xs font-medium text-ink-900/60">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
      />
    </div>
  );
}
