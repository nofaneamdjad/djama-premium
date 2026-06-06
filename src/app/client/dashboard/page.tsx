"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ReceiptText, Users, Timer, Receipt, FileText, Search,
  TrendingUp, StickyNote, Star, Zap, CalendarRange,
  Clock, Euro, UserCheck, TrendingDown,
  AlertTriangle, ChevronRight, BarChart2,
  FileBarChart2, X, ShieldCheck, Lightbulb,
  CheckCircle2, CircleDot, Send, Activity, Lock,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { APP_ICONS } from "@/components/AppIcons";
import { fmtEurInt, fmtDuration } from "@/lib/format";

const ease = [0.22, 1, 0.36, 1] as const;
const GOLD = "#c9a55a";

const TOOLS = [
  { href: "/client/factures",     label: "Factures",    icon: ReceiptText,   hue: "#3b82f6" },
  { href: "/client/crm",          label: "CRM",         icon: Users,         hue: "#6366f1" },
  { href: "/client/chrono",       label: "Chrono",      icon: Timer,         hue: "#a78bfa" },
  { href: "/client/depenses",     label: "Dépenses",    icon: Receipt,       hue: "#f97316" },
  { href: "/client/contrats",     label: "Contrats",    icon: FileText,      hue: GOLD      },
  { href: "/client/sourcing",     label: "Sourcing",    icon: Search,        hue: "#818cf8" },
  { href: "/client/tresorerie",   label: "Trésorerie",  icon: TrendingUp,    hue: "#10b981" },
  { href: "/client/bloc-note",    label: "Bloc-notes",  icon: StickyNote,    hue: "#fbbf24" },
  { href: "/client/reputation",   label: "Réputation",  icon: Star,          hue: "#f59e0b" },
  { href: "/client/assistant",    label: "Assistant IA",icon: Zap,           hue: "#22d3ee" },
  { href: "/client/equipe",       label: "Équipe",      icon: CalendarRange, hue: "#0ea5e9" },
] as const;

