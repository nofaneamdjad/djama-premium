"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Search, X, Plus, Loader2, Check, ChevronDown,
  Package, Globe, Tag, BarChart2, Settings, Users, Layers,
  ShoppingCart, Truck, TrendingUp, Star, Eye, EyeOff, Edit3,
  ExternalLink, Copy, RefreshCw, AlertTriangle, Trash2,
  ToggleLeft, ToggleRight,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { useToastStack, ToastStack } from "@/components/ui/ToastStack";

const GOLD = "#c9a55a";
const ease = [0.16, 1, 0.3, 1] as const;
function fmtCur(n: number) { return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }); }
function fmtDate(s: string) { return new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }); }

/* ── Types ─────────────────────────────────────────────────────────────── */
interface ShopProduct {
  id: string; name: string; sku: string; category: string; type: string;
  image_url: string | null; sale_price: number; compare_price: number | null;
  vat_rate: number; stock_current: number | null; stock_min: number | null;
  sell_online: boolean; sell_pos: boolean; featured: boolean;
  short_description: string; slug: string | null; is_digital: boolean;
  updated_at: string;
}
interface ShopOrder {
  id: string; order_number: string; customer_name: string; customer_email: string;
  total: number; payment_status: string; fulfillment_status: string;
  payment_method: string; promo_code: string; created_at: string;
  internal_note?: string; tracking_number?: string; tracking_url?: string;
  shop_order_items?: { product_name: string; quantity: number; unit_price: number; image_url: string; is_digital: boolean }[];
}
interface Collection {
  id: string; name: string; slug: string; description: string;
  image_url: string; is_active: boolean; created_at: string;
}
interface Promotion {
  id: string; code: string; description: string; type: string;
  value: number; min_order: number | null; max_uses: number | null;
  used_count: number; starts_at: string | null; expires_at: string | null;
  is_active: boolean; created_at: string;
}
interface ShopConfig {
  shop_name: string; shop_description: string; logo_url: string;
  currency: string; currency_symbol: string; tax_rate: number;
  tax_included: boolean; guest_checkout: boolean; is_published: boolean;
  primary_color: string; seo_title: string; seo_description: string;
  subdomain: string; domain: string;
}
interface Kpis { ca: number; orders: number; avg_order: number; total_orders: number; }

type Tab = "accueil" | "produits" | "commandes" | "clients" | "collections" | "promotions" | "boutique" | "analytics" | "parametres";

const NAV: { key: Tab; label: string; icon: React.ComponentType<{ size: number }> }[] = [
  { key: "accueil",     label: "Accueil",    icon: BarChart2    },
  { key: "produits",    label: "Produits",   icon: Package      },
  { key: "commandes",   label: "Commandes",  icon: ShoppingCart },
  { key: "clients",     label: "Clients",    icon: Users        },
  { key: "collections", label: "Collections",icon: Layers       },
  { key: "promotions",  label: "Promotions", icon: Tag          },
  { key: "boutique",    label: "Vitrine",    icon: Globe        },
  { key: "analytics",  label: "Analytics",  icon: TrendingUp   },
  { key: "parametres",  label: "Paramètres", icon: Settings     },
];

const PAYMENT_COLORS: Record<string, string> = {
  pending: "#f59e0b", paid: "#10b981", partial: "#3b82f6",
  refunded: "#6366f1", failed: "#ef4444",
};
const FULFILL_COLORS: Record<string, string> = {
  unfulfilled: "#f59e0b", preparing: "#3b82f6", ready: "#8b5cf6",
  shipped: GOLD, delivered: "#10b981", cancelled: "#ef4444",
};
const PAYMENT_LABELS: Record<string, string> = {
  pending: "En attente", paid: "Payé", partial: "Partiel", refunded: "Remboursé", failed: "Échoué",
};
const FULFILL_LABELS: Record<string, string> = {
  unfulfilled: "À préparer", preparing: "En préparation", ready: "Prêt",
  shipped: "Expédié", delivered: "Livré", cancelled: "Annulé",
};

