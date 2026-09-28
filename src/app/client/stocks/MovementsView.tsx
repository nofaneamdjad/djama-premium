"use client";

import { useState } from "react";
import { Plus, Activity, AlertTriangle, ArrowUpCircle, ArrowDownCircle, RotateCcw, Search } from "lucide-react";
import type { Movement, Product, Warehouse } from "./types";
import type { MovementType } from "./types";
import { MOV_TYPES } from "./constants";
import { useDark, selStyle } from "./ui";
import { fmtDate } from "@/lib/format";

export function MovementsView({ movements, products, warehouses, onNew }: {
  movements: Movement[]; products: Product[]; warehouses: Warehouse[]; onNew: () => void;
}) {
  const [typeFilter,    setTypeFilter]    = useState<MovementType | "all">("all");
  const [productFilter, setProductFilter] = useState("all");
  const [search,        setSearch]        = useState("");
  const [dateFrom,      setDateFrom]      = useState("");
  const [dateTo,        setDateTo]        = useState("");
  const isDark = useDark();

  void warehouses;

  const filtered = movements.filter((m) => {
    if (typeFilter !== "all" && m.type !== typeFilter) return false;
    if (productFilter !== "all" && m.product_id !== productFilter) return false;
    if (dateFrom && m.date < dateFrom) return false;
    if (dateTo   && m.date > dateTo)   return false;
    const q = search.toLowerCase();
    if (q && !m.product_name.toLowerCase().includes(q) && !m.reference.toLowerCase().includes(q) && !m.reason.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Filter bar */}
      <div className={`flex items-center gap-2 p-4 border-b flex-wrap ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
        <div className="relative flex-1 min-w-[140px]">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Produit, référence, motif…"
            className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none pl-8 border ${isDark ? "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25" : "bg-white border-gray-200 text-gray-800 placeholder:text-gray-400"}`}/>
          <Search size={13} className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-white/25" : "text-gray-400"}`}/>
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as MovementType | "all")}
          className={`rounded-xl px-3 py-2 text-xs focus:outline-none appearance-none border ${isDark ? "bg-white/[0.05] border-white/[0.08] text-white/70" : "bg-white border-gray-200 text-gray-600"}`}
          style={selStyle(isDark)}>
          <option value="all">Tous types</option>
          {MOV_TYPES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)}
          className={`rounded-xl px-3 py-2 text-xs focus:outline-none appearance-none border max-w-[160px] ${isDark ? "bg-white/[0.05] border-white/[0.08] text-white/70" : "bg-white border-gray-200 text-gray-600"}`}
          style={selStyle(isDark)}>
          <option value="all">Tous produits</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="Depuis"
          className={`rounded-xl px-3 py-2 text-xs focus:outline-none border ${isDark ? "bg-white/[0.05] border-white/[0.08] text-white/70" : "bg-white border-gray-200 text-gray-600"}`}/>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} title="Jusqu'à"
          className={`rounded-xl px-3 py-2 text-xs focus:outline-none border ${isDark ? "bg-white/[0.05] border-white/[0.08] text-white/70" : "bg-white border-gray-200 text-gray-600"}`}/>
        <button onClick={onNew} className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shrink-0"
          style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
          <Plus size={13}/> Mouvement
        </button>
      </div>

      {movements.length >= 200 && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs border border-amber-500/20 bg-amber-500/8 text-amber-400">
          <AlertTriangle size={12}/>
          <span>Historique limité aux 200 derniers mouvements.</span>
        </div>
      )}

      {/* Stats strip */}
      {filtered.length > 0 && (
        <div className={`flex items-center gap-4 px-4 py-2 text-xs border-b ${isDark ? "border-white/[0.04] text-white/30" : "border-gray-100 text-gray-400"}`}>
          <span>{filtered.length} mouvement{filtered.length > 1 ? "s" : ""}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Activity size={28} className={isDark ? "text-white/20" : "text-gray-300"}/>
            <p className={`text-sm ${isDark ? "text-white/30" : "text-gray-400"}`}>Aucun mouvement</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-xs">
              <thead>
                <tr className={`border-b ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
                  <th className={`text-left px-3 py-2.5 font-semibold uppercase tracking-wider w-24 ${isDark ? "text-white/25" : "text-gray-400"}`}>Date</th>
                  <th className={`text-left px-3 py-2.5 font-semibold uppercase tracking-wider w-28 ${isDark ? "text-white/25" : "text-gray-400"}`}>Référence</th>
                  <th className={`text-left px-3 py-2.5 font-semibold uppercase tracking-wider ${isDark ? "text-white/25" : "text-gray-400"}`}>Produit</th>
                  <th className={`text-left px-3 py-2.5 font-semibold uppercase tracking-wider w-24 ${isDark ? "text-white/25" : "text-gray-400"}`}>Type</th>
                  <th className={`text-right px-3 py-2.5 font-semibold uppercase tracking-wider w-20 ${isDark ? "text-white/25" : "text-gray-400"}`}>Quantité</th>
                  <th className={`text-right px-3 py-2.5 font-semibold uppercase tracking-wider w-16 ${isDark ? "text-white/25" : "text-gray-400"}`}>Avant</th>
                  <th className={`text-right px-3 py-2.5 font-semibold uppercase tracking-wider w-16 ${isDark ? "text-white/25" : "text-gray-400"}`}>Après</th>
                  <th className={`text-left px-3 py-2.5 font-semibold uppercase tracking-wider ${isDark ? "text-white/25" : "text-gray-400"}`}>Motif / Origine</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const mt = MOV_TYPES.find((t) => t.value === m.type) ?? MOV_TYPES[0];
                  return (
                    <tr key={m.id} className={`border-b transition-colors ${isDark ? "border-white/[0.04] hover:bg-white/[0.02]" : "border-gray-100 hover:bg-gray-50"}`}>
                      <td className="px-3 py-2.5">
                        <span className={isDark ? "text-white/50" : "text-gray-500"}>{fmtDate(m.date)}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`font-mono text-[10px] ${isDark ? "text-white/40" : "text-gray-500"}`}>{m.reference || "—"}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <div className="h-5 w-5 flex items-center justify-center rounded-lg shrink-0" style={{ background: mt.color + "18" }}>
                            {mt.sign > 0 ? <ArrowUpCircle size={10} style={{ color: mt.color }}/> : mt.sign < 0 ? <ArrowDownCircle size={10} style={{ color: mt.color }}/> : <RotateCcw size={10} style={{ color: mt.color }}/>}
                          </div>
                          <span className={`font-semibold truncate max-w-[180px] ${isDark ? "text-white/80" : "text-gray-700"}`}>{m.product_name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: mt.color + "20", color: mt.color }}>
                          {mt.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="font-bold" style={{ color: mt.color }}>
                          {mt.sign > 0 ? "+" : mt.sign < 0 ? "-" : "±"}{m.quantity}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={isDark ? "text-white/40" : "text-gray-400"}>{m.before_qty}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={`font-semibold ${isDark ? "text-white/70" : "text-gray-700"}`}>{m.after_qty}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`text-[10px] truncate max-w-[160px] block ${isDark ? "text-white/35" : "text-gray-400"}`}>
                          {m.reason || m.warehouse_name || "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
