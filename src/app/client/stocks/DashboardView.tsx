"use client";

import { motion } from "framer-motion";
import {
  Package, Plus, AlertTriangle, AlertOctagon,
  DollarSign, ArrowUpCircle, ArrowDownCircle,
  Star, Activity, ShieldAlert,
} from "lucide-react";
import type { Product, Movement } from "./types";
import { gold, green, MOV_TYPES, STOCK_STATES, getStockState } from "./constants";
import { useDark } from "./ui";
import { fmtDate, fmtEur } from "@/lib/format";

export function DashboardView({ products, movements, onNewProduct, onNewMovement }: {
  products: Product[]; movements: Movement[];
  onNewProduct: () => void; onNewMovement: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const totalValue  = products.reduce((s, p) => s + p.stock_current * p.purchase_price, 0);
  const lowStock    = products.filter((p) => p.stock_current > 0 && p.stock_current <= p.stock_minimum);
  const outOfStock  = products.filter((p) => p.stock_current <= 0);
  const todayIn     = movements.filter((m) => m.date === today && (m.type === "entree" || m.type === "retour")).reduce((s, m) => s + m.quantity, 0);
  const todayOut    = movements.filter((m) => m.date === today && (m.type === "sortie" || m.type === "perte" || m.type === "casse")).reduce((s, m) => s + m.quantity, 0);
  const totalProducts  = products.filter((p) => p.is_active).length;
  const criticalStock  = products.filter((p) => getStockState(p) === "critique");
  const overStock      = products.filter((p) => getStockState(p) === "surstock");

  // ABC analysis — sort by value descending, bucket into A/B/C
  const sorted = [...products.filter(p => p.is_active)].sort((a, b) => (b.stock_current * b.purchase_price) - (a.stock_current * a.purchase_price));
  const totalCount = sorted.length;
  const abcA = sorted.slice(0, Math.ceil(totalCount * 0.2));
  const abcB = sorted.slice(Math.ceil(totalCount * 0.2), Math.ceil(totalCount * 0.5));
  const abcC = sorted.slice(Math.ceil(totalCount * 0.5));
  const valA = abcA.reduce((s, p) => s + p.stock_current * p.purchase_price, 0);
  const valB = abcB.reduce((s, p) => s + p.stock_current * p.purchase_price, 0);
  const valC = abcC.reduce((s, p) => s + p.stock_current * p.purchase_price, 0);

  const kpis = [
    { label: "Produits actifs",     value: totalProducts,        icon: Package,        color: "#10b981", bg: "bg-emerald-500/10" },
    { label: "Valeur totale stock", value: fmtEur(totalValue),  icon: DollarSign,     color: gold,      bg: "bg-amber-500/10", isStr: true },
    { label: "Stock critique",      value: criticalStock.length, icon: ShieldAlert,    color: "#f97316", bg: "bg-orange-500/10" },
    { label: "Ruptures de stock",   value: outOfStock.length,    icon: AlertOctagon,   color: "#ef4444", bg: "bg-red-500/10" },
    { label: "Entrées aujourd'hui", value: todayIn,              icon: ArrowUpCircle,  color: "#10b981", bg: "bg-emerald-500/10" },
    { label: "Sorties aujourd'hui", value: todayOut,             icon: ArrowDownCircle,color: "#ef4444", bg: "bg-red-500/10" },
    { label: "Surstock",            value: overStock.length,     icon: AlertTriangle,  color: "#3b82f6", bg: "bg-blue-500/10" },
  ];

  const topProducts = [...products].sort((a, b) => (b.stock_current * b.purchase_price) - (a.stock_current * a.purchase_price)).slice(0, 5);
  const recentMov = movements.slice(0, 8);
  const isDark = useDark();

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {kpis.map((k) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 flex flex-col gap-2"
            style={{ background: isDark ? "rgba(255,255,255,0.035)" : "#ffffff", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}` }}>
            <div className={`h-8 w-8 flex items-center justify-center rounded-xl ${k.bg}`}>
              <k.icon size={15} style={{ color: k.color }}/>
            </div>
            <div>
              <div className={`font-bold ${k.isStr ? "text-sm" : "text-xl"} ${isDark ? "text-white/90" : "text-gray-800"}`}>{k.value}</div>
              <div className={`text-[10px] mt-0.5 ${isDark ? "text-white/35" : "text-gray-400"}`}>{k.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Alerts */}
      {(criticalStock.length > 0 || lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="space-y-2">
          <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? "text-white/30" : "text-gray-400"}`}><AlertTriangle size={12} className="text-orange-400"/> Alertes stock</h3>
          <div className="space-y-1.5">
            {outOfStock.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-red-500/5 border border-red-500/15 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2"><AlertOctagon size={13} className="text-red-400 shrink-0"/>
                  <span className={`text-sm ${isDark ? "text-white/80" : "text-gray-700"}`}>{p.name}</span>
                  <span className="text-xs text-red-400">{p.sku && `· ${p.sku}`}</span>
                </div>
                <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full" style={{ color:"#ef4444",background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.25)" }}>RUPTURE</span>
              </div>
            ))}
            {criticalStock.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-orange-500/5 border border-orange-500/20 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2"><ShieldAlert size={13} className="text-orange-400 shrink-0"/>
                  <span className={`text-sm ${isDark ? "text-white/80" : "text-gray-700"}`}>{p.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${isDark ? "text-white/40" : "text-gray-400"}`}>{p.stock_current} / min. {p.stock_minimum} {p.unit}</span>
                  <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full" style={{ color:"#f97316",background:"rgba(249,115,22,0.12)",border:"1px solid rgba(249,115,22,0.25)" }}>CRITIQUE</span>
                </div>
              </div>
            ))}
            {lowStock.filter(p => getStockState(p) === "faible").slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2"><AlertTriangle size={13} className="text-amber-400 shrink-0"/>
                  <span className={`text-sm ${isDark ? "text-white/80" : "text-gray-700"}`}>{p.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${isDark ? "text-white/40" : "text-gray-400"}`}>{p.stock_current} / min. {p.stock_minimum} {p.unit}</span>
                  <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full" style={{ color:"#f59e0b",background:"rgba(245,158,11,0.12)",border:"1px solid rgba(245,158,11,0.25)" }}>FAIBLE</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top produits */}
        <div>
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${isDark ? "text-white/30" : "text-gray-400"}`}><Star size={12} style={{ color: gold }}/> Top produits par valeur</h3>
          <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
            {topProducts.length === 0 ? (
              <p className={`text-center text-sm py-8 ${isDark ? "text-white/25" : "text-gray-400"}`}>Aucun produit</p>
            ) : topProducts.map((p, i) => {
              const val = p.stock_current * p.purchase_price;
              const maxVal = topProducts[0] ? topProducts[0].stock_current * topProducts[0].purchase_price : 1;
              return (
                <div key={p.id} className={`flex items-center gap-3 px-4 py-3 border-b last:border-0 ${isDark ? "border-white/[0.04]" : "border-gray-100"}`}>
                  <span className={`text-xs font-semibold w-4 shrink-0 ${isDark ? "text-white/20" : "text-gray-300"}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className={`text-sm font-semibold truncate ${isDark ? "text-white/80" : "text-gray-700"}`}>{p.name}</span>
                      <span className={`text-xs shrink-0 ${isDark ? "text-white/50" : "text-gray-500"}`}>{fmtEur(val)}</span>
                    </div>
                    <div className={`h-1 rounded-full overflow-hidden ${isDark ? "bg-white/[0.06]" : "bg-gray-100"}`}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(val / maxVal) * 100}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full" style={{ background: green }}/>
                    </div>
                  </div>
                  <span className={`text-xs shrink-0 ${isDark ? "text-white/40" : "text-gray-400"}`}>{p.stock_current} {p.unit}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Derniers mouvements */}
        <div>
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${isDark ? "text-white/30" : "text-gray-400"}`}><Activity size={12} className="text-blue-400"/> Derniers mouvements</h3>
          <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
            {recentMov.length === 0 ? (
              <p className={`text-center text-sm py-8 ${isDark ? "text-white/25" : "text-gray-400"}`}>Aucun mouvement</p>
            ) : recentMov.map((m) => {
              const mt = MOV_TYPES.find((t) => t.value === m.type) ?? MOV_TYPES[0];
              return (
                <div key={m.id} className={`flex items-center gap-3 px-4 py-2.5 border-b last:border-0 ${isDark ? "border-white/[0.04]" : "border-gray-100"}`}>
                  <div className="h-7 w-7 flex items-center justify-center rounded-lg shrink-0" style={{ background: mt.color + "20" }}>
                    {mt.sign >= 0 ? <ArrowUpCircle size={13} style={{ color: mt.color }}/> : <ArrowDownCircle size={13} style={{ color: mt.color }}/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${isDark ? "text-white/80" : "text-gray-700"}`}>{m.product_name}</p>
                    <p className={`text-[10px] ${isDark ? "text-white/35" : "text-gray-400"}`}>{mt.label} · {fmtDate(m.date)}</p>
                  </div>
                  <span className="text-xs font-bold shrink-0" style={{ color: mt.color }}>
                    {mt.sign > 0 ? "+" : mt.sign < 0 ? "-" : ""}{m.quantity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ABC Analysis */}
      {sorted.length >= 3 && (
        <div>
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${isDark ? "text-white/30" : "text-gray-400"}`}>
            <Star size={12} style={{ color: gold }}/> Analyse ABC — Répartition de la valeur
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { letter: "A", desc: "Top 20% produits", items: abcA, val: valA, color: "#ef4444" },
              { letter: "B", desc: "30% suivants",     items: abcB, val: valB, color: "#f97316" },
              { letter: "C", desc: "50% restants",     items: abcC, val: valC, color: "#10b981" },
            ].map(({ letter, desc, items, val, color }) => (
              <div key={letter} className={`rounded-2xl border p-4 ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-lg font-black" style={{ color }}>{letter}</span>
                    <span className={`text-xs ml-1.5 ${isDark ? "text-white/40" : "text-gray-400"}`}>{desc}</span>
                  </div>
                  <span className="text-xs font-semibold" style={{ color }}>{items.length} produits</span>
                </div>
                <p className={`text-sm font-bold ${isDark ? "text-white/80" : "text-gray-700"}`}>{fmtEur(val)}</p>
                <div className={`h-1 rounded-full mt-2 ${isDark ? "bg-white/[0.06]" : "bg-gray-100"}`}>
                  <div className="h-full rounded-full transition-all" style={{ width: totalValue > 0 ? `${(val / totalValue) * 100}%` : "0%", background: color }}/>
                </div>
                {items.slice(0, 3).map(p => (
                  <p key={p.id} className={`text-[10px] mt-1 truncate ${isDark ? "text-white/30" : "text-gray-400"}`}>{p.name}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {products.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="h-14 w-14 flex items-center justify-center rounded-2xl" style={{ background: green + "15", border: `1px solid ${green}30` }}>
            <Package size={24} style={{ color: green }}/>
          </div>
          <p className={`text-sm ${isDark ? "text-white/50" : "text-gray-500"}`}>Aucun produit — commencez par créer votre inventaire</p>
          <button onClick={onNewProduct} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold" style={{ background: green + "20", color: green, border: `1px solid ${green}40` }}>
            <Plus size={13}/> Ajouter un produit
          </button>
        </div>
      )}

      {/* Keep onNewMovement accessible — shown when there are products */}
      {products.length > 0 && movements.length === 0 && (
        <div className="flex justify-center">
          <button onClick={onNewMovement} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold" style={{ background: gold + "15", color: gold, border: `1px solid ${gold}30` }}>
            <Plus size={13}/> Premier mouvement
          </button>
        </div>
      )}
    </div>
  );
}
