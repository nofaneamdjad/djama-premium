"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ReceiptText, Users, Timer, Receipt, FileText, Search,
  TrendingUp, StickyNote, Star, Zap, CalendarRange,
  Clock, Euro, UserCheck, TrendingDown, ArrowUpRight,
  AlertTriangle, ChevronRight,
  FileBarChart2, Loader2, X, ShieldCheck, Lightbulb,
  Plus, CheckCircle2, CircleDot, Send,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fmtEurInt, fmtDuration } from "@/lib/format";

const GOLD = "#c9a55a";

const TOOLS = [
  { href: "/client/factures",    label: "Factures & Devis",  desc: "Créez et envoyez vos documents",     icon: ReceiptText,  hue: "#3b82f6" },
  { href: "/client/crm",         label: "CRM Contacts",      desc: "Gérez vos prospects et clients",     icon: Users,        hue: "#6366f1" },
  { href: "/client/chrono",      label: "Chrono Pro",        desc: "Suivez le temps par projet",         icon: Timer,        hue: "#a78bfa" },
  { href: "/client/depenses",    label: "Dépenses",          desc: "Catégorisez vos frais pros",         icon: Receipt,      hue: "#f97316" },
  { href: "/client/contrats",    label: "Contrats IA",       desc: "Générez des contrats en secondes",   icon: FileText,     hue: GOLD      },
  { href: "/client/sourcing",    label: "Sourcing IA",       desc: "Trouvez les meilleurs fournisseurs", icon: Search,       hue: "#818cf8" },
  { href: "/client/tresorerie",  label: "Trésorerie",        desc: "Pilotez votre cash-flow",            icon: TrendingUp,   hue: "#10b981" },
  { href: "/client/bloc-notes",  label: "Bloc-notes",        desc: "Capturez vos idées rapidement",      icon: StickyNote,   hue: "#fbbf24" },
  { href: "/client/reputation",  label: "Réputation",        desc: "Collectez et gérez vos avis",        icon: Star,         hue: "#f59e0b" },
  { href: "/client/assistant",   label: "Assistant IA",      desc: "Relances et actions intelligentes",  icon: Zap,          hue: "#22d3ee" },
  { href: "/client/planification",label: "Planification",    desc: "Organisez l'agenda de l'équipe",     icon: CalendarRange,hue: "#0ea5e9" },
] as const;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Bonjour";
  if (h >= 12 && h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function startOfWeekISO(): string {
  const d = new Date(), day = d.getDay(), diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d); mon.setDate(d.getDate() + diff);
  return mon.toISOString().slice(0, 10);
}

function startOfMonthISO(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function fmtFullDate(): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(new Date());
}

interface RecentInvoice {
  id: string;
  numero: string;
  client_nom: string;
  total_ttc: number;
  statut: string;
  created_at: string;
}

interface Stats {
  caThisMois: number;
  heuresSemaine: number;
  depensesMois: number;
  contactsActifs: number;
}
interface MonthRevenue { label: string; amount: number; }
interface TopClient { name: string; amount: number; }
interface OverdueInvoice {
  id: string; numero: string; client_nom: string;
  total_ttc: number; date_echeance: string | null;
}
type Rapport = {
  mois: string; score_sante: number; resume_executif: string;
  kpis: { revenu_total: number; depenses_totales: number; resultat_net: number; taux_recouvrement: string; nb_factures: number; nb_clients: number };
  top_clients: { nom: string; montant: number }[];
  top_depenses: { categorie: string; montant: number }[];
  points_forts: string[]; alertes: string[];
  recommandations: string[]; objectif_mois_prochain: string;
};

const SHORT_MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

