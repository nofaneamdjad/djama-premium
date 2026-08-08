"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarPlus, Plus, X, Check, Clock, User, Trash2, ChevronDown, Phone } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import ModuleHeaderIcon from "@/components/ModuleHeaderIcon";

const ease = [0.22, 1, 0.36, 1] as const;
function uid() { return Math.random().toString(36).slice(2, 10); }

const SERVICES = ["Consultation", "Coaching", "Coupe & Coiffure", "Massage", "Audit", "Atelier", "Formation", "Autre"];
const STATUS_COLORS = { confirme: "#10b981", en_attente: "#f59e0b", annule: "#ef4444", termine: "#6366f1" };
const STATUS_LABELS = { confirme: "Confirmé", en_attente: "En attente", annule: "Annulé", termine: "Terminé" };

type RdvStatus = keyof typeof STATUS_COLORS;
interface Rdv { id: string; client: string; phone: string; service: string; date: string; time: string; duration: number; status: RdvStatus; notes: string }

const DEMO: Rdv[] = [
  { id: "1", client: "Sophie Martin", phone: "06 12 34 56 78", service: "Coaching", date: new Date().toISOString().slice(0, 10), time: "10:00", duration: 60, status: "confirme", notes: "" },
  { id: "2", client: "Thomas Durand", phone: "07 98 76 54 32", service: "Consultation", date: new Date().toISOString().slice(0, 10), time: "14:30", duration: 45, status: "en_attente", notes: "Premier RDV" },
];

