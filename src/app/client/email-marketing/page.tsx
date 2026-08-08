"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Plus, X, Send, Trash2, Eye, BarChart2, Users, Check } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import ModuleHeaderIcon from "@/components/ModuleHeaderIcon";

const ease = [0.22, 1, 0.36, 1] as const;
function uid() { return Math.random().toString(36).slice(2, 10); }

type CampStatus = "brouillon" | "planifiee" | "envoyee";
interface Campaign { id: string; subject: string; preview: string; recipients: number; sentAt?: string; status: CampStatus; openRate?: number; clickRate?: number }

const STATUS_CFG: Record<CampStatus, { label: string; color: string }> = {
  brouillon:  { label: "Brouillon",   color: "#6b7280" },
  planifiee:  { label: "Planifiée",   color: "#f59e0b" },
  envoyee:    { label: "Envoyée",     color: "#10b981" },
};

const DEMO: Campaign[] = [
  { id: "1", subject: "Nouvelles offres été 2026 🌞",       preview: "Découvrez nos forfaits exclusifs…", recipients: 312, sentAt: "2026-08-01", status: "envoyee", openRate: 38, clickRate: 12 },
  { id: "2", subject: "Rappel : Votre rendez-vous demain",  preview: "Bonjour, nous vous rappelons…",     recipients: 47,  sentAt: "2026-08-07", status: "envoyee", openRate: 71, clickRate: 24 },
  { id: "3", subject: "Nouveautés DJAMA — Août 2026",       preview: "Voici les dernières fonctionnalités…", recipients: 500, status: "planifiee" },
  { id: "4", subject: "Newsletter mensuelle",               preview: "Au programme ce mois-ci…",          recipients: 0,   status: "brouillon" },
];