function ToolCard({ item, delay = 0 }: { item: typeof TOOLS[number]; delay?: number }) {
  const Icon = item.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Link href={item.href} className="group block">
        <motion.div
          whileHover={{ scale: 1.02, x: 4 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 420, damping: 20 }}
          className="flex items-center gap-3 rounded-2xl px-3.5 py-3"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `${item.hue}22`, border: `1px solid ${item.hue}30` }}>
            <Icon size={14} style={{ color: item.hue }} strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.78rem] font-semibold text-white/70 group-hover:text-white transition-colors">{item.label}</p>
            <p className="truncate text-[0.64rem] text-white/30">{item.desc}</p>
          </div>
          <ChevronRight size={12} className="shrink-0 text-white/15 group-hover:text-white/45 transition-colors" />
        </motion.div>
      </Link>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [userName,      setUserName]      = useState("");
  const [stats,         setStats]         = useState<Stats | null>(null);
  const [statsLoading,  setStatsLoading]  = useState(true);
  const [revenues,      setRevenues]      = useState<MonthRevenue[]>([]);
  const [topClients,    setTopClients]    = useState<TopClient[]>([]);
  const [overdue,       setOverdue]       = useState<OverdueInvoice[]>([]);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [rapportOpen,    setRapportOpen]    = useState(false);
  const [rapportLoading, setRapportLoading] = useState(false);
  const [rapport,        setRapport]        = useState<Rapport | null>(null);

  useEffect(() => {
    async function loadAll() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setStatsLoading(false); setChartsLoading(false); return; }

      const name =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        user.email?.split("@")[0] || "";
      setUserName(name);

      const weekStart  = startOfWeekISO();
      const monthStart = startOfMonthISO();

      const [docsRes, timeRes, expRes, crmRes] = await Promise.all([
        supabase.from("documents").select("total_ttc").eq("user_id", user.id).eq("type","facture").in("statut",["envoyé","payé"]).gte("created_at", new Date(monthStart+"T00:00:00").toISOString()),
        supabase.from("time_entries").select("duration_minutes").eq("user_id", user.id).gte("date", weekStart),
        supabase.from("expenses").select("amount").eq("user_id", user.id).gte("date", monthStart),
        supabase.from("contacts").select("id",{ count:"exact", head:true }).eq("user_id", user.id).eq("status","actif"),
      ]);

      setStats({
        caThisMois:     (docsRes.data ?? []).reduce((s,d) => s+(d.total_ttc ?? 0), 0),
        heuresSemaine:  (timeRes.data ?? []).reduce((s,e) => s+(e.duration_minutes ?? 0), 0),
        depensesMois:   (expRes.data  ?? []).reduce((s,e) => s+(e.amount ?? 0), 0),
        contactsActifs: crmRes.count ?? 0,
      });
      setStatsLoading(false);

      const today = new Date();
      /* ── 1 requête pour 6 mois (au lieu de 6 séquentielles) ── */
      const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1).toISOString().slice(0, 10);
      const { data: revRaw } = await supabase
        .from("documents")
        .select("total_ttc, date_document")
        .eq("user_id", user.id)
        .eq("type", "facture")
        .eq("statut", "payé")
        .gte("date_document", sixMonthsAgo);

      const monthData: MonthRevenue[] = [];
      for (let i = 5; i >= 0; i--) {
        const d  = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const yr = d.getFullYear();
        const mo = d.getMonth();
        const amount = (revRaw ?? [])
          .filter(r => {
            const rd = new Date((r.date_document as string) + "T12:00:00");
            return rd.getFullYear() === yr && rd.getMonth() === mo;
          })
          .reduce((s, r) => s + ((r.total_ttc as number) ?? 0), 0);
        monthData.push({ label: SHORT_MONTHS[mo], amount });
      }
      setRevenues(monthData);

      /* ── Recent invoices ── */
      const { data: recentDocs } = await supabase
        .from("documents")
        .select("id,numero,client_nom,total_ttc,statut,created_at")
        .eq("user_id", user.id)
        .eq("type", "facture")
        .order("created_at", { ascending: false })
        .limit(6);
      setRecentInvoices((recentDocs ?? []) as RecentInvoice[]);

      const threeAgo = new Date(today.getFullYear(), today.getMonth()-3, 1).toISOString().slice(0,10);
      const { data: paidDocs } = await supabase.from("documents").select("client_nom,total_ttc").eq("user_id", user.id).eq("type","facture").eq("statut","payé").gte("date_document",threeAgo);
      const clientMap = new Map<string,number>();
      for (const d of (paidDocs ?? [])) {
        const n = (d.client_nom as string) || "Inconnu";
        clientMap.set(n, (clientMap.get(n) ?? 0) + ((d.total_ttc as number) ?? 0));
      }
      setTopClients([...clientMap.entries()].sort((a,b) => b[1]-a[1]).slice(0,5).map(([name,amount]) => ({ name, amount })));

      const { data: overdueDocs } = await supabase.from("documents").select("id,numero,client_nom,total_ttc,date_echeance").eq("user_id", user.id).eq("type","facture").eq("statut","en_retard").order("date_echeance",{ascending:true}).limit(5);
      setOverdue((overdueDocs ?? []) as OverdueInvoice[]);
      setChartsLoading(false);
    }
    loadAll();
  }, []);

  async function runRapport() {
    const now = new Date();
    setRapportLoading(true); setRapportOpen(true); setRapport(null);
    try {
      const res = await fetch("/api/rapport-mensuel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: now.getFullYear(), month: now.getMonth() }),
      });
      if (!res.ok) throw new Error("Erreur rapport");
      setRapport(await res.json());
    } catch { setRapportOpen(false); }
    finally { setRapportLoading(false); }
  }

  const kpis = [
    { label: "CA facturé ce mois",    value: stats ? fmtEurInt(stats.caThisMois)    : "—", icon: Euro,        href: "/client/factures" },
    { label: "Heures cette semaine",  value: stats ? (stats.heuresSemaine > 0 ? fmtDuration(stats.heuresSemaine) : "0h") : "—", icon: Clock, href: "/client/chrono" },
    { label: "Dépenses ce mois",      value: stats ? fmtEurInt(stats.depensesMois)  : "—", icon: TrendingDown, href: "/client/depenses" },
    { label: "Contacts actifs",       value: stats ? String(stats.contactsActifs)   : "—", icon: UserCheck,   href: "/client/crm" },
  ];

  const ease = [0.22, 1, 0.36, 1] as const;
  const kpiColors = ["#c9a55a", "#60a5fa", "#f87171", "#a78bfa"];

  return (
    <div className="min-h-full pb-16" style={{ background: "#0c1222" }}>

      {/* ── Header ── */}
      <div className="relative overflow-hidden px-5 pb-7 pt-5"
        style={{ background: "linear-gradient(160deg,#0c1222 0%,#111827 55%,#0d1320 100%)" }}
      >
        {/* Animated gold line */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease }}
          className="absolute inset-x-0 top-0 h-[1.5px] origin-left bg-gradient-to-r from-transparent via-[#c9a55a]/60 to-transparent"
        />
        {/* Orbs */}
        <motion.div animate={{ y:[0,-16,0], opacity:[0.06,0.13,0.06] }} transition={{ duration:6, repeat:Infinity, ease:"easeInOut" }}
          className="pointer-events-none absolute -top-12 left-1/2 h-[300px] w-[500px] -translate-x-1/2 rounded-full blur-[90px]"
          style={{ background:"rgba(201,165,90,0.13)" }}
        />
        <motion.div animate={{ y:[0,12,0], x:[0,-8,0], opacity:[0.04,0.09,0.04] }} transition={{ duration:8, repeat:Infinity, ease:"easeInOut", delay:2 }}
          className="pointer-events-none absolute -bottom-8 right-0 h-[200px] w-[280px] rounded-full blur-[80px]"
          style={{ background:"rgba(99,102,241,0.09)" }}
        />

        <div className="relative mx-auto max-w-4xl">
          {/* Greeting row */}
          <div className="mb-6 flex items-start justify-between gap-3">
            <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35, ease }}>
              <p className="text-[0.6rem] capitalize tracking-[0.18em] text-white/30">{fmtFullDate()}</p>
              <h1 className="mt-1 text-[1.5rem] font-black leading-tight text-white">
                {getGreeting()}
                {userName && (
                  <motion.span
                    initial={{ opacity:0, y:5 }} animate={{ opacity:1, y:0 }}
                    transition={{ duration:0.4, delay:0.22, ease }}
                    className="ml-1.5 font-black text-white/75"
                  >{userName.split(" ")[0]}</motion.span>
                )}
              </h1>
              <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.4, delay:0.3 }}
                className="mt-0.5 text-[0.75rem] text-white/35"
              >Voici un résumé de votre activité DJAMA PRO.</motion.p>
            </motion.div>

            <motion.button
              initial={{ opacity:0, scale:0.88 }} animate={{ opacity:1, scale:1 }}
              transition={{ duration:0.35, delay:0.18, ease }}
              whileHover={{ scale:1.03, y:-1 }}
              whileTap={{ scale:0.92 }}
              onClick={runRapport} disabled={rapportLoading}
              className="flex shrink-0 items-center gap-2 rounded-2xl px-3.5 py-2.5 text-[0.72rem] font-bold text-[#0a0a0a] transition disabled:opacity-40"
              style={{ background:`linear-gradient(135deg,${GOLD},#b08d45)`, boxShadow:`0 4px 16px ${GOLD}35` }}
            >
              {rapportLoading
                ? <motion.div className="h-3.5 w-3.5 rounded-full border-2 border-black/20 border-t-black/60"
                    animate={{ rotate: 360 }} transition={{ duration:0.75, repeat:Infinity, ease:"linear" }} />
                : <FileBarChart2 size={12}/>}
              Rapport IA
            </motion.button>
          </div>

          {/* KPI grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {kpis.map(({ label, value, icon: Icon, href }, i) => (
              <motion.div key={label}
                initial={{ opacity:0, y:20, scale:0.88 }} animate={{ opacity:1, y:0, scale:1 }}
                transition={{ type:"spring", stiffness:300, damping:22, delay:0.1 + i*0.08 }}
              >
                <Link href={href} className="block group">
                  <motion.div
                    whileHover={{ scale:1.04, y:-3 }} whileTap={{ scale:0.96 }}
                    transition={{ type:"spring", stiffness:440, damping:18 }}
                    className="rounded-2xl p-4"
                    style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)" }}
                  >
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ background:`${kpiColors[i]}20` }}>
                      <Icon size={16} style={{ color:kpiColors[i] }}/>
                    </div>
                    <p className="text-[0.58rem] font-medium uppercase tracking-wider text-white/30">{label}</p>
                    {statsLoading
                      ? <div className="mt-1.5 h-5 w-14 animate-pulse rounded-lg" style={{ background:"rgba(255,255,255,0.10)" }}/>
                      : <motion.p
                          key={value}
                          initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }}
                          transition={{ type:"spring", stiffness:380, damping:18 }}
                          className="mt-1 text-[1.25rem] font-black leading-none text-white"
                        >{value}</motion.p>
                    }
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto max-w-4xl space-y-4 px-5 py-5 sm:px-6">

        {/* Overdue alert */}
        <AnimatePresence>
          {!chartsLoading && overdue.length > 0 && (
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
              <Link href="/client/tresorerie" className="block">
                <motion.div whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                  className="flex items-center gap-3.5 rounded-2xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3.5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-500/15">
                    <AlertTriangle size={14} className="text-red-400"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.8rem] font-bold text-white">{overdue.length} facture{overdue.length>1?"s":""} en retard</p>
                    <p className="text-[0.67rem] text-white/35 truncate">{overdue.map(i=>i.client_nom||i.numero).join(", ")}</p>
                  </div>
                  <ChevronRight size={14} className="shrink-0 text-red-400/50"/>
                </motion.div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chart + Top clients */}
        <div className="grid gap-4 lg:grid-cols-[1fr_260px]">

          {/* Revenue chart */}
          <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.22 }}
            className="rounded-3xl p-5"
            style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[0.8rem] font-bold text-white">Revenus encaissés</p>
                <p className="text-[0.6rem] text-white/30">6 derniers mois</p>
              </div>
              {!chartsLoading && revenues.length > 0 && (
                <p className="text-[0.82rem] font-black" style={{ color:GOLD }}>
                  {fmtEurInt(revenues.reduce((s,r)=>s+r.amount,0))}
                </p>
              )}
            </div>
            {chartsLoading ? (
              <div className="flex items-end gap-2 h-28">
                {[1,2,3,4,5,6].map(i=>(
                  <div key={i} className="flex-1 animate-pulse rounded-xl" style={{ height:`${32+i*11}%`, background:"rgba(255,255,255,0.07)" }}/>
                ))}
              </div>
            ) : (
              <div className="flex items-end gap-2 h-32">
                {(()=>{
                  const max = Math.max(...revenues.map(r=>r.amount),1);
                  return revenues.map((r,i)=>{
                    const pct  = Math.max((r.amount/max)*100, r.amount>0?8:3);
                    const isLast = i===revenues.length-1;
                    return (
                      <div key={r.label} className="group flex flex-1 flex-col items-center gap-1.5">
                        <div className="relative flex w-full items-end" style={{ height:"96px" }}>
                          <motion.div
                            initial={{ height:0 }} animate={{ height:`${pct}%` }}
                            transition={{ duration:0.7, delay:0.3+i*0.07, ease }}
                            className="w-full rounded-xl"
                            style={{
                              background: isLast ? `linear-gradient(180deg,${GOLD},${GOLD}77)` : "rgba(255,255,255,0.10)",
                              boxShadow: isLast ? `0 6px 24px ${GOLD}40` : "none",
                            }}
                          />
                          {r.amount>0 && (
                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/10 bg-[#1a2235] px-2 py-1 text-[0.6rem] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              {fmtEurInt(r.amount)}
                            </div>
                          )}
                        </div>
                        <span className="text-[0.58rem] font-medium" style={{ color: isLast ? GOLD : "rgba(255,255,255,0.28)" }}>{r.label}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </motion.div>

          {/* Top clients */}
          <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.30 }}
            className="rounded-3xl p-5"
            style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)" }}
          >
            <div className="mb-4">
              <p className="text-[0.8rem] font-bold text-white">Meilleurs clients</p>
              <p className="text-[0.6rem] text-white/30">3 mois glissants</p>
            </div>
            {chartsLoading ? (
              <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-8 animate-pulse rounded-xl" style={{ background:"rgba(255,255,255,0.07)" }}/>)}</div>
            ) : topClients.length===0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Users size={18} className="text-white/15"/>
                <p className="text-[0.72rem] text-white/25">Aucun encaissement récent</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topClients.map((c,i)=>{
                  const pct = Math.round((c.amount/topClients[0].amount)*100);
                  return (
                    <div key={c.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[0.72rem] font-medium text-white/55 truncate max-w-[120px]">{c.name}</span>
                        <span className="text-[0.72rem] font-bold" style={{ color:GOLD }}>{fmtEurInt(c.amount)}</span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full" style={{ background:"rgba(255,255,255,0.08)" }}>
                        <motion.div
                          initial={{ width:0 }} animate={{ width:`${pct}%` }}
                          transition={{ duration:0.8, delay:0.4+i*0.08 }}
                          className="h-full rounded-full"
                          style={{ background: i===0 ? GOLD : `${GOLD}55` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Rapport modal */}
        <AnimatePresence>
          {rapportOpen && (
            <motion.div
              initial={{ opacity:0, y:-10, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }}
              exit={{ opacity:0, y:-8, scale:0.97 }} transition={{ duration:0.25 }}
              className="overflow-hidden rounded-3xl border border-white/10"
              style={{ background:"rgba(255,255,255,0.05)" }}
            >
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <FileBarChart2 size={13} style={{ color:GOLD }}/>
                  <span className="text-[0.85rem] font-bold text-white">
                    Rapport IA — {new Date().toLocaleDateString("fr-FR",{month:"long",year:"numeric"})}
                  </span>
                </div>
                <button onClick={()=>setRapportOpen(false)} className="text-white/30 hover:text-white transition-colors">
                  <X size={15}/>
                </button>
              </div>

              {rapportLoading ? (
                <div className="flex flex-col items-center gap-3 py-12">
                  <div className="relative h-10 w-10">
                    <div className="absolute inset-0 rounded-full" style={{ border:`2px solid rgba(201,165,90,0.18)` }}/>
                    <motion.div className="absolute inset-0 rounded-full"
                      style={{ border:"2px solid transparent", borderTopColor:GOLD }}
                      animate={{ rotate:360 }} transition={{ duration:0.9, repeat:Infinity, ease:"linear" }}/>
                  </div>
                  <p className="text-[0.8rem] text-white/40">Génération du rapport en cours…</p>
                </div>
              ) : rapport && (
                <div className="space-y-5 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5"/>
                        <circle cx="32" cy="32" r="26" fill="none"
                          stroke={rapport.score_sante>=70?"#10b981":rapport.score_sante>=40?"#f59e0b":"#ef4444"}
                          strokeWidth="5" strokeLinecap="round"
                          strokeDasharray={`${2*Math.PI*26}`}
                          strokeDashoffset={`${2*Math.PI*26*(1-rapport.score_sante/100)}`}
                          style={{ transition:"stroke-dashoffset 1s ease" }}
                        />
                      </svg>
                      <span className="text-base font-black" style={{ color:rapport.score_sante>=70?"#10b981":rapport.score_sante>=40?"#f59e0b":"#ef4444" }}>
                        {rapport.score_sante}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[0.62rem] font-medium text-white/35">Santé financière</p>
                      <p className="mt-1 text-[0.8rem] leading-relaxed text-white/70">{rapport.resume_executif}</p>
                    </div>
                  </div>
                  {rapport.kpis && (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {[
                        { label:"Revenu encaissé",   value:fmtEurInt(rapport.kpis.revenu_total) },
                        { label:"Dépenses totales",  value:fmtEurInt(rapport.kpis.depenses_totales) },
                        { label:"Résultat net",      value:fmtEurInt(rapport.kpis.resultat_net) },
                        { label:"Taux recouvrement", value:rapport.kpis.taux_recouvrement },
                        { label:"Factures",          value:String(rapport.kpis.nb_factures) },
                        { label:"Clients actifs",    value:String(rapport.kpis.nb_clients) },
                      ].map(k=>(
                        <div key={k.label} className="rounded-2xl px-3.5 py-3" style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)" }}>
                          <p className="text-[0.6rem] font-medium text-white/35">{k.label}</p>
                          <p className="mt-0.5 text-[0.95rem] font-black text-white">{k.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {rapport.points_forts?.length>0 && (
                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] p-4">
                        <div className="mb-2 flex items-center gap-2"><ShieldCheck size={11} className="text-emerald-400"/><span className="text-[0.63rem] font-bold text-emerald-400">Points forts</span></div>
                        <ul className="space-y-1.5">{rapport.points_forts.map((p,i)=><li key={i} className="flex items-start gap-2 text-[0.73rem] text-white/55"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400/70"/>{p}</li>)}</ul>
                      </div>
                    )}
                    {rapport.alertes?.length>0 && (
                      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.07] p-4">
                        <div className="mb-2 flex items-center gap-2"><AlertTriangle size={11} className="text-amber-400"/><span className="text-[0.63rem] font-bold text-amber-400">Alertes</span></div>
                        <ul className="space-y-1.5">{rapport.alertes.map((a,i)=><li key={i} className="flex items-start gap-2 text-[0.73rem] text-white/55"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400/70"/>{a}</li>)}</ul>
                      </div>
                    )}
                  </div>
                  {rapport.recommandations?.length>0 && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="mb-2 flex items-center gap-2"><Lightbulb size={11} style={{ color:GOLD }}/><span className="text-[0.63rem] font-bold text-white/40">Recommandations</span></div>
                      <ol className="space-y-1.5">{rapport.recommandations.map((r,i)=>(
                        <li key={i} className="flex items-start gap-2.5 text-[0.73rem] text-white/55">
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[0.55rem] font-bold" style={{ background:"rgba(201,165,90,0.2)", color:GOLD }}>{i+1}</span>
                          {r}
                        </li>
                      ))}</ol>
                    </div>
                  )}
                  {rapport.objectif_mois_prochain && (
                    <div className="flex items-start gap-3 rounded-2xl border p-4"
                      style={{ borderColor:`${GOLD}25`, background:`${GOLD}0d` }}>
                      <TrendingUp size={13} className="mt-0.5 shrink-0" style={{ color:GOLD }}/>
                      <div>
                        <p className="mb-1 text-[0.62rem] font-bold" style={{ color:`${GOLD}99` }}>Objectif mois prochain</p>
                        <p className="text-[0.77rem] text-white/60">{rapport.objectif_mois_prochain}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick create row */}
        <motion.div
          initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.35, delay:0.35 }}
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {[
            { href:"/client/factures",  label:"Nouvelle facture",  icon:ReceiptText, color:"#c9a55a" },
            { href:"/client/factures",  label:"Nouveau devis",     icon:Send,        color:"#60a5fa" },
            { href:"/client/crm",       label:"Ajouter client",    icon:Users,       color:"#a78bfa" },
            { href:"/client/depenses",  label:"Saisir dépense",    icon:Receipt,     color:"#f97316" },
          ].map(({ href, label, icon:Icon, color }) => (
            <a key={label} href={href}
              className="group flex items-center gap-2.5 rounded-2xl px-3.5 py-3 transition-all hover:scale-[1.02]"
              style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
                style={{ background:`${color}20` }}>
                <Plus size={11} style={{ color }} strokeWidth={2.5}/>
              </div>
              <span className="text-[0.72rem] font-medium text-white/55 group-hover:text-white/80 transition-colors leading-tight">{label}</span>
            </a>
          ))}
        </motion.div>

        {/* Recent activity */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.42 }}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white/25">Activité récente</p>
            <a href="/client/factures" className="text-[0.65rem] font-medium transition hover:opacity-70" style={{ color:GOLD }}>
              Voir tout →
            </a>
          </div>
          <div className="overflow-hidden rounded-3xl"
            style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)" }}>
            {chartsLoading ? (
              <div className="space-y-0 divide-y divide-white/5">
                {[1,2,3,4].map(i=>(
                  <div key={i} className="flex items-center gap-3.5 px-4 py-3.5">
                    <div className="h-8 w-8 animate-pulse rounded-xl" style={{ background:"rgba(255,255,255,0.08)" }}/>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2.5 w-28 animate-pulse rounded-full" style={{ background:"rgba(255,255,255,0.08)" }}/>
                      <div className="h-2 w-16 animate-pulse rounded-full" style={{ background:"rgba(255,255,255,0.05)" }}/>
                    </div>
                    <div className="h-5 w-14 animate-pulse rounded-full" style={{ background:"rgba(255,255,255,0.08)" }}/>
                  </div>
                ))}
              </div>
            ) : recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <ReceiptText size={20} className="text-white/15"/>
                <p className="text-[0.72rem] text-white/30">Aucune facture créée pour l&apos;instant</p>
                <a href="/client/factures"
                  className="rounded-xl px-4 py-2 text-[0.72rem] font-bold text-[#0a0a0a] transition hover:opacity-90"
                  style={{ background:`linear-gradient(135deg, ${GOLD}, #b08d45)` }}>
                  Créer ma première facture
                </a>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {recentInvoices.map((inv, i) => {
                  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
                    payé:       { label:"Payée",      color:"#4ade80", bg:"rgba(74,222,128,0.12)",  icon:CheckCircle2 },
                    envoyé:     { label:"Envoyée",    color:"#60a5fa", bg:"rgba(96,165,250,0.12)",  icon:Send         },
                    en_attente: { label:"En attente", color:GOLD,      bg:`${GOLD}18`,              icon:CircleDot    },
                    brouillon:  { label:"Brouillon",  color:"#9ca3af", bg:"rgba(156,163,175,0.12)", icon:FileText     },
                    en_retard:  { label:"En retard",  color:"#f87171", bg:"rgba(248,113,113,0.12)", icon:AlertTriangle},
                  };
                  const s = statusConfig[inv.statut] ?? { label:inv.statut, color:"#9ca3af", bg:"rgba(156,163,175,0.12)", icon:CircleDot };
                  const StatusIcon = s.icon;
                  const date = new Date(inv.created_at).toLocaleDateString("fr-FR", { day:"numeric", month:"short" });

                  return (
                    <motion.div key={inv.id}
                      initial={{ opacity:0, x:-6 }}
                      animate={{ opacity:1, x:0 }}
                      transition={{ duration:0.22, delay:0.44 + i*0.04 }}
                    >
                      <a href="/client/factures"
                        className="group flex items-center gap-3.5 px-4 py-3 transition-colors hover:bg-white/[0.03]">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                          style={{ background:"rgba(201,165,90,0.10)", border:"1px solid rgba(201,165,90,0.15)" }}>
                          <ReceiptText size={14} style={{ color:GOLD }}/>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.78rem] font-semibold text-white/70">
                            {inv.client_nom || inv.numero || "Sans nom"}
                          </p>
                          <p className="text-[0.62rem] text-white/30">
                            {inv.numero ? `${inv.numero} · ` : ""}{date}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 rounded-full px-2 py-0.5"
                            style={{ background:s.bg }}>
                            <StatusIcon size={9} style={{ color:s.color }}/>
                            <span className="text-[0.6rem] font-semibold" style={{ color:s.color }}>{s.label}</span>
                          </div>
                          <span className="text-[0.78rem] font-bold" style={{ color:GOLD }}>
                            {fmtEurInt(inv.total_ttc ?? 0)}
                          </span>
                        </div>
                      </a>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Tools */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.52 }}>
          <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white/25">Accès rapides</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((item,i)=><ToolCard key={item.href} item={item} delay={0.54+i*0.035}/>)}
          </div>
        </motion.div>

        <p className="text-center text-[0.62rem] text-white/15">DJAMA PRO · Données en temps réel</p>
      </div>
    </div>
  );
}
