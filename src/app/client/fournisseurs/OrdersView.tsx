"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Plus, Edit2, Trash2, AlertTriangle } from "lucide-react";
import type { FOrder, Fournisseur, OrderStatus } from "./types";
import { ORDER_STATUS } from "./constants";
import { useDark, selStyle } from "./ui";
import { fmtDate, fmtEur } from "@/lib/format";

export function OrdersView({ orders, fournisseurs, onNew, onEdit, onDelete }: {
  orders: FOrder[]; fournisseurs: Fournisseur[];
  onNew: () => void; onEdit: (o: FOrder) => void; onDelete: (id: string) => void;
}) {
  const isDark = useDark();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const filtered = orders.filter((o) => statusFilter === "all" || o.status === statusFilter);

  // fournisseurs prop is available for future use (e.g. filter by supplier)
  void fournisseurs;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className={`flex items-center gap-2 p-4 border-b flex-wrap ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "all")}
          className="border rounded-xl px-3 py-2 text-xs focus:outline-none appearance-none flex-1 max-w-xs"
          style={selStyle(isDark)}>
          <option value="all">Tous statuts</option>
          {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button onClick={onNew} className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
          style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
          <Plus size={13}/> Nouvelle commande
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <ShoppingCart size={28} className={isDark ? "text-white/20" : "text-gray-300"}/>
            <p className={`text-sm ${isDark ? "text-white/30" : "text-gray-400"}`}>Aucune commande</p>
          </div>
        ) : filtered.map((o) => {
          const s = ORDER_STATUS[o.status];
          const today = new Date().toISOString().split("T")[0];
          const isLate = o.expected_date && o.expected_date < today && !["received", "cancelled"].includes(o.status);
          return (
            <motion.div key={o.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={`group flex items-center gap-3 border rounded-2xl px-4 py-3 transition-all ${isDark ? "bg-white/[0.025] border-white/[0.06] hover:border-white/[0.14]" : "bg-white border-gray-200 hover:border-gray-300"}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className={`text-sm font-semibold truncate ${isDark ? "text-white/85" : "text-gray-800"}`}>{o.fournisseur_name}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.color} ${s.bg}`}>{s.label}</span>
                  {isLate && (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-semibold">
                      <AlertTriangle size={9}/>En retard
                    </span>
                  )}
                </div>
                <p className={`text-xs ${isDark ? "text-white/35" : "text-gray-400"}`}>
                  {o.order_number} · Commandé le {fmtDate(o.order_date)}
                  {o.expected_date ? ` · Attendu le ${fmtDate(o.expected_date)}` : ""}
                  {o.tracking_number ? ` · Suivi : ${o.tracking_number}` : ""}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${isDark ? "text-white/80" : "text-gray-700"}`}>{fmtEur(o.total_amount)}</p>
                <p className={`text-[10px] ${isDark ? "text-white/30" : "text-gray-400"}`}>HT : {fmtEur(o.subtotal)}</p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-all shrink-0">
                <button onClick={() => onEdit(o)}
                  className={`h-7 w-7 flex items-center justify-center rounded-lg ${isDark ? "hover:bg-white/[0.08] text-white/30 hover:text-white/70" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"}`}>
                  <Edit2 size={12}/>
                </button>
                <button onClick={() => onDelete(o.id)}
                  className={`h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 hover:text-red-400 ${isDark ? "text-white/30" : "text-gray-400"}`}>
                  <Trash2 size={12}/>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
