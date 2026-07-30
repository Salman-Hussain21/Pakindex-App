"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Users, MoreHorizontal, Calendar, Mic, CheckSquare, XCircle, BrainCircuit, Plus, Flame, Phone, Navigation } from "lucide-react";
import IntelligenceModal from "@/components/employee/IntelligenceModal";
import NewProspectModal from "@/components/employee/NewProspectModal";
import RestaurantLeadModal from "@/components/employee/RestaurantLeadModal";
import { getEmployeeCRMLeads, updateLeadStage, addLeadNote } from "@/lib/employee-api";
import { calculateB2BLeadScore } from "@/lib/lead-scoring";

const STAGES = [
  { id: "new", label: "New Lead", color: "border-blue-200 bg-blue-50 text-blue-800" },
  { id: "contacted", label: "Contacted", color: "border-purple-200 bg-purple-50 text-purple-800" },
  { id: "interested", label: "Interested", color: "border-amber-200 bg-amber-50 text-amber-800" },
  { id: "meeting", label: "Meeting Scheduled", color: "border-indigo-200 bg-indigo-50 text-indigo-800" },
  { id: "proposal", label: "Proposal Sent", color: "border-orange-200 bg-orange-50 text-orange-800" },
  { id: "won", label: "Won", color: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  { id: "lost", label: "Lost", color: "border-red-200 bg-red-50 text-red-800" },
];

export default function EmployeeCRMPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Selection
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [intelModalOpen, setIntelModalOpen] = useState(false);
  const [newProspectModalOpen, setNewProspectModalOpen] = useState(false);
  const [leadDetailId, setLeadDetailId] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);

  // Web Speech API
  const recognitionRef = useRef<any>(null);

  const loadLeads = useCallback(() => {
    setLoading(true);
    getEmployeeCRMLeads()
      .then((data) => setLeads(data.leads || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Initialize speech recognition if supported
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (selectedLead) {
          logQuickNote(selectedLead.id, `Voice Note: "${transcript}"`);
        }
        setRecording(false);
      };

      recognitionRef.current.onerror = () => setRecording(false);
      recognitionRef.current.onend = () => setRecording(false);
    }
    loadLeads();
  }, [loadLeads, selectedLead]);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("leadId", leadId);
  };

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");

    // Optimistic UI update
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l)));

    try {
      await updateLeadStage(leadId, newStage);
      loadLeads();
    } catch (err) {
      console.error(err);
      loadLeads(); // Revert on failure
    }
  };

  const logQuickNote = async (leadId: string, noteText: string) => {
    try {
      await addLeadNote(leadId, noteText);
      loadLeads();
    } catch (err: any) {
      alert(err.message || "Failed to log note.");
    }
  };

  const startRecording = (lead: any) => {
    setSelectedLead(lead);
    if (recognitionRef.current) {
      setRecording(true);
      recognitionRef.current.start();
    } else {
      alert("Voice dictation is not supported in this browser.");
    }
  };

  const getLeadsForStage = (stageId: string) => leads.filter((l) => l.stage === stageId);

  return (
    <div className="flex h-full flex-col font-[family-name:var(--font-poppins)]">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-montserrat)] text-xl font-bold text-ink-900 dark:text-white">Pipeline & CRM</h1>
          <p className="text-sm text-ink-900/60 dark:text-gray-400">
            Drag and drop leads to update status or use quick actions to log field activity.
          </p>
        </div>
        <button
          onClick={() => setNewProspectModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={16} /> New Prospect
        </button>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 animate-pulse">Loading pipeline...</div>
      ) : (
        <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageLeads = getLeadsForStage(stage.id);
            return (
              <div
                key={stage.id}
                className="flex w-72 flex-shrink-0 flex-col rounded-2xl bg-gray-100/60 p-3 dark:bg-gray-900/60 border border-black/5 dark:border-white/5"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${stage.color}`}>
                    {stage.label}
                  </span>
                  <span className="text-xs font-medium text-gray-500">{stageLeads.length}</span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      className="group cursor-grab active:cursor-grabbing rounded-xl border border-black/5 bg-white p-3 shadow-sm hover:border-brand-500 hover:shadow-md transition-all dark:border-white/10 dark:bg-gray-800"
                    >
                      <div className="flex items-start justify-between">
                        <h3
                          onClick={() => setLeadDetailId(lead.id)}
                          className="font-semibold text-ink-900 dark:text-white text-sm cursor-pointer hover:text-brand-600 dark:hover:text-brand-400"
                        >
                          {lead.business_name}
                        </h3>
                        <button
                          onClick={() => setLeadDetailId(lead.id)}
                          className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-gray-600"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                        {lead.category_name || "Restaurant"} · {lead.address || "No address"}
                      </p>

                      {/* B2B Score & Quick Contact */}
                      <div className="mt-2 flex items-center justify-between">
                        {(() => {
                          const b2b = calculateB2BLeadScore(lead);
                          return (
                            <span className="relative group/score">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold rounded-full border px-2 py-0.5 cursor-help ${b2b.badgeBg}`}>
                                <Flame size={10} /> {b2b.score} · {b2b.tier}
                              </span>
                              {/* Hover Tooltip showing GastroIndex factors */}
                              <span className="absolute left-0 bottom-full mb-2 w-48 hidden group-hover/score:block z-35 bg-gray-950/95 text-white text-[10px] p-2.5 rounded-xl border border-white/10 shadow-xl pointer-events-none backdrop-blur-md">
                                <strong className="block text-white/50 mb-1 font-[family-name:var(--font-montserrat)] text-[9px] uppercase tracking-wider">Score Breakdown:</strong>
                                <ul className="list-disc list-inside space-y-0.5 text-white/80">
                                  {b2b.reasons.map((r, idx) => (
                                    <li key={idx} className="truncate">{r}</li>
                                  ))}
                                </ul>
                              </span>
                            </span>
                          );
                        })()}
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.business_name + " " + (lead.address || ""))}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                            title="Navigate in Google Maps"
                          >
                            <Navigation size={12} />
                          </a>
                          {lead.phone && (
                            <>
                              <a href={`tel:${lead.phone}`} className="text-gray-400 hover:text-brand-600 transition-colors p-1" title="Call"><Phone size={12} /></a>
                              <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors p-1" title="WhatsApp">💬</a>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-2 dark:border-white/5">
                        {lead.next_follow_up ? (
                          <div className="flex items-center gap-1 text-[10px] font-medium text-amber-600">
                            <Calendar size={12} /> {new Date(lead.next_follow_up).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400">No follow-up set</span>
                        )}

                        <div className="flex gap-0.5" title={`Priority Level ${lead.priority || 3}`}>
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-1.5 w-1.5 rounded-full ${
                                i < (lead.priority || 3) ? "bg-red-500" : "bg-gray-200 dark:bg-gray-700"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* QUICK ACTIONS TOOLBAR */}
                      <div className="mt-3 flex gap-1 border-t border-black/5 pt-2 opacity-0 group-hover:opacity-100 transition-opacity dark:border-white/5">
                        <button
                          onClick={() => startRecording(lead)}
                          className={`flex-1 rounded-md py-1.5 flex justify-center text-gray-500 hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-gray-700 ${
                            recording && selectedLead?.id === lead.id
                              ? "text-red-500 bg-red-50 dark:bg-red-900/30 animate-pulse"
                              : ""
                          }`}
                          title="Voice Dictation Note"
                        >
                          <Mic size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedLead(lead);
                            setIntelModalOpen(true);
                          }}
                          className="flex-1 rounded-md py-1.5 flex justify-center text-gray-500 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-700"
                          title="Market Intelligence"
                        >
                          <BrainCircuit size={14} />
                        </button>
                        <button
                          onClick={() => logQuickNote(lead.id, "Owner Not Available during field visit.")}
                          className="flex-1 rounded-md py-1.5 flex justify-center text-gray-500 hover:bg-gray-100 hover:text-amber-600 dark:hover:bg-gray-700"
                          title="Log: Owner Not Available"
                        >
                          <XCircle size={14} />
                        </button>
                        <button
                          onClick={() => logQuickNote(lead.id, "Left catalog and business card at store.")}
                          className="flex-1 rounded-md py-1.5 flex justify-center text-gray-500 hover:bg-gray-100 hover:text-emerald-600 dark:hover:bg-gray-700"
                          title="Log: Left Catalog"
                        >
                          <CheckSquare size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Intelligence Modal */}
      {intelModalOpen && selectedLead && (
        <IntelligenceModal
          businessId={selectedLead.business_id}
          leadId={selectedLead.id}
          businessName={selectedLead.business_name}
          onClose={() => setIntelModalOpen(false)}
          onSaved={() => {
            setIntelModalOpen(false);
            loadLeads();
          }}
        />
      )}

      {/* New Prospect Claim / Add Modal */}
      {newProspectModalOpen && (
        <NewProspectModal
          onClose={() => setNewProspectModalOpen(false)}
          onClaimed={() => {
            setNewProspectModalOpen(false);
            loadLeads();
          }}
        />
      )}

      {/* Full Restaurant / Lead Details Modal */}
      {leadDetailId && (
        <RestaurantLeadModal
          leadId={leadDetailId}
          onClose={() => setLeadDetailId(null)}
          onUpdated={loadLeads}
        />
      )}

      {/* Voice Note Recording overlay feedback */}
      {recording && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] flex items-center gap-3 bg-red-600 px-5 py-3 rounded-full shadow-2xl text-white animate-bounce border border-red-500">
          <Mic size={15} className="animate-pulse text-white" />
          <span className="text-[11px] font-bold uppercase tracking-wider font-[family-name:var(--font-montserrat)]">
            Listening to Voice Note...
          </span>
          <div className="flex items-end gap-0.5 h-3">
            <span className="w-0.5 bg-white animate-pulse" style={{ height: "40%", animationDuration: "0.6s" }} />
            <span className="w-0.5 bg-white animate-pulse" style={{ height: "80%", animationDuration: "0.4s" }} />
            <span className="w-0.5 bg-white animate-pulse" style={{ height: "50%", animationDuration: "0.8s" }} />
          </div>
        </div>
      )}
    </div>
  );
}
