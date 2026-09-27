"use client";

import { motion } from "framer-motion";
import {
  Truck, Plus, ShoppingCart, DollarSign, Calendar, AlertOctagon, Star,
} from "lucide-react";
import type { Fournisseur, FOrder, FInvoice } from "./types";
import { CATEGORIES, ORDER_STATUS, violet } from "./constants";
import { useDark, Stars } from "./ui";
import { fmtDate, fmtEur } from "@/lib/format";

export function DashboardView({ fournisseurs, orders, invoices, onNew, onNewOrder, onNewInvoice }: {
  fournisseurs: Fournisseur[]; orders: FOrder[]; invoices: FInvoice[];
  onNew: () => void; onNewOrder: () => void; onNewInvoice: () => void;
}) {
  const isDark = useDark();
  const today = new Date().toISOString().split("T")[0];
  const in30  = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const actifs       = fournisseurs.filter((f) => f.is_active).length;
  const ordersActive = orders.filter((o) => !["received", "cancelled"].includes(o.status)).length;
  const unpaidInv    = invoices.filter((i) => i.status !== "paid" && i.status !== "disputed");
  const totalDue     = unpaidInv.reduce((s, i) => s + (i.total_amount - i.paid_amount), 0);
  const overdue      = invoices.filter((i) => i.due_date && i.due_date < today && i.status !== "paid").length;
  const contractsExpiring = fournisseurs.filter((f) => f.contract_expires_at && f.contract_expires_at <= in30).length;

  const scoredCount = fournisseurs.filter((f) => f.score_reliability > 0).length;
  const avgScore = scoredCount > 0
    ? (fournisseurs.filter((f) => f.score_reliability > 0)
        .reduce((s, f) => s + (f.score_reliability + f.score_quality + f.score_price + f.score_delays) / 4, 0) / scoredCount
      ).toFixed(1)
    : "—";

  const kpis = [
    { label: "Fournisseurs actifs",  value: actifs,            icon: Truck,        color: violet,    bg: "bg-violet-500/10" },
    { label: "Commandes en cours",   value: ordersActive,      icon: ShoppingCart, color: "#3b82f6", bg: "bg-blue-500/10" },
    { label: "Montant dû",           value: fmtEur(totalDue),  icon: DollarSign,   color: "#f97316", bg: "bg-orange-500/10", isStr: true },
    { label: "Factures en retard",   value: overdue,           icon: AlertOctagon, color: "#ef4444", bg: "bg-red-500/10" },
    { label: "Contrats expirant",    value: contractsExpiring, icon: Calendar,     color: "#f59e0b", bg: "bg-amber-500/10" },
    { label: "Score moyen",          value: avgScore,          icon: Star,         color: "#f59e0b", bg: "bg-amber-500/10", isStr: true },
  ];

  const topFourn = [...fournisseurs]
    .filter((f) => f.score_reliability > 0 || f.score_quality > 0)
    .sort((a, b) => {
      const sa = (a.score_reliability + a.score_quality + a.score_price + a.score_delays) / 4;
      const sb = (b.score_reliability + b.score_quality + b.score_price + b.score_delays) / 4;
      return sb - sa;
    })
    .slice(0, 5);

  const alerts: { text: string; color: string; icon: React.ElementType }[] = [];
  if (overdue > 0) alerts.push({ text: `${overdue} facture${overdue > 1 ? "s" : ""} en retard de paiement`, color: "#ef4444", icon: AlertOctagon });
  if (contractsExpiring > 0) alerts.push({ text: `${contractsExpiring} contrat${contractsExpiring > 1 ? "s" : ""} fournisseur expirent dans 30 jours`, color: "#f59e0b", icon: Calendar });
  orders.filter((o) => o.expected_date && o.expected_date < today && o.status === "sent").slice(0, 2).forEach((o) => {
    alerts.push({ text: `Livraison en retard : commande ${o.order_number || o.id.slice(0,8)} — ${o.fournisseur_name}`, color: "#f97316", icon: Truck });
  });

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((k) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 flex flex-col gap-2"
            style={{ background: isDark ? "rgba(255,255,255,0.035)" : "#ffffff", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}` }}>
            <div className={`h-8 w-8 flex items-center justify-center rounded-xl ${k.bg}`}>
              <k.icon size={15} style={{ color: k.color }}/>
            </div>
            <div>
              <div className={`font-bold ${isDark ? "text-white/90" : "text-gray-800"} ${k.isStr ? "text-sm" : "text-xl"}`}>{k.value}</div>
              <div className={`text-[10px] mt-0.5 ${isDark ? "text-white/35" : "text-gray-400"}`}>{k.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {alerts.length > 0 && (
        <div className="space-y-1.5">
          {alerts.map((a, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-2.5 border" style={{ background: a.color + "08", borderColor: a.color + "25" }}>
              <a.icon size={13} style={{ color: a.color }}/>
              <span className={`text-xs ${isDark ? "text-white/70" : "text-gray-600"}`}>{a.text}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top fournisseurs */}
        <div>
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${isDark ? "text-white/30" : "text-gray-400"}`}>
            <Star size={12} style={{ color: violet }}/> Top fournisseurs
          </h3>
          <div className={`rounded-2xl overflow-hidden border ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
            {topFourn.length === 0 ? (
              <p className={`text-center text-sm py-8 ${isDark ? "text-white/25" : "text-gray-300"}`}>Aucune évaluation — notez vos fournisseurs</p>
            ) : topFourn.map((f, i) => {
              const score = (f.score_reliability + f.score_quality + f.score_price + f.score_delays) / 4;
              const cat   = CATEGORIES.find((c) => c.value === f.category);
              return (
                <div key={f.id} className={`flex items-center gap-3 px-4 py-3 border-b last:border-0 ${isDark ? "border-white/[0.04]" : "border-gray-100"}`}>
                  <span className={`text-xs font-semibold w-4 shrink-0 ${isDark ? "text-white/20" : "text-gray-300"}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isDark ? "text-white/80" : "text-gray-700"}`}>{f.company_name}</p>
                    <p className={`text-[10px] ${isDark ? "text-white/35" : "text-gray-400"}`}>{cat?.label}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold" style={{ color: score >= 4 ? "#10b981" : score >= 3 ? violet : "#f97316" }}>{score.toFixed(1)}/5</p>
                    <Stars value={Math.round(score)}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Commandes récentes */}
        <div>
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${isDark ? "text-white/30" : "text-gray-400"}`}>
            <ShoppingCart size={12} className="text-blue-400"/> Commandes récentes
          </h3>
          <div className={`rounded-2xl overflow-hidden border ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
            {orders.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <p className={`text-sm ${isDark ? "text-white/25" : "text-gray-300"}`}>Aucune commande</p>
                <button onClick={onNewOrder} className="text-xs font-semibold px-3 py-1.5 rounded-xl"
                  style={{ background: violet + "20", color: violet, border: `1px solid ${violet}40` }}>
                  <Plus size={11} className="inline mr-1"/>Créer
                </button>
              </div>
            ) : orders.slice(0, 6).map((o) => {
              const s = ORDER_STATUS[o.status];
              return (
                <div key={o.id} className={`flex items-center gap-3 px-4 py-2.5 border-b last:border-0 ${isDark ? "border-white/[0.04]" : "border-gray-100"}`}>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${isDark ? "text-white/80" : "text-gray-700"}`}>{o.fournisseur_name}</p>
                    <p className={`text-[10px] ${isDark ? "text-white/35" : "text-gray-400"}`}>{o.order_number} · {fmtDate(o.order_date)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.color} ${s.bg}`}>{s.label}</span>
                    <p className={`text-xs font-bold mt-0.5 ${isDark ? "text-white/60" : "text-gray-500"}`}>{fmtEur(o.total_amount)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {fournisseurs.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="h-14 w-14 flex items-center justify-center rounded-2xl" style={{ background: violet + "15", border: `1px solid ${violet}30` }}>
            <Truck size={24} style={{ color: violet }}/>
          </div>
          <p className={`text-sm ${isDark ? "text-white/50" : "text-gray-500"}`}>Aucun fournisseur — ajoutez votre premier partenaire</p>
          <button onClick={onNew} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold"
            style={{ background: violet + "20", color: violet, border: `1px solid ${violet}40` }}>
            <Plus size={13}/> Ajouter un fournisseur
          </button>
        </div>
      )}

    </div>
  );
}
