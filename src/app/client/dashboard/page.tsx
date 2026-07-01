"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ReceiptText, Users, FileText, Search,
  TrendingUp, Download, ArrowUpRight, Bell,
  AlertTriangle,
  FileBarChart2, X, ShieldCheck, Lightbulb,
  CheckCircle2, CircleDot, Send, Lock, Pencil,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { APP_ICONS } from "@/components/AppIcons";
import { fmtEurInt, fmtDuration } from "@/lib/format";
import { useSubscription } from "@/lib/use-require-subscription";
import { MODULE_GROUPS } from "@/lib/module-groups";
import { ModuleCard, ModuleGroupSection } from "@/components/ModuleCard";

const ease = [0.22, 1, 0.36, 1] as const;
const GOLD = "#c9a55a";


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

/* ── Sparkline SVG ── */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const allZero = data.every(v => v === 0);
  if (allZero) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = (max - min) || 1;
  const W = 56, H = 22;
  const pts = data.map((v, i) => {
    const x = ((i / (data.length - 1)) * W).toFixed(1);
    const y = (H - ((v - min) / range) * (H - 4) - 2).toFixed(1);
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" className="shrink-0">
      <polyline points={pts} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.75"/>
    </svg>
  );
}


/* ─────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────── */
export default function DashboardPage() {
  const { isPremium, isFree } = useSubscription();
  const [search,         setSearch]         = useState("");
  const [userName,      setUserName]      = useState("");
  const [stats,         setStats]         = useState<Stats | null>(null);
  const [statsLoading,  setStatsLoading]  = useState(true);
  const [revenues,      setRevenues]      = useState<MonthRevenue[]>([]);
  const [monthlyExp,    setMonthlyExp]    = useState<MonthRevenue[]>([]);
  const [topClients,    setTopClients]    = useState<TopClient[]>([]);
  const [overdue,       setOverdue]       = useState<OverdueInvoice[]>([]);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [rapportOpen,    setRapportOpen]    = useState(false);
  const [rapportLoading, setRapportLoading] = useState(false);
  const [rapport,        setRapport]        = useState<Rapport | null>(null);
  const [showAlert,      setShowAlert]      = useState(true);
  const [annualRev,      setAnnualRev]      = useState<{ label: string; cur: number; prev: number }[]>([]);
  const [annualLoad,     setAnnualLoad]     = useState(true);
  const [pendingReports, setPendingReports] = useState(0);
  const [goalAmount,  setGoalAmount]  = useState(0);
  const [goalEdit,    setGoalEdit]    = useState(false);
  const [goalInput,   setGoalInput]   = useState("");
  const [hoveredBar,  setHoveredBar]  = useState<number | null>(null);

  const router = useRouter();

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
      const [{ data: revRaw }, { data: expRaw6 }] = await Promise.all([
        supabase.from("documents").select("total_ttc, date_document")
          .eq("user_id", user.id).eq("type","facture").eq("statut","payé")
          .gte("date_document", sixMonthsAgo),
        supabase.from("expenses").select("amount, date")
          .eq("user_id", user.id).gte("date", sixMonthsAgo),
      ]);

      const monthData: MonthRevenue[] = [];
      const expMonthData: MonthRevenue[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const yr = d.getFullYear(); const mo = d.getMonth();
        const rev = (revRaw ?? [])
          .filter(r => { const rd = new Date((r.date_document as string) + "T12:00:00"); return rd.getFullYear()===yr && rd.getMonth()===mo; })
          .reduce((s,r) => s+((r.total_ttc as number) ?? 0), 0);
        const exp = (expRaw6 ?? [])
          .filter(e => { const ed = new Date((e.date as string) + "T12:00:00"); return ed.getFullYear()===yr && ed.getMonth()===mo; })
          .reduce((s,e) => s+((e.amount as number) ?? 0), 0);
        monthData.push({ label: SHORT_MONTHS[mo], amount: rev });
        expMonthData.push({ label: SHORT_MONTHS[mo], amount: exp });
      }
      setRevenues(monthData);
      setMonthlyExp(expMonthData);

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

      // Annual comparison (current year vs previous year)
      const curYear = today.getFullYear();
      const prevYear = curYear - 1;
      const [{ data: curYearRev }, { data: prevYearRev }, { count: pendingCnt }] = await Promise.all([
        supabase.from("documents").select("total_ttc,date_document").eq("user_id",user.id).eq("type","facture").eq("statut","payé").gte("date_document",`${curYear}-01-01`),
        supabase.from("documents").select("total_ttc,date_document").eq("user_id",user.id).eq("type","facture").eq("statut","payé").gte("date_document",`${prevYear}-01-01`).lte("date_document",`${prevYear}-12-31`),
        supabase.from("expense_reports").select("id",{ count:"exact", head:true }).eq("user_id",user.id).eq("status","submitted"),
      ]);
      setAnnualRev(SHORT_MONTHS.map((label, mo) => ({
        label,
        cur:  (curYearRev  ?? []).filter(r => new Date((r.date_document as string)+"T12:00:00").getMonth()===mo).reduce((s,r) => s+((r.total_ttc as number)??0), 0),
        prev: (prevYearRev ?? []).filter(r => new Date((r.date_document as string)+"T12:00:00").getMonth()===mo).reduce((s,r) => s+((r.total_ttc as number)??0), 0),
      })));
      setPendingReports(pendingCnt ?? 0);
      setAnnualLoad(false);
      setChartsLoading(false);
    }
    loadAll();
  }, []);

  useEffect(() => {
    async function loadGoal() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Charger goal depuis Supabase (avec fallback localStorage)
      const { data: goalRow } = await supabase
        .from("user_settings")
        .select("value")
        .eq("user_id", user.id)
        .eq("key", "goal_amount")
        .maybeSingle();

      if (goalRow?.value) {
        setGoalAmount(parseFloat(goalRow.value) || 0);
      } else {
        // Fallback localStorage + migration auto
        const local = localStorage.getItem("djama_monthly_goal");
        if (local) {
          const v = parseFloat(local) || 0;
          setGoalAmount(v);
          // Migrer vers Supabase
          await supabase.from("user_settings").upsert(
            { user_id: user.id, key: "goal_amount", value: String(v), updated_at: new Date().toISOString() },
            { onConflict: "user_id,key" }
          );
          localStorage.removeItem("djama_monthly_goal");
        }
      }
    }
    loadGoal();
  }, []);

  const runRapport = useCallback(async () => {
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
  }, []);

  const ca       = stats?.caThisMois    ?? 0;
  const dep      = stats?.depensesMois  ?? 0;
  const netMois  = ca - dep;

  const exportData = useCallback(() => {
    const lines: (string | number)[][] = [
      ["Type","Label","Montant (€)"],
      ...revenues.map(r    => ["Revenu mensuel",   r.label,  r.amount]),
      ...monthlyExp.map(e  => ["Dépense mensuelle", e.label, e.amount]),
      ...topClients.map(c  => ["Top client",        c.name,  c.amount]),
      ["Stat","CA ce mois",          ca],
      ["Stat","Dépenses ce mois",    dep],
      ["Stat","Résultat net",        netMois],
      ["Stat","Heures cette semaine",stats?.heuresSemaine ?? 0],
      ["Stat","Contacts actifs",     stats?.contactsActifs ?? 0],
    ];
    const csv  = lines.map(r => r.join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type:"text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `djama-dashboard-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }, [revenues, monthlyExp, topClients, ca, dep, netMois, stats]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setRapportOpen(false); return; }
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.key === "r" || e.key === "R") && !e.ctrlKey && !e.metaKey) void runRapport();
      if ((e.key === "e" || e.key === "E") && !e.ctrlKey && !e.metaKey) exportData();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [runRapport, exportData]);

  /* ─────────────────────────────────────────────────
     RENDU
  ───────────────────────────────────────────────── */
  return (
    <div className="relative min-h-screen bg-[#07080e] text-white">

      {/* ══════════════════════════════════════════
          HERO SOMBRE
      ══════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(155deg,#07080e 0%,#0d1117 50%,#07080e 100%)" }}
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
            <motion.button
              initial={{ opacity:0, scale:0.88 }} animate={{ opacity:1, scale:1 }}
              transition={{ duration:0.35, delay:0.22, ease }}
              whileHover={{ scale:1.04, y:-1 }} whileTap={{ scale:0.92 }}
              onClick={exportData}
              title="Exporter les données"
              className="flex mt-1 shrink-0 items-center justify-center rounded-2xl px-3 py-2.5 transition"
              style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.45)" }}
            >
              <Download size={13}/>
            </motion.button>
          </motion.div>

          {/* ── 4 metric cards ── */}
          <motion.div
            initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.45, delay:0.07, ease }}
            className="grid grid-cols-2 gap-3 mb-4"
          >
            {[
              {
                label: "Entrées",
                href: "/client/factures",
                sub: new Date().toLocaleDateString("fr-FR",{month:"short",year:"numeric"}),
                value: statsLoading ? null : fmtEurInt(ca),
                valueColor: "white",
                sparkData: revenues.map(r => r.amount),
                sparkColor: "#4ade80",
              },
              {
                label: "Sorties",
                href: "/client/depenses",
                sub: "Dépenses · ce mois",
                value: statsLoading ? null : fmtEurInt(dep),
                valueColor: dep > 0 ? "#f87171" : "white",
                sparkData: monthlyExp.map(e => e.amount),
                sparkColor: "#f87171",
              },
              {
                label: "Résultat net",
                href: "/client/tresorerie",
                sub: "Entrées − Sorties",
                value: statsLoading ? null : ((netMois >= 0 ? "+" : "") + fmtEurInt(netMois)),
                valueColor: netMois >= 0 ? "#4ade80" : "#f87171",
                sparkData: revenues.map((r,i) => r.amount - (monthlyExp[i]?.amount ?? 0)),
                sparkColor: netMois >= 0 ? "#4ade80" : "#f87171",
              },
              {
                label: "Heures · sem.",
                href: "/client/chrono",
                sub: "Time tracking",
                value: statsLoading ? null : (stats?.heuresSemaine ? fmtDuration(stats.heuresSemaine) : "0h"),
                valueColor: "#60a5fa",
                sparkData: [] as number[],
                sparkColor: "#60a5fa",
              },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.3, delay:0.12+i*0.07, ease }}
                onClick={() => router.push(card.href)}
                className="group relative cursor-pointer rounded-2xl p-4 transition-all hover:scale-[1.02] hover:brightness-110"
                style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", backdropFilter:"blur(12px)" }}
              >
                <ArrowUpRight size={11} className="absolute top-3 right-3 opacity-0 group-hover:opacity-40 transition-opacity text-white" />
                <div className="flex items-start justify-between mb-2">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/30">{card.label}</p>
                  <Sparkline data={card.sparkData as number[]} color={card.sparkColor} />
                </div>
                {card.value === null ? (
                  <div className="h-7 w-20 rounded-lg animate-pulse" style={{ background:"rgba(255,255,255,0.08)" }}/>
                ) : (
                  <p className="text-[1.35rem] font-black leading-tight tabular-nums" style={{ color: card.valueColor }}>
                    {card.value}
                  </p>
                )}
                <p className="text-[9px] text-white/20 mt-1">{card.sub}</p>
              </motion.div>
            ))}
          </motion.div>

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
          <path d="M0,24 C180,56 420,6 720,28 C1020,50 1260,10 1440,32 L1440,56 L0,56 Z" fill="#07080e"/>
        </svg>
      </div>

      {/* ══════════════════════════════════════════
          CONTENU DARK
      ══════════════════════════════════════════ */}
      <div className="mx-auto max-w-4xl px-4 pb-14 pt-3 sm:px-6">

        {/* ── Alertes urgentes ── */}
        {(() => {
          const alerts = [
            ...(overdue.length > 0 ? [{
              key: "overdue",
              icon: AlertTriangle,
              color: "#f87171",
              bg: "rgba(248,113,113,0.07)",
              msg: `${overdue.length} facture${overdue.length>1?"s":""} en retard de paiement`,
              href: "/client/tresorerie",
              cta: "Voir",
            }] : []),
            ...(!statsLoading && netMois < 0 && ca > 0 ? [{
              key: "net",
              icon: TrendingUp,
              color: "#fbbf24",
              bg: "rgba(251,191,36,0.07)",
              msg: `Résultat net négatif ce mois (${fmtEurInt(netMois)})`,
              href: "/client/depenses",
              cta: "Dépenses",
            }] : []),
            ...(pendingReports > 0 ? [{
              key: "reports",
              icon: FileText,
              color: "#fbbf24",
              bg: "rgba(251,191,36,0.07)",
              msg: `${pendingReports} note${pendingReports>1?"s":""} de frais en attente d'approbation`,
              href: "/client/depenses",
              cta: "Notes",
            }] : []),
          ];
          if (alerts.length === 0) return null;
          return (
            <AnimatePresence>
              {showAlert && (
                <motion.div
                  initial={{ opacity:0, y:-8, height:0 }} animate={{ opacity:1, y:0, height:"auto" }}
                  exit={{ opacity:0, y:-8, height:0 }} transition={{ duration:0.28, ease }}
                  className="overflow-hidden mb-4"
                >
                  <div className="overflow-hidden rounded-2xl" style={{ border:"1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex items-center justify-between px-4 py-2.5"
                      style={{ background:"rgba(239,68,68,0.1)", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center gap-2">
                        <Bell size={12} className="text-red-400"/>
                        <span className="text-[11px] font-bold text-red-400">
                          Alertes urgentes · {alerts.length}
                        </span>
                      </div>
                      <button onClick={()=>setShowAlert(false)} className="text-red-400/50 hover:text-red-400 transition-colors">
                        <X size={13}/>
                      </button>
                    </div>
                    {alerts.map(({ key, icon: Icon, color, bg, msg, href, cta }) => (
                      <div key={key} className="flex items-center gap-3 px-4 py-2.5" style={{ background:bg, borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                        <Icon size={13} className="shrink-0" style={{ color }}/>
                        <p className="flex-1 text-[12px]" style={{ color }}>{msg}</p>
                        <Link href={href} className="shrink-0 text-[11px] font-bold underline underline-offset-2" style={{ color }}>
                          {cta}
                        </Link>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          );
        })()}

        {/* ── Rapport modal ── */}
        <AnimatePresence>
          {rapportOpen && (
            <motion.div
              initial={{ opacity:0, y:-10, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }}
              exit={{ opacity:0, y:-8, scale:0.97 }} transition={{ duration:0.25 }}
              className="overflow-hidden rounded-3xl mb-4 border border-white/8 bg-[#0e1420] shadow-lg shadow-black/30"
            >
              <div className="flex items-center justify-between border-b border-white/6 px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <FileBarChart2 size={13} style={{ color:GOLD }}/>
                  <span className="text-[0.85rem] font-bold text-white">
                    Rapport IA — {new Date().toLocaleDateString("fr-FR",{month:"long",year:"numeric"})}
                  </span>
                </div>
                <button onClick={()=>setRapportOpen(false)} className="text-white/30 hover:text-white/60 transition-colors">
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
                        <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5"/>
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
                      <p className="text-[0.62rem] font-medium text-white/40">Santé financière</p>
                      <p className="mt-1 text-[0.8rem] leading-relaxed text-white/60">{rapport.resume_executif}</p>
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
                        <div key={k.label} className="rounded-2xl border border-white/6 bg-white/4 px-3.5 py-3">
                          <p className="text-[0.6rem] font-medium text-white/40">{k.label}</p>
                          <p className="mt-0.5 text-[0.95rem] font-black text-white">{k.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {rapport.points_forts?.length>0 && (
                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-4">
                        <div className="mb-2 flex items-center gap-2"><ShieldCheck size={11} className="text-emerald-400"/><span className="text-[0.63rem] font-bold text-emerald-400">Points forts</span></div>
                        <ul className="space-y-1.5">{rapport.points_forts.map((p,i)=><li key={i} className="flex items-start gap-2 text-[0.73rem] text-white/60"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400"/>{p}</li>)}</ul>
                      </div>
                    )}
                    {rapport.alertes?.length>0 && (
                      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4">
                        <div className="mb-2 flex items-center gap-2"><AlertTriangle size={11} className="text-amber-400"/><span className="text-[0.63rem] font-bold text-amber-400">Alertes</span></div>
                        <ul className="space-y-1.5">{rapport.alertes.map((a,i)=><li key={i} className="flex items-start gap-2 text-[0.73rem] text-white/60"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400"/>{a}</li>)}</ul>
                      </div>
                    )}
                  </div>
                  {rapport.recommandations?.length>0 && (
                    <div className="rounded-2xl border border-white/6 bg-white/4 p-4">
                      <div className="mb-2 flex items-center gap-2"><Lightbulb size={11} style={{ color:GOLD }}/><span className="text-[0.63rem] font-bold text-white/40">Recommandations</span></div>
                      <ol className="space-y-1.5">{rapport.recommandations.map((r,i)=>(
                        <li key={i} className="flex items-start gap-2.5 text-[0.73rem] text-white/60">
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
                        <p className="text-[0.77rem] text-white/60">{rapport.objectif_mois_prochain}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Objectif mensuel + Contacts actifs ── */}
        <motion.div
          initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.35, delay:0.1, ease }}
          className="flex gap-3 mb-4"
        >
          {/* Objectif mensuel */}
          <div className="flex-1 rounded-2xl p-3.5"
            style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/30">Objectif du mois</p>
              <button
                onClick={() => { setGoalInput(goalAmount > 0 ? String(goalAmount) : ""); setGoalEdit(true); }}
                className="text-white/20 hover:text-white/50 transition-colors">
                <Pencil size={10}/>
              </button>
            </div>
            {goalEdit ? (
              <div className="flex items-center gap-1.5">
                <input
                  autoFocus type="number" value={goalInput}
                  onChange={e => setGoalInput(e.target.value)}
                  onKeyDown={async e => {
                    if (e.key === "Enter") {
                      const v = Math.max(0, Number(goalInput));
                      setGoalAmount(v);
                      setGoalEdit(false);
                      const { data: { user } } = await supabase.auth.getUser();
                      if (user) await supabase.from("user_settings").upsert(
                        { user_id: user.id, key: "goal_amount", value: String(v), updated_at: new Date().toISOString() },
                        { onConflict: "user_id,key" }
                      );
                    }
                    if (e.key === "Escape") setGoalEdit(false);
                  }}
                  onBlur={async () => {
                    const v = Math.max(0, Number(goalInput));
                    setGoalAmount(v);
                    setGoalEdit(false);
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) await supabase.from("user_settings").upsert(
                      { user_id: user.id, key: "goal_amount", value: String(v), updated_at: new Date().toISOString() },
                      { onConflict: "user_id,key" }
                    );
                  }}
                  className="w-full rounded-lg bg-white/8 px-2 py-1 text-[0.75rem] font-bold text-white outline-none border border-white/15"
                  placeholder="Ex: 5000"
                />
                <span className="text-[0.6rem] text-white/30 shrink-0">€</span>
              </div>
            ) : goalAmount > 0 ? (
              <>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-[1.15rem] font-black" style={{ color: ca >= goalAmount ? "#4ade80" : GOLD }}>
                    {Math.min(100, Math.round((ca / goalAmount) * 100))}%
                  </span>
                  <span className="text-[0.6rem] text-white/30">{fmtEurInt(ca)} / {fmtEurInt(goalAmount)}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (ca / goalAmount) * 100)}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full rounded-full"
                    style={{ background: ca >= goalAmount ? "#4ade80" : `linear-gradient(90deg,${GOLD},#b08d45)` }}
                  />
                </div>
              </>
            ) : (
              <button
                onClick={() => { setGoalInput(""); setGoalEdit(true); }}
                className="text-[0.68rem] text-white/25 hover:text-white/50 transition-colors">
                Définir un objectif →
              </button>
            )}
          </div>

          {/* Contacts actifs */}
          <div
            className="rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] hover:brightness-110"
            onClick={() => router.push("/client/crm")}
            style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", minWidth:"110px" }}>
            <div className="flex items-start justify-between">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/30">Contacts actifs</p>
              <ArrowUpRight size={11} className="opacity-0 group-hover:opacity-40 text-white transition-opacity"/>
            </div>
            {statsLoading ? (
              <div className="h-7 w-14 rounded-lg animate-pulse mt-2" style={{ background:"rgba(255,255,255,0.08)" }}/>
            ) : (
              <p className="text-[1.35rem] font-black leading-tight tabular-nums text-white mt-1">
                {stats?.contactsActifs ?? 0}
              </p>
            )}
            <div className="flex items-center gap-1 mt-1">
              <Users size={9} className="text-white/20"/>
              <p className="text-[9px] text-white/20">CRM</p>
            </div>
          </div>
        </motion.div>

        {/* ── Section "Activité" — label ── */}
        <motion.div
          initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.35, delay:0.12, ease }}
          className="mb-3"
        >
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full" style={{ background:GOLD }}/>
            <h2 className="text-[12px] font-black uppercase tracking-[0.15em] text-white/30">Activité</h2>
          </div>
        </motion.div>

        {/* ── Flux de trésorerie ── */}
        <motion.div
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.38, delay:0.15, ease }}
          className="mb-4"
        >
          <div className="rounded-2xl border border-white/6 bg-white/4 p-5 backdrop-blur-sm shadow-lg shadow-black/30">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-bold text-white">Flux de trésorerie</p>
                <p className="text-[11px] text-white/40">6 derniers mois</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-400"/>
                  <span className="text-[10px] text-white/40">Entrées</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-red-400"/>
                  <span className="text-[10px] text-white/40">Sorties</span>
                </div>
              </div>
            </div>
            {chartsLoading ? (
              <div className="flex items-end gap-2 h-32">
                {[1,2,3,4,5,6].map(i=>(
                  <div key={i} className="flex flex-1 items-end gap-0.5">
                    <div className="flex-1 animate-pulse rounded-t-md" style={{ height:`${28+i*9}%`, background:"rgba(74,222,128,0.12)" }}/>
                    <div className="flex-1 animate-pulse rounded-t-md" style={{ height:`${18+i*7}%`, background:"rgba(248,113,113,0.12)" }}/>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-end gap-2 h-32">
                {(()=>{
                  const max = Math.max(
                    ...revenues.map(r=>r.amount),
                    ...monthlyExp.map(e=>e.amount),
                    1
                  );
                  return revenues.map((r,i)=>{
                    const expAmt = monthlyExp[i]?.amount ?? 0;
                    const revPct = Math.max((r.amount/max)*100, r.amount>0?5:0);
                    const expPct = Math.max((expAmt/max)*100, expAmt>0?5:0);
                    const isLast = i===revenues.length-1;
                    return (
                      <div key={r.label} className="group relative flex flex-1 flex-col items-center gap-1"
                        onMouseEnter={() => setHoveredBar(i)}
                        onMouseLeave={() => setHoveredBar(null)}
                      >
                        {hoveredBar === i && (r.amount > 0 || expAmt > 0) && (
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-10 pointer-events-none rounded-lg px-2 py-1 text-center"
                            style={{ background:"rgba(10,10,20,0.95)", border:"1px solid rgba(255,255,255,0.1)", whiteSpace:"nowrap" }}>
                            {r.amount > 0 && <p className="text-[0.55rem] font-bold text-emerald-400">+{fmtEurInt(r.amount)}</p>}
                            {expAmt > 0 && <p className="text-[0.55rem] font-bold text-red-400">−{fmtEurInt(expAmt)}</p>}
                          </div>
                        )}
                        <div className="flex w-full items-end gap-0.5" style={{ height:"96px" }}>
                          {/* Barre Entrées (verte) */}
                          <motion.div
                            initial={{ height:0 }} animate={{ height:`${revPct}%` }}
                            transition={{ duration:0.7, delay:0.3+i*0.07, ease }}
                            className="flex-1 rounded-t-md"
                            style={{ background: isLast ? "linear-gradient(180deg,#4ade80,#16a34a)" : "rgba(74,222,128,0.3)" }}
                          />
                          {/* Barre Sorties (rouge) */}
                          <motion.div
                            initial={{ height:0 }} animate={{ height:`${expPct}%` }}
                            transition={{ duration:0.7, delay:0.33+i*0.07, ease }}
                            className="flex-1 rounded-t-md"
                            style={{ background: isLast ? "linear-gradient(180deg,#f87171,#dc2626)" : "rgba(248,113,113,0.3)" }}
                          />
                        </div>
                        <span className="text-[0.58rem] font-medium" style={{ color: isLast ? GOLD : "rgba(255,255,255,0.25)" }}>
                          {r.label}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Graphique annuel comparatif ── */}
        <motion.div
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.38, delay:0.17, ease }}
          className="mb-4"
        >
          <div className="rounded-2xl border border-white/6 bg-white/4 p-5 backdrop-blur-sm shadow-lg shadow-black/30">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-bold text-white">Revenus annuels</p>
                <p className="text-[11px] text-white/40">{new Date().getFullYear()} vs {new Date().getFullYear()-1}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ background:GOLD }}/>
                  <span className="text-[10px] text-white/40">{new Date().getFullYear()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-white/20"/>
                  <span className="text-[10px] text-white/40">{new Date().getFullYear()-1}</span>
                </div>
              </div>
            </div>
            {annualLoad ? (
              <div className="flex items-end gap-1 h-24">
                {Array.from({length:12}).map((_,i)=>(
                  <div key={i} className="flex flex-1 items-end gap-px">
                    <div className="flex-1 animate-pulse rounded-t-sm" style={{ height:`${25+i*4}%`, background:"rgba(201,165,90,0.1)" }}/>
                    <div className="flex-1 animate-pulse rounded-t-sm" style={{ height:`${18+i*3}%`, background:"rgba(255,255,255,0.05)" }}/>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-end gap-1 h-24">
                {(()=>{
                  const max = Math.max(...annualRev.map(m=>Math.max(m.cur,m.prev)), 1);
                  return annualRev.map((m, i) => {
                    const curPct  = Math.max((m.cur  / max)*100, m.cur  > 0 ? 4 : 0);
                    const prevPct = Math.max((m.prev / max)*100, m.prev > 0 ? 4 : 0);
                    const isCur   = i === new Date().getMonth();
                    return (
                      <div key={m.label} className="group flex flex-1 flex-col items-center gap-0.5">
                        <div className="flex w-full items-end gap-px" style={{ height:"84px" }}>
                          <motion.div
                            initial={{ height:0 }} animate={{ height:`${curPct}%` }}
                            transition={{ duration:0.6, delay:0.25+i*0.03, ease }}
                            className="flex-1 rounded-t-sm"
                            style={{ background: m.cur > 0 ? (isCur ? `rgba(201,165,90,0.85)` : `rgba(201,165,90,${0.35+0.4*(m.cur/max)})`) : "rgba(255,255,255,0.04)" }}
                          />
                          <motion.div
                            initial={{ height:0 }} animate={{ height:`${prevPct}%` }}
                            transition={{ duration:0.6, delay:0.27+i*0.03, ease }}
                            className="flex-1 rounded-t-sm"
                            style={{ background: m.prev > 0 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.03)" }}
                          />
                        </div>
                        <span className="text-[0.45rem] font-medium" style={{ color: isCur ? GOLD : "rgba(255,255,255,0.18)" }}>
                          {m.label}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Meilleurs clients ── */}
        <motion.div
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.38, delay:0.18, ease }}
          className="mb-4"
        >
          <div className="rounded-2xl border border-white/6 bg-white/4 p-5 backdrop-blur-sm shadow-lg shadow-black/30">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-bold text-white">Meilleurs clients</p>
                <p className="text-[11px] text-white/40">3 mois glissants</p>
              </div>
              {!chartsLoading && topClients.length > 0 && (
                <p className="text-[12px] font-black" style={{ color:GOLD }}>
                  {fmtEurInt(topClients.reduce((s,c)=>s+c.amount,0))}
                </p>
              )}
            </div>
            {chartsLoading ? (
              <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-8 animate-pulse rounded-xl bg-white/5"/>)}</div>
            ) : topClients.length===0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Users size={18} className="text-white/20"/>
                <p className="text-[0.72rem] text-white/40">Aucun encaissement récent</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topClients.map((c,i)=>{
                  const pct = Math.round((c.amount/topClients[0].amount)*100);
                  return (
                    <div key={c.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full shrink-0" style={{ background: i===0 ? GOLD : `${GOLD}66` }}/>
                          <span className="text-[0.72rem] font-medium text-white/60 truncate max-w-[150px]">{c.name}</span>
                        </div>
                        <span className="text-[0.72rem] font-bold ml-2" style={{ color:GOLD }}>{fmtEurInt(c.amount)}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
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
              <h2 className="text-[12px] font-black uppercase tracking-[0.15em] text-white/30">Factures récentes</h2>
            </div>
            <Link href="/client/factures" className="text-[11px] font-bold transition hover:opacity-70" style={{ color:GOLD }}>
              Voir tout →
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/6 bg-white/4 shadow-lg shadow-black/30">
            {chartsLoading ? (
              <div className="divide-y divide-white/5">
                {[1,2,3,4].map(i=>(
                  <div key={i} className="flex items-center gap-3.5 px-4 py-3.5">
                    <div className="h-8 w-8 animate-pulse rounded-xl bg-white/6"/>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2.5 w-28 animate-pulse rounded-full bg-white/6"/>
                      <div className="h-2 w-16 animate-pulse rounded-full bg-white/4"/>
                    </div>
                    <div className="h-5 w-14 animate-pulse rounded-full bg-white/6"/>
                  </div>
                ))}
              </div>
            ) : recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <ReceiptText size={20} className="text-white/20"/>
                <p className="text-[0.72rem] text-white/40">Aucune facture créée pour l&apos;instant</p>
                <Link href="/client/factures"
                  className="rounded-xl px-4 py-2 text-[0.72rem] font-bold text-[#07080e] transition hover:opacity-90"
                  style={{ background:`linear-gradient(135deg,${GOLD},#b08d45)` }}>
                  Créer ma première facture
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {recentInvoices.map((inv,i) => {
                  const statusConfig: Record<string,{ label:string; color:string; bg:string; icon:React.ElementType }> = {
                    payé:       { label:"Payée",      color:"#4ade80", bg:"rgba(74,222,128,0.1)",    icon:CheckCircle2 },
                    envoyé:     { label:"Envoyée",    color:"#60a5fa", bg:"rgba(96,165,250,0.1)",    icon:Send         },
                    en_attente: { label:"En attente", color:"#c9a55a", bg:"rgba(201,165,90,0.12)",   icon:CircleDot    },
                    brouillon:  { label:"Brouillon",  color:"#6b7280", bg:"rgba(107,114,128,0.1)",   icon:FileText     },
                    en_retard:  { label:"En retard",  color:"#f87171", bg:"rgba(248,113,113,0.1)",   icon:AlertTriangle},
                  };
                  const s = statusConfig[inv.statut] ?? { label:inv.statut, color:"#6b7280", bg:"rgba(107,114,128,0.1)", icon:CircleDot };
                  const StatusIcon = s.icon;
                  const date = new Date(inv.created_at).toLocaleDateString("fr-FR",{ day:"numeric", month:"short" });
                  return (
                    <motion.div key={inv.id}
                      initial={{ opacity:0, x:-6 }} animate={{ opacity:1, x:0 }}
                      transition={{ duration:0.22, delay:0.24+i*0.04 }}>
                      <Link href="/client/factures"
                        className="group flex items-center gap-3.5 px-4 py-3 transition-colors hover:bg-white/4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                          style={{ background:"rgba(201,165,90,0.08)", border:"1px solid rgba(201,165,90,0.14)" }}>
                          <ReceiptText size={14} style={{ color:GOLD }}/>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.78rem] font-semibold text-white/80">
                            {inv.client_nom || inv.numero || "Sans nom"}
                          </p>
                          <p className="text-[0.62rem] text-white/40">
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
          <div className="flex items-center gap-2 mb-4">
            <div className="h-1 w-1 rounded-full" style={{ background:GOLD }}/>
            <h2 className="text-[12px] font-black uppercase tracking-[0.15em] text-white/30">Modules</h2>
          </div>

          {/* Barre de recherche */}
          <div className="relative mb-5">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un module…"
              className="w-full rounded-2xl border border-white/8 bg-white/4 py-3 pl-11 pr-10 text-[13px] text-white placeholder:text-white/25 outline-none transition focus:border-white/20 focus:bg-white/6 backdrop-blur-sm"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Résultats recherche */}
          {search.trim() ? (
            (() => {
              const q = search.toLowerCase();
              const results = MODULE_GROUPS
                .flatMap(g => g.modules)
                .filter(m => m.label.toLowerCase().includes(q) || m.sub.toLowerCase().includes(q));
              return results.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 rounded-2xl border border-white/6 bg-white/4">
                  <Search size={22} className="text-white/20"/>
                  <p className="text-[12px] text-white/40">Aucun module pour &ldquo;{search}&rdquo;</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {results.map((mod, mi) => (
                    <ModuleCard
                      key={mod.href + mi}
                      mod={mod}
                      index={mi}
                      isPremium={isPremium}
                    />
                  ))}
                </div>
              );
            })()
          ) : (
            /* Groupes complets */
            <div className="space-y-6">
              {MODULE_GROUPS.map((group, gi) => (
                <ModuleGroupSection
                  key={group.label}
                  group={group}
                  groupIndex={gi}
                  isPremium={isPremium}
                  isFree={isFree}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Footer ── */}
        <p className="text-center text-[10px] text-white/25">
          DJAMA PRO · Données en temps réel
        </p>
      </div>
    </div>
  );
}
