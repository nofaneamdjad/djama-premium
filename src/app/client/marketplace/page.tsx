"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, Plus, Loader2, Check, Star, Heart,
  Package, Globe, ShoppingBag,
  Users, Briefcase, Clock, Shield, ArrowRight, Send,
  Truck, CheckCircle2, AlertCircle,
  Edit3, Layers,
  SlidersHorizontal, RefreshCw,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { useToastStack, ToastStack } from "@/components/ui/ToastStack";

const GOLD = "#c9a55a";
const ease = [0.16, 1, 0.3, 1] as const;
function fmtCur(n: number) { return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" }); }
function fmtDate(s: string) { return new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }); }
function fmtRating(n: number) { return n.toFixed(1); }

/* ── Types ─────────────────────────────────────────────────────────────── */
interface Category { id: string; name: string; slug: string; icon: string; }
interface Provider { id: string; display_name: string; avatar_url: string | null; is_verified: boolean; rating_avg: number; orders_completed: number; }
interface Package  { id: string; name: string; price: number; delivery_days: number; revisions: number; sort_order: number; }
interface Service  {
  id: string; title: string; slug: string; short_description: string | null;
  cover_image: string | null; price_from: number | null; rating_avg: number; rating_count: number;
  order_count: number; is_featured: boolean; created_at: string; status?: string;
  category: Category | null; provider: Provider | null; packages: Package[];
}
interface Order {
  id: string; order_number: string; amount: number; currency: string;
  status: string; payment_status: string; deadline: string | null;
  delivery_days: number; revisions_allowed: number; revisions_used: number;
  buyer_requirements: string | null; created_at: string; updated_at: string;
  started_at: string | null; delivered_at: string | null; completed_at: string | null;
  buyer_id: string; seller_id: string;
  service: { id: string; title: string; cover_image: string | null; short_description: string | null } | null;
  package: { id: string; name: string; price: number; delivery_days: number } | null;
  provider: Provider | null;
}
interface Message { id: string; sender_id: string; content: string; file_urls: string[]; is_read: boolean; created_at: string; }
interface ProviderProfile {
  id: string; user_id: string; display_name: string; company_name: string | null;
  avatar_url: string | null; cover_url: string | null; bio: string;
  skills: string[]; languages: string[]; location: string | null;
  website?: string | null; response_time_hours?: number | null;
  rating_avg: number; rating_count: number; orders_completed: number;
  is_verified: boolean; status: string;
  stripe_account_id: string | null; stripe_onboarding_complete: boolean;
}

type Tab = "decouvrir" | "commandes" | "mes-services" | "messages" | "favoris" | "profil";
type OrderRole = "acheteur" | "vendeur";
type SortType = "pertinence" | "rating" | "price_asc" | "price_desc" | "recent";

const ORDER_STATUSES: Record<string, { label: string; color: string }> = {
  pending:             { label: "En attente",          color: "#f59e0b" },
  paid:                { label: "Payée",               color: "#3b82f6" },
  in_progress:         { label: "En cours",            color: GOLD      },
  delivered:           { label: "Livrée",              color: "#c9a55a" },
  revision_requested:  { label: "Révision demandée",   color: "#f97316" },
  completed:           { label: "Terminée",            color: "#10b981" },
  cancelled:           { label: "Annulée",             color: "#6b7280" },
  disputed:            { label: "Litige",              color: "#ef4444" },
};

