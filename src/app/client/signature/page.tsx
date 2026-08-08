"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PenLine, Plus, X, Check, Clock, Trash2, Send, FileText, Mail } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import ModuleHeaderIcon from "@/components/ModuleHeaderIcon";

const ease = [0.22, 1, 0.36, 1] as const;
function uid() { return Math.random().toString(36).slice(2, 10); }

type SigStatus = "en_attente" | "signe" | "refuse" | "expire";
interface Doc { id: string; name: string; signataire: string; email: string; sentAt: string; signedAt?: string; status: SigStatus }

const STATUS_CFG: Record<SigStatus, { label: string; color: string; icon: string }> = {
  en_attente: { label: "En attente",  color: "#f59e0b", icon: "⏳" },
  signe:      { label: "Signé",       color: "#10b981", icon: "✅" },
  refuse:     { label: "Refusé",      color: "#ef4444", icon: "❌" },
  expire:     { label: "Expiré",      color: "#6b7280", icon: "⏰" },
};

const DEMO: Doc[] = [
  { id: "1", name: "Contrat de prestation — Durand",   signataire: "Thomas Durand",  email: "t.durand@mail.fr",   sentAt: "2026-08-01", signedAt: "2026-08-02", status: "signe" },
  { id: "2", name: "Devis site vitrine 2026",           signataire: "Marie Lefevre",  email: "m.lefevre@mail.fr",  sentAt: "2026-08-06", status: "en_attente" },
  { id: "3", name: "Convention de formation — Martin", signataire: "Sophie Martin",  email: "s.martin@mail.fr",   sentAt: "2026-07-20", status: "expire" },
];

