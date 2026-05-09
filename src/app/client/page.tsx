"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ReceiptText, Users, Timer, CreditCard, FileText, Search,
  Wallet, StickyNote, Calendar, CalendarRange, Brain, Zap, Star, Mic,
  Sparkles, TrendingUp, TrendingDown, Euro, Clock,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fmtEurInt } from "@/lib/format";

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

/* ═══════════════════════════════════════════════════════
   APPS — chaque outil avec son identité visuelle
═══════════════════════════════════════════════════════ */
const APPS = [
  {
    href: "/client/factures",
    label: "Factures & Devis",
    desc: "Documents pro, PDF, TVA auto",
    icon: ReceiptText,
    from: "#0d9e61", to: "#059669",
    deco: ["#34d399", "#6ee7b7"],
  },
  {
    href: "/client/crm",
    label: "CRM",
    desc: "Contacts, prospects, pipeline",
    icon: Users,
    from: "#1d5fcc", to: "#2563eb",
    deco: ["#60a5fa", "#93c5fd"],
  },
  {
    href: "/client/depenses",
    label: "Dépenses",
    desc: "Frais pros, catégories, export",
    icon: CreditCard,
    from: "#c2410c", to: "#ea580c",
    deco: ["#fb923c", "#fed7aa"],
  },
  {
    href: "/client/tresorerie",
    label: "Trésorerie",
    desc: "Cash-flow, flux consolidés",
    icon: Wallet,
    from: "#0f766e", to: "#0d9488",
    deco: ["#2dd4bf", "#99f6e4"],
  },
  {
    href: "/client/contrats",
    label: "Contrats IA",
    desc: "Génération IA en secondes, PDF",
    icon: FileText,
    from: "#92640a", to: "#b45309",
    deco: ["#c9a55a", "#fde68a"],
  },
  {
    href: "/client/chrono",
    label: "Chrono Pro",
    desc: "Timer, pause/reprise, projets",
    icon: Timer,
    from: "#5b21b6", to: "#7c3aed",
    deco: ["#a78bfa", "#ddd6fe"],
  },
  {
    href: "/client/notes",
    label: "Notes IA",
    desc: "Notes intelligentes, résumés auto",
    icon: StickyNote,
    from: "#92400e", to: "#b45309",
    deco: ["#fbbf24", "#fde68a"],
  },
  {
    href: "/client/bloc-note",
    label: "Bloc Note vocal",
    desc: "Dictée, transcription IA live",
    icon: Mic,
    from: "#6b21a8", to: "#9333ea",
    deco: ["#c084fc", "#e9d5ff"],
  },
  {
    href: "/client/planning",
    label: "Planning",
    desc: "Agenda, rendez-vous, tâches",
    icon: Calendar,
    from: "#1e40af", to: "#1d4ed8",
    deco: ["#60a5fa", "#bfdbfe"],
  },
  {
    href: "/client/planification",
    label: "Équipe",
    desc: "Shifts, planning, emails auto",
    icon: CalendarRange,
    from: "#075985", to: "#0284c7",
    deco: ["#38bdf8", "#bae6fd"],
  },
  {
    href: "/client/sourcing",
    label: "Sourcing IA",
    desc: "Fournisseurs mondiaux avec IA",
    icon: Search,
    from: "#3730a3", to: "#4338ca",
    deco: ["#818cf8", "#c7d2fe"],
  },
  {
    href: "/coaching-ia/espace",
    label: "Coaching IA",
    desc: "Objectifs, modules, progression",
    icon: Brain,
    from: "#86198f", to: "#a21caf",
    deco: ["#d946ef", "#f5d0fe"],
  },
  {
    href: "/client/assistant",
    label: "Assistant IA",
    desc: "Relances auto, actions urgentes",
    icon: Zap,
    from: "#0e7490", to: "#0891b2",
    deco: ["#22d3ee", "#a5f3fc"],
  },
  {
    href: "/client/reputation",
    label: "Réputation",
    desc: "Avis clients, tendance, export",
    icon: Star,
    from: "#92400e", to: "#b45309",
    deco: ["#f59e0b", "#fde68a"],
  },
] as const;

