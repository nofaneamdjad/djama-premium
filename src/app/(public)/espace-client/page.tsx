"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import {
  FileText, CalendarRange, StickyNote, Brain, Timer, CreditCard,
  Globe, Shield, Wallet, Users, LogIn, Sparkles, Zap,
  ChevronRight, CheckCircle2, AlertTriangle,
  Truck, Package, ListTodo, Star, Mic, Search, BarChart2,
  LayoutDashboard, BrainCircuit, Rocket, Building2, Banknote,
} from "lucide-react";
import StripeButton from "@/components/ui/StripeButton";
import { viewport } from "@/lib/animations";

const ease = [0.16, 1, 0.3, 1] as const;
const GOLD = "#c9a55a";

/* ── Bannière accès refusé ── */
function AccessBanner() {
  const params = useSearchParams();
  if (params.get("acces") !== "requis") return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-3 border-b border-[rgba(201,165,90,0.22)] bg-[#0f1117]/95 px-4 py-3.5 backdrop-blur-xl"
    >
      <AlertTriangle size={14} className="shrink-0 text-[#c9a55a]" />
      <p className="text-sm font-semibold text-white/80">
        Cet outil est réservé aux abonnés.{" "}
        <span className="text-[#c9a55a]">Abonnez-vous ci-dessous.</span>
      </p>
      <Link href="#abonnement"
        className="ml-2 rounded-full border border-[rgba(201,165,90,0.35)] bg-[rgba(201,165,90,0.12)] px-3 py-1 text-xs font-bold text-[#c9a55a] transition hover:bg-[rgba(201,165,90,0.22)]">
        Voir l&apos;offre ↓
      </Link>
    </motion.div>
  );
}

/* ── Redirection si déjà abonné ── */
function AlreadySubscribedRedirect() {
  const params = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    if (params.get("annule") === "1" || params.get("acces") === "requis") return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const meta = user.user_metadata ?? {};
      const active =
        meta.subscription_active === true ||
        (meta.abonnement === "outils_djama" && meta.statut === "actif");
      if (active) router.replace("/client");
    });
  }, [params, router]);
  return null;
}

/* ── Outils ── */
const TOOLS = [
  { icon: FileText,      title: "Factures & devis",      g1: "#f59e0b", g2: "#f97316" },
  { icon: CalendarRange, title: "Agenda & Planning",      g1: "#3b82f6", g2: "#6366f1" },
  { icon: StickyNote,    title: "Bloc-notes pro",         g1: "#10b981", g2: "#059669" },
  { icon: Brain,         title: "Coach Business IA",      g1: "#8b5cf6", g2: "#7c3aed" },
  { icon: Users,         title: "CRM Client",             g1: "#06b6d4", g2: "#0284c7" },
  { icon: Timer,         title: "Chrono Pro",             g1: "#f97316", g2: "#ef4444" },
  { icon: CreditCard,    title: "Dépenses Pro",           g1: "#ef4444", g2: "#be123c" },
  { icon: Wallet,        title: "Trésorerie",             g1: "#10b981", g2: "#0891b2" },
  { icon: Shield,        title: "Contrats IA",            g1: "#eab308", g2: "#ca8a04" },
  { icon: Search,        title: "Sourcing IA",            g1: "#f59e0b", g2: "#b45309" },
  { icon: Truck,         title: "Fournisseurs",           g1: "#22c55e", g2: "#16a34a" },
  { icon: Package,       title: "Stocks",                 g1: "#0ea5e9", g2: "#0369a1" },
  { icon: ListTodo,      title: "Tâches & Projets",       g1: "#a855f7", g2: "#7c3aed" },
  { icon: Mic,           title: "Bloc-note Vocal",        g1: "#ec4899", g2: "#be185d" },
  { icon: Globe,         title: "Réseaux Sociaux",        g1: "#38bdf8", g2: "#0284c7" },
  { icon: Star,          title: "Réputation",             g1: "#facc15", g2: "#f59e0b" },
  { icon: BarChart2,     title: "Tableau de bord",        g1: "#60a5fa", g2: "#3b82f6" },
  { icon: Zap,           title: "Assistant IA",           g1: "#c084fc", g2: "#a855f7" },
  { icon: Building2,     title: "Portail Client",         g1: "#3b82f6", g2: "#7c3aed" },
  { icon: Banknote,      title: "Paie & RH",              g1: "#10b981", g2: "#065f46" },
];
const TOOL_COUNT = TOOLS.length;

