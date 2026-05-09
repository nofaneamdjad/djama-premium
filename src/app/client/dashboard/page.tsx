"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ReceiptText, Users, Timer, Receipt, FileText, Search,
  TrendingUp, StickyNote, Star, Sparkles, Zap, CalendarRange,
  Clock, Euro, UserCheck, TrendingDown, ArrowUpRight,
  AlertTriangle, ChevronRight, BarChart3,
  FileBarChart2, Loader2, X, ShieldCheck, Lightbulb,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { fmtEurInt, fmtDuration } from "@/lib/format";

/* ═══════════════════════════════════════════════════════════
   CONSTANTES
═══════════════════════════════════════════════════════════ */
const ease = [0.16, 1, 0.3, 1] as const;

const TOOLS = [
  {
    href: "/client/factures",
    label: "Factures & Devis",
    desc: "Créez et envoyez vos documents",
    Icon: ReceiptText,
    color: "#4ade80",
    bg: "rgba(74,222,128,0.08)",
    border: "rgba(74,222,128,0.18)",
  },
  {
    href: "/client/crm",
    label: "CRM Contacts",
    desc: "Gérez vos prospects et clients",
    Icon: Users,
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.08)",
    border: "rgba(56,189,248,0.18)",
  },
  {
    href: "/client/chrono",
    label: "Chrono Pro",
    desc: "Suivez le temps par projet",
    Icon: Timer,
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    border: "rgba(167,139,250,0.18)",
  },
  {
    href: "/client/depenses",
    label: "Dépenses",
    desc: "Catégorisez vos frais pros",
    Icon: Receipt,
    color: "#f97316",
    bg: "rgba(249,115,22,0.08)",
    border: "rgba(249,115,22,0.18)",
  },
  {
    href: "/client/contrats",
    label: "Contrats IA",
    desc: "Générez des contrats en secondes",
    Icon: FileText,
    color: "#c9a55a",
    bg: "rgba(201,165,90,0.08)",
    border: "rgba(201,165,90,0.18)",
  },
  {
    href: "/client/sourcing",
    label: "Sourcing IA",
    desc: "Trouvez les meilleurs fournisseurs",
    Icon: Search,
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.08)",
    border: "rgba(96,165,250,0.18)",
  },
  {
    href: "/client/tresorerie",
    label: "Trésorerie",
    desc: "Pilotez votre cash-flow",
    Icon: TrendingUp,
    color: "#34d399",
    bg: "rgba(52,211,153,0.08)",
    border: "rgba(52,211,153,0.18)",
  },
  {
    href: "/client/bloc-notes",
    label: "Bloc-notes",
    desc: "Capturez vos idées rapidement",
    Icon: StickyNote,
    color: "#facc15",
    bg: "rgba(250,204,21,0.08)",
    border: "rgba(250,204,21,0.18)",
  },
  {
    href: "/client/reputation",
    label: "Réputation",
    desc: "Collectez et gérez vos avis",
    Icon: Star,
    color: "#fb7185",
    bg: "rgba(251,113,133,0.08)",
    border: "rgba(251,113,133,0.18)",
  },
  {
    href: "/client/coaching-ia",
    label: "Coaching IA",
    desc: "Accélérez votre croissance",
    Icon: Sparkles,
    color: "#d946ef",
    bg: "rgba(217,70,239,0.08)",
    border: "rgba(217,70,239,0.18)",
  },
  {
    href: "/client/assistant",
    label: "Assistant IA",
    desc: "Relances et actions intelligentes",
    Icon: Zap,
    color: "#22d3ee",
    bg: "rgba(34,211,238,0.08)",
    border: "rgba(34,211,238,0.18)",
  },
  {
    href: "/client/planification",
    label: "Planification",
    desc: "Organisez l'agenda de l'équipe",
    Icon: CalendarRange,
    color: "#818cf8",
    bg: "rgba(129,140,248,0.08)",
    border: "rgba(129,140,248,0.18)",
  },
] as const;

