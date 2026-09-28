"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Package, Plus, Search, Edit2, Trash2, Zap, ScanLine } from "lucide-react";
import type { Product } from "./types";
import type { StockState } from "./types";
import { green, CATEGORIES, STOCK_STATES, getStockState } from "./constants";
import { useDark, selStyle } from "./ui";
import { fmtEur } from "@/lib/format";
import { ScannerOverlay } from "./ScannerOverlay";

export function ProductsView({ products, onNew, onEdit, onDelete, onAddMovement }: {
  products: Product[]; onNew: () => void; onEdit: (p: Product) => void;
  onDelete: (id: string) => void; onAddMovement: (p: Product) => void;
}) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | StockState>("all");
  const [showScanner, setShowScanner] = useState(false);
  const isDark = useDark();

  const filtered = products.filter((p) => {
    if (catFilter !== "all" && p.category !== catFilter) return false;
    if (stockFilter !== "all" && getStockState(p) !== stockFilter) return false;
    const q = search.toLowerCase();
    if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q) && !p.barcode.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Filter bar */}
      <div className={`flex items-center gap-2 p-4 border-b flex-wrap ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
        <div className="relative flex-1 min-w-[180px]">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher produit, SKU, code-barres…"
            className={`w-full rounded-xl px-3 py-2 text-sm focus:outline-none pl-8 transition-colors border ${isDark ? "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-white/[0.18]" : "bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-gray-400"}`}/>
          <Search size={13} className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-white/25" : "text-gray-400"}`}/>
        </div>
        <button onClick={() => setShowScanner(true)} title="Scanner un code-barres"
          className={`h-[38px] px-3 shrink-0 rounded-xl border transition-all flex items-center gap-1.5 ${isDark ? "border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white" : "border-gray-200 bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-700"}`}>
          <ScanLine size={14}/>
          <span className="text-xs font-semibold">Scan</span>
        </button>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
          className={`rounded-xl px-3 py-2 text-xs focus:outline-none appearance-none border ${isDark ? "bg-white/[0.05] border-white/[0.08] text-white/70" : "bg-white border-gray-200 text-gray-600"}`}
          style={selStyle(isDark)}>
          <option value="all">Toutes catégories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
          className={`rounded-xl px-3 py-2 text-xs focus:outline-none appearance-none border ${isDark ? "bg-white/[0.05] border-white/[0.08] text-white/70" : "bg-white border-gray-200 text-gray-600"}`}
          style={selStyle(isDark)}>
          <option value="all">Tous états</option>
          <option value="rupture">🔴 Rupture</option>
          <option value="critique">🟠 Critique</option>
          <option value="faible">🟡 Faible</option>
          <option value="normal">🟢 Normal</option>
          <option value="surstock">🔵 Surstock</option>
        </select>
        <button onClick={onNew} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
          style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
          <Plus size={13}/> Nouveau produit
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Package size={28} className={isDark ? "text-white/20" : "text-gray-300"}/>
            <p className={`text-sm ${isDark ? "text-white/30" : "text-gray-400"}`}>Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            <div className={`grid grid-cols-12 gap-3 px-4 py-1.5 text-[10px] font-medium ${isDark ? "text-white/20" : "text-gray-400"}`}>
              <span className="col-span-4">Produit</span>
              <span className="col-span-2">SKU / Catégorie</span>
              <span className="col-span-2 text-right">Prix achat</span>
              <span className="col-span-2 text-right">Prix vente</span>
              <span className="col-span-2 text-right">Stocks</span>
            </div>
            <AnimatePresence>
              {filtered.map((p) => (
                <motion.div key={p.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className={`group grid grid-cols-12 gap-3 items-center rounded-2xl px-4 py-3 transition-all border ${isDark ? "bg-white/[0.025] border-white/[0.06] hover:border-white/[0.14]" : "bg-white border-gray-200 hover:border-gray-300"}`}>
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div className={`h-9 w-9 shrink-0 flex items-center justify-center rounded-xl overflow-hidden ${isDark ? "bg-white/[0.05]" : "bg-gray-100"}`}>
                      {p.image_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover"/>
                        : <Package size={14} className={isDark ? "text-white/40" : "text-gray-400"}/>}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${isDark ? "text-white/85" : "text-gray-800"}`}>{p.name}</p>
                      {p.supplier_name && <p className={`text-xs truncate ${isDark ? "text-white/35" : "text-gray-400"}`}>{p.supplier_name}</p>}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className={`text-xs ${isDark ? "text-white/50" : "text-gray-500"}`}>{p.sku || "—"}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? "bg-white/[0.05] text-white/35" : "bg-gray-100 text-gray-500"}`}>{p.category}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <p className={`text-sm font-semibold ${isDark ? "text-white/70" : "text-gray-600"}`}>{fmtEur(p.purchase_price)}</p>
                  </div>
                  <div className="col-span-2 text-right">
                    <p className="text-sm font-semibold" style={{ color: green }}>{fmtEur(p.sale_price)}</p>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1.5 mb-0.5">
                        <p className={`text-sm font-bold ${isDark ? "text-white/85" : "text-gray-800"}`}>{p.stock_current}</p>
                        {(() => { const s = STOCK_STATES[getStockState(p)]; return (
                          <span className="text-[0.58rem] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
                            {s.label}
                          </span>
                        ); })()}
                      </div>
                      <p className={`text-[10px] ${isDark ? "text-white/25" : "text-gray-400"}`}>{p.unit} · min {p.stock_minimum}</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                      <button onClick={() => onAddMovement(p)} title="Mouvement" className={`h-6 w-6 flex items-center justify-center rounded-lg transition-all hover:text-emerald-400 ${isDark ? "hover:bg-white/[0.08] text-white/30" : "hover:bg-gray-100 text-gray-400"}`}><Zap size={11}/></button>
                      <button onClick={() => onEdit(p)} title="Modifier" className={`h-6 w-6 flex items-center justify-center rounded-lg transition-all ${isDark ? "hover:bg-white/[0.08] text-white/30 hover:text-white/70" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"}`}><Edit2 size={11}/></button>
                      <button onClick={() => onDelete(p.id)} title="Supprimer" className={`h-6 w-6 flex items-center justify-center rounded-lg transition-all hover:text-red-400 ${isDark ? "hover:bg-red-500/10 text-white/30" : "hover:bg-red-50 text-gray-400"}`}><Trash2 size={11}/></button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showScanner && (
          <ScannerOverlay
            onScan={(code) => { setSearch(code); setShowScanner(false); }}
            onClose={() => setShowScanner(false)}/>
        )}
      </AnimatePresence>
    </div>
  );
}
