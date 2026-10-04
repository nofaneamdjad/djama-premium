"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, X, Copy, Check, ExternalLink, QrCode, MoreHorizontal,
  Loader2, FileText, Trash2, Link2, Ban, RefreshCw, ChevronDown,
  TrendingUp, Clock, Wallet, ArrowUpRight, Download, AlertTriangle,
  RotateCcw, Users,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { useToastStack, ToastStack } from "@/components/ui/ToastStack";
import { useRouter } from "next/navigation";

const GOLD = "#c9a55a";
const ease = [0.16, 1, 0.3, 1] as const;

/* ── Types ──────────────────────────────────────────────────────────────── */
type LinkStatus = "active"|"paid"|"partial"|"expired"|"disabled"|"archived";

interface PaymentLink {
  id:                    string;
  slug:                  string;
  title:                 string;
  description:           string;
  amount:                number|null;
  currency:              string;
  status:                LinkStatus;
  is_free_amount:        boolean;
  stripe_payment_link_url?: string;
  total_collected:       number;
  payment_count:         number;
  expires_at?:           string|null;
  paid_at?:              string;
  created_at:            string;
  contact_id?:           string|null;
  document_id?:          string|null;
}

interface Transaction {
  id:               string;
  amount:           number;
  currency:         string;
  status:           "pending"|"succeeded"|"failed"|"refunded"|"partially_refunded";
  customer_name?:   string;
  customer_email?:  string;
  stripe_payment_intent_id?: string;
  created_at:       string;
  refunded_amount:  number;
}

interface Document  { id:string; numero:string; sujet:string; total_ttc:number; devise:string; }
interface Contact   { id:string; name:string; company?:string; email?:string; }

/* ── Configs ─────────────────────────────────────────────────────────────── */
const STATUS: Record<LinkStatus, { label:string; color:string; bg:string; border:string; dot:string }> = {
  active:   { label:"Actif",              color:"#10b981", bg:"rgba(16,185,129,0.1)",  border:"rgba(16,185,129,0.25)",  dot:"bg-emerald-400 animate-pulse" },
  paid:     { label:"Payé",              color:"#c9a55a", bg:"rgba(201,165,90,0.1)",   border:"rgba(201,165,90,0.25)",  dot:"bg-amber-400" },
  partial:  { label:"Part. payé",        color:"#3b82f6", bg:"rgba(59,130,246,0.1)",   border:"rgba(59,130,246,0.25)", dot:"bg-blue-400" },
  expired:  { label:"Expiré",            color:"#6b7280", bg:"rgba(107,114,128,0.1)", border:"rgba(107,114,128,0.25)", dot:"bg-gray-400" },
  disabled: { label:"Désactivé",         color:"#ef4444", bg:"rgba(239,68,68,0.1)",    border:"rgba(239,68,68,0.25)",  dot:"bg-red-400" },
  archived: { label:"Archivé",           color:"#4b5563", bg:"rgba(75,85,99,0.1)",    border:"rgba(75,85,99,0.25)",   dot:"bg-gray-500" },
};

const TX_STATUS: Record<string, { label:string; color:string }> = {
  succeeded:           { label:"Encaissé",   color:"#10b981" },
  pending:             { label:"En cours",    color:"#f59e0b" },
  failed:              { label:"Échoué",      color:"#ef4444" },
  refunded:            { label:"Remboursé",  color:"#6b7280" },
  partially_refunded:  { label:"Part. remb.",color:"#8b5cf6" },
};

const CURRENCIES = ["eur","usd","gbp","chf","cad"];

function fmtCur(n:number, cur:string) {
  return n.toLocaleString("fr-FR",{style:"currency",currency:cur.toUpperCase(),minimumFractionDigits:2});
}
function fmtDate(s?:string) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"});
}

