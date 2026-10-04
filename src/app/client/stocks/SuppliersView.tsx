"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Truck, Package, RefreshCw } from "lucide-react";
import type { Supplier, Product, SupplierOrder, FournisseurImport } from "./types";
import { gold, green } from "./constants";
import { useDark } from "./ui";

export function SuppliersView({ suppliers, products, orders, fournisseursImport, onNew, onEdit, onDelete, onImport }: {
  suppliers: Supplier[]; products: Product[]; orders: SupplierOrder[];
  fournisseursImport: FournisseurImport[];
  onNew: () => void; onEdit: (s: Supplier) => void; onDelete: (id: string) => void;
  onImport: (id: string) => void;
}) {
  const [importing, setImporting] = useState<string | null>(null);
  const isDark = useDark();

  void orders; // available for future orders sub-view

  async function doImport(id: string) {
    setImporting(id);
    await onImport(id);
    setImporting(null);
  }

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-bold ${isDark ? "text-white/60" : "text-gray-500"}`}>{suppliers.length} fournisseur{suppliers.length > 1 ? "s" : ""}</h3>
        <button onClick={onNew} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold" style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
          <Plus size={13}/> Nouveau fournisseur
        </button>
      </div>

      {suppliers.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Truck size={28} className={isDark ? "text-white/20" : "text-gray-300"}/>
          <p className={`text-sm ${isDark ? "text-white/30" : "text-gray-400"}`}>Aucun fournisseur</p>
          <button onClick={onNew} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold" style={{ background: "rgba(201,165,90,0.15)", color: gold, border: `1px solid rgba(201,165,90,0.3)` }}>
            <Plus size={13}/> Ajouter
          </button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => {
            const prodCount = products.filter((p) => p.supplier_id === s.id).length;
            return (
              <motion.div key={s.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`group rounded-2xl p-5 transition-all border ${isDark ? "bg-white/[0.025] border-white/[0.06] hover:border-white/[0.14]" : "bg-white border-gray-200 hover:border-gray-300"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl text-sm font-semibold" style={{ background: green + "18", color: green, border: `1px solid ${green}30` }}>
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                    <button onClick={() => onEdit(s)} className={`h-7 w-7 flex items-center justify-center rounded-lg transition-all ${isDark ? "hover:bg-white/[0.08] text-white/30 hover:text-white/70" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"}`}><Edit2 size={12}/></button>
                    <button onClick={() => onDelete(s.id)} className={`h-7 w-7 flex items-center justify-center rounded-lg transition-all hover:text-red-400 ${isDark ? "hover:bg-red-500/10 text-white/30" : "hover:bg-red-50 text-gray-400"}`}><Trash2 size={12}/></button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`text-sm font-semibold ${isDark ? "text-white/90" : "text-gray-800"}`}>{s.name}</h4>
                  {s.fournisseur_id && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "rgba(201,165,90,0.12)", color: "#c9a55a", border: "1px solid rgba(139,92,246,0.2)" }}>Lié</span>
                  )}
                </div>
                {s.contact && <p className={`text-xs mb-0.5 ${isDark ? "text-white/45" : "text-gray-500"}`}>{s.contact}</p>}
                {s.email && <p className={`text-xs mb-0.5 ${isDark ? "text-white/35" : "text-gray-400"}`}>{s.email}</p>}
                {s.phone && <p className={`text-xs mb-3 ${isDark ? "text-white/35" : "text-gray-400"}`}>{s.phone}</p>}
                <div className={`flex items-center gap-3 pt-3 border-t ${isDark ? "border-white/[0.06]" : "border-gray-100"}`}>
                  <div className={`flex items-center gap-1 text-[10px] ${isDark ? "text-white/30" : "text-gray-400"}`}><Package size={10}/> {prodCount} produit{prodCount > 1 ? "s" : ""}</div>
                  <div className={`flex items-center gap-1 text-[10px] ${isDark ? "text-white/30" : "text-gray-400"}`}><Truck size={10}/> {s.lead_time_days}j livraison</div>
                  <div className={`text-[10px] ml-auto ${isDark ? "text-white/25" : "text-gray-400"}`}>{s.payment_terms}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Section import depuis module Fournisseurs */}
      {fournisseursImport.length > 0 && (
        <div className={`rounded-2xl border p-4 space-y-3 ${isDark ? "bg-white/[0.02] border-white/[0.06]" : "bg-gray-50 border-gray-200"}`}>
          <div className="flex items-center gap-2">
            <Truck size={13} style={{ color: "#c9a55a" }}/>
            <h4 className={`text-xs font-semibold ${isDark ? "text-white/60" : "text-gray-500"}`}>
              Importer depuis le module Fournisseurs ({fournisseursImport.length})
            </h4>
          </div>
          <div className="space-y-2">
            {fournisseursImport.slice(0, 8).map(f => (
              <div key={f.id} className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 border ${isDark ? "bg-white/[0.025] border-white/[0.05]" : "bg-white border-gray-200"}`}>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold truncate ${isDark ? "text-white/80" : "text-gray-700"}`}>{f.company_name}</p>
                  {f.email && <p className={`text-[10px] truncate ${isDark ? "text-white/35" : "text-gray-400"}`}>{f.email}</p>}
                </div>
                <button
                  onClick={() => doImport(f.id)}
                  disabled={importing === f.id}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50"
                  style={{ background: "rgba(201,165,90,0.12)", color: "#c9a55a", border: "1px solid rgba(139,92,246,0.2)" }}>
                  {importing === f.id ? <RefreshCw size={10} className="animate-spin"/> : <Plus size={10}/>}
                  {importing === f.id ? "…" : "Lier"}
                </button>
              </div>
            ))}
            {fournisseursImport.length > 8 && (
              <p className={`text-[10px] text-center ${isDark ? "text-white/25" : "text-gray-400"}`}>
                +{fournisseursImport.length - 8} autres fournisseurs disponibles
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
