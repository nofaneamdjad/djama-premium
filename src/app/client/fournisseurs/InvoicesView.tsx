"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, Edit2, Trash2, AlertTriangle } from "lucide-react";
import type { FInvoice, Fournisseur, InvoiceStatus } from "./types";
import { INV_STATUS } from "./constants";
import { useDark, selStyle } from "./ui";
import { fmtDate, fmtEur } from "@/lib/format";

export function InvoicesView({ invoices, fournisseurs, onNew, onEdit, onDelete }: {
  invoices: FInvoice[]; fournisseurs: Fournisseur[];
  onNew: () => void; onEdit: (i: FInvoice) => void; onDelete: (id: string) => void;
}) {
  const isDark = useDark();
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const filtered  = invoices.filter((i) => statusFilter === "all" || i.status === statusFilter);
  const totalDue  = filtered.filter((i) => i.status !== "paid").reduce((s, i) => s + (i.total_amount - i.paid_amount), 0);

  // fournisseurs prop available for future filtering
  void fournisseurs;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className={`flex items-center gap-2 p-4 border-b flex-wrap ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | "all")}
          className="border rounded-xl px-3 py-2 text-xs focus:outline-none appearance-none flex-1 max-w-xs"
          style={selStyle(isDark)}>
          <option value="all">Tous statuts</option>
          {Object.entries(INV_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        {totalDue > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <AlertTriangle size={12} className="text-orange-400"/>
            <span className="text-xs font-bold text-orange-400">{fmtEur(totalDue)} à payer</span>
          </div>
        )}
        <button onClick={onNew} className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
          style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
          <Plus size={13}/> Nouvelle facture
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <FileText size={28} className={isDark ? "text-white/20" : "text-gray-300"}/>
            <p className={`text-sm ${isDark ? "text-white/30" : "text-gray-400"}`}>Aucune facture</p>
          </div>
        ) : filtered.map((inv) => {
          const s         = INV_STATUS[inv.status];
          const remaining = inv.total_amount - inv.paid_amount;
          const today     = new Date().toISOString().split("T")[0];
          const overdue   = inv.due_date && inv.due_date < today && inv.status !== "paid";
          return (
            <motion.div key={inv.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={`group flex items-center gap-3 border rounded-2xl px-4 py-3 transition-all ${isDark ? "bg-white/[0.025] border-white/[0.06] hover:border-white/[0.14]" : "bg-white border-gray-200 hover:border-gray-300"}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className={`text-sm font-semibold truncate ${isDark ? "text-white/85" : "text-gray-800"}`}>{inv.fournisseur_name}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.color} ${s.bg}`}>{s.label}</span>
                  {overdue && (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-semibold">
                      <AlertTriangle size={9}/>Échue
                    </span>
                  )}
                </div>
                <p className={`text-xs ${isDark ? "text-white/35" : "text-gray-400"}`}>
                  {inv.invoice_number || "N° non défini"} · Émise le {fmtDate(inv.issue_date)}
                  {inv.due_date ? ` · Échéance : ${fmtDate(inv.due_date)}` : ""}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${isDark ? "text-white/80" : "text-gray-700"}`}>{fmtEur(inv.total_amount)}</p>
                {remaining > 0 && remaining < inv.total_amount && (
                  <p className="text-xs text-orange-400">Restant : {fmtEur(remaining)}</p>
                )}
              </div>
              <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-all shrink-0">
                <button onClick={() => onEdit(inv)}
                  className={`h-7 w-7 flex items-center justify-center rounded-lg ${isDark ? "hover:bg-white/[0.08] text-white/30 hover:text-white/70" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"}`}>
                  <Edit2 size={12}/>
                </button>
                <button onClick={() => onDelete(inv.id)}
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
