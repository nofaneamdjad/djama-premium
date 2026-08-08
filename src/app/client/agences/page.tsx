"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Plus, X, Phone, Mail, Globe, Trash2, Check, Building2 } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import ModuleHeaderIcon from "@/components/ModuleHeaderIcon";

const ease = [0.22, 1, 0.36, 1] as const;
function uid() { return Math.random().toString(36).slice(2, 10); }

type AgencyStatus = "partenaire" | "prospect" | "inactif";
interface Agency { id: string; name: string; type: string; contact: string; email: string; phone: string; website: string; status: AgencyStatus; since: string }

const STATUS_CFG: Record<AgencyStatus, { label: string; color: string }> = {
  partenaire: { label: "Partenaire", color: "#10b981" },
  prospect:   { label: "Prospect",   color: "#f59e0b" },
  inactif:    { label: "Inactif",    color: "#6b7280" },
};

const TYPES = ["Agence web", "Cabinet comptable", "Agence marketing", "Cabinet RH", "Agence de com", "Autre"];

const DEMO: Agency[] = [
  { id: "1", name: "NovaSite Agency",     type: "Agence web",       contact: "Marc Leclerc",    email: "marc@novasite.fr",     phone: "06 12 34 56 78", website: "novasite.fr",     status: "partenaire", since: "2025-01" },
  { id: "2", name: "ComptaPlus",           type: "Cabinet comptable", contact: "Sophie Durand",   email: "s.durand@comptaplus.fr", phone: "04 78 90 12 34", website: "comptaplus.fr",   status: "partenaire", since: "2025-06" },
  { id: "3", name: "DigitalBoost Agency",  type: "Agence marketing",  contact: "Karim Mansour",   email: "karim@digitalboost.fr", phone: "07 56 78 90 12", website: "digitalboost.fr", status: "prospect",   since: "2026-07" },
  { id: "4", name: "HR Solutions",         type: "Cabinet RH",        contact: "Claire Petit",    email: "c.petit@hrsolutions.fr", phone: "01 23 45 67 89", website: "hrsolutions.fr",  status: "inactif",    since: "2024-03" },
];

