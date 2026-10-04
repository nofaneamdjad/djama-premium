"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, Plus, Minus, Trash2, ShoppingCart, Check, Loader2,
  ChevronDown, User, CreditCard, Banknote, Link2,
  Package, Wrench, History, PauseCircle, Play,
  ArrowUpRight, Settings, Printer,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { useToastStack, ToastStack } from "@/components/ui/ToastStack";

const GOLD = "#c9a55a";
const ease = [0.16, 1, 0.3, 1] as const;

/* ── Types ──────────────────────────────────────────────────────────────── */
interface CatalogItem {
  id: string; type: "product"|"service"; name: string;
  sku: string; barcode: string; category: string;
  image_url: string|null; price: number; vat_rate: number;
  stock: number|null; stock_min: number|null; unit: string;
}
interface CartItem { item: CatalogItem; qty: number; discount: number; }
interface Contact { id:string; name:string; email?:string; phone?:string; company?:string; }
interface PosSession {
  id:string; terminal_name:string; opening_cash:number; opened_at:string;
  total_sales:number; sale_count:number; total_cash:number; total_card:number;
}
interface PendingSale {
  id:string; label:string; cart_data: CartItem[];
  contact_id?:string|null; discount:number; discount_type:string; updated_at:string;
}
interface Sale {
  id:string; numero:string; client_nom:string; total_ttc:number;
  date_document:string; created_at:string;
  document_payments?:{method:string;amount:number;date:string}[];
  statut:string;
}

function fmtCur(n:number) { return n.toLocaleString("fr-FR",{style:"currency",currency:"EUR",minimumFractionDigits:2}); }
function fmtDate(s:string) { return new Date(s).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}); }

