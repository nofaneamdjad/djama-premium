"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import {
  FileText, CalendarRange, StickyNote, Brain, Timer, CreditCard,
  Globe, Shield, Wallet, Users, LogIn, Sparkles, Zap, Lock,
  BadgeCheck, ChevronRight, CheckCircle2, AlertTriangle,
  Truck, Package, ListTodo, Star, Share2, Mic, Search, BarChart2,
} from "lucide-react";
import StripeButton from "@/components/ui/StripeButton";
import { viewport } from "@/lib/animations";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Bannière accès refusé ── */
function AccessBanner() {
  const params = useSearchParams();
  if (params.get("acces") !== "requis") return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-3 border-b border-[rgba(201,165,90,0.22)] bg-white px-4 py-3.5 shadow-[0_4px_24px_rgba(0,0,0,0.1)]"
    >
      <AlertTriangle size={14} className="shrink-0 text-[#c9a55a]" />
      <p className="text-sm font-semibold text-gray-900">
        Cet outil est réservé aux abonnés.{" "}
        <span className="text-[#c9a55a]">Abonnez-vous ci-dessous.</span>
      </p>
      <Link href="#abonnement"
        className="ml-2 rounded-full border border-[rgba(201,165,90,0.35)] bg-[rgba(201,165,90,0.1)] px-3 py-1 text-xs font-bold text-[#c9a55a] transition hover:bg-[rgba(201,165,90,0.2)]">
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
  { icon: CalendarRange, title: "Agenda & Planification", g1: "#3b82f6", g2: "#6366f1" },
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
];

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

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden pt-[100px] pb-16 sm:pt-[130px] sm:pb-24"
        style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 55%,#1e1035 100%)" }}
      >
        {/* Déco */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#c9a55a]/80 to-transparent" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(201,165,90,0.06)] blur-[140px]" />

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.30)] bg-[rgba(201,165,90,0.10)] px-5 py-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#c9a55a]"
          >
            <Sparkles size={9} /> Espace Client DJAMA
          </motion.div>

          {/* Titre */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.1 }}
            className="text-[2.4rem] font-black leading-[1.1] tracking-tight text-white sm:text-[3.6rem]"
          >
            Gérez votre activité.{" "}
            <span className="bg-gradient-to-r from-[#c9a55a] via-[#e8c97a] to-[#c9a55a] bg-clip-text text-transparent">
              Tout en un.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.3 }}
            className="mx-auto mt-5 max-w-md text-sm leading-[1.8] text-white/55 sm:text-base"
          >
            18 outils professionnels réunis dans un seul abonnement à <strong className="text-white/80">11,90€/mois</strong>.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.45 }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            <Link href="#abonnement"
              className="group flex items-center gap-2.5 rounded-2xl bg-[#c9a55a] px-8 py-3.5 text-sm font-bold text-white shadow-[0_8px_32px_rgba(201,165,90,0.35)] transition-all hover:bg-[#d9b56a]">
              <Wallet size={15} />
              S&apos;abonner — 11,90€/mois
              <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/login"
              className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white/75 transition hover:bg-white/15 hover:text-white">
              <LogIn size={14} /> Déjà abonné ? Se connecter
            </Link>
          </motion.div>

          {/* Micro-trust */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.65 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
          >
            {[
              { icon: Zap,        text: "Accès immédiat" },
              { icon: Lock,       text: "Stripe SSL"     },
              { icon: BadgeCheck, text: "Sans engagement"},
              { icon: Users,      text: "+50 abonnés"   },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5 text-[0.7rem] text-white/35">
                <Icon size={10} className="text-[#c9a55a]" />
                {text}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── MOCKUP DASHBOARD ── */}
      <section id="outils" className="bg-white py-14 sm:py-20 overflow-hidden">
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
              18 outils,{" "}
              <span className="text-[#c9a55a]">un seul abonnement.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm text-gray-400">
              Tout ce dont vous avez besoin pour piloter votre activité, réuni dans un seul espace.
            </p>
          </motion.div>

          {/* Grille outils style app icons */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
            className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
          >
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <motion.div key={tool.title}
                  variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease } } }}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
                >
                  {/* Icône style iOS */}
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

      {/* ── ABONNEMENT ── */}
      <section id="abonnement" className="border-t border-gray-100 bg-[#f8f9fa] py-14 sm:py-20">
        <div className="mx-auto max-w-md px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.6, ease }}
            className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(201,165,90,0.30)] bg-white shadow-[0_4px_32px_rgba(0,0,0,.08)]"
          >
            {/* Top accent */}
            <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-[#c9a55a] to-transparent" />

            <div className="p-8">
              {/* Badge */}
              <div className="mb-5 inline-flex w-fit items-center gap-1.5 rounded-full border border-[rgba(201,165,90,0.22)] bg-[rgba(201,165,90,0.08)] px-3 py-1 text-[0.6rem] font-bold uppercase tracking-widest text-[#c9a55a]">
                <Sparkles size={7} /> Abonnement mensuel
              </div>

              {/* Prix */}
              <div className="flex items-start gap-1">
                <span className="mt-3 text-lg font-bold text-[#c9a55a]">€</span>
                <span className="text-[5rem] font-black leading-none tracking-tighter text-gray-900">11,90</span>
              </div>
              <p className="mt-1 text-[0.72rem] text-gray-400">par mois · tout compris · sans engagement</p>

              <div className="my-5 h-px w-full bg-gradient-to-r from-[#c9a55a]/20 to-transparent" />

              {/* Liste courte */}
              <ul className="mb-7 grid grid-cols-2 gap-y-2 gap-x-3">
                {[
                  "18 outils inclus",
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
              <div className="mt-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <Link href="/login" className="text-[0.68rem] font-semibold text-[#c9a55a]/70 transition hover:text-[#c9a55a]">
                  Déjà abonné ? Se connecter →
                </Link>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-6 sm:flex-row">
          <p className="text-[0.68rem] text-gray-300">© 2025 DJAMA · Tous droits réservés</p>
          <div className="flex items-center gap-5 text-[0.68rem] text-gray-400">
            <a href="mailto:contact@djama.space" className="transition hover:text-[#c9a55a]">contact@djama.space</a>
            <Link href="/login" className="transition hover:text-[#c9a55a]">Se connecter</Link>
            <Link href="/" className="transition hover:text-gray-600">Accueil</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