const QUICK_ACTIONS = [
  { href: "/client/factures",           iconKey: "/client/factures",    label: "Facture"  },
  { href: "/client/factures?type=devis",iconKey: "/client/contrats",    label: "Devis"    },
  { href: "/client/depenses",           iconKey: "/client/depenses",    label: "Dépense"  },
  { href: "/client/crm",                iconKey: "/client/crm",         label: "Contact"  },
  { href: "/client/chrono",             iconKey: "/client/chrono",      label: "Chrono"   },
  { href: "/client/tresorerie",         iconKey: "/client/tresorerie",  label: "Tréso"    },
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
  id: string; numero: string; client_nom: string;
  total_ttc: number; statut: string; created_at: string;
}
interface Stats {
  caThisMois: number; heuresSemaine: number;
  depensesMois: number; contactsActifs: number;
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

/* ── Module icon compact ── */
function ModuleIcon({ item, delay = 0 }: { item: typeof TOOLS[number]; delay?: number }) {
  const appIcon = (APP_ICONS as Record<string, React.ReactElement | undefined>)[item.href] ?? null;
  const Icon = item.icon;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.82 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 22, delay }}
    >
      <Link href={item.href} className="group block">
        <motion.div
          whileTap={{ scale: 0.90 }}
          className="flex flex-col items-center gap-2 rounded-2xl px-2 py-3.5 text-center transition-colors"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
        >
          {appIcon !== null ? (
            <div className="h-[46px] w-[46px] overflow-hidden rounded-[13px] shadow-[0_4px_14px_rgba(0,0,0,0.14)]">
              {appIcon}
            </div>
          ) : (
            <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[13px]"
              style={{ background: `${item.hue}18`, border: `1px solid ${item.hue}28` }}>
              <Icon size={20} style={{ color: item.hue }} strokeWidth={1.8} />
            </div>
          )}
          <p className="w-full truncate text-[0.67rem] font-semibold leading-tight text-gray-500 group-hover:text-gray-700 transition-colors">
            {item.label}
          </p>
        </motion.div>
      </Link>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────── */
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
  const [showAlert,      setShowAlert]      = useState(true);

  useEffect(() => {
    async function loadAll() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setStatsLoading(false); setChartsLoading(false); return; }

      /* ── Nom : société > user_access > Google > email formaté ── */
      const metaCompany = (
        (user.user_metadata?.company_name as string | undefined)
        || (user.user_metadata?.company as string | undefined)
        || (user.user_metadata?.organization as string | undefined)
        || ""
      ).trim();
      const metaFullName = (
        (user.user_metadata?.full_name as string | undefined)
        || (user.user_metadata?.name as string | undefined)
        || ""
      ).trim();
      const { data: uaRow } = await supabase
        .from("user_access").select("name").eq("email", user.email!).maybeSingle();
      const accessName = ((uaRow as { name?: string } | null)?.name ?? "").trim();
      const emailSlug = user.email?.split("@")[0] ?? "";
      const emailFormatted = emailSlug
        .replace(/[._-]/g, " ")
        .split(" ")
        .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ");
      setUserName(metaCompany || accessName || metaFullName || emailFormatted);

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
      const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1).toISOString().slice(0, 10);
      const { data: revRaw } = await supabase
        .from("documents").select("total_ttc, date_document")
        .eq("user_id", user.id).eq("type","facture").eq("statut","payé")
        .gte("date_document", sixMonthsAgo);

      const monthData: MonthRevenue[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const yr = d.getFullYear(); const mo = d.getMonth();
        const amount = (revRaw ?? [])
          .filter(r => { const rd = new Date((r.date_document as string) + "T12:00:00"); return rd.getFullYear()===yr && rd.getMonth()===mo; })
          .reduce((s,r) => s+((r.total_ttc as number) ?? 0), 0);
        monthData.push({ label: SHORT_MONTHS[mo], amount });
      }
      setRevenues(monthData);

      const { data: recentDocs } = await supabase
        .from("documents").select("id,numero,client_nom,total_ttc,statut,created_at")
        .eq("user_id", user.id).eq("type","facture")
        .order("created_at", { ascending: false }).limit(6);
      setRecentInvoices((recentDocs ?? []) as RecentInvoice[]);

      const threeAgo = new Date(today.getFullYear(), today.getMonth()-3, 1).toISOString().slice(0,10);
      const { data: paidDocs } = await supabase.from("documents").select("client_nom,total_ttc").eq("user_id", user.id).eq("type","facture").eq("statut","payé").gte("date_document",threeAgo);
      const clientMap = new Map<string,number>();
      for (const d of (paidDocs ?? [])) {
        const n = (d.client_nom as string) || "Inconnu";
        clientMap.set(n, (clientMap.get(n) ?? 0) + ((d.total_ttc as number) ?? 0));
      }
      setTopClients([...clientMap.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,amount])=>({ name, amount })));

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

  const ca       = stats?.caThisMois    ?? 0;
  const dep      = stats?.depensesMois  ?? 0;
  const netMois  = ca - dep;

  /* ─────────────────────────────────────────────────
     RENDU
  ───────────────────────────────────────────────── */
  return (
    <div className="min-h-full overflow-x-hidden" style={{ background: "#eef0f5" }}>

      {/* ══════════════════════════════════════════
          HERO SOMBRE
      ══════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(155deg,#07090f 0%,#0c1526 50%,#070c18 100%)" }}
      >
        {/* Shimmer gold */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease }}
          className="absolute inset-x-0 top-0 h-[1.5px] origin-left"
          style={{ background: "linear-gradient(90deg,transparent 0%,rgba(201,165,90,0.8) 35%,rgba(201,165,90,0.4) 65%,transparent 100%)" }}
        />
        {/* Orbs */}
        <motion.div
          animate={{ scale:[1,1.18,1], opacity:[0.07,0.15,0.07] }}
          transition={{ duration:8, repeat:Infinity, ease:"easeInOut" }}
          className="pointer-events-none absolute -top-24 left-1/2 h-[360px] w-[560px] -translate-x-1/2 rounded-full blur-[100px]"
          style={{ background:"rgba(201,165,90,0.22)" }}
        />
        <motion.div
          animate={{ y:[0,20,0], opacity:[0.04,0.1,0.04] }}
          transition={{ duration:10, repeat:Infinity, ease:"easeInOut", delay:3 }}
          className="pointer-events-none absolute bottom-10 right-0 h-[220px] w-[320px] rounded-full blur-[80px]"
          style={{ background:"rgba(99,102,241,0.1)" }}
        />

        <div className="relative mx-auto max-w-4xl px-4 pt-5 pb-8">

          {/* ── Top row ── */}
          <motion.div
            initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.38, ease }}
            className="flex items-start justify-between mb-6"
          >
            <div>
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-white/25 capitalize">
                {fmtFullDate()}
              </p>
              <p className="mt-1 text-[22px] font-black text-white leading-tight tracking-tight">
                {getGreeting()}
                {userName && (
                  <motion.span
                    initial={{ opacity:0, x:6 }} animate={{ opacity:1, x:0 }}
                    transition={{ duration:0.4, delay:0.2, ease }}
                    style={{ color: GOLD }}
                  >{", "}{userName.split(" ").slice(0,2).join(" ")}</motion.span>
                )}
              </p>
            </div>

            {/* Rapport IA */}
            <motion.button
              initial={{ opacity:0, scale:0.88 }} animate={{ opacity:1, scale:1 }}
              transition={{ duration:0.35, delay:0.18, ease }}
              whileHover={{ scale:1.04, y:-1 }} whileTap={{ scale:0.92 }}
              onClick={runRapport} disabled={rapportLoading}
              className="flex mt-1 shrink-0 items-center gap-2 rounded-2xl px-3.5 py-2.5 text-[0.72rem] font-bold text-[#0a0a0a] transition disabled:opacity-40"
              style={{ background:`linear-gradient(135deg,${GOLD},#b08d45)`, boxShadow:`0 4px 16px ${GOLD}35` }}
            >
              {rapportLoading
                ? <motion.div className="h-3.5 w-3.5 rounded-full border-2 border-black/20 border-t-black/60"
                    animate={{ rotate:360 }} transition={{ duration:0.75, repeat:Infinity, ease:"linear" }}/>
                : <FileBarChart2 size={12}/>}
              Rapport IA
            </motion.button>
          </motion.div>

          {/* ── KPI card ── */}
          <motion.div
            initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.45, delay:0.07, ease }}
            className="rounded-3xl p-5 mb-4"
            style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", backdropFilter:"blur(16px)" }}
          >
            {/* Label */}
            <div className="flex items-center gap-2 mb-1">
              <BarChart2 size={12} style={{ color: GOLD }} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                CA facturé · {new Date().toLocaleDateString("fr-FR", { month:"long", year:"numeric" })}
              </span>
            </div>

            {/* Big number */}
            <div className="mb-4">
              {statsLoading ? (
                <div className="h-[52px] w-44 rounded-xl animate-pulse mt-2" style={{ background:"rgba(255,255,255,0.07)" }}/>
              ) : (
                <motion.p
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                  transition={{ duration:0.32, delay:0.2, ease }}
                  className="text-[3.4rem] font-black leading-none tracking-tight text-white mt-1"
                >
                  {fmtEurInt(ca)}
                </motion.p>
              )}
            </div>

            {/* Progress bar dépenses */}
            {!statsLoading && (ca > 0 || dep > 0) && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[9px] text-white/25 font-medium">
                    Dépenses {fmtEurInt(dep)}
                  </span>
                  <span className="text-[9px] font-semibold" style={{
                    color: ca > 0 && dep/ca > 0.7 ? "#f87171" : "rgba(255,255,255,0.3)"
                  }}>
                    {ca > 0 ? Math.round((dep/ca)*100) : 0}% du CA
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.07)" }}>
                  <motion.div
                    initial={{ width:0 }}
                    animate={{ width:`${ca > 0 ? Math.min((dep/ca)*100,100) : 0}%` }}
                    transition={{ duration:0.9, delay:0.35, ease:[0.22,1,0.36,1] }}
                    className="h-full rounded-full"
                    style={{
                      background: ca > 0 && dep/ca > 0.7
                        ? "linear-gradient(90deg,#f87171,#ef4444)"
                        : ca > 0 && dep/ca > 0.4
                          ? "linear-gradient(90deg,#fbbf24,#f59e0b)"
                          : "linear-gradient(90deg,#4ade80,#22c55e)",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Mini stats */}
            {ca === 0 && !statsLoading ? (
              <Link href="/client/factures">
                <div className="flex items-center gap-3 rounded-xl px-3.5 py-3 transition hover:opacity-90"
                  style={{ background:"rgba(201,165,90,0.07)", border:"1px solid rgba(201,165,90,0.15)" }}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                    style={{ background:"rgba(201,165,90,0.15)" }}>
                    <ReceiptText size={14} style={{ color:GOLD }}/>
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-white/80">Créez votre première facture</p>
                    <p className="text-[10px] text-white/30">Commencez à suivre votre activité</p>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label:"Heures sem.", val: statsLoading ? "—" : (stats?.heuresSemaine ? fmtDuration(stats.heuresSemaine) : "0h"), color:"#60a5fa" },
                  { label:"Dépenses",    val: statsLoading ? "—" : fmtEurInt(dep), color: dep > 0 ? "#f87171" : "#4ade80" },
                  { label:"Contacts",    val: statsLoading ? "—" : String(stats?.contactsActifs ?? 0), color:"#a78bfa" },
                ].map(s => (
                  <div key={s.label}
                    className="flex flex-col items-center justify-center rounded-xl py-2.5"
                    style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.06)" }}
                  >
                    <span className="text-[15px] font-black tabular-nums" style={{ color:s.color }}>{s.val}</span>
                    <span className="mt-0.5 text-[8.5px] text-white/25 text-center">{s.label}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* ── Net badge ── */}
          {!statsLoading && ca > 0 && (
            <motion.div
              initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.3, delay:0.25, ease }}
              className="flex items-center gap-2 mb-4"
            >
              <div className="flex items-center gap-1.5 rounded-xl px-3 py-1.5"
                style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.07)" }}>
                <span className="text-[9px] uppercase tracking-wide text-white/30 font-semibold">Net</span>
                <span className="text-[13px] font-black" style={{ color: netMois >= 0 ? "#4ade80" : "#f87171" }}>
                  {netMois >= 0 ? "+" : ""}{fmtEurInt(netMois)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl px-3 py-1.5"
                style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.07)" }}>
                <span className="text-[9px] uppercase tracking-wide text-white/30 font-semibold">Dép.</span>
                <span className="text-[13px] font-black text-red-400">{fmtEurInt(dep)}</span>
              </div>
            </motion.div>
          )}

          {/* ── Quick actions ── */}
          <motion.div
            initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.4, delay:0.2, ease }}
            className="grid grid-cols-3 gap-3 sm:grid-cols-6"
          >
            {QUICK_ACTIONS.map((a, i) => {
              const icon = (APP_ICONS as Record<string, React.ReactElement | undefined>)[a.iconKey];
              return (
                <motion.div key={a.label}
                  initial={{ opacity:0, y:14, scale:0.82 }} animate={{ opacity:1, y:0, scale:1 }}
                  transition={{ type:"spring", stiffness:400, damping:22, delay:0.26+i*0.05 }}
                >
                  <Link href={a.href} className="relative flex flex-col items-center gap-1.5 transition active:scale-95">
                    <div className="h-[52px] w-[52px] overflow-hidden rounded-[15px] shadow-[0_6px_18px_rgba(0,0,0,0.32)]">
                      {icon ?? (
                        <div className="h-full w-full flex items-center justify-center rounded-[15px]"
                          style={{ background:"rgba(201,165,90,0.15)" }}>
                          <Lock size={18} style={{ color:GOLD }}/>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold text-white/70 tracking-wide">{a.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>

        </div>

        {/* ── Wave ── */}
        <svg viewBox="0 0 1440 56" fill="none" preserveAspectRatio="none"
          className="w-full block" style={{ marginBottom:"-1px", height:"56px" }}>
          <path d="M0,24 C180,56 420,6 720,28 C1020,50 1260,10 1440,32 L1440,56 L0,56 Z" fill="#eef0f5"/>
        </svg>
      </div>

      {/* ══════════════════════════════════════════
          CONTENU CLAIR
      ══════════════════════════════════════════ */}
      <div className="mx-auto max-w-4xl px-4 pb-14 pt-3 sm:px-6">

        {/* ── Alerte retard ── */}
        <AnimatePresence>
          {!chartsLoading && overdue.length > 0 && showAlert && (
            <motion.div
              initial={{ opacity:0, y:-8, height:0 }} animate={{ opacity:1, y:0, height:"auto" }}
              exit={{ opacity:0, y:-8, height:0 }} transition={{ duration:0.28, ease }}
              className="overflow-hidden mb-4"
            >
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{ background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.18)" }}>
                <AlertTriangle size={15} className="shrink-0 text-red-500"/>
                <p className="flex-1 text-[12px] font-semibold text-red-700">
                  {overdue.length} facture{overdue.length>1?"s":""} en retard de paiement
                </p>
                <Link href="/client/tresorerie" className="shrink-0 text-[11px] font-bold text-red-600 underline underline-offset-2">
                  Voir
                </Link>
                <button onClick={()=>setShowAlert(false)} className="shrink-0 text-red-400 hover:text-red-600 transition-colors ml-1">
                  <X size={13}/>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Rapport modal ── */}
        <AnimatePresence>
          {rapportOpen && (
            <motion.div
              initial={{ opacity:0, y:-10, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }}
              exit={{ opacity:0, y:-8, scale:0.97 }} transition={{ duration:0.25 }}
              className="overflow-hidden rounded-3xl mb-4 bg-white"
              style={{ border:"1px solid rgba(0,0,0,0.07)", boxShadow:"0 8px 32px rgba(0,0,0,0.1)" }}
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <FileBarChart2 size={13} style={{ color:GOLD }}/>
                  <span className="text-[0.85rem] font-bold text-gray-800">
                    Rapport IA — {new Date().toLocaleDateString("fr-FR",{month:"long",year:"numeric"})}
                  </span>
                </div>
                <button onClick={()=>setRapportOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
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
                  <p className="text-[0.8rem] text-gray-400">Génération du rapport en cours…</p>
                </div>
              ) : rapport && (
                <div className="space-y-5 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="5"/>
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
                      <p className="text-[0.62rem] font-medium text-gray-400">Santé financière</p>
                      <p className="mt-1 text-[0.8rem] leading-relaxed text-gray-600">{rapport.resume_executif}</p>
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
                        <div key={k.label} className="rounded-2xl px-3.5 py-3"
                          style={{ background:"rgba(0,0,0,0.03)", border:"1px solid rgba(0,0,0,0.06)" }}>
                          <p className="text-[0.6rem] font-medium text-gray-400">{k.label}</p>
                          <p className="mt-0.5 text-[0.95rem] font-black text-gray-800">{k.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {rapport.points_forts?.length>0 && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <div className="mb-2 flex items-center gap-2"><ShieldCheck size={11} className="text-emerald-500"/><span className="text-[0.63rem] font-bold text-emerald-600">Points forts</span></div>
                        <ul className="space-y-1.5">{rapport.points_forts.map((p,i)=><li key={i} className="flex items-start gap-2 text-[0.73rem] text-gray-600"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400"/>{p}</li>)}</ul>
                      </div>
                    )}
                    {rapport.alertes?.length>0 && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <div className="mb-2 flex items-center gap-2"><AlertTriangle size={11} className="text-amber-500"/><span className="text-[0.63rem] font-bold text-amber-600">Alertes</span></div>
                        <ul className="space-y-1.5">{rapport.alertes.map((a,i)=><li key={i} className="flex items-start gap-2 text-[0.73rem] text-gray-600"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400"/>{a}</li>)}</ul>
                      </div>
                    )}
                  </div>
                  {rapport.recommandations?.length>0 && (
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <div className="mb-2 flex items-center gap-2"><Lightbulb size={11} style={{ color:GOLD }}/><span className="text-[0.63rem] font-bold text-gray-400">Recommandations</span></div>
                      <ol className="space-y-1.5">{rapport.recommandations.map((r,i)=>(
                        <li key={i} className="flex items-start gap-2.5 text-[0.73rem] text-gray-600">
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[0.55rem] font-bold"
                            style={{ background:"rgba(201,165,90,0.15)", color:GOLD }}>{i+1}</span>
                          {r}
                        </li>
                      ))}</ol>
                    </div>
                  )}
                  {rapport.objectif_mois_prochain && (
                    <div className="flex items-start gap-3 rounded-2xl p-4"
                      style={{ borderColor:`rgba(201,165,90,0.25)`, border:"1px solid rgba(201,165,90,0.25)", background:"rgba(201,165,90,0.06)" }}>
                      <TrendingUp size={13} className="mt-0.5 shrink-0" style={{ color:GOLD }}/>
                      <div>
                        <p className="mb-1 text-[0.62rem] font-bold" style={{ color:`${GOLD}99` }}>Objectif mois prochain</p>
                        <p className="text-[0.77rem] text-gray-600">{rapport.objectif_mois_prochain}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Section "Aujourd'hui" — label ── */}
        <motion.div
          initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.35, delay:0.12, ease }}
          className="mb-3"
        >
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full" style={{ background:GOLD }}/>
            <h2 className="text-[12px] font-black uppercase tracking-[0.15em] text-gray-500">Activité</h2>
          </div>
        </motion.div>

        {/* ── Revenus + Top clients ── */}
        <motion.div
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.38, delay:0.15, ease }}
          className="grid gap-3 mb-4 lg:grid-cols-[1fr_260px]"
        >
          {/* Revenue chart */}
          <div className="rounded-2xl bg-white p-5"
            style={{ border:"1px solid rgba(0,0,0,0.05)", boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-bold text-gray-800">Revenus encaissés</p>
                <p className="text-[11px] text-gray-400">6 derniers mois</p>
              </div>
              {!chartsLoading && revenues.length > 0 && (
                <p className="text-[13px] font-black" style={{ color:GOLD }}>
                  {fmtEurInt(revenues.reduce((s,r)=>s+r.amount,0))}
                </p>
              )}
            </div>
            {chartsLoading ? (
              <div className="flex items-end gap-2 h-28">
                {[1,2,3,4,5,6].map(i=>(
                  <div key={i} className="flex-1 animate-pulse rounded-xl" style={{ height:`${32+i*11}%`, background:"rgba(0,0,0,0.05)" }}/>
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
                              background: isLast ? `linear-gradient(180deg,${GOLD},${GOLD}88)` : "rgba(0,0,0,0.07)",
                              boxShadow: isLast ? `0 6px 24px ${GOLD}30` : "none",
                            }}
                          />
                          {r.amount>0 && (
                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-gray-100 bg-white px-2 py-1 text-[0.6rem] font-semibold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm">
                              {fmtEurInt(r.amount)}
                            </div>
                          )}
                        </div>
                        <span className="text-[0.58rem] font-medium" style={{ color: isLast ? GOLD : "rgba(0,0,0,0.3)" }}>{r.label}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          {/* Top clients */}
          <div className="rounded-2xl bg-white p-5"
            style={{ border:"1px solid rgba(0,0,0,0.05)", boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
            <div className="mb-4">
              <p className="text-[13px] font-bold text-gray-800">Meilleurs clients</p>
              <p className="text-[11px] text-gray-400">3 mois glissants</p>
            </div>
            {chartsLoading ? (
              <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-8 animate-pulse rounded-xl" style={{ background:"rgba(0,0,0,0.05)" }}/>)}</div>
            ) : topClients.length===0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Users size={18} className="text-gray-200"/>
                <p className="text-[0.72rem] text-gray-400">Aucun encaissement récent</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topClients.map((c,i)=>{
                  const pct = Math.round((c.amount/topClients[0].amount)*100);
                  return (
                    <div key={c.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[0.72rem] font-medium text-gray-500 truncate max-w-[120px]">{c.name}</span>
                        <span className="text-[0.72rem] font-bold" style={{ color:GOLD }}>{fmtEurInt(c.amount)}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <motion.div
                          initial={{ width:0 }} animate={{ width:`${pct}%` }}
                          transition={{ duration:0.8, delay:0.4+i*0.08 }}
                          className="h-full rounded-full"
                          style={{ background: i===0 ? GOLD : `${GOLD}66` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Activité récente ── */}
        <motion.div
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.38, delay:0.22, ease }}
          className="mb-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full" style={{ background:GOLD }}/>
              <h2 className="text-[12px] font-black uppercase tracking-[0.15em] text-gray-500">Factures récentes</h2>
            </div>
            <Link href="/client/factures" className="text-[11px] font-bold transition hover:opacity-70" style={{ color:GOLD }}>
              Voir tout →
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white"
            style={{ border:"1px solid rgba(0,0,0,0.05)", boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
            {chartsLoading ? (
              <div className="divide-y divide-gray-50">
                {[1,2,3,4].map(i=>(
                  <div key={i} className="flex items-center gap-3.5 px-4 py-3.5">
                    <div className="h-8 w-8 animate-pulse rounded-xl bg-gray-100"/>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2.5 w-28 animate-pulse rounded-full bg-gray-100"/>
                      <div className="h-2 w-16 animate-pulse rounded-full bg-gray-50"/>
                    </div>
                    <div className="h-5 w-14 animate-pulse rounded-full bg-gray-100"/>
                  </div>
                ))}
              </div>
            ) : recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <ReceiptText size={20} className="text-gray-200"/>
                <p className="text-[0.72rem] text-gray-400">Aucune facture créée pour l&apos;instant</p>
                <Link href="/client/factures"
                  className="rounded-xl px-4 py-2 text-[0.72rem] font-bold text-white transition hover:opacity-90"
                  style={{ background:`linear-gradient(135deg,${GOLD},#b08d45)` }}>
                  Créer ma première facture
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentInvoices.map((inv,i) => {
                  const statusConfig: Record<string,{ label:string; color:string; bg:string; icon:React.ElementType }> = {
                    payé:       { label:"Payée",      color:"#16a34a", bg:"rgba(22,163,74,0.1)",    icon:CheckCircle2 },
                    envoyé:     { label:"Envoyée",    color:"#2563eb", bg:"rgba(37,99,235,0.1)",    icon:Send         },
                    en_attente: { label:"En attente", color:"#92681e", bg:"rgba(201,165,90,0.12)",  icon:CircleDot    },
                    brouillon:  { label:"Brouillon",  color:"#6b7280", bg:"rgba(107,114,128,0.1)",  icon:FileText     },
                    en_retard:  { label:"En retard",  color:"#dc2626", bg:"rgba(220,38,38,0.1)",    icon:AlertTriangle},
                  };
                  const s = statusConfig[inv.statut] ?? { label:inv.statut, color:"#6b7280", bg:"rgba(107,114,128,0.1)", icon:CircleDot };
                  const StatusIcon = s.icon;
                  const date = new Date(inv.created_at).toLocaleDateString("fr-FR",{ day:"numeric", month:"short" });
                  return (
                    <motion.div key={inv.id}
                      initial={{ opacity:0, x:-6 }} animate={{ opacity:1, x:0 }}
                      transition={{ duration:0.22, delay:0.24+i*0.04 }}>
                      <Link href="/client/factures"
                        className="group flex items-center gap-3.5 px-4 py-3 transition-colors hover:bg-gray-50">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                          style={{ background:"rgba(201,165,90,0.09)", border:"1px solid rgba(201,165,90,0.14)" }}>
                          <ReceiptText size={14} style={{ color:GOLD }}/>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.78rem] font-semibold text-gray-700">
                            {inv.client_nom || inv.numero || "Sans nom"}
                          </p>
                          <p className="text-[0.62rem] text-gray-400">
                            {inv.numero ? `${inv.numero} · ` : ""}{date}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background:s.bg }}>
                            <StatusIcon size={9} style={{ color:s.color }}/>
                            <span className="text-[0.6rem] font-semibold" style={{ color:s.color }}>{s.label}</span>
                          </div>
                          <span className="text-[0.78rem] font-bold" style={{ color:GOLD }}>
                            {fmtEurInt(inv.total_ttc ?? 0)}
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Modules ── */}
        <motion.div
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.38, delay:0.28, ease }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1 w-1 rounded-full" style={{ background:GOLD }}/>
            <h2 className="text-[12px] font-black uppercase tracking-[0.15em] text-gray-500">Modules</h2>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {TOOLS.map((item,i) => <ModuleIcon key={item.href} item={item} delay={0.3+i*0.04}/>)}
          </div>
        </motion.div>

        {/* ── Footer ── */}
        <p className="text-center text-[10px] text-gray-400">
          DJAMA PRO · Données en temps réel
        </p>
      </div>
    </div>
  );
}
