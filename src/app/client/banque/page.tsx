"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Landmark, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, RefreshCw, Link2 } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import ModuleHeaderIcon from "@/components/ModuleHeaderIcon";

const ease = [0.22, 1, 0.36, 1] as const;

type TxType = "credit" | "debit";
interface Transaction { id: string; label: string; amount: number; type: TxType; date: string; category: string }

const DEMO_TX: Transaction[] = [
  { id: "1",  label: "Virement client — Durand SARL",     amount: 1200,  type: "credit", date: "2026-08-08", category: "Recette" },
  { id: "2",  label: "Abonnement Canva Pro",               amount: 15.99, type: "debit",  date: "2026-08-07", category: "Marketing" },
  { id: "3",  label: "Paiement Lien — Formation Excel",    amount: 149,   type: "credit", date: "2026-08-06", category: "Recette" },
  { id: "4",  label: "SFR Mobile Pro",                     amount: 35,    type: "debit",  date: "2026-08-05", category: "Télécoms" },
  { id: "5",  label: "Virement client — Martin Sophie",    amount: 450,   type: "credit", date: "2026-08-03", category: "Recette" },
  { id: "6",  label: "OVH Hébergement",                    amount: 12.99, type: "debit",  date: "2026-08-01", category: "Informatique" },
  { id: "7",  label: "Virement client — Lefevre EURL",    amount: 2400,  type: "credit", date: "2026-07-31", category: "Recette" },
  { id: "8",  label: "URSSAF — Cotisations T2 2026",       amount: 620,   type: "debit",  date: "2026-07-28", category: "Charges sociales" },
  { id: "9",  label: "Freelance.com — Commission",         amount: 48,    type: "debit",  date: "2026-07-25", category: "Frais plateforme" },
  { id: "10", label: "Virement client — Bouchard",         amount: 890,   type: "credit", date: "2026-07-22", category: "Recette" },
];

const CAT_COLORS: Record<string, string> = {
  Recette:            "#10b981",
  Marketing:          "#e1306c",
  Télécoms:           "#6366f1",
  Informatique:       "#0ea5e9",
  "Charges sociales": "#f59e0b",
  "Frais plateforme": "#8b5cf6",
};

export default function BanquePage() {
  const { isDark } = useTheme();
  const [connected, setConnected] = useState(false);
  const [txs] = useState<Transaction[]>(DEMO_TX);

  const s = {
    card:  isDark ? "bg-white/[0.03] border-white/[0.07]"  : "bg-white border-black/[0.07] shadow-sm",
    text:  isDark ? "text-white/85"                          : "text-gray-800",
    muted: isDark ? "text-white/35"                          : "text-gray-400",
  };

  const credits = txs.filter(t => t.type === "credit").reduce((s2, t) => s2 + t.amount, 0);
  const debits  = txs.filter(t => t.type === "debit").reduce((s2, t) => s2 + t.amount, 0);
  const balance = credits - debits;

  return (
    <div className={`min-h-full pb-20 ${isDark ? "bg-[#07080e]" : "bg-[#f0f2f5]"}`}>
      <div className="px-4 pt-5 pb-4">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}
          className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ModuleHeaderIcon icon={Landmark} color="#0369a1" />
            <div>
              <h1 className={`text-[17px] font-black ${s.text}`}>Connexion bancaire</h1>
              <p className={`text-[10px] ${s.muted}`}>{connected ? "BNP Paribas · synchronisé" : "Aucun compte connecté"}</p>
            </div>
          </div>
          <button onClick={() => setConnected(v => !v)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold text-white"
            style={{ background: connected ? "rgba(16,185,129,0.20)" : "linear-gradient(135deg,#0369a1,#0284c7)", color: connected ? "#10b981" : "white", border: connected ? "1px solid rgba(16,185,129,0.35)" : "none" }}>
            {connected ? <><RefreshCw size={13} /> Synchroniser</> : <><Link2 size={13} /> Connecter</>}
          </button>
        </motion.div>

        {/* Solde + stats */}
        <div className="mt-4 space-y-3">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}
            className={`rounded-2xl border p-5 ${s.card}`}>
            <p className={`text-[10px] font-semibold mb-2 ${s.muted}`}>SOLDE ESTIMÉ (30 jours)</p>
            <p className="text-[32px] font-black tabular-nums" style={{ color: balance >= 0 ? "#10b981" : "#ef4444" }}>
              {balance >= 0 ? "+" : ""}{balance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
            </p>
            <div className="flex gap-6 mt-3">
              <div className="flex items-center gap-1.5">
                <ArrowUpRight size={13} style={{ color: "#10b981" }} />
                <div>
                  <p className={`text-[9px] ${s.muted}`}>Encaissé</p>
                  <p className="text-[13px] font-bold tabular-nums" style={{ color: "#10b981" }}>+{credits.toLocaleString("fr-FR")} €</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <ArrowDownRight size={13} style={{ color: "#ef4444" }} />
                <div>
                  <p className={`text-[9px] ${s.muted}`}>Dépensé</p>
                  <p className="text-[13px] font-bold tabular-nums" style={{ color: "#ef4444" }}>-{debits.toLocaleString("fr-FR")} €</p>
                </div>
              </div>
            </div>
          </motion.div>

          {!connected && (
            <div className={`rounded-2xl border p-4 text-center ${s.card}`} style={{ border: "1px dashed rgba(3,105,161,0.35)" }}>
              <Landmark size={28} className="mx-auto mb-2" style={{ color: "#0369a1" }} />
              <p className={`text-[12px] font-bold ${s.text}`}>Connectez votre banque</p>
              <p className={`text-[10.5px] mt-1 ${s.muted}`}>Import automatique des mouvements via Open Banking. Les transactions ci-dessous sont des données de démonstration.</p>
            </div>
          )}
        </div>
      </div>

      {/* Transactions */}
      <div className="px-4">
        <p className={`text-[10px] font-bold uppercase tracking-wide mb-2.5 ${s.muted}`}>Dernières transactions</p>
        <div className="space-y-1.5">
          {txs.map((tx, i) => {
            const catColor = CAT_COLORS[tx.category] ?? "#6b7280";
            return (
              <motion.div key={tx.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03, ease }}
                className={`flex items-center gap-3 rounded-xl border p-3 ${s.card}`}>
                <div className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center"
                  style={{ background: (tx.type === "credit" ? "#10b981" : "#ef4444") + "18" }}>
                  {tx.type === "credit"
                    ? <TrendingUp size={13} style={{ color: "#10b981" }} />
                    : <TrendingDown size={13} style={{ color: "#ef4444" }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[12px] font-semibold truncate ${s.text}`}>{tx.label}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9.5px] font-bold rounded px-1.5 py-0.5"
                      style={{ background: catColor + "18", color: catColor }}>{tx.category}</span>
                    <span className={`text-[9.5px] ${s.muted}`}>{tx.date}</span>
                  </div>
                </div>
                <p className="font-black tabular-nums text-[13px] shrink-0"
                  style={{ color: tx.type === "credit" ? "#10b981" : "#ef4444" }}>
                  {tx.type === "credit" ? "+" : "-"}{tx.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
