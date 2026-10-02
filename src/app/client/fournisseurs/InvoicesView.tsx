"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, Edit2, Trash2, AlertTriangle, ChevronUp, ChevronDown, ChevronsUpDown, Check } from "lucide-react";
import type { FInvoice, Fournisseur, InvoiceStatus } from "./types";
import { INV_STATUS } from "./constants";
import { useDark, selStyle } from "./ui";
import { fmtDate, fmtEur } from "@/lib/format";

type SortKey = "fournisseur_name" | "issue_date" | "due_date" | "total_amount" | "status";
type SortDir = "asc" | "desc";

export function InvoicesView({ invoices, fournisseurs, onNew, onEdit, onDelete }: {
  invoices: FInvoice[]; fournisseurs: Fournisseur[];
  onNew: () => void; onEdit: (i: FInvoice) => void; onDelete: (id: string) => void;
}) {
  void fournisseurs;
  const isDark = useDark();
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "issue_date", dir: "desc" });

  const filtered = useMemo(() => {
    const f = statusFilter === "all" ? invoices : invoices.filter((i) => i.status === statusFilter);
    return [...f].sort((a, b) => {
      let va: string | number = a[sort.key] ?? "";
      let vb: string | number = b[sort.key] ?? "";
      if (sort.key === "total_amount") { va = Number(va); vb = Number(vb); }
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [invoices, statusFilter, sort]);

  const today = new Date().toISOString().split("T")[0];
  const totalDue = filtered.filter((i) => i.status !== "paid").reduce((s, i) => s + (i.total_amount - i.paid_amount), 0);

  function toggleSort(key: SortKey) {
    setSort((s) => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sort.key !== col) return <ChevronsUpDown size={11} className="opacity-30"/>;
    return sort.dir === "asc" ? <ChevronUp size={11}/> : <ChevronDown size={11}/>;
  }

  const th = "px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider whitespace-nowrap select-none cursor-pointer";
  const td = "px-3 py-2.5 text-xs whitespace-nowrap";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className={`flex items-center gap-2 px-4 py-2.5 border-b flex-wrap shrink-0 ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | "all")}
          className="border rounded-xl px-3 py-1.5 text-xs focus:outline-none appearance-none"
          style={selStyle(isDark)}>
          <option value="all">Tous statuts ({invoices.length})</option>
          {Object.entries(INV_STATUS).map(([k, v]) => {
            const n = invoices.filter((i) => i.status === k).length;
            return <option key={k} value={k}>{v.label} ({n})</option>;
          })}
        </select>
        {totalDue > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <AlertTriangle size={11} className="text-orange-400"/>
            <span className="text-xs font-bold text-orange-400">{fmtEur(totalDue)} à payer</span>
          </div>
        )}
        <span className={`text-[10px] ${isDark ? "text-white/25" : "text-gray-400"}`}>{filtered.length} résultat{filtered.length !== 1 ? "s" : ""}</span>
        <button onClick={onNew} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
          style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
          <Plus size={12}/> Nouvelle facture
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <FileText size={28} className={isDark ? "text-white/20" : "text-gray-300"}/>
            <p className={`text-sm ${isDark ? "text-white/30" : "text-gray-400"}`}>Aucune facture</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className={`sticky top-0 z-10 ${isDark ? "bg-[#0d1117]" : "bg-gray-50"}`}>
              <tr className={isDark ? "border-b border-white/[0.06]" : "border-b border-gray-200"}>
                {([
                  ["fournisseur_name", "Fournisseur"],
                  ["status", "Statut"],
                  ["issue_date", "Émission"],
                  ["due_date", "Échéance"],
                  ["total_amount", "Montant TTC"],
                ] as [SortKey, string][]).map(([key, label]) => (
                  <th key={key} className={`${th} ${isDark ? "text-white/35 hover:text-white/60" : "text-gray-400 hover:text-gray-600"}`}
                    onClick={() => toggleSort(key)}>
                    <span className="flex items-center gap-1">{label}<SortIcon col={key}/></span>
                  </th>
                ))}
                <th className={`${th} ${isDark ? "text-white/35" : "text-gray-400"}`}>Restant</th>
                <th className={`${th} w-16 ${isDark ? "text-white/35" : "text-gray-400"}`}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, i) => {
                const s = INV_STATUS[inv.status];
                const remaining = inv.total_amount - inv.paid_amount;
                const overdue = inv.due_date && inv.due_date < today && inv.status !== "paid";
                return (
                  <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }}
                    className={`group border-b transition-colors ${isDark ? "border-white/[0.04] hover:bg-white/[0.03]" : "border-gray-100 hover:bg-gray-50"}`}>
                    <td className={td}>
                      <p className={`font-semibold ${isDark ? "text-white/85" : "text-gray-800"}`}>{inv.fournisseur_name}</p>
                      <p className={`text-[10px] ${isDark ? "text-white/30" : "text-gray-400"}`}>{inv.invoice_number || "N° non défini"}</p>
                    </td>
                    <td className={td}>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.color} ${s.bg}`}>{s.label}</span>
                      {overdue && <span className="ml-1 inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400"><AlertTriangle size={8}/>Échue</span>}
                    </td>
                    <td className={`${td} ${isDark ? "text-white/50" : "text-gray-500"}`}>{fmtDate(inv.issue_date)}</td>
                    <td className={`${td} ${overdue ? "text-red-400 font-semibold" : isDark ? "text-white/50" : "text-gray-500"}`}>
                      {inv.due_date ? fmtDate(inv.due_date) : <span className={isDark ? "text-white/20" : "text-gray-300"}>—</span>}
                    </td>
                    <td className={td}>
                      <p className={`font-bold tabular-nums ${isDark ? "text-white/80" : "text-gray-700"}`}>{fmtEur(inv.total_amount)}</p>
                      <p className={`text-[10px] ${isDark ? "text-white/30" : "text-gray-400"}`}>HT {fmtEur(inv.subtotal)}</p>
                    </td>
                    <td className={td}>
                      {remaining > 0 && remaining < inv.total_amount
                        ? <span className="font-semibold tabular-nums text-orange-400">{fmtEur(remaining)}</span>
                        : remaining > 0
                          ? <span className={`tabular-nums ${isDark ? "text-white/40" : "text-gray-400"}`}>{fmtEur(remaining)}</span>
                          : <span className="flex items-center gap-0.5 text-emerald-400"><Check size={11} />Soldé</span>}
                    </td>
                    <td className={td}>
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-all justify-end">
                        <button onClick={() => onEdit(inv)}
                          className={`h-6 w-6 flex items-center justify-center rounded-lg ${isDark ? "hover:bg-white/[0.08] text-white/30 hover:text-white/70" : "hover:bg-gray-200 text-gray-400 hover:text-gray-600"}`}>
                          <Edit2 size={11}/>
                        </button>
                        <button onClick={() => onDelete(inv.id)}
                          className={`h-6 w-6 flex items-center justify-center rounded-lg hover:bg-red-500/10 hover:text-red-400 ${isDark ? "text-white/30" : "text-gray-400"}`}>
                          <Trash2 size={11}/>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
