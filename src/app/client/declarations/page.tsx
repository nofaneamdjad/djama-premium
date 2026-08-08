"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileCheck2, Download, Calendar, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import ModuleHeaderIcon from "@/components/ModuleHeaderIcon";

const ease = [0.22, 1, 0.36, 1] as const;

type DeclStatus = "a_faire" | "faite" | "en_retard";
interface Declaration { id: string; type: string; period: string; deadline: string; amount: number; status: DeclStatus }

const DEMO: Declaration[] = [
  { id: "1", type: "TVA mensuelle (CA3)",  period: "Juillet 2026",   deadline: "2026-08-25", amount: 485,  status: "a_faire" },
  { id: "2", type: "TVA mensuelle (CA3)",  period: "Juin 2026",      deadline: "2026-07-25", amount: 312,  status: "faite" },
  { id: "3", type: "CFE — Acompte",        period: "2026",            deadline: "2026-09-15", amount: 0,    status: "a_faire" },
  { id: "4", type: "TVA mensuelle (CA3)",  period: "Mai 2026",       deadline: "2026-06-25", amount: 528,  status: "faite" },
  { id: "5", type: "Déclaration URSSAF",   period: "T1 2026",        deadline: "2026-04-30", amount: 1240, status: "faite" },
];

const ECHÉANCES = [
  { label: "TVA Juillet",   date: "25 août 2026",    urgent: true },
  { label: "IS Acompte",    date: "15 sept. 2026",   urgent: false },
  { label: "CFE Acompte",   date: "15 sept. 2026",   urgent: false },
  { label: "TVA Août",      date: "25 sept. 2026",   urgent: false },
  { label: "URSSAF T3",     date: "31 oct. 2026",    urgent: false },
];

const STATUS_CFG: Record<DeclStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  a_faire:   { label: "À faire",   color: "#f59e0b", icon: Clock },
  faite:     { label: "Déposée",   color: "#10b981", icon: CheckCircle2 },
  en_retard: { label: "En retard", color: "#ef4444", icon: AlertTriangle },
};

export default function DeclarationsPage() {
  const { isDark } = useTheme();
  const [decls, setDecls] = useState<Declaration[]>(DEMO);

  const s = {
    card:  isDark ? "bg-white/[0.03] border-white/[0.07]"  : "bg-white border-black/[0.07] shadow-sm",
    text:  isDark ? "text-white/85"                          : "text-gray-800",
    muted: isDark ? "text-white/35"                          : "text-gray-400",
  };

  const tvaFmt = { base: 2425, collectee: 485, deductible: 32, solde: 453 };

  return (
    <div className={`min-h-full pb-20 ${isDark ? "bg-[#07080e]" : "bg-[#f0f2f5]"}`}>
      <div className="px-4 pt-5 pb-4">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}
          className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ModuleHeaderIcon icon={FileCheck2} color="#7c3aed" />
            <div>
              <h1 className={`text-[17px] font-black ${s.text}`}>Déclarations fiscales</h1>
              <p className={`text-[10px] ${s.muted}`}>{decls.filter(d => d.status === "a_faire").length} à déposer · {decls.filter(d => d.status === "faite").length} déposées</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="px-4 space-y-4">
        {/* TVA pré-remplie */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}
          className={`rounded-2xl border overflow-hidden ${s.card}`}>
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <div>
              <p className={`text-[12px] font-black ${s.text}`}>TVA Juillet 2026 — Pré-remplie</p>
              <p className={`text-[10px] ${s.muted}`}>Calculée depuis vos factures DJAMA</p>
            </div>
            <span className="text-[9.5px] font-bold rounded-full px-2.5 py-1" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.30)" }}>
              À déposer avant le 25/08
            </span>
          </div>
          <div className="grid grid-cols-4 gap-0" style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)" }}>
            {[
              { label: "Base imposable", val: tvaFmt.base, color: s.text },
              { label: "TVA collectée",  val: tvaFmt.collectee, color: "#ef4444" },
              { label: "TVA déductible", val: tvaFmt.deductible, color: "#10b981" },
              { label: "TVA à payer",    val: tvaFmt.solde, color: "#7c3aed" },
            ].map((k, i) => (
              <div key={k.label} className="p-3 text-center"
                style={{ borderRight: i < 3 ? isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)" : "none" }}>
                <p className="text-[15px] font-black tabular-nums" style={{ color: k.color }}>{k.val} €</p>
                <p className={`text-[8px] mt-0.5 leading-tight ${s.muted}`}>{k.label}</p>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4 pt-3 flex gap-2" style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)" }}>
            <button onClick={() => setDecls(p => p.map(d => d.id === "1" ? { ...d, status: "faite" } : d))}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-[11.5px] font-black text-white"
              style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
              <CheckCircle2 size={13} /> Marquer comme déposée
            </button>
            <button className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[11.5px] font-semibold"
              style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", border: isDark ? "1px solid rgba(255,255,255,0.09)" : "1px solid rgba(0,0,0,0.07)", color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)" }}>
              <Download size={13} /> PDF
            </button>
          </div>
        </motion.div>

        {/* Échéances */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease, delay: 0.05 }}
          className={`rounded-2xl border p-4 ${s.card}`}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={13} style={{ color: "#7c3aed" }} />
            <p className={`text-[12px] font-black ${s.text}`}>Prochaines échéances</p>
          </div>
          <div className="space-y-2">
            {ECHÉANCES.map(e => (
              <div key={e.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {e.urgent && <AlertTriangle size={11} style={{ color: "#f59e0b" }} />}
                  <p className={`text-[12px] ${s.text}`}>{e.label}</p>
                </div>
                <p className={`text-[11px] font-semibold ${e.urgent ? "text-amber-400" : s.muted}`}>{e.date}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Historique */}
        <div>
          <p className={`text-[10px] font-bold uppercase tracking-wide mb-2.5 ${s.muted}`}>Historique</p>
          <div className="space-y-2">
            {decls.map((d, i) => {
              const cfg = STATUS_CFG[d.status];
              const Icon = cfg.icon;
              return (
                <motion.div key={d.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, ease }}
                  className={`flex items-center gap-3 rounded-xl border p-3.5 ${s.card}`}>
                  <Icon size={14} style={{ color: cfg.color }} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[12px] font-semibold ${s.text}`}>{d.type}</p>
                    <p className={`text-[10px] ${s.muted}`}>{d.period} · Échéance {d.deadline}</p>
                  </div>
                  {d.amount > 0 && <p className="text-[13px] font-black tabular-nums shrink-0" style={{ color: cfg.color }}>{d.amount} €</p>}
                  <span className="text-[9.5px] font-bold rounded-full px-2 py-0.5 shrink-0"
                    style={{ background: cfg.color + "18", color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                    {cfg.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