/* ═══════════════════════════════════════════════════════
   APP CARD
═══════════════════════════════════════════════════════ */
function AppCard({ app, index }: { app: typeof APPS[number]; index: number }) {
  const Icon = app.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={app.href} className="group block">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0f1117] transition-all duration-300 hover:-translate-y-1.5 hover:border-white/[0.14] hover:shadow-[0_16px_48px_rgba(0,0,0,0.5)]">

          {/* ── Illustration zone ── */}
          <div
            className="relative flex h-[130px] items-center justify-center overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${app.from}, ${app.to})` }}
          >
            {/* Background texture — circles */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20"
                style={{ background: app.deco[0] }} />
              <div className="absolute -bottom-8 -left-4 h-28 w-28 rounded-full opacity-15"
                style={{ background: app.deco[1] }} />
              <div className="absolute right-6 bottom-4 h-10 w-10 rounded-full opacity-25"
                style={{ background: app.deco[0] }} />
            </div>

            {/* Shine overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.12] via-transparent to-black/[0.15]" />

            {/* Main icon container */}
            <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.18] shadow-[0_4px_20px_rgba(0,0,0,0.25)] backdrop-blur-sm ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-110">
              <Icon size={28} color="white" strokeWidth={1.8} />
            </div>

            {/* Decorative mini dots */}
            <div className="absolute top-4 left-5 h-1.5 w-1.5 rounded-full bg-white/30" />
            <div className="absolute top-7 left-8 h-1 w-1 rounded-full bg-white/20" />
            <div className="absolute bottom-5 right-5 h-1.5 w-1.5 rounded-full bg-white/25" />
          </div>

          {/* ── Text zone ── */}
          <div className="px-4 py-3.5">
            <p className="text-[0.85rem] font-bold text-white/90 leading-tight">{app.label}</p>
            <p className="mt-0.5 text-[0.7rem] text-white/35 leading-snug">{app.desc}</p>
          </div>

          {/* Hover bottom glow */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: `linear-gradient(90deg, transparent, ${app.from}80, transparent)` }}
          />
        </div>
      </Link>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   KPI CARD
