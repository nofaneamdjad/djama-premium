"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Truck, Search, Plus, Edit2, Trash2, Star, ShoppingCart, DollarSign, AlertTriangle,
} from "lucide-react";
import type { Fournisseur, FOrder, FInvoice } from "./types";
import { CATEGORIES, violet } from "./constants";
import { useDark, Stars, selStyle } from "./ui";
import { fmtDate, fmtEur } from "@/lib/format";

export function FournisseursView({ fournisseurs, orders, invoices, onNew, onEdit, onDelete, onRate }: {
  fournisseurs: Fournisseur[]; orders: FOrder[]; invoices: FInvoice[];
  onNew: () => void; onEdit: (f: Fournisseur) => void;
  onDelete: (id: string) => void; onRate: (f: Fournisseur) => void;
}) {
  const isDark = useDark();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  const filtered = fournisseurs.filter((f) => {
    if (catFilter !== "all" && f.category !== catFilter) return false;
    if (search && !f.company_name.toLowerCase().includes(search.toLowerCase()) && !f.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className={`flex items-center gap-2 p-4 border-b flex-wrap ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
        <div className="relative flex-1 min-w-[180px]">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher fournisseur…"
            className={`w-full border rounded-xl px-3 py-2 text-sm pl-8 focus:outline-none transition-colors ${isDark ? "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-white/[0.18]" : "bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-gray-400"}`}/>
          <Search size={13} className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-white/25" : "text-gray-400"}`}/>
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
          className="border rounded-xl px-3 py-2 text-xs focus:outline-none appearance-none"
          style={selStyle(isDark)}>
          <option value="all">Toutes catégories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <button onClick={onNew} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
          style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
          <Plus size={13}/> Nouveau
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3 auto-rows-min">
        {filtered.length === 0 ? (
          <div className="col-span-3 flex flex-col items-center gap-3 py-16 text-center">
            <Truck size={28} className={isDark ? "text-white/20" : "text-gray-300"}/>
            <p className={`text-sm ${isDark ? "text-white/30" : "text-gray-400"}`}>Aucun fournisseur</p>
          </div>
        ) : filtered.map((f) => {
          const score    = f.score_reliability > 0 ? ((f.score_reliability + f.score_quality + f.score_price + f.score_delays) / 4) : null;
          const cat      = CATEGORIES.find((c) => c.value === f.category);
          const fOrders  = orders.filter((o) => o.fournisseur_id === f.id);
          const fInvs    = invoices.filter((i) => i.fournisseur_id === f.id);
          const totalDue = fInvs.filter((i) => i.status !== "paid").reduce((s, i) => s + (i.total_amount - i.paid_amount), 0);
          const contractExpiring = f.contract_expires_at && f.contract_expires_at <= new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

          return (
            <motion.div key={f.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`group border rounded-2xl p-5 transition-all flex flex-col gap-3 ${isDark ? "bg-white/[0.025] border-white/[0.06] hover:border-white/[0.14]" : "bg-white border-gray-200 hover:border-gray-300"}`}>
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 flex items-center justify-center rounded-xl text-sm font-semibold shrink-0"
                    style={{ background: violet + "18", color: violet, border: `1px solid ${violet}30` }}>
                    {f.company_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isDark ? "text-white/90" : "text-gray-800"}`}>{f.company_name}</p>
                    <p className={`text-[10px] ${isDark ? "text-white/40" : "text-gray-400"}`}>{cat?.label}{f.city ? ` · ${f.city}` : ""}</p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-all">
                  <button onClick={() => onRate(f)} title="Évaluer"
                    className={`h-7 w-7 flex items-center justify-center rounded-lg hover:bg-amber-500/10 hover:text-amber-400 transition-all ${isDark ? "text-white/30" : "text-gray-400"}`}>
                    <Star size={12}/>
                  </button>
                  <button onClick={() => onEdit(f)}
                    className={`h-7 w-7 flex items-center justify-center rounded-lg transition-all ${isDark ? "hover:bg-white/[0.08] text-white/30 hover:text-white/70" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"}`}>
                    <Edit2 size={12}/>
                  </button>
                  <button onClick={() => onDelete(f.id)}
                    className={`h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-all ${isDark ? "text-white/30" : "text-gray-400"}`}>
                    <Trash2 size={12}/>
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-0.5">
                {f.email && <p className={`text-xs truncate ${isDark ? "text-white/40" : "text-gray-500"}`}>{f.email}</p>}
                {f.phone && <p className={`text-xs ${isDark ? "text-white/35" : "text-gray-500"}`}>{f.phone}</p>}
                {f.contact_name && <p className={`text-xs ${isDark ? "text-white/35" : "text-gray-500"}`}>Contact : {f.contact_name}</p>}
              </div>

              {/* Score */}
              {score !== null && (
                <div className="flex items-center gap-2">
                  <Stars value={Math.round(score)}/>
                  <span className="text-xs font-bold" style={{ color: score >= 4 ? "#10b981" : score >= 3 ? violet : "#f97316" }}>
                    {score.toFixed(1)}/5
                  </span>
                </div>
              )}

              {/* Stats */}
              <div className={`flex items-center gap-3 pt-3 border-t flex-wrap ${isDark ? "border-white/[0.06]" : "border-gray-100"}`}>
                <div className={`flex items-center gap-1 text-[10px] ${isDark ? "text-white/30" : "text-gray-400"}`}>
                  <ShoppingCart size={10}/> {fOrders.length} commande{fOrders.length > 1 ? "s" : ""}
                </div>
                {totalDue > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-orange-400">
                    <DollarSign size={10}/> {fmtEur(totalDue)} dû
                  </div>
                )}
                <div className={`text-[10px] ml-auto ${isDark ? "text-white/25" : "text-gray-300"}`}>{f.payment_terms}</div>
              </div>

              {/* Alert contrat */}
              {contractExpiring && (
                <div className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-500/5 border border-amber-500/15 rounded-lg px-2.5 py-1.5">
                  <AlertTriangle size={10}/> Contrat expire le {fmtDate(f.contract_expires_at)}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
