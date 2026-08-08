"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Plus, X, Copy, Check, Link2, Trash2, ExternalLink, Euro } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import ModuleHeaderIcon from "@/components/ModuleHeaderIcon";

const ease = [0.22, 1, 0.36, 1] as const;
function uid() { return Math.random().toString(36).slice(2, 10); }

type LinkStatus = "actif" | "paye" | "expire";
interface PayLink { id: string; label: string; amount: number; slug: string; status: LinkStatus; createdAt: string; paidAt?: string }

const STATUS_CFG = {
  actif:  { label: "Actif",  color: "#10b981" },
  paye:   { label: "Payé",   color: "#6366f1" },
  expire: { label: "Expiré", color: "#6b7280" },
};

const DEMO: PayLink[] = [
  { id: "1", label: "Coaching stratégie — Mai", amount: 350, slug: "coaching-mai-abc1", status: "paye",  createdAt: "2026-08-01", paidAt: "2026-08-03" },
  { id: "2", label: "Site vitrine TPE",          amount: 490, slug: "site-vitrine-def2", status: "actif", createdAt: "2026-08-07" },
  { id: "3", label: "Formation Excel avancé",    amount: 120, slug: "formation-xyz3",    status: "actif", createdAt: "2026-08-08" },
];

export default function PaiementsPage() {
  const { isDark } = useTheme();
  const [links, setLinks]     = useState<PayLink[]>(DEMO);
  const [creating, setCreating] = useState(false);
  const [label, setLabel]     = useState("");
  const [amount, setAmount]   = useState("");
  const [copied, setCopied]   = useState<string | null>(null);

  const s = {
    card:  isDark ? "bg-white/[0.03] border-white/[0.07]"  : "bg-white border-black/[0.07] shadow-sm",
    text:  isDark ? "text-white/85"                          : "text-gray-800",
    muted: isDark ? "text-white/35"                          : "text-gray-400",
    input: `w-full rounded-xl px-3 py-2.5 text-[12.5px] outline-none border ${isDark ? "bg-white/[0.05] border-white/[0.10] text-white placeholder:text-white/25" : "bg-black/[0.03] border-black/[0.08] text-gray-800 placeholder:text-gray-400"}`,
  };

  function createLink() {
    if (!label.trim() || !amount) return;
    const slug = label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + uid().slice(0, 4);
    setLinks(prev => [{ id: uid(), label: label.trim(), amount: parseFloat(amount), slug, status: "actif", createdAt: new Date().toISOString().slice(0, 10) }, ...prev]);
    setLabel(""); setAmount(""); setCreating(false);
  }

  function copyLink(slug: string) {
    void navigator.clipboard.writeText(`https://djama.pro/pay/${slug}`);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  }

  const totalCollecte = links.filter(l => l.status === "paye").reduce((s2, l) => s2 + l.amount, 0);
  const totalEnAttente = links.filter(l => l.status === "actif").reduce((s2, l) => s2 + l.amount, 0);

  return (
    <div className={`min-h-full pb-20 ${isDark ? "bg-[#07080e]" : "bg-[#f0f2f5]"}`}>

      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}
          className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ModuleHeaderIcon icon={QrCode} color="#7c3aed" />
            <div>
              <h1 className={`text-[17px] font-black ${s.text}`}>Liens de paiement</h1>
              <p className={`text-[10px] ${s.muted}`}>{links.filter(l => l.status === "actif").length} actifs · {links.filter(l => l.status === "paye").length} payés</p>
            </div>
          </div>
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold text-white"
            style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
            <Plus size={14} /> Créer un lien
          </button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2.5 mt-4">
          {[
            { label: "Collecté", value: totalCollecte, color: "#10b981" },
            { label: "En attente", value: totalEnAttente, color: "#f59e0b" },
          ].map(stat => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}
              className={`rounded-2xl border p-4 ${s.card}`}>
              <p className={`text-[10px] font-semibold mb-1 ${s.muted}`}>{stat.label}</p>
              <p className="text-[20px] font-black tabular-nums" style={{ color: stat.color }}>
                {stat.value.toLocaleString("fr-FR")} €
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Liste des liens */}
      <div className="px-4 space-y-2.5">
        <AnimatePresence mode="popLayout">
          {links.map((link, i) => {
            const cfg = STATUS_CFG[link.status];
            const url = `djama.pro/pay/${link.slug}`;
            return (
              <motion.div key={link.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease, delay: i * 0.04 }}
                className={`rounded-2xl border p-4 ${s.card}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)" }}>
                      <QrCode size={16} style={{ color: "#7c3aed" }} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[13px] font-bold truncate ${s.text}`}>{link.label}</p>
                      <p className="text-[11px] font-mono text-violet-400/70 truncate">{url}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <p className="text-[16px] font-black tabular-nums" style={{ color: cfg.color }}>
                      {link.amount.toLocaleString("fr-FR")} €
                    </p>
                    <span className="text-[9.5px] font-bold rounded-full px-2 py-0.5"
                      style={{ background: cfg.color + "18", color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                      {cfg.label}
                    </span>
                  </div>
                </div>

                {link.status === "actif" && (
                  <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)" }}>
                    <button onClick={() => copyLink(link.slug)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-1.5 text-[11px] font-bold transition"
                      style={{ background: "rgba(124,58,237,0.10)", border: "1px solid rgba(124,58,237,0.22)", color: "#a78bfa" }}>
                      {copied === link.slug ? <><Check size={11} /> Copié !</> : <><Copy size={11} /> Copier le lien</>}
                    </button>
                    <button
                      className="flex items-center justify-center rounded-xl p-2 transition"
                      style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)" }}>
                      <ExternalLink size={13} className={s.muted} />
                    </button>
                    <button onClick={() => setLinks(p => p.filter(l => l.id !== link.id))}
                      className="flex items-center justify-center rounded-xl p-2 hover:text-red-400 transition"
                      style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)" }}>
                      <Trash2 size={13} className={s.muted} />
                    </button>
                  </div>
                )}
                {link.paidAt && (
                  <p className={`mt-2 text-[10px] ${s.muted}`}>Payé le {link.paidAt}</p>
                )}
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
              className={`relative z-10 w-full max-w-sm rounded-3xl p-6 space-y-4 ${isDark ? "bg-[#0e1420] border border-white/[0.09]" : "bg-white border border-black/[0.07]"}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-[15px] font-black ${s.text}`}>Nouveau lien de paiement</h2>
                <button onClick={() => setCreating(false)} className={`rounded-xl p-2 ${s.muted}`}><X size={16} /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className={`block text-[10.5px] font-semibold mb-1 ${s.muted}`}>Description *</label>
                  <div className="relative"><Link2 size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${s.muted}`} />
                    <input className={s.input + " pl-8"} placeholder="Ex: Coaching Mai 2026" value={label} onChange={e => setLabel(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className={`block text-[10.5px] font-semibold mb-1 ${s.muted}`}>Montant (€) *</label>
                  <div className="relative"><Euro size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${s.muted}`} />
                    <input type="number" min="1" className={s.input + " pl-8"} placeholder="150" value={amount} onChange={e => setAmount(e.target.value)} />
                  </div>
                </div>
                <div className={`rounded-xl p-3 text-[11px] ${isDark ? "bg-violet-500/08 text-violet-300/70" : "bg-violet-50 text-violet-600"}`}
                  style={{ border: "1px solid rgba(124,58,237,0.18)" }}>
                  🔗 Le lien sera accessible sur djama.pro/pay/…
                </div>
              </div>
              <button onClick={createLink} disabled={!label.trim() || !amount}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-black text-white disabled:opacity-40 transition"
                style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
                <QrCode size={15} /> Générer le lien
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