export default function SignaturePage() {
  const { isDark } = useTheme();
  const [docs, setDocs]     = useState<Doc[]>(DEMO);
  const [creating, setCreating] = useState(false);
  const [form, setForm]     = useState({ name: "", signataire: "", email: "", message: "" });

  const s = {
    card:  isDark ? "bg-white/[0.03] border-white/[0.07]"  : "bg-white border-black/[0.07] shadow-sm",
    text:  isDark ? "text-white/85"                          : "text-gray-800",
    muted: isDark ? "text-white/35"                          : "text-gray-400",
    input: `w-full rounded-xl px-3 py-2.5 text-[12.5px] outline-none border ${isDark ? "bg-white/[0.05] border-white/[0.10] text-white placeholder:text-white/25" : "bg-black/[0.03] border-black/[0.08] text-gray-800 placeholder:text-gray-400"}`,
  };

  function send() {
    if (!form.name.trim() || !form.signataire.trim() || !form.email.trim()) return;
    setDocs(prev => [{ id: uid(), name: form.name.trim(), signataire: form.signataire.trim(), email: form.email.trim(), sentAt: new Date().toISOString().slice(0, 10), status: "en_attente" }, ...prev]);
    setForm({ name: "", signataire: "", email: "", message: "" });
    setCreating(false);
  }

  const signedCount = docs.filter(d => d.status === "signe").length;
  const pendingCount = docs.filter(d => d.status === "en_attente").length;

  return (
    <div className={`min-h-full pb-20 ${isDark ? "bg-[#07080e]" : "bg-[#f0f2f5]"}`}>

      <div className="px-4 pt-5 pb-4">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}
          className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ModuleHeaderIcon icon={PenLine} color="#059669" />
            <div>
              <h1 className={`text-[17px] font-black ${s.text}`}>Signature électronique</h1>
              <p className={`text-[10px] ${s.muted}`}>{signedCount} signés · {pendingCount} en attente</p>
            </div>
          </div>
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold text-white"
            style={{ background: "linear-gradient(135deg,#059669,#047857)" }}>
            <Send size={13} /> Envoyer
          </button>
        </motion.div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: "Total",        val: docs.length,  color: "#0ea5e9" },
            { label: "Signés",       val: signedCount,  color: "#10b981" },
            { label: "En attente",   val: pendingCount, color: "#f59e0b" },
          ].map(k => (
            <div key={k.label} className={`rounded-xl border p-3 text-center ${s.card}`}>
              <p className="text-[18px] font-black" style={{ color: k.color }}>{k.val}</p>
              <p className={`text-[9px] mt-0.5 ${s.muted}`}>{k.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-2.5">
        <AnimatePresence mode="popLayout">
          {docs.map((doc, i) => {
            const cfg = STATUS_CFG[doc.status];
            return (
              <motion.div key={doc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease, delay: i * 0.04 }}
                className={`rounded-2xl border p-4 ${s.card}`}>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center"
                    style={{ background: cfg.color + "18", border: `1px solid ${cfg.color}30` }}>
                    <FileText size={16} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-[13px] font-bold truncate ${s.text}`}>{doc.name}</p>
                      <span className="text-[9.5px] font-bold rounded-full px-2 py-0.5 shrink-0"
                        style={{ background: cfg.color + "18", color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <p className={`text-[11px] ${s.muted}`}>{doc.signataire}</p>
                      <p className={`text-[10px] font-mono ${s.muted}`}>{doc.email}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <Send size={9} className={s.muted} />
                        <p className={`text-[10px] ${s.muted}`}>Envoyé le {doc.sentAt}</p>
                      </div>
                      {doc.signedAt && (
                        <div className="flex items-center gap-1">
                          <Check size={9} style={{ color: "#10b981" }} />
                          <p className="text-[10px] text-emerald-400">Signé le {doc.signedAt}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setDocs(p => p.filter(d => d.id !== doc.id))}
                    className={`rounded-lg p-1.5 hover:text-red-400 transition-colors ${s.muted}`}>
                    <Trash2 size={11} />
                  </button>
                </div>
                {doc.status === "en_attente" && (
                  <button onClick={() => setDocs(p => p.map(d => d.id === doc.id ? { ...d, status: "signe", signedAt: new Date().toISOString().slice(0, 10) } : d))}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-[11px] font-bold"
                    style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}>
                    <Check size={11} /> Marquer comme signé (test)
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {creating && (
          <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCreating(false)} />
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className={`relative z-10 w-full max-w-md rounded-3xl p-6 space-y-4 ${isDark ? "bg-[#0e1420] border border-white/[0.09]" : "bg-white border border-black/[0.07]"}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-[15px] font-black ${s.text}`}>Envoyer pour signature</h2>
                <button onClick={() => setCreating(false)} className={`rounded-xl p-2 ${s.muted}`}><X size={16} /></button>
              </div>
              <div className="space-y-3">
                {[
                  { key: "name",       label: "Nom du document *", placeholder: "Contrat de prestation — Client",  icon: FileText },
                  { key: "signataire", label: "Signataire *",       placeholder: "Nom complet du signataire",       icon: PenLine },
                  { key: "email",      label: "Email du signataire *", placeholder: "client@email.com",             icon: Mail },
                ].map(f => (
                  <div key={f.key}>
                    <label className={`block text-[10.5px] font-semibold mb-1 ${s.muted}`}>{f.label}</label>
                    <div className="relative">
                      <f.icon size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${s.muted}`} />
                      <input className={s.input + " pl-8"} placeholder={f.placeholder}
                        value={(form as Record<string, string>)[f.key]}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                    </div>
                  </div>
                ))}
                <div>
                  <label className={`block text-[10.5px] font-semibold mb-1 ${s.muted}`}>Message (optionnel)</label>
                  <textarea className={s.input} rows={2} placeholder="Bonjour, merci de signer ce document…" value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} />
                </div>
              </div>
              <button onClick={send} disabled={!form.name.trim() || !form.signataire.trim() || !form.email.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-black text-white disabled:opacity-40 transition"
                style={{ background: "linear-gradient(135deg,#059669,#047857)" }}>
                <Send size={15} /> Envoyer pour signature
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
