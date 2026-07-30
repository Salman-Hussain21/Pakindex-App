"use client";

import { useEffect, useState } from "react";
import { X, Phone, Star, MapPin, Globe, Clock, CheckCircle2, XCircle, StickyNote, ScanFace, InspectIcon, Flame, Cpu } from "lucide-react";
import { calculateB2BLeadScore } from "@/lib/lead-scoring";

interface LeadDetail {
  id: string; stage: string; notes: string | null; priority: number;
  next_follow_up: string | null; last_contact_at: string | null; assigned_at: string;
  business_id: string; name: string; address: string | null; phone: string | null;
  phone_secondary: string | null; website: string | null; email: string | null;
  rating: number | null; review_count: number | null; price_range: string | null;
  open_state: string | null; service_options: string[] | null; thumbnail: string | null;
  images: string[] | null; extensions: Record<string, any> | null; google_maps_url: string | null;
  facebook_url: string | null; instagram_url: string | null; foodpanda_url: string | null;
  cheetay_url: string | null; careem_food_url: string | null; category_name: string | null;
  area_name: string | null;
  is_visited: boolean | null;
  last_visit_at: string | null;
}
interface Hour { day_of_week: number; open_time: string | null; close_time: string | null; is_closed: boolean; }
interface Activity {
  id: string; activity_type: string; title: string | null; body: string | null;
  stage_from: string | null; stage_to: string | null; visit_completed: boolean | null;
  completed_at: string | null; created_at: string;
}