export default function AgencesPage() {
  const { isDark } = useTheme();
  const [agencies, setAgencies] = useState<Agency[]>(DEMO);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter]     = useState<AgencyStatus | "all">("all");
  const [form, setForm] = useState<Partial<Agency>>({ status: "prospect", type: TYPES[0] });

  const s = {
    card:  isDark ? "bg-white/[0.03] border-white/[0.07]"  : "bg-white border-black/[0.07] shadow-sm",
    text:  isDark ? "text-white/85"                          : "text-gray-800",
    muted: isDark ? "text-white/35"                          : "text-gray-400",
    input: `w-full rounded-xl px-3 py-2.5 text-[12.5px] outline-none border ${isDark ? "bg-white/[0.05] border-white/[0.10] text-white placeholder:text-white/25" : "bg-black/[0.03] border-black/[0.08] text-gray-800 placeholder:text-gray-400"}`,
  };

  function save() {
    if (!form.name?.trim()) return;
    setAgencies(prev => [{ id: uid(), name: form.name!, type: form.type!, contact: form.contact ?? "", email: form.email ?? "", phone: form.phone ?? "", website: form.website ?? "", status: form.status ?? "prospect", since: new Date().toISOString().slice(0, 7) }, ...prev]);
    setForm({ status: "prospect", type: TYPES[0] });
    setCreating(false);
  }

  const visible = filter === "all" ? agencies : agencies.filter(a => a.status === filter);

  return (
    <div className={`min-h-full pb-20 ${isDark ? "bg-[#07080e]" : "bg-[#f0f2f5]"}`}>
      <div className="px-4 pt-5 pb-4">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}
          className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ModuleHeaderIcon icon={Briefcase} color="#7c3aed" />
            <div>
              <h1 className={`text-[17px] font-black ${s.text}`}>Gestion des agences</h1>
              <p className={`text-[10px] ${s.muted}`}>{agencies.filter(a => a.status === "partenaire").length} partenaires · {agencies.filter(a => a.status === "prospect").length} prospects</p>
            </div>
          </div>
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold text-white"
            style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
            <Plus size={14} /> Agence
          </button>
        </motion.div>

        <div className="flex gap-1.5 mt-4">
          {(["all", "partenaire", "prospect", "inactif"] as const).map(f => {
            const cfg = f === "all" ? { label: "Toutes", color: "#7c3aed" } : STATUS_CFG[f];
            return (
              <button key={f} onClick={() => setFilter(f)}
                className="rounded-xl px-3 py-1.5 text-[11px] font-semibold transition"
                style={filter === f
                  ? { background: cfg.color + "22", color: cfg.color, border: `1px solid ${cfg.color}40` }
                  : { background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}` }}>
                {cfg.label} {f !== "all" && `(${agencies.filter(a => a.status === f).length})`}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 space-y-2.5">
        {visible.map((a, i) => {
          const cfg = STATUS_CFG[a.status];
          return (
            <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, ease }}
              className={`rounded-2xl border p-4 ${s.card}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)" }}>
                    <Building2 size={18} style={{ color: "#7c3aed" }} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-[13px] font-bold ${s.text}`}>{a.name}</p>
                    <p className={`text-[10.5px] ${s.muted}`}>{a.type} · {a.contact}</p>
                    <span className="text-[9.5px] font-bold rounded-full px-2 py-0.5 mt-1 inline-block"
                      style={{ background: cfg.color + "18", color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {a.status === "prospect" && (
                    <button onClick={() => setAgencies(p => p.map(x => x.id === a.id ? { ...x, status: "partenaire" } : x))}
                      className="h-7 w-7 rounded-lg flex items-center justify-center transition"
                      style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}>
                      <Check size={12} style={{ color: "#10b981" }} />
                    </button>
                  )}
                  <button onClick={() => setAgencies(p => p.filter(x => x.id !== a.id))}
                    className={`h-7 w-7 rounded-lg flex items-center justify-center hover:text-red-400 transition ${s.muted}`}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              {(a.email || a.phone || a.website) && (
                <div className="flex flex-wrap gap-3 mt-3 pt-3" style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)" }}>
                  {a.email && <div className="flex items-center gap-1"><Mail size={10} className={s.muted} /><span className={`text-[10.5px] ${s.muted}`}>{a.email}</span></div>}
                  {a.phone && <div className="flex items-center gap-1"><Phone size={10} className={s.muted} /><span className={`text-[10.5px] ${s.muted}`}>{a.phone}</span></div>}
                  {a.website && <div className="flex items-center gap-1"><Globe size={10} className={s.muted} /><span className={`text-[10.5px] ${s.muted}`}>{a.website}</span></div>}
                </div>
              )}
            </motion.div>
          );
        })}
        {visible.length === 0 && (
          <div className={`rounded-2xl border p-8 text-center ${s.card}`}>
            <Briefcase size={32} className={`mx-auto mb-2 ${s.muted}`} />
            <p className={`text-[12px] ${s.muted}`}>Aucune agence dans cette catégorie</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {creating && (
          <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCreating(false)} />
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className={`relative z-10 w-full max-w-sm rounded-3xl p-6 space-y-4 ${isDark ? "bg-[#0e1420] border border-white/[0.09]" : "bg-white border border-black/[0.07]"}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-[15px] font-black ${s.text}`}>Nouvelle agence</h2>
                <button onClick={() => setCreating(false)} className={`rounded-xl p-2 ${s.muted}`}><X size={16} /></button>
              </div>
              <div className="space-y-3">
                {[
                  { key: "name", label: "Nom de l'agence *", placeholder: "Ex: NovaSite Agency" },
                  { key: "contact", label: "Contact principal", placeholder: "Prénom Nom" },
                  { key: "email", label: "Email", placeholder: "contact@agence.fr" },
                  { key: "phone", label: "Téléphone", placeholder: "06 XX XX XX XX" },
                  { key: "website", label: "Site web", placeholder: "agence.fr" },
                ].map(f => (
                  <div key={f.key}>
                    <label className={`block text-[10.5px] font-semibold mb-1 ${s.muted}`}>{f.label}</label>
                    <input className={s.input} placeholder={f.placeholder} value={(form as Record<string,string>)[f.key] ?? ""}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                  </div>
                ))}
                <div>
                  <label className={`block text-[10.5px] font-semibold mb-1 ${s.muted}`}>Type</label>
                  <select className={s.input} value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={save} disabled={!form.name?.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-black text-white disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
                <Check size={15} /> Ajouter
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
