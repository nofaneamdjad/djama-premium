"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ReceiptText, Users, Timer, Receipt, FileText, Search,
  TrendingUp, StickyNote, Star, Sparkles, Zap, CalendarRange,
  Clock, Euro, UserCheck, TrendingDown, ArrowUpRight,
} from "lucide-react";
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

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const [userName, setUserName] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

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

      /* ── Stats ── */
      const weekStart  = startOfWeekISO();
      const monthStart = startOfMonthISO();

      const [docsRes, timeRes, expRes, crmRes] = await Promise.all([
        /* CA facturé ce mois (factures envoyées + payées) */
        supabase
          .from("documents")
          .select("total_ttc")
          .eq("type", "facture")
          .in("statut", ["envoyé", "payé"])
          .gte("created_at", new Date(monthStart + "T00:00:00").toISOString()),
        /* Heures cette semaine */
        supabase
          .from("time_entries")
          .select("duration_minutes")
          .gte("date", weekStart),
        /* Dépenses ce mois */
        supabase
          .from("expenses")
          .select("amount")
          .gte("date", monthStart),
        /* Contacts actifs */
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
    }

    loadAll();
  }, []);

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
      <div className="relative z-10 border-b border-white/6 bg-[rgba(15,17,23,0.88)] px-5 py-3.5 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(201,165,90,0.22)] bg-[rgba(201,165,90,0.08)]">
            <LayoutDashboard size={16} style={{ color: "#c9a55a" }} />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white">Tableau de bord</h1>
            <p className="text-[0.65rem] text-white/30">Vue d'ensemble de votre activité</p>
          </div>
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
            {getGreeting()}{userName ? `, ${userName}` : ""} 👋
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
                    className="flex items-center gap-4 rounded-[1.5rem] border bg-[rgba(15,17,23,0.7)] px-5 py-4 backdrop-blur-xl transition-all hover:bg-[rgba(15,17,23,0.9)] cursor-pointer"
                    style={{ borderColor: kpi.border }}
                  >
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
                      style={{ background: kpi.bg, borderColor: kpi.border }}
                    >
                      <Icon size={18} style={{ color: kpi.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.6rem] font-bold uppercase tracking-widest text-white/35 leading-tight">
                        {kpi.label}
                      </p>
                      {statsLoading ? (
                        <div className="mt-1.5 h-6 w-20 animate-pulse rounded-lg bg-white/8" />
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
                      className="group flex items-center gap-3.5 rounded-[1.25rem] border bg-[rgba(15,17,23,0.6)] p-4 transition-all hover:bg-[rgba(15,17,23,0.92)] cursor-pointer"
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