export default function BoutiquePage() {
  const { isDark } = useTheme();
  const { toasts, add, remove } = useToastStack();

  const [tab, setTab] = useState<Tab>("accueil");

  /* ── Styles tokens ── */
  const bg    = isDark ? "bg-[#07080e]"    : "bg-[#f0f2f5]";
  const card  = isDark ? "border-white/[0.06] bg-white/[0.03]" : "border-black/[0.06] bg-white shadow-sm";
  const inp   = isDark ? "border-white/8 bg-white/4 text-white placeholder-white/25" : "border-black/8 bg-gray-50 text-gray-900 placeholder-gray-400";
  const text  = isDark ? "text-white"         : "text-gray-900";
  const muted = isDark ? "text-white/35"      : "text-gray-400";
  const divider = isDark ? "border-white/6"   : "border-black/8";

  /* ── Dashboard ── */
  const [kpis,     setKpis]     = useState<Kpis>({ ca: 0, orders: 0, avg_order: 0, total_orders: 0 });
  const [recentOrders,    setRecentOrders]    = useState<ShopOrder[]>([]);
  const [lowStock,        setLowStock]        = useState<ShopProduct[]>([]);
  const [bestSellers,     setBestSellers]     = useState<{ name: string; qty: number; ca: number }[]>([]);
  const [ordersToFulfill, setOrdersToFulfill] = useState<ShopOrder[]>([]);
  const [dashPeriod, setDashPeriod] = useState<"today"|"7d"|"30d">("30d");
  const [dashLoad,   setDashLoad]   = useState(false);

  /* ── Produits ── */
  const [products,    setProducts]   = useState<ShopProduct[]>([]);
  const [prodLoad,    setProdLoad]   = useState(false);
  const [prodSearch,  setProdSearch] = useState("");
  const [prodFilter,  setProdFilter] = useState("all");
  const [categories,  setCategories] = useState<string[]>([]);
  const [showProdModal, setShowProdModal] = useState(false);
  const [editProduct,   setEditProduct]   = useState<Partial<ShopProduct> | null>(null);
  const [savingProd,    setSavingProd]    = useState(false);

  /* ── Commandes ── */
  const [orders,       setOrders]      = useState<ShopOrder[]>([]);
  const [orderLoad,    setOrderLoad]   = useState(false);
  const [orderSearch,  setOrderSearch] = useState("");
  const [payFilter,    setPayFilter]   = useState("");
  const [fulfillFilter,setFulfillFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<ShopOrder | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState(false);

  /* ── Collections ── */
  const [collections,   setCollections] = useState<Collection[]>([]);
  const [collLoad,      setCollLoad]    = useState(false);
  const [showCollModal, setShowCollModal] = useState(false);
  const [editColl,      setEditColl]    = useState<Partial<Collection> | null>(null);
  const [savingColl,    setSavingColl]  = useState(false);

  /* ── Promotions ── */
  const [promotions,  setPromotions] = useState<Promotion[]>([]);
  const [promoLoad,   setPromoLoad]  = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [editPromo,   setEditPromo]  = useState<Partial<Promotion> | null>(null);
  const [savingPromo, setSavingPromo] = useState(false);

  /* ── Config boutique ── */
  const [config,      setConfig]    = useState<Partial<ShopConfig>>({});
  const [configLoad,  setConfigLoad] = useState(false);
  const [savingConfig,setSavingConfig] = useState(false);

  /* ── Chargements ── */
  const loadDashboard = useCallback(async () => {
    setDashLoad(true);
    const r = await fetch(`/api/shop/dashboard?period=${dashPeriod}`);
    if (r.ok) {
      const d = await r.json() as { kpis: Kpis; recent_orders: ShopOrder[]; low_stock: ShopProduct[]; best_sellers: { name: string; qty: number; ca: number }[]; orders_to_fulfill: ShopOrder[] };
      setKpis(d.kpis);
      setRecentOrders(d.recent_orders ?? []);
      setLowStock(d.low_stock ?? []);
      setBestSellers(d.best_sellers ?? []);
      setOrdersToFulfill(d.orders_to_fulfill ?? []);
    }
    setDashLoad(false);
  }, [dashPeriod]);

  const loadProducts = useCallback(async () => {
    setProdLoad(true);
    const p = new URLSearchParams();
    if (prodSearch) p.set("q", prodSearch);
    if (prodFilter !== "all") p.set("filter", prodFilter);
    const r = await fetch(`/api/shop/products?${p}&limit=80`);
    if (r.ok) {
      const d = await r.json() as { products: ShopProduct[]; total: number; categories: string[] };
      setProducts(d.products ?? []);
      setCategories(d.categories ?? []);
    }
    setProdLoad(false);
  }, [prodSearch, prodFilter]);

  const loadOrders = useCallback(async () => {
    setOrderLoad(true);
    const p = new URLSearchParams();
    if (orderSearch) p.set("q", orderSearch);
    if (payFilter) p.set("payment", payFilter);
    if (fulfillFilter) p.set("fulfillment", fulfillFilter);
    const r = await fetch(`/api/shop/orders?${p}&limit=60`);
    if (r.ok) setOrders((await r.json() as { orders: ShopOrder[] }).orders ?? []);
    setOrderLoad(false);
  }, [orderSearch, payFilter, fulfillFilter]);

  const loadCollections = useCallback(async () => {
    setCollLoad(true);
    const r = await fetch("/api/shop/collections");
    if (r.ok) setCollections(await r.json() as Collection[]);
    setCollLoad(false);
  }, []);

  const loadPromotions = useCallback(async () => {
    setPromoLoad(true);
    const r = await fetch("/api/shop/promotions");
    if (r.ok) setPromotions(await r.json() as Promotion[]);
    setPromoLoad(false);
  }, []);

  const loadConfig = useCallback(async () => {
    setConfigLoad(true);
    const r = await fetch("/api/shop/config");
    if (r.ok) {
      const d = await r.json() as ShopConfig | null;
      if (d) setConfig(d);
    }
    setConfigLoad(false);
  }, []);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);
  useEffect(() => { if (tab === "produits") void loadProducts(); }, [tab, loadProducts]);
  useEffect(() => { if (tab === "commandes") void loadOrders(); }, [tab, loadOrders]);
  useEffect(() => { if (tab === "collections") void loadCollections(); }, [tab, loadCollections]);
  useEffect(() => { if (tab === "promotions") void loadPromotions(); }, [tab, loadPromotions]);
  useEffect(() => { if (tab === "parametres" || tab === "boutique") void loadConfig(); }, [tab, loadConfig]);

  /* ── Actions produits ── */
  async function toggleOnline(p: ShopProduct) {
    const r = await fetch("/api/shop/products", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, sell_online: !p.sell_online, sell_pos: p.sell_pos, featured: p.featured }),
    });
    if (r.ok) { add(`${p.name} — ${!p.sell_online ? "activé" : "désactivé"} en boutique`, "success"); await loadProducts(); }
  }

  async function saveProduct() {
    if (!editProduct) return;
    setSavingProd(true);
    const r = await fetch("/api/shop/products", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editProduct),
    });
    const d = await r.json() as { error?: string };
    if (!r.ok || d.error) add(d.error ?? "Erreur", "error");
    else { add("Produit enregistré", "success"); setShowProdModal(false); await loadProducts(); }
    setSavingProd(false);
  }

  /* ── Actions commandes ── */
  async function updateOrder(id: string, patch: Record<string, unknown>) {
    setUpdatingOrder(true);
    const r = await fetch("/api/shop/orders", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    if (r.ok) { add("Commande mise à jour", "success"); await loadOrders(); setSelectedOrder(null); }
    else add("Erreur", "error");
    setUpdatingOrder(false);
  }

  /* ── Actions collections ── */
  async function saveCollection() {
    if (!editColl) return;
    setSavingColl(true);
    const r = await fetch("/api/shop/collections", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editColl),
    });
    const d = await r.json() as { error?: string };
    if (!r.ok || d.error) add(d.error ?? "Erreur", "error");
    else { add("Collection enregistrée", "success"); setShowCollModal(false); await loadCollections(); }
    setSavingColl(false);
  }

  async function deleteCollection(id: string) {
    if (!confirm("Supprimer cette collection ?")) return;
    await fetch(`/api/shop/collections?id=${id}`, { method: "DELETE" });
    add("Collection supprimée", "success");
    await loadCollections();
  }

  /* ── Actions promotions ── */
  async function savePromo() {
    if (!editPromo) return;
    setSavingPromo(true);
    const r = await fetch("/api/shop/promotions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editPromo),
    });
    const d = await r.json() as { error?: string };
    if (!r.ok || d.error) add(d.error ?? "Erreur", "error");
    else { add("Promotion enregistrée", "success"); setShowPromoModal(false); await loadPromotions(); }
    setSavingPromo(false);
  }

  async function deletePromo(id: string) {
    await fetch(`/api/shop/promotions?id=${id}`, { method: "DELETE" });
    add("Promotion supprimée", "success");
    await loadPromotions();
  }

  /* ── Sauvegarder config ── */
  async function saveConfig() {
    setSavingConfig(true);
    const r = await fetch("/api/shop/config", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    const d = await r.json() as { error?: string };
    if (!r.ok || d.error) add(d.error ?? "Erreur", "error");
    else add("Configuration enregistrée", "success");
    setSavingConfig(false);
  }

  /* ─────────────────────────── UI ──────────────────────────────────────── */
  return (
    <div className={`flex h-full flex-col overflow-hidden ${bg}`}>
      <ToastStack toasts={toasts} remove={remove} />

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <div className={`shrink-0 flex items-center justify-between border-b px-4 py-3 ${divider}`}
        style={{ background: isDark ? "linear-gradient(160deg,#07080e,#0d1117)" : "#fff" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}30` }}>
            <ShoppingBag size={15} style={{ color: GOLD }} />
          </div>
          <div>
            <h1 className={`text-base font-black ${text}`}>{config.shop_name || "Boutique"}</h1>
            <p className={`text-[0.6rem] ${config.is_published ? "text-emerald-400" : muted}`}>
              {config.is_published ? "En ligne" : "Hors ligne"}
            </p>
          </div>
        </div>
        {config.is_published && (
          <a href="#" className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[0.68rem] font-bold transition hover:opacity-80 ${card} ${muted}`}>
            <ExternalLink size={11} /> Voir la boutique
          </a>
        )}
      </div>

      {/* ══ NAVIGATION SECONDAIRE ═══════════════════════════════════════════ */}
      <div className={`shrink-0 flex gap-0.5 overflow-x-auto scrollbar-none border-b px-3 py-1.5 ${divider}`}
        style={{ background: isDark ? "#07080e" : "#fff" }}>
        {NAV.map(n => {
          const active = tab === n.key;
          return (
            <button key={n.key} onClick={() => setTab(n.key)}
              className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[0.67rem] font-bold transition-all ${active ? "" : `${muted} hover:opacity-70`}`}
              style={active ? { background: `${GOLD}15`, color: GOLD } : {}}>
              <n.icon size={11} />
              {n.label}
            </button>
          );
        })}
      </div>

      {/* ══ CONTENU ════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto">

        {/* ── ACCUEIL (dashboard) ── */}
        {tab === "accueil" && (
          <div className="p-4 space-y-4">
            {/* Période */}
            <div className="flex items-center justify-between">
              <p className={`text-sm font-bold ${text}`}>Vue d&apos;ensemble</p>
              <div className={`flex rounded-xl border p-0.5 ${card}`}>
                {(["today","7d","30d"] as const).map(p => (
                  <button key={p} onClick={() => setDashPeriod(p)}
                    className={`rounded-lg px-3 py-1 text-[0.65rem] font-bold transition-all ${dashPeriod === p ? "" : `${muted} hover:opacity-70`}`}
                    style={dashPeriod === p ? { background: `${GOLD}15`, color: GOLD } : {}}>
                    {p === "today" ? "Auj." : p}
                  </button>
                ))}
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Chiffre d'affaires", value: fmtCur(kpis.ca), color: "#10b981", icon: TrendingUp },
                { label: "Commandes payées",   value: kpis.orders,     color: GOLD,      icon: ShoppingCart },
                { label: "Panier moyen",       value: fmtCur(kpis.avg_order), color: "#3b82f6", icon: BarChart2 },
                { label: "Total commandes",    value: kpis.total_orders, color: "#8b5cf6", icon: Package },
              ].map(k => (
                <div key={k.label} className={`rounded-2xl border p-4 ${card}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className={`text-[0.6rem] ${muted}`}>{k.label}</p>
                    <k.icon size={13} style={{ color: k.color, opacity: 0.6 }} />
                  </div>
                  <p className="text-xl font-black tabular-nums" style={{ color: k.color }}>{k.value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Commandes récentes */}
              <div className={`rounded-2xl border ${card}`}>
                <div className={`flex items-center justify-between border-b px-4 py-3 ${divider}`}>
                  <p className={`text-xs font-bold ${text}`}>Commandes récentes</p>
                  <button onClick={() => setTab("commandes")} className={`text-[0.62rem] font-semibold ${muted} hover:opacity-70`}>
                    Voir tout
                  </button>
                </div>
                {dashLoad ? (
                  <div className="flex justify-center py-8"><Loader2 size={18} className={`animate-spin ${muted}`} /></div>
                ) : recentOrders.length === 0 ? (
                  <p className={`py-8 text-center text-xs ${muted}`}>Aucune commande</p>
                ) : (
                  <div className="divide-y" style={{ borderColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)" }}>
                    {recentOrders.map(o => (
                      <div key={o.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold truncate ${text}`}>{o.customer_name || o.customer_email}</p>
                          <p className={`text-[0.6rem] ${muted}`}>{o.order_number} · {fmtDate(o.created_at)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-black tabular-nums" style={{ color: GOLD }}>{fmtCur(o.total)}</p>
                          <span className="text-[0.58rem] font-semibold rounded-full px-1.5 py-0.5"
                            style={{ background: `${PAYMENT_COLORS[o.payment_status]}15`, color: PAYMENT_COLORS[o.payment_status] }}>
                            {PAYMENT_LABELS[o.payment_status]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* À préparer */}
              <div className={`rounded-2xl border ${card}`}>
                <div className={`flex items-center justify-between border-b px-4 py-3 ${divider}`}>
                  <p className={`text-xs font-bold ${text}`}>À préparer</p>
                  <span className="rounded-full px-2 py-0.5 text-[0.6rem] font-bold text-black" style={{ background: GOLD }}>
                    {ordersToFulfill.length}
                  </span>
                </div>
                {ordersToFulfill.length === 0 ? (
                  <p className={`py-8 text-center text-xs ${muted}`}>Aucune commande en attente</p>
                ) : (
                  <div className="divide-y" style={{ borderColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)" }}>
                    {ordersToFulfill.map(o => (
                      <div key={o.id} className="flex items-center gap-3 px-4 py-3">
                        <AlertTriangle size={13} className="shrink-0 text-amber-500" />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold truncate ${text}`}>{o.order_number}</p>
                          <p className={`text-[0.6rem] ${muted}`}>{o.customer_name}</p>
                        </div>
                        <p className="text-xs font-bold tabular-nums" style={{ color: GOLD }}>{fmtCur(o.total)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Stock faible + meilleures ventes */}
            {(lowStock.length > 0 || bestSellers.length > 0) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {lowStock.length > 0 && (
                  <div className={`rounded-2xl border ${card}`}>
                    <div className={`flex items-center gap-2 border-b px-4 py-3 ${divider}`}>
                      <AlertTriangle size={13} className="text-amber-500" />
                      <p className={`text-xs font-bold ${text}`}>Stock faible</p>
                    </div>
                    <div className="p-3 space-y-2">
                      {lowStock.map(p => (
                        <div key={p.id} className="flex items-center justify-between">
                          <p className={`text-xs ${text}`}>{p.name}</p>
                          <span className="text-[0.65rem] font-bold text-amber-500">{p.stock_current ?? 0} restant</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {bestSellers.length > 0 && (
                  <div className={`rounded-2xl border ${card}`}>
                    <div className={`flex items-center gap-2 border-b px-4 py-3 ${divider}`}>
                      <Star size={13} style={{ color: GOLD }} />
                      <p className={`text-xs font-bold ${text}`}>Meilleures ventes</p>
                    </div>
                    <div className="p-3 space-y-2">
                      {bestSellers.map((b, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <p className={`text-xs ${text} truncate`}>{b.name}</p>
                          <p className="text-xs font-bold tabular-nums" style={{ color: GOLD }}>{fmtCur(b.ca)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── PRODUITS ── */}
        {tab === "produits" && (
          <div className="flex flex-col h-full">
            <div className={`shrink-0 border-b px-4 py-3 space-y-2 ${divider}`}>
              <div className="flex items-center gap-2">
                <div className={`flex flex-1 items-center gap-2 rounded-xl border px-3 py-2 ${card}`}>
                  <Search size={12} className={muted} />
                  <input value={prodSearch} onChange={e => setProdSearch(e.target.value)}
                    placeholder="Rechercher produit, SKU…"
                    className={`flex-1 bg-transparent text-sm outline-none ${text}`} />
                  {prodSearch && <button onClick={() => setProdSearch("")}><X size={11} className={muted} /></button>}
                </div>
                <button onClick={() => { setEditProduct({ sell_online: true, sell_pos: false, featured: false }); setShowProdModal(true); }}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[0.7rem] font-black transition hover:brightness-105"
                  style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                  <Plus size={13} /> Produit
                </button>
              </div>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                {["all","online","pos","draft"].map(f => (
                  <button key={f} onClick={() => setProdFilter(f)}
                    className={`shrink-0 rounded-xl border px-3 py-1 text-[0.65rem] font-bold transition ${prodFilter === f ? "" : `${card} ${muted}`}`}
                    style={prodFilter === f ? { background: `${GOLD}15`, borderColor: `${GOLD}30`, color: GOLD } : {}}>
                    {f === "all" ? "Tous" : f === "online" ? "En ligne" : f === "pos" ? "Caisse" : "Hors ligne"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {prodLoad ? (
                <div className="flex justify-center py-12"><Loader2 size={20} className={`animate-spin ${muted}`} /></div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16">
                  <Package size={28} className={muted} />
                  <p className={`text-sm ${muted}`}>Aucun produit</p>
                  <button onClick={() => { setEditProduct({ sell_online: true }); setShowProdModal(true); }}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold"
                    style={{ background: `${GOLD}15`, color: GOLD }}>
                    <Plus size={13} /> Ajouter un produit
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {products.map(p => (
                    <div key={p.id} className={`flex items-center gap-3 rounded-2xl border p-3 ${card}`}>
                      <div className={`h-12 w-12 shrink-0 overflow-hidden rounded-xl ${isDark ? "bg-white/8" : "bg-gray-100"}`}>
                        {p.image_url
                          ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                          : <div className="flex h-full w-full items-center justify-center"><Package size={18} className={muted} /></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-bold truncate ${text}`}>{p.name}</p>
                          {p.featured && <Star size={11} style={{ color: GOLD }} />}
                          {p.is_digital && <span className={`text-[0.58rem] font-bold rounded-full px-1.5 py-0.5 ${isDark ? "bg-blue-500/15 text-blue-400" : "bg-blue-50 text-blue-600"}`}>Numérique</span>}
                        </div>
                        <p className={`text-[0.62rem] ${muted}`}>{p.sku || p.category || "—"}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {p.sell_online && <span className="text-[0.58rem] font-bold text-emerald-400">En ligne</span>}
                          {p.sell_pos    && <span className="text-[0.58rem] font-bold text-blue-400">Caisse</span>}
                          {p.stock_current !== null && (
                            <span className={`text-[0.58rem] font-bold ${p.stock_current <= 0 ? "text-red-400" : p.stock_min !== null && p.stock_current <= p.stock_min ? "text-amber-400" : muted}`}>
                              {p.stock_current} en stock
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-black tabular-nums" style={{ color: GOLD }}>{fmtCur(p.sale_price)}</p>
                        {p.compare_price && p.compare_price > p.sale_price && (
                          <p className={`text-[0.6rem] line-through ${muted}`}>{fmtCur(p.compare_price)}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => void toggleOnline(p)} title={p.sell_online ? "Désactiver boutique" : "Activer boutique"}
                          className={`flex h-7 w-7 items-center justify-center rounded-xl border transition ${p.sell_online ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : `${card} ${muted}`}`}>
                          {p.sell_online ? <Eye size={11} /> : <EyeOff size={11} />}
                        </button>
                        <button onClick={() => { setEditProduct(p); setShowProdModal(true); }}
                          className={`flex h-7 w-7 items-center justify-center rounded-xl border ${card} ${muted} hover:opacity-80`}>
                          <Edit3 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── COMMANDES ── */}
        {tab === "commandes" && (
          <div className="flex flex-col h-full">
            <div className={`shrink-0 border-b px-4 py-3 space-y-2 ${divider}`}>
              <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${card}`}>
                <Search size={12} className={muted} />
                <input value={orderSearch} onChange={e => setOrderSearch(e.target.value)}
                  placeholder="Numéro, client, email…"
                  className={`flex-1 bg-transparent text-sm outline-none ${text}`} />
                {orderSearch && <button onClick={() => setOrderSearch("")}><X size={11} className={muted} /></button>}
              </div>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                <button onClick={() => setPayFilter("")}
                  className={`shrink-0 rounded-xl border px-3 py-1 text-[0.65rem] font-bold transition ${!payFilter ? "" : `${card} ${muted}`}`}
                  style={!payFilter ? { background: `${GOLD}15`, borderColor: `${GOLD}30`, color: GOLD } : {}}>Tout</button>
                {Object.entries(PAYMENT_LABELS).map(([k, v]) => (
                  <button key={k} onClick={() => setPayFilter(payFilter === k ? "" : k)}
                    className={`shrink-0 rounded-xl border px-3 py-1 text-[0.65rem] font-bold transition ${payFilter === k ? "" : `${card} ${muted}`}`}
                    style={payFilter === k ? { background: `${PAYMENT_COLORS[k]}15`, borderColor: `${PAYMENT_COLORS[k]}30`, color: PAYMENT_COLORS[k] } : {}}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {orderLoad ? (
                <div className="flex justify-center py-12"><Loader2 size={20} className={`animate-spin ${muted}`} /></div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16">
                  <ShoppingCart size={28} className={muted} />
                  <p className={`text-sm ${muted}`}>Aucune commande</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {orders.map(o => (
                    <button key={o.id} onClick={() => setSelectedOrder(o)}
                      className={`w-full flex items-center gap-3 rounded-2xl border p-4 text-left transition hover:brightness-105 ${card}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-bold ${text}`}>{o.order_number}</p>
                          <span className="text-[0.58rem] font-bold rounded-full px-1.5 py-0.5"
                            style={{ background: `${PAYMENT_COLORS[o.payment_status]}15`, color: PAYMENT_COLORS[o.payment_status] }}>
                            {PAYMENT_LABELS[o.payment_status]}
                          </span>
                          <span className="text-[0.58rem] font-bold rounded-full px-1.5 py-0.5"
                            style={{ background: `${FULFILL_COLORS[o.fulfillment_status]}15`, color: FULFILL_COLORS[o.fulfillment_status] }}>
                            {FULFILL_LABELS[o.fulfillment_status]}
                          </span>
                        </div>
                        <p className={`text-[0.65rem] ${muted}`}>{o.customer_name || o.customer_email} · {fmtDate(o.created_at)}</p>
                        <p className={`text-[0.6rem] ${muted}`}>{(o.shop_order_items ?? []).length} article(s)</p>
                      </div>
                      <p className="text-sm font-black tabular-nums shrink-0" style={{ color: GOLD }}>{fmtCur(o.total)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CLIENTS ── */}
        {tab === "clients" && (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
            <Users size={32} className={muted} />
            <p className={`text-sm font-bold ${text}`}>Clients connectés au CRM</p>
            <p className={`text-xs text-center max-w-xs ${muted}`}>
              Les clients de votre boutique sont gérés dans le CRM DJAMA. Chaque commande rattache automatiquement le client à son contact CRM.
            </p>
            <a href="/client/crm" className="rounded-2xl px-4 py-2 text-sm font-bold transition hover:brightness-105"
              style={{ background: `${GOLD}15`, color: GOLD }}>
              Ouvrir le CRM
            </a>
          </div>
        )}

        {/* ── COLLECTIONS ── */}
        {tab === "collections" && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className={`text-sm font-bold ${text}`}>{collections.length} collection(s)</p>
              <button onClick={() => { setEditColl({ is_active: true }); setShowCollModal(true); }}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[0.7rem] font-black transition hover:brightness-105"
                style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                <Plus size={13} /> Collection
              </button>
            </div>
            {collLoad ? (
              <div className="flex justify-center py-12"><Loader2 size={20} className={`animate-spin ${muted}`} /></div>
            ) : collections.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <Layers size={28} className={muted} />
                <p className={`text-sm ${muted}`}>Aucune collection</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {collections.map(c => (
                  <div key={c.id} className={`rounded-2xl border p-4 ${card}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-bold ${text}`}>{c.name}</p>
                          <span className={`text-[0.58rem] font-bold rounded-full px-1.5 py-0.5 ${c.is_active ? "text-emerald-400 bg-emerald-500/10" : `${muted} ${isDark ? "bg-white/5" : "bg-gray-100"}`}`}>
                            {c.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className={`text-[0.62rem] ${muted}`}>/{c.slug}</p>
                        {c.description && <p className={`text-xs mt-1 ${muted}`}>{c.description}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => { setEditColl(c); setShowCollModal(true); }}
                          className={`flex h-7 w-7 items-center justify-center rounded-xl border ${card} ${muted}`}>
                          <Edit3 size={11} />
                        </button>
                        <button onClick={() => void deleteCollection(c.id)}
                          className={`flex h-7 w-7 items-center justify-center rounded-xl border ${card} text-red-400/50 hover:text-red-400`}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PROMOTIONS ── */}
        {tab === "promotions" && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className={`text-sm font-bold ${text}`}>{promotions.length} promotion(s)</p>
              <button onClick={() => { setEditPromo({ type: "pct", value: 10, is_active: true }); setShowPromoModal(true); }}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[0.7rem] font-black transition hover:brightness-105"
                style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                <Plus size={13} /> Promotion
              </button>
            </div>
            {promoLoad ? (
              <div className="flex justify-center py-12"><Loader2 size={20} className={`animate-spin ${muted}`} /></div>
            ) : promotions.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <Tag size={28} className={muted} />
                <p className={`text-sm ${muted}`}>Aucune promotion</p>
              </div>
            ) : (
              <div className="space-y-2">
                {promotions.map(p => (
                  <div key={p.id} className={`rounded-2xl border p-4 ${card}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className={`text-sm font-black rounded-lg px-2 py-0.5 ${isDark ? "bg-white/8" : "bg-gray-100"}`} style={{ color: GOLD }}>
                            {p.code}
                          </code>
                          <span className="text-sm font-bold" style={{ color: GOLD }}>
                            {p.type === "pct" ? `${p.value}%` : p.type === "fixed" ? fmtCur(p.value) : "Livraison gratuite"}
                          </span>
                          <span className={`text-[0.58rem] font-bold rounded-full px-1.5 py-0.5 ${p.is_active ? "text-emerald-400 bg-emerald-500/10" : `${muted} ${isDark ? "bg-white/5" : "bg-gray-100"}`}`}>
                            {p.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        {p.description && <p className={`text-xs mt-1 ${muted}`}>{p.description}</p>}
                        <div className={`flex items-center gap-3 mt-1 text-[0.62rem] ${muted}`}>
                          <span>{p.used_count} utilisation(s){p.max_uses ? ` / ${p.max_uses}` : ""}</span>
                          {p.min_order && <span>Minimum {fmtCur(p.min_order)}</span>}
                          {p.expires_at && <span>Expire le {fmtDate(p.expires_at)}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => navigator.clipboard.writeText(p.code).catch(() => null)}
                          className={`flex h-7 w-7 items-center justify-center rounded-xl border ${card} ${muted}`}>
                          <Copy size={11} />
                        </button>
                        <button onClick={() => { setEditPromo(p); setShowPromoModal(true); }}
                          className={`flex h-7 w-7 items-center justify-center rounded-xl border ${card} ${muted}`}>
                          <Edit3 size={11} />
                        </button>
                        <button onClick={() => void deletePromo(p.id)}
                          className={`flex h-7 w-7 items-center justify-center rounded-xl border ${card} text-red-400/50 hover:text-red-400`}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── BOUTIQUE EN LIGNE (vitrine) ── */}
        {tab === "boutique" && (
          <div className="p-4 space-y-4">
            {configLoad ? (
              <div className="flex justify-center py-12"><Loader2 size={20} className={`animate-spin ${muted}`} /></div>
            ) : (
              <>
                {/* Statut publication */}
                <div className={`flex items-center justify-between rounded-2xl border p-4 ${card}`}>
                  <div>
                    <p className={`text-sm font-bold ${text}`}>Statut de la boutique</p>
                    <p className={`text-xs ${config.is_published ? "text-emerald-400" : muted}`}>
                      {config.is_published ? "Votre boutique est en ligne et visible par les clients" : "Votre boutique est hors ligne — visible uniquement par vous"}
                    </p>
                  </div>
                  <button onClick={() => { setConfig(c => ({ ...c, is_published: !c.is_published })); }}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${config.is_published ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : `${card} ${muted}`}`}>
                    {config.is_published ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>

                {/* Domaine */}
                <div className={`rounded-2xl border p-4 space-y-3 ${card}`}>
                  <p className={`text-sm font-bold ${text}`}>Domaine</p>
                  <div>
                    <label className={`block text-[0.65rem] font-semibold mb-1 ${muted}`}>Sous-domaine DJAMA</label>
                    <div className={`flex items-center gap-0 rounded-xl border overflow-hidden ${isDark ? "border-white/8" : "border-black/8"}`}>
                      <input value={config.subdomain ?? ""} onChange={e => setConfig(c => ({ ...c, subdomain: e.target.value }))}
                        placeholder="monentreprise" className={`flex-1 bg-transparent px-3 py-2.5 text-sm outline-none ${text}`} />
                      <span className={`px-3 py-2.5 text-xs font-semibold ${isDark ? "bg-white/5 text-white/40" : "bg-gray-50 text-gray-400"}`}>.djama.space</span>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-[0.65rem] font-semibold mb-1 ${muted}`}>Domaine personnalisé</label>
                    <input value={config.domain ?? ""} onChange={e => setConfig(c => ({ ...c, domain: e.target.value }))}
                      placeholder="www.monentreprise.fr"
                      className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`} />
                    <p className={`mt-1 text-[0.6rem] ${muted}`}>Configuration DNS requise — contacter le support DJAMA.</p>
                  </div>
                </div>

                {/* Apparence */}
                <div className={`rounded-2xl border p-4 space-y-3 ${card}`}>
                  <p className={`text-sm font-bold ${text}`}>Apparence</p>
                  <div>
                    <label className={`block text-[0.65rem] font-semibold mb-1 ${muted}`}>Couleur principale</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={config.primary_color ?? "#c9a55a"} onChange={e => setConfig(c => ({ ...c, primary_color: e.target.value }))}
                        className="h-9 w-14 cursor-pointer rounded-lg border-0 p-0.5" />
                      <input value={config.primary_color ?? ""} onChange={e => setConfig(c => ({ ...c, primary_color: e.target.value }))}
                        className={`flex-1 rounded-xl border px-3 py-2 text-sm outline-none ${inp}`} placeholder="#c9a55a" />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-[0.65rem] font-semibold mb-1 ${muted}`}>URL logo</label>
                    <input value={config.logo_url ?? ""} onChange={e => setConfig(c => ({ ...c, logo_url: e.target.value }))}
                      placeholder="https://…" className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`} />
                  </div>
                </div>

                <button onClick={() => void saveConfig()} disabled={savingConfig}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black disabled:opacity-40 transition hover:brightness-105"
                  style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                  {savingConfig ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Enregistrer
                </button>
              </>
            )}
          </div>
        )}

        {/* ── ANALYTICS ── */}
        {tab === "analytics" && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "CA total",       value: fmtCur(kpis.ca),       delta: "+0%" },
                { label: "Commandes",      value: kpis.orders,           delta: "+0%" },
                { label: "Panier moyen",   value: fmtCur(kpis.avg_order),delta: "+0%" },
                { label: "Total commandes",value: kpis.total_orders,     delta: "+0%" },
              ].map(k => (
                <div key={k.label} className={`rounded-2xl border p-4 ${card}`}>
                  <p className={`text-[0.6rem] mb-1 ${muted}`}>{k.label}</p>
                  <p className="text-xl font-black tabular-nums" style={{ color: GOLD }}>{k.value}</p>
                </div>
              ))}
            </div>
            <div className={`rounded-2xl border p-8 text-center ${card}`}>
              <TrendingUp size={28} className={`mx-auto mb-3 ${muted}`} />
              <p className={`text-sm font-bold ${text}`}>Analytics avancés</p>
              <p className={`text-xs mt-1 ${muted}`}>Graphiques et métriques détaillés disponibles dès que des commandes sont enregistrées.</p>
            </div>
          </div>
        )}

        {/* ── PARAMÈTRES ── */}
        {tab === "parametres" && (
          <div className="p-4 space-y-4">
            {configLoad ? (
              <div className="flex justify-center py-12"><Loader2 size={20} className={`animate-spin ${muted}`} /></div>
            ) : (
              <>
                <div className={`rounded-2xl border p-4 space-y-4 ${card}`}>
                  <p className={`text-sm font-bold ${text}`}>Informations générales</p>
                  {[
                    { key: "shop_name", label: "Nom de la boutique", placeholder: "Ma Boutique" },
                    { key: "shop_description", label: "Description", placeholder: "Bienvenue dans ma boutique…" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className={`block text-[0.65rem] font-semibold mb-1 ${muted}`}>{f.label}</label>
                      <input value={(config as Record<string, string>)[f.key] ?? ""}
                        onChange={e => setConfig(c => ({ ...c, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`} />
                    </div>
                  ))}
                </div>

                <div className={`rounded-2xl border p-4 space-y-4 ${card}`}>
                  <p className={`text-sm font-bold ${text}`}>Taxes & Paiement</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-[0.65rem] font-semibold mb-1 ${muted}`}>Taux TVA par défaut (%)</label>
                      <input type="number" min="0" max="100" value={config.tax_rate ?? 20}
                        onChange={e => setConfig(c => ({ ...c, tax_rate: parseFloat(e.target.value) || 20 }))}
                        className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`} />
                    </div>
                    <div>
                      <label className={`block text-[0.65rem] font-semibold mb-1 ${muted}`}>Devise</label>
                      <select value={config.currency ?? "EUR"} onChange={e => setConfig(c => ({ ...c, currency: e.target.value }))}
                        className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`}>
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                  </div>
                  <div className={`flex items-center justify-between rounded-xl border p-3 ${isDark ? "border-white/8" : "border-black/8"}`}>
                    <div>
                      <p className={`text-xs font-semibold ${text}`}>TVA incluse dans les prix</p>
                      <p className={`text-[0.6rem] ${muted}`}>Les prix affichés incluent la TVA</p>
                    </div>
                    <button onClick={() => setConfig(c => ({ ...c, tax_included: !c.tax_included }))}
                      className="transition">
                      {config.tax_included ? <ToggleRight size={24} style={{ color: GOLD }} /> : <ToggleLeft size={24} className={muted} />}
                    </button>
                  </div>
                  <div className={`flex items-center justify-between rounded-xl border p-3 ${isDark ? "border-white/8" : "border-black/8"}`}>
                    <div>
                      <p className={`text-xs font-semibold ${text}`}>Checkout invité</p>
                      <p className={`text-[0.6rem] ${muted}`}>Commande sans création de compte</p>
                    </div>
                    <button onClick={() => setConfig(c => ({ ...c, guest_checkout: !c.guest_checkout }))} className="transition">
                      {config.guest_checkout ? <ToggleRight size={24} style={{ color: GOLD }} /> : <ToggleLeft size={24} className={muted} />}
                    </button>
                  </div>
                </div>

                <div className={`rounded-2xl border p-4 space-y-4 ${card}`}>
                  <p className={`text-sm font-bold ${text}`}>SEO</p>
                  {[
                    { key: "seo_title", label: "Meta titre", placeholder: "Ma boutique — Produits premium" },
                    { key: "seo_description", label: "Meta description", placeholder: "Découvrez nos produits…" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className={`block text-[0.65rem] font-semibold mb-1 ${muted}`}>{f.label}</label>
                      <input value={(config as Record<string, string>)[f.key] ?? ""}
                        onChange={e => setConfig(c => ({ ...c, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`} />
                    </div>
                  ))}
                </div>

                <button onClick={() => void saveConfig()} disabled={savingConfig}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black disabled:opacity-40 transition hover:brightness-105"
                  style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                  {savingConfig ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Enregistrer les paramètres
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ══ MODAL DÉTAIL COMMANDE ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.22, ease }}
              className={`w-full max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl border ${isDark ? "border-white/8 bg-[#0e1420]" : "border-black/8 bg-white shadow-2xl"}`}>
              <div className={`flex items-center justify-between border-b px-5 py-4 ${divider}`}>
                <div>
                  <p className={`text-sm font-bold ${text}`}>{selectedOrder.order_number}</p>
                  <p className={`text-[0.62rem] ${muted}`}>{selectedOrder.customer_name} · {fmtDate(selectedOrder.created_at)}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)}><X size={16} className={muted} /></button>
              </div>
              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Statuts */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`block text-[0.62rem] font-semibold mb-1 ${muted}`}>Paiement</label>
                    <select defaultValue={selectedOrder.payment_status}
                      onChange={e => void updateOrder(selectedOrder.id, { payment_status: e.target.value })}
                      className={`w-full rounded-xl border px-3 py-2 text-xs outline-none ${inp}`}>
                      {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-[0.62rem] font-semibold mb-1 ${muted}`}>Exécution</label>
                    <select defaultValue={selectedOrder.fulfillment_status}
                      onChange={e => void updateOrder(selectedOrder.id, { fulfillment_status: e.target.value })}
                      className={`w-full rounded-xl border px-3 py-2 text-xs outline-none ${inp}`}>
                      {Object.entries(FULFILL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </div>
                {/* Articles */}
                {(selectedOrder.shop_order_items ?? []).length > 0 && (
                  <div>
                    <p className={`text-[0.65rem] font-semibold mb-2 ${muted}`}>Articles</p>
                    <div className="space-y-2">
                      {(selectedOrder.shop_order_items ?? []).map((item, i) => (
                        <div key={i} className={`flex items-center gap-3 rounded-xl border p-3 ${card}`}>
                          <p className={`flex-1 text-xs ${text}`}>{item.product_name}</p>
                          <p className={`text-[0.65rem] ${muted}`}>×{item.quantity}</p>
                          <p className="text-xs font-bold tabular-nums" style={{ color: GOLD }}>{fmtCur(item.unit_price * item.quantity)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Total */}
                <div className={`flex items-center justify-between border-t pt-3 ${divider}`}>
                  <p className={`text-sm font-bold ${text}`}>Total</p>
                  <p className="text-lg font-black tabular-nums" style={{ color: GOLD }}>{fmtCur(selectedOrder.total)}</p>
                </div>
                {/* Note interne */}
                <div>
                  <label className={`block text-[0.62rem] font-semibold mb-1 ${muted}`}>Note interne</label>
                  <textarea defaultValue={selectedOrder.internal_note ?? ""} rows={2}
                    onBlur={e => void updateOrder(selectedOrder.id, { internal_note: e.target.value })}
                    className={`w-full resize-none rounded-xl border px-3 py-2 text-xs outline-none ${inp}`} />
                </div>
                {/* Suivi */}
                <div>
                  <label className={`block text-[0.62rem] font-semibold mb-1 ${muted}`}>Numéro de suivi</label>
                  <input defaultValue={selectedOrder.tracking_number ?? ""}
                    onBlur={e => void updateOrder(selectedOrder.id, { tracking_number: e.target.value })}
                    className={`w-full rounded-xl border px-3 py-2 text-xs outline-none ${inp}`} placeholder="1Z999AA10123456784" />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ MODAL PRODUIT (e-commerce flags) ════════════════════════════════ */}
      <AnimatePresence>
        {showProdModal && editProduct && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.22, ease }}
              className={`w-full max-w-sm overflow-hidden rounded-t-3xl sm:rounded-3xl border ${isDark ? "border-white/8 bg-[#0e1420]" : "border-black/8 bg-white shadow-2xl"}`}>
              <div className={`flex items-center justify-between border-b px-5 py-4 ${divider}`}>
                <p className={`text-sm font-bold ${text}`}>{editProduct.id ? "Modifier" : "Nouveau produit"}</p>
                <button onClick={() => setShowProdModal(false)}><X size={16} className={muted} /></button>
              </div>
              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {!editProduct.id && (
                  <>
                    <div>
                      <label className={`block text-[0.65rem] font-semibold mb-1 ${muted}`}>Nom *</label>
                      <input value={editProduct.name ?? ""} onChange={e => setEditProduct(p => ({ ...p, name: e.target.value }))}
                        className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`} placeholder="Nom du produit" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-[0.65rem] font-semibold mb-1 ${muted}`}>Prix HT (€)</label>
                        <input type="number" min="0" step="0.01" value={editProduct.sale_price ?? ""}
                          onChange={e => setEditProduct(p => ({ ...p, sale_price: parseFloat(e.target.value) || 0 }))}
                          className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`} placeholder="0.00" />
                      </div>
                      <div>
                        <label className={`block text-[0.65rem] font-semibold mb-1 ${muted}`}>TVA (%)</label>
                        <input type="number" min="0" max="100" value={editProduct.vat_rate ?? 20}
                          onChange={e => setEditProduct(p => ({ ...p, vat_rate: parseFloat(e.target.value) || 20 }))}
                          className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`} />
                      </div>
                    </div>
                  </>
                )}
                {editProduct.id && (
                  <p className={`text-xs font-bold ${text}`}>{editProduct.name}</p>
                )}
                {/* Options e-commerce */}
                <div className="space-y-2">
                  {[
                    { key: "sell_online", label: "Vendre en boutique en ligne" },
                    { key: "sell_pos",    label: "Vendre en caisse (POS)" },
                    { key: "featured",    label: "Produit mis en avant" },
                    { key: "is_digital",  label: "Produit numérique" },
                    { key: "allow_backorder", label: "Autoriser commandes hors stock" },
                  ].map(opt => (
                    <div key={opt.key} className={`flex items-center justify-between rounded-xl border p-3 ${isDark ? "border-white/8" : "border-black/8"}`}>
                      <p className={`text-xs font-semibold ${text}`}>{opt.label}</p>
                      <button onClick={() => setEditProduct(p => ({ ...p, [opt.key]: !(p as Record<string, unknown>)[opt.key] }))} className="transition">
                        {(editProduct as Record<string, unknown>)[opt.key]
                          ? <ToggleRight size={22} style={{ color: GOLD }} />
                          : <ToggleLeft size={22} className={muted} />}
                      </button>
                    </div>
                  ))}
                </div>
                {/* Description courte */}
                <div>
                  <label className={`block text-[0.65rem] font-semibold mb-1 ${muted}`}>Description courte</label>
                  <textarea value={editProduct.short_description ?? ""} rows={2}
                    onChange={e => setEditProduct(p => ({ ...p, short_description: e.target.value }))}
                    className={`w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`} placeholder="Résumé du produit…" />
                </div>
                {/* Prix barré */}
                <div>
                  <label className={`block text-[0.65rem] font-semibold mb-1 ${muted}`}>Prix barré (€)</label>
                  <input type="number" min="0" step="0.01" value={editProduct.compare_price ?? ""}
                    onChange={e => setEditProduct(p => ({ ...p, compare_price: e.target.value ? parseFloat(e.target.value) : null }))}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`} placeholder="Prix avant remise" />
                </div>
                {/* Slug SEO */}
                <div>
                  <label className={`block text-[0.65rem] font-semibold mb-1 ${muted}`}>Slug URL</label>
                  <input value={editProduct.slug ?? ""} onChange={e => setEditProduct(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`} placeholder="mon-produit" />
                </div>
              </div>
              <div className={`flex gap-2 border-t px-5 py-4 ${divider}`}>
                <button onClick={() => setShowProdModal(false)}
                  className={`flex-1 rounded-2xl border py-3 text-sm font-semibold ${card} ${muted}`}>Annuler</button>
                <button onClick={() => void saveProduct()} disabled={savingProd || (!editProduct.id && !editProduct.name)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black disabled:opacity-40"
                  style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                  {savingProd ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {editProduct.id ? "Enregistrer" : "Créer"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ MODAL COLLECTION ════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showCollModal && editColl && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.22, ease }}
              className={`w-full max-w-sm overflow-hidden rounded-t-3xl sm:rounded-3xl border ${isDark ? "border-white/8 bg-[#0e1420]" : "border-black/8 bg-white shadow-2xl"}`}>
              <div className={`flex items-center justify-between border-b px-5 py-4 ${divider}`}>
                <p className={`text-sm font-bold ${text}`}>{editColl.id ? "Modifier" : "Nouvelle collection"}</p>
                <button onClick={() => setShowCollModal(false)}><X size={16} className={muted} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className={`block text-[0.65rem] font-semibold mb-1 ${muted}`}>Nom *</label>
                  <input value={editColl.name ?? ""} onChange={e => {
                    const n = e.target.value;
                    const s = n.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                    setEditColl(c => ({ ...c, name: n, slug: c?.slug || s }));
                  }} className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`} placeholder="Été 2026" />
                </div>
                <div>
                  <label className={`block text-[0.65rem] font-semibold mb-1 ${muted}`}>Slug URL</label>
                  <input value={editColl.slug ?? ""} onChange={e => setEditColl(c => ({ ...c, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`} placeholder="ete-2026" />
                </div>
                <div>
                  <label className={`block text-[0.65rem] font-semibold mb-1 ${muted}`}>Description</label>
                  <textarea value={editColl.description ?? ""} rows={2}
                    onChange={e => setEditColl(c => ({ ...c, description: e.target.value }))}
                    className={`w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`} />
                </div>
              </div>
              <div className={`flex gap-2 border-t px-5 py-4 ${divider}`}>
                <button onClick={() => setShowCollModal(false)}
                  className={`flex-1 rounded-2xl border py-3 text-sm font-semibold ${card} ${muted}`}>Annuler</button>
                <button onClick={() => void saveCollection()} disabled={savingColl || !editColl.name}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black disabled:opacity-40"
                  style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                  {savingColl ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {editColl.id ? "Enregistrer" : "Créer"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ MODAL PROMOTION ═════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showPromoModal && editPromo && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.22, ease }}
              className={`w-full max-w-sm overflow-hidden rounded-t-3xl sm:rounded-3xl border ${isDark ? "border-white/8 bg-[#0e1420]" : "border-black/8 bg-white shadow-2xl"}`}>
              <div className={`flex items-center justify-between border-b px-5 py-4 ${divider}`}>
                <p className={`text-sm font-bold ${text}`}>{editPromo.id ? "Modifier" : "Nouvelle promotion"}</p>
                <button onClick={() => setShowPromoModal(false)}><X size={16} className={muted} /></button>
              </div>
              <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
                <div>
                  <label className={`block text-[0.65rem] font-semibold mb-1 ${muted}`}>Code promo *</label>
                  <input value={editPromo.code ?? ""} onChange={e => setEditPromo(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm font-bold outline-none tracking-widest ${inp}`} placeholder="DJAMA10" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[0.65rem] font-semibold mb-1 ${muted}`}>Type</label>
                    <select value={editPromo.type ?? "pct"} onChange={e => setEditPromo(p => ({ ...p, type: e.target.value }))}
                      className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`}>
                      <option value="pct">Pourcentage (%)</option>
                      <option value="fixed">Montant fixe (€)</option>
                      <option value="free_shipping">Livraison gratuite</option>
                    </select>
                  </div>
                  {editPromo.type !== "free_shipping" && (
                    <div>
                      <label className={`block text-[0.65rem] font-semibold mb-1 ${muted}`}>Valeur</label>
                      <input type="number" min="0" value={editPromo.value ?? ""}
                        onChange={e => setEditPromo(p => ({ ...p, value: parseFloat(e.target.value) || 0 }))}
                        className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`} />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[0.65rem] font-semibold mb-1 ${muted}`}>Commande minimum (€)</label>
                    <input type="number" min="0" value={editPromo.min_order ?? ""}
                      onChange={e => setEditPromo(p => ({ ...p, min_order: e.target.value ? parseFloat(e.target.value) : null }))}
                      className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`} placeholder="0" />
                  </div>
                  <div>
                    <label className={`block text-[0.65rem] font-semibold mb-1 ${muted}`}>Max utilisations</label>
                    <input type="number" min="0" value={editPromo.max_uses ?? ""}
                      onChange={e => setEditPromo(p => ({ ...p, max_uses: e.target.value ? parseInt(e.target.value) : null }))}
                      className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`} placeholder="Illimité" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[0.65rem] font-semibold mb-1 ${muted}`}>Début</label>
                    <input type="date" value={editPromo.starts_at ? editPromo.starts_at.slice(0, 10) : ""}
                      onChange={e => setEditPromo(p => ({ ...p, starts_at: e.target.value || null }))}
                      className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`} />
                  </div>
                  <div>
                    <label className={`block text-[0.65rem] font-semibold mb-1 ${muted}`}>Expiration</label>
                    <input type="date" value={editPromo.expires_at ? editPromo.expires_at.slice(0, 10) : ""}
                      onChange={e => setEditPromo(p => ({ ...p, expires_at: e.target.value || null }))}
                      className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`} />
                  </div>
                </div>
                <div className={`flex items-center justify-between rounded-xl border p-3 ${isDark ? "border-white/8" : "border-black/8"}`}>
                  <p className={`text-xs font-semibold ${text}`}>Active</p>
                  <button onClick={() => setEditPromo(p => ({ ...p, is_active: !p?.is_active }))}>
                    {editPromo.is_active ? <ToggleRight size={22} style={{ color: GOLD }} /> : <ToggleLeft size={22} className={muted} />}
                  </button>
                </div>
              </div>
              <div className={`flex gap-2 border-t px-5 py-4 ${divider}`}>
                <button onClick={() => setShowPromoModal(false)}
                  className={`flex-1 rounded-2xl border py-3 text-sm font-semibold ${card} ${muted}`}>Annuler</button>
                <button onClick={() => void savePromo()} disabled={savingPromo || !editPromo.code}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black disabled:opacity-40"
                  style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                  {savingPromo ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {editPromo.id ? "Enregistrer" : "Créer"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
