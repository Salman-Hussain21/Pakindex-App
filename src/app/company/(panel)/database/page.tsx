"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Megaphone, Lock, ArrowUpRight, UserPlus, User, Star, Sparkles } from "lucide-react";
import AIPitchModal from "@/components/company/AIPitchModal";
import StatusBadge from "@/components/admin/StatusBadge";
import BulkActionBar from "@/components/admin/BulkActionBar";
import PreviewMapButtons from "@/components/admin/PreviewMapButtons";
import type { BusinessDetail } from "@/components/admin/BusinessDetailModal";

interface Restaurant extends BusinessDetail {
  approval_status: string;
  area_name: string;
  city_name: string | null;
  assigned_employee_id: string | null;
  assigned_employee_name: string | null;
}

interface EmployeeOption {
  id: string;
  full_name: string;
  status: string;
}

interface AreaOption {
  id: number;
  name: string;
  city_name: string;
}

interface CategoryOption {
  id: number;
  name: string;
}

function isRecent(d?: string) {
  return d ? Date.now() - new Date(d).getTime() < 48 * 3600000 : false;
}

export default function RestaurantDatabasePage() {
  const searchParams = useSearchParams();
  
  const [rows, setRows] = useState<Restaurant[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLimited, setIsLimited] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [shownCount, setShownCount] = useState(0);
  const [plan, setPlan] = useState("");
  const [showUpsellModal, setShowUpsellModal] = useState(false);

  // Filter lists & selections
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  
  const [areaFilter, setAreaFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [tabFilter, setTabFilter] = useState(searchParams.get("filter") === "new" ? "new" : "all");

  // Assign Employee state
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [assigningRestaurant, setAssigningRestaurant] = useState<Restaurant | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // AI Pitch Modal state
  const [aiModalBusiness, setAiModalBusiness] = useState<{
    id: string; name: string; category?: string; area?: string; city?: string;
    rating?: number | null; review_count?: number | null; price_range?: string | null;
    phone?: string | null; address?: string | null;
  } | null>(null);

  useEffect(() => {
    if (searchParams.get("upgrade") === "true") setShowUpsellModal(true);
  }, [searchParams]);

  // Handle setting initial tab from search parameters
  useEffect(() => {
    const filterParam = searchParams.get("filter");
    if (filterParam === "new") {
      setTabFilter("new");
    } else {
      setTabFilter("all");
    }
  }, [searchParams]);

  const load = useCallback(async (
    search: string,
    area: string,
    category: string,
    rating: string,
    filter: string
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (area) params.set("area", area);
      if (category) params.set("category", category);
      if (rating) params.set("rating", rating);
      if (filter) params.set("filter", filter);

      const res = await fetch(`/api/company/database?${params.toString()}`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      
      setRows(data.restaurants || []);
      setAreas(data.areas || []);
      setCategories(data.categories || []);
      setIsLimited(data.isLimited || false);
      setTotalCount(data.totalCount || 0);
      setShownCount(data.shownCount || 0);
      setPlan(data.plan || "");
      setSelected(new Set());
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      load(q, areaFilter, categoryFilter, ratingFilter, tabFilter);
    }, 300);
    return () => clearTimeout(t);
  }, [q, areaFilter, categoryFilter, ratingFilter, tabFilter, load]);

  // Load employees for the assign modal
  useEffect(() => {
    fetch("/api/company/employees?status=active")
      .then((r) => r.json())
      .then((data) => setEmployees(data.employees || []))
      .catch(() => {});
  }, []);

  const toggle = (id: string) =>
    setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () =>
    setSelected((p) => (p.size === rows.length ? new Set() : new Set(rows.map((r) => r.id))));

  function openAssignModal(restaurant: Restaurant) {
    setAssigningRestaurant(restaurant);
    setSelectedEmployeeId(restaurant.assigned_employee_id || "");
    setAssignError(null);
  }

  async function handleAssignSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assigningRestaurant) return;
    setAssignSubmitting(true);
    setAssignError(null);
    try {
      const res = await fetch("/api/company/database/assign", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: assigningRestaurant.id, employeeId: selectedEmployeeId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign employee.");
      const assignedEmp = employees.find((e) => e.id === selectedEmployeeId);
      setRows((prev) =>
        prev.map((r) =>
          r.id === assigningRestaurant.id
            ? { ...r, assigned_employee_id: selectedEmployeeId || null, assigned_employee_name: assignedEmp?.full_name || null }
            : r
        )
      );
      setAssigningRestaurant(null);
    } catch (err: any) {
      setAssignError(err.message);
    } finally {
      setAssignSubmitting(false);
    }
  }

  const planLabel: Record<string, string> = {
    free: "Free", trial: "Free Trial",
    premium: "Premium", basic: "Premium",
    ultra_premium: "Ultra Premium", pro: "Ultra Premium", enterprise: "Ultra Premium",
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900 dark:text-gray-100">Restaurant Database</h1>
          <p className="mt-0.5 text-sm text-ink-900/50 dark:text-gray-400">
            {loading ? "Loading…" : `${shownCount.toLocaleString()} records in your assigned areas`}
            {isLimited && !loading && (
              <span className="ml-2 font-semibold text-amber-600 dark:text-amber-400">
                · {totalCount.toLocaleString()} total available
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-400 dark:bg-gray-800">
            {planLabel[plan] || plan} Plan
          </span>
          {isLimited && (
            <button
              onClick={() => setShowUpsellModal(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:from-brand-700 hover:to-brand-800"
            >
              <ArrowUpRight size={16} /> Upgrade Plan
            </button>
          )}
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="mb-4 flex gap-1 rounded-xl bg-gray-100 p-1 w-fit dark:bg-gray-800">
        <button
          onClick={() => setTabFilter("all")}
          className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            tabFilter === "all"
              ? "bg-white text-brand-700 shadow-sm dark:bg-gray-900 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          All Restaurants
        </button>
        <button
          onClick={() => setTabFilter("new")}
          className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            tabFilter === "new"
              ? "bg-white text-brand-700 shadow-sm dark:bg-gray-900 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          New Entries (Last 7 Days)
        </button>
      </div>

      {/* Filter Row */}
      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or phone…"
          className="w-full max-w-xs rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
        />

        <select
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">All Areas</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.city_name})
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">All Ratings</option>
          <option value="4.5">★ 4.5+ Stars</option>
          <option value="4.0">★ 4.0+ Stars</option>
          <option value="3.5">★ 3.5+ Stars</option>
          <option value="3.0">★ 3.0+ Stars</option>
        </select>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      {/* Bulk action bar */}
      <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())}>
        <span className="text-xs text-ink-900/60 dark:text-gray-400">
          {selected.size} record{selected.size !== 1 ? "s" : ""} selected
        </span>
      </BulkActionBar>

      {/* Table */}
      <div className="relative overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900">
        <div className={`overflow-x-auto ${isLimited ? "max-h-[500px] overflow-y-auto pb-2" : ""}`}>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-ink-900/40 dark:bg-gray-950 dark:text-gray-500">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && selected.size === rows.length}
                    onChange={toggleAll}
                    className="rounded border-black/20"
                  />
                </th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Reviews</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Area</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assigned</th>
                <th className="px-4 py-3 text-center">AI</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-ink-900/40 dark:text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-ink-900/40 dark:text-gray-500">
                    No restaurants found matching active filters.
                  </td>
                </tr>
              ) : (
                rows.map((b) => (
                  <tr
                    key={b.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${selected.has(b.id) ? "bg-brand-50/40 dark:bg-brand-900/10" : ""}`}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(b.id)}
                        onChange={() => toggle(b.id)}
                        className="rounded border-black/20"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-ink-900 dark:text-gray-100">
                      <div className="flex items-center gap-2">
                        {isRecent(b.created_at) && (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            New
                          </span>
                        )}
                        {b.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">
                      {(b as any).category_name || b.business_type || "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">
                      {b.rating ? `★ ${b.rating}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">
                      {(b as any).review_count ?? 0}
                    </td>
                    <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">
                      {b.phone || "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-900/60 dark:text-gray-400">
                      {(b as any).area_name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    {/* Assigned employee */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        {b.assigned_employee_name ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:border-white/10 dark:bg-gray-800 dark:text-gray-300">
                            <User size={10} /> {b.assigned_employee_name}
                          </span>
                        ) : (
                          <span className="whitespace-nowrap text-[11px] italic text-gray-400">Unassigned</span>
                        )}
                        <button
                          onClick={() => openAssignModal(b)}
                          title={b.assigned_employee_name ? "Reassign employee" : "Assign employee"}
                          className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 transition-all hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 dark:border-white/10 dark:bg-gray-800 dark:text-gray-300"
                        >
                          <UserPlus size={11} /> {b.assigned_employee_name ? "Reassign" : "Assign"}
                        </button>
                      </div>
                    </td>
                    {/* AI Intelligence */}
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setAiModalBusiness({
                          id: b.id,
                          name: b.name,
                          category: (b as any).category_name || b.business_type || undefined,
                          area: (b as any).area_name || undefined,
                          city: b.city_name || "Karachi",
                          rating: b.rating,
                          review_count: (b as any).review_count,
                          price_range: (b as any).price_range,
                          phone: b.phone || undefined,
                          address: b.address || undefined,
                        })}
                        className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 px-2.5 py-1 text-[10px] font-bold text-white shadow hover:opacity-90 transition-all"
                        title="Generate AI Sales Intelligence"
                      >
                        <Sparkles size={10} /> AI
                      </button>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex flex-row flex-nowrap items-center justify-end gap-1">
                        <PreviewMapButtons business={b} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Upsell overlay */}
        {isLimited && (
          <>
            <div
              className="dark:hidden absolute bottom-0 left-0 right-0 h-20 flex flex-col items-center justify-end pb-3 cursor-pointer"
              style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.95) 55%, white 100%)" }}
              onClick={() => setShowUpsellModal(true)}
            >
              <div className="flex items-center gap-2">
                <Megaphone size={14} className="flex-shrink-0 text-blue-400" />
                <p className="text-xs font-bold text-gray-800">Subscribe a plan to see more restaurants</p>
              </div>
            </div>
            <div
              className="hidden dark:flex absolute bottom-0 left-0 right-0 h-20 flex-col items-center justify-end pb-3 cursor-pointer"
              style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(17,24,39,0.95) 55%, rgb(17,24,39) 100%)" }}
              onClick={() => setShowUpsellModal(true)}
            >
              <div className="flex items-center gap-2">
                <Megaphone size={14} className="flex-shrink-0 text-blue-400" />
                <p className="text-xs font-bold text-white">Subscribe a plan to see more restaurants</p>
              </div>
            </div>
          </>
        )}
      </div>

      <p className="mt-3 text-xs text-ink-900/40 dark:text-gray-500">
        Showing {shownCount} of {totalCount} approved businesses in your territory.
      </p>

      {/* ── UPSELL MODAL ── */}
      {showUpsellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-3xl border border-black/5 bg-white p-8 text-center shadow-2xl dark:border-white/10 dark:bg-gray-900">
            <button
              onClick={() => setShowUpsellModal(false)}
              className="absolute right-4 top-4 text-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >×</button>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-blue-100 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30">
              <Megaphone size={28} className="text-blue-400" />
            </div>
            <h2 className="mb-2 text-lg font-bold text-ink-900 dark:text-white">Subscribe A Plan To See More!</h2>
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">Upgrade Your Plan And Explore The Details Of Entries!</p>
            <p className="mb-6 text-xs text-gray-400 dark:text-gray-500">
              You are on the <span className="font-semibold text-brand-600">{planLabel[plan] || plan}</span> plan. Showing <span className="font-semibold">{shownCount}</span> of <span className="font-semibold">{totalCount}</span> restaurants.
            </p>
            <div className="space-y-3">
              <div className="rounded-2xl border-2 border-brand-500 bg-brand-50 p-4 text-left dark:bg-brand-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-brand-700 dark:text-brand-400">Premium</p>
                    <p className="text-xs text-brand-600/70 dark:text-brand-500">50% of your territory data</p>
                  </div>
                  <span className="text-sm font-bold text-brand-700 dark:text-brand-400">Rs 5,000/mo</span>
                </div>
              </div>
              <div className="rounded-2xl border border-black/10 bg-gray-50 p-4 text-left dark:border-white/10 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-ink-900 dark:text-white">Ultra Premium</p>
                      <Lock size={12} className="text-amber-500" />
                    </div>
                    <p className="text-xs text-gray-500">100% full data access</p>
                  </div>
                  <span className="text-sm font-bold text-ink-900 dark:text-white">Rs 15,000/mo</span>
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-400">Contact your account manager to upgrade.</p>
          </div>
        </div>
      )}

      {/* ── ASSIGN EMPLOYEE MODAL ── */}
      {assigningRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleAssignSubmit}
            className="max-h-[85vh] w-full max-w-sm space-y-4 overflow-y-auto rounded-2xl border border-black/5 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-gray-900"
          >
            <div>
              <h3 className="text-sm font-bold text-ink-900 dark:text-white">Assign Employee</h3>
              <p className="mt-0.5 text-[11px] text-gray-400">
                Assigning to <span className="font-semibold text-slate-700 dark:text-gray-300">{assigningRestaurant.name}</span>.
              </p>
            </div>
            {assignError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                {assignError}
              </div>
            )}
            <div className="max-h-64 space-y-1.5 overflow-y-auto">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs hover:bg-slate-50 dark:border-white/10 dark:hover:bg-gray-800">
                <input type="radio" name="employee" checked={selectedEmployeeId === ""} onChange={() => setSelectedEmployeeId("")} className="accent-brand-600" />
                <span className="italic text-gray-500">Unassigned</span>
              </label>
              {employees.length === 0 ? (
                <p className="px-1 py-2 text-xs italic text-gray-400">No active employees found. Add employees first.</p>
              ) : (
                employees.map((emp) => (
                  <label key={emp.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs hover:bg-slate-50 dark:border-white/10 dark:hover:bg-gray-800">
                    <input type="radio" name="employee" checked={selectedEmployeeId === emp.id} onChange={() => setSelectedEmployeeId(emp.id)} className="accent-brand-600" />
                    <span className="font-medium text-ink-900 dark:text-gray-200">{emp.full_name}</span>
                  </label>
                ))
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 text-xs font-semibold dark:border-white/10">
              <button type="button" onClick={() => setAssigningRestaurant(null)} className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button type="submit" disabled={assignSubmitting} className="cursor-pointer rounded-xl bg-brand-600 px-4 py-2 text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50">
                {assignSubmitting ? "Saving…" : "Save Assignment"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AI Intelligence Modal */}
      {aiModalBusiness && (
        <AIPitchModal
          isOpen={!!aiModalBusiness}
          onClose={() => setAiModalBusiness(null)}
          business={aiModalBusiness}
        />
      )}
    </div>
  );
}
