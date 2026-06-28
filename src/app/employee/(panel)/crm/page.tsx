"use client";

import { useEffect, useState, useRef } from "react";
import { Users, MoreHorizontal, Calendar, GripVertical, Mic, MessageSquare, CheckSquare, XCircle, BrainCircuit } from "lucide-react";
import IntelligenceModal from "@/components/employee/IntelligenceModal";

const STAGES = [
  { id: "new", label: "New Lead", color: "border-blue-200 bg-blue-50 text-blue-800" },
  { id: "contacted", label: "Contacted", color: "border-purple-200 bg-purple-50 text-purple-800" },
  { id: "interested", label: "Interested", color: "border-amber-200 bg-amber-50 text-amber-800" },
  { id: "meeting", label: "Meeting Scheduled", color: "border-indigo-200 bg-indigo-50 text-indigo-800" },
  { id: "proposal", label: "Proposal Sent", color: "border-orange-200 bg-orange-50 text-orange-800" },
  { id: "won", label: "Won", color: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  { id: "lost", label: "Lost", color: "border-red-200 bg-red-50 text-red-800" }
];

export default function EmployeeCRMPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Feature states
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [intelModalOpen, setIntelModalOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  
  // Web Speech API
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize speech recognition if supported
    if (typeof window !== "undefined" && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        logActivity(selectedLead.id, "voice_note", transcript);
        setRecording(false);
      };
      
      recognitionRef.current.onerror = () => setRecording(false);
      recognitionRef.current.onend = () => setRecording(false);
    }
    fetch("/api/employee/crm")
      .then((res) => res.json())
      .then((data) => {
        setLeads(data.leads || []);
        setLoading(false);
      });
  }, []);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("leadId", leadId);
  };

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    
    // Optimistic UI update
    setLeads((prev) => 
      prev.map(l => l.id === leadId ? { ...l, stage: newStage } : l)
    );

    await fetch("/api/employee/crm", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, newStage })
    });
  };

  const logActivity = async (leadId: string, type: string, note: string) => {
    // In a real app, POST to /api/employee/activities
    alert(`Logged ${type}: "${note}" for lead ID ${leadId}`);
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

  const getLeadsForStage = (stageId: string) => leads.filter(l => l.stage === stageId);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-900 dark:text-white">Pipeline & CRM</h1>
          <p className="text-sm text-ink-900/60 dark:text-gray-400">Drag and drop leads to update their status.</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          <Users size={16} /> New Prospect
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">Loading pipeline...</div>
      ) : (
        <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <div 
              key={stage.id} 
              className="flex w-72 flex-shrink-0 flex-col rounded-2xl bg-gray-100/50 p-3 dark:bg-gray-900/50"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${stage.color}`}>
                  {stage.label}
                </span>
                <span className="text-xs font-medium text-gray-500">{getLeadsForStage(stage.id).length}</span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto">
                {getLeadsForStage(stage.id).map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    className="group cursor-grab active:cursor-grabbing rounded-xl border border-black/5 bg-white p-3 shadow-sm hover:border-brand-500 hover:shadow-md transition-all dark:border-white/10 dark:bg-gray-800"
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-ink-900 dark:text-white text-sm">{lead.business_name}</h3>
                      <button className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-gray-600"><MoreHorizontal size={14} /></button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">{lead.category_name} · {lead.address}</p>
                    
                    <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-2 dark:border-white/5">
                      {lead.next_follow_up ? (
                        <div className="flex items-center gap-1 text-[10px] font-medium text-amber-600">
                          <Calendar size={12} /> {new Date(lead.next_follow_up).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400">No follow-up set</span>
                      )}
                      
                      <div className="flex gap-0.5">
                        {/* Priority indicator */}
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className={`h-1.5 w-1.5 rounded-full ${i < lead.priority ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                        ))}
                      </div>
                    </div>

                    {/* QUICK ACTIONS TOOLBAR */}
                    <div className="mt-3 flex gap-1 border-t border-black/5 pt-2 opacity-0 group-hover:opacity-100 transition-opacity dark:border-white/5">
                      <button 
                        onClick={() => startRecording(lead)}
                        className={`flex-1 rounded-md py-1.5 flex justify-center text-gray-500 hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-gray-700 ${recording && selectedLead?.id === lead.id ? 'text-red-500 bg-red-50 dark:bg-red-900/30 animate-pulse' : ''}`}
                        title="Voice Note"
                      >
                        <Mic size={14} />
                      </button>
                      <button 
                        onClick={() => { setSelectedLead(lead); setIntelModalOpen(true); }}
                        className="flex-1 rounded-md py-1.5 flex justify-center text-gray-500 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-700"
                        title="Market Intelligence"
                      >
                        <BrainCircuit size={14} />
                      </button>
                      <button 
                        onClick={() => logActivity(lead.id, "one_tap", "Owner Not Available")}
                        className="flex-1 rounded-md py-1.5 flex justify-center text-gray-500 hover:bg-gray-100 hover:text-amber-600 dark:hover:bg-gray-700"
                        title="Owner Not Available"
                      >
                        <XCircle size={14} />
                      </button>
                      <button 
                        onClick={() => logActivity(lead.id, "one_tap", "Left Catalog")}
                        className="flex-1 rounded-md py-1.5 flex justify-center text-gray-500 hover:bg-gray-100 hover:text-emerald-600 dark:hover:bg-gray-700"
                        title="Left Catalog"
                      >
                        <CheckSquare size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {intelModalOpen && selectedLead && (
        <IntelligenceModal
          businessId={selectedLead.id} // Assuming lead.id maps or we pass the right ID. In real app lead.business_id
          businessName={selectedLead.business_name}
          onClose={() => setIntelModalOpen(false)}
          onSaved={() => {
            setIntelModalOpen(false);
            alert("Intelligence Saved!");
          }}
        />
      )}
    </div>
  );
}
