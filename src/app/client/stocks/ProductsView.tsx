"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Package, Plus, Search, Edit2, Trash2, Zap, ScanLine,
  List, Layers,
} from "lucide-react";
import type { Product } from "./types";
import type { StockState } from "./types";
import { green, gold, CATEGORIES, STOCK_STATES, getStockState } from "./constants";
import { useDark, selStyle } from "./ui";
import { fmtEur } from "@/lib/format";
import { ScannerOverlay } from "./ScannerOverlay";

export function ProductsView({ products, onNew, onEdit, onDelete, onAddMovement, onOpenLots, onOpenDetail }: {
  products: Product[];
  onNew: () => void;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
  onAddMovement: (p: Product) => void;
  onOpenLots?: (p: Product) => void;
  onOpenDetail?: (p: Product) => void;
}) {
  const [search, setSearch]         = useState("");
  const [catFilter, setCatFilter]   = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | StockState>("all");
  const [view, setView]             = useState<"table" | "cards">("table");
  const [showScanner, setShowScanner] = useState(false);
  const isDark = useDark();

  const filtered = products.filter((p) => {
    if (catFilter !== "all" && p.category !== catFilter) return false;
    if (stockFilter !== "all" && getStockState(p) !== stockFilter) return false;
    const q = search.toLowerCase();
    if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q) && !p.barcode.toLowerCase().includes(q)) return false;
    return true;
  });

  const totalValue = filtered.reduce((s, p) => s + p.stock_current * p.purchase_price, 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Filter bar */}
      <div className={`flex items-center gap-2 p-4 border-b flex-wrap ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
        <div className="relative flex-1 min-w-[160px]">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher produit, SKU, code-barres…"
            className={`w-full rounded-xl px-3 py-2 text-sm focus:outline-none pl-8 border ${isDark ? "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25" : "bg-white border-gray-200 text-gray-800 placeholder:text-gray-400"}`}/>
          <Search size={13} className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-white/25" : "text-gray-400"}`}/>
        </div>
        <button onClick={() => setShowScanner(true)} title="Scanner"
          className={`h-[38px] px-3 shrink-0 rounded-xl border flex items-center gap-1.5 ${isDark ? "border-white/[0.08] bg-white/[0.04] text-white/50 hover:text-white" : "border-gray-200 bg-white text-gray-500"}`}>
          <ScanLine size={14}/><span className="text-xs font-semibold hidden sm:inline">Scan</span>
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
          <option value="rupture">Rupture</option>
          <option value="critique">Critique</option>
          <option value="faible">Faible</option>
          <option value="normal">Normal</option>
          <option value="surstock">Surstock</option>
        </select>

        {/* View toggle */}
        <div className={`flex rounded-xl border overflow-hidden ${isDark ? "border-white/[0.08]" : "border-gray-200"}`}>
          {([["table", List], ["cards", Layers]] as const).map(([v, Icon]) => (
            <button key={v} onClick={() => setView(v)}
              className={`h-[38px] px-2.5 flex items-center transition-colors ${view === v ? isDark ? "bg-white/[0.08] text-white/70" : "bg-gray-100 text-gray-700" : isDark ? "text-white/25 hover:text-white/50" : "text-gray-300 hover:text-gray-500"}`}>
              <Icon size={13}/>
            </button>
          ))}
        </div>

        <button onClick={onNew} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
          style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
          <Plus size={13}/> Nouveau produit
        </button>
      </div>

      {/* Stats strip */}
      {filtered.length > 0 && (
        <div className={`flex items-center gap-4 px-4 py-2 text-xs border-b ${isDark ? "border-white/[0.04] text-white/30" : "border-gray-100 text-gray-400"}`}>
          <span>{filtered.length} produit{filtered.length > 1 ? "s" : ""}</span>
          <span className="font-semibold" style={{ color: gold }}>Valeur : {fmtEur(totalValue)}</span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Package size={28} className={isDark ? "text-white/20" : "text-gray-300"}/>
            <p className={`text-sm ${isDark ? "text-white/30" : "text-gray-400"}`}>Aucun produit trouvé</p>
          </div>
        ) : view === "table" ? (
          <DenseTable products={filtered} isDark={isDark}
            onEdit={onEdit} onDelete={onDelete} onAddMovement={onAddMovement}
            onOpenLots={onOpenLots} onOpenDetail={onOpenDetail}/>
        ) : (
          <CardGrid products={filtered} isDark={isDark}
            onEdit={onEdit} onDelete={onDelete} onAddMovement={onAddMovement}/>
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

// ─── Dense ERP Table (Phase 8) ────────────────────────────────────────────────

const COLS = [
  { key: "name",          label: "Produit",      span: "col-span-3" },
  { key: "sku",           label: "SKU / Cat.",   span: "col-span-2" },
  { key: "dispo",         label: "Disponible",   span: "col-span-1 text-right" },
  { key: "reserved",      label: "Réservé",      span: "col-span-1 text-right" },
  { key: "on_order",      label: "Commandé",     span: "col-span-1 text-right" },
  { key: "threshold",     label: "Seuil",        span: "col-span-1 text-right" },
  { key: "cost",          label: "Coût",         span: "col-span-1 text-right" },
  { key: "value",         label: "Valeur",       span: "col-span-1 text-right" },
  { key: "actions",       label: "",             span: "col-span-1 text-right" },
] as const;

function DenseTable({ products, isDark, onEdit, onDelete, onAddMovement, onOpenLots, onOpenDetail }: {
  products: Product[]; isDark: boolean;
  onEdit: (p: Product) => void; onDelete: (id: string) => void;
  onAddMovement: (p: Product) => void;
  onOpenLots?: (p: Product) => void;
  onOpenDetail?: (p: Product) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-xs">
        <thead>
          <tr className={`border-b ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
            <th className={`text-left px-3 py-2.5 font-semibold uppercase tracking-wider w-56 ${isDark ? "text-white/25" : "text-gray-400"}`}>Produit</th>
            <th className={`text-left px-3 py-2.5 font-semibold uppercase tracking-wider w-28 ${isDark ? "text-white/25" : "text-gray-400"}`}>SKU / Cat.</th>
            <th className={`text-right px-3 py-2.5 font-semibold uppercase tracking-wider w-20 ${isDark ? "text-white/25" : "text-gray-400"}`}>Disponible</th>
            <th className={`text-right px-3 py-2.5 font-semibold uppercase tracking-wider w-20 ${isDark ? "text-white/25" : "text-gray-400"}`}>Réservé</th>
            <th className={`text-right px-3 py-2.5 font-semibold uppercase tracking-wider w-20 ${isDark ? "text-white/25" : "text-gray-400"}`}>Commandé</th>
            <th className={`text-right px-3 py-2.5 font-semibold uppercase tracking-wider w-16 ${isDark ? "text-white/25" : "text-gray-400"}`}>Seuil</th>
            <th className={`text-right px-3 py-2.5 font-semibold uppercase tracking-wider w-20 ${isDark ? "text-white/25" : "text-gray-400"}`}>Coût</th>
            <th className={`text-right px-3 py-2.5 font-semibold uppercase tracking-wider w-24 ${isDark ? "text-white/25" : "text-gray-400"}`}>Valeur stock</th>
            <th className={`text-right px-3 py-2.5 font-semibold uppercase tracking-wider w-28 ${isDark ? "text-white/25" : "text-gray-400"}`}>Statut</th>
            <th className="w-24"></th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => {
            const s = STOCK_STATES[getStockState(p)];
            const val = Math.round(p.stock_current * p.purchase_price * 100) / 100;
            return (
              <tr key={p.id}
                className={`group border-b transition-colors cursor-pointer ${isDark ? "border-white/[0.04] hover:bg-white/[0.03]" : "border-gray-100 hover:bg-gray-50"}`}
                onClick={() => onOpenDetail?.(p)}>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`h-7 w-7 shrink-0 flex items-center justify-center rounded-lg overflow-hidden ${isDark ? "bg-white/[0.05]" : "bg-gray-100"}`}>
                      {p.image_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover"/>
                        : <Package size={11} className={isDark ? "text-white/30" : "text-gray-400"}/>}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-semibold truncate text-xs leading-snug ${isDark ? "text-white/85" : "text-gray-800"}`}>{p.name}</p>
                      {p.supplier_name && <p className={`text-[10px] truncate ${isDark ? "text-white/30" : "text-gray-400"}`}>{p.supplier_name}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <p className={`font-mono text-[10px] ${isDark ? "text-white/50" : "text-gray-500"}`}>{p.sku || "—"}</p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isDark ? "bg-white/[0.05] text-white/30" : "bg-gray-100 text-gray-500"}`}>{p.category}</span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className={`font-bold text-sm ${isDark ? "text-white/80" : "text-gray-700"}`}>{p.stock_current}</span>
                  <span className={`text-[10px] ml-0.5 ${isDark ? "text-white/30" : "text-gray-400"}`}>{p.unit}</span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className={isDark ? "text-white/40" : "text-gray-500"}>{p.stock_reserved > 0 ? p.stock_reserved : "—"}</span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className={p.stock_on_order > 0 ? "text-blue-400" : isDark ? "text-white/25" : "text-gray-300"}>
                    {p.stock_on_order > 0 ? p.stock_on_order : "—"}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className={isDark ? "text-white/40" : "text-gray-500"}>{p.stock_minimum}</span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className={isDark ? "text-white/60" : "text-gray-600"}>{fmtEur(p.purchase_price)}</span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className="font-semibold" style={{ color: green }}>{fmtEur(val)}</span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
                    {s.label}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right" onClick={e => e.stopPropagation()}>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center justify-end gap-0.5 transition-all">
                    <button onClick={() => onAddMovement(p)} title="Mouvement"
                      className={`h-6 w-6 flex items-center justify-center rounded-lg hover:text-emerald-400 ${isDark ? "hover:bg-white/[0.08] text-white/30" : "hover:bg-gray-100 text-gray-400"}`}><Zap size={10}/></button>
                    {onOpenLots && (
                      <button onClick={() => onOpenLots(p)} title="Lots/Séries"
                        className={`h-6 w-6 flex items-center justify-center rounded-lg hover:text-blue-400 ${isDark ? "hover:bg-white/[0.08] text-white/30" : "hover:bg-gray-100 text-gray-400"}`}>
                        <Layers size={10}/>
                      </button>
                    )}
                    <button onClick={() => onEdit(p)} title="Modifier"
                      className={`h-6 w-6 flex items-center justify-center rounded-lg ${isDark ? "hover:bg-white/[0.08] text-white/30 hover:text-white/70" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"}`}><Edit2 size={10}/></button>
                    <button onClick={() => onDelete(p.id)} title="Supprimer"
                      className={`h-6 w-6 flex items-center justify-center rounded-lg hover:text-red-400 ${isDark ? "hover:bg-red-500/10 text-white/30" : "hover:bg-red-50 text-gray-400"}`}><Trash2 size={10}/></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Card grid (former default, kept as optional view) ────────────────────────

void COLS; // reference suppressor

function CardGrid({ products, isDark, onEdit, onDelete, onAddMovement }: {
  products: Product[]; isDark: boolean;
  onEdit: (p: Product) => void; onDelete: (id: string) => void;
  onAddMovement: (p: Product) => void;
}) {
  return (
    <div className="p-4 space-y-2">
      <div className={`grid grid-cols-12 gap-3 px-4 py-1.5 text-[10px] font-medium ${isDark ? "text-white/20" : "text-gray-400"}`}>
        <span className="col-span-4">Produit</span>
        <span className="col-span-2">SKU / Catégorie</span>
        <span className="col-span-2 text-right">Prix achat</span>
        <span className="col-span-2 text-right">Prix vente</span>
        <span className="col-span-2 text-right">Stocks</span>
      </div>
      {products.map((p) => (
        <div key={p.id}
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
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
                    {s.label}
                  </span>
                ); })()}
              </div>
              <p className={`text-[10px] ${isDark ? "text-white/25" : "text-gray-400"}`}>{p.unit} · min {p.stock_minimum}</p>
            </div>
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
              <button onClick={() => onAddMovement(p)} className={`h-6 w-6 flex items-center justify-center rounded-lg hover:text-emerald-400 ${isDark ? "hover:bg-white/[0.08] text-white/30" : "hover:bg-gray-100 text-gray-400"}`}><Zap size={11}/></button>
              <button onClick={() => onEdit(p)} className={`h-6 w-6 flex items-center justify-center rounded-lg ${isDark ? "hover:bg-white/[0.08] text-white/30 hover:text-white/70" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"}`}><Edit2 size={11}/></button>
              <button onClick={() => onDelete(p.id)} className={`h-6 w-6 flex items-center justify-center rounded-lg hover:text-red-400 ${isDark ? "hover:bg-red-500/10 text-white/30" : "hover:bg-red-50 text-gray-400"}`}><Trash2 size={11}/></button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