const STAGES = ["new", "contacted", "interested", "meeting", "proposal", "won", "lost"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function RestaurantLeadModal({
  leadId, onClose, onUpdated,
}: { leadId: string; onClose: () => void; onUpdated?: () => void; }) {
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [hours, setHours] = useState<Hour[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState("");
  const [savingStage, setSavingStage] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [markingVisit, setMarkingVisit] = useState(false);

  function load() {
    setLoading(true);
    fetch(`/api/employee/leads/${leadId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setLead(data.lead);
        setStage(data.lead.stage);
        setHours(data.hours || []);
        setActivities(data.activities || []);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  async function handleStageChange(newStage: string) {
    setSavingStage(true);
    try {
      const res = await fetch(`/api/employee/leads/${leadId}/stage`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status.");
      setStage(newStage);
      load();
      onUpdated?.();
    } catch (err: any) { alert(err.message); }
    finally { setSavingStage(false); }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/employee/leads/${leadId}/notes`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add note.");
      setNoteText("");
      load();
      onUpdated?.();
    } catch (err: any) { alert(err.message); }
    finally { setSavingNote(false); }
  }

  async function handleToggleVisit() {
    const nextCompleted = !lead?.is_visited;
    setMarkingVisit(true);

    let locationData: { lat?: number; lng?: number } | undefined = undefined;

    if (typeof window !== "undefined" && "geolocation" in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
        });
        locationData = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch (e) {
        // Geolocation denied or timed out, continue without location
      }
    }

    try {
      const res = await fetch(`/api/employee/leads/${leadId}/visit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: nextCompleted, ...(locationData || {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update visit status.");
      if (data.isGeofencedVerified) {
        alert("📍 Visit Verified On-Site via GPS!");
      }
      load();
      onUpdated?.();
    } catch (err: any) { alert(err.message); }
    finally { setMarkingVisit(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/5 dark:border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {loading ? (
          <div className="p-16 text-center text-sm text-gray-400 animate-pulse">Loading restaurant details…</div>
        ) : error || !lead ? (
          <div className="p-8">
            <p className="text-sm text-red-600 mb-4">{error || "Could not load this restaurant."}</p>
            <button onClick={onClose} className="text-sm text-brand-600 font-semibold">Close</button>
          </div>
        ) : (
          <>
            <div className="relative border-b border-black/5 dark:border-white/10 p-5">
              <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={18} />
              </button>
              <div className="flex items-start gap-3 pr-8">
                <div className="h-14 w-14 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                  {lead.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={lead.thumbnail} alt={lead.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400 font-bold">{lead.name.charAt(0)}</div>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink-900 dark:text-white">{lead.name}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{lead.category_name || "Uncategorized"} · {lead.area_name || "—"}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {lead.rating && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                        <Star size={12} className="fill-amber-400 text-amber-400" /> {lead.rating} ({lead.review_count || 0})
                      </span>
                    )}
                    {lead.open_state && <span className="text-xs text-gray-500">{lead.open_state}</span>}
                    {lead.is_visited && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                        ✓ Visited
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* GastroIndex B2B Lead Potential Score */}
              {(() => {
                const b2b = calculateB2BLeadScore(lead);
                return (
                  <div className={`p-3.5 rounded-xl border flex items-center justify-between ${b2b.badgeBg}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <Flame size={16} className={b2b.color} />
                        <span className="text-xs font-bold uppercase tracking-wide">
                          B2B Commercial Score: <span className="text-sm font-black">{b2b.score}/100</span> ({b2b.tier})
                        </span>
                      </div>
                      <p className="text-[11px] opacity-80 mt-1">
                        Key Strengths: {b2b.reasons.join(" • ")}
                      </p>
                    </div>
                  </div>
                );
              })()}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {lead.address && (
                  <div className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                    <MapPin size={14} className="flex-shrink-0 mt-0.5 text-gray-400" /> {lead.address}
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 flex-wrap">
                    <Phone size={14} className="text-gray-400" />
                    <a href={`tel:${lead.phone}`} className="hover:underline font-medium text-ink-900 dark:text-gray-100">{lead.phone}</a>
                    <a
                      href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                    >
                      💬 WhatsApp Chat
                    </a>
                  </div>
                )}
                {lead.website && (
                  <a href={lead.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-brand-600 hover:underline">
                    <Globe size={14} /> Website
                  </a>
                )}
                {lead.facebook_url && (
                  <a href={lead.facebook_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-brand-600 hover:underline">
                    <ScanFace size={14} /> Facebook
                  </a>
                )}
                {lead.instagram_url && (
                  <a href={lead.instagram_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-brand-600 hover:underline">
                    <InspectIcon size={14} /> Instagram
                  </a>
                )}
              </div>

              {lead.service_options && lead.service_options.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Service Options</p>
                  <div className="flex flex-wrap gap-1.5">
                    {lead.service_options.map((opt) => (
                      <span key={opt} className="text-[11px] bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-md text-slate-600 dark:text-gray-300">{opt}</span>
                    ))}
                  </div>
                </div>
              )}

              {hours.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Clock size={11} /> Working Hours</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-gray-600 dark:text-gray-300">
                    {hours.map((h) => (
                      <div key={h.day_of_week} className="flex justify-between">
                        <span>{DAYS[h.day_of_week]}</span>
                        <span>{h.is_closed ? "Closed" : `${h.open_time?.slice(0,5) || "—"} - ${h.close_time?.slice(0,5) || "—"}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lead Status</p>
                  <select
                    value={stage}
                    disabled={savingStage}
                    onChange={(e) => handleStageChange(e.target.value)}
                    className="text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-800 px-2 py-1 outline-none focus:border-brand-500 capitalize"
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s} className="capitalize">{s}</option>
                    ))}
                  </select>
                </div>

                {/* Toggle button: swaps label/color/icon based on current is_visited state */}
                {lead.is_visited ? (
                  <button
                    onClick={handleToggleVisit}
                    disabled={markingVisit}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-semibold py-2 hover:bg-amber-100 disabled:opacity-50 transition-colors"
                  >
                    <XCircle size={14} /> {markingVisit ? "Saving…" : "Mark as Unvisited"}
                  </button>
                ) : (
                  <button
                    onClick={handleToggleVisit}
                    disabled={markingVisit}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold py-2 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle2 size={14} /> {markingVisit ? "Saving…" : "Mark Visit Completed"}
                  </button>
                )}
              </div>

              <form onSubmit={handleAddNote} className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"><StickyNote size={11} /> Add Note</p>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={2}
                  placeholder="Write a note about this visit or call…"
                  className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-800 px-3 py-2 text-xs outline-none focus:border-brand-500 resize-none"
                />
                <button
                  type="submit"
                  disabled={savingNote || !noteText.trim()}
                  className="rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3 py-1.5 disabled:opacity-50 transition-colors"
                >
                  {savingNote ? "Saving…" : "Save Note"}
                </button>
              </form>

              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Activity Timeline</p>
                {activities.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No activity recorded yet.</p>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {activities.map((act) => (
                      <div key={act.id} className="text-xs border-l-2 border-brand-200 dark:border-brand-800 pl-3 py-0.5">
                        {act.activity_type === "note" && <p className="text-gray-700 dark:text-gray-300">📝 {act.body}</p>}
                        {act.activity_type === "visit" && act.visit_completed && (
                          <p className="text-emerald-700 dark:text-emerald-400">✅ Visit marked completed</p>
                        )}
                        {act.activity_type === "visit" && !act.visit_completed && (
                          <p className="text-amber-700 dark:text-amber-400">↩️ Marked as unvisited</p>
                        )}
                        {act.activity_type === "status_change" && (
                          <p className="text-gray-700 dark:text-gray-300 capitalize">🔄 Status changed: {act.stage_from} → {act.stage_to}</p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-0.5">{new Date(act.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}