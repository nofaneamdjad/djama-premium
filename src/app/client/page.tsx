"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ReceiptText, Users, Timer, CreditCard, FileText, Search,
  Wallet, StickyNote, Calendar, CalendarRange, Brain, Zap, Star, Mic,
  TrendingUp, TrendingDown, LayoutGrid, Package, ClipboardList,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fmtEurInt } from "@/lib/format";

/* ─── Constants ──────────────────────────────────────────────────────────── */
const GOLD   = "#c9a55a";
const NAVY   = "#0a0f1e";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

/* ─── Module catalogue ───────────────────────────────────────────────────── */
const MODULES = [
  {
    group: "Finance",
    items: [
      { href: "/client/factures",   label: "Factures & Devis", desc: "Facturation, devis, TVA auto",      icon: ReceiptText,  hue: "#3b82f6" },
      { href: "/client/depenses",   label: "Dépenses",         desc: "Frais pro, catégories, export",     icon: CreditCard,   hue: "#f97316" },
      { href: "/client/tresorerie", label: "Trésorerie",       desc: "Cash-flow, flux consolidés",        icon: Wallet,       hue: "#10b981" },
    ],
  },
  {
    group: "Commercial",
    items: [
      { href: "/client/crm",        label: "CRM",              desc: "Contacts, prospects, pipeline",     icon: Users,        hue: "#6366f1" },
      { href: "/client/contrats",   label: "Contrats IA",      desc: "Génération IA, PDF en secondes",    icon: FileText,     hue: GOLD      },
      { href: "/client/stocks",     label: "Stocks",           desc: "Produits, niveaux, alertes",        icon: Package,      hue: "#14b8a6" },
    ],
  },
  {
    group: "Opérations",
    items: [
      { href: "/client/planning",       label: "Planning",        desc: "Agenda, rendez-vous, tâches",   icon: Calendar,     hue: "#8b5cf6" },
      { href: "/client/planification",  label: "Équipe",          desc: "Shifts, congés, emails auto",   icon: CalendarRange,hue: "#0ea5e9" },
      { href: "/client/taches",         label: "Tâches",          desc: "To-do, priorités, suivi",       icon: ClipboardList,hue: "#ec4899" },
      { href: "/client/chrono",         label: "Chrono Pro",      desc: "Timer, pause/reprise, projets", icon: Timer,        hue: "#a78bfa" },
    ],
  },
  {
    group: "Intelligence",
    items: [
      { href: "/client/notes",          label: "Notes IA",        desc: "Notes intelligentes, résumés",  icon: StickyNote,   hue: "#fbbf24" },
      { href: "/client/bloc-note",      label: "Bloc-note vocal", desc: "Dictée, transcription en live", icon: Mic,          hue: "#c084fc" },
      { href: "/client/sourcing",       label: "Sourcing IA",     desc: "Fournisseurs mondiaux avec IA", icon: Search,       hue: "#818cf8" },
      { href: "/client/assistant",      label: "Assistant IA",    desc: "Relances auto, actions urgentes",icon: Zap,         hue: "#22d3ee" },
      { href: "/client/reputation",     label: "Réputation",      desc: "Avis clients, tendance, export",icon: Star,         hue: "#f59e0b" },
      { href: "/coaching-ia/espace",    label: "Coaching IA",     desc: "Objectifs, modules, progression",icon: Brain,       hue: "#d946ef" },
    ],
  },
] as const;

/* ─── Module card ────────────────────────────────────────────────────────── */
type ModuleItem = {
  href: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  hue: string;
};

function ModuleCard({ item }: { item: ModuleItem }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className="group block">
      <div className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 py-3 transition-colors duration-150 hover:border-white/[0.11] hover:bg-white/[0.04]">
        {/* Icon */}
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-opacity duration-150"
          style={{ background: `${item.hue}1a`, border: `1px solid ${item.hue}30` }}
        >
          <Icon size={15} style={{ color: item.hue }} strokeWidth={1.8} />
        </div>
        {/* Text */}
        <div className="min-w-0">
          <p className="text-[0.8rem] font-semibold text-white/85 leading-tight group-hover:text-white transition-colors duration-150">
            {item.label}
          </p>
          <p className="mt-0.5 text-[0.68rem] text-white/35 leading-snug">{item.desc}</p>
        </div>
      </div>
    </Link>
  );
}