/* ── Composant principal ─────────────────────────────────────────────────── */
export default function CaissePage() {
  const { isDark } = useTheme();
  const { toasts, add, remove } = useToastStack();
  const searchRef  = useRef<HTMLInputElement>(null);
  const barcodeRef = useRef<string>("");
  const barcodeTimer = useRef<ReturnType<typeof setTimeout>|undefined>(undefined);

  /* ── État global ── */
  const [tab,         setTab]         = useState<"caisse"|"historique">("caisse");
  const [session,     setSession]     = useState<PosSession|null>(null);
  const [sessionLoad, setSessionLoad] = useState(true);

  /* ── Catalogue ── */
  const [catalog,     setCatalog]     = useState<CatalogItem[]>([]);
  const [catLoad,     setCatLoad]     = useState(false);
  const [search,      setSearch]      = useState("");
  const [catFilter,   setCatFilter]   = useState("Tous");
  const [categories,  setCategories]  = useState<string[]>([]);

  /* ── Panier ── */
  const [cart,        setCart]        = useState<CartItem[]>([]);
  const [contact,     setContact]     = useState<Contact|null>(null);
  const [globalDisc,  setGlobalDisc]  = useState(0);
  const [discType,    setDiscType]    = useState<"pct"|"fixed">("pct");
  const [showCart,    setShowCart]    = useState(false); // mobile

  /* ── Client search ── */
  const [contactSearch,  setContactSearch]  = useState("");
  const [contactResults, setContactResults] = useState<Contact[]>([]);
  const [showContactBox, setShowContactBox] = useState(false);

  /* ── Encaissement ── */
  const [showCheckout,   setShowCheckout]   = useState(false);
  const [payMethod,      setPayMethod]      = useState<"cash"|"card"|"link"|"transfer">("cash");
  const [receivedCash,   setReceivedCash]   = useState("");
  const [processing,     setProcessing]     = useState(false);
  const [lastSale,       setLastSale]       = useState<{numero:string;total:number;change:number|null}|null>(null);

  /* ── Ventes en attente ── */
  const [pending,        setPending]        = useState<PendingSale[]>([]);
  const [showPending,    setShowPending]    = useState(false);

  /* ── Session modal ── */
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionAction,    setSessionAction]    = useState<"open"|"close">("open");
  const [openingCash,      setOpeningCash]      = useState("100");
  const [closingCash,      setClosingCash]      = useState("");
  const [closingNotes,     setClosingNotes]     = useState("");
  const [terminalName,     setTerminalName]     = useState("Caisse principale");

  /* ── Historique ── */
  const [sales,       setSales]       = useState<Sale[]>([]);
  const [salesLoad,   setSalesLoad]   = useState(false);
  const [salesKpis,   setSalesKpis]   = useState({ ca_today:0, count_today:0, avg_today:0 });
  const [histSearch,  setHistSearch]  = useState("");

  /* ── Totaux panier ── */
  const totalHtBrut = cart.reduce((s,c) => s + c.item.price * c.qty * (1 - c.discount/100), 0);
  const totalTva    = cart.reduce((s,c) => {
    const ht = c.item.price * c.qty * (1 - c.discount/100);
    return s + ht * c.item.vat_rate / 100;
  }, 0);
  const totalAvantRemise = totalHtBrut + totalTva;
  const remiseGlobale = discType === "pct"
    ? totalAvantRemise * globalDisc / 100
    : Math.min(globalDisc, totalAvantRemise);
  const totalTtc = Math.max(0, totalAvantRemise - remiseGlobale);
  const change   = payMethod === "cash" && parseFloat(receivedCash||"0") >= totalTtc
    ? parseFloat(receivedCash||"0") - totalTtc : null;

  /* ── Chargement session ── */
  useEffect(()=>{
    (async()=>{
      setSessionLoad(true);
      const r = await fetch("/api/pos/session");
      if (r.ok) {
        const d = await r.json() as { session: PosSession|null };
        setSession(d.session);
      }
      setSessionLoad(false);
    })();
  },[]);

  /* ── Chargement catalogue ── */
  const loadCatalog = useCallback(async()=>{
    setCatLoad(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (catFilter !== "Tous" && catFilter !== "Services") params.set("category", catFilter);
    if (catFilter === "Services") params.set("type", "service");
    if (catFilter === "Tous") params.set("type", "");
    const r = await fetch(`/api/pos/catalog?${params}`);
    if (r.ok) {
      const d = await r.json() as CatalogItem[];
      setCatalog(d);
      // Extraire catégories uniques
      const cats = ["Tous","Services",...new Set(d.filter(i=>i.type==="product").map(i=>i.category).filter(Boolean))];
      setCategories(cats);
    }
    setCatLoad(false);
  },[search, catFilter]);

  useEffect(()=>{ void loadCatalog(); },[loadCatalog]);

  /* ── Scanner code-barres (USB = input clavier rapide) ── */
  useEffect(()=>{
    function handler(e: KeyboardEvent) {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "Enter") {
        if (barcodeRef.current.length >= 4) {
          const found = catalog.find(i => i.barcode === barcodeRef.current || i.sku === barcodeRef.current);
          if (found) addToCart(found);
          else add(`Code-barres "${barcodeRef.current}" introuvable`, "error");
          barcodeRef.current = "";
        }
        return;
      }
      if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); return; }
      if (e.key.length === 1) {
        barcodeRef.current += e.key;
        clearTimeout(barcodeTimer.current);
        barcodeTimer.current = setTimeout(() => { barcodeRef.current = ""; }, 300);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  },[catalog]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Recherche contact CRM ── */
  useEffect(()=>{
    if (contactSearch.length < 2) { setContactResults([]); return; }
    const t = setTimeout(async()=>{
      const r = await fetch(`/api/pos/contacts?q=${encodeURIComponent(contactSearch)}&limit=6`).catch(()=>null);
      if (r?.ok) {
        const d = await r.json() as {data?:Contact[]} | Contact[];
        const list = Array.isArray(d) ? d : (d.data ?? []);
        setContactResults(list);
      }
    }, 300);
    return ()=>clearTimeout(t);
  },[contactSearch]);

  /* ── Chargement paniers en attente ── */
  const loadPending = useCallback(async()=>{
    const r = await fetch("/api/pos/pending");
    if (r.ok) setPending(await r.json() as PendingSale[]);
  },[]);

  useEffect(()=>{ void loadPending(); },[loadPending]);

  /* ── Chargement historique ── */
  const loadSales = useCallback(async()=>{
    if (tab !== "historique") return;
    setSalesLoad(true);
    const params = new URLSearchParams();
    if (histSearch) params.set("q", histSearch);
    const r = await fetch(`/api/pos/sales?${params}&limit=50`);
    if (r.ok) {
      const d = await r.json() as { sales:Sale[]; kpis:{ca_today:number;count_today:number;avg_today:number} };
      setSales(d.sales ?? []);
      setSalesKpis(d.kpis);
    }
    setSalesLoad(false);
  },[tab, histSearch]);

  useEffect(()=>{ void loadSales(); },[loadSales]);

  /* ── Panier ── */
  function addToCart(item: CatalogItem) {
    if (item.type === "product" && item.stock !== null && item.stock <= 0) {
      add(`Rupture de stock — ${item.name}`, "error"); return;
    }
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        if (item.type === "product" && item.stock !== null && existing.qty >= item.stock) {
          add(`Stock maximum atteint (${item.stock})`, "error"); return prev;
        }
        return prev.map(c => c.item.id === item.id ? {...c, qty: c.qty+1} : c);
      }
      return [...prev, { item, qty:1, discount:0 }];
    });
  }

  function adjustQty(id:string, delta:number) {
    setCart(prev => prev.map(c => {
      if (c.item.id !== id) return c;
      const newQty = c.qty + delta;
      if (newQty <= 0) return c; // géré par removeFromCart
      if (c.item.type === "product" && c.item.stock !== null && newQty > c.item.stock) return c;
      return {...c, qty: newQty};
    }));
  }

  function removeFromCart(id:string) { setCart(prev=>prev.filter(c=>c.item.id!==id)); }
  function clearCart() { setCart([]); setContact(null); setGlobalDisc(0); setReceivedCash(""); }

  /* ── Mettre en attente ── */
  async function holdSale() {
    if (!cart.length) return;
    const r = await fetch("/api/pos/pending", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        cart_data: cart, contact_id: contact?.id ?? null,
        session_id: session?.id ?? null,
        discount: globalDisc, discount_type: discType,
      }),
    });
    if (r.ok) {
      add("Panier mis en attente","success");
      clearCart();
      await loadPending();
    }
  }

  /* ── Reprendre un panier ── */
  async function resumePending(p: PendingSale) {
    if (cart.length && !confirm("Remplacer le panier actuel ?")) return;
    setCart(p.cart_data as CartItem[]);
    setGlobalDisc(p.discount);
    setDiscType(p.discount_type as "pct"|"fixed");
    if (p.contact_id) {
      const r = await fetch(`/api/pos/catalog?contact_id=${p.contact_id}`).catch(()=>null);
      // Tentative de recharger le contact — non critique
    }
    await fetch(`/api/pos/pending?id=${p.id}`, { method:"DELETE" });
    await loadPending();
    setShowPending(false);
  }

  /* ── Encaissement ── */
  async function finalizeSale() {
    if (!cart.length || processing) return;
    if (payMethod === "cash") {
      const recv = parseFloat(receivedCash||"0");
      if (recv < totalTtc) { add("Montant reçu insuffisant","error"); return; }
    }
    setProcessing(true);
    const r = await fetch("/api/pos/sale", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        items: cart.map(c=>({ id:c.item.id, type:c.item.type, qty:c.qty, discount:c.discount })),
        contact_id:      contact?.id ?? null,
        session_id:      session?.id ?? null,
        payment_method:  payMethod,
        global_discount: globalDisc,
        global_discount_type: discType,
        received_cash:   payMethod === "cash" ? parseFloat(receivedCash||"0") : undefined,
      }),
    });
    const d = await r.json() as { ok?:boolean; numero?:string; total_ttc?:number; change?:number|null; error?:string };
    if (!r.ok || d.error) {
      add(d.error ?? "Erreur vente","error");
    } else {
      setLastSale({ numero: d.numero!, total: d.total_ttc!, change: d.change ?? null });
      add(`Vente ${d.numero} enregistrée`,"success");
      clearCart();
      setShowCheckout(false);
      await loadCatalog(); // rafraîchir stocks
      await loadSales();
      if (session) {
        const sr = await fetch("/api/pos/session");
        if (sr.ok) setSession((await sr.json() as { session:PosSession }).session);
      }
    }
    setProcessing(false);
  }

  /* ── Session ── */
  async function handleSession() {
    if (sessionAction === "open") {
      const r = await fetch("/api/pos/session", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ action:"open", opening_cash: parseFloat(openingCash)||0, terminal_name: terminalName }),
      });
      const d = await r.json() as { session?:PosSession; error?:string };
      if (r.ok && d.session) { setSession(d.session); add("Session ouverte","success"); }
      else add(d.error??"Erreur","error");
    } else {
      const r = await fetch("/api/pos/session", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ action:"close", session_id: session?.id, closing_cash: parseFloat(closingCash)||0, closing_notes: closingNotes }),
      });
      const d = await r.json() as { session?:PosSession; expected_cash?:number; difference?:number; error?:string };
      if (r.ok) {
        setSession(null);
        add(`Session fermée — Écart : ${fmtCur(d.difference??0)}`,"success");
      } else add(d.error??"Erreur","error");
    }
    setShowSessionModal(false);
  }

  /* ── Boutons monnaie rapides ── */
  function quickCashAmounts(total: number): number[] {
    const multiples = [5,10,20,50,100,200];
    return multiples.filter(m => m >= total).slice(0,4);
  }

  /* ── Couleur stock ── */
  function stockColor(item: CatalogItem): string {
    if (item.type === "service") return "";
    if (item.stock === null) return "";
    if (item.stock <= 0) return "#ef4444";
    if (item.stock_min !== null && item.stock <= item.stock_min) return "#f59e0b";
    return "#10b981";
  }

  /* ─────────────────────── UI ─────────────────────────────────────────── */
  const bg = isDark ? "bg-[#07080e]" : "bg-[#f0f2f5]";
  const card = isDark ? "border-white/[0.06] bg-white/[0.03]" : "border-black/[0.06] bg-white shadow-sm";
  const input = isDark ? "border-white/8 bg-white/4 text-white placeholder-white/25" : "border-black/8 bg-gray-50 text-gray-900 placeholder-gray-400";
  const text  = isDark ? "text-white" : "text-gray-900";
  const muted = isDark ? "text-white/35" : "text-gray-400";

  return (
    <div className={`flex h-full flex-col overflow-hidden ${bg}`}>
      <ToastStack toasts={toasts} remove={remove}/>

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <div className={`shrink-0 flex items-center justify-between border-b px-4 py-3 ${isDark?"border-white/6":"border-black/8"}`}
        style={{background:isDark?"linear-gradient(160deg,#07080e,#0d1117)":"#fff"}}>
        <div>
          <h1 className={`text-base font-black ${text}`}>Caisse</h1>
          {session ? (
            <p className="text-xs text-emerald-400">
              Session ouverte · {new Date(session.opened_at).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}
            </p>
          ) : sessionLoad ? null : (
            <p className={`text-xs ${muted}`}>Aucune session</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Ventes en attente */}
          {pending.length > 0 && (
            <button onClick={()=>setShowPending(true)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${card} transition hover:opacity-80`}>
              <PauseCircle size={12} style={{color:GOLD}}/> En attente · {pending.length}
            </button>
          )}

          {/* Tab desktop */}
          <div className={`hidden sm:flex rounded-xl border p-0.5 ${card}`}>
            {(["caisse","historique"] as const).map(t=>(
              <button key={t} onClick={()=>setTab(t)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-all ${
                  tab===t ? "" : `${muted} hover:opacity-70`
                }`}
                style={tab===t?{background:`${GOLD}15`,color:GOLD}:{}}>
                {t === "caisse" ? <span className="flex items-center gap-1"><ShoppingCart size={11}/>Caisse</span>
                  : <span className="flex items-center gap-1"><History size={11}/>Historique</span>}
              </button>
            ))}
          </div>

          {/* Session */}
          <button onClick={()=>{ setSessionAction(session?"close":"open"); setShowSessionModal(true); }}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
              session ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : `${card} ${muted}`
            }`}>
            <Settings size={11}/> {session ? "Fermer" : "Ouvrir"}
          </button>
        </div>
      </div>

      {/* ══ TABS MOBILE ════════════════════════════════════════════════════ */}
      <div className={`shrink-0 flex sm:hidden border-b ${isDark?"border-white/6":"border-black/8"}`}>
        {(["caisse","historique"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`flex-1 py-2.5 text-xs font-bold capitalize border-b-2 transition-all ${
              tab===t ? "border-amber-500 text-amber-500" : `border-transparent ${muted}`
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* ══ CONTENU PRINCIPAL ═══════════════════════════════════════════════ */}
      {tab === "caisse" ? (
        <div className="flex flex-1 overflow-hidden">

          {/* ── CATALOGUE (gauche) ── */}
          <div className={`flex flex-1 flex-col overflow-hidden ${showCart?"hidden sm:flex":""}`}>

            {/* Barre de recherche + filtres */}
            <div className={`shrink-0 border-b p-3 space-y-2.5 ${isDark?"border-white/6":"border-black/8"}`}>
              <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${card}`}>
                <Search size={13} className={muted}/>
                <input ref={searchRef} value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Rechercher produit, service, SKU, code-barres… ( / )"
                  className={`flex-1 bg-transparent text-sm outline-none ${text}`}/>
                {search && <button onClick={()=>setSearch("")}><X size={12} className={muted}/></button>}
              </div>

              {/* Filtres catégories */}
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                {categories.map(cat=>(
                  <button key={cat} onClick={()=>setCatFilter(cat)}
                    className={`shrink-0 flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                      catFilter===cat
                        ? isDark?"bg-white/10 border-white/20 text-white":"bg-white border-gray-300 text-gray-900 shadow-sm"
                        : `${card} ${muted} hover:opacity-80`
                    }`}>
                    {cat === "Services" && <Wrench size={10}/>}
                    {cat !== "Services" && cat !== "Tous" && <Package size={10}/>}
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Grille produits */}
            <div className="flex-1 overflow-y-auto p-3">
              {catLoad ? (
                <div className="flex justify-center py-12"><Loader2 size={20} className={`animate-spin ${muted}`}/></div>
              ) : catalog.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16">
                  <Package size={28} className={muted}/>
                  <p className={`text-sm ${muted}`}>{search ? `Aucun produit pour "${search}"` : "Aucun produit"}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {catalog.map(item=>{
                    const inCart = cart.find(c=>c.item.id===item.id);
                    const stockC = stockColor(item);
                    const outOfStock = item.type==="product" && item.stock !== null && item.stock <= 0;
                    return (
                      <button key={item.id}
                        onClick={()=>!outOfStock && addToCart(item)}
                        disabled={outOfStock}
                        className={`relative rounded-2xl border p-3 text-left transition-all duration-150 ${
                          outOfStock ? "opacity-40 cursor-not-allowed" : "hover:brightness-105 active:scale-[0.98] cursor-pointer"
                        } ${inCart ? isDark?"border-amber-500/40 bg-amber-500/8":"border-amber-400/50 bg-amber-50":"" } ${card}`}>

                        {/* Image / placeholder */}
                        <div className={`mb-2 flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden ${isDark?"bg-white/8":"bg-gray-100"}`}>
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="h-full w-full object-cover"/>
                          ) : item.type === "service" ? (
                            <Wrench size={20} className={muted}/>
                          ) : (
                            <Package size={20} className={muted}/>
                          )}
                        </div>

                        <p className={`text-sm font-bold leading-tight line-clamp-2 mb-1 ${text}`}>{item.name}</p>
                        <p className="text-sm font-black tabular-nums" style={{color:GOLD}}>{fmtCur(item.price)}</p>

                        {/* Stock */}
                        {item.type === "product" && item.stock !== null && (
                          <p className="mt-0.5 text-[11px] font-semibold" style={{color:stockC}}>
                            {item.stock <= 0 ? "Rupture" : item.stock_min !== null && item.stock <= item.stock_min ? `Faible · ${item.stock}` : `${item.stock} en stock`}
                          </p>
                        )}

                        {/* Badge en panier */}
                        {inCart && (
                          <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-xs font-black text-black" style={{background:GOLD}}>
                            {inCart.qty}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── PANIER (droite) ── */}
          <div className={`flex w-full flex-col border-l sm:w-[340px] ${isDark?"border-white/6":"border-black/8"} ${!showCart && cart.length>0 ? "sm:flex" : ""} ${showCart?"flex":"hidden sm:flex"}`}>

            {/* Header panier */}
            <div className={`shrink-0 flex items-center justify-between border-b px-4 py-3 ${isDark?"border-white/6":"border-black/8"}`}>
              <div className="flex items-center gap-2">
                <ShoppingCart size={14} style={{color:GOLD}}/>
                <p className={`text-sm font-black ${text}`}>Panier</p>
                {cart.length > 0 && (
                  <span className="rounded-full px-1.5 py-0.5 text-xs font-black text-black" style={{background:GOLD}}>
                    {cart.reduce((s,c)=>s+c.qty,0)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {cart.length > 0 && (
                  <>
                    <button onClick={()=>void holdSale()} title="Mettre en attente"
                      className={`flex h-7 w-7 items-center justify-center rounded-xl border transition ${card} ${muted} hover:opacity-80`}>
                      <PauseCircle size={12}/>
                    </button>
                    <button onClick={clearCart} title="Vider"
                      className={`flex h-7 w-7 items-center justify-center rounded-xl border transition ${card} text-red-400/60 hover:text-red-400`}>
                      <Trash2 size={12}/>
                    </button>
                  </>
                )}
                <button onClick={()=>setShowCart(false)} className={`sm:hidden flex h-7 w-7 items-center justify-center rounded-xl border ${card}`}>
                  <X size={12}/>
                </button>
              </div>
            </div>

            {/* Client */}
            <div className={`shrink-0 border-b px-3 py-2.5 ${isDark?"border-white/6":"border-black/8"}`}>
              {contact ? (
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-black" style={{background:GOLD}}>
                    {contact.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${text}`}>{contact.name}</p>
                    {contact.company && <p className={`text-xs truncate ${muted}`}>{contact.company}</p>}
                  </div>
                  <button onClick={()=>setContact(null)} className={`${muted} hover:text-red-400`}><X size={12}/></button>
                </div>
              ) : (
                <div className="relative">
                  <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${card}`}>
                    <User size={11} className={muted}/>
                    <input value={contactSearch} onChange={e=>{setContactSearch(e.target.value);setShowContactBox(true);}}
                      onFocus={()=>setShowContactBox(true)}
                      placeholder="Client de passage ou rechercher CRM…"
                      className={`flex-1 bg-transparent text-xs outline-none ${text}`}/>
                    {contactSearch && <button onClick={()=>{setContactSearch("");setContactResults([]);}}><X size={10} className={muted}/></button>}
                  </div>
                  {showContactBox && contactResults.length > 0 && (
                    <div className={`absolute top-full mt-1 w-full rounded-2xl border z-20 overflow-hidden ${isDark?"border-white/8 bg-[#07080e]":"border-black/8 bg-white shadow-lg"}`}>
                      {contactResults.slice(0,6).map(c=>(
                        <button key={c.id} onClick={()=>{setContact(c);setContactSearch("");setShowContactBox(false);}}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-left transition ${isDark?"hover:bg-white/5":"hover:bg-gray-50"}`}>
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-black" style={{background:GOLD}}>
                            {c.name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-xs font-semibold truncate ${text}`}>{c.name}</p>
                            {c.company && <p className={`text-xs ${muted} truncate`}>{c.company}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Lignes panier */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12">
                  <ShoppingCart size={24} className={muted}/>
                  <p className={`text-sm ${muted}`}>Ajouter des articles</p>
                  <p className={`text-xs text-center ${muted}`}>Cliquer ou scanner un code-barres</p>
                </div>
              ) : cart.map(c=>(
                <div key={c.item.id} className={`rounded-2xl border p-3 ${card}`}>
                  <div className="flex items-start gap-2">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${isDark?"bg-white/8":"bg-gray-100"}`}>
                      {c.item.type === "service" ? <Wrench size={13} className={muted}/> : <Package size={13} className={muted}/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${text}`}>{c.item.name}</p>
                      {c.item.sku && <p className={`text-[11px] ${muted}`}>{c.item.sku}</p>}
                    </div>
                    <button onClick={()=>removeFromCart(c.item.id)} className={`shrink-0 ${muted} hover:text-red-400`}>
                      <X size={12}/>
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button onClick={()=>c.qty<=1?removeFromCart(c.item.id):adjustQty(c.item.id,-1)}
                        className={`flex h-6 w-6 items-center justify-center rounded-lg border ${card} ${muted} hover:opacity-80`}>
                        <Minus size={10}/>
                      </button>
                      <span className={`w-7 text-center text-xs font-bold ${text}`}>{c.qty}</span>
                      <button onClick={()=>adjustQty(c.item.id,1)}
                        className={`flex h-6 w-6 items-center justify-center rounded-lg border ${card} ${muted} hover:opacity-80`}>
                        <Plus size={10}/>
                      </button>
                    </div>
                    {/* Remise ligne */}
                    <div className="flex items-center gap-1">
                      <input value={c.discount||""} onChange={e=>{
                        const v = Math.min(100,Math.max(0,parseFloat(e.target.value)||0));
                        setCart(prev=>prev.map(p=>p.item.id===c.item.id?{...p,discount:v}:p));
                      }} type="number" min="0" max="100" placeholder="Rem%"
                        className={`w-14 rounded-lg border px-2 py-1 text-xs text-center outline-none ${input}`}/>
                      <p className="text-xs font-black tabular-nums" style={{color:GOLD}}>
                        {fmtCur(c.item.price * c.qty * (1 - c.discount/100))}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totaux + remise globale */}
            {cart.length > 0 && (
              <div className={`shrink-0 border-t px-4 py-3 space-y-1.5 ${isDark?"border-white/6":"border-black/8"}`}>
                <div className={`flex items-center justify-between text-xs ${muted}`}>
                  <span>Sous-total HT</span>
                  <span className="tabular-nums">{fmtCur(totalHtBrut)}</span>
                </div>
                <div className={`flex items-center justify-between text-xs ${muted}`}>
                  <span>TVA</span>
                  <span className="tabular-nums">{fmtCur(totalTva)}</span>
                </div>

                {/* Remise globale */}
                <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${card}`}>
                  <ChevronDown size={11} className={muted}/>
                  <input value={globalDisc||""} onChange={e=>setGlobalDisc(Math.max(0,parseFloat(e.target.value)||0))}
                    type="number" min="0" placeholder="Remise"
                    className={`flex-1 bg-transparent text-xs outline-none ${text}`}/>
                  <button onClick={()=>setDiscType(discType==="pct"?"fixed":"pct")}
                    className={`rounded-lg border px-2 py-0.5 text-xs font-bold ${card} ${muted}`}>
                    {discType === "pct" ? "%" : "€"}
                  </button>
                  {remiseGlobale > 0 && <span className="text-xs text-red-400">−{fmtCur(remiseGlobale)}</span>}
                </div>

                <div className={`flex items-center justify-between border-t pt-2 ${isDark?"border-white/6":"border-black/8"}`}>
                  <span className={`text-sm font-bold ${text}`}>Total TTC</span>
                  <span className="text-lg font-black tabular-nums" style={{color:GOLD}}>{fmtCur(totalTtc)}</span>
                </div>

                <button onClick={()=>setShowCheckout(true)}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black transition hover:brightness-105 active:scale-[0.98]"
                  style={{background:`linear-gradient(135deg,${GOLD},#b08d45)`,color:"#0a0a0a"}}>
                  <CreditCard size={16}/> Encaisser {fmtCur(totalTtc)}
                </button>
              </div>
            )}
          </div>

          {/* ── Bouton flottant panier (mobile) ── */}
          <AnimatePresence>
            {!showCart && cart.length > 0 && (
              <motion.button initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:20}}
                onClick={()=>setShowCart(true)}
                className="sm:hidden fixed bottom-6 right-4 z-40 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black shadow-xl"
                style={{background:`linear-gradient(135deg,${GOLD},#b08d45)`,color:"#0a0a0a"}}>
                <ShoppingCart size={15}/>
                Panier · {cart.reduce((s,c)=>s+c.qty,0)} · {fmtCur(totalTtc)}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

      ) : (
        /* ══ HISTORIQUE ═════════════════════════════════════════════════════ */
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* KPIs */}
          <div className={`shrink-0 border-b px-4 py-3 ${isDark?"border-white/6":"border-black/8"}`}>
            <div className="grid grid-cols-3 gap-3">
              {[
                {label:"CA aujourd'hui", value:fmtCur(salesKpis.ca_today), color:"#10b981"},
                {label:"Ventes",         value:salesKpis.count_today,       color:GOLD},
                {label:"Panier moyen",   value:fmtCur(salesKpis.avg_today), color:"#3b82f6"},
              ].map(k=>(
                <div key={k.label} className={`rounded-2xl border p-3 ${card}`}>
                  <p className={`text-[11px] mb-0.5 ${muted}`}>{k.label}</p>
                  <p className="text-sm font-black tabular-nums" style={{color:k.color}}>{k.value}</p>
                </div>
              ))}
            </div>
            <div className={`mt-2.5 flex items-center gap-2 rounded-xl border px-3 py-2 ${card}`}>
              <Search size={12} className={muted}/>
              <input value={histSearch} onChange={e=>setHistSearch(e.target.value)} placeholder="Rechercher vente, client…"
                className={`flex-1 bg-transparent text-sm outline-none ${text}`}/>
              {histSearch && <button onClick={()=>setHistSearch("")}><X size={12} className={muted}/></button>}
            </div>
          </div>

          {/* Liste ventes */}
          <div className="flex-1 overflow-y-auto p-4">
            {salesLoad ? (
              <div className="flex justify-center py-12"><Loader2 size={20} className={`animate-spin ${muted}`}/></div>
            ) : sales.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <History size={28} className={muted}/>
                <p className={`text-sm ${muted}`}>Aucune vente POS</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sales.map(s=>{
                  const method = s.document_payments?.[0]?.method ?? "—";
                  return (
                    <div key={s.id} className={`flex items-center gap-3 rounded-2xl border p-4 ${card}`}>
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isDark?"bg-emerald-500/10":"bg-emerald-50"}`}>
                        <Check size={14} className="text-emerald-400"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${text}`}>{s.numero}</p>
                        <p className={`text-xs truncate ${muted}`}>{s.client_nom || "Client de passage"}</p>
                        <p className={`text-xs ${muted}`}>{fmtDate(s.created_at)}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-black tabular-nums" style={{color:GOLD}}>{fmtCur(s.total_ttc)}</p>
                        <p className={`text-xs capitalize ${muted}`}>{method}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ MODAL ENCAISSEMENT ═════════════════════════════════════════════ */}
      <AnimatePresence>
        {showCheckout && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4">
            <motion.div initial={{opacity:0,y:40}} animate={{opacity:1,y:0}} exit={{opacity:0,y:40}}
              transition={{duration:0.22,ease}}
              className={`w-full max-w-sm overflow-hidden rounded-t-3xl sm:rounded-3xl border ${isDark?"border-white/8 bg-[#0e1420]":"border-black/8 bg-white shadow-2xl"}`}>

              <div className={`flex items-center justify-between border-b px-5 py-4 ${isDark?"border-white/6":"border-black/6"}`}>
                <p className={`text-sm font-bold ${text}`}>Encaissement</p>
                <button onClick={()=>setShowCheckout(false)}><X size={16} className={muted}/></button>
              </div>

              <div className="p-5 space-y-4">
                {/* Total */}
                <div className="text-center">
                  <p className={`text-xs mb-1 ${muted}`}>Total à encaisser</p>
                  <p className="text-4xl font-black tabular-nums" style={{color:GOLD}}>{fmtCur(totalTtc)}</p>
                </div>

                {/* Méthode */}
                <div className="grid grid-cols-2 gap-2">
                  {([
                    {key:"cash",  label:"Espèces",         icon:Banknote},
                    {key:"card",  label:"Carte",            icon:CreditCard},
                    {key:"link",  label:"Lien paiement",   icon:Link2},
                    {key:"transfer",label:"Virement",      icon:ArrowUpRight},
                  ] as const).map(m=>(
                    <button key={m.key} onClick={()=>setPayMethod(m.key)}
                      className={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-sm font-bold transition-all ${
                        payMethod===m.key ? "" : `${card} ${muted} hover:opacity-80`
                      }`}
                      style={payMethod===m.key?{background:`${GOLD}15`,borderColor:`${GOLD}30`,color:GOLD}:{}}>
                      <m.icon size={14}/> {m.label}
                    </button>
                  ))}
                </div>

                {/* Espèces */}
                {payMethod === "cash" && (
                  <div className="space-y-2">
                    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${card}`}>
                      <Banknote size={13} className={muted}/>
                      <input value={receivedCash} onChange={e=>setReceivedCash(e.target.value)}
                        type="number" min="0" step="0.01" placeholder="Montant reçu"
                        className={`flex-1 bg-transparent text-sm outline-none ${text}`}/>
                    </div>
                    <div className="flex gap-1.5">
                      {quickCashAmounts(totalTtc).map(amt=>(
                        <button key={amt} onClick={()=>setReceivedCash(String(amt))}
                          className={`flex-1 rounded-xl border py-2 text-xs font-bold transition ${card} ${muted} hover:opacity-80`}>
                          {amt} €
                        </button>
                      ))}
                    </div>
                    {change !== null && change >= 0 && (
                      <div className="flex items-center justify-between rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3">
                        <p className="text-sm font-bold text-emerald-400">Monnaie à rendre</p>
                        <p className="text-lg font-black text-emerald-400 tabular-nums">{fmtCur(change)}</p>
                      </div>
                    )}
                  </div>
                )}

                {payMethod === "card" && (
                  <div className={`rounded-xl border border-blue-500/20 bg-blue-500/8 p-3`}>
                    <p className="text-xs text-blue-400">Le paiement carte est traité par votre terminal physique. Confirmez lorsque le terminal valide.</p>
                  </div>
                )}
              </div>

              <div className={`flex gap-2 border-t px-5 py-4 ${isDark?"border-white/6":"border-black/6"}`}>
                <button onClick={()=>setShowCheckout(false)}
                  className={`flex-1 rounded-2xl border py-3 text-sm font-semibold ${card} ${muted}`}>
                  Annuler
                </button>
                <button onClick={()=>void finalizeSale()} disabled={processing}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black disabled:opacity-40"
                  style={{background:`linear-gradient(135deg,${GOLD},#b08d45)`,color:"#0a0a0a"}}>
                  {processing ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>}
                  Valider
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ MODAL VENTE EN ATTENTE ══════════════════════════════════════════ */}
      <AnimatePresence>
        {showPending && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4">
            <motion.div initial={{opacity:0,y:40}} animate={{opacity:1,y:0}} exit={{opacity:0,y:40}}
              transition={{duration:0.22,ease}}
              className={`w-full max-w-sm overflow-hidden rounded-t-3xl sm:rounded-3xl border ${isDark?"border-white/8 bg-[#0e1420]":"border-black/8 bg-white shadow-2xl"}`}>

              <div className={`flex items-center justify-between border-b px-5 py-4 ${isDark?"border-white/6":"border-black/6"}`}>
                <div className="flex items-center gap-2">
                  <PauseCircle size={14} style={{color:GOLD}}/>
                  <p className={`text-sm font-bold ${text}`}>Ventes en attente</p>
                </div>
                <button onClick={()=>setShowPending(false)}><X size={16} className={muted}/></button>
              </div>

              <div className="max-h-80 overflow-y-auto p-3 space-y-2">
                {pending.map(p=>(
                  <div key={p.id} className={`flex items-center gap-3 rounded-2xl border p-3 ${card}`}>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${text}`}>{p.label}</p>
                      <p className={`text-xs ${muted}`}>
                        {(p.cart_data as CartItem[]).length} articles · {new Date(p.updated_at).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={()=>void resumePending(p)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 transition hover:bg-emerald-500/20">
                        <Play size={11}/>
                      </button>
                      <button onClick={async()=>{ await fetch(`/api/pos/pending?id=${p.id}`,{method:"DELETE"}); await loadPending(); }}
                        className={`flex h-8 w-8 items-center justify-center rounded-xl border ${card} text-red-400/50 hover:text-red-400`}>
                        <X size={11}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ MODAL SESSION ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showSessionModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4">
            <motion.div initial={{opacity:0,y:40}} animate={{opacity:1,y:0}} exit={{opacity:0,y:40}}
              transition={{duration:0.22,ease}}
              className={`w-full max-w-sm overflow-hidden rounded-t-3xl sm:rounded-3xl border ${isDark?"border-white/8 bg-[#0e1420]":"border-black/8 bg-white shadow-2xl"}`}>

              <div className={`flex items-center justify-between border-b px-5 py-4 ${isDark?"border-white/6":"border-black/6"}`}>
                <p className={`text-sm font-bold ${text}`}>{sessionAction==="open"?"Ouvrir la caisse":"Fermer la caisse"}</p>
                <button onClick={()=>setShowSessionModal(false)}><X size={16} className={muted}/></button>
              </div>

              <div className="p-5 space-y-4">
                {sessionAction === "open" ? (
                  <>
                    <div>
                      <label className={`mb-1 block text-xs font-semibold ${muted}`}>Nom de la caisse</label>
                      <input value={terminalName} onChange={e=>setTerminalName(e.target.value)}
                        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none ${isDark?"border-white/8 bg-white/4 text-white":"border-black/8 bg-gray-50 text-gray-900"}`}/>
                    </div>
                    <div>
                      <label className={`mb-1 block text-xs font-semibold ${muted}`}>Fond de caisse</label>
                      <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${isDark?"border-white/8 bg-white/4":"border-black/8 bg-gray-50"}`}>
                        <Banknote size={13} className={muted}/>
                        <input value={openingCash} onChange={e=>setOpeningCash(e.target.value)} type="number" min="0"
                          className={`flex-1 bg-transparent text-sm outline-none ${text}`}/>
                        <span className={`text-xs ${muted}`}>€</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {session && (
                      <div className={`rounded-2xl border p-4 space-y-2 ${isDark?"border-white/6 bg-white/4":"border-black/8 bg-gray-50"}`}>
                        <div className={`flex justify-between text-xs ${muted}`}>
                          <span>Fond d'ouverture</span><span className="tabular-nums">{fmtCur(session.opening_cash)}</span>
                        </div>
                        <div className={`flex justify-between text-xs ${muted}`}>
                          <span>Espèces ventes</span><span className="tabular-nums text-emerald-400">{fmtCur(session.total_cash)}</span>
                        </div>
                        <div className={`flex justify-between text-xs ${muted}`}>
                          <span>Carte</span><span className="tabular-nums">{fmtCur(session.total_card)}</span>
                        </div>
                        <div className={`flex justify-between border-t pt-2 text-sm font-bold ${isDark?"border-white/6":"border-black/8"} ${text}`}>
                          <span>Total ventes</span><span className="tabular-nums" style={{color:GOLD}}>{fmtCur(session.total_sales)}</span>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className={`mb-1 block text-xs font-semibold ${muted}`}>Espèces comptées</label>
                      <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${isDark?"border-white/8 bg-white/4":"border-black/8 bg-gray-50"}`}>
                        <Banknote size={13} className={muted}/>
                        <input value={closingCash} onChange={e=>setClosingCash(e.target.value)} type="number" min="0"
                          className={`flex-1 bg-transparent text-sm outline-none ${text}`}/>
                        <span className={`text-xs ${muted}`}>€</span>
                      </div>
                    </div>
                    <div>
                      <label className={`mb-1 block text-xs font-semibold ${muted}`}>Commentaire</label>
                      <textarea value={closingNotes} onChange={e=>setClosingNotes(e.target.value)} rows={2}
                        className={`w-full resize-none rounded-xl border px-3.5 py-2.5 text-sm outline-none ${isDark?"border-white/8 bg-white/4 text-white placeholder-white/20":"border-black/8 bg-gray-50 text-gray-900"}`}/>
                    </div>
                  </>
                )}
              </div>

              <div className={`flex gap-2 border-t px-5 py-4 ${isDark?"border-white/6":"border-black/6"}`}>
                <button onClick={()=>setShowSessionModal(false)}
                  className={`flex-1 rounded-2xl border py-3 text-sm font-semibold ${card} ${muted}`}>
                  Annuler
                </button>
                <button onClick={()=>void handleSession()}
                  className="flex-1 rounded-2xl py-3 text-sm font-black"
                  style={{background:sessionAction==="close"?"#ef444415":  `linear-gradient(135deg,${GOLD},#b08d45)`,
                          color:sessionAction==="close"?"#ef4444":"#0a0a0a",
                          border:sessionAction==="close"?"1px solid rgba(239,68,68,0.25)":undefined}}>
                  {sessionAction==="open" ? "Ouvrir la caisse" : "Fermer la caisse"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ REÇU APRÈS VENTE ════════════════════════════════════════════════ */}
      <AnimatePresence>
        {lastSale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}}
              transition={{duration:0.2,ease}}
              className={`w-full max-w-xs overflow-hidden rounded-3xl border ${isDark?"border-white/8 bg-[#0e1420]":"border-black/8 bg-white shadow-xl"}`}>
              <div className="p-6 text-center space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/15">
                  <Check size={28} className="text-emerald-400"/>
                </div>
                <div>
                  <p className={`text-lg font-black ${text}`}>Vente enregistrée</p>
                  <p className={`text-sm ${muted}`}>{lastSale.numero}</p>
                </div>
                <p className="text-3xl font-black tabular-nums" style={{color:GOLD}}>{fmtCur(lastSale.total)}</p>
                {lastSale.change !== null && lastSale.change > 0 && (
                  <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2">
                    <p className="text-sm font-bold text-emerald-400">Monnaie : {fmtCur(lastSale.change)}</p>
                  </div>
                )}
              </div>
              <div className={`flex border-t ${isDark?"border-white/6":"border-black/6"}`}>
                <button onClick={()=>setLastSale(null)}
                  className={`flex-1 py-4 text-sm font-bold ${muted} hover:opacity-70`}>
                  Fermer
                </button>
                <button onClick={()=>{ window.print(); }}
                  className="flex flex-1 items-center justify-center gap-2 border-l py-4 text-sm font-bold"
                  style={{borderColor:isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)",color:GOLD}}>
                  <Printer size={13}/> Imprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