export default function EmailMarketingPage() {
  const { isDark } = useTheme();
  const [campaigns, setCampaigns] = useState<Campaign[]>(DEMO);
  const [creating, setCreating]   = useState(false);
  const [form, setForm]           = useState({ subject: "", preview: "", recipients: "" });
  const [tab, setTab]             = useState<"campaigns" | "contacts">("campaigns");

  const s = {
    card:  isDark ? "bg-white/[0.03] border-white/[0.07]"  : "bg-white border-black/[0.07] shadow-sm",
    text:  isDark ? "text-white/85"                          : "text-gray-800",
    muted: isDark ? "text-white/35"                          : "text-gray-400",
    input: `w-full rounded-xl px-3 py-2.5 text-[12.5px] outline-none border ${isDark ? "bg-white/[0.05] border-white/[0.10] text-white placeholder:text-white/25" : "bg-black/[0.03] border-black/[0.08] text-gray-800 placeholder:text-gray-400"}`,
  };

  function create() {
    if (!form.subject.trim()) return;
    setCampaigns(prev => [{ id: uid(), subject: form.subject.trim(), preview: form.preview.trim() || "Aperçu de la campagne…", recipients: parseInt(form.recipients) || 0, status: "brouillon" }, ...prev]);
    setForm({ subject: "", preview: "", recipients: "" });
    setCreating(false);
  }

  const totalSent = campaigns.filter(c => c.status === "envoyee").reduce((s2, c) => s2 + (c.recipients || 0), 0);
  const avgOpen   = campaigns.filter(c => c.openRate).reduce((s2, c, _, a) => s2 + (c.openRate ?? 0) / a.length, 0);

  return (
    <div className={`min-h-full pb-20 ${isDark ? "bg-[#07080e]" : "bg-[#f0f2f5]"}`}>

      <div className="px-4 pt-5 pb-4">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}
          className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ModuleHeaderIcon icon={Mail} color="#e1306c" />
            <div>
              <h1 className={`text-[17px] font-black ${s.text}`}>Email Marketing</h1>
              <p className={`text-[10px] ${s.muted}`}>{totalSent.toLocaleString("fr-FR")} emails envoyés · {Math.round(avgOpen)}% taux d'ouverture</p>
            </div>
          </div>
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold text-white"
            style={{ background: "linear-gradient(135deg,#e1306c,#c0255a)" }}>
            <Plus size={14} /> Campagne
          </button>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1.5 mt-4">
          {(["campaigns", "contacts"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="rounded-xl px-4 py-1.5 text-[11.5px] font-semibold transition"
              style={tab === t
                ? { background: "rgba(225,48,108,0.15)", color: "#e1306c", border: "1px solid rgba(225,48,108,0.30)" }
                : { background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)", border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}` }}>
              {t === "campaigns" ? "Campagnes" : "Contacts"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4">
        {tab === "campaigns" && (
          <AnimatePresence mode="popLayout">
            <div className="space-y-2.5">
              {campaigns.map((c, i) => {
                const cfg = STATUS_CFG[c.status];
                return (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease, delay: i * 0.04 }}
                    className={`rounded-2xl border p-4 ${s.card}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center"
                          style={{ background: "rgba(225,48,108,0.10)", border: "1px solid rgba(225,48,108,0.22)" }}>
                          <Mail size={16} style={{ color: "#e1306c" }} />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-[13px] font-bold truncate ${s.text}`}>{c.subject}</p>
                          <p className={`text-[11px] truncate ${s.muted}`}>{c.preview}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9.5px] font-bold rounded-full px-2 py-0.5"
                          style={{ background: cfg.color + "18", color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                          {cfg.label}
                        </span>
                        <button onClick={() => setCampaigns(p => p.filter(x => x.id !== c.id))}
                          className={`rounded-lg p-1.5 hover:text-red-400 transition ${s.muted}`}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.05)" }}>
                      <div className="flex items-center gap-1">
                        <Users size={10} className={s.muted} />
                        <span className={`text-[10.5px] ${s.muted}`}>{c.recipients.toLocaleString()} destinataires</span>
                      </div>
                      {c.openRate != null && (
                        <>
                          <div className="flex items-center gap-1">
                            <Eye size={10} className={s.muted} />
                            <span className={`text-[10.5px] ${s.muted}`}>{c.openRate}% ouverture</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BarChart2 size={10} className={s.muted} />
                            <span className={`text-[10.5px] ${s.muted}`}>{c.clickRate}% clics</span>
                          </div>
                        </>
                      )}
                      {c.status === "brouillon" && (
                        <button onClick={() => setCampaigns(p => p.map(x => x.id === c.id ? { ...x, status: "planifiee" } : x))}
                          className="ml-auto flex items-center gap-1 text-[10.5px] font-bold rounded-lg px-2 py-1"
                          style={{ background: "rgba(225,48,108,0.10)", color: "#e1306c", border: "1px solid rgba(225,48,108,0.22)" }}>
                          <Send size={10} /> Planifier
                        </button>
                      )}
                      {c.status === "planifiee" && (
                        <button onClick={() => setCampaigns(p => p.map(x => x.id === c.id ? { ...x, status: "envoyee", sentAt: new Date().toISOString().slice(0, 10), openRate: 0, clickRate: 0 } : x))}
                          className="ml-auto flex items-center gap-1 text-[10.5px] font-bold rounded-lg px-2 py-1"
                          style={{ background: "rgba(16,185,129,0.10)", color: "#10b981", border: "1px solid rgba(16,185,129,0.22)" }}>
                          <Check size={10} /> Envoyer
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}

        {tab === "contacts" && (
          <div className={`rounded-2xl border p-8 text-center ${s.card} mt-2`}>
            <Users size={36} className={`mx-auto mb-3 ${s.muted}`} />
            <p className={`text-[13px] font-bold ${s.text}`}>Import de contacts</p>
            <p className={`text-[11px] mt-1 ${s.muted}`}>Importez votre liste de contacts CSV ou synchronisez depuis votre CRM</p>
            <button className="mt-4 mx-auto flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#e1306c,#c0255a)" }}>
              <Plus size={13} /> Importer des contacts
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {creating && (
          <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCreating(false)} />
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className={`relative z-10 w-full max-w-md rounded-3xl p-6 space-y-4 ${isDark ? "bg-[#0e1420] border border-white/[0.09]" : "bg-white border border-black/[0.07]"}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-[15px] font-black ${s.text}`}>Nouvelle campagne</h2>
                <button onClick={() => setCreating(false)} className={`rounded-xl p-2 ${s.muted}`}><X size={16} /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className={`block text-[10.5px] font-semibold mb-1 ${s.muted}`}>Objet de l'email *</label>
                  <input className={s.input} placeholder="Ex: Offres spéciales été 2026 🌞" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
                </div>
                <div>
                  <label className={`block text-[10.5px] font-semibold mb-1 ${s.muted}`}>Texte de prévisualisation</label>
                  <input className={s.input} placeholder="Ce que voient les destinataires avant d'ouvrir" value={form.preview} onChange={e => setForm(p => ({ ...p, preview: e.target.value }))} />
                </div>
                <div>
                  <label className={`block text-[10.5px] font-semibold mb-1 ${s.muted}`}>Nombre de destinataires</label>
                  <input type="number" min="0" className={s.input} placeholder="0" value={form.recipients} onChange={e => setForm(p => ({ ...p, recipients: e.target.value }))} />
                </div>
              </div>
              <button onClick={create} disabled={!form.subject.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-black text-white disabled:opacity-40 transition"
                style={{ background: "linear-gradient(135deg,#e1306c,#c0255a)" }}>
                <Mail size={15} /> Créer la campagne
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