═══════════════════════════════════════════════════════ */
function KpiCard({ label, value, sub, icon: Icon, color, loading }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color: string; loading: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-[#0f1117] px-4 py-3.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${color}18`, border: `1px solid ${color}28` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-white/30">{label}</p>
        {loading
          ? <div className="mt-1 h-5 w-20 animate-pulse rounded-lg bg-white/[0.05]" />
          : <p className="mt-0.5 text-base font-black text-white leading-none">{value}</p>
        }
        {sub && !loading && <p className="mt-0.5 text-[0.62rem] text-white/25">{sub}</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════ */
export default function CockpitPage() {
  const [firstName,  setFirstName]  = useState("");
  const [kpiLoading, setKpiLoading] = useState(true);
  const [caMonth,    setCaMonth]    = useState(0);
  const [nbContacts, setNbContacts] = useState(0);
  const [nbFactures, setNbFactures] = useState(0);
  const [caEvo,      setCaEvo]      = useState<number | null>(null);

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
  });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Name
      const emailName = user.email?.split("@")[0] ?? "";
      setFirstName(emailName.charAt(0).toUpperCase() + emailName.slice(1));

      // KPIs en parallèle
      const now   = new Date();
      const y     = now.getFullYear();
      const m     = String(now.getMonth() + 1).padStart(2, "0");
      const start = `${y}-${m}-01`;
      const end   = `${y}-${m}-31`;

      const prevM    = now.getMonth() === 0 ? 12 : now.getMonth();
      const prevY    = now.getMonth() === 0 ? y - 1 : y;
      const prevStart = `${prevY}-${String(prevM).padStart(2, "0")}-01`;
      const prevEnd   = `${prevY}-${String(prevM).padStart(2, "0")}-31`;

      const [facRes, prevRes, crmRes, pendRes] = await Promise.all([
        supabase.from("factures").select("montant_ttc").eq("user_id", user.id).gte("date_emission", start).lte("date_emission", end),
        supabase.from("factures").select("montant_ttc").eq("user_id", user.id).gte("date_emission", prevStart).lte("date_emission", prevEnd),
        supabase.from("clients_crm").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("factures").select("id", { count: "exact", head: true }).eq("user_id", user.id).in("statut", ["envoyée", "en_attente"]),
      ]);

      const ca     = (facRes.data ?? []).reduce((s, f) => s + (f.montant_ttc ?? 0), 0);
      const caPrev = (prevRes.data ?? []).reduce((s, f) => s + (f.montant_ttc ?? 0), 0);
      setCaMonth(ca);
      setNbContacts(crmRes.count ?? 0);
      setNbFactures(pendRes.count ?? 0);
      if (caPrev > 0) setCaEvo(Math.round(((ca - caPrev) / caPrev) * 100));
      setKpiLoading(false);
    })();
  }, []);

  const caEvoLabel = caEvo !== null
    ? `${caEvo >= 0 ? "+" : ""}${caEvo}% vs mois dernier`
    : undefined;

  return (
    <div className="min-h-full bg-[#080a0f] pb-12">

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[20%] top-0 h-[500px] w-[600px] rounded-full bg-[rgba(201,165,90,0.04)] blur-[160px]" />
        <div className="absolute bottom-0 right-[10%] h-[400px] w-[500px] rounded-full bg-[rgba(139,92,246,0.03)] blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-5 pt-8 sm:px-8">

        {/* ── Greeting ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} style={{ color: "#c9a55a" }} />
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-white/30">
              Espace DJAMA PRO
            </p>
          </div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">
            {getGreeting()}{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-1 text-sm capitalize text-white/30">{today}</p>
        </motion.div>

        {/* ── KPIs ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        >
          <KpiCard
            label="CA ce mois"
            value={fmtEurInt(caMonth)}
            sub={caEvoLabel}
            icon={caEvo !== null && caEvo < 0 ? TrendingDown : TrendingUp}
            color="#4ade80"
            loading={kpiLoading}
          />
          <KpiCard
            label="Contacts CRM"
            value={String(nbContacts)}
            sub="total"
            icon={Users}
            color="#60a5fa"
            loading={kpiLoading}
          />
          <KpiCard
            label="Factures en attente"
            value={String(nbFactures)}
            sub="à relancer"
            icon={ReceiptText}
            color="#f97316"
            loading={kpiLoading}
          />
          <div className="flex items-center gap-3 rounded-2xl border border-[rgba(201,165,90,0.15)] bg-[rgba(201,165,90,0.05)] px-4 py-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "rgba(201,165,90,0.14)", border: "1px solid rgba(201,165,90,0.22)" }}>
              <Clock size={16} style={{ color: "#c9a55a" }} />
            </div>
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-white/30">Accès</p>
              <p className="mt-0.5 text-sm font-black" style={{ color: "#c9a55a" }}>PRO Actif</p>
              <p className="text-[0.62rem] text-white/25">Tous les outils</p>
            </div>
          </div>
        </motion.div>

        {/* ── Section title ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-5 flex items-center gap-3"
        >
          <p className="text-[0.7rem] font-black uppercase tracking-[0.18em] text-white/25">
            Vos outils
          </p>
          <div className="flex-1 border-t border-white/[0.06]" />
          <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-[0.65rem] font-bold text-white/30">
            {APPS.length} outils
          </span>
        </motion.div>

        {/* ── App Grid ── */}
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {APPS.map((app, i) => (
            <AppCard key={app.href} app={app} index={i} />
          ))}
        </div>

        {/* ── Footer hint ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-10 text-center text-[0.65rem] text-white/15"
        >
          Utilisez la barre latérale pour naviguer rapidement entre les outils
        </motion.p>

      </div>
    </div>
  );
}
