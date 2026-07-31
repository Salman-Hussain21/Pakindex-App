"use client";

import { useEffect, useState, useCallback } from "react";
import { getCompanies, bulkCompanyAction, getCompany } from "@/lib/admin-api";
import StatusBadge from "@/components/admin/StatusBadge";
import BulkActionBar from "@/components/admin/BulkActionBar";
import CompanyFormModal, { CompanyEditData } from "@/components/admin/CompanyFormModal";

interface Company {
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
  areas: { id: number; name: string }[];
  categories: { id: number; name: string }[];
  created_at: string;
}

const PLAN_LABEL: Record<string, string> = {
  free: "Free",
  premium: "Premium",
  ultra_premium: "Ultra Premium",
  trial: "Free (legacy)",
  basic: "Premium (legacy)",
  pro: "Ultra Premium (legacy)",
  enterprise: "Ultra Premium (legacy)",
};

const PLAN_COLOR: Record<string, string> = {
  free: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  premium: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  ultra_premium: "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300",
};

export default function CompanyManagementPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [editTarget, setEditTarget] = useState<CompanyEditData | null | undefined>(undefined); // undefined = closed, null = creating
  
  // Pagination State
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data: any = await getCompanies();
      setCompanies(data.companies || []);
      setSelected(new Set());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filter companies based on search and dropdowns
  const filtered = companies.filter((c) => {
    if (statusFilter && c.status !== statusFilter) return false;
    if (planFilter && c.plan !== planFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!c.name.toLowerCase().includes(s) && !(c.legal_name || "").toLowerCase().includes(s) && !c.email.toLowerCase().includes(s)) {
        return false;
      }
    }
    return true;
  });

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, planFilter]);

  // Calculate pagination variables based on filtered results
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const currentRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected((prev) => (prev.size === filtered.length ? new Set() : new Set(filtered.map((c) => c.id))));
  }

  async function bulkAction(action: string) {
    if (action === "delete" && !confirm(`Cancel ${selected.size} company account(s)? Their logins will stop working.`)) return;
    setBulkBusy(true);
    try {
      await bulkCompanyAction({ action, ids: Array.from(selected) });
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBulkBusy(false);
    }
  }

  async function openEdit(companyId: string) {
    try {
      const data: any = await getCompany(companyId);
      setEditTarget({
        id: data.company.id,
        name: data.company.name,
        legal_name: data.company.legal_name,
        email: data.company.email,
        phone: data.company.phone,
        industry: data.company.industry,
        plan: data.company.plan,
        max_employees: data.company.max_employees,
        status: data.company.status,
        package_id: data.company.package_id ?? null,
        areaIds: data.areas.map((a: any) => a.id),
        categoryIds: data.categories.map((c: any) => c.id),
      });
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900 dark:text-gray-100">Company Management</h1>
        <button
          onClick={() => setEditTarget(null)}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          + New Company
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, legal name, or email…"
          className="w-64 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">All plans</option>
          <option value="free">Free</option>
          <option value="premium">Premium</option>
          <option value="ultra_premium">Ultra Premium</option>
        </select>
      </div>

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</p>}

      <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())}>
        {filtered.some(c => selected.has(c.id) && c.status !== "active") && (
          <button disabled={bulkBusy} onClick={() => bulkAction("activate")} className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800">Activate</button>
        )}
        {filtered.some(c => selected.has(c.id) && c.status !== "suspended") && (
          <button disabled={bulkBusy} onClick={() => bulkAction("suspend")} className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50">Suspend</button>
        )}
        <button disabled={bulkBusy} onClick={() => bulkAction("delete")} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">Delete Selected</button>
      </BulkActionBar>

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-ink-900/40 dark:bg-gray-950 dark:text-gray-500">
            <tr>
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={filtered.length > 0 && selected.size === filtered.length} onChange={toggleAll} className="rounded border-black/20" />
              </th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Industry</th>
              <th className="px-4 py-3">Assigned Areas</th>
              <th className="px-4 py-3">Employees</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/10">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-ink-900/40 dark:text-gray-500">Loading…</td></tr>
            ) : currentRows.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-ink-900/40 dark:text-gray-500">No companies match.</td></tr>
            ) : (
              currentRows.map((c) => (
                <tr key={c.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${selected.has(c.id) ? "bg-brand-50/40 dark:bg-brand-900/10" : ""}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} className="rounded border-black/20" />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900 dark:text-gray-100">{c.name}</p>
                    <p className="text-xs text-ink-900/40 dark:text-gray-500">{c.email}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">{c.industry || "—"}</td>
                  <td className="px-4 py-3">
                    {c.areas.length === 0 ? (
                      <span className="text-xs text-red-600 dark:text-red-400">None — sees no data</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {c.areas.slice(0, 3).map((a) => (
                          <span key={a.id} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-ink-900/70 dark:bg-gray-800 dark:text-gray-300">{a.name}</span>
                        ))}
                        {c.areas.length > 3 && <span className="text-xs text-ink-900/40 dark:text-gray-500">+{c.areas.length - 3}</span>}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">{c.employee_count} / {c.max_employees}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${PLAN_COLOR[c.plan] || PLAN_COLOR.free}`}>
                      {PLAN_LABEL[c.plan] || c.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end flex-wrap gap-1.5">
                      <button onClick={() => openEdit(c.id)} className="rounded-lg border border-black/10 px-2.5 py-1 text-xs font-medium hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800">Edit</button>
                      {c.status !== "active" && (
                        <button onClick={async () => { try { const m = await import("@/lib/admin-api"); await m.updateCompany(c.id, { status: "active" }); load(); } catch {} }}
                          className="rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100 dark:border-brand-900/40 dark:bg-brand-900/20 dark:text-brand-400">Activate</button>
                      )}
                      {c.status === "active" && (
                        <button onClick={async () => { try { const m = await import("@/lib/admin-api"); await m.updateCompany(c.id, { status: "suspended" }); load(); } catch {} }}
                          className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-400">Suspend</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-ink-900/40 dark:text-gray-500">
          Showing {total === 0 ? 0 : ((page - 1) * 50) + 1}–{Math.min(page * 50, total)} of {total.toLocaleString()} companies
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => setPage(1)}
              className="rounded-lg border border-black/10 px-2.5 py-1 text-xs text-ink-900 hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800">«</button>
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}
              className="rounded-lg border border-black/10 px-2.5 py-1 text-xs text-ink-900 hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800">‹ Prev</button>
            <span className="px-3 text-xs text-ink-900/60 dark:text-gray-400">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
              className="rounded-lg border border-black/10 px-2.5 py-1 text-xs text-ink-900 hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800">Next ›</button>
            <button disabled={page >= totalPages} onClick={() => setPage(totalPages)}
              className="rounded-lg border border-black/10 px-2.5 py-1 text-xs text-ink-900 hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:text-gray-200 dark:hover:bg-gray-800">»</button>
          </div>
        )}
      </div>

      {editTarget !== undefined && (
        <CompanyFormModal
          company={editTarget}
          onClose={() => setEditTarget(undefined)}
          onSaved={() => { setEditTarget(undefined); load(); }}
        />
      )}
    </div>
  );
}