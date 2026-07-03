"use client";

import { useEffect, useState } from "react";
import { Search, Star, Phone, MapPin, Megaphone, Lock, ArrowUpRight } from "lucide-react";
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-black/5 dark:border-white/10">
                <tr className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="px-5 py-3.5">Restaurant</th>
                  <th className="px-5 py-3.5">Area</th>
                  <th className="px-5 py-3.5">Contact</th>
                  <th className="px-5 py-3.5">Rating</th>
                  <th className="px-5 py-3.5">Status</th>
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
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 border border-brand-100 dark:border-brand-800 px-2 py-0.5 rounded-md">
                        <MapPin size={10} /> {item.area_name}{item.city_name ? ` · ${item.city_name}` : ""}
                      </span>
                    </td>
                    {/* Contact */}
                    <td className="px-5 py-3.5">
                      {item.phone ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-gray-600 dark:text-gray-300">
                          <Phone size={10} className="text-gray-400" /> {item.phone}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">No contact</span>
                      )}
                    </td>
                    {/* Rating */}
                    <td className="px-5 py-3.5">
                      {item.rating ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                          <Star size={11} className="fill-amber-400 text-amber-400" /> {item.rating}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400">—</span>
                      )}
                    </td>
                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        {item.approval_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── UPSELL OVERLAY (exact reference design) ── */}
          {isLimited && (
            <div
              className="absolute bottom-0 left-0 right-0 h-48 flex flex-col items-center justify-end pb-6 cursor-pointer"
              style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.92) 40%, white 100%)" }}
              onClick={() => setShowUpsellModal(true)}
            >
              <div className="dark:hidden flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-3">
                  <Megaphone size={22} className="text-blue-400" />
                </div>
                <p className="text-sm font-bold text-gray-800">Subscribe A Plan To See More!</p>
                <p className="text-xs text-gray-500 mt-0.5">Upgrade Your Plan And Explore The Full List Of Entries!</p>
              </div>
            </div>
          )}

          {/* Dark mode overlay variant */}
          {isLimited && (
            <div
              className="hidden dark:flex absolute bottom-0 left-0 right-0 h-48 flex-col items-center justify-end pb-6 cursor-pointer"
              style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(17,24,39,0.92) 40%, rgb(17,24,39) 100%)" }}
              onClick={() => setShowUpsellModal(true)}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-blue-900/40 border border-blue-700/40 flex items-center justify-center mb-3">
                  <Megaphone size={22} className="text-blue-400" />
                </div>
                <p className="text-sm font-bold text-white">Subscribe A Plan To See More!</p>
                <p className="text-xs text-gray-400 mt-0.5">Upgrade Your Plan And Explore The Full List Of Entries!</p>
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