export default function MarketplacePage() {
  const { isDark } = useTheme();
  const { toasts, add, remove } = useToastStack();

  const [tab, setTab]       = useState<Tab>("decouvrir");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  /* ── Tokens ── */
  const bg     = isDark ? "bg-[#07080e]"    : "bg-[#f0f2f5]";
  const card   = isDark ? "border-white/[0.06] bg-white/[0.03]" : "border-black/[0.06] bg-white shadow-sm";
  const inp    = isDark ? "border-white/8 bg-white/4 text-white placeholder-white/25" : "border-black/8 bg-gray-50 text-gray-900 placeholder-gray-400";
  const text   = isDark ? "text-white"         : "text-gray-900";
  const muted  = isDark ? "text-white/35"      : "text-gray-400";
  const divider= isDark ? "border-white/6"     : "border-black/8";

  /* ── Catalogue ── */
  const [categories,    setCategories]   = useState<Category[]>([]);
  const [services,      setServices]     = useState<Service[]>([]);
  const [svcTotal,      setSvcTotal]     = useState(0);
  const [svcLoad,       setSvcLoad]      = useState(false);
  const [search,        setSearch]       = useState("");
  const [selCategory,   setSelCategory]  = useState("");
  const [sort,          setSort]         = useState<SortType>("pertinence");
  const [priceMax,      setPriceMax]     = useState(0);
  const [showFilters,   setShowFilters]  = useState(false);
  const [selectedSvc,   setSelectedSvc]  = useState<Service | null>(null);
  const [favorites,     setFavorites]    = useState<Set<string>>(new Set());

  /* ── Commandes ── */
  const [orders,        setOrders]       = useState<Order[]>([]);
  const [orderRole,     setOrderRole]    = useState<OrderRole>("acheteur");
  const [orderLoad,     setOrderLoad]    = useState(false);
  const [selectedOrder, setSelectedOrder]= useState<Order | null>(null);
  const [messages,      setMessages]     = useState<Message[]>([]);
  const [msgLoad,       setMsgLoad]      = useState(false);
  const [msgText,       setMsgText]      = useState("");
  const [sendingMsg,    setSendingMsg]   = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  /* ── Mes services (prestataire) ── */
  const [myServices,    setMyServices]   = useState<Service[]>([]);
  const [mySvcLoad,     setMySvcLoad]    = useState(false);
  const [myProvider,    setMyProvider]   = useState<ProviderProfile | null | undefined>(undefined);
  const [showSvcModal,  setShowSvcModal] = useState(false);
  const [editSvc,       setEditSvc]      = useState<Partial<Service & { description: string }> | null>(null);
  const [savingSvc,     setSavingSvc]    = useState(false);

  /* ── Profil prestataire ── */
  const [editProvider,  setEditProvider] = useState<Partial<ProviderProfile> | null>(null);
  const [savingProv,    setSavingProv]   = useState(false);
  const [skillInput,    setSkillInput]   = useState("");

  /* ── Commande ── */
  const [showOrderModal,setShowOrderModal] = useState(false);
  const [orderSvc,      setOrderSvc]    = useState<Service | null>(null);
  const [selPackage,    setSelPackage]  = useState<Package | null>(null);
  const [orderReq,      setOrderReq]   = useState("");
  const [placingOrder,  setPlacingOrder]= useState(false);

  /* ─────── Chargements ────────────────────────────────────────────────── */
  const loadCategories = useCallback(async () => {
    const r = await fetch("/api/marketplace/categories");
    if (r.ok) setCategories(await r.json() as Category[]);
  }, []);

  const loadServices = useCallback(async () => {
    setSvcLoad(true);
    const p = new URLSearchParams();
    if (search) p.set("q", search);
    if (selCategory) p.set("category", selCategory);
    if (priceMax > 0) p.set("max", String(priceMax));
    p.set("sort", sort);
    const r = await fetch(`/api/marketplace/services?${p}&limit=30`);
    if (r.ok) {
      const d = await r.json() as { services: Service[]; total: number };
      setServices(d.services ?? []);
      setSvcTotal(d.total ?? 0);
    }
    setSvcLoad(false);
  }, [search, selCategory, priceMax, sort]);

  const loadOrders = useCallback(async () => {
    setOrderLoad(true);
    const r = await fetch(`/api/marketplace/orders?role=${orderRole === "acheteur" ? "buyer" : "seller"}&limit=30`);
    if (r.ok) setOrders((await r.json() as { orders: Order[] }).orders ?? []);
    setOrderLoad(false);
  }, [orderRole]);

  const loadMyServices = useCallback(async () => {
    setMySvcLoad(true);
    const r = await fetch("/api/marketplace/services?mine=true");
    if (r.ok) setMyServices((await r.json() as { services: Service[] }).services ?? []);
    setMySvcLoad(false);
  }, []);

  const loadMyProvider = useCallback(async () => {
    const r = await fetch("/api/marketplace/providers?me=true");
    if (r.ok) {
      const d = await r.json() as ProviderProfile | null;
      setMyProvider(d);
      if (d?.user_id) setCurrentUserId(d.user_id);
    } else {
      setMyProvider(null);
    }
  }, []);

  const loadMessages = useCallback(async (orderId: string) => {
    setMsgLoad(true);
    const r = await fetch(`/api/marketplace/messages?order_id=${orderId}`);
    if (r.ok) setMessages(await r.json() as Message[]);
    setMsgLoad(false);
    setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, []);

  useEffect(() => { void loadCategories(); void loadServices(); void loadMyProvider(); }, [loadCategories, loadServices, loadMyProvider]);
  useEffect(() => { if (tab === "commandes") void loadOrders(); }, [tab, loadOrders]);
  useEffect(() => {
    if (tab === "mes-services" || tab === "profil") {
      void loadMyServices();
      if (myProvider === undefined) void loadMyProvider();
    }
  }, [tab, loadMyServices, loadMyProvider, myProvider]);

  useEffect(() => {
    if (selectedOrder) void loadMessages(selectedOrder.id);
  }, [selectedOrder, loadMessages]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ─────── Actions ────────────────────────────────────────────────────── */
  async function sendMessage() {
    if (!msgText.trim() || !selectedOrder) return;
    setSendingMsg(true);
    const r = await fetch("/api/marketplace/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: selectedOrder.id, content: msgText.trim() }),
    });
    if (r.ok) { setMsgText(""); await loadMessages(selectedOrder.id); }
    else add("Erreur d'envoi", "error");
    setSendingMsg(false);
  }

  async function placeOrder() {
    if (!orderSvc || !selPackage) return;
    setPlacingOrder(true);
    const r = await fetch("/api/marketplace/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service_id: orderSvc.id, package_id: selPackage.id, buyer_requirements: orderReq }),
    });
    const d = await r.json() as { error?: string };
    if (!r.ok || d.error) add(d.error ?? "Erreur", "error");
    else {
      add("Commande créée avec succès", "success");
      setShowOrderModal(false); setOrderSvc(null); setSelPackage(null); setOrderReq("");
      setTab("commandes"); void loadOrders();
    }
    setPlacingOrder(false);
  }

  async function updateOrderStatus(id: string, status: string) {
    const r = await fetch("/api/marketplace/orders", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (r.ok) {
      add("Commande mise à jour", "success");
      await loadOrders();
      if (selectedOrder?.id === id) {
        const updated = await r.json() as Order;
        setSelectedOrder(updated);
      }
    } else add("Erreur", "error");
  }

  async function saveService() {
    if (!editSvc?.title) return;
    setSavingSvc(true);
    const r = await fetch("/api/marketplace/services", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editSvc),
    });
    const d = await r.json() as { error?: string };
    if (!r.ok || d.error) add(d.error ?? "Erreur", "error");
    else { add("Service enregistré", "success"); setShowSvcModal(false); await loadMyServices(); }
    setSavingSvc(false);
  }

  async function saveProvider() {
    if (!editProvider) return;
    setSavingProv(true);
    const r = await fetch("/api/marketplace/providers", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editProvider),
    });
    const d = await r.json() as ProviderProfile & { error?: string };
    if (!r.ok || d.error) add(d.error ?? "Erreur", "error");
    else { add("Profil enregistré", "success"); setMyProvider(d); setEditProvider(null); }
    setSavingProv(false);
  }

  function toggleFavorite(serviceId: string) {
    setFavorites(f => {
      const n = new Set(f);
      if (n.has(serviceId)) n.delete(serviceId); else n.add(serviceId);
      return n;
    });
  }

  /* ─────── Composants locaux ─────────────────────────────────────────── */
  function Stars({ rating, count }: { rating: number; count: number }) {
    return (
      <div className="flex items-center gap-1">
        {[1,2,3,4,5].map(i => (
          <Star key={i} size={10} fill={i <= Math.round(rating) ? GOLD : "none"} style={{ color: GOLD }} />
        ))}
        <span className={`text-xs ${muted}`}>{fmtRating(rating)} ({count})</span>
      </div>
    );
  }

  function ServiceCard({ s }: { s: Service }) {
    const pkg = s.packages?.length ? s.packages.sort((a, b) => a.sort_order - b.sort_order)[0] : null;
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border overflow-hidden cursor-pointer transition hover:brightness-105 ${card}`}
        onClick={() => setSelectedSvc(s)}>
        <div className={`relative h-36 ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
          {s.cover_image
            ? <img src={s.cover_image} alt={s.title} className="h-full w-full object-cover" />
            : <div className="flex h-full w-full items-center justify-center"><Package size={28} className={muted} /></div>
          }
          {s.is_featured && (
            <span className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-black text-black" style={{ background: GOLD }}>
              Mis en avant
            </span>
          )}
          <button onClick={e => { e.stopPropagation(); toggleFavorite(s.id); }}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition hover:bg-black/50">
            <Heart size={12} fill={favorites.has(s.id) ? "#ef4444" : "none"} className={favorites.has(s.id) ? "text-red-400" : "text-white"} />
          </button>
        </div>
        <div className="p-3 space-y-2">
          {s.category && (
            <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${isDark ? "bg-white/8" : "bg-gray-100"} ${muted}`}>
              {s.category.name}
            </span>
          )}
          <p className={`text-xs font-bold leading-tight ${text}`} style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {s.title}
          </p>
          {s.provider && (
            <div className="flex items-center gap-1.5">
              <div className={`h-5 w-5 rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-gray-200"}`}>
                {s.provider.avatar_url
                  ? <img src={s.provider.avatar_url} alt="" className="h-full w-full object-cover" />
                  : <div className="flex h-full w-full items-center justify-center text-[10px] font-bold" style={{ color: GOLD }}>
                      {s.provider.display_name[0]?.toUpperCase()}
                    </div>
                }
              </div>
              <span className={`text-xs ${muted}`}>{s.provider.display_name}</span>
              {s.provider.is_verified && <Shield size={9} style={{ color: GOLD }} />}
            </div>
          )}
          {s.rating_count > 0 && <Stars rating={s.rating_avg} count={s.rating_count} />}
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-[11px] ${muted}`}>À partir de</p>
              <p className="text-sm font-black tabular-nums" style={{ color: GOLD }}>
                {s.price_from !== null ? fmtCur(s.price_from) : "Sur devis"}
              </p>
            </div>
            {pkg && (
              <div className={`text-right text-[11px] ${muted}`}>
                <Clock size={9} className="inline mr-0.5" />{pkg.delivery_days}j
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════
     UI PRINCIPALE
  ═════════════════════════════════════════════════════════════════════════ */
  return (
    <div className={`flex h-full flex-col overflow-hidden ${bg}`}>
      <ToastStack toasts={toasts} remove={remove} />

      {/* ── HEADER ── */}
      <div className={`shrink-0 flex items-center justify-between border-b px-4 py-3 ${divider}`}
        style={{ background: isDark ? "linear-gradient(160deg,#07080e,#0d1117)" : "#fff" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}30` }}>
            <Briefcase size={15} style={{ color: GOLD }} />
          </div>
          <div>
            <h1 className={`text-base font-black ${text}`}>Marketplace</h1>
            <p className={`text-xs ${muted}`}>{svcTotal > 0 ? `${svcTotal} service${svcTotal > 1 ? "s" : ""} disponible${svcTotal > 1 ? "s" : ""}` : "Services professionnels"}</p>
          </div>
        </div>
        {myProvider?.status === "active" ? (
          <button onClick={() => setTab("mes-services")} className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${card} ${muted} hover:opacity-80`}>
            <Layers size={11} /> Mes services
          </button>
        ) : (
          <button onClick={() => setTab("profil")} className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition hover:brightness-105"
            style={{ background: `${GOLD}15`, color: GOLD }}>
            <Plus size={11} /> Vendre
          </button>
        )}
      </div>

      {/* ── NAVIGATION ── */}
      <div className={`shrink-0 flex gap-0.5 overflow-x-auto scrollbar-none border-b px-3 py-1.5 ${divider}`}
        style={{ background: isDark ? "#07080e" : "#fff" }}>
        {([
          { key: "decouvrir",    label: "Découvrir",    icon: Search    },
          { key: "commandes",    label: "Commandes",    icon: ShoppingBag },
          { key: "mes-services", label: "Mes services", icon: Package   },
          { key: "profil",       label: "Mon profil",   icon: Users     },
          { key: "favoris",      label: "Favoris",      icon: Heart     },
        ] as { key: Tab; label: string; icon: React.ComponentType<{ size: number }> }[]).map(n => {
          const active = tab === n.key;
          return (
            <button key={n.key} onClick={() => setTab(n.key)}
              className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${active ? "" : `${muted} hover:opacity-70`}`}
              style={active ? { background: `${GOLD}15`, color: GOLD } : {}}>
              <n.icon size={11} />{n.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
         CONTENU
      ════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-hidden flex flex-col">

        {/* ── DÉCOUVRIR ── */}
        {tab === "decouvrir" && (
          <div className="flex flex-col h-full">
            {/* Barre recherche */}
            <div className={`shrink-0 border-b px-4 py-3 space-y-2 ${divider}`}>
              <div className="flex items-center gap-2">
                <div className={`flex flex-1 items-center gap-2 rounded-xl border px-3 py-2.5 ${card}`}>
                  <Search size={13} className={muted} />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Développeur Next.js, designer logo, rédacteur…"
                    className={`flex-1 bg-transparent text-sm outline-none ${text}`} />
                  {search && <button onClick={() => setSearch("")}><X size={11} className={muted} /></button>}
                </div>
                <button onClick={() => setShowFilters(f => !f)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border ${showFilters ? "" : `${card} ${muted}`} transition`}
                  style={showFilters ? { background: `${GOLD}15`, borderColor: `${GOLD}30`, color: GOLD } : {}}>
                  <SlidersHorizontal size={14} />
                </button>
              </div>
              {/* Catégories */}
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                <button onClick={() => setSelCategory("")}
                  className={`shrink-0 rounded-xl border px-3 py-1 text-xs font-bold transition ${!selCategory ? "" : `${card} ${muted}`}`}
                  style={!selCategory ? { background: `${GOLD}15`, borderColor: `${GOLD}30`, color: GOLD } : {}}>
                  Tout
                </button>
                {categories.map(c => (
                  <button key={c.id} onClick={() => setSelCategory(selCategory === c.id ? "" : c.id)}
                    className={`shrink-0 rounded-xl border px-3 py-1 text-xs font-bold transition ${selCategory === c.id ? "" : `${card} ${muted}`}`}
                    style={selCategory === c.id ? { background: `${GOLD}15`, borderColor: `${GOLD}30`, color: GOLD } : {}}>
                    {c.name}
                  </button>
                ))}
              </div>
              {/* Filtres avancés */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="flex flex-wrap gap-3 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${muted}`}>Tri :</span>
                      <select value={sort} onChange={e => setSort(e.target.value as SortType)}
                        className={`rounded-xl border px-2 py-1.5 text-xs outline-none ${inp}`}>
                        <option value="pertinence">Pertinence</option>
                        <option value="rating">Mieux notés</option>
                        <option value="price_asc">Prix croissant</option>
                        <option value="price_desc">Prix décroissant</option>
                        <option value="recent">Plus récents</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${muted}`}>Budget max :</span>
                      <input type="number" min="0" value={priceMax || ""} onChange={e => setPriceMax(parseFloat(e.target.value) || 0)}
                        className={`w-24 rounded-xl border px-2 py-1.5 text-xs outline-none ${inp}`} placeholder="€" />
                    </div>
                    <button onClick={() => void loadServices()} className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold"
                      style={{ background: `${GOLD}15`, color: GOLD }}>
                      <RefreshCw size={10} /> Appliquer
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Grille services */}
            <div className="flex-1 overflow-y-auto p-4">
              {svcLoad ? (
                <div className="flex justify-center py-12"><Loader2 size={20} className={`animate-spin ${muted}`} /></div>
              ) : services.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-16">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}20` }}>
                    <Briefcase size={28} style={{ color: GOLD }} />
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-bold ${text}`}>Aucun service disponible</p>
                    <p className={`text-xs mt-1 ${muted}`}>{search ? `Aucun résultat pour "${search}"` : "La marketplace est en cours de démarrage"}</p>
                  </div>
                  <button onClick={() => setTab("profil")}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition hover:brightness-105"
                    style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                    <Plus size={13} /> Proposer un service
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {services.map(s => <ServiceCard key={s.id} s={s} />)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── COMMANDES ── */}
        {tab === "commandes" && (
          <div className="flex flex-col h-full">
            <div className={`shrink-0 border-b px-4 py-3 flex items-center gap-2 ${divider}`}>
              <div className={`flex rounded-xl border p-0.5 ${card}`}>
                {(["acheteur","vendeur"] as OrderRole[]).map(r => (
                  <button key={r} onClick={() => setOrderRole(r)}
                    className={`rounded-lg px-3 py-1 text-xs font-bold capitalize transition-all ${orderRole === r ? "" : `${muted} hover:opacity-70`}`}
                    style={orderRole === r ? { background: `${GOLD}15`, color: GOLD } : {}}>
                    {r === "acheteur" ? "Mes achats" : "Mes ventes"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {orderLoad ? (
                <div className="flex justify-center py-12"><Loader2 size={20} className={`animate-spin ${muted}`} /></div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-16">
                  <ShoppingBag size={28} className={muted} />
                  <p className={`text-sm ${muted}`}>{orderRole === "acheteur" ? "Aucun achat" : "Aucune vente"}</p>
                  {orderRole === "acheteur" && (
                    <button onClick={() => setTab("decouvrir")} className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold"
                      style={{ background: `${GOLD}15`, color: GOLD }}>
                      <Search size={13} /> Découvrir des services
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {orders.map(o => {
                    const st = ORDER_STATUSES[o.status] ?? { label: o.status, color: "#6b7280" };
                    return (
                      <button key={o.id} onClick={() => setSelectedOrder(o)}
                        className={`w-full flex items-center gap-3 rounded-2xl border p-4 text-left transition hover:brightness-105 ${card}`}>
                        <div className={`h-12 w-12 shrink-0 overflow-hidden rounded-xl ${isDark ? "bg-white/8" : "bg-gray-100"}`}>
                          {o.service?.cover_image
                            ? <img src={o.service.cover_image} alt="" className="h-full w-full object-cover" />
                            : <div className="flex h-full w-full items-center justify-center"><Package size={18} className={muted} /></div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold truncate ${text}`}>{o.service?.title ?? "Service"}</p>
                          <p className={`text-xs ${muted}`}>{o.order_number} · {fmtDate(o.created_at)}</p>
                          {o.deadline && (
                            <p className={`text-[11px] ${muted}`}>
                              <Clock size={9} className="inline mr-0.5" />Échéance {fmtDate(o.deadline)}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black tabular-nums" style={{ color: GOLD }}>{fmtCur(o.amount)}</p>
                          <span className="text-[11px] font-bold rounded-full px-1.5 py-0.5"
                            style={{ background: `${st.color}15`, color: st.color }}>{st.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MES SERVICES (prestataire) ── */}
        {tab === "mes-services" && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className={`text-sm font-bold ${text}`}>{myServices.length} service(s)</p>
              {myProvider?.status === "active" && (
                <button onClick={() => { setEditSvc({ status: "draft" }); setShowSvcModal(true); }}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition hover:brightness-105"
                  style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                  <Plus size={13} /> Nouvelle offre
                </button>
              )}
            </div>
            {!myProvider && (
              <div className={`rounded-2xl border p-6 text-center ${card}`}>
                <Briefcase size={24} className={`mx-auto mb-3 ${muted}`} />
                <p className={`text-sm font-bold ${text}`}>Créez votre profil prestataire</p>
                <p className={`text-xs mt-1 mb-4 ${muted}`}>Pour proposer des services sur la marketplace DJAMA</p>
                <button onClick={() => setTab("profil")} className="rounded-xl px-4 py-2 text-sm font-bold" style={{ background: `${GOLD}15`, color: GOLD }}>
                  Créer mon profil
                </button>
              </div>
            )}
            {mySvcLoad ? (
              <div className="flex justify-center py-8"><Loader2 size={18} className={`animate-spin ${muted}`} /></div>
            ) : myServices.map(s => (
              <div key={s.id} className={`rounded-2xl border p-4 ${card}`}>
                <div className="flex items-start gap-3">
                  <div className={`h-14 w-14 shrink-0 overflow-hidden rounded-xl ${isDark ? "bg-white/8" : "bg-gray-100"}`}>
                    {s.cover_image
                      ? <img src={s.cover_image} alt={s.title} className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center"><Package size={18} className={muted} /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-bold truncate ${text}`}>{s.title}</p>
                      <span className="text-[11px] font-bold rounded-full px-1.5 py-0.5"
                        style={{ background: s.status === "published" ? "#10b98115" : `${GOLD}15`, color: s.status === "published" ? "#10b981" : GOLD }}>
                        {s.status === "published" ? "Publié" : s.status === "draft" ? "Brouillon" : s.status === "paused" ? "Pausé" : s.status}
                      </span>
                    </div>
                    {s.rating_count > 0 && <Stars rating={s.rating_avg} count={s.rating_count} />}
                    <div className={`flex items-center gap-3 mt-1 text-xs ${muted}`}>
                      <span>{s.order_count} commande(s)</span>
                      {s.price_from !== null && <span>À partir de {fmtCur(s.price_from)}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => { setEditSvc(s); setShowSvcModal(true); }}
                      className={`flex h-7 w-7 items-center justify-center rounded-xl border ${card} ${muted}`}>
                      <Edit3 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── PROFIL PRESTATAIRE ── */}
        {tab === "profil" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {myProvider === undefined ? (
              <div className="flex justify-center py-12"><Loader2 size={20} className={`animate-spin ${muted}`} /></div>
            ) : !myProvider || editProvider ? (
              /* Formulaire de création/édition */
              <div className="space-y-4">
                <div className={`rounded-2xl border p-5 space-y-4 ${card}`}>
                  <p className={`text-sm font-bold ${text}`}>
                    {myProvider ? "Modifier mon profil prestataire" : "Devenir prestataire sur DJAMA"}
                  </p>
                  {[
                    { key: "display_name", label: "Nom affiché *", placeholder: "Marie Dupont" },
                    { key: "company_name", label: "Entreprise (optionnel)", placeholder: "Dupont Studio" },
                    { key: "location",     label: "Localisation",          placeholder: "Paris, France" },
                    { key: "website",      label: "Site web",              placeholder: "https://…" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className={`block text-xs font-semibold mb-1 ${muted}`}>{f.label}</label>
                      <input value={(editProvider ?? {})[f.key as keyof typeof editProvider] as string ?? ""}
                        onChange={e => setEditProvider(p => ({ ...(p ?? {}), [f.key]: e.target.value }))}
                        className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`} placeholder={f.placeholder} />
                    </div>
                  ))}
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${muted}`}>Bio / Description</label>
                    <textarea value={editProvider?.bio ?? ""} rows={4}
                      onChange={e => setEditProvider(p => ({ ...(p ?? {}), bio: e.target.value }))}
                      className={`w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`}
                      placeholder="Décrivez vos compétences et votre expérience…" />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${muted}`}>Compétences</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {(editProvider?.skills ?? []).map((s, i) => (
                        <span key={i} className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${isDark ? "bg-white/8" : "bg-gray-100"}`} style={{ color: GOLD }}>
                          {s}
                          <button onClick={() => setEditProvider(p => ({ ...(p ?? {}), skills: (p?.skills ?? []).filter((_,j) => j !== i) }))}>
                            <X size={9} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && skillInput.trim()) { setEditProvider(p => ({ ...(p ?? {}), skills: [...(p?.skills ?? []), skillInput.trim()] })); setSkillInput(""); e.preventDefault(); }}}
                        className={`flex-1 rounded-xl border px-3 py-2 text-sm outline-none ${inp}`} placeholder="Ajouter une compétence…" />
                      <button onClick={() => { if (skillInput.trim()) { setEditProvider(p => ({ ...(p ?? {}), skills: [...(p?.skills ?? []), skillInput.trim()] })); setSkillInput(""); }}}
                        className="rounded-xl px-3 py-2 text-sm font-bold" style={{ background: `${GOLD}15`, color: GOLD }}>
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {myProvider && editProvider && (
                    <button onClick={() => setEditProvider(null)} className={`flex-1 rounded-2xl border py-3 text-sm font-semibold ${card} ${muted}`}>
                      Annuler
                    </button>
                  )}
                  <button onClick={() => void saveProvider()} disabled={savingProv || !editProvider?.display_name}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black disabled:opacity-40 transition hover:brightness-105"
                    style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                    {savingProv ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    {myProvider ? "Enregistrer" : "Créer mon profil"}
                  </button>
                </div>
              </div>
            ) : (
              /* Profil existant */
              <div className="space-y-4">
                <div className={`rounded-2xl border p-5 ${card}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`h-14 w-14 shrink-0 overflow-hidden rounded-2xl ${isDark ? "bg-white/8" : "bg-gray-100"}`}>
                        {myProvider.avatar_url
                          ? <img src={myProvider.avatar_url} alt="" className="h-full w-full object-cover" />
                          : <div className="flex h-full w-full items-center justify-center text-lg font-black" style={{ color: GOLD }}>
                              {myProvider.display_name[0]?.toUpperCase()}
                            </div>
                        }
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-bold ${text}`}>{myProvider.display_name}</p>
                          {myProvider.is_verified && <Shield size={12} style={{ color: GOLD }} />}
                          <span className={`text-[11px] font-bold rounded-full px-1.5 py-0.5 ${myProvider.status === "active" ? "text-emerald-400 bg-emerald-500/10" : `${muted} ${isDark ? "bg-white/5" : "bg-gray-100"}`}`}>
                            {myProvider.status === "active" ? "Actif" : myProvider.status === "pending" ? "En attente" : "Suspendu"}
                          </span>
                        </div>
                        {myProvider.company_name && <p className={`text-xs ${muted}`}>{myProvider.company_name}</p>}
                        {myProvider.rating_count > 0 && <Stars rating={myProvider.rating_avg} count={myProvider.rating_count} />}
                      </div>
                    </div>
                    <button onClick={() => setEditProvider(myProvider)}
                      className={`flex h-8 w-8 items-center justify-center rounded-xl border ${card} ${muted}`}>
                      <Edit3 size={13} />
                    </button>
                  </div>
                  {myProvider.bio && <p className={`text-xs mt-3 ${muted}`}>{myProvider.bio}</p>}
                  {myProvider.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {myProvider.skills.map((s, i) => (
                        <span key={i} className={`rounded-full px-2 py-0.5 text-xs font-bold ${isDark ? "bg-white/8" : "bg-gray-100"}`} style={{ color: GOLD }}>{s}</span>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)" }}>
                    {[
                      { label: "Note", value: myProvider.rating_avg > 0 ? fmtRating(myProvider.rating_avg) : "—" },
                      { label: "Avis",  value: String(myProvider.rating_count) },
                      { label: "Commandes", value: String(myProvider.orders_completed) },
                    ].map(s => (
                      <div key={s.label} className="text-center">
                        <p className="text-base font-black" style={{ color: GOLD }}>{s.value}</p>
                        <p className={`text-xs ${muted}`}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Paiement Stripe Connect */}
                <div className={`rounded-2xl border p-4 ${card}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Globe size={14} style={{ color: GOLD }} />
                    <p className={`text-sm font-bold ${text}`}>Recevoir des paiements</p>
                  </div>
                  {myProvider.stripe_onboarding_complete ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <p className={`text-xs text-emerald-400`}>Compte de paiement configuré</p>
                    </div>
                  ) : (
                    <div>
                      <p className={`text-xs ${muted} mb-3`}>
                        Connectez votre compte Stripe pour recevoir vos paiements de manière sécurisée.
                        Les fonds sont libérés après validation de la livraison.
                      </p>
                      <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${isDark ? "border-amber-500/20 bg-amber-500/5" : "border-amber-200 bg-amber-50"}`}>
                        <AlertCircle size={12} className="text-amber-500 shrink-0" />
                        <p className="text-xs text-amber-500">Configuration Stripe Connect requise — disponible prochainement</p>
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={() => { setTab("mes-services"); setShowSvcModal(true); setEditSvc({ status: "draft" }); }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black transition hover:brightness-105"
                  style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                  <Plus size={14} /> Créer un service
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── FAVORIS ── */}
        {tab === "favoris" && (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
            <Heart size={28} className={muted} />
            <p className={`text-sm font-bold ${text}`}>{favorites.size > 0 ? `${favorites.size} favori(s)` : "Aucun favori"}</p>
            <p className={`text-xs text-center max-w-xs ${muted}`}>Cliquez sur le cœur d&apos;un service pour le sauvegarder ici.</p>
            {favorites.size > 0 && (
              <div className="w-full max-w-md grid gap-3">
                {services.filter(s => favorites.has(s.id)).map(s => <ServiceCard key={s.id} s={s} />)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
         MODAL — DÉTAIL SERVICE
      ═══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedSvc && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.22, ease }}
              className={`w-full max-w-lg overflow-hidden rounded-t-3xl sm:rounded-3xl border ${isDark ? "border-white/8 bg-[#0e1420]" : "border-black/8 bg-white shadow-2xl"}`}>
              {/* Cover */}
              <div className={`relative h-44 ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
                {selectedSvc.cover_image
                  ? <img src={selectedSvc.cover_image} alt={selectedSvc.title} className="h-full w-full object-cover" />
                  : <div className="flex h-full w-full items-center justify-center"><Package size={32} className={muted} /></div>
                }
                <button onClick={() => setSelectedSvc(null)} className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
                  <X size={14} className="text-white" />
                </button>
              </div>
              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                {selectedSvc.category && (
                  <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${isDark ? "bg-white/8" : "bg-gray-100"} ${muted}`}>
                    {selectedSvc.category.name}
                  </span>
                )}
                <h2 className={`text-base font-black ${text}`}>{selectedSvc.title}</h2>
                {selectedSvc.provider && (
                  <div className="flex items-center gap-2">
                    <div className={`h-7 w-7 rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-gray-200"}`}>
                      {selectedSvc.provider.avatar_url
                        ? <img src={selectedSvc.provider.avatar_url} alt="" className="h-full w-full object-cover" />
                        : <div className="flex h-full w-full items-center justify-center text-xs font-black" style={{ color: GOLD }}>
                            {selectedSvc.provider.display_name[0]?.toUpperCase()}
                          </div>
                      }
                    </div>
                    <span className={`text-xs font-semibold ${text}`}>{selectedSvc.provider.display_name}</span>
                    {selectedSvc.provider.is_verified && <Shield size={11} style={{ color: GOLD }} />}
                    <span className={`text-xs ${muted}`}>{selectedSvc.provider.orders_completed} commandes</span>
                  </div>
                )}
                {selectedSvc.rating_count > 0 && <Stars rating={selectedSvc.rating_avg} count={selectedSvc.rating_count} />}
                {selectedSvc.short_description && <p className={`text-sm ${muted}`}>{selectedSvc.short_description}</p>}

                {/* Packages */}
                {selectedSvc.packages?.length > 0 && (
                  <div className="space-y-2">
                    <p className={`text-xs font-bold ${text}`}>Choisissez une formule</p>
                    {selectedSvc.packages.sort((a, b) => a.sort_order - b.sort_order).map(pkg => (
                      <button key={pkg.id} onClick={() => setSelPackage(selPackage?.id === pkg.id ? null : pkg)}
                        className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition ${selPackage?.id === pkg.id ? "" : `${card} hover:brightness-105`}`}
                        style={selPackage?.id === pkg.id ? { background: `${GOLD}12`, borderColor: `${GOLD}40` } : {}}>
                        <div>
                          <p className={`text-xs font-bold capitalize ${text}`}>{pkg.name}</p>
                          <div className={`flex items-center gap-2 text-xs ${muted}`}>
                            <span><Clock size={9} className="inline mr-0.5" />{pkg.delivery_days}j</span>
                            <span>{pkg.revisions} révision(s)</span>
                          </div>
                        </div>
                        <p className="text-sm font-black tabular-nums" style={{ color: GOLD }}>{fmtCur(pkg.price)}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className={`flex gap-2 border-t px-5 py-4 ${divider}`}>
                <button onClick={() => {
                  setOrderSvc(selectedSvc);
                  setSelectedSvc(null);
                  if (selPackage) setShowOrderModal(true);
                  else add("Sélectionnez une formule", "error");
                }}
                  disabled={!selPackage}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black disabled:opacity-40 transition hover:brightness-105"
                  style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                  <ShoppingBag size={14} /> Commander
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ MODAL — CONFIRMER COMMANDE ════════════════════════════════════ */}
      <AnimatePresence>
        {showOrderModal && orderSvc && selPackage && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.22, ease }}
              className={`w-full max-w-sm overflow-hidden rounded-t-3xl sm:rounded-3xl border ${isDark ? "border-white/8 bg-[#0e1420]" : "border-black/8 bg-white shadow-2xl"}`}>
              <div className={`flex items-center justify-between border-b px-5 py-4 ${divider}`}>
                <p className={`text-sm font-bold ${text}`}>Confirmer la commande</p>
                <button onClick={() => setShowOrderModal(false)}><X size={16} className={muted} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className={`rounded-2xl border p-4 ${card}`}>
                  <p className={`text-xs font-bold ${text} mb-1`}>{orderSvc.title}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-xs capitalize font-bold ${muted}`}>{selPackage.name}</p>
                      <p className={`text-xs ${muted}`}><Clock size={9} className="inline mr-0.5" />{selPackage.delivery_days} jours</p>
                    </div>
                    <p className="text-xl font-black tabular-nums" style={{ color: GOLD }}>{fmtCur(selPackage.price)}</p>
                  </div>
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${muted}`}>Décrivez votre besoin au prestataire *</label>
                  <textarea value={orderReq} onChange={e => setOrderReq(e.target.value)} rows={4}
                    className={`w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`}
                    placeholder="Expliquez votre projet, vos attentes, vos contraintes…" />
                </div>
                <div className={`flex items-start gap-2 rounded-xl border p-3 ${isDark ? "border-amber-500/20 bg-amber-500/5" : "border-amber-200 bg-amber-50"}`}>
                  <AlertCircle size={13} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-500">Le paiement Stripe sera intégré prochainement. La commande est créée et le prestataire sera notifié.</p>
                </div>
              </div>
              <div className={`flex gap-2 border-t px-5 py-4 ${divider}`}>
                <button onClick={() => setShowOrderModal(false)} className={`flex-1 rounded-2xl border py-3 text-sm font-semibold ${card} ${muted}`}>Annuler</button>
                <button onClick={() => void placeOrder()} disabled={placingOrder || !orderReq.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black disabled:opacity-40 transition hover:brightness-105"
                  style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                  {placingOrder ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Confirmer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ MODAL — WORKSPACE COMMANDE ════════════════════════════════════ */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.22, ease }}
              className={`w-full max-w-lg overflow-hidden rounded-t-3xl sm:rounded-3xl border flex flex-col ${isDark ? "border-white/8 bg-[#0e1420]" : "border-black/8 bg-white shadow-2xl"}`}
              style={{ maxHeight: "85vh" }}>
              {/* En-tête */}
              <div className={`shrink-0 flex items-center justify-between border-b px-5 py-4 ${divider}`}>
                <div>
                  <p className={`text-sm font-bold ${text}`}>{selectedOrder.service?.title ?? selectedOrder.order_number}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className={`text-xs ${muted}`}>{selectedOrder.order_number}</p>
                    <span className="text-[11px] font-bold rounded-full px-1.5 py-0.5"
                      style={{ background: `${ORDER_STATUSES[selectedOrder.status]?.color}15`, color: ORDER_STATUSES[selectedOrder.status]?.color }}>
                      {ORDER_STATUSES[selectedOrder.status]?.label}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedOrder(null)}><X size={16} className={muted} /></button>
              </div>

              {/* Résumé */}
              <div className={`shrink-0 border-b px-5 py-3 ${divider}`}>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className={`text-[11px] ${muted}`}>Montant</p>
                    <p className="text-sm font-black tabular-nums" style={{ color: GOLD }}>{fmtCur(selectedOrder.amount)}</p>
                  </div>
                  <div>
                    <p className={`text-[11px] ${muted}`}>Formule</p>
                    <p className={`text-xs font-bold capitalize ${text}`}>{selectedOrder.package?.name ?? "—"}</p>
                  </div>
                  <div>
                    <p className={`text-[11px] ${muted}`}>Échéance</p>
                    <p className={`text-xs font-bold ${text}`}>{selectedOrder.deadline ? fmtDate(selectedOrder.deadline) : "—"}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {msgLoad ? (
                  <div className="flex justify-center py-4"><Loader2 size={16} className={`animate-spin ${muted}`} /></div>
                ) : messages.length === 0 ? (
                  <p className={`text-center text-xs py-4 ${muted}`}>Aucun message — démarrez la conversation</p>
                ) : (
                  messages.map(m => {
                    const mine = currentUserId ? m.sender_id === currentUserId : m.sender_id === selectedOrder.buyer_id;
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${mine ? "rounded-br-sm" : "rounded-bl-sm"}`}
                          style={mine ? { background: `${GOLD}18`, border: `1px solid ${GOLD}25` } : { background: isDark ? "rgba(255,255,255,0.06)" : "#f3f4f6" }}>
                          <p className={`text-xs ${mine ? `${text}` : `${text}`}`}>{m.content}</p>
                          <p className={`text-[11px] mt-1 ${muted}`}>{fmtDate(m.created_at)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={msgEndRef} />
              </div>

              {/* Actions contextuelles selon statut */}
              {selectedOrder.status !== "cancelled" && selectedOrder.status !== "completed" && (
                <div className={`shrink-0 border-t px-5 py-3 flex gap-2 overflow-x-auto scrollbar-none ${divider}`}>
                  {selectedOrder.status === "delivered" && (
                    <>
                      <button onClick={() => void updateOrderStatus(selectedOrder.id, "completed")}
                        className="shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-emerald-400 border border-emerald-500/30 bg-emerald-500/10">
                        <CheckCircle2 size={11} /> Accepter
                      </button>
                      <button onClick={() => void updateOrderStatus(selectedOrder.id, "revision_requested")}
                        className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border ${card} text-amber-400 border-amber-500/30 bg-amber-500/10`}>
                        <RefreshCw size={11} /> Révision
                      </button>
                    </>
                  )}
                  {selectedOrder.status === "in_progress" && (
                    <button onClick={() => void updateOrderStatus(selectedOrder.id, "delivered")}
                      className="shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold"
                      style={{ background: `${GOLD}15`, color: GOLD }}>
                      <Truck size={11} /> Livrer
                    </button>
                  )}
                  {(selectedOrder.status === "paid") && (
                    <button onClick={() => void updateOrderStatus(selectedOrder.id, "in_progress")}
                      className="shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold"
                      style={{ background: `${GOLD}15`, color: GOLD }}>
                      <ArrowRight size={11} /> Démarrer
                    </button>
                  )}
                </div>
              )}

              {/* Saisie message */}
              {selectedOrder.status !== "cancelled" && selectedOrder.status !== "completed" && (
                <div className={`shrink-0 border-t px-4 py-3 flex items-end gap-2 ${divider}`}>
                  <textarea value={msgText} onChange={e => setMsgText(e.target.value)} rows={2}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }}
                    className={`flex-1 resize-none rounded-xl border px-3 py-2 text-sm outline-none ${inp}`}
                    placeholder="Votre message…" />
                  <button onClick={() => void sendMessage()} disabled={sendingMsg || !msgText.trim()}
                    className="flex h-9 w-9 items-center justify-center rounded-xl disabled:opacity-40 transition hover:brightness-105"
                    style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                    {sendingMsg ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ MODAL — CRÉER/ÉDITER SERVICE ═════════════════════════════════ */}
      <AnimatePresence>
        {showSvcModal && editSvc && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.22, ease }}
              className={`w-full max-w-sm overflow-hidden rounded-t-3xl sm:rounded-3xl border ${isDark ? "border-white/8 bg-[#0e1420]" : "border-black/8 bg-white shadow-2xl"}`}>
              <div className={`flex items-center justify-between border-b px-5 py-4 ${divider}`}>
                <p className={`text-sm font-bold ${text}`}>{editSvc.id ? "Modifier le service" : "Nouveau service"}</p>
                <button onClick={() => setShowSvcModal(false)}><X size={16} className={muted} /></button>
              </div>
              <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${muted}`}>Titre *</label>
                  <input value={editSvc.title ?? ""} onChange={e => setEditSvc(s => ({ ...s, title: e.target.value }))}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`} placeholder="Développement site vitrine Next.js" />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${muted}`}>Catégorie</label>
                  <select value={editSvc.category?.id ?? ""} onChange={e => {
                    const cat = categories.find(c => c.id === e.target.value);
                    setEditSvc(s => ({ ...s, category: cat ?? null, category_id: e.target.value } as Partial<Service & { description: string; category_id: string }>));
                  }}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`}>
                    <option value="">Sélectionner…</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${muted}`}>Description courte</label>
                  <textarea value={editSvc.short_description ?? ""} rows={3}
                    onChange={e => setEditSvc(s => ({ ...s, short_description: e.target.value }))}
                    className={`w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`} placeholder="Résumez votre offre en 2-3 phrases…" />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${muted}`}>Statut</label>
                  <select value={editSvc.status ?? "draft"} onChange={e => setEditSvc(s => ({ ...s, status: e.target.value }))}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`}>
                    <option value="draft">Brouillon</option>
                    <option value="published">Publié</option>
                    <option value="paused">Pausé</option>
                  </select>
                </div>
              </div>
              <div className={`flex gap-2 border-t px-5 py-4 ${divider}`}>
                <button onClick={() => setShowSvcModal(false)} className={`flex-1 rounded-2xl border py-3 text-sm font-semibold ${card} ${muted}`}>Annuler</button>
                <button onClick={() => void saveService()} disabled={savingSvc || !editSvc.title}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black disabled:opacity-40 transition hover:brightness-105"
                  style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                  {savingSvc ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {editSvc.id ? "Enregistrer" : "Créer"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