/* ══════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════ */
export default function EspaceClientPage() {
  return (
    <div className="overflow-x-hidden bg-white text-gray-900">
      <Suspense>
        <AlreadySubscribedRedirect />
        <AccessBanner />
      </Suspense>

      {/* ══ HERO ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#07080e] pt-[110px] pb-24 sm:pt-[150px]">
        {/* Orbs */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full blur-[140px]"
          style={{ background: "rgba(201,165,90,0.09)" }} />
        <div className="pointer-events-none absolute top-1/2 left-0 h-[300px] w-[300px] -translate-y-1/2 rounded-full blur-[120px]"
          style={{ background: "rgba(139,92,246,0.06)" }} />
        <div className="pointer-events-none absolute top-1/2 right-0 h-[300px] w-[300px] -translate-y-1/2 rounded-full blur-[120px]"
          style={{ background: "rgba(6,182,212,0.06)" }} />

        {/* Top gold line */}
        <div className="absolute inset-x-0 top-0 h-[1.5px]"
          style={{ background: "linear-gradient(90deg,transparent,rgba(201,165,90,0.7) 40%,rgba(201,165,90,0.3) 70%,transparent)" }} />

        <div className="relative z-10 mx-auto max-w-2xl px-6 text-center">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.08)] px-4 py-2 backdrop-blur-sm"
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#c9a55a]/20">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c9a55a]" />
            </span>
            <span className="text-[0.72rem] font-semibold tracking-widest text-[#c9a55a]/80 uppercase">
              Espace Client DJAMA
            </span>
            <span className="rounded-full border border-[rgba(201,165,90,0.3)] bg-[rgba(201,165,90,0.12)] px-2 py-0.5 text-[0.68rem] font-bold text-[#c9a55a]">
              {TOOL_COUNT} outils
            </span>
          </motion.div>

          {/* Titre */}
          <motion.h1
            initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.1 }}
            className="text-[2.8rem] font-black leading-[1.06] tracking-tight text-white sm:text-[4.5rem]"
          >
            Gérez votre activité.
            <br />
            <span style={{ color: GOLD }}>Tout en un.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.25 }}
            className="mx-auto mt-5 max-w-sm text-[0.95rem] leading-relaxed text-white/45"
          >
            Factures, CRM, trésorerie, IA — tout ce dont un entrepreneur a besoin, à{" "}
            <strong className="font-semibold text-white/70">11,90 €/mois</strong>.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.42 }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            <Link href="#abonnement"
              className="group flex items-center gap-2.5 rounded-2xl px-8 py-3.5 text-sm font-bold text-[#0a0a0a] transition-all hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)`, boxShadow: "0 4px 28px rgba(201,165,90,0.4)" }}>
              Commencer — 11,90 €/mois
              <ChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/login"
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-7 py-3.5 text-sm font-medium text-white/50 backdrop-blur-sm transition hover:bg-white/10 hover:text-white/80">
              <LogIn size={14} /> Se connecter
            </Link>
          </motion.div>

          {/* Trust */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.58 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-5"
          >
            {["Sans engagement", "Stripe sécurisé", "Accès immédiat"].map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-[0.72rem] text-white/35">
                <CheckCircle2 size={10} className="text-[#c9a55a]/50" /> {t}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ STATS ══════════════════════════════════════════ */}
      <section className="border-y border-gray-100 bg-gray-50 py-10">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease }}
            className="grid grid-cols-2 gap-6 sm:grid-cols-4"
          >
            {[
              { value: String(TOOL_COUNT), label: "Outils professionnels", color: GOLD },
              { value: "11,90€",           label: "Par mois tout inclus",  color: "#8b5cf6" },
              { value: "+50",              label: "Entrepreneurs actifs",   color: "#10b981" },
              { value: "100%",             label: "Accès immédiat",         color: "#06b6d4" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1 text-center">
                <span className="text-3xl font-black" style={{ color: s.color }}>{s.value}</span>
                <span className="text-[0.7rem] font-medium text-gray-400">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ AVANTAGES ══════════════════════════════════════ */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-6">

          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease }}
            className="mb-12 text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.07)] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-[#c9a55a]">
              <Sparkles size={9} /> Pourquoi DJAMA
            </span>
            <h2 className="mt-4 text-2xl font-black text-gray-900 sm:text-3xl">
              Une plateforme conçue <span style={{ color: GOLD }}>pour les entrepreneurs.</span>
            </h2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
            className="grid gap-4 sm:grid-cols-3"
          >
            {[
              {
                icon: LayoutDashboard, g1: "#f59e0b", g2: "#f97316",
                title: "Tout en un seul endroit",
                desc: `Plus besoin de jongler entre ${TOOL_COUNT} outils différents. Factures, CRM, trésorerie, planning — tout est centralisé.`,
              },
              {
                icon: BrainCircuit, g1: "#8b5cf6", g2: "#7c3aed",
                title: "Intelligence artificielle intégrée",
                desc: "Coach business IA, contrats générés en 1 clic, notes vocales transcrites automatiquement. L'IA travaille pour vous.",
              },
              {
                icon: Rocket, g1: "#10b981", g2: "#059669",
                title: "Opérationnel en 2 minutes",
                desc: "Interface claire, prise en main immédiate. Pas de formation complexe. Vous êtes productif dès le premier jour.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease } } }}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
                >
                  <div
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-[16px] shadow-lg"
                    style={{
                      background: `linear-gradient(145deg, ${item.g1}, ${item.g2})`,
                      boxShadow: `0 6px 20px ${item.g2}45`,
                    }}
                  >
                    <Icon size={22} color="white" strokeWidth={1.8} />
                  </div>
                  <h3 className="mb-2 text-sm font-black text-gray-900">{item.title}</h3>
                  <p className="text-xs leading-relaxed text-gray-400">{item.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ══ OUTILS ═════════════════════════════════════════ */}
      <section id="outils" className="border-t border-gray-100 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">

          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease }}
            className="mb-12 text-center"
          >
            <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#c9a55a]/70">
              Ce qui est inclus
            </p>
            <h2 className="text-xl font-black text-gray-900 sm:text-3xl">
              {TOOL_COUNT} outils,{" "}
              <span style={{ color: GOLD }}>un seul abonnement.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm text-gray-400">
              Tout ce dont vous avez besoin pour piloter votre activité, réuni dans un seul espace.
            </p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
          >
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.title}
                  variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease } } }}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
                >
                  <div
                    className="flex h-[60px] w-[60px] items-center justify-center rounded-[18px] shadow-md"
                    style={{
                      background: `linear-gradient(145deg, ${tool.g1}, ${tool.g2})`,
                      boxShadow: `0 6px 16px ${tool.g2}40`,
                    }}
                  >
                    <Icon size={26} color="white" strokeWidth={1.8} />
                  </div>
                  <p className="text-[0.72rem] font-bold leading-tight text-gray-700">{tool.title}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ══ ABONNEMENT ═════════════════════════════════════ */}
      <section id="abonnement" className="border-t border-gray-100 bg-[#f8f9fa] py-16 sm:py-24">
        <div className="mx-auto max-w-md px-6">

          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.6, ease }}
          >
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">
                Un prix simple,<br /><span style={{ color: GOLD }}>tout compris.</span>
              </h2>
            </div>

            <div className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(201,165,90,0.30)] bg-white shadow-[0_4px_32px_rgba(0,0,0,.08)]">
              {/* Accent top */}
              <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />

              <div className="relative p-8">
                {/* Badge */}
                <div className="mb-5 inline-flex w-fit items-center gap-1.5 rounded-full border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.1)] px-3 py-1 text-[0.6rem] font-bold uppercase tracking-widest text-[#c9a55a]">
                  <Sparkles size={7} /> Abonnement mensuel
                </div>

                {/* Prix */}
                <div className="flex items-start gap-1">
                  <span className="mt-3 text-lg font-bold text-[#c9a55a]">€</span>
                  <span className="text-[5rem] font-black leading-none tracking-tighter text-gray-900">11,90</span>
                </div>
                <p className="mt-1 text-[0.72rem] text-gray-400">par mois · tout compris · sans engagement</p>

                <div className="my-5 h-px w-full" style={{ background: "linear-gradient(90deg, rgba(201,165,90,0.3), transparent)" }} />

                {/* Features */}
                <ul className="mb-7 grid grid-cols-2 gap-y-2.5 gap-x-3">
                  {[
                    `${TOOL_COUNT} outils inclus`,
                    "Coach Business IA",
                    "Factures illimitées",
                    "CRM & contacts",
                    "Trésorerie & dépenses",
                    "Stocks & fournisseurs",
                    "Équipe & planning",
                    "Notes IA & bloc-note",
                    "Sourcing & réputation",
                    "Mises à jour incluses",
                    "Support réactif",
                    "Sans engagement",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-[0.72rem] text-gray-600">
                      <CheckCircle2 size={11} className="shrink-0 text-[#c9a55a]" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA Stripe */}
                <StripeButton label="Commencer maintenant →" />

                <p className="mt-3 text-center text-[0.62rem] text-gray-400">
                  Paiement sécurisé · Accès immédiat · Résiliable à tout moment
                </p>

                {/* Déjà abonné */}
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-200" />
                  <Link href="/login" className="text-[0.68rem] font-semibold text-[#c9a55a]/70 transition hover:text-[#c9a55a]">
                    Déjà abonné ? Se connecter →
                  </Link>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
