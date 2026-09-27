"use client";

import { motion } from "framer-motion";
import { Star, Clock, AlertTriangle, CheckCircle, DollarSign, FileText, Plus, Calendar } from "lucide-react";
import type { Contract, ContractStatus } from "./types";
import { gold, STATUS_CFG, CONTRACT_TYPES } from "./constants";
import { fmtEur, fmtDate } from "@/lib/format";

export function DashboardView({ contracts, onNew, onSelect, isDark }: {
  contracts: Contract[]; onNew: () => void; onSelect: (c: Contract) => void; isDark: boolean;
}) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const in30 = new Date(now.getTime() + 30 * 86400000);

  const actifs = contracts.filter((c) => c.status === "actif" || c.status === "signé").length;
  const enAttente = contracts.filter((c) => c.status === "envoyé" || c.status === "vu").length;
  const expirentBientot = contracts.filter((c) => c.expires_at && new Date(c.expires_at) <= in30 && c.status !== "expiré" && c.status !== "signé" && c.status !== "actif").length;
  const signesMois = contracts.filter((c) => c.status === "signé" && c.created_at && new Date(c.created_at) >= startOfMonth).length;
  const valeurTotale = contracts.reduce((s, c) => s + (c.amount ?? 0), 0);
  const brouillons = contracts.filter((c) => c.status === "brouillon").length;

  const kpis = [
    { label: "Contrats actifs",      value: actifs,               icon: Star,          color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "En attente signature", value: enAttente,            icon: Clock,         color: "text-sky-400",     bg: "bg-sky-500/10" },
    { label: "Expirent bientôt",     value: expirentBientot,      icon: AlertTriangle, color: "text-orange-400",  bg: "bg-orange-500/10" },
    { label: "Signés ce mois",       value: signesMois,           icon: CheckCircle,   color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Valeur portefeuille",  value: fmtEur(valeurTotale), icon: DollarSign,    color: "text-amber-400",   bg: "bg-amber-500/10", isStr: true },
    { label: "Brouillons IA",        value: brouillons,           icon: FileText,      color: "text-purple-400",  bg: "bg-purple-500/10" },
  ];

  const pipeline: ContractStatus[] = ["brouillon", "validation", "envoyé", "vu", "signé", "actif"];

  const cardBg    = isDark ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.9)";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const innerBg   = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)";

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((k) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 flex flex-col gap-2"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
            <div className={`h-8 w-8 flex items-center justify-center rounded-xl ${k.bg}`}>
              <k.icon size={15} className={k.color}/>
            </div>
            <div>
              <div className={`font-bold ${k.isStr ? "text-base" : "text-xl"} ${isDark ? "text-white/90" : "text-gray-900"}`}>
                {k.value}
              </div>
              <div className={`text-[10px] mt-0.5 ${isDark ? "text-white/35" : "text-gray-500"}`}>{k.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div>
        <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-white/30" : "text-gray-400"}`}>Pipeline des contrats</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {pipeline.map((stage) => {
            const stageContracts = contracts.filter((c) => c.status === stage);
            const s = STATUS_CFG[stage];
            return (
              <div key={stage} className="min-w-[180px] flex-1 rounded-2xl p-3"
                style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold ${s.text}`}>{s.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${s.bg} ${s.text}`}>{stageContracts.length}</span>
                </div>
                <div className="space-y-1.5">
                  {stageContracts.slice(0, 3).map((c) => (
                    <button key={c.id} onClick={() => onSelect(c)}
                      className="w-full text-left rounded-xl px-2.5 py-2 transition-colors"
                      style={{ background: innerBg }}
                      onMouseEnter={e => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)")}
                      onMouseLeave={e => (e.currentTarget.style.background = innerBg)}>
                      <p className={`text-xs font-semibold truncate ${isDark ? "text-white/80" : "text-gray-800"}`}>{c.title}</p>
                      <p className={`text-[10px] truncate ${isDark ? "text-white/35" : "text-gray-500"}`}>{c.client_name}</p>
                    </button>
                  ))}
                  {stageContracts.length === 0 && <p className={`text-[10px] text-center py-2 ${isDark ? "text-white/20" : "text-gray-300"}`}>Aucun contrat</p>}
                  {stageContracts.length > 3 && <p className={`text-[10px] text-center ${isDark ? "text-white/30" : "text-gray-400"}`}>+{stageContracts.length - 3} autres</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {contracts.filter((c) => c.expires_at && new Date(c.expires_at) <= in30 && c.status !== "expiré").length > 0 && (
        <div>
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${isDark ? "text-white/30" : "text-gray-400"}`}>
            <Calendar size={12} className="text-orange-400"/> Échéances dans 30 jours
          </h3>
          <div className="space-y-2">
            {contracts.filter((c) => c.expires_at && new Date(c.expires_at) <= in30 && c.status !== "expiré").map((c) => (
              <button key={c.id} onClick={() => onSelect(c)}
                className="w-full flex items-center justify-between bg-orange-500/5 border border-orange-500/10 rounded-xl px-4 py-3 hover:bg-orange-500/10 transition-colors text-left">
                <div>
                  <p className={`text-sm font-semibold ${isDark ? "text-white/80" : "text-gray-800"}`}>{c.title}</p>
                  <p className={`text-xs ${isDark ? "text-white/40" : "text-gray-500"}`}>{c.client_name}</p>
                </div>
                <div className="text-xs text-orange-400 font-semibold shrink-0">{fmtDate(c.expires_at ?? null)}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {contracts.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="h-14 w-14 flex items-center justify-center rounded-2xl" style={{ background: gold + "15", border: `1px solid ${gold}30` }}>
            <FileText size={24} style={{ color: gold }}/>
          </div>
          <p className={`text-sm ${isDark ? "text-white/50" : "text-gray-500"}`}>Aucun contrat — créez votre premier</p>
          <button onClick={onNew} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={{ background: gold + "20", color: gold, border: `1px solid ${gold}40` }}>
            <Plus size={13}/> Créer un contrat
          </button>
        </div>
      )}
    </div>
  );
}
