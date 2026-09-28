"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Activity, AlertTriangle, ArrowUpCircle, ArrowDownCircle, RotateCcw } from "lucide-react";
import type { Movement, Product, Warehouse } from "./types";
import type { MovementType } from "./types";
import { MOV_TYPES } from "./constants";
import { useDark, selStyle } from "./ui";
import { fmtDate } from "@/lib/format";

export function MovementsView({ movements, products, warehouses, onNew }: {
  movements: Movement[]; products: Product[]; warehouses: Warehouse[]; onNew: () => void;
}) {
  const [typeFilter, setTypeFilter] = useState<MovementType | "all">("all");
  const [productFilter, setProductFilter] = useState("all");

  void warehouses; // available for future filtering

  const isDark = useDark();

  const filtered = movements.filter((m) => {
    if (typeFilter !== "all" && m.type !== typeFilter) return false;
    if (productFilter !== "all" && m.product_id !== productFilter) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className={`flex items-center gap-2 p-4 border-b flex-wrap ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as MovementType | "all")}
          className={`rounded-xl px-3 py-2 text-xs focus:outline-none appearance-none border ${isDark ? "bg-white/[0.05] border-white/[0.08] text-white/70" : "bg-white border-gray-200 text-gray-600"}`}
          style={selStyle(isDark)}>
          <option value="all">Tous types</option>
          {MOV_TYPES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)}
          className={`flex-1 rounded-xl px-3 py-2 text-xs focus:outline-none appearance-none border max-w-xs ${isDark ? "bg-white/[0.05] border-white/[0.08] text-white/70" : "bg-white border-gray-200 text-gray-600"}`}
          style={selStyle(isDark)}>
          <option value="all">Tous produits</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button onClick={onNew} className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold" style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
          <Plus size={13}/> Mouvement
        </button>
      </div>

      {movements.length >= 200 && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs border border-amber-500/20 bg-amber-500/8 text-amber-400">
          <AlertTriangle size={12}/>
          <span>Historique limité aux 200 derniers mouvements. Les données plus anciennes sont en base mais ne s&apos;affichent pas ici.</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Activity size={28} className={isDark ? "text-white/20" : "text-gray-300"}/>
            <p className={`text-sm ${isDark ? "text-white/30" : "text-gray-400"}`}>Aucun mouvement</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((m) => {
              const mt = MOV_TYPES.find((t) => t.value === m.type) ?? MOV_TYPES[0];
              return (
                <motion.div key={m.id} layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 border ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
                  <div className="h-9 w-9 flex items-center justify-center rounded-xl shrink-0" style={{ background: mt.color + "18" }}>
                    {mt.sign > 0 ? <ArrowUpCircle size={16} style={{ color: mt.color }}/> : mt.sign < 0 ? <ArrowDownCircle size={16} style={{ color: mt.color }}/> : <RotateCcw size={16} style={{ color: mt.color }}/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className={`text-sm font-semibold truncate ${isDark ? "text-white/85" : "text-gray-700"}`}>{m.product_name}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0" style={{ background: mt.color + "20", color: mt.color }}>{mt.label}</span>
                    </div>
                    <p className={`text-xs ${isDark ? "text-white/35" : "text-gray-400"}`}>
                      {fmtDate(m.date)}{m.reference ? ` · Réf: ${m.reference}` : ""}{m.reason ? ` · ${m.reason}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold" style={{ color: mt.color }}>
                      {mt.sign > 0 ? "+" : mt.sign < 0 ? "-" : ""}{m.quantity}
                    </p>
                    <p className={`text-[10px] ${isDark ? "text-white/30" : "text-gray-400"}`}>{m.before_qty} → {m.after_qty}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
