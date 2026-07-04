"use client";

import { useEffect, useState } from "react";
import { Search, Star, Phone, MapPin, Megaphone, Lock, ArrowUpRight, UserPlus, User } from "lucide-react";
import { useSearchParams } from "next/navigation";
import BusinessDetailModal, { BusinessDetail } from "@/components/admin/BusinessDetailModal";

interface Restaurant {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  thumbnail: string | null;
  rating: number | null;
  business_type: string | null;
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

export default function RestaurantDatabasePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLimited, setIsLimited] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [shownCount, setShownCount] = useState(0);
  const [plan, setPlan] = useState("");
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<BusinessDetail | null>(null);
  const searchParams = useSearchParams();

  // Assign Employee modal state
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [assigningRestaurant, setAssigningRestaurant] = useState<Restaurant | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("upgrade") === "true") {
      setShowUpsellModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    const debounce = setTimeout(() => {
      fetch(`/api/company/database?search=${encodeURIComponent(search)}`)
        .then(async (res) => {
          if (!res.ok) throw new Error(`Error ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (!isMounted) return;
          setRestaurants(data.restaurants || []);
          setIsLimited(data.isLimited || false);
          setTotalCount(data.totalCount || 0);
          setShownCount(data.shownCount || 0);
          setPlan(data.plan || "");
          setError(null);
          setLoading(false);
        })
        .catch((err) => {
          if (!isMounted) return;
          setError(err.message);
          setLoading(false);
        });
    }, 300);
    return () => { isMounted = false; clearTimeout(debounce); };
  }, [search]);

  // Load the company's employees once, for the Assign Employee modal.
  useEffect(() => {
    fetch("/api/company/employees?status=active")
      .then((res) => res.json())
      .then((data) => setEmployees(data.employees || []))
      .catch(() => {});
  }, []);

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
        body: JSON.stringify({
          businessId: assigningRestaurant.id,
          employeeId: selectedEmployeeId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign employee.");

      const assignedEmp = employees.find((e) => e.id === selectedEmployeeId);
      setRestaurants((prev) =>
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-900 dark:text-white">Restaurant Database</h1>
          <p className="text-sm text-ink-900/50 dark:text-gray-400 mt-0.5">
            {loading ? "Loading..." : `${shownCount.toLocaleString()} records in your assigned areas`}
            {isLimited && !loading && (
              <span className="ml-2 text-amber-600 dark:text-amber-400 font-semibold">
                · {totalCount.toLocaleString()} total available
              </span>
            )}
          </p>
        </div>
        {isLimited && (
          <button
            onClick={() => setShowUpsellModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md transition-all"
          >
            <ArrowUpRight size={16} /> Upgrade Plan
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-black/5 dark:border-white/10 rounded-2xl px-4 py-3 shadow-sm">
        <Search size={16} className="text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search by name, area, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-sm bg-transparent outline-none text-ink-900 dark:text-white placeholder:text-gray-400"
        />
        <span className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
          {planLabel[plan] || plan} Plan
        </span>
      </div>

      {/* Table */}
      {error ? (
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 text-sm text-red-700 dark:text-red-400">
          ⚠️ {error}
        </div>
      ) : loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/5 dark:border-white/10 p-16 text-center">
          <div className="animate-pulse text-sm text-gray-400">Loading restaurant data...</div>
        </div>
      ) : restaurants.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/5 dark:border-white/10 p-16 text-center">
          <p className="text-sm text-gray-400">No restaurants found in your assigned areas.</p>
        </div>
      ) : (
       <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm overflow-hidden">
         <div className={`overflow-x-auto overflow-y-auto max-h-[500px] ${isLimited ? "pb-2" : ""}`}>
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-black/5 dark:border-white/10 sticky top-0 z-10">
                <tr className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="px-5 py-3.5">Restaurant</th>
                  <th className="px-5 py-3.5">Area</th>
                  <th className="px-5 py-3.5">Contact</th>
                  <th className="px-5 py-3.5">Rating</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Assigned Employee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/4 dark:divide-white/5">
                {restaurants.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors group">
                    {/* Restaurant Name + Thumbnail */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-black/5 dark:border-white/10">
                          {item.thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.thumbnail} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs font-bold">
                              {item.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <button
                            onClick={() => setSelectedRestaurant(item as any)}
                            className="font-semibold text-ink-900 dark:text-white text-[13px] hover:text-brand-600 dark:hover:text-brand-400 hover:underline text-left"
                          >
                            {item.name}
                          </button>
                          <p className="text-[11px] text-gray-400 truncate max-w-[200px] mt-0.5">
                            {item.business_type || item.address || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    {/* Area */}
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-medium text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 border border-brand-100 dark:border-brand-800 px-2 py-0.5 rounded-md">
                        <MapPin size={10} /> {item.area_name}{item.city_name ? ` · ${item.city_name}` : ""}
                      </span>
                    </td>
                    {/* Contact */}
                    <td className="px-5 py-3.5">
                      {item.phone ? (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-mono text-gray-600 dark:text-gray-300">
                          <Phone size={10} className="text-gray-400" /> {item.phone}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">No contact</span>
                      )}
                    </td>
                    {/* Rating */}
                    <td className="px-5 py-3.5">
                      {item.rating ? (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold text-amber-600">
                          <Star size={11} className="fill-amber-400 text-amber-400" /> {item.rating}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400">—</span>
                      )}
                    </td>
                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center whitespace-nowrap rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        {item.approval_status}
                      </span>
                    </td>
                    {/* Assigned Employee */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        {item.assigned_employee_name ? (
                          <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-medium text-slate-700 dark:text-gray-300 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-md">
                            <User size={10} /> {item.assigned_employee_name}
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic whitespace-nowrap">0 Employees Assigned</span>
                        )}
                        <button
                          onClick={() => openAssignModal(item)}
                          title={item.assigned_employee_name ? "Reassign employee" : "Assign employee"}
                          className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-800 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:text-gray-300 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition-all cursor-pointer"
                        >
                          <UserPlus size={11} /> {item.assigned_employee_name ? "Reassign" : "Assign"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
<br />
          {/* ── UPSELL OVERLAY ── */}
          {isLimited && (
            <div
              className="dark:hidden absolute bottom-0 left-0 right-0 h-20 flex flex-col items-center justify-end pb-3 cursor-pointer"
              style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.95) 55%, white 100%)" }}
              onClick={() => setShowUpsellModal(true)}
            >
              <div className="flex items-center gap-2 text-center">
                <Megaphone size={14} className="text-blue-400 flex-shrink-0" />
                <p className="text-xs font-bold text-gray-800">Subscribe a plan to see more restaurants</p>
              </div>
            </div>
          )}

          {isLimited && (
            <div
              className="hidden dark:flex absolute bottom-0 left-0 right-0 h-20 flex-col items-center justify-end pb-3 cursor-pointer"
              style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(17,24,39,0.95) 55%, rgb(17,24,39) 100%)" }}
              onClick={() => setShowUpsellModal(true)}
            >
              <div className="flex items-center gap-2 text-center">
                <Megaphone size={14} className="text-blue-400 flex-shrink-0" />
                <p className="text-xs font-bold text-white">Subscribe a plan to see more restaurants</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── UPSELL MODAL ── */}
      {showUpsellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-black/5 dark:border-white/10 max-w-sm w-full p-8 shadow-2xl text-center">
            <button
              onClick={() => setShowUpsellModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl"
            >×</button>
            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 flex items-center justify-center mx-auto mb-5">
              <Megaphone size={28} className="text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-ink-900 dark:text-white mb-2">Subscribe A Plan To See More!</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Upgrade Your Plan And Explore The Details Of Entries!
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
              You are on the <span className="font-semibold text-brand-600">{planLabel[plan] || plan}</span> plan.
              You are seeing <span className="font-semibold">{shownCount}</span> of{" "}
              <span className="font-semibold">{totalCount}</span> restaurants in your territory.
            </p>

            <div className="space-y-3">
              <div className="rounded-2xl border-2 border-brand-500 bg-brand-50 dark:bg-brand-900/20 p-4 text-left">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-brand-700 dark:text-brand-400">Premium</p>
                    <p className="text-xs text-brand-600/70 dark:text-brand-500">50% of your territory data</p>
                  </div>
                  <span className="text-sm font-bold text-brand-700 dark:text-brand-400">Rs 5,000/mo</span>
                </div>
              </div>
              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-gray-800 p-4 text-left">
                <div className="flex justify-between items-center">
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

            <p className="text-xs text-gray-400 mt-4">Contact your account manager to upgrade.</p>
          </div>
        </div>
      )}

      {/* ── ASSIGN EMPLOYEE MODAL ── */}
      {assigningRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleAssignSubmit}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-black/5 dark:border-white/10 max-w-sm w-full p-6 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto"
          >
            <div>
              <h3 className="text-sm font-bold text-ink-900 dark:text-white">Assign Employee</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Only one employee can be assigned to <span className="font-semibold text-slate-700 dark:text-gray-300">{assigningRestaurant.name}</span> at a time.
              </p>
            </div>

            {assignError && (
              <div className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg">
                {assignError}
              </div>
            )}

            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-800">
                <input
                  type="radio"
                  name="employee"
                  checked={selectedEmployeeId === ""}
                  onChange={() => setSelectedEmployeeId("")}
                  className="accent-brand-600"
                />
                <span className="text-gray-500 italic">Unassigned</span>
              </label>
              {employees.length === 0 ? (
                <p className="text-xs text-gray-400 italic px-1 py-2">No active employees found. Add employees first.</p>
              ) : (
                employees.map((emp) => (
                  <label
                    key={emp.id}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-800"
                  >
                    <input
                      type="radio"
                      name="employee"
                      checked={selectedEmployeeId === emp.id}
                      onChange={() => setSelectedEmployeeId(emp.id)}
                      className="accent-brand-600"
                    />
                    <span className="text-ink-900 dark:text-gray-200 font-medium">{emp.full_name}</span>
                  </label>
                ))
              )}
            </div>

            <div className="flex justify-end gap-2 text-xs font-semibold pt-3 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setAssigningRestaurant(null)}
                className="px-3 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300 rounded-xl border border-slate-200 dark:border-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={assignSubmitting}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
              >
                {assignSubmitting ? "Saving…" : "Save Assignment"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── RESTAURANT DETAIL MODAL ── */}
      {selectedRestaurant && (
        <BusinessDetailModal
          business={selectedRestaurant}
          onClose={() => setSelectedRestaurant(null)}
        />
      )}
    </div>
  );
}