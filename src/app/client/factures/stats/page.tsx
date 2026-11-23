"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTheme } from "@/lib/theme-context";
import {
  ArrowLeft, BarChart3, TrendingUp, Clock, Users,
  AlertTriangle, CheckCircle2, Loader2, Calendar, DollarSign,
  ChevronDown, FileText, Percent, ArrowUpRight, ArrowDownRight,
  RefreshCw, Info, Search, Globe,
} from "lucide-react";
import Link from "next/link";

const GOLD = "#FFB900";

// ─── Devises mondiales supportées ────────────────────────────────────────────

const CURRENCIES = [
  { code:"EUR", name:"Euro",            symbol:"€",    country:"France / Zone euro",   noDec:false },
  { code:"USD", name:"Dollar US",       symbol:"$",    country:"États-Unis",            noDec:false },
  { code:"GBP", name:"Livre sterling",  symbol:"£",    country:"Royaume-Uni",           noDec:false },
  { code:"XOF", name:"Franc CFA BCEAO", symbol:"FCFA", country:"Afrique de l'Ouest",   noDec:true  },
  { code:"XAF", name:"Franc CFA BEAC",  symbol:"FCFA", country:"Afrique Centrale",     noDec:true  },
  { code:"KMF", name:"Franc comorien",  symbol:"FC",   country:"Comores",              noDec:true  },
  { code:"MGA", name:"Ariary malgache", symbol:"Ar",   country:"Madagascar",           noDec:true  },
  { code:"NGN", name:"Naira",           symbol:"₦",    country:"Nigeria",              noDec:false },
  { code:"GHS", name:"Cedi",            symbol:"GH₵",  country:"Ghana",                noDec:false },
  { code:"KES", name:"Shilling kenyan", symbol:"KSh",  country:"Kenya",                noDec:false },
  { code:"ZAR", name:"Rand",            symbol:"R",    country:"Afrique du Sud",       noDec:false },
  { code:"MAD", name:"Dirham marocain", symbol:"DH",   country:"Maroc",                noDec:false },
  { code:"TND", name:"Dinar tunisien",  symbol:"DT",   country:"Tunisie",              noDec:false },
] as const;

type CurrencyCode = typeof CURRENCIES[number]["code"];

const NO_DEC = new Set<string>(CURRENCIES.filter(c => c.noDec).map(c => c.code));
const SYM: Record<string, string> = Object.fromEntries(CURRENCIES.map(c => [c.code, c.symbol]));

// ─── Types ────────────────────────────────────────────────────────────────────

interface Doc {
  id:             string;
  type:           "facture" | "avoir";
  statut:         string;
  numero:         string;
  client_nom:     string;
  client_societe: string;
  date_document:  string;
  date_echeance:  string | null;
  total_ttc:      number;
  total_ht:       number;
  montant_paye:   number;
  devise:         string;
}
interface Payment { document_id: string; amount: number; date: string }
type Period = "3m" | "6m" | "12m" | "all";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function r2(n: number) { return Math.round(n * 100) / 100; }

function fmt(n: number, d: string) {
  const nd = NO_DEC.has(d);
  const s = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: nd ? 0 : 2, maximumFractionDigits: nd ? 0 : 2,
  }).format(Math.abs(n));
  return (n < 0 ? "−" : "") + s + " " + (SYM[d] ?? d);
}

function fmtK(n: number, d: string) {
  const a = Math.abs(n), sym = SYM[d] ?? d;
  if (a >= 1_000_000) return (n < 0 ? "−" : "") + (a / 1_000_000).toFixed(1) + " M " + sym;
  if (a >= 1_000)     return (n < 0 ? "−" : "") + (a / 1_000).toFixed(1) + " k " + sym;
  return fmt(n, d);
}

function fmtAxis(n: number, d: string) {
  const sym = SYM[d] ?? d;
  if (n === 0) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "k";
  return String(Math.round(n)) + " " + sym;
}

function periodStart(p: Period): Date | null {
  if (p === "all") return null;
  const months = p === "3m" ? 3 : p === "6m" ? 6 : 12;
  const d = new Date(); d.setMonth(d.getMonth() - months); d.setDate(1); d.setHours(0,0,0,0);
  return d;
}
function inPeriod(dateStr: string, from: Date | null): boolean {
  return !from || dateStr >= from.toISOString().slice(0, 10);
}
function monthKey(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
function monthLabel(k: string) {
  const [y,m] = k.split("-");
  return new Date(+y,+m-1,1).toLocaleDateString("fr-FR",{month:"short",year:"2-digit"}).replace(".","");
}
function daysFromNow(s: string) { return Math.ceil((new Date(s).getTime()-Date.now())/86_400_000); }
function daysAgo(s: string)     { return Math.floor((Date.now()-new Date(s).getTime())/86_400_000); }

// ─── CurrencyPicker — sélecteur mondial avec recherche ───────────────────────

function CurrencyPicker({ value, onChange, dataCurrencies, isDark, bd }: {
  value: string;
  onChange: (v: string) => void;
  dataCurrencies: Set<string>;
  isDark: boolean;
  bd: string;
}) {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const cur = CURRENCIES.find(c => c.code === value) ?? CURRENCIES[0];

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return CURRENCIES as unknown as typeof CURRENCIES[number][];
    return (CURRENCIES as unknown as typeof CURRENCIES[number][]).filter(c =>
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const withData = filtered.filter(c => dataCurrencies.has(c.code));
  const noData   = filtered.filter(c => !dataCurrencies.has(c.code));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 rounded-xl border ${bd} px-3 py-1.5 text-xs font-semibold cursor-pointer transition hover:opacity-80
          ${isDark ? "bg-[#181c28] text-white/80" : "bg-white text-gray-700"}`}
      >
        <Globe size={11} style={{color:GOLD}}/>
        <span>{cur.code}</span>
        <span className={isDark?"text-white/35":"text-gray-400"}>·</span>
        <span>{cur.symbol}</span>
        {dataCurrencies.has(value) && (
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0"/>
        )}
        <ChevronDown size={11} className={`shrink-0 transition-transform ${open?"rotate-180":""} ${isDark?"text-white/40":"text-gray-400"}`}/>
      </button>

      {open && (
        <div
          className={`absolute left-0 z-[200] mt-1 w-72 rounded-2xl border shadow-2xl`}
          style={{
            background: isDark ? "#181c28" : "white",
            border: `1px solid ${isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.1)"}`,
            boxShadow: isDark?"0 16px 48px rgba(0,0,0,0.6)":"0 16px 48px rgba(0,0,0,0.14)",
          }}
        >
          {/* Search */}
          <div className={`flex items-center gap-2 border-b px-3 py-2.5`}
            style={{borderColor:isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)"}}>
            <Search size={11} className={isDark?"text-white/30":"text-gray-400"}/>
            <input
              autoFocus
              placeholder="Devise, pays, code ISO…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`flex-1 bg-transparent text-xs outline-none
                ${isDark?"text-white placeholder:text-white/30":"text-gray-700 placeholder:text-gray-400"}`}
            />
            {search && (
              <button onClick={() => setSearch("")} className={`text-xs ${isDark?"text-white/30 hover:text-white/60":"text-gray-300 hover:text-gray-500"}`}>✕</button>
            )}
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <p className={`px-4 py-4 text-xs text-center ${isDark?"text-white/30":"text-gray-400"}`}>Aucun résultat</p>
            )}

            {/* Avec données en premier */}
            {withData.length > 0 && (
              <>
                <p className={`px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider ${isDark?"text-white/25":"text-gray-400"}`}>
                  Vos données
                </p>
                {withData.map(c => (
                  <CurrencyRow key={c.code} c={c} selected={c.code===value} hasData isDark={isDark}
                    onClick={() => { onChange(c.code); setOpen(false); setSearch(""); }}/>
                ))}
              </>
            )}

            {/* Autres devises */}
            {noData.length > 0 && (
              <>
                {withData.length > 0 && (
                  <p className={`px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider ${isDark?"text-white/25":"text-gray-400"}`}>
                    Autres devises
                  </p>
                )}
                {noData.map(c => (
                  <CurrencyRow key={c.code} c={c} selected={c.code===value} hasData={false} isDark={isDark}
                    onClick={() => { onChange(c.code); setOpen(false); setSearch(""); }}/>
                ))}
              </>
            )}
          </div>

          <div className={`border-t px-3 py-2 text-[10px] ${isDark?"text-white/20 border-white/[0.05]":"text-gray-400 border-gray-100"}`}>
            13 devises supportées · Les montants ne sont jamais mélangés entre devises
          </div>
        </div>
      )}
    </div>
  );
}

function CurrencyRow({ c, selected, hasData, isDark, onClick }: {
  c: { code: string; name: string; symbol: string; country: string };
  selected: boolean; hasData: boolean; isDark: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-3 py-2 text-left transition
        ${selected
          ? (isDark?"bg-white/[0.07]":"bg-gray-50")
          : (isDark?"hover:bg-white/[0.04]":"hover:bg-gray-50/60")}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-bold ${isDark?"text-white/90":"text-gray-800"}`}>{c.code}</span>
          <span className={`text-xs ${isDark?"text-white/45":"text-gray-500"}`}>{c.symbol}</span>
          {hasData && (
            <span className="rounded-full px-1.5 py-px text-[9px] font-bold leading-none text-emerald-400"
              style={{background:"rgba(74,222,128,0.1)"}}>Données</span>
          )}
        </div>
        <p className={`text-[10px] leading-tight truncate ${isDark?"text-white/30":"text-gray-400"}`}>{c.name} · {c.country}</p>
      </div>
      {selected && <CheckCircle2 size={12} style={{color:GOLD,flexShrink:0}}/>}
    </button>
  );
}

// ─── DualBarChart avec axe Y ──────────────────────────────────────────────────

function DualBarChart({ data, isDark, devise }: {
  data: { label: string; facture: number; encaisse: number; current?: boolean }[];
  isDark: boolean; devise: string;
}) {
  const max    = Math.max(...data.flatMap(d => [d.facture, d.encaisse]), 1);
  const mid    = max / 2;
  const tFill  = isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.35)";
  const tFill3 = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.25)";

  // chart area: left margin for Y-axis labels
  const ML = 42, W = 560, H = 90, GW = 36;
  const GAP  = (W - data.length * GW) / (data.length + 1);
  const B    = Math.floor((GW - 3) / 2);
  const totalW = ML + W;

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-5 rounded-sm" style={{background:GOLD,opacity:.75}}/>
          <span className={`text-xs ${isDark?"text-white/50":"text-gray-500"}`}>Facturé TTC</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-5 rounded-sm bg-emerald-400" style={{opacity:.75}}/>
          <span className={`text-xs ${isDark?"text-white/50":"text-gray-500"}`}>Encaissé</span>
        </div>
      </div>
      <div style={{overflowX:"auto"}}>
        <svg viewBox={`0 0 ${totalW} ${H+28}`} width="100%" style={{display:"block",minWidth:320}}>
          {/* Y-axis labels */}
          {[{v:max,y:0},{v:mid,y:H/2},{v:0,y:H}].map(({v,y})=>(
            <text key={y} x={ML-4} y={y+4} textAnchor="end" fontSize={8}
              fill={tFill3} fontWeight="500">
              {fmtAxis(v,devise)}
            </text>
          ))}
          {/* Y-axis gridlines */}
          {[0,H/2,H].map(y=>(
            <line key={y} x1={ML} y1={y} x2={ML+W} y2={y} stroke={isDark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.06)"} strokeWidth={1}/>
          ))}

          {/* Bars */}
          {data.map((d,i) => {
            const x  = ML + GAP + i * (GW + GAP);
            const h1 = d.facture  > 0 ? Math.max(3, Math.round(d.facture  / max * H)) : 2;
            const h2 = d.encaisse > 0 ? Math.max(3, Math.round(d.encaisse / max * H)) : 2;
            return (
              <g key={d.label}>
                <title>{d.label} — Facturé : {fmtK(d.facture,devise)} / Encaissé : {fmtK(d.encaisse,devise)}</title>
                <rect x={x}     y={H-h1} width={B} height={h1} rx={3}
                  fill={d.current ? GOLD : (isDark?`${GOLD}55`:`${GOLD}66`)}/>
                <rect x={x+B+2} y={H-h2} width={B} height={h2} rx={3}
                  fill={d.current ? "#4ade80" : (isDark?"rgba(74,222,128,0.42)":"rgba(34,197,94,0.48)")}/>
                <text x={x+GW/2-1} y={H+16} textAnchor="middle" fontSize={9}
                  fill={d.current ? tFill : tFill3}
                  fontWeight={d.current?"700":"400"}>
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function DonutChart({ segs, isDark, devise }: {
  segs: {label:string;value:number;color:string}[]; isDark:boolean; devise:string;
}) {
  const total = segs.reduce((s,d)=>s+d.value,0);
  if (!total) return (
    <p className={`text-xs py-6 text-center ${isDark?"text-white/30":"text-gray-400"}`}>Aucune facture émise</p>
  );
  const CX=80,CY=80,R=62,IR=36;
  let startA = -Math.PI/2;
  const paths: {d:string;color:string;pct:string;label:string;value:number}[] = [];
  for (const seg of segs) {
    if (!seg.value) continue;
    const a = seg.value/total*2*Math.PI, endA = startA+a;
    const [x1,y1]=[CX+R*Math.cos(startA),CY+R*Math.sin(startA)];
    const [x2,y2]=[CX+R*Math.cos(endA),CY+R*Math.sin(endA)];
    const [xi1,yi1]=[CX+IR*Math.cos(startA),CY+IR*Math.sin(startA)];
    const [xi2,yi2]=[CX+IR*Math.cos(endA),CY+IR*Math.sin(endA)];
    const lg = a>Math.PI?1:0;
    paths.push({
      d:`M ${x1} ${y1} A ${R} ${R} 0 ${lg} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${IR} ${IR} 0 ${lg} 0 ${xi1} ${yi1} Z`,
      color:seg.color, pct:((seg.value/total)*100).toFixed(0)+"%", label:seg.label, value:seg.value,
    });
    startA = endA;
  }
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <svg viewBox="0 0 160 160" width={130} height={130} style={{flexShrink:0}}>
        {paths.map((p,i) => (
          <path key={i} d={p.d} fill={p.color} stroke={isDark?"#0f1117":"#fff"} strokeWidth={1.5}>
            <title>{p.label} — {fmtK(p.value,devise)} ({p.pct})</title>
          </path>
        ))}
        <text x={CX} y={CY-5} textAnchor="middle" fontSize={9.5}
          fill={isDark?"rgba(255,255,255,0.35)":"rgba(0,0,0,0.4)"} fontWeight="500">CA émis</text>
        <text x={CX} y={CY+10} textAnchor="middle" fontSize={10.5}
          fill={isDark?"rgba(255,255,255,0.8)":"rgba(0,0,0,0.75)"} fontWeight="800">
          {fmtK(total,devise)}
        </text>
      </svg>
      <div className="flex flex-col gap-1.5 min-w-0">
        {paths.map((p,i)=>(
          <div key={i} className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{background:p.color}}/>
            <span className={`text-xs font-semibold ${isDark?"text-white/70":"text-gray-600"}`}>{p.label}</span>
            <span className={`text-xs ${isDark?"text-white/35":"text-gray-500"}`}>({p.pct})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color, icon: Icon, bd, bg2, t1, t3, trend }: {
  label: string; value: string; sub?: string; color: string;
  icon: React.ElementType; bd: string; bg2: string; t1: string; t3: string;
  trend?: number | null;
}) {
  return (
    <div className={`rounded-2xl border ${bd} ${bg2} p-4 flex flex-col gap-2`}>
      <div className="flex items-center justify-between gap-2">
        <p className={`text-xs font-bold uppercase tracking-wider leading-tight ${t3}`}>{label}</p>
        <div className="shrink-0 flex h-6 w-6 items-center justify-center rounded-lg" style={{background:`${color}18`}}>
          <Icon size={12} style={{color}}/>
        </div>
      </div>
      <p className="text-xl font-black tabular-nums leading-none" style={{color}}>{value}</p>
      {trend !== undefined && trend !== null && (
        <span className="flex items-center gap-0.5 text-xs font-bold" style={{color: trend>=0?"#4ade80":"#f87171"}}>
          {trend>=0 ? <ArrowUpRight size={10}/> : <ArrowDownRight size={10}/>}
          {trend>=0?"+":""}{trend.toFixed(0)}% vs période préc.
        </span>
      )}
      {sub && <p className={`text-xs ${t3} leading-snug`}>{sub}</p>}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function Empty({ icon: Icon, title, sub, cta, ctaHref, isDark, t3 }: {
  icon: React.ElementType; title: string; sub: string;
  cta?: string; ctaHref?: string; isDark: boolean; t3: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isDark?"bg-white/[0.05]":"bg-gray-100"}`}>
        <Icon size={20} className={t3}/>
      </div>
      <div>
        <p className={`text-sm font-semibold ${isDark?"text-white/60":"text-gray-600"}`}>{title}</p>
        <p className={`mt-1 text-xs ${t3}`}>{sub}</p>
      </div>
      {cta && ctaHref && (
        <Link href={ctaHref} className="mt-1 rounded-xl px-4 py-2 text-xs font-bold transition hover:opacity-80"
          style={{background:`${GOLD}18`,color:GOLD}}>
          {cta}
        </Link>
      )}
    </div>
  );
}

// ─── Dropdown simple ──────────────────────────────────────────────────────────

function Dropdown({ value, options, onChange, isDark, bd }: {
  value: string; options: {label:string;value:string}[];
  onChange: (v:string)=>void; isDark: boolean; bd: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e=>onChange(e.target.value)}
        className={`appearance-none rounded-xl border ${bd} px-3 py-1.5 pr-7 text-xs font-semibold cursor-pointer
          ${isDark?"bg-[#181c28] text-white/80":"bg-white text-gray-700"}`}
      >
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={11} className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 ${isDark?"text-white/40":"text-gray-400"}`}/>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ label, icon: Icon, t1, t3 }: {
  label:string; icon:React.ElementType; t1:string; t3:string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex h-7 w-7 items-center justify-center rounded-xl" style={{background:`${GOLD}18`}}>
        <Icon size={14} style={{color:GOLD}}/>
      </div>
      <h2 className={`text-sm font-black uppercase tracking-widest ${t1}`}>{label}</h2>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function StatsPage() {
  const { isDark } = useTheme();

  // Data
  const [docs, setDocs]           = useState<Doc[]>([]);
  const [payments, setPayments]   = useState<Payment[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  // Filters
  const [period, setPeriod]             = useState<Period>("12m");
  const [currency, setCurrency]         = useState<string>("EUR");
  const [clientFilter, setClientFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Theme tokens
  const bg  = isDark ? "bg-[#0f1117]"        : "bg-gray-50";
  const bg2 = isDark ? "bg-[#181c28]"        : "bg-white";
  const bd  = isDark ? "border-white/[0.07]" : "border-gray-200";
  const t1  = isDark ? "text-white"          : "text-gray-900";
  const t2  = isDark ? "text-white/70"       : "text-gray-600";
  const t3  = isDark ? "text-white/40"       : "text-gray-500"; // meilleur contraste en clair

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/factures/stats");
      if (res.status === 401) { setError("Non authentifié"); return; }
      if (!res.ok) { setError("Erreur de chargement des données"); return; }
      const data = await res.json() as { docs: Doc[]; payments: Payment[] };
      const allDocs = (data.docs ?? []).map(d => ({
        ...d,
        total_ttc:    Number(d.total_ttc)    || 0,
        total_ht:     Number(d.total_ht)     || 0,
        montant_paye: Number(d.montant_paye) || 0,
        devise:       d.devise ?? "EUR",
      }));
      setDocs(allDocs);
      setPayments(data.payments ?? []);
      // Default = devise la plus fréquente dans les factures
      const counts: Record<string,number> = {};
      allDocs.filter(d=>d.type==="facture").forEach(d=>{ counts[d.devise]=(counts[d.devise]??0)+1; });
      const topDev = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0];
      if (topDev) setCurrency(topDev);
    } catch {
      setError("Erreur réseau — réessayez.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // ── Devises disponibles (avec données) ────────────────────────────────────

  const dataCurrencies = useMemo(()=>{
    const devs = new Set<string>();
    docs.filter(d=>d.type==="facture").forEach(d=>devs.add(d.devise));
    return devs;
  }, [docs]);

  const otherCurrencies = useMemo(()=>
    Array.from(dataCurrencies).filter(c=>c!==currency),
  [dataCurrencies, currency]);

  const clientNames = useMemo(()=>{
    const names = new Set<string>();
    docs.filter(d=>d.type==="facture").forEach(d=>{
      const n = d.client_societe || d.client_nom;
      if (n) names.add(n);
    });
    return Array.from(names).sort();
  }, [docs]);

  // ── Factures filtrées (période courante) ──────────────────────────────────

  const from = useMemo(()=>periodStart(period),[period]);

  const factures = useMemo(()=>{
    return docs.filter(d=>{
      if (d.type !== "facture") return false;
      if (!inPeriod(d.date_document, from)) return false;
      if (d.devise !== currency) return false;
      if (clientFilter !== "all" && (d.client_societe||d.client_nom) !== clientFilter) return false;
      if (statusFilter !== "all" && d.statut !== statusFilter) return false;
      return true;
    });
  }, [docs, from, currency, clientFilter, statusFilter]);

  // ── KPI computation ────────────────────────────────────────────────────────

  function computeKpis(src: Doc[], pays: Payment[]) {
    const emitted = src.filter(d=>["envoyé","en_retard","partiellement_payé","payé"].includes(d.statut));
    const facturé  = r2(emitted.reduce((s,d)=>s+(d.total_ttc||0),0));
    const encaissé = r2(emitted.reduce((s,d)=>s+(d.montant_paye||0),0));
    const en_attente = r2(src.filter(d=>["envoyé","partiellement_payé"].includes(d.statut))
      .reduce((s,d)=>s+(d.total_ttc||0)-(d.montant_paye||0),0));
    const en_retard = r2(src.filter(d=>d.statut==="en_retard")
      .reduce((s,d)=>s+(d.total_ttc||0)-(d.montant_paye||0),0));
    const taux = facturé > 0 ? Math.round(encaissé/facturé*100) : 0;
    const nb_factures = emitted.length;
    const nb_brouillons = src.filter(d=>d.statut==="brouillon").length;

    const paidIds = new Set(src.filter(d=>d.statut==="payé").map(d=>d.id));
    const lastPayDate: Record<string,string> = {};
    pays.filter(p=>paidIds.has(p.document_id)).forEach(p=>{
      if (!lastPayDate[p.document_id] || p.date > lastPayDate[p.document_id])
        lastPayDate[p.document_id] = p.date;
    });
    const delays = src.filter(d=>d.statut==="payé" && lastPayDate[d.id])
      .map(d=>Math.max(0,Math.floor(
        (new Date(lastPayDate[d.id]).getTime()-new Date(d.date_document).getTime())/86_400_000
      )));
    const delai_moyen = delays.length > 0
      ? Math.round(delays.reduce((s,v)=>s+v,0)/delays.length)
      : null;

    return { facturé, encaissé, en_attente, en_retard, taux, nb_factures, nb_brouillons, delai_moyen };
  }

  const kpis = useMemo(()=>computeKpis(factures, payments),[factures, payments]);

  // Période précédente pour tendances
  const prevFactures = useMemo(()=>{
    if (period === "all" || !from) return [];
    const months = period==="3m"?3:period==="6m"?6:12;
    const prevFrom = new Date(from); prevFrom.setMonth(prevFrom.getMonth()-months);
    return docs.filter(d=>{
      if (d.type!=="facture") return false;
      if (d.devise!==currency) return false;
      if (clientFilter!=="all"&&(d.client_societe||d.client_nom)!==clientFilter) return false;
      const dt = d.date_document;
      return dt >= prevFrom.toISOString().slice(0,10) && dt < from.toISOString().slice(0,10);
    });
  }, [docs, period, from, currency, clientFilter]);

  const prevKpis = useMemo(()=>computeKpis(prevFactures, payments),[prevFactures, payments]);

  const trendFacturé  = period!=="all" && prevKpis.facturé >0 ? ((kpis.facturé -prevKpis.facturé)/prevKpis.facturé)*100  : null;
  const trendEncaissé = period!=="all" && prevKpis.encaissé>0 ? ((kpis.encaissé-prevKpis.encaissé)/prevKpis.encaissé)*100 : null;

  const avgParFacture = kpis.nb_factures > 0 ? r2(kpis.facturé/kpis.nb_factures) : 0;

  // ── Section B: Graphique mensuel ───────────────────────────────────────────

  const monthly12 = useMemo(()=>{
    const now = new Date();
    const months = Array.from({length:12},(_,i)=>{
      const d = new Date(now.getFullYear(),now.getMonth()-(11-i),1);
      return {key:monthKey(d),label:monthLabel(monthKey(d)),facture:0,encaisse:0};
    });
    docs.filter(d=>d.type==="facture" && d.devise===currency
      && ["envoyé","en_retard","partiellement_payé","payé"].includes(d.statut))
      .forEach(d=>{
        const mk = d.date_document.slice(0,7);
        const m = months.find(mo=>mo.key===mk);
        if (m) { m.facture+=d.total_ttc||0; m.encaisse+=d.montant_paye||0; }
      });
    const curKey = monthKey(now);
    return months.map(m=>({...m,facture:r2(m.facture),encaisse:r2(m.encaisse),current:m.key===curKey}));
  }, [docs, currency]);

  // Répartition statuts (donut) — BROUILLONS EXCLUS du CA émis
  const statutSegs = useMemo(()=>{
    const byS: Record<string,number> = {};
    // On n'inclut QUE les factures émises — les brouillons ne sont PAS du CA
    factures
      .filter(d => d.statut !== "brouillon" && d.statut !== "annulé")
      .forEach(d => { byS[d.statut]=(byS[d.statut]||0)+(d.total_ttc||0); });
    return [
      {label:"Payé",          value:r2(byS["payé"]              ||0), color:"#4ade80"},
      {label:"En attente",    value:r2(byS["envoyé"]            ||0), color:"#60a5fa"},
      {label:"Partiel",       value:r2(byS["partiellement_payé"]||0), color:"#a78bfa"},
      {label:"En retard",     value:r2(byS["en_retard"]         ||0), color:"#f87171"},
    ].filter(s=>s.value>0);
  }, [factures]);

  // ── Section C: Clients ─────────────────────────────────────────────────────

  const clientStats = useMemo(()=>{
    const map = new Map<string,{nom:string;facturé:number;encaissé:number;count:number;impayé:number}>();
    factures.filter(d=>["envoyé","en_retard","partiellement_payé","payé"].includes(d.statut))
      .forEach(d=>{
        const nom = d.client_societe||d.client_nom||"—";
        const c = map.get(nom)?? {nom,facturé:0,encaissé:0,count:0,impayé:0};
        c.facturé  += d.total_ttc||0;
        c.encaissé += d.montant_paye||0;
        c.count++;
        if (["envoyé","en_retard","partiellement_payé"].includes(d.statut))
          c.impayé += (d.total_ttc||0)-(d.montant_paye||0);
        map.set(nom,c);
      });
    return Array.from(map.values())
      .map(c=>({...c,facturé:r2(c.facturé),encaissé:r2(c.encaissé),impayé:r2(c.impayé)}))
      .sort((a,b)=>b.facturé-a.facturé);
  }, [factures]);

  const topByFacturé  = useMemo(()=>clientStats.slice(0,6),[clientStats]);
  const topByEncaissé = useMemo(()=>[...clientStats].sort((a,b)=>b.encaissé-a.encaissé).filter(c=>c.encaissé>0).slice(0,6),[clientStats]);
  const clientsImpayés = useMemo(()=>clientStats.filter(c=>c.impayé>0.01).sort((a,b)=>b.impayé-a.impayé).slice(0,6),[clientStats]);

  const concentration = useMemo(()=>{
    const total = clientStats.reduce((s,c)=>s+c.facturé,0);
    const top3  = clientStats.slice(0,3).reduce((s,c)=>s+c.facturé,0);
    return total>0?Math.round(top3/total*100):0;
  },[clientStats]);

  // ── Section D: Suivi paiements ─────────────────────────────────────────────

  const today = new Date().toISOString().slice(0,10);

  const upcomingBuckets = useMemo(()=>{
    const pending = docs.filter(d=>{
      if (d.type!=="facture") return false;
      if (!["envoyé","partiellement_payé"].includes(d.statut)) return false;
      if (!d.date_echeance || d.date_echeance < today) return false;
      if (d.devise!==currency) return false;
      return true;
    }).sort((a,b)=>(a.date_echeance??"")<(b.date_echeance??"")?-1:1);

    type Bucket = {label:string;items:Doc[];total:number;color:string};
    const def: Bucket[] = [
      {label:"Aujourd'hui",items:[],total:0,color:"#f59e0b"},
      {label:"1–7 j",     items:[],total:0,color:"#fbbf24"},
      {label:"8–15 j",    items:[],total:0,color:"#60a5fa"},
      {label:"16–30 j",   items:[],total:0,color:"#818cf8"},
      {label:"31–60 j",   items:[],total:0,color:"#a78bfa"},
      {label:"60+ j",     items:[],total:0,color:"#c4b5fd"},
    ];
    pending.forEach(d=>{
      const days = daysFromNow(d.date_echeance!);
      const solde = (d.total_ttc||0)-(d.montant_paye||0);
      let idx = 5;
      if (days===0)       idx=0;
      else if (days<=7)   idx=1;
      else if (days<=15)  idx=2;
      else if (days<=30)  idx=3;
      else if (days<=60)  idx=4;
      def[idx].items.push(d);
      def[idx].total = r2(def[idx].total+solde);
    });
    return def.filter(b=>b.items.length>0);
  }, [docs, currency, today]);

  const overdueBuckets = useMemo(()=>{
    const ov = docs.filter(d=>d.type==="facture"&&d.statut==="en_retard"&&d.devise===currency);
    type AgeBucket = {label:string;count:number;total:number;color:string};
    const bs: AgeBucket[] = [
      {label:"1–30 j", count:0,total:0,color:"#fbbf24"},
      {label:"31–60 j",count:0,total:0,color:"#fb923c"},
      {label:"61–90 j",count:0,total:0,color:"#f87171"},
      {label:"90+ j",  count:0,total:0,color:"#dc2626"},
    ];
    ov.forEach(d=>{
      const days = d.date_echeance ? daysAgo(d.date_echeance) : 0;
      const solde = (d.total_ttc||0)-(d.montant_paye||0);
      let idx = 3;
      if (days<=30)      idx=0;
      else if (days<=60) idx=1;
      else if (days<=90) idx=2;
      bs[idx].count++;
      bs[idx].total = r2(bs[idx].total+solde);
    });
    return bs.filter(b=>b.count>0);
  }, [docs, currency]);

  const overdueList = useMemo(()=>{
    return docs.filter(d=>d.type==="facture"&&d.statut==="en_retard"&&d.devise===currency)
      .sort((a,b)=>{
        const da = a.date_echeance?daysAgo(a.date_echeance):0;
        const db = b.date_echeance?daysAgo(b.date_echeance):0;
        return db-da;
      }).slice(0,10);
  }, [docs, currency]);

  // ── Render ─────────────────────────────────────────────────────────────────

  const tk = {bd,bg2,t1,t3};

  return (
    <div className={`flex h-screen flex-col overflow-hidden ${bg}`}>

      {/* ── Header ── */}
      <div className={`flex shrink-0 items-center justify-between border-b ${bd} ${isDark?"bg-[#0f1117]/98":"bg-white"} px-4 py-2.5 backdrop-blur gap-3 flex-wrap`}>
        <Link href="/client/factures"
          className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm ${t2} transition hover:bg-white/[0.05]`}>
          <ArrowLeft size={14}/> Factures
        </Link>

        <div className="flex items-center gap-2">
          <BarChart3 size={14} style={{color:GOLD}}/>
          <span className={`text-sm font-black ${t1}`}>Statistiques</span>
        </div>

        {/* Période */}
        <div className={`flex items-center gap-px rounded-xl border ${bd} p-0.5`}
          style={{background:isDark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.03)"}}>
          {(["3m","6m","12m","all"] as Period[]).map(p=>(
            <button key={p} onClick={()=>setPeriod(p)}
              className={`rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-wide transition ${period===p?"text-[#0a0a0a]":`${t3} hover:opacity-70`}`}
              style={period===p?{background:`linear-gradient(135deg,${GOLD},#b08d45)`}:{}}>
              {p==="all"?"Tout":p==="3m"?"3M":p==="6m"?"6M":"12M"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Barre de filtres ── */}
      <div className={`shrink-0 flex items-center gap-2 border-b ${bd} px-4 py-2 flex-wrap`}
        style={{background:isDark?"rgba(255,255,255,0.015)":"rgba(0,0,0,0.015)"}}>

        {/* Devise mondiale — sélecteur avec recherche */}
        <CurrencyPicker
          value={currency}
          onChange={setCurrency}
          dataCurrencies={dataCurrencies}
          isDark={isDark}
          bd={bd}
        />

        {/* Client */}
        <Dropdown
          value={clientFilter}
          onChange={setClientFilter}
          isDark={isDark} bd={bd}
          options={[
            {value:"all",label:"Tous les clients"},
            ...clientNames.map(n=>({value:n,label:n})),
          ]}
        />

        {/* Statut */}
        <Dropdown
          value={statusFilter}
          onChange={setStatusFilter}
          isDark={isDark} bd={bd}
          options={[
            {value:"all",        label:"Tous statuts"},
            {value:"payé",       label:"Payé"},
            {value:"envoyé",     label:"En attente"},
            {value:"en_retard",  label:"En retard"},
            {value:"partiellement_payé",label:"Partiel"},
            {value:"brouillon",  label:"Brouillon"},
            {value:"annulé",     label:"Annulé"},
          ]}
        />

        {/* Reload */}
        <button onClick={()=>void load()}
          className={`flex items-center gap-1.5 rounded-xl border ${bd} px-3 py-1.5 text-xs font-semibold transition hover:opacity-70 ${t3}`}>
          <RefreshCw size={11}/> Actualiser
        </button>

        {/* Alerte multi-devises — données disponibles dans d'autres devises */}
        {otherCurrencies.length > 0 && (
          <div className="flex items-center gap-1 text-xs" style={{color:GOLD}}>
            <Info size={11}/>
            <span>Données aussi en : {otherCurrencies.join(", ")}</span>
          </div>
        )}
      </div>

      {/* ── Corps ── */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 size={22} className="animate-spin" style={{color:GOLD}}/>
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <AlertTriangle size={28} style={{color:"#f87171"}}/>
            <p className={`text-sm font-semibold ${isDark?"text-white/60":"text-gray-500"}`}>{error}</p>
            <button onClick={()=>void load()}
              className="rounded-xl px-4 py-2 text-xs font-bold transition hover:opacity-80"
              style={{background:`${GOLD}18`,color:GOLD}}>
              Réessayer
            </button>
          </div>
        ) : (
          <div className="mx-auto max-w-5xl space-y-6 p-4 pb-8">

            {/* ═══════════════════════════════════════════
                SECTION A — Indicateurs financiers
            ═══════════════════════════════════════════ */}
            <section>
              <SectionHeader label="Indicateurs financiers" icon={DollarSign} t1={t1} t3={t3}/>

              {/* Alerte si aucune donnée pour cette devise */}
              {!dataCurrencies.has(currency) && currency && (
                <div className={`mb-4 rounded-xl border p-4 flex items-start gap-3`}
                  style={{
                    background:isDark?"rgba(255,185,0,0.06)":"rgba(255,185,0,0.05)",
                    borderColor:"rgba(255,185,0,0.2)",
                  }}>
                  <Globe size={16} style={{color:GOLD,flexShrink:0,marginTop:1}}/>
                  <div>
                    <p className={`text-sm font-semibold ${t1}`}>Aucune facture en {currency}</p>
                    <p className={`text-xs ${t3} mt-0.5`}>
                      {dataCurrencies.size > 0
                        ? `Vos données existent en : ${Array.from(dataCurrencies).join(", ")}. Sélectionnez une de ces devises pour voir vos indicateurs.`
                        : "Créez votre première facture pour voir les indicateurs financiers."}
                    </p>
                  </div>
                </div>
              )}

              {factures.filter(d=>d.statut!=="brouillon"&&d.statut!=="annulé").length === 0 ? (
                dataCurrencies.has(currency) ? (
                  <Empty
                    icon={FileText} title="Aucune facture émise sur cette période"
                    sub="Les brouillons ne sont pas comptabilisés comme CA."
                    cta="Créer une facture" ctaHref="/client/factures"
                    isDark={isDark} t3={t3}
                  />
                ) : null
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <KpiCard
                    label="CA Facturé TTC"
                    value={fmtK(kpis.facturé, currency)}
                    sub={`${kpis.nb_factures} facture${kpis.nb_factures!==1?"s":""} émise${kpis.nb_factures!==1?"s":""}`}
                    color={GOLD} icon={TrendingUp}
                    trend={trendFacturé}
                    {...tk}
                  />
                  <KpiCard
                    label="CA Encaissé"
                    value={fmtK(kpis.encaissé, currency)}
                    sub={kpis.encaissé < kpis.facturé ? `Reste ${fmtK(r2(kpis.facturé-kpis.encaissé), currency)}` : "Tout encaissé ✓"}
                    color="#4ade80" icon={CheckCircle2}
                    trend={trendEncaissé}
                    {...tk}
                  />
                  <KpiCard
                    label="En attente"
                    value={fmtK(kpis.en_attente, currency)}
                    sub="Envoyées non encore payées"
                    color="#60a5fa" icon={Clock}
                    {...tk}
                  />
                  <KpiCard
                    label="Créances en retard"
                    value={fmtK(kpis.en_retard, currency)}
                    sub={kpis.en_retard>0?"Échéance dépassée":"Aucun impayé en retard ✓"}
                    color={kpis.en_retard>0?"#f87171":"#4ade80"} icon={kpis.en_retard>0?AlertTriangle:CheckCircle2}
                    {...tk}
                  />
                  <KpiCard
                    label="Taux recouvrement"
                    value={`${kpis.taux} %`}
                    sub={kpis.taux>=80?"Excellent":kpis.taux>=50?"À surveiller":"Taux faible"}
                    color={kpis.taux>=80?"#4ade80":kpis.taux>=50?GOLD:"#f87171"} icon={Percent}
                    {...tk}
                  />
                  <KpiCard
                    label="Délai règlement"
                    value={kpis.delai_moyen!==null?`${kpis.delai_moyen} j`:"—"}
                    sub="Moyenne entre émission et paiement"
                    color="#a78bfa" icon={Calendar}
                    {...tk}
                  />
                  <KpiCard
                    label="Factures émises"
                    value={String(kpis.nb_factures)}
                    sub={`Moy. ${fmtK(avgParFacture, currency)} / facture`}
                    color={GOLD} icon={FileText}
                    {...tk}
                  />
                  <KpiCard
                    label="Brouillons"
                    value={String(kpis.nb_brouillons)}
                    sub={kpis.nb_brouillons>0?"Non émis, non comptabilisés":"Aucun brouillon en attente"}
                    color={kpis.nb_brouillons>0?"#fb923c":"#4ade80"} icon={FileText}
                    {...tk}
                  />
                </div>
              )}
            </section>

            {/* ═══════════════════════════════════════════
                SECTION B — Analyse des ventes
            ═══════════════════════════════════════════ */}
            <section>
              <SectionHeader label="Analyse des ventes" icon={BarChart3} t1={t1} t3={t3}/>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">

                {/* Graphique double barres 12 mois */}
                <div className={`rounded-2xl border ${bd} ${bg2} p-5`}>
                  <div className="mb-3">
                    <p className={`text-sm font-bold ${t1}`}>Facturé vs Encaissé — 12 mois glissants</p>
                    <p className={`text-xs ${t3}`}>Par mois de facturation · {currency} · Factures émises uniquement</p>
                  </div>
                  {monthly12.every(m=>m.facture===0) ? (
                    <Empty icon={BarChart3} title="Pas encore de données"
                      sub="Les factures apparaîtront ici au fil des mois."
                      isDark={isDark} t3={t3}/>
                  ) : (
                    <DualBarChart data={monthly12} isDark={isDark} devise={currency}/>
                  )}
                </div>

                {/* Répartition statuts — BROUILLONS EXCLUS */}
                <div className={`rounded-2xl border ${bd} ${bg2} p-5`}>
                  <div className="mb-1">
                    <p className={`text-sm font-bold ${t1}`}>Répartition statuts</p>
                    <p className={`text-xs ${t3}`}>Factures émises — brouillons exclus</p>
                  </div>
                  <div className="mt-4">
                    {factures.filter(d=>d.statut!=="brouillon"&&d.statut!=="annulé").length===0 ? (
                      <Empty icon={BarChart3} title="Aucune facture émise" sub="" isDark={isDark} t3={t3}/>
                    ) : (
                      <DonutChart segs={statutSegs} isDark={isDark} devise={currency}/>
                    )}
                  </div>
                  {/* Note brouillons séparés */}
                  {kpis.nb_brouillons > 0 && (
                    <div className={`mt-3 rounded-xl px-3 py-2 text-xs flex items-center gap-1.5 ${isDark?"bg-white/[0.03] text-white/35":"bg-gray-50 text-gray-500"}`}>
                      <Info size={10}/>
                      {kpis.nb_brouillons} brouillon{kpis.nb_brouillons!==1?"s":""} non inclus dans le CA
                    </div>
                  )}
                  {avgParFacture > 0 && (
                    <div className={`mt-3 rounded-xl border ${bd} px-3 py-2.5`}
                      style={{background:isDark?"rgba(255,255,255,0.025)":"rgba(0,0,0,0.025)"}}>
                      <p className={`text-xs ${t3}`}>Montant moyen / facture</p>
                      <p className="text-base font-black tabular-nums mt-0.5" style={{color:GOLD}}>
                        {fmtK(avgParFacture, currency)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ═══════════════════════════════════════════
                SECTION C — Analyse clients
            ═══════════════════════════════════════════ */}
            <section>
              <SectionHeader label="Analyse clients" icon={Users} t1={t1} t3={t3}/>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                {/* Top clients par facturé */}
                <div className={`rounded-2xl border ${bd} ${bg2} p-5`}>
                  <div className="mb-4 flex items-center justify-between">
                    <p className={`text-sm font-bold ${t1}`}>Top clients — CA facturé</p>
                    <Users size={12} style={{color:GOLD}}/>
                  </div>
                  {topByFacturé.length===0 ? (
                    <Empty icon={Users} title="Aucun client" sub="Ajoutez des factures pour voir vos clients." isDark={isDark} t3={t3}/>
                  ) : (
                    <ClientBars clients={topByFacturé} field="facturé" devise={currency} isDark={isDark} t1={t1} t3={t3} bd={bd}/>
                  )}
                </div>

                {/* Top clients par encaissé — état vide clair si aucun paiement */}
                <div className={`rounded-2xl border ${bd} ${bg2} p-5`}>
                  <div className="mb-4 flex items-center justify-between">
                    <p className={`text-sm font-bold ${t1}`}>Top clients — CA encaissé</p>
                    <CheckCircle2 size={12} style={{color:"#4ade80"}}/>
                  </div>
                  {topByEncaissé.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-6 text-center">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isDark?"bg-white/[0.04]":"bg-gray-100"}`}>
                        <Clock size={18} className={t3}/>
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${isDark?"text-white/60":"text-gray-600"}`}>
                          Aucun encaissement enregistré
                        </p>
                        <p className={`mt-1 text-xs ${t3}`}>
                          Aucun paiement reçu sur cette période.
                        </p>
                      </div>
                      <Link href="/client/factures"
                        className="rounded-xl px-4 py-2 text-xs font-bold transition hover:opacity-80"
                        style={{background:`${GOLD}18`,color:GOLD}}>
                        Voir les factures en attente
                      </Link>
                    </div>
                  ) : (
                    <ClientBars clients={topByEncaissé} field="encaissé" devise={currency} isDark={isDark} t1={t1} t3={t3} bd={bd}/>
                  )}
                </div>

                {/* Clients avec impayés */}
                <div className={`rounded-2xl border ${bd} ${bg2} p-5`}>
                  <div className="mb-4 flex items-center justify-between">
                    <p className={`text-sm font-bold ${t1}`}>Clients avec impayés</p>
                    <AlertTriangle size={12} style={{color:"#f87171"}}/>
                  </div>
                  {clientsImpayés.length===0 ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <CheckCircle2 size={22} className="text-emerald-400"/>
                      <p className="text-xs font-semibold text-emerald-400">Tous vos clients sont à jour !</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {clientsImpayés.map(c=>(
                        <div key={c.nom} className="flex items-center justify-between gap-2">
                          <p className={`truncate text-xs font-semibold ${t1}`}>{c.nom}</p>
                          <p className="shrink-0 text-xs font-black tabular-nums text-red-400">
                            {fmtK(c.impayé, currency)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Concentration CA */}
                <div className={`rounded-2xl border ${bd} ${bg2} p-5`}>
                  <p className={`mb-1 text-sm font-bold ${t1}`}>Concentration CA</p>
                  <p className={`mb-4 text-xs ${t3}`}>Part des 3 premiers clients dans le CA facturé</p>
                  {clientStats.length === 0 ? (
                    <Empty icon={Percent} title="Pas encore de données" sub="" isDark={isDark} t3={t3}/>
                  ) : (
                    <>
                      <div className="relative h-4 w-full overflow-hidden rounded-full"
                        style={{background:isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.06)"}}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{
                            width:`${concentration}%`,
                            background:concentration>=80?`linear-gradient(90deg,#f87171,#dc2626)`:
                              concentration>=60?`linear-gradient(90deg,${GOLD},#b08d45)`:
                              `linear-gradient(90deg,#4ade80,#22c55e)`,
                          }}/>
                      </div>
                      <div className="mt-3 flex items-baseline justify-between">
                        <p className="text-3xl font-black tabular-nums" style={{color:GOLD}}>{concentration}%</p>
                        <p className={`text-xs ${t3} text-right max-w-[60%]`}>
                          {concentration>=80?"Concentration élevée — dépendance client à réduire":
                            concentration>=60?"Concentration modérée — diversification conseillée":
                            "Bon niveau de diversification"}
                        </p>
                      </div>
                      <div className="mt-3 space-y-1">
                        {clientStats.slice(0,3).map((c,i)=>(
                          <div key={c.nom} className="flex items-center justify-between gap-2">
                            <span className={`text-xs ${t3}`}>{i+1}. {c.nom}</span>
                            <span className={`text-xs font-bold ${t1}`}>{fmtK(c.facturé,currency)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* ═══════════════════════════════════════════
                SECTION D — Suivi des paiements
            ═══════════════════════════════════════════ */}
            <section>
              <SectionHeader label="Suivi des paiements" icon={Calendar} t1={t1} t3={t3}/>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                {/* Encaissements à venir */}
                <div className={`rounded-2xl border ${bd} ${bg2} p-5`}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className={`text-sm font-bold ${t1}`}>Encaissements à venir</p>
                    <TrendingUp size={13} style={{color:"#60a5fa"}}/>
                  </div>
                  {upcomingBuckets.length===0 ? (
                    <Empty icon={Clock} title="Aucun encaissement planifié"
                      sub="Vos factures envoyées avec date d'échéance apparaissent ici."
                      cta="Voir les factures" ctaHref="/client/factures"
                      isDark={isDark} t3={t3}/>
                  ) : (
                    <div className="space-y-3">
                      {upcomingBuckets.map(b=>(
                        <div key={b.label}>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full" style={{background:b.color}}/>
                              <span className={`text-xs font-semibold ${t1}`}>{b.label}</span>
                              <span className={`text-xs ${t3}`}>{b.items.length} facture{b.items.length!==1?"s":""}</span>
                            </div>
                            <span className="text-sm font-black tabular-nums" style={{color:b.color}}>
                              {fmtK(b.total,currency)}
                            </span>
                          </div>
                          {b.items.slice(0,3).map(d=>(
                            <div key={d.id} className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 ml-4 ${isDark?"hover:bg-white/[0.02]":"hover:bg-gray-50"} transition`}>
                              <span className={`truncate text-xs ${t2}`}>{d.client_societe||d.client_nom||"—"}</span>
                              <span className={`shrink-0 text-xs font-semibold tabular-nums ${t3}`}>{fmtK(d.total_ttc-(d.montant_paye||0),currency)}</span>
                            </div>
                          ))}
                          {b.items.length > 3 && (
                            <p className={`ml-4 text-xs ${t3}`}>+{b.items.length-3} autre{b.items.length-3!==1?"s":""}</p>
                          )}
                        </div>
                      ))}
                      <p className={`pt-1 text-center text-xs font-semibold ${t3}`}>
                        Total : {fmtK(r2(upcomingBuckets.reduce((s,b)=>s+b.total,0)),currency)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Créances en retard */}
                <div className={`rounded-2xl border ${bd} ${bg2} p-5`}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className={`text-sm font-bold ${t1}`}>Créances en retard</p>
                    <AlertTriangle size={13} style={{color:"#f87171"}}/>
                  </div>
                  {overdueList.length===0 ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <CheckCircle2 size={24} className="text-emerald-400"/>
                      <p className="text-xs font-semibold text-emerald-400">Aucune créance en retard</p>
                    </div>
                  ) : (
                    <>
                      {overdueBuckets.length > 0 && (
                        <div className="mb-4 grid grid-cols-2 gap-2">
                          {overdueBuckets.map(b=>(
                            <div key={b.label} className={`rounded-xl border px-3 py-2`}
                              style={{borderColor:`${b.color}44`,background:`${b.color}0d`}}>
                              <p className="text-xs font-bold" style={{color:b.color}}>{b.label}</p>
                              <p className="text-sm font-black tabular-nums mt-0.5" style={{color:b.color}}>{fmtK(b.total,currency)}</p>
                              <p className={`text-xs ${t3}`}>{b.count} facture{b.count!==1?"s":""}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="space-y-1.5">
                        {overdueList.map(d=>{
                          const days = d.date_echeance ? daysAgo(d.date_echeance) : 0;
                          const color = days>90?"#dc2626":days>60?"#f87171":days>30?"#fb923c":"#fbbf24";
                          return (
                            <div key={d.id} className={`flex items-center gap-2 rounded-xl px-3 py-2 ${isDark?"hover:bg-white/[0.03]":"hover:bg-gray-50"} transition`}>
                              <div className="min-w-0 flex-1">
                                <p className={`truncate text-xs font-semibold ${t1}`}>{d.client_societe||d.client_nom||"—"}</p>
                                <p className={`text-xs ${t3}`}>{d.numero}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-black tabular-nums" style={{color:"#f87171"}}>{fmtK((d.total_ttc||0)-(d.montant_paye||0),currency)}</p>
                                <p className="text-xs font-bold" style={{color}}>J+{days}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p className="mt-2 text-center text-xs font-semibold text-red-400">
                        Total impayé : {fmtK(kpis.en_retard, currency)}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* Footer */}
            {docs.length > 0 && (
              <p className={`pb-2 text-center text-xs ${t3}`}>
                {docs.filter(d=>d.type==="facture").length} facture{docs.filter(d=>d.type==="facture").length!==1?"s":""} analysée{docs.filter(d=>d.type==="facture").length!==1?"s":""}
                {dataCurrencies.size > 1 && ` · ${dataCurrencies.size} devises détectées`}
                {" · Données en temps réel · Les devises ne sont jamais mélangées"}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Client Bars ───────────────────────────────────────────────────────────────

type ClientRow = {nom:string;facturé:number;encaissé:number;count:number;impayé:number};

function ClientBars({ clients, field, devise, isDark, t1, t3, bd }: {
  clients: ClientRow[];
  field: "facturé" | "encaissé";
  devise: string;
  isDark: boolean;
  t1: string; t3: string; bd: string;
}) {
  const max = clients[0]?.[field] || 1;
  const color = field === "facturé" ? GOLD : "#4ade80";
  return (
    <div className="space-y-3">
      {clients.map((c,i)=>(
        <div key={c.nom}>
          <div className="flex items-baseline justify-between gap-2">
            <span className={`truncate text-xs font-semibold ${t1}`}>
              <span className={`mr-1.5 tabular-nums ${t3}`}>{i+1}.</span>{c.nom}
            </span>
            <span className="shrink-0 text-sm font-black tabular-nums" style={{color}}>
              {fmtK(c[field], devise)}
            </span>
          </div>
          <div className={`mt-1 h-1 w-full overflow-hidden rounded-full ${isDark?"bg-white/[0.06]":"bg-gray-100"}`}>
            <div className="h-full rounded-full transition-all duration-500" style={{
              width:`${(c[field]/max)*100}%`,
              background:color,
              opacity: i===0?1:Math.max(0.35, 0.9-i*0.12),
            }}/>
          </div>
          <p className={`mt-0.5 text-[11px] ${t3}`}>{c.count} facture{c.count!==1?"s":""}</p>
        </div>
      ))}
    </div>
  );
}