/* ── Composant principal ─────────────────────────────────────────────────── */
export default function PaiementsPage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const { toasts, add, remove } = useToastStack();

  const [links,      setLinks]      = useState<PaymentLink[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [filter,     setFilter]     = useState<LinkStatus|"all">("all");
  const [origin,     setOrigin]     = useState("");

  /* ── Drawer ── */
  const [drawer,      setDrawer]     = useState<PaymentLink|null>(null);
  const [drawerTxs,   setDrawerTxs]  = useState<Transaction[]>([]);
  const [drawerLoad,  setDrawerLoad] = useState(false);
  const [refunding,   setRefunding]  = useState<string|null>(null);
  const [refundAmt,   setRefundAmt]  = useState("");
  const [showRefund,  setShowRefund] = useState<string|null>(null);
  const [openMenu,    setOpenMenu]   = useState<string|null>(null);
  const [qrSrc,       setQrSrc]      = useState<string|null>(null);
  const [showQr,      setShowQr]     = useState(false);

  /* ── Modale création ── */
  const [showCreate, setShowCreate]  = useState(false);
  const [creating,   setCreating]    = useState(false);

  // Formulaire création
  const [fTitle,     setFTitle]      = useState("");
  const [fDesc,      setFDesc]       = useState("");
  const [fAmount,    setFAmount]     = useState("");
  const [fCurrency,  setFCurrency]   = useState("eur");
  const [fFree,      setFFree]       = useState(false);
  const [fDocId,     setFDocId]      = useState("");
  const [fExpire,    setFExpire]     = useState("");
  const [fMsg,       setFMsg]        = useState("");
  const [fColPhone,  setFColPhone]   = useState(false);
  const [fDocSuggest,setFDocSuggest] = useState<Document[]>([]);
  const [fDocSearch, setFDocSearch]  = useState("");
  const [fDocObj,    setFDocObj]     = useState<Document|null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{ setOrigin(window.location.origin); },[]);

  /* ── Fermer le menu au clic extérieur ── */
  useEffect(()=>{
    function handler(e:MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
    }
    document.addEventListener("mousedown", handler);
    return ()=>document.removeEventListener("mousedown", handler);
  },[]);

  /* ── Chargement ── */
  const load = useCallback(async()=>{
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "all") params.set("status", filter);
    if (search)           params.set("q", search);
    const r = await fetch(`/api/payment-links?${params}`);
    if (r.ok) setLinks(await r.json() as PaymentLink[]);
    setLoading(false);
  },[filter, search]);

  useEffect(()=>{ void load(); },[load]);

  /* ── Drawer ── */
  useEffect(()=>{
    if (!drawer) { setDrawerTxs([]); setQrSrc(null); return; }
    void loadDrawer(drawer.id);
  },[drawer?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadDrawer(id:string) {
    setDrawerLoad(true);
    const r = await fetch(`/api/payment-links/${id}`);
    if (r.ok) {
      const d = await r.json() as PaymentLink & { transactions: Transaction[] };
      setDrawerTxs(d.transactions ?? []);
    }
    setDrawerLoad(false);
  }

  /* ── Recherche factures dans le formulaire ── */
  useEffect(()=>{
    if (fDocSearch.length < 2) { setFDocSuggest([]); return; }
    const t = setTimeout(async()=>{
      const r = await fetch(`/api/factures?q=${encodeURIComponent(fDocSearch)}&limit=6`);
      if (r.ok) setFDocSuggest(await r.json() as Document[]);
    }, 300);
    return ()=>clearTimeout(t);
  },[fDocSearch]);

  /* ── KPIs ── */
  const kCollecte   = links.filter(l=>l.status==="paid"||l.status==="partial").reduce((s,l)=>s+l.total_collected,0);
  const kAttendu    = links.filter(l=>l.status==="active"&&l.amount).reduce((s,l)=>s+(l.amount??0),0);
  const kTxCount    = links.reduce((s,l)=>s+l.payment_count,0);
  const kActifs     = links.filter(l=>l.status==="active").length;
  const kTauxPay    = links.length>0 ? Math.round(links.filter(l=>l.status==="paid").length/links.length*100) : 0;

  /* ── Copier le lien ── */
  const [copied, setCopied] = useState<string|null>(null);
  function copy(link:PaymentLink) {
    const url = `${origin}/pay/${link.slug}`;
    navigator.clipboard.writeText(url).then(()=>{
      setCopied(link.id);
      add("Lien copié", "success");
      setTimeout(()=>setCopied(null),2000);
    });
  }

  /* ── QR code ── */
  async function showQrCode(link:PaymentLink) {
    setQrSrc(null);
    setShowQr(true);
    const r = await fetch(`/api/payment-links/${link.id}/qr`);
    if (r.ok) {
      const blob = await r.blob();
      setQrSrc(URL.createObjectURL(blob));
    }
  }

  /* ── Changer statut ── */
  async function changeStatus(link:PaymentLink, status:"active"|"disabled") {
    const r = await fetch(`/api/payment-links/${link.id}`, {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ status }),
    });
    if (r.ok) {
      add(status==="active"?"Lien activé":"Lien désactivé","success");
      setLinks(prev=>prev.map(l=>l.id===link.id?{...l,status}:l));
      if (drawer?.id===link.id) setDrawer(d=>d?{...d,status}:d);
    }
    setOpenMenu(null);
  }

  /* ── Supprimer / archiver ── */
  async function deleteLink(link:PaymentLink) {
    if (!confirm(`Supprimer "${link.title}" ?`)) return;
    const r = await fetch(`/api/payment-links/${link.id}`, { method:"DELETE" });
    if (r.ok) {
      const d = await r.json() as { archived?:boolean; deleted?:boolean };
      add(d.archived?"Lien archivé":"Lien supprimé","success");
      if (drawer?.id===link.id) setDrawer(null);
      await load();
    }
    setOpenMenu(null);
  }

  /* ── Rembourser ── */
  async function refund(tx:Transaction) {
    if (!drawer) return;
    setRefunding(tx.id);
    const body: Record<string,unknown> = { transaction_id: tx.id };
    if (refundAmt) body.amount = parseFloat(refundAmt);
    const r = await fetch(`/api/payment-links/${drawer.id}/refund`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify(body),
    });
    const res = await r.json() as { ok?:boolean; error?:string };
    if (res.ok) {
      add("Remboursement initié","success");
      await loadDrawer(drawer.id);
    } else {
      add(res.error??"Erreur remboursement","error");
    }
    setRefunding(null);
    setShowRefund(null);
    setRefundAmt("");
  }

  /* ── Créer un lien ── */
  async function createLink() {
    if (!fTitle.trim()) { add("Titre requis","error"); return; }
    if (!fFree && !fDocObj && !fAmount) { add("Montant requis","error"); return; }
    setCreating(true);

    const body: Record<string,unknown> = {
      title:                 fTitle.trim(),
      description:           fDesc.trim(),
      currency:              fCurrency,
      is_free_amount:        fFree,
      collect_phone:         fColPhone,
      after_payment_message: fMsg.trim(),
    };
    if (fDocObj) {
      body.document_id = fDocObj.id;
    } else if (!fFree && fAmount) {
      body.amount = parseFloat(fAmount);
    }
    if (fExpire) body.expires_at = new Date(fExpire).toISOString();

    const r = await fetch("/api/payment-links", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify(body),
    });
    const d = await r.json() as PaymentLink & { error?:string; public_url?:string };
    if (!r.ok || d.error) { add(d.error??"Erreur","error"); setCreating(false); return; }

    add("Lien créé avec succès","success");
    setShowCreate(false);
    setFTitle(""); setFDesc(""); setFAmount(""); setFExpire(""); setFMsg(""); setFFree(false);
    setFDocObj(null); setFDocSearch(""); setFDocSuggest([]);
    setCreating(false);
    await load();
    setDrawer(d as PaymentLink);
    copy(d as PaymentLink);
  }

  /* ── Filtrés ── */
  const filtered = links.filter(l=>{
    const q = search.toLowerCase();
    return (!q || l.title.toLowerCase().includes(q))
        && (filter==="all" || l.status===filter);
  });

  const rowBase = isDark
    ? "border-white/[0.06] bg-white/[0.03] hover:border-white/[0.1] hover:bg-white/[0.06]"
    : "border-black/[0.06] bg-white hover:border-black/[0.1] hover:bg-slate-50 shadow-sm";

  /* ══════════════════════════════════════════════════════════════════════ */
  return (
    <div className={`relative min-h-full pb-20 ${isDark?"bg-[#07080e]":"bg-[#f0f2f5]"}`}>
      <ToastStack toasts={toasts} remove={remove}/>

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden px-4 pt-5 pb-4 sm:px-6" style={{background:isDark?"linear-gradient(160deg,#07080e,#0d1117)":"linear-gradient(160deg,#f0f2f5,#f5f7fa)"}}>
        <div className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full opacity-[0.05]" style={{background:`radial-gradient(circle,${GOLD},transparent)`}}/>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{background:`linear-gradient(90deg,transparent,${GOLD}40,transparent)`}}/>
        <div className="flex items-start justify-between">
          <div>
            <h1 className={`text-xl font-black tracking-tight ${isDark?"text-white":"text-gray-900"}`}>Liens de paiement</h1>
            <p className={`text-xs mt-0.5 ${isDark?"text-white/40":"text-gray-500"}`}>{kActifs} actifs · {kTxCount} transactions</p>
          </div>
          <button onClick={()=>setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-black transition hover:brightness-110"
            style={{background:`linear-gradient(135deg,${GOLD},#b08d45)`,color:"#0a0a0a"}}>
            <Plus size={13}/> Créer un lien
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 space-y-6">

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label:"Collecté",        value:fmtCur(kCollecte,"eur"), color:"#10b981", Icon:Wallet     },
            { label:"À encaisser",     value:fmtCur(kAttendu,"eur"),  color:GOLD,      Icon:TrendingUp  },
            { label:"Transactions",    value:kTxCount,                 color:"#3b82f6", Icon:ArrowUpRight},
            { label:"Taux de paiement",value:`${kTauxPay}%`,           color:"#8b5cf6", Icon:Clock      },
          ].map(({label,value,color,Icon})=>(
            <div key={label} className={`relative overflow-hidden rounded-2xl border p-4 ${isDark?"border-white/6 bg-white/4":"border-black/8 bg-white shadow-sm"}`}>
              <div className="pointer-events-none absolute -right-3 -top-3 h-12 w-12 rounded-full opacity-15 blur-xl" style={{background:color}}/>
              <div className="mb-1 flex items-center gap-1.5">
                <Icon size={11} style={{color}} className="opacity-80"/>
                <p className={`text-xs font-semibold ${isDark?"text-white/35":"text-[#0e1420]/45"}`}>{label}</p>
              </div>
              <p className="text-lg font-black tabular-nums" style={{color}}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── TOOLBAR ── */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className={`flex flex-1 items-center gap-2 rounded-xl border px-3.5 py-2.5 ${isDark?"border-white/8 bg-white/4":"border-black/8 bg-white shadow-sm"}`}>
            <Search size={13} className={isDark?"text-white/25":"text-black/25"}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un lien…"
              className={`flex-1 bg-transparent text-sm outline-none ${isDark?"text-white placeholder-white/25":"text-gray-800 placeholder-gray-400"}`}/>
            {search && <button onClick={()=>setSearch("")}><X size={12} className={isDark?"text-white/30":"text-gray-400"}/></button>}
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
            {(["all","active","paid","expired","disabled"] as const).map(s=>{
              const cfg = s!=="all" ? STATUS[s as LinkStatus] : null;
              const active = filter===s;
              return (
                <button key={s} onClick={()=>setFilter(s)}
                  className={`flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                    active ? "" : isDark?"border border-white/8 bg-white/4 text-white/40 hover:text-white/70"
                      :"border border-black/8 bg-white text-[#0e1420]/40 hover:text-[#0e1420]/70 shadow-sm"
                  }`}
                  style={active&&cfg?{background:cfg.bg,border:`1px solid ${cfg.border}`,color:cfg.color}
                    :active?{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)"}:{}}>
                  {s==="all"?"Tous":STATUS[s as LinkStatus].label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── LISTE ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={22} className={`animate-spin ${isDark?"text-white/20":"text-gray-300"}`}/></div>
        ) : filtered.length===0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <Link2 size={28} className={isDark?"text-white/10":"text-gray-300"}/>
            <div>
              <p className={`font-bold ${isDark?"text-white/40":"text-gray-500"}`}>{search?"Aucun résultat":"Aucun lien de paiement"}</p>
              <p className={`text-sm mt-1 ${isDark?"text-white/20":"text-gray-400"}`}>Créez votre premier lien pour commencer à encaisser</p>
            </div>
            {!search&&<button onClick={()=>setShowCreate(true)} className="flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-bold transition"
              style={{background:`${GOLD}12`,borderColor:`${GOLD}25`,color:GOLD}}>
              <Plus size={13}/> Créer un lien
            </button>}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((link,i)=>{
              const s = STATUS[link.status];
              const pubUrl = `${origin}/pay/${link.slug}`;
              return (
                <motion.div key={link.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.04,duration:0.25,ease}}
                  className={`group relative flex items-center gap-3 rounded-2xl border p-4 transition-all cursor-pointer ${rowBase}`}
                  onClick={()=>setDrawer(link)}>

                  {/* Status dot + info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${s.dot}`}/>
                      <p className={`font-bold text-sm truncate ${isDark?"text-white":"text-gray-900"}`}>{link.title}</p>
                      <span className="shrink-0 rounded-full border px-2 py-0.5 text-xs font-bold" style={{background:s.bg,borderColor:s.border,color:s.color}}>{s.label}</span>
                    </div>
                    <p className={`text-xs truncate ${isDark?"text-white/30":"text-gray-400"}`}>{pubUrl}</p>
                  </div>

                  {/* Montant */}
                  <div className="shrink-0 text-right hidden sm:block">
                    <p className={`text-sm font-black tabular-nums ${isDark?"text-white":"text-gray-900"}`}>
                      {link.is_free_amount ? "Libre" : link.amount ? fmtCur(link.amount,link.currency) : "—"}
                    </p>
                    {link.total_collected>0 && (
                      <p className="text-xs text-emerald-500">{fmtCur(link.total_collected,link.currency)} collecté</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1" onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>copy(link)}
                      className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${isDark?"border-white/8 text-white/30 hover:bg-white/8 hover:text-white/70":"border-black/8 text-gray-400 hover:bg-gray-100"}`}>
                      {copied===link.id ? <Check size={12} className="text-emerald-400"/> : <Copy size={12}/>}
                    </button>
                    <a href={pubUrl} target="_blank" rel="noopener noreferrer"
                      className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${isDark?"border-white/8 text-white/30 hover:bg-white/8 hover:text-white/70":"border-black/8 text-gray-400 hover:bg-gray-100"}`}>
                      <ExternalLink size={12}/>
                    </a>
                    <div className="relative" ref={openMenu===link.id?menuRef:undefined}>
                      <button onClick={()=>setOpenMenu(openMenu===link.id?null:link.id)}
                        className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${isDark?"border-white/8 text-white/30 hover:bg-white/8 hover:text-white/70":"border-black/8 text-gray-400 hover:bg-gray-100"}`}>
                        <MoreHorizontal size={12}/>
                      </button>
                      {openMenu===link.id && (
                        <div className={`absolute right-0 top-10 z-50 w-44 overflow-hidden rounded-2xl border py-1 shadow-xl ${isDark?"border-white/8 bg-[#0e1420]":"border-black/8 bg-white"}`}>
                          {[
                            {icon:QrCode,     label:"QR Code",          action:()=>{showQrCode(link);}},
                            {icon:link.status==="active"?Ban:RefreshCw, label:link.status==="active"?"Désactiver":"Activer",
                              action:()=>changeStatus(link,link.status==="active"?"disabled":"active")},
                            {icon:Trash2,     label:"Supprimer",        action:()=>deleteLink(link), danger:true},
                          ].map(({icon:Icon,label,action,danger})=>(
                            <button key={label} onClick={action}
                              className={`flex w-full items-center gap-2.5 px-4 py-2 text-xs font-semibold transition ${
                                danger ? "text-red-400 hover:bg-red-500/10" : isDark?"text-white/60 hover:bg-white/6":"text-gray-700 hover:bg-gray-50"
                              }`}>
                              <Icon size={12}/> {label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════ QR MODAL ══════════ */}
      <AnimatePresence>
        {showQr && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
            <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}} transition={{duration:0.2,ease}}
              className={`w-full max-w-xs overflow-hidden rounded-3xl border ${isDark?"border-white/8 bg-[#0e1420]":"border-black/8 bg-white shadow-xl"}`}>
              <div className="flex items-center justify-between border-b px-5 py-4" style={{borderColor:isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)"}}>
                <div className="flex items-center gap-2">
                  <QrCode size={15} style={{color:GOLD}}/>
                  <p className={`text-sm font-bold ${isDark?"text-white":"text-gray-900"}`}>QR Code</p>
                </div>
                <button onClick={()=>{setShowQr(false);setQrSrc(null);}} className={isDark?"text-white/30 hover:text-white/70":"text-gray-400 hover:text-gray-700"}><X size={16}/></button>
              </div>
              <div className="p-6 flex flex-col items-center gap-4">
                {qrSrc ? (
                  <>
                    <img src={qrSrc} alt="QR Code" className="w-56 h-56 rounded-2xl"/>
                    <div className="flex gap-2 w-full">
                      <a href={qrSrc} download="qr-paiement.png"
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition ${isDark?"border-white/10 text-white/50 hover:bg-white/8":"border-black/10 text-gray-600 hover:bg-gray-50"}`}>
                        <Download size={12}/> Télécharger
                      </a>
                      <button onClick={()=>{window.print();}}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold"
                        style={{background:`${GOLD}15`,color:GOLD}}>
                        Imprimer
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="h-56 w-56 flex items-center justify-center rounded-2xl" style={{background:isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)"}}>
                    <Loader2 size={24} className="animate-spin" style={{color:GOLD}}/>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════ DRAWER DÉTAIL ══════════ */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setDrawer(null)} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"/>
            <motion.div initial={{x:"100%",opacity:0}} animate={{x:0,opacity:1}} exit={{x:"100%",opacity:0}}
              transition={{duration:0.3,ease}}
              className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col overflow-hidden ${isDark?"bg-[#0e1420] border-l border-white/6":"bg-white border-l border-black/8"} shadow-2xl`}>

              {/* Drawer header */}
              <div className={`shrink-0 border-b px-6 py-5 ${isDark?"border-white/6":"border-black/8"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${STATUS[drawer.status].dot}`}/>
                    <span className="rounded-full border px-2 py-0.5 text-xs font-bold"
                      style={{background:STATUS[drawer.status].bg,borderColor:STATUS[drawer.status].border,color:STATUS[drawer.status].color}}>
                      {STATUS[drawer.status].label}
                    </span>
                  </div>
                  <button onClick={()=>setDrawer(null)} className={isDark?"text-white/30 hover:text-white/70":"text-gray-400 hover:text-gray-700"}>
                    <X size={16}/>
                  </button>
                </div>
                <h2 className={`text-lg font-black ${isDark?"text-white":"text-gray-900"}`}>{drawer.title}</h2>
                {drawer.description && <p className={`text-sm mt-1 ${isDark?"text-white/40":"text-gray-500"}`}>{drawer.description}</p>}

                {/* Stats rapides */}
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    {label:"Montant",  value:drawer.is_free_amount?"Libre":drawer.amount?fmtCur(drawer.amount,drawer.currency):"—"},
                    {label:"Collecté", value:fmtCur(drawer.total_collected,drawer.currency), color:"#10b981"},
                    {label:"Transactions", value:drawer.payment_count},
                  ].map(r=>(
                    <div key={r.label} className={`rounded-xl p-3 ${isDark?"bg-white/4":"bg-gray-50"}`}>
                      <p className={`text-[11px] mb-0.5 ${isDark?"text-white/30":"text-gray-400"}`}>{r.label}</p>
                      <p className="text-sm font-black tabular-nums" style={{color:r.color??(isDark?"#fff":"#0e1420")}}>{r.value}</p>
                    </div>
                  ))}
                </div>

                {/* URL + actions */}
                <div className={`mt-3 flex items-center gap-1.5 rounded-xl border px-3 py-2 ${isDark?"border-white/8 bg-black/30":"border-black/8 bg-gray-50"}`}>
                  <code className={`flex-1 truncate text-xs ${isDark?"text-sky-400":"text-sky-600"}`}>{origin}/pay/{drawer.slug}</code>
                  <button onClick={()=>copy(drawer)} className={isDark?"text-white/25 hover:text-white/60":"text-gray-400 hover:text-gray-700"}>
                    {copied===drawer.id ? <Check size={12} className="text-emerald-400"/> : <Copy size={12}/>}
                  </button>
                  <a href={`${origin}/pay/${drawer.slug}`} target="_blank" rel="noopener noreferrer"
                    className={isDark?"text-white/25 hover:text-white/60":"text-gray-400 hover:text-gray-700"}>
                    <ExternalLink size={12}/>
                  </a>
                  <button onClick={()=>showQrCode(drawer)} className={isDark?"text-white/25 hover:text-white/60":"text-gray-400 hover:text-gray-700"}>
                    <QrCode size={12}/>
                  </button>
                </div>

                {/* Toggle rapide */}
                <div className="mt-3 flex gap-2">
                  {drawer.status==="active" ? (
                    <button onClick={()=>changeStatus(drawer,"disabled")}
                      className="flex items-center gap-1.5 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400 transition hover:bg-red-500/20">
                      <Ban size={11}/> Désactiver
                    </button>
                  ) : drawer.status==="disabled" ? (
                    <button onClick={()=>changeStatus(drawer,"active")}
                      className="flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/20">
                      <RefreshCw size={11}/> Réactiver
                    </button>
                  ) : null}
                  <button onClick={()=>deleteLink(drawer)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${isDark?"border-white/8 text-white/30 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400":"border-black/8 text-gray-400 hover:border-red-300 hover:bg-red-50 hover:text-red-500"}`}>
                    <Trash2 size={11}/> Supprimer
                  </button>
                </div>
              </div>

              {/* Transactions */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                <p className={`text-xs font-bold uppercase tracking-widest ${isDark?"text-white/25":"text-gray-400"}`}>Transactions</p>

                {drawerLoad ? (
                  <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin" style={{color:GOLD}}/></div>
                ) : drawerTxs.length===0 ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <Users size={24} className={isDark?"text-white/10":"text-gray-300"}/>
                    <p className={`text-sm ${isDark?"text-white/30":"text-gray-400"}`}>Aucune transaction</p>
                  </div>
                ) : (
                  drawerTxs.map(tx=>{
                    const txCfg = TX_STATUS[tx.status] ?? TX_STATUS.pending;
                    return (
                      <div key={tx.id} className={`rounded-2xl border p-4 ${isDark?"border-white/6 bg-white/4":"border-black/8 bg-gray-50"}`}>
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <div className="min-w-0">
                            <p className={`text-sm font-bold ${isDark?"text-white":"text-gray-900"}`}>{tx.customer_name||tx.customer_email||"Client"}</p>
                            {tx.customer_email && tx.customer_name && (
                              <p className={`text-xs ${isDark?"text-white/30":"text-gray-400"}`}>{tx.customer_email}</p>
                            )}
                            <p className={`text-xs mt-0.5 ${isDark?"text-white/25":"text-gray-400"}`}>{fmtDate(tx.created_at)}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-black tabular-nums" style={{color:txCfg.color}}>{fmtCur(tx.amount,tx.currency)}</p>
                            <span className="text-[11px] font-semibold" style={{color:txCfg.color}}>{txCfg.label}</span>
                          </div>
                        </div>
                        {tx.refunded_amount>0 && (
                          <p className="text-xs text-purple-400">Remboursé : {fmtCur(tx.refunded_amount,tx.currency)}</p>
                        )}
                        {tx.status==="succeeded" && tx.amount>tx.refunded_amount && (
                          <div className="mt-2">
                            {showRefund===tx.id ? (
                              <div className="flex gap-2 items-center">
                                <input value={refundAmt} onChange={e=>setRefundAmt(e.target.value)}
                                  placeholder={`Max ${fmtCur(tx.amount-tx.refunded_amount,tx.currency)}`}
                                  className={`flex-1 rounded-xl border px-3 py-1.5 text-xs outline-none ${isDark?"border-white/10 bg-white/6 text-white placeholder-white/25":"border-black/10 bg-white text-gray-800"}`}/>
                                <button onClick={()=>refund(tx)} disabled={refunding===tx.id}
                                  className="flex items-center gap-1 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-bold text-purple-400 disabled:opacity-50">
                                  {refunding===tx.id?<Loader2 size={10} className="animate-spin"/>:<RotateCcw size={10}/>} Rembourser
                                </button>
                                <button onClick={()=>setShowRefund(null)} className={isDark?"text-white/30":"text-gray-400"}><X size={12}/></button>
                              </div>
                            ) : (
                              <button onClick={()=>setShowRefund(tx.id)}
                                className={`flex items-center gap-1 text-xs font-semibold transition ${isDark?"text-white/25 hover:text-purple-400":"text-gray-400 hover:text-purple-500"}`}>
                                <RotateCcw size={10}/> Rembourser
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════ MODALE CRÉATION ══════════ */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-0 sm:px-4 backdrop-blur-md">
            <motion.div initial={{opacity:0,y:40}} animate={{opacity:1,y:0}} exit={{opacity:0,y:40}}
              transition={{duration:0.25,ease}}
              className={`w-full max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl border ${isDark?"border-white/8 bg-[#0e1420]":"border-black/8 bg-white shadow-2xl"} max-h-[90vh] overflow-y-auto`}>

              <div className={`flex items-center justify-between border-b px-6 py-5 sticky top-0 z-10 ${isDark?"border-white/6 bg-[#0e1420]":"border-black/6 bg-white"}`}>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{background:`${GOLD}15`}}>
                    <Plus size={14} style={{color:GOLD}}/>
                  </div>
                  <h2 className={`text-sm font-bold ${isDark?"text-white":"text-gray-900"}`}>Nouveau lien de paiement</h2>
                </div>
                <button onClick={()=>setShowCreate(false)} className={isDark?"text-white/30 hover:text-white/70":"text-gray-400 hover:text-gray-700"}><X size={16}/></button>
              </div>

              <div className="p-5 space-y-4">
                {/* Titre */}
                <div>
                  <label className={`mb-1 block text-xs font-semibold ${isDark?"text-white/40":"text-gray-500"}`}>Titre *</label>
                  <input value={fTitle} onChange={e=>setFTitle(e.target.value)} placeholder="Formation Excel avancée"
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition ${isDark?"border-white/8 bg-white/4 text-white placeholder-white/20 focus:border-white/16":"border-black/8 bg-gray-50 text-gray-900 focus:border-gray-300"}`}/>
                </div>

                {/* Description */}
                <div>
                  <label className={`mb-1 block text-xs font-semibold ${isDark?"text-white/40":"text-gray-500"}`}>Description</label>
                  <textarea value={fDesc} onChange={e=>setFDesc(e.target.value)} rows={2} placeholder="Description de la prestation…"
                    className={`w-full resize-none rounded-xl border px-3.5 py-2.5 text-sm outline-none transition ${isDark?"border-white/8 bg-white/4 text-white placeholder-white/20 focus:border-white/16":"border-black/8 bg-gray-50 text-gray-900 focus:border-gray-300"}`}/>
                </div>

                {/* Facture existante OU montant */}
                <div>
                  <label className={`mb-1 block text-xs font-semibold ${isDark?"text-white/40":"text-gray-500"}`}>Facture liée (optionnel)</label>
                  {fDocObj ? (
                    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${isDark?"border-emerald-500/25 bg-emerald-500/8":"border-emerald-300 bg-emerald-50"}`}>
                      <FileText size={12} className="text-emerald-400 shrink-0"/>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${isDark?"text-white":"text-gray-900"}`}>{fDocObj.sujet||fDocObj.numero}</p>
                        <p className="text-xs text-emerald-500">{fmtCur(fDocObj.total_ttc,fDocObj.devise||"eur")}</p>
                      </div>
                      <button onClick={()=>{setFDocObj(null);setFDocSearch("");}} className={isDark?"text-white/30":"text-gray-400"}><X size={12}/></button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input value={fDocSearch} onChange={e=>setFDocSearch(e.target.value)} placeholder="Rechercher facture n°, sujet…"
                        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition ${isDark?"border-white/8 bg-white/4 text-white placeholder-white/20":"border-black/8 bg-gray-50 text-gray-900"}`}/>
                      {fDocSuggest.length>0 && (
                        <div className={`absolute top-full mt-1.5 w-full rounded-2xl border overflow-hidden z-10 ${isDark?"border-white/8 bg-[#07080e]":"border-black/8 bg-white shadow-lg"}`}>
                          {fDocSuggest.map(d=>(
                            <button key={d.id} onClick={()=>{setFDocObj(d);setFDocSearch("");setFDocSuggest([]);}}
                              className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition ${isDark?"hover:bg-white/5":"hover:bg-gray-50"}`}>
                              <FileText size={11} className={isDark?"text-white/30":"text-gray-400"}/>
                              <div className="min-w-0">
                                <p className={`text-xs font-semibold truncate ${isDark?"text-white/80":"text-gray-800"}`}>{d.sujet||d.numero}</p>
                                <p className={`text-xs ${isDark?"text-white/30":"text-gray-400"}`}>{d.numero} · {fmtCur(d.total_ttc,d.devise||"eur")}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Montant libre ou fixe */}
                {!fDocObj && (
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <label className={`text-xs font-semibold ${isDark?"text-white/40":"text-gray-500"}`}>Montant *</label>
                      <label className={`flex items-center gap-1.5 cursor-pointer text-xs font-semibold ${isDark?"text-white/40":"text-gray-500"}`}>
                        <input type="checkbox" checked={fFree} onChange={e=>setFFree(e.target.checked)} className="rounded"/>
                        Montant libre
                      </label>
                    </div>
                    {!fFree && (
                      <div className="flex gap-2">
                        <input value={fAmount} onChange={e=>setFAmount(e.target.value)} type="number" min="0.01" step="0.01" placeholder="120.00"
                          className={`flex-1 rounded-xl border px-3.5 py-2.5 text-sm outline-none transition ${isDark?"border-white/8 bg-white/4 text-white placeholder-white/20":"border-black/8 bg-gray-50 text-gray-900"}`}/>
                        <select value={fCurrency} onChange={e=>setFCurrency(e.target.value)}
                          className={`rounded-xl border px-3 py-2.5 text-sm outline-none transition uppercase font-bold ${isDark?"border-white/8 bg-white/4 text-white":"border-black/8 bg-gray-50 text-gray-900"}`}>
                          {CURRENCIES.map(c=><option key={c} value={c}>{c.toUpperCase()}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Options */}
                <div className={`rounded-xl border p-3.5 space-y-2.5 ${isDark?"border-white/6 bg-white/2":"border-black/6 bg-gray-50"}`}>
                  <p className={`text-xs font-bold uppercase tracking-widest ${isDark?"text-white/25":"text-gray-400"}`}>Options</p>
                  {[
                    {label:"Collecter le téléphone",state:fColPhone,set:setFColPhone},
                  ].map(({label,state,set})=>(
                    <label key={label} className="flex items-center justify-between cursor-pointer">
                      <span className={`text-xs font-medium ${isDark?"text-white/60":"text-gray-700"}`}>{label}</span>
                      <button type="button" onClick={()=>set(!state)}
                        className={`relative h-5 w-9 rounded-full border transition-all ${state?"border-emerald-500/40 bg-emerald-500/30":"border-white/15 bg-white/8"}`}>
                        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${state?"translate-x-4":"translate-x-0.5"}`}/>
                      </button>
                    </label>
                  ))}
                </div>

                {/* Expiration */}
                <div>
                  <label className={`mb-1 block text-xs font-semibold ${isDark?"text-white/40":"text-gray-500"}`}>Date d'expiration (optionnel)</label>
                  <input type="date" value={fExpire} onChange={e=>setFExpire(e.target.value)}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition ${isDark?"border-white/8 bg-white/4 text-white":"border-black/8 bg-gray-50 text-gray-900"}`}/>
                </div>

                {/* Message après paiement */}
                <div>
                  <label className={`mb-1 block text-xs font-semibold ${isDark?"text-white/40":"text-gray-500"}`}>Message après paiement</label>
                  <input value={fMsg} onChange={e=>setFMsg(e.target.value)} placeholder="Merci ! Vous recevrez un email de confirmation."
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition ${isDark?"border-white/8 bg-white/4 text-white placeholder-white/20":"border-black/8 bg-gray-50 text-gray-900"}`}/>
                </div>

                {/* Info Stripe */}
                <div className={`flex items-start gap-2 rounded-xl border p-3 ${isDark?"border-blue-500/15 bg-blue-500/5":"border-blue-300/40 bg-blue-50"}`}>
                  <AlertTriangle size={12} className="text-blue-400 shrink-0 mt-0.5"/>
                  <p className="text-xs text-blue-400 leading-relaxed">Le paiement passe par Stripe. Les fonds sont crédités sur votre compte Stripe après la collecte.</p>
                </div>
              </div>

              <div className={`flex gap-2 border-t px-5 py-4 sticky bottom-0 ${isDark?"border-white/6 bg-[#0e1420]":"border-black/6 bg-white"}`}>
                <button onClick={()=>setShowCreate(false)}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition ${isDark?"border-white/8 text-white/40 hover:bg-white/5":"border-black/8 text-gray-500 hover:bg-gray-50"}`}>
                  Annuler
                </button>
                <button onClick={()=>void createLink()} disabled={creating}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-black transition disabled:opacity-40 hover:brightness-110"
                  style={{background:`linear-gradient(135deg,${GOLD},#b08d45)`,color:"#0a0a0a"}}>
                  {creating ? <Loader2 size={14} className="animate-spin"/> : <Link2 size={14}/>}
                  Créer le lien
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
