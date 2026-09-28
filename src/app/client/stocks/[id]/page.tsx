"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Package, ArrowLeft, Activity, Layers, BarChart2,
  Clock, Edit2, ArrowUpCircle, ArrowDownCircle, RotateCcw,
  RefreshCw, AlertOctagon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToastStack, ToastStack } from "@/components/ui/ToastStack";
import { useTheme } from "@/lib/theme-context";
import { fmtEur, fmtDate } from "@/lib/format";
import { DarkCtx } from "../ui";
import { LotsView } from "../LotsView";
import { AnimatePresence } from "framer-motion";
import { STOCK_STATES, MOV_TYPES, getStockState } from "../constants";
import type { Product, Movement, StockLot } from "../types";

type DetailTab = "info" | "mouvements" | "lots" | "valorisation" | "activite";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isDark } = useTheme();
  const { toasts, add: toast, remove: removeToast } = useToastStack();

  const [product,   setProduct]   = useState<Product | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [lots,      setLots]      = useState<StockLot[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [userId,    setUserId]    = useState<string | null>(null);
  const [tab,       setTab]       = useState<DetailTab>("info");
  const [showLots,  setShowLots]  = useState(false);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }
    setUserId(user.id);

    const [pRes, mRes, lRes] = await Promise.all([
      supabase.from("stock_products").select("*").eq("id", id).eq("user_id", user.id).single(),
      supabase.from("stock_movements").select("*").eq("product_id", id).eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("stock_lots").select("*").eq("product_id", id).eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    if (pRes.error || !pRes.data) { toast("Produit introuvable", "error"); router.replace("/client/stocks"); return; }
    setProduct(pRes.data as Product);
    if (!mRes.error && mRes.data) setMovements(mRes.data as Movement[]);
    if (!lRes.error && lRes.data) setLots(lRes.data as StockLot[]);
    setLoading(false);
  }, [id, router, toast]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <DarkCtx.Provider value={isDark}>
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-[#07080e]" : "bg-gray-50"}`}>
        <RefreshCw size={22} className={`animate-spin ${isDark ? "text-white/30" : "text-gray-300"}`}/>
      </div>
    </DarkCtx.Provider>
  );

  if (!product) return null;

  const stockState = getStockState(product);
  const ss = STOCK_STATES[stockState];
  const totalValue = product.stock_current * product.purchase_price;
  const totalLots = lots.reduce((s, l) => s + l.quantity, 0);
  const margin = product.sale_price > 0 ? ((product.sale_price - product.purchase_price) / product.sale_price) * 100 : 0;

  const TABS: { key: DetailTab; label: string; icon: React.ElementType }[] = [
    { key: "info",         label: "Infos",       icon: Package },
    { key: "mouvements",   label: "Mouvements",  icon: Activity },
    { key: "lots",         label: "Lots",        icon: Layers },
    { key: "valorisation", label: "Valorisation",icon: BarChart2 },
    { key: "activite",     label: "Activité",    icon: Clock },
  ];

  return (
    <DarkCtx.Provider value={isDark}>
      <ToastStack toasts={toasts} remove={removeToast}/>
      <div className={`min-h-screen flex flex-col ${isDark ? "bg-[#07080e] text-white" : "bg-gray-50 text-gray-900"}`}>

        {/* Header */}
        <div className={`sticky top-0 z-10 shrink-0 px-5 py-4 border-b flex items-center gap-3 ${isDark ? "bg-[#07080e] border-white/[0.06]" : "bg-white border-gray-200"}`}>
          <button onClick={() => router.back()}
            className={`h-8 w-8 flex items-center justify-center rounded-xl border shrink-0 ${isDark ? "border-white/10 text-white/50 hover:text-white" : "border-gray-200 text-gray-400 hover:text-gray-700"}`}>
            <ArrowLeft size={14}/>
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`h-9 w-9 shrink-0 flex items-center justify-center rounded-xl overflow-hidden ${isDark ? "bg-white/[0.05]" : "bg-gray-100"}`}>
              {product.image_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover"/>
                : <Package size={14} className={isDark ? "text-white/40" : "text-gray-400"}/>}
            </div>
            <div className="min-w-0">
              <h1 className={`text-base font-bold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{product.name}</h1>
              <p className={`text-xs truncate ${isDark ? "text-white/35" : "text-gray-400"}`}>{product.sku && `${product.sku} · `}{product.category}</p>
            </div>
            <span className="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ color: ss.color, background: ss.bg, border: `1px solid ${ss.border}` }}>
              {ss.label}
            </span>
          </div>
          <button onClick={() => router.push(`/client/stocks?edit=${product.id}`)}
            className={`h-8 px-3 flex items-center gap-1.5 rounded-xl border text-xs font-semibold shrink-0 ${isDark ? "border-white/10 text-white/50 hover:text-white" : "border-gray-200 text-gray-400 hover:text-gray-700"}`}>
            <Edit2 size={11}/><span className="hidden sm:inline">Modifier</span>
          </button>
        </div>

        {/* KPI strip */}
        <div className={`flex gap-3 px-5 py-3 border-b overflow-x-auto ${isDark ? "border-white/[0.04]" : "border-gray-100"}`}>
          {[
            { label: "Stock actuel", value: `${product.stock_current} ${product.unit}`, color: ss.color },
            { label: "Stock min",    value: `${product.stock_minimum} ${product.unit}`, color: undefined },
            { label: "Valeur stock", value: fmtEur(totalValue),                          color: "#c9a55a" },
            { label: "Prix achat",  value: fmtEur(product.purchase_price),               color: undefined },
            { label: "Prix vente",  value: fmtEur(product.sale_price),                   color: "#10b981" },
            { label: "Marge",       value: `${margin.toFixed(1)} %`,                      color: margin >= 30 ? "#10b981" : margin >= 15 ? "#f59e0b" : "#ef4444" },
            { label: "Lots",        value: `${lots.length} (${totalLots} ${product.unit})`, color: undefined },
          ].map(k => (
            <div key={k.label} className={`shrink-0 rounded-xl border px-3 py-2 ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
              <p className="text-xs font-bold" style={{ color: k.color ?? (isDark ? "rgba(255,255,255,0.8)" : "#1f2937") }}>{k.value}</p>
              <p className={`text-[10px] mt-0.5 ${isDark ? "text-white/30" : "text-gray-400"}`}>{k.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className={`flex gap-0.5 px-5 border-b overflow-x-auto scrollbar-none ${isDark ? "border-white/[0.04]" : "border-gray-200"}`}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`shrink-0 relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-all ${tab === key ? isDark ? "text-white" : "text-gray-800" : isDark ? "text-white/35 hover:text-white/60" : "text-gray-400 hover:text-gray-600"}`}>
              <Icon size={12}/> {label}
              {tab === key && (
                <motion.div layoutId="detail-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: "#c9a55a" }}/>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {tab === "info"       && <InfoTab product={product} isDark={isDark}/>}
          {tab === "mouvements" && <MovementsTab movements={movements} isDark={isDark}/>}
          {tab === "lots"       && <LotsTab lots={lots} product={product} isDark={isDark} onManage={() => setShowLots(true)}/>}
          {tab === "valorisation" && <ValorisationTab product={product} movements={movements} isDark={isDark}/>}
          {tab === "activite"   && <ActiviteTab movements={movements} isDark={isDark}/>}
        </div>
      </div>

      <AnimatePresence>
        {showLots && userId && (
          <LotsView product={product} userId={userId} onClose={() => { setShowLots(false); load(); }}/>
        )}
      </AnimatePresence>
    </DarkCtx.Provider>
  );
}

// ─── Tab: Info ────────────────────────────────────────────────────────────────

function InfoTab({ product, isDark }: { product: Product; isDark: boolean }) {
  const fields = [
    { label: "Nom",          value: product.name },
    { label: "SKU",          value: product.sku || "—" },
    { label: "Code-barres",  value: product.barcode || "—" },
    { label: "Catégorie",    value: product.category },
    { label: "Unité",        value: product.unit },
    { label: "Fournisseur",  value: product.supplier_name || "—" },
    { label: "Description",  value: product.description || "—" },
    { label: "Emplacement",  value: product.location || "—" },
    { label: "TVA",          value: `${product.vat_rate} %` },
    { label: "Réservé",      value: product.stock_reserved },
    { label: "En commande",  value: product.stock_on_order },
    { label: "Créé le",      value: new Date(product.created_at).toLocaleDateString("fr-FR") },
    { label: "Mis à jour",   value: new Date(product.updated_at).toLocaleDateString("fr-FR") },
  ];
  return (
    <div className="p-5 max-w-2xl space-y-1">
      {fields.map(f => (
        <div key={f.label} className={`flex items-start justify-between gap-3 py-2 border-b ${isDark ? "border-white/[0.04]" : "border-gray-100"}`}>
          <span className={`text-xs shrink-0 w-32 ${isDark ? "text-white/30" : "text-gray-400"}`}>{f.label}</span>
          <span className={`text-xs text-right ${isDark ? "text-white/80" : "text-gray-700"}`}>{String(f.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Mouvements ─────────────────────────────────────────────────────────

function MovementsTab({ movements, isDark }: { movements: Movement[]; isDark: boolean }) {
  if (movements.length === 0) return (
    <div className="flex flex-col items-center gap-3 py-16">
      <Activity size={28} className={isDark ? "text-white/20" : "text-gray-300"}/>
      <p className={`text-sm ${isDark ? "text-white/30" : "text-gray-400"}`}>Aucun mouvement</p>
    </div>
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-xs">
        <thead>
          <tr className={`border-b ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
            {["Date","Type","Qté","Avant","Après","Motif"].map(h => (
              <th key={h} className={`px-4 py-2.5 text-left font-semibold uppercase tracking-wider ${isDark ? "text-white/25" : "text-gray-400"}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {movements.map(m => {
            const mt = MOV_TYPES.find(t => t.value === m.type) ?? MOV_TYPES[0];
            return (
              <tr key={m.id} className={`border-b ${isDark ? "border-white/[0.04] hover:bg-white/[0.02]" : "border-gray-100 hover:bg-gray-50"}`}>
                <td className={`px-4 py-2.5 ${isDark ? "text-white/50" : "text-gray-500"}`}>{fmtDate(m.date)}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="h-5 w-5 flex items-center justify-center rounded" style={{ background: mt.color + "18" }}>
                      {mt.sign > 0 ? <ArrowUpCircle size={10} style={{ color: mt.color }}/> : mt.sign < 0 ? <ArrowDownCircle size={10} style={{ color: mt.color }}/> : <RotateCcw size={10} style={{ color: mt.color }}/>}
                    </div>
                    <span style={{ color: mt.color }}>{mt.label}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 font-bold" style={{ color: mt.color }}>
                  {mt.sign > 0 ? "+" : mt.sign < 0 ? "-" : "±"}{m.quantity}
                </td>
                <td className={`px-4 py-2.5 ${isDark ? "text-white/40" : "text-gray-400"}`}>{m.before_qty}</td>
                <td className={`px-4 py-2.5 font-semibold ${isDark ? "text-white/70" : "text-gray-700"}`}>{m.after_qty}</td>
                <td className={`px-4 py-2.5 max-w-[180px] truncate ${isDark ? "text-white/35" : "text-gray-400"}`}>{m.reason || m.reference || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Tab: Lots ────────────────────────────────────────────────────────────────

function LotsTab({ lots, product, isDark, onManage }: { lots: StockLot[]; product: Product; isDark: boolean; onManage: () => void }) {
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className={`text-sm ${isDark ? "text-white/50" : "text-gray-500"}`}>{lots.length} lot{lots.length > 1 ? "s" : ""}</p>
        <button onClick={onManage} className="px-3 py-1.5 rounded-xl text-xs font-bold"
          style={{ background: "rgba(201,165,90,0.12)", color: "#c9a55a", border: "1px solid rgba(201,165,90,0.25)" }}>
          <Layers size={11} className="inline mr-1"/>Gérer les lots
        </button>
      </div>
      {lots.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <Layers size={24} className={isDark ? "text-white/20" : "text-gray-300"}/>
          <p className={`text-sm ${isDark ? "text-white/30" : "text-gray-400"}`}>Aucun lot</p>
        </div>
      ) : lots.map(l => (
        <div key={l.id} className={`rounded-xl border px-4 py-3 ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
          <div className="flex items-center justify-between">
            <span className={`font-bold text-sm ${isDark ? "text-white/85" : "text-gray-800"}`}>{l.lot_number}</span>
            <span className={`text-sm font-semibold ${isDark ? "text-white/60" : "text-gray-600"}`}>{l.quantity} {product.unit}</span>
          </div>
          {l.expiry_date && <p className={`text-xs mt-0.5 ${isDark ? "text-white/30" : "text-gray-400"}`}>DLC : {new Date(l.expiry_date).toLocaleDateString("fr-FR")}</p>}
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Valorisation ───────────────────────────────────────────────────────

function ValorisationTab({ product, movements, isDark }: { product: Product; movements: Movement[]; isDark: boolean }) {
  const totalIn  = movements.filter(m => m.type === "entree" || m.type === "retour").reduce((s, m) => s + m.quantity * product.purchase_price, 0);
  const totalOut = movements.filter(m => m.type === "sortie" || m.type === "perte"  || m.type === "casse").reduce((s, m) => s + m.quantity * product.sale_price, 0);
  const margin   = product.sale_price > 0 ? ((product.sale_price - product.purchase_price) / product.sale_price) * 100 : 0;
  const fields = [
    { label: "Valeur stock actuel",  value: fmtEur(product.stock_current * product.purchase_price), highlight: true },
    { label: "Coût d'achat unitaire",value: fmtEur(product.purchase_price) },
    { label: "Prix de vente",        value: fmtEur(product.sale_price) },
    { label: "Marge brute",          value: `${margin.toFixed(1)} %` },
    { label: "Total entré (coût)",   value: fmtEur(totalIn) },
    { label: "Total sorti (PV)",     value: fmtEur(totalOut) },
  ];
  return (
    <div className="p-5 max-w-lg space-y-2">
      {fields.map(f => (
        <div key={f.label} className={`flex items-center justify-between py-2 border-b ${isDark ? "border-white/[0.04]" : "border-gray-100"}`}>
          <span className={`text-xs ${isDark ? "text-white/40" : "text-gray-400"}`}>{f.label}</span>
          <span className={`text-sm font-bold ${f.highlight ? "text-amber-400" : isDark ? "text-white/80" : "text-gray-700"}`}>{f.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Activité ────────────────────────────────────────────────────────────

function ActiviteTab({ movements, isDark }: { movements: Movement[]; isDark: boolean }) {
  if (movements.length === 0) return (
    <div className="flex flex-col items-center gap-3 py-16">
      <Clock size={28} className={isDark ? "text-white/20" : "text-gray-300"}/>
      <p className={`text-sm ${isDark ? "text-white/30" : "text-gray-400"}`}>Aucune activité</p>
    </div>
  );
  // Timeline view
  return (
    <div className="p-5 space-y-3 max-w-xl">
      {movements.slice(0, 50).map((m, i) => {
        const mt = MOV_TYPES.find(t => t.value === m.type) ?? MOV_TYPES[0];
        return (
          <div key={m.id} className="flex gap-3">
            <div className="flex flex-col items-center gap-1">
              <div className="h-7 w-7 flex items-center justify-center rounded-xl shrink-0" style={{ background: mt.color + "18" }}>
                {mt.sign > 0 ? <ArrowUpCircle size={12} style={{ color: mt.color }}/> : mt.sign < 0 ? <ArrowDownCircle size={12} style={{ color: mt.color }}/> : <RotateCcw size={12} style={{ color: mt.color }}/>}
              </div>
              {i < movements.length - 1 && <div className={`w-px flex-1 min-h-[8px] ${isDark ? "bg-white/[0.05]" : "bg-gray-100"}`}/>}
            </div>
            <div className="pb-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${isDark ? "text-white/80" : "text-gray-700"}`}>{mt.label}</span>
                <span className="text-xs font-bold" style={{ color: mt.color }}>{mt.sign > 0 ? "+" : mt.sign < 0 ? "-" : "±"}{m.quantity}</span>
                <span className={`text-[10px] ${isDark ? "text-white/25" : "text-gray-400"}`}>{m.before_qty} → {m.after_qty}</span>
              </div>
              <p className={`text-[10px] mt-0.5 ${isDark ? "text-white/30" : "text-gray-400"}`}>
                {fmtDate(m.date)}{m.reason && ` · ${m.reason}`}{m.reference && ` · ${m.reference}`}
              </p>
            </div>
          </div>
        );
      })}
      {movements.length > 50 && (
        <div className="flex items-center gap-2 text-xs text-amber-400">
          <AlertOctagon size={11}/> {movements.length - 50} mouvements supplémentaires non affichés
        </div>
      )}
    </div>
  );
}