export default function RendezVousPage() {
  const { isDark } = useTheme();
  const [rdvs, setRdvs]       = useState<Rdv[]>(DEMO);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft]       = useState<Partial<Rdv>>({ service: SERVICES[0], duration: 60, status: "confirme" });
  const [filter, setFilter]     = useState<"all" | RdvStatus>("all");

  const s = {
    card:  isDark ? "bg-white/[0.03] border-white/[0.07]"      : "bg-white border-black/[0.07] shadow-sm",
    text:  isDark ? "text-white/85"                             : "text-gray-800",
    muted: isDark ? "text-white/35"                             : "text-gray-400",
    input: `w-full rounded-xl px-3 py-2 text-[12.5px] outline-none border ${isDark ? "bg-white/[0.05] border-white/[0.10] text-white placeholder:text-white/25" : "bg-black/[0.03] border-black/[0.08] text-gray-800 placeholder:text-gray-400"}`,
  };

  function save() {
    if (!draft.client?.trim() || !draft.date || !draft.time) return;
    const r: Rdv = { id: uid(), client: draft.client!, phone: draft.phone ?? "", service: draft.service!, date: draft.date!, time: draft.time!, duration: draft.duration ?? 60, status: draft.status as RdvStatus ?? "confirme", notes: draft.notes ?? "" };
    setRdvs(prev => [r, ...prev]);
    setDraft({ service: SERVICES[0], duration: 60, status: "confirme" });
    setCreating(false);
  }

  const filtered = filter === "all" ? rdvs : rdvs.filter(r => r.status === filter);
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = rdvs.filter(r => r.date === today && r.status !== "annule").length;

  return (
    <div className={`min-h-full pb-20 ${isDark ? "bg-[#07080e]" : "bg-[#f0f2f5]"}`}>

      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}
          className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ModuleHeaderIcon icon={CalendarPlus} color="#0891b2" />
            <div>
              <h1 className={`text-[17px] font-black ${s.text}`}>Rendez-vous</h1>
              <p className={`text-[10px] ${s.muted}`}>{todayCount} aujourd'hui · {rdvs.length} total</p>
            </div>
          </div>
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold text-white"
            style={{ background: "linear-gradient(135deg,#0891b2,#0e7490)" }}>
            <Plus size={14} /> Nouveau RDV
          </button>
        </motion.div>

        {/* Filtres */}
        <div className="flex gap-1.5 mt-3 overflow-x-auto pb-0.5 no-scrollbar">
          {(["all", "confirme", "en_attente", "annule", "termine"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="shrink-0 rounded-full px-3 py-1 text-[10.5px] font-semibold transition-all"
              style={filter === f
                ? { background: f === "all" ? "rgba(8,145,178,0.18)" : STATUS_COLORS[f as RdvStatus] + "22", color: f === "all" ? "#0891b2" : STATUS_COLORS[f as RdvStatus], border: `1px solid ${f === "all" ? "rgba(8,145,178,0.35)" : STATUS_COLORS[f as RdvStatus] + "44"}` }
                : { background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}` }
              }>
              {f === "all" ? "Tous" : STATUS_LABELS[f as RdvStatus]}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      <div className="px-4 space-y-2">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-16 gap-3 text-center">
              <CalendarPlus size={36} className={s.muted} />
              <p className={`text-[13px] font-semibold ${s.muted}`}>Aucun rendez-vous</p>
            </div>
          )}
          {filtered.map((rdv, i) => {
            const col = STATUS_COLORS[rdv.status];
            return (
              <motion.div key={rdv.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease, delay: i * 0.03 }}
                className={`rounded-2xl border p-4 ${s.card}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-white text-[13px] font-black"
                      style={{ background: col + "22", border: `1px solid ${col}44`, color: col }}>
                      {rdv.client.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[13px] font-bold truncate ${s.text}`}>{rdv.client}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10.5px] ${s.muted}`}>{rdv.service}</span>
                        <span className={`text-[10.5px] ${s.muted}`}>·</span>
                        <Clock size={10} className={s.muted} />
                        <span className={`text-[10.5px] ${s.muted}`}>{rdv.time} ({rdv.duration} min)</span>
                      </div>
                      {rdv.phone && <p className={`text-[10px] mt-0.5 ${s.muted}`}>{rdv.phone}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9.5px] font-bold rounded-full px-2 py-0.5"
                      style={{ background: col + "18", color: col, border: `1px solid ${col}30` }}>
                      {STATUS_LABELS[rdv.status]}
                    </span>
                    <span className={`text-[10px] font-mono ${s.muted}`}>{rdv.date}</span>
                    <button onClick={() => setRdvs(p => p.filter(r => r.id !== rdv.id))}
                      className={`rounded-lg p-1.5 hover:text-red-400 transition-colors ${s.muted}`}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
                {rdv.notes && <p className={`mt-2 text-[11px] leading-relaxed ${s.muted}`}>{rdv.notes}</p>}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Modal création */}
      <AnimatePresence>
        {creating && (
          <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCreating(false)} />
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className={`relative z-10 w-full max-w-md rounded-3xl p-6 space-y-4 ${isDark ? "bg-[#0e1420] border border-white/[0.09]" : "bg-white border border-black/[0.07]"}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-[15px] font-black ${s.text}`}>Nouveau rendez-vous</h2>
                <button onClick={() => setCreating(false)} className={`rounded-xl p-2 ${s.muted}`}><X size={16} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={`block text-[10.5px] font-semibold mb-1 ${s.muted}`}>Client *</label>
                  <div className="relative"><User size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${s.muted}`} />
                    <input className={s.input + " pl-8"} placeholder="Nom du client" value={draft.client ?? ""} onChange={e => setDraft(p => ({ ...p, client: e.target.value }))} /></div>
                </div>
                <div>
                  <label className={`block text-[10.5px] font-semibold mb-1 ${s.muted}`}>Téléphone</label>
                  <div className="relative"><Phone size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${s.muted}`} />
                    <input className={s.input + " pl-8"} placeholder="06 …" value={draft.phone ?? ""} onChange={e => setDraft(p => ({ ...p, phone: e.target.value }))} /></div>
                </div>
                <div>
                  <label className={`block text-[10.5px] font-semibold mb-1 ${s.muted}`}>Service</label>
                  <div className="relative">
                    <select className={s.input + " appearance-none pr-8"} value={draft.service} onChange={e => setDraft(p => ({ ...p, service: e.target.value }))}>
                      {SERVICES.map(s2 => <option key={s2}>{s2}</option>)}
                    </select>
                    <ChevronDown size={12} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${s.muted}`} />
                  </div>
                </div>
                <div>
                  <label className={`block text-[10.5px] font-semibold mb-1 ${s.muted}`}>Date *</label>
                  <input type="date" className={s.input} value={draft.date ?? ""} onChange={e => setDraft(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div>
                  <label className={`block text-[10.5px] font-semibold mb-1 ${s.muted}`}>Heure *</label>
                  <input type="time" className={s.input} value={draft.time ?? ""} onChange={e => setDraft(p => ({ ...p, time: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className={`block text-[10.5px] font-semibold mb-1 ${s.muted}`}>Durée (min)</label>
                  <div className="flex gap-2">
                    {[30, 45, 60, 90, 120].map(d => (
                      <button key={d} onClick={() => setDraft(p => ({ ...p, duration: d }))}
                        className="flex-1 rounded-xl py-1.5 text-[11px] font-bold transition"
                        style={draft.duration === d ? { background: "#0891b2", color: "white" } : { background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className={`block text-[10.5px] font-semibold mb-1 ${s.muted}`}>Notes</label>
                  <textarea className={s.input} rows={2} placeholder="Informations supplémentaires…" value={draft.notes ?? ""} onChange={e => setDraft(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>
              <button onClick={save} disabled={!draft.client?.trim() || !draft.date || !draft.time}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-black text-white disabled:opacity-40 transition"
                style={{ background: "linear-gradient(135deg,#0891b2,#0e7490)" }}>
                <Check size={15} /> Confirmer le RDV
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