/* ─── KPI card ───────────────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, icon: Icon, loading, accent = false }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; loading: boolean; accent?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl border px-4 py-3.5"
      style={{
        background: accent ? `${GOLD}0d` : "rgba(255,255,255,0.025)",
        borderColor: accent ? `${GOLD}25` : "rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{
          background: accent ? `${GOLD}1a` : "rgba(255,255,255,0.05)",
          border: `1px solid ${accent ? GOLD + "30" : "rgba(255,255,255,0.08)"}`,
        }}
      >
        <Icon size={15} style={{ color: accent ? GOLD : "rgba(255,255,255,0.5)" }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[0.65rem] font-medium text-white/35">{label}</p>
        {loading
          ? <div className="mt-1 h-4 w-16 animate-pulse rounded-md bg-white/[0.06]" />
          : <p className="mt-0.5 text-[0.95rem] font-semibold leading-none"
              style={{ color: accent ? GOLD : "rgba(255,255,255,0.9)" }}>
              {value}
            </p>
        }
        {sub && !loading && (
          <p className="mt-0.5 text-[0.62rem] text-white/25">{sub}</p>
        )}
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
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

      const emailName = user.email?.split("@")[0] ?? "";
      setFirstName(emailName.charAt(0).toUpperCase() + emailName.slice(1));

      const now    = new Date();
      const y      = now.getFullYear();
      const m      = String(now.getMonth() + 1).padStart(2, "0");
      const start  = `${y}-${m}-01`;
      const end    = `${y}-${m}-31`;
      const prevM  = now.getMonth() === 0 ? 12 : now.getMonth();
      const prevY  = now.getMonth() === 0 ? y - 1 : y;
      const pStart = `${prevY}-${String(prevM).padStart(2, "0")}-01`;
      const pEnd   = `${prevY}-${String(prevM).padStart(2, "0")}-31`;

      const [facRes, prevRes, crmRes, pendRes] = await Promise.all([
        supabase.from("factures").select("montant_ttc").eq("user_id", user.id).gte("date_emission", start).lte("date_emission", end),
        supabase.from("factures").select("montant_ttc").eq("user_id", user.id).gte("date_emission", pStart).lte("date_emission", pEnd),
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

  const totalModules = MODULES.reduce((s, g) => s + g.items.length, 0);

  return (
    <div className="min-h-full pb-16" style={{ background: NAVY }}>
      <div className="mx-auto max-w-5xl px-5 pt-8 sm:px-8">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="mb-7">
          <p className="mb-1 text-[0.7rem] font-medium text-white/30 capitalize">{today}</p>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">
            {getGreeting()}{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-1 text-[0.8rem] text-white/35">
            Votre espace de gestion DJAMA PRO
          </p>
        </div>

        {/* ── KPIs ───────────────────────────────────────────── */}
        <div className="mb-10 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <KpiCard
            label="CA ce mois"
            value={fmtEurInt(caMonth)}
            sub={caEvoLabel}
            icon={caEvo !== null && caEvo < 0 ? TrendingDown : TrendingUp}
            loading={kpiLoading}
          />
          <KpiCard
            label="Contacts CRM"
            value={String(nbContacts)}
            sub="contacts actifs"
            icon={Users}
            loading={kpiLoading}
          />
          <KpiCard
            label="Factures en attente"
            value={String(nbFactures)}
            sub="à relancer"
            icon={ReceiptText}
            loading={kpiLoading}
          />
          <KpiCard
            label="Accès"
            value="PRO Actif"
            sub="Tous les outils"
            icon={LayoutGrid}
            loading={false}
            accent
          />
        </div>

        {/* ── Module groups ───────────────────────────────────── */}
        <div className="space-y-8">
          {MODULES.map((group) => (
            <section key={group.group}>
              {/* Group header */}
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-[0.72rem] font-semibold text-white/40">{group.group}</h2>
                <div className="flex-1 border-t border-white/[0.05]" />
              </div>
              {/* Grid */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => (
                  <ModuleCard key={item.href} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        <p className="mt-10 text-center text-[0.63rem] text-white/15">
          {totalModules} modules disponibles · Barre latérale pour navigation rapide
        </p>

      </div>
    </div>
  );
}