/* ═══════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════ */
function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Bonjour";
  if (h >= 12 && h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function startOfWeekISO(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
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

/* ═══════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════ */
interface Stats {
  caThisMois: number;
  heuresSemaine: number;
  depensesMois: number;
  contactsActifs: number;
}

interface MonthRevenue {
  label: string;   // "Jan", "Fév", etc.
  amount: number;
}

interface TopClient {
  name: string;
  amount: number;
}

interface OverdueInvoice {
  id: string;
  numero: string;
  client_nom: string;
  total_ttc: number;
  date_echeance: string | null;
}

const SHORT_MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const [userName,     setUserName]     = useState("");
  const [stats,        setStats]        = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [revenues,     setRevenues]     = useState<MonthRevenue[]>([]);
  const [topClients,   setTopClients]   = useState<TopClient[]>([]);
  const [overdue,      setOverdue]      = useState<OverdueInvoice[]>([]);
  const [chartsLoading,setChartsLoading]= useState(true);

  /* ── Rapport mensuel ── */
  type Rapport = {
    mois: string;
    score_sante: number;
    resume_executif: string;
    kpis: { revenu_total: number; depenses_totales: number; resultat_net: number; taux_recouvrement: string; nb_factures: number; nb_clients: number };
    top_clients: { nom: string; montant: number }[];
    top_depenses: { categorie: string; montant: number }[];
    points_forts: string[];
    alertes: string[];
    recommandations: string[];
    objectif_mois_prochain: string;
  };
  const [rapportOpen,    setRapportOpen]    = useState(false);
  const [rapportLoading, setRapportLoading] = useState(false);
  const [rapport,        setRapport]        = useState<Rapport | null>(null);

  useEffect(() => {
    async function loadAll() {
      /* ── User ── */
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name =
          (user.user_metadata?.full_name as string | undefined) ||
          (user.user_metadata?.name as string | undefined) ||
          user.email?.split("@")[0] ||
          "";
        setUserName(name);
      }

      /* ── Stats KPI ── */
      const weekStart  = startOfWeekISO();
      const monthStart = startOfMonthISO();

      const [docsRes, timeRes, expRes, crmRes] = await Promise.all([
        supabase
          .from("documents")
          .select("total_ttc")
          .eq("type", "facture")
          .in("statut", ["envoyé", "payé"])
          .gte("created_at", new Date(monthStart + "T00:00:00").toISOString()),
        supabase
          .from("time_entries")
          .select("duration_minutes")
          .gte("date", weekStart),
        supabase
          .from("expenses")
          .select("amount")
          .gte("date", monthStart),
        supabase
          .from("contacts")
          .select("id", { count: "exact", head: true })
          .eq("status", "actif"),
      ]);

      setStats({
        caThisMois:     (docsRes.data ?? []).reduce((s, d) => s + (d.total_ttc ?? 0), 0),
        heuresSemaine:  (timeRes.data ?? []).reduce((s, e) => s + (e.duration_minutes ?? 0), 0),
        depensesMois:   (expRes.data  ?? []).reduce((s, e) => s + (e.amount ?? 0), 0),
        contactsActifs: crmRes.count ?? 0,
      });
      setStatsLoading(false);

      /* ── Revenue chart — 6 derniers mois ── */
      const today = new Date();
      const monthData: MonthRevenue[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const start = d.toISOString().slice(0, 10);
        const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
        const { data } = await supabase
          .from("documents")
          .select("total_ttc")
          .eq("type", "facture")
          .eq("statut", "payé")
          .gte("date_document", start)
          .lte("date_document", end);
        monthData.push({
          label:  SHORT_MONTHS[d.getMonth()],
          amount: (data ?? []).reduce((s, r) => s + (r.total_ttc ?? 0), 0),
        });
      }
      setRevenues(monthData);

      /* ── Top clients (3 mois glissants) ── */
      const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1).toISOString().slice(0, 10);
      const { data: paidDocs } = await supabase
        .from("documents")
        .select("client_nom, total_ttc")
        .eq("type", "facture")
        .eq("statut", "payé")
        .gte("date_document", threeMonthsAgo);

      const clientMap = new Map<string, number>();
      for (const d of (paidDocs ?? [])) {
        const n = (d.client_nom as string) || "Inconnu";
        clientMap.set(n, (clientMap.get(n) ?? 0) + ((d.total_ttc as number) ?? 0));
      }
      setTopClients(
        [...clientMap.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, amount]) => ({ name, amount }))
      );

      /* ── Overdue invoices ── */
      const { data: overdueDocs } = await supabase
        .from("documents")
        .select("id, numero, client_nom, total_ttc, date_echeance")
        .eq("type", "facture")
        .eq("statut", "en_retard")
        .order("date_echeance", { ascending: true })
        .limit(5);
      setOverdue((overdueDocs ?? []) as OverdueInvoice[]);

      setChartsLoading(false);
    }

    loadAll();
  }, []);

  /* ── Rapport mensuel ── */
  async function runRapport() {
    const now = new Date();
    setRapportLoading(true);
    setRapportOpen(true);
    setRapport(null);
    try {
      const res = await fetch("/api/rapport-mensuel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: now.getFullYear(), month: now.getMonth() }),
      });
      if (!res.ok) throw new Error("Erreur rapport");
      setRapport(await res.json());
    } catch {
      setRapportOpen(false);
    } finally {
      setRapportLoading(false);
    }
  }

  /* ── KPI definitions ── */
  const kpis = [
    {
      label: "CA facturé ce mois",
      value: stats ? fmtEurInt(stats.caThisMois) : "—",
      Icon: Euro,
      color: "#4ade80",
      bg: "rgba(74,222,128,0.08)",
      border: "rgba(74,222,128,0.22)",
      href: "/client/factures",
    },
    {
      label: "Heures cette semaine",
      value: stats ? (stats.heuresSemaine > 0 ? fmtDuration(stats.heuresSemaine) : "0h") : "—",
      Icon: Clock,
      color: "#a78bfa",
      bg: "rgba(167,139,250,0.08)",
      border: "rgba(167,139,250,0.22)",
      href: "/client/chrono",
    },
    {
      label: "Dépenses ce mois",
      value: stats ? fmtEurInt(stats.depensesMois) : "—",
      Icon: TrendingDown,
      color: "#f97316",
      bg: "rgba(249,115,22,0.08)",
      border: "rgba(249,115,22,0.22)",
      href: "/client/depenses",
    },
    {
      label: "Contacts actifs",
      value: stats ? String(stats.contactsActifs) : "—",
      Icon: UserCheck,
      color: "#38bdf8",
      bg: "rgba(56,189,248,0.08)",
      border: "rgba(56,189,248,0.22)",
      href: "/client/crm",
    },
  ];

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#080a0f]">

      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[5%] top-[8%] h-[600px] w-[600px] rounded-full bg-[rgba(139,92,246,0.04)] blur-[160px]" />
        <div className="absolute bottom-[8%] right-[5%] h-[500px] w-[500px] rounded-full bg-[rgba(201,165,90,0.03)] blur-[140px]" />
        <div className="absolute right-[25%] top-[35%] h-[400px] w-[400px] rounded-full bg-[rgba(56,189,248,0.025)] blur-[130px]" />
      </div>

      {/* ── Sub-header ── */}
      <div className="relative z-10 border-b border-white/[0.06] bg-[rgba(10,11,16,0.92)] px-5 py-4 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl blur-sm" style={{ background: "#c9a55a30" }} />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border"
                style={{ backgroundColor: "#c9a55a14", borderColor: "#c9a55a28" }}>
                <LayoutDashboard size={18} style={{ color: "#c9a55a" }} />
              </div>
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white">Tableau de bord</h1>
              <p className="text-[0.65rem] text-white/30">Vue d'ensemble de votre activité</p>
            </div>
          </div>
          <button
            onClick={runRapport}
            disabled={rapportLoading}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-white/60 transition hover:bg-white/[0.08] disabled:opacity-50"
          >
            {rapportLoading ? <Loader2 size={12} className="animate-spin" /> : <FileBarChart2 size={12} />}
            <span className="hidden sm:inline">Rapport mensuel</span>
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="relative z-10 mx-auto max-w-6xl space-y-8 px-5 py-8 sm:px-8">

        {/* ── Greeting ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(201,165,90,0.15)] bg-[rgba(15,17,23,0.65)] px-7 py-6 backdrop-blur-xl"
        >
          {/* Glow interne */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse 60% 70% at 0% 50%, rgba(201,165,90,0.07) 0%, transparent 65%)" }}
          />
          <p className="relative text-[0.65rem] font-bold uppercase tracking-widest text-white/30 capitalize">
            {fmtFullDate()}
          </p>
          <h2 className="relative mt-1.5 text-2xl font-black text-white sm:text-3xl">
            {getGreeting()}{userName ? `, ${userName}` : ""}
          </h2>
          <p className="relative mt-1 text-sm text-white/40">
            Voici un résumé de votre activité DJAMA PRO.
          </p>
        </motion.div>

        {/* ── KPI Cards ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi, i) => {
            const Icon = kpi.Icon;
            return (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease, delay: 0.1 + i * 0.07 }}
              >
                <Link href={kpi.href}>
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-4 rounded-[1.5rem] border bg-[#0f1117] px-5 py-4 transition-all hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] cursor-pointer"
                    style={{ borderColor: kpi.border }}
                  >
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
                      style={{ background: kpi.bg, borderColor: kpi.border }}
                    >
                      <Icon size={18} style={{ color: kpi.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.6rem] font-black uppercase tracking-widest text-white/25 leading-tight">
                        {kpi.label}
                      </p>
                      {statsLoading ? (
                        <div className="mt-1.5 h-6 w-20 animate-pulse rounded-lg bg-white/[0.05]" />
                      ) : (
                        <p className="mt-0.5 text-xl font-black leading-none" style={{ color: kpi.color }}>
                          {kpi.value}
                        </p>
                      )}
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* ── Overdue alert ── */}
        {!chartsLoading && overdue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: 0.3 }}
          >
            <Link href="/client/tresorerie">
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="flex items-center gap-4 rounded-[1.5rem] border border-[rgba(248,113,113,0.25)] bg-[rgba(239,68,68,0.06)] px-5 py-4 backdrop-blur-xl transition-all hover:bg-[rgba(239,68,68,0.1)]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10">
                  <AlertTriangle size={17} className="text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.6rem] font-bold uppercase tracking-widest text-red-400/70">Attention</p>
                  <p className="text-sm font-bold text-white">
                    {overdue.length} facture{overdue.length > 1 ? "s" : ""} en retard
                  </p>
                  <p className="text-xs text-white/40 truncate">
                    {overdue.map(i => i.client_nom || i.numero).join(", ")}
                  </p>
                </div>
                <ChevronRight size={15} className="shrink-0 text-red-400/50" />
              </motion.div>
            </Link>
          </motion.div>
        )}

        {/* ── Revenue chart + Top clients ── */}
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          {/* Revenue chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease, delay: 0.35 }}
            className="rounded-[1.75rem] border border-white/[0.07] bg-[#0f1117] p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[rgba(74,222,128,0.25)] bg-[rgba(74,222,128,0.08)]">
                  <BarChart3 size={14} style={{ color: "#4ade80" }} />
                </div>
                <div>
                  <p className="text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Revenus encaissés</p>
                  <p className="text-sm font-extrabold text-white">6 derniers mois</p>
                </div>
              </div>
              {!chartsLoading && revenues.length > 0 && (
                <p className="text-xs font-bold text-[#4ade80]">
                  {fmtEurInt(revenues.reduce((s, r) => s + r.amount, 0))}
                </p>
              )}
            </div>
            {chartsLoading ? (
              <div className="flex items-end gap-3 h-32">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="flex-1 animate-pulse rounded-lg bg-white/5" style={{ height: `${40 + i * 10}%` }} />
                ))}
              </div>
            ) : (
              <div className="flex items-end gap-2 h-36 sm:gap-3">
                {(() => {
                  const max = Math.max(...revenues.map(r => r.amount), 1);
                  return revenues.map((r, i) => {
                    const pct = Math.max((r.amount / max) * 100, r.amount > 0 ? 8 : 2);
                    const isLast = i === revenues.length - 1;
                    return (
                      <div key={r.label} className="group flex flex-1 flex-col items-center gap-1.5">
                        <div className="relative w-full" style={{ height: "112px" }}>
                          <div className="absolute bottom-0 w-full overflow-hidden rounded-t-lg transition-all duration-700"
                            style={{
                              height: `${pct}%`,
                              background: isLast
                                ? "linear-gradient(180deg,#4ade80,#22d3ee55)"
                                : "rgba(255,255,255,0.08)",
                            }}
                          />
                          {r.amount > 0 && (
                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#0f1117] px-2 py-1 text-[0.6rem] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              {fmtEurInt(r.amount)}
                            </div>
                          )}
                        </div>
                        <span className={`text-[0.6rem] font-bold uppercase ${isLast ? "text-[#4ade80]" : "text-white/30"}`}>
                          {r.label}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </motion.div>

          {/* Top clients */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease, delay: 0.4 }}
            className="rounded-[1.75rem] border border-white/[0.07] bg-[#0f1117] p-5"
          >
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.08)]">
                <Star size={14} style={{ color: "#c9a55a" }} />
              </div>
              <div>
                <p className="text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Meilleurs clients</p>
                <p className="text-sm font-extrabold text-white">3 mois glissants</p>
              </div>
            </div>
            {chartsLoading ? (
              <div className="space-y-2.5">
                {[1,2,3].map(i => <div key={i} className="h-10 animate-pulse rounded-xl bg-white/5" />)}
              </div>
            ) : topClients.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Users size={20} className="text-white/15" />
                <p className="text-xs text-white/25">Aucun encaissement récent</p>
              </div>
            ) : (
              <div className="space-y-2">
                {topClients.map((c, i) => {
                  const max = topClients[0].amount;
                  const pct = Math.round((c.amount / max) * 100);
                  return (
                    <div key={c.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/75 truncate max-w-[140px]">{c.name}</span>
                        <span className="text-xs font-bold" style={{ color: "#c9a55a" }}>{fmtEurInt(c.amount)}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/6">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease, delay: 0.5 + i * 0.08 }}
                          className="h-full rounded-full"
                          style={{ background: i === 0 ? "linear-gradient(90deg,#c9a55a,#e8cc94)" : "rgba(201,165,90,0.35)" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Rapport mensuel panel ── */}
        <AnimatePresence>
          {rapportOpen && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease }}
              className="overflow-hidden rounded-[1.75rem] border border-white/[0.07] bg-[#0f1117]"
            >
              <div className="flex items-center justify-between border-b border-white/6 px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[rgba(167,139,250,0.3)] bg-[rgba(167,139,250,0.1)]">
                    <FileBarChart2 size={14} style={{ color: "#a78bfa" }} />
                  </div>
                  <span className="text-sm font-extrabold text-white">
                    Rapport mensuel — {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                  </span>
                </div>
                <button onClick={() => setRapportOpen(false)} className="text-white/25 transition hover:text-white/60">
                  <X size={15} />
                </button>
              </div>

              {rapportLoading ? (
                <div className="flex flex-col items-center gap-3 py-14">
                  <div className="relative">
                    <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-[#a78bfa]" />
                    <FileBarChart2 size={14} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#a78bfa]" />
                  </div>
                  <p className="text-sm text-white/40">Génération du rapport en cours…</p>
                </div>
              ) : rapport && (
                <div className="p-6 space-y-6">
                  {/* Score + résumé */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
                      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
                        <circle cx="40" cy="40" r="34" fill="none"
                          stroke={rapport.score_sante >= 70 ? "#4ade80" : rapport.score_sante >= 40 ? "#fbbf24" : "#f87171"}
                          strokeWidth="6" strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 34}`}
                          strokeDashoffset={`${2 * Math.PI * 34 * (1 - rapport.score_sante / 100)}`}
                          style={{ transition: "stroke-dashoffset 1s ease" }}
                        />
                      </svg>
                      <span className="text-xl font-black" style={{ color: rapport.score_sante >= 70 ? "#4ade80" : rapport.score_sante >= 40 ? "#fbbf24" : "#f87171" }}>
                        {rapport.score_sante}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Santé financière</p>
                      <p className="mt-1 text-sm leading-relaxed text-white/65">{rapport.resume_executif}</p>
                    </div>
                  </div>

                  {/* KPIs */}
                  {rapport.kpis && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {[
                        { label: "Revenu encaissé",    value: fmtEurInt(rapport.kpis.revenu_total),    color: "#4ade80" },
                        { label: "Dépenses totales",   value: fmtEurInt(rapport.kpis.depenses_totales), color: "#f97316" },
                        { label: "Résultat net",       value: fmtEurInt(rapport.kpis.resultat_net),    color: rapport.kpis.resultat_net >= 0 ? "#4ade80" : "#f87171" },
                        { label: "Taux recouvrement",  value: rapport.kpis.taux_recouvrement,          color: "#c9a55a" },
                        { label: "Factures",           value: String(rapport.kpis.nb_factures),        color: "#60a5fa" },
                        { label: "Clients actifs",     value: String(rapport.kpis.nb_clients),         color: "#a78bfa" },
                      ].map(k => (
                        <div key={k.label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                          <p className="text-[0.58rem] font-bold uppercase tracking-wider text-white/30">{k.label}</p>
                          <p className="mt-1 text-lg font-black" style={{ color: k.color }}>{k.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Points forts + Alertes */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {rapport.points_forts?.length > 0 && (
                      <div className="rounded-xl border border-[rgba(74,222,128,0.15)] bg-[rgba(74,222,128,0.05)] p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <ShieldCheck size={12} className="text-emerald-400" />
                          <span className="text-[0.6rem] font-bold uppercase tracking-widest text-emerald-400/70">Points forts</span>
                        </div>
                        <ul className="space-y-1.5">
                          {rapport.points_forts.map((p, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />{p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {rapport.alertes?.length > 0 && (
                      <div className="rounded-xl border border-[rgba(251,191,36,0.15)] bg-[rgba(251,191,36,0.05)] p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <AlertTriangle size={12} className="text-amber-400" />
                          <span className="text-[0.6rem] font-bold uppercase tracking-widest text-amber-400/70">Alertes</span>
                        </div>
                        <ul className="space-y-1.5">
                          {rapport.alertes.map((a, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-400" />{a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Recommandations */}
                  {rapport.recommandations?.length > 0 && (
                    <div className="rounded-xl border border-[rgba(167,139,250,0.15)] bg-[rgba(167,139,250,0.05)] p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Lightbulb size={12} className="text-[#a78bfa]" />
                        <span className="text-[0.6rem] font-bold uppercase tracking-widest text-[#a78bfa]/70">Recommandations</span>
                      </div>
                      <ol className="space-y-1.5">
                        {rapport.recommandations.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                            <span className="shrink-0 rounded-full border border-[rgba(167,139,250,0.3)] bg-[rgba(167,139,250,0.1)] px-1.5 py-0.5 text-[0.55rem] font-black text-[#a78bfa]">{i + 1}</span>
                            {r}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Objectif mois prochain */}
                  {rapport.objectif_mois_prochain && (
                    <div className="flex items-start gap-3 rounded-xl border border-[rgba(201,165,90,0.15)] bg-[rgba(201,165,90,0.05)] p-4">
                      <TrendingUp size={14} className="mt-0.5 shrink-0 text-[#c9a55a]" />
                      <div>
                        <p className="mb-1 text-[0.6rem] font-bold uppercase tracking-widest text-[#c9a55a]/70">Objectif mois prochain</p>
                        <p className="text-xs text-white/65">{rapport.objectif_mois_prochain}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Tools grid ── */}
        <div>
          <p className="mb-4 text-[0.65rem] font-bold uppercase tracking-widest text-white/30">
            Vos outils — {TOOLS.length} modules
          </p>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {TOOLS.map((tool, i) => {
              const Icon = tool.Icon;
              return (
                <motion.div
                  key={tool.href}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease, delay: 0.35 + i * 0.04 }}
                >
                  <Link href={tool.href}>
                    <motion.div
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="group flex items-center gap-3.5 rounded-[1.25rem] border border-white/[0.07] bg-[#0f1117] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.14] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] cursor-pointer"
                      style={{ borderColor: tool.border }}
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                        style={{ background: tool.bg, borderColor: tool.border }}
                      >
                        <Icon size={17} style={{ color: tool.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white/90 transition group-hover:text-white">
                          {tool.label}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-white/35">{tool.desc}</p>
                      </div>
                      <ArrowUpRight
                        size={14}
                        className="shrink-0 transition-opacity opacity-0 group-hover:opacity-100"
                        style={{ color: tool.color }}
                      />
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── Footer note ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="pb-4 text-center text-[0.65rem] text-white/15"
        >
          DJAMA PRO · Données mises à jour en temps réel
        </motion.p>
      </div>
    </div>
  );
}
