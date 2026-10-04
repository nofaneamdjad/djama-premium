"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart2, CalendarClock, Calculator,
  AlertOctagon, Activity, RefreshCw, Zap, Package, AlertTriangle,
} from "lucide-react";
import type { Product, Movement } from "./types";
import { gold, green, getStockState } from "./constants";
import { useDark } from "./ui";
import { fmtEur } from "@/lib/format";
import { useToastStack } from "@/components/ui/ToastStack";

// ─── Prévisions sub-view ─────────────────────────────────────────────────────

function PrevisionsSubView({ products, movements }: { products: Product[]; movements: Movement[] }) {
  const now = Date.now();
  const thirtyAgo = now - 30 * 86_400_000;

  const rows = products.filter(p => p.is_active).map(product => {
    const out30 = movements
      .filter(m => m.product_id === product.id && ["sortie","perte","casse"].includes(m.type) && new Date(m.date).getTime() >= thirtyAgo)
      .reduce((s, m) => s + m.quantity, 0);
    const avgDaily = out30 / 30;
    const daysLeft = avgDaily > 0 ? Math.floor(product.stock_current / avgDaily) : null;
    return { product, out30, avgDaily, daysLeft };
  }).sort((a, b) => {
    if (a.daysLeft === null && b.daysLeft === null) return 0;
    if (a.daysLeft === null) return 1;
    if (b.daysLeft === null) return -1;
    return a.daysLeft - b.daysLeft;
  });

  const urgent = rows.filter(r => r.daysLeft !== null && r.daysLeft <= 14);
  const isDark = useDark();

  return (
    <div className="space-y-4">
      {urgent.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertTriangle size={14} className="text-red-400 shrink-0"/>
          <p className={`text-sm ${isDark ? "text-white/70" : "text-gray-600"}`}>
            <span className="font-bold text-red-400">{urgent.length} produit{urgent.length > 1 ? "s" : ""}</span> en rupture prévue dans moins de 14 jours.
          </p>
        </div>
      )}

      <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
        <div className={`grid grid-cols-12 gap-2 px-4 py-2.5 border-b text-[10px] font-semibold uppercase tracking-wider ${isDark ? "border-white/[0.06] text-white/30" : "border-gray-200 text-gray-400"}`}>
          <span className="col-span-4">Produit</span>
          <span className="col-span-2 text-right">Stock</span>
          <span className="col-span-2 text-right">Sorties /30j</span>
          <span className="col-span-2 text-right">Conso /j</span>
          <span className="col-span-2 text-right">Jours restants</span>
        </div>
        {rows.length === 0 ? (
          <p className={`text-center text-sm py-10 ${isDark ? "text-white/25" : "text-gray-400"}`}>Aucun produit actif</p>
        ) : rows.map(({ product, out30, avgDaily, daysLeft }) => {
          const isUrgent = daysLeft !== null && daysLeft <= 7;
          const isWarn   = daysLeft !== null && daysLeft > 7 && daysLeft <= 30;
          const daysColor = isUrgent ? "#ef4444" : isWarn ? "#f59e0b" : "#10b981";
          const daysLabel = daysLeft === null ? "Stable" : daysLeft === 0 ? "Rupture" : `${daysLeft}j`;
          return (
            <motion.div key={product.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`grid grid-cols-12 gap-2 items-center px-4 py-3 border-b last:border-0 transition-colors ${isDark ? "border-white/[0.03] hover:bg-white/[0.02]" : "border-gray-100 hover:bg-gray-50"}`}>
              <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                <div className={`h-7 w-7 shrink-0 flex items-center justify-center rounded-lg overflow-hidden ${isDark ? "bg-white/[0.05]" : "bg-gray-100"}`}>
                  {product.image_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={product.image_url} alt="" className="h-full w-full object-cover"/>
                    : <Package size={12} className={isDark ? "text-white/40" : "text-gray-400"}/>}
                </div>
                <span className={`text-sm truncate ${isDark ? "text-white/80" : "text-gray-700"}`}>{product.name}</span>
              </div>
              <div className="col-span-2 text-right">
                <span className={`text-sm font-semibold ${isDark ? "text-white/70" : "text-gray-600"}`}>{product.stock_current}</span>
                <span className={`text-[10px] ml-1 ${isDark ? "text-white/30" : "text-gray-400"}`}>{product.unit}</span>
              </div>
              <div className="col-span-2 text-right">
                <span className={`text-sm ${isDark ? "text-white/60" : "text-gray-500"}`}>{out30 > 0 ? out30.toFixed(1) : "—"}</span>
              </div>
              <div className="col-span-2 text-right">
                <span className={`text-sm ${isDark ? "text-white/60" : "text-gray-500"}`}>{avgDaily > 0 ? avgDaily.toFixed(2) : "—"}</span>
              </div>
              <div className="col-span-2 text-right">
                <span className="text-sm font-bold" style={{ color: daysColor }}>{daysLabel}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
      <p className={`text-[10px] text-center ${isDark ? "text-white/25" : "text-gray-400"}`}>Basé sur les sorties des 30 derniers jours · Estimations indicatives</p>
    </div>
  );
}

// ─── Valorisation sub-view ───────────────────────────────────────────────────

function ValuationSubView({ products, movements }: { products: Product[]; movements: Movement[] }) {
  const [method, setMethod] = useState<"cmup" | "fifo" | "lifo">("cmup");

  const rows = products.filter(p => p.is_active && p.stock_current > 0).map(product => {
    const entries = movements.filter(m =>
      m.product_id === product.id &&
      (m.type === "entree" || m.type === "retour") &&
      m.unit_cost > 0
    ).sort((a, b) => a.date.localeCompare(b.date));

    const totalQty  = entries.reduce((s, m) => s + m.quantity, 0);
    const totalCost = entries.reduce((s, m) => s + m.quantity * m.unit_cost, 0);
    const cmupUnit  = totalQty > 0 ? totalCost / totalQty : product.purchase_price;

    // FIFO: oldest out first → remaining stock = newest entries
    let rem = product.stock_current;
    let fifoValue = 0;
    for (const e of [...entries].reverse()) {
      if (rem <= 0) break;
      const used = Math.min(rem, e.quantity);
      fifoValue += used * e.unit_cost;
      rem -= used;
    }
    if (rem > 0) fifoValue += rem * cmupUnit;

    // LIFO: newest out first → remaining stock = oldest entries
    rem = product.stock_current;
    let lifoValue = 0;
    for (const e of entries) {
      if (rem <= 0) break;
      const used = Math.min(rem, e.quantity);
      lifoValue += used * e.unit_cost;
      rem -= used;
    }
    if (rem > 0) lifoValue += rem * cmupUnit;

    const cmupValue     = product.stock_current * cmupUnit;
    const purchaseValue = product.stock_current * product.purchase_price;

    return { product, cmupUnit, cmupValue, fifoValue, lifoValue, purchaseValue };
  });

  const selVal = (r: typeof rows[0]) =>
    method === "cmup" ? r.cmupValue : method === "fifo" ? r.fifoValue : r.lifoValue;
  const totalSel = rows.reduce((s, r) => s + selVal(r), 0);
  const totalPur = rows.reduce((s, r) => s + r.purchaseValue, 0);
  const diff     = totalSel - totalPur;

  const isDark = useDark();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {(["cmup", "fifo", "lifo"] as const).map(m => (
          <button key={m} onClick={() => setMethod(m)}
            className="px-4 py-1.5 rounded-xl text-xs font-bold border transition-all"
            style={method === m
              ? { background: gold + "20", color: gold, border: `1px solid ${gold}40` }
              : isDark
                ? { border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.35)" }
                : { border: "1px solid #e5e7eb", color: "#6b7280" }}>
            {m.toUpperCase()}
          </button>
        ))}
        <div className="ml-auto text-right">
          <p className={`text-[10px] ${isDark ? "text-white/40" : "text-gray-400"}`}>Valeur totale ({method.toUpperCase()})</p>
          <p className="text-lg font-bold" style={{ color: gold }}>{fmtEur(totalSel)}</p>
        </div>
      </div>

      {/* LIFO illégal en France — PCG Art. 214-23 */}
      {method === "lifo" && (
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs border border-red-500/20 bg-red-500/8 text-red-400">
          <AlertTriangle size={12}/>
          <span>LIFO interdit en comptabilité française (PCG Art. 214-23). Valeur affichée à titre indicatif uniquement — ne pas utiliser dans vos bilans.</span>
        </div>
      )}

      <div className="flex items-center gap-3 rounded-xl px-4 py-2.5"
        style={{ background: diff >= 0 ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)", border: `1px solid ${diff >= 0 ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}` }}>
        <span className={`text-xs ${isDark ? "text-white/50" : "text-gray-500"}`}>vs. prix d&apos;achat ({fmtEur(totalPur)}) :</span>
        <span className="text-sm font-bold ml-auto" style={{ color: diff >= 0 ? green : "#ef4444" }}>
          {diff >= 0 ? "+" : ""}{fmtEur(diff)}{totalPur > 0 ? ` (${((diff / totalPur) * 100).toFixed(1)}%)` : ""}
        </span>
      </div>

      <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
        <div className={`grid grid-cols-12 gap-2 px-4 py-2.5 border-b text-[10px] font-semibold uppercase tracking-wider ${isDark ? "border-white/[0.06] text-white/30" : "border-gray-200 text-gray-400"}`}>
          <span className="col-span-4">Produit</span>
          <span className="col-span-2 text-right">Stock</span>
          <span className="col-span-2 text-right">P. achat</span>
          <span className="col-span-2 text-right">CMUP</span>
          <span className="col-span-2 text-right">Valeur {method.toUpperCase()}</span>
        </div>
        {rows.length === 0 ? (
          <p className={`text-center text-sm py-10 ${isDark ? "text-white/25" : "text-gray-400"}`}>Ajoutez des mouvements avec coût unitaire pour activer la valorisation</p>
        ) : rows.map(r => (
          <div key={r.product.id} className={`grid grid-cols-12 gap-2 items-center px-4 py-3 border-b last:border-0 transition-colors ${isDark ? "border-white/[0.03] hover:bg-white/[0.02]" : "border-gray-100 hover:bg-gray-50"}`}>
            <div className="col-span-4 min-w-0">
              <p className={`text-sm truncate ${isDark ? "text-white/80" : "text-gray-700"}`}>{r.product.name}</p>
              <p className={`text-[10px] ${isDark ? "text-white/30" : "text-gray-400"}`}>{r.product.sku || r.product.category}</p>
            </div>
            <div className={`col-span-2 text-right text-sm ${isDark ? "text-white/60" : "text-gray-500"}`}>{r.product.stock_current} <span className={`text-[10px] ${isDark ? "text-white/30" : "text-gray-400"}`}>{r.product.unit}</span></div>
            <div className={`col-span-2 text-right text-sm ${isDark ? "text-white/50" : "text-gray-400"}`}>{fmtEur(r.product.purchase_price)}</div>
            <div className={`col-span-2 text-right text-sm ${isDark ? "text-white/70" : "text-gray-600"}`}>{fmtEur(r.cmupUnit)}</div>
            <div className="col-span-2 text-right">
              <span className="text-sm font-bold" style={{ color: gold }}>{fmtEur(selVal(r))}</span>
            </div>
          </div>
        ))}
      </div>
      <p className={`text-[10px] text-center ${isDark ? "text-white/25" : "text-gray-400"}`}>
        CMUP = Coût Moyen Unitaire Pondéré · FIFO = Premier entré, premier sorti · LIFO = Dernier entré, premier sorti
      </p>
    </div>
  );
}

// ─── Report view ─────────────────────────────────────────────────────────────

export function ReportView({ products, movements }: { products: Product[]; movements: Movement[] }) {
  const { add: toast } = useToastStack();
  const [subView, setSubView] = useState<"inventaire" | "previsions" | "valorisation">("inventaire");
  const [rapport, setRapport]               = useState<{ score_sante: number; resume_executif: string; points_forts: string[]; alertes: string[]; recommandations: string[]; produits_prioritaires: { nom: string; sku: string; etat: string; action: string }[]; objectif_semaine: string } | null>(null);
  const [rapportLoading, setRapportLoading] = useState(false);
  const [rapportOpen, setRapportOpen]       = useState(false);

  const totalProducts   = products.filter(p => p.is_active).length;
  const totalValue      = products.reduce((s, p) => s + p.stock_current * p.purchase_price, 0);
  const totalSaleValue  = products.reduce((s, p) => s + p.stock_current * p.sale_price, 0);
  const potentialMargin = totalSaleValue - totalValue;
  const marginRate      = totalValue > 0 ? Math.round((potentialMargin / totalValue) * 100) : 0;
  const outOfStock      = products.filter(p => p.stock_current <= 0).length;
  const lowStock        = products.filter(p => p.stock_current > 0 && p.stock_minimum > 0 && p.stock_current <= p.stock_minimum).length;
  const criticalStock   = products.filter(p => p.stock_current > 0 && p.stock_minimum > 0 && p.stock_current <= p.stock_minimum * 0.5).length;

  const totalIn  = movements.filter(m => m.type === "entree" || m.type === "retour").reduce((s, m) => s + m.quantity, 0);
  const totalOut = movements.filter(m => m.type === "sortie" || m.type === "perte" || m.type === "casse").reduce((s, m) => s + m.quantity, 0);

  const cats = [...new Set(products.map(p => p.category))];
  const catStats = cats.map(cat => {
    const catProds = products.filter(p => p.category === cat);
    const val = catProds.reduce((s, p) => s + p.stock_current * p.purchase_price, 0);
    return { cat, count: catProds.length, val };
  }).sort((a, b) => b.val - a.val);
  const totalCatVal = catStats.reduce((s, c) => s + c.val, 0);

  async function runRapportIA() {
    setRapportLoading(true);
    setRapportOpen(false);
    try {
      const ruptures = products.filter(p => p.stock_current <= 0).slice(0, 10)
        .map(p => ({ name: p.name, sku: p.sku ?? "", supplier: p.supplier_name ?? "" }));
      const alertsStock = products
        .filter(p => p.stock_current > 0 && p.stock_minimum > 0 && p.stock_current <= p.stock_minimum)
        .sort((a, b) => (a.stock_current / Math.max(a.stock_minimum, 1)) - (b.stock_current / Math.max(b.stock_minimum, 1)))
        .slice(0, 10)
        .map(p => ({ name: p.name, sku: p.sku ?? "", current: p.stock_current, minimum: p.stock_minimum, state: getStockState(p) }));

      const res = await fetch("/api/stocks-rapport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalProducts, outOfStock, lowStock, criticalStock,
          totalValue, totalSaleValue, potentialMargin, marginRate,
          totalIn, totalOut,
          topCategories: catStats.slice(0, 6).map(c => ({ cat: c.cat, count: c.count, val: c.val })),
          ruptures,
          alertsStock,
        }),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      const data = await res.json() as typeof rapport;
      setRapport(data);
      setRapportOpen(true);
    } catch {
      toast("Erreur lors de l'analyse IA — réessayez dans quelques instants.", "error");
    } finally {
      setRapportLoading(false);
    }
  }

  const score      = rapport?.score_sante ?? 0;
  const R          = 28;
  const circ       = 2 * Math.PI * R;
  const dashOffset = circ * (1 - score / 100);
  const scoreColor = score >= 70 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444";

  const kpis = [
    { label: "Produits actifs",    value: totalProducts,           sub: `${outOfStock} ruptures · ${lowStock} faibles` },
    { label: "Valeur stock achat", value: fmtEur(totalValue),     sub: "Prix de revient total" },
    { label: "Valeur stock vente", value: fmtEur(totalSaleValue),  sub: "Prix de vente total" },
    { label: "Marge potentielle",  value: fmtEur(potentialMargin), sub: `${marginRate}% sur le coût` },
    { label: "Total entrées",      value: totalIn,                 sub: "Toutes périodes" },
    { label: "Total sorties",      value: totalOut,                sub: "Toutes périodes" },
  ];

  const isDark = useDark();

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">

      {/* Sub-view tabs */}
      <div className="flex items-center gap-1 p-1 rounded-2xl w-fit" style={isDark ? { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" } : { background: "#f3f4f6", border: "1px solid #e5e7eb" }}>
        {([
          { key: "inventaire",   label: "Inventaire",   icon: BarChart2 },
          { key: "previsions",   label: "Prévisions",   icon: CalendarClock },
          { key: "valorisation", label: "Valorisation", icon: Calculator },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setSubView(key)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-xl transition-all"
            style={subView === key
              ? { background: gold + "20", color: gold }
              : isDark ? { color: "rgba(255,255,255,0.35)" } : { color: "#6b7280" }}>
            <Icon size={11}/> {label}
          </button>
        ))}
      </div>

      {subView === "previsions"   && <PrevisionsSubView products={products} movements={movements}/>}
      {subView === "valorisation" && <ValuationSubView  products={products} movements={movements}/>}

      {subView === "inventaire" && <>

        <div className="flex items-center justify-between">
          <p className={`text-xs font-black uppercase tracking-widest ${isDark ? "text-white/30" : "text-gray-400"}`}>Rapport inventaire</p>
          <button onClick={runRapportIA} disabled={rapportLoading}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-60 hover:brightness-110 active:scale-95"
            style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
            {rapportLoading ? <RefreshCw size={11} className="animate-spin"/> : <Zap size={11}/>}
            {rapportLoading ? "Analyse…" : "Analyse IA"}
          </button>
        </div>

        <AnimatePresence>
          {rapportOpen && rapport && (
            <motion.div key="rapport-ia" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl p-5 space-y-5"
              style={{ background: "linear-gradient(135deg,rgba(201,165,90,0.07),rgba(201,165,90,0.03))", border: "1px solid rgba(201,165,90,0.18)" }}>

              {/* Score + résumé */}
              <div className="flex items-start gap-5">
                <div className="shrink-0 flex flex-col items-center gap-1">
                  <svg width={72} height={72} viewBox="0 0 72 72">
                    <circle cx={36} cy={36} r={R} fill="none" stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"} strokeWidth={5}/>
                    <circle cx={36} cy={36} r={R} fill="none" stroke={scoreColor} strokeWidth={5}
                      strokeLinecap="round" strokeDasharray={`${circ}`} strokeDashoffset={dashOffset}
                      transform="rotate(-90 36 36)" style={{ transition: "stroke-dashoffset 0.8s ease" }}/>
                    <text x={36} y={40} textAnchor="middle" fill={scoreColor} fontSize={15} fontWeight={900} fontFamily="inherit">{score}</text>
                  </svg>
                  <p className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? "text-white/30" : "text-gray-400"}`}>Score</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: "#c9a55a" }}>Résumé exécutif</p>
                  <p className={`text-sm leading-relaxed ${isDark ? "text-white/70" : "text-gray-600"}`}>{rapport.resume_executif}</p>
                </div>
              </div>

              {/* Points forts + Alertes */}
              <div className="grid sm:grid-cols-2 gap-4">
                {rapport.points_forts.length > 0 && (
                  <div className="rounded-xl p-4" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-400/70 mb-2.5">Points forts</p>
                    <ul className="space-y-1.5">
                      {rapport.points_forts.map((pt, i) => (
                        <li key={i} className={`flex items-start gap-2 text-sm ${isDark ? "text-white/65" : "text-gray-600"}`}>
                          <span className="mt-1 shrink-0 h-1.5 w-1.5 rounded-full bg-emerald-400"/>
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {rapport.alertes.length > 0 && (
                  <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                    <p className="text-xs font-black uppercase tracking-widest text-red-400/70 mb-2.5">Alertes</p>
                    <ul className="space-y-1.5">
                      {rapport.alertes.map((al, i) => (
                        <li key={i} className={`flex items-start gap-2 text-sm ${isDark ? "text-white/65" : "text-gray-600"}`}>
                          <AlertTriangle size={10} className="mt-0.5 shrink-0 text-red-400"/>
                          {al}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Recommandations */}
              {rapport.recommandations.length > 0 && (
                <div>
                  <p className="text-xs font-black uppercase tracking-widest mb-2.5" style={{ color: "rgba(201,165,90,0.7)" }}>Recommandations</p>
                  <ol className="space-y-2">
                    {rapport.recommandations.map((r, i) => (
                      <li key={i} className={`flex items-start gap-2.5 text-sm ${isDark ? "text-white/65" : "text-gray-600"}`}>
                        <span className="shrink-0 flex h-4 w-4 items-center justify-center rounded-full text-[11px] font-black"
                          style={{ background: "rgba(201,165,90,0.15)", color: "#c9a55a" }}>{i + 1}</span>
                        {r}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Produits prioritaires */}
              {rapport.produits_prioritaires.length > 0 && (
                <div>
                  <p className={`text-xs font-black uppercase tracking-widest mb-2.5 ${isDark ? "text-white/30" : "text-gray-400"}`}>Produits prioritaires</p>
                  <div className="space-y-1.5">
                    {rapport.produits_prioritaires.map((p, i) => {
                      const stateColor = p.etat === "rupture" ? "#ef4444" : p.etat === "critique" ? "#f97316" : "#f59e0b";
                      return (
                        <div key={i} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}>
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="shrink-0 h-6 w-6 rounded-lg flex items-center justify-center"
                              style={{ background: `${stateColor}18`, border: `1px solid ${stateColor}30` }}>
                              <Package size={10} style={{ color: stateColor }}/>
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs font-bold truncate ${isDark ? "text-white/80" : "text-gray-700"}`}>{p.nom}</p>
                              {p.sku && <p className={`text-[11px] ${isDark ? "text-white/30" : "text-gray-400"}`}>{p.sku}</p>}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-black uppercase" style={{ color: stateColor }}>{p.etat}</p>
                            <p className={`text-xs max-w-[120px] text-right leading-snug ${isDark ? "text-white/40" : "text-gray-400"}`}>{p.action}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Objectif semaine */}
              {rapport.objectif_semaine && (
                <div className="flex items-start gap-2.5 rounded-xl px-4 py-3"
                  style={{ background: "rgba(201,165,90,0.08)", border: "1px solid rgba(201,165,90,0.15)" }}>
                  <Activity size={12} className="shrink-0 mt-0.5" style={{ color: "#c9a55a" }}/>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest mb-0.5" style={{ color: "rgba(201,165,90,0.6)" }}>Objectif de la semaine</p>
                    <p className={`text-sm font-semibold ${isDark ? "text-white/70" : "text-gray-600"}`}>{rapport.objectif_semaine}</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {kpis.map((k, i) => (
            <div key={i} className="rounded-2xl p-4"
              style={{ background: isDark ? "rgba(255,255,255,0.035)" : "#ffffff", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}` }}>
              <p className={`text-[10px] uppercase tracking-wider mb-2 ${isDark ? "text-white/30" : "text-gray-400"}`}>{k.label}</p>
              <p className={`text-xl font-bold ${isDark ? "text-white/90" : "text-gray-800"}`}>{k.value}</p>
              <p className={`text-xs mt-1 ${isDark ? "text-white/35" : "text-gray-400"}`}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Valeur par catégorie */}
        {catStats.length > 0 && (
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${isDark ? "text-white/30" : "text-gray-400"}`}>
              <BarChart2 size={12} style={{ color: green }}/> Valeur stock par catégorie
            </h3>
            <div className={`rounded-2xl border p-4 space-y-3 ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
              {catStats.map(({ cat, count, val }) => (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold capitalize ${isDark ? "text-white/70" : "text-gray-600"}`}>{cat}</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] ${isDark ? "text-white/35" : "text-gray-400"}`}>{count} produit{count > 1 ? "s" : ""}</span>
                      <span className={`text-xs font-bold ${isDark ? "text-white/80" : "text-gray-700"}`}>{fmtEur(val)}</span>
                    </div>
                  </div>
                  <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/[0.06]" : "bg-gray-100"}`}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${totalCatVal > 0 ? (val / totalCatVal) * 100 : 0}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full" style={{ background: green }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Produits en rupture */}
        {products.filter(p => p.stock_current <= 0).length > 0 && (
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${isDark ? "text-white/30" : "text-gray-400"}`}>
              <AlertOctagon size={12} className="text-red-400"/> Produits en rupture
            </h3>
            <div className="space-y-1.5">
              {products.filter(p => p.stock_current <= 0).map(p => (
                <div key={p.id} className="flex items-center justify-between bg-red-500/5 border border-red-500/10 rounded-xl px-4 py-2.5">
                  <div>
                    <span className={`text-sm font-semibold ${isDark ? "text-white/80" : "text-gray-700"}`}>{p.name}</span>
                    {p.sku && <span className={`text-xs ml-2 ${isDark ? "text-white/35" : "text-gray-400"}`}>{p.sku}</span>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-red-400">RUPTURE</p>
                    <p className={`text-[10px] ${isDark ? "text-white/30" : "text-gray-400"}`}>{p.supplier_name || "Sans fournisseur"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>}
    </div>
  );
}
