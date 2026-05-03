"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import {
  FileText, CalendarRange, StickyNote, Brain, Timer, CreditCard, Globe,
  CheckCircle2, ArrowRight, Sparkles, Shield, Zap, Lock, Wallet,
  AlertTriangle, MessageCircle, Users, LogIn, Star, TrendingUp,
} from "lucide-react";
import StripeButton  from "@/components/ui/StripeButton";
import { FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainerFast, cardReveal, viewport, staggerContainer, fadeIn } from "@/lib/animations";

const ease = [0.16, 1, 0.3, 1] as const;

/* ─────────────────────────────────────────────────────────
   BANNER — accès refusé
───────────────────────────────────────────────────────── */
function AccessBanner() {
  const params = useSearchParams();
  const show   = params.get("acces") === "requis";
  if (!show) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-3 border-b border-[rgba(201,165,90,0.22)] bg-[rgba(9,9,11,0.97)] px-4 py-3.5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl"
    >
      <AlertTriangle size={14} className="shrink-0 text-[#c9a55a]" />
      <p className="text-sm font-semibold text-white">
        Cet outil est réservé aux abonnés.{" "}
        <span className="text-[#c9a55a]">Abonnez-vous ci-dessous.</span>
      </p>
      <Link
        href="#abonnement"
        className="ml-2 rounded-full border border-[rgba(201,165,90,0.35)] bg-[rgba(201,165,90,0.1)] px-3 py-1 text-xs font-bold text-[#c9a55a] transition hover:bg-[rgba(201,165,90,0.2)]"
      >
        Voir l&apos;offre ↓
      </Link>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   DONNÉES
───────────────────────────────────────────────────────── */
const TOOLS = [
  {
    icon: FileText,
    title: "Factures & Devis",
    desc: "Créez des documents professionnels avec logo, TVA et export PDF en quelques secondes.",
    color: "#c9a55a",
    rgb: "201,165,90",
    chips: ["Export PDF", "Logo perso", "Numérotation", "TVA"],
  },
  {
    icon: CalendarRange,
    title: "Agenda & Planification",
    desc: "Organisez vos rendez-vous, équipes et tâches en toute simplicité.",
    color: "#60a5fa",
    rgb: "96,165,250",
    chips: ["Rendez-vous", "Équipes", "Tâches", "Intuitif"],
  },
  {
    icon: StickyNote,
    title: "Bloc-notes pro",
    desc: "Notes par catégorie, sauvegarde automatique et export PDF en un clic.",
    color: "#4ade80",
    rgb: "74,222,128",
    chips: ["Par catégorie", "Export PDF", "Sauvegarde auto", "Épuré"],
  },
  {
    icon: Brain,
    title: "Coach Business IA",
    desc: "Analyse vos données réelles — CA, impayés, clients inactifs — et vous guide chaque jour.",
    color: "#a78bfa",
    rgb: "167,139,250",
    chips: ["IA", "Coach", "Analyse", "Proactif"],
  },
  {
    icon: Users,
    title: "CRM Client",
    desc: "Gérez vos contacts, prospects et clients actifs avec statut, suivi et historique.",
    color: "#22d3ee",
    rgb: "34,211,238",
    chips: ["Contacts", "Prospects", "Actifs", "Historique"],
  },
  {
    icon: Timer,
    title: "Chrono Pro",
    desc: "Suivez votre temps par projet et client, mesurez votre rentabilité réelle.",
    color: "#fb923c",
    rgb: "251,146,60",
    chips: ["Par projet", "Par client", "Rentabilité", "Export"],
  },
  {
    icon: CreditCard,
    title: "Dépenses Pro",
    desc: "Enregistrez vos frais professionnels par catégorie et suivez vos sorties de trésorerie.",
    color: "#f43f5e",
    rgb: "244,63,94",
    chips: ["Frais pro", "Catégories", "Trésorerie", "Historique"],
  },
  {
    icon: Wallet,
    title: "Trésorerie",
    desc: "Visualisez votre solde, vos entrées/sorties et anticipez vos flux de trésorerie.",
    color: "#34d399",
    rgb: "52,211,153",
    chips: ["Solde", "Entrées", "Sorties", "Prévisions"],
  },
  {
    icon: Shield,
    title: "Contrats IA",
    desc: "Générez des contrats professionnels personnalisés en quelques secondes grâce à l'IA.",
    color: "#eab308",
    rgb: "234,179,8",
    chips: ["IA", "Personnalisé", "PDF", "Professionnel"],
  },
  {
    icon: Globe,
    title: "Sourcing IA",
    desc: "Trouvez des fournisseurs mondiaux, accédez aux marchés publics & privés via l'IA.",
    color: "#f59e0b",
    rgb: "245,158,11",
    chips: ["Mondial", "Marchés publics", "IA", "B2B"],
  },
] as const;

const INCLUS = [
  "Accès à tous les 11 outils inclus",
  "Coach Business IA (analyse vos données réelles)",
  "Factures & devis illimités",
  "CRM & gestion contacts / prospects",
  "Agenda & Planification (RDV, équipes, tâches)",
  "Chrono & suivi de temps par projet",
  "Dépenses & frais professionnels",
  "Trésorerie & flux financiers",
  "Contrats IA générés en un clic",
  "Sourcing IA & marchés publics / privés",
  "Bloc-notes professionnel",
  "Accès immédiat après paiement",
  "Sans engagement — résiliable à tout moment",
];

const TRUST = [
  {
    icon: Lock,
    color: "#c9a55a",
    rgb: "201,165,90",
    title: "Paiement sécurisé",
    desc: "Stripe chiffré SSL. Vos données bancaires ne nous parviennent jamais directement.",
  },
  {
    icon: Zap,
    color: "#4ade80",
    rgb: "74,222,128",
    title: "Accès immédiat",
    desc: "Vos accès sont envoyés par email dans les minutes qui suivent votre paiement.",
  },
  {
    icon: Shield,
    color: "#60a5fa",
    rgb: "96,165,250",
    title: "Données protégées",
    desc: "Vos informations sont chiffrées et hébergées en sécurité. RGPD respecté.",
  },
  {
    icon: MessageCircle,
    color: "#a78bfa",
    rgb: "167,139,250",
    title: "Support humain",
    desc: "Une question ? Notre équipe répond sous 24h — par email ou WhatsApp.",
  },
] as const;

const TESTIMONIALS = [
  {
    name: "Karim B.",
    role: "Consultant indépendant",
    text: "DJAMA a remplacé 4 outils différents. Depuis que j'utilise le Coach IA, j'ai arrêté de perdre du temps à analyser mes chiffres.",
    stars: 5,
  },
  {
    name: "Sofia M.",
    role: "Graphiste freelance",
    text: "Les factures PDF sont impeccables. Mes clients me demandent souvent avec quel outil je les génère. Ça fait la différence.",
    stars: 5,
  },
  {
    name: "Thomas D.",
    role: "Artisan entrepreneur",
    text: "La trésorerie en temps réel, c'est ce dont j'avais besoin. Je vois d'un coup d'œil où j'en suis chaque matin.",
    stars: 5,
  },
] as const;

/* ─────────────────────────────────────────────────────────
   Redirection automatique si déjà abonné
───────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function EspaceClientPage() {
  return (
    <div className="bg-[#09090b]">
      <Suspense>
        <AlreadySubscribedRedirect />
        <AccessBanner />
      </Suspense>

      {/* ══════════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════════ */}
      <section className="hero-dark hero-grid relative overflow-hidden pb-20 pt-24 sm:pb-36 sm:pt-44">
        {/* Glows */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-[560px] w-[700px] rounded-full bg-[rgba(176,141,87,0.10)] blur-[110px]" />
        </div>
        <div className="pointer-events-none absolute right-0 top-1/3 h-[300px] w-[300px] rounded-full bg-[rgba(96,165,250,0.04)] blur-[80px]" />

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-[rgba(176,141,87,0.30)] bg-[rgba(176,141,87,0.10)] px-5 py-2 text-xs font-bold uppercase tracking-widest text-[#c9a55a]"
          >
            <Sparkles size={10} />
            Espace Client DJAMA
          </motion.div>

          {/* Titre */}
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease, delay: 0.1 }}
            className="display-hero text-white"
          >
            Vos outils pros,{" "}
            <span className="text-gold">tout-en-un.</span>
          </motion.h1>

          <FadeReveal
            delay={0.45}
            as="p"
            className="mx-auto mt-6 max-w-xl text-lg leading-[1.8] text-white/50"
          >
            Un abonnement mensuel simple pour accéder à 11 outils de gestion —
            Coach IA, CRM, Trésorerie, Contrats, Sourcing et bien plus encore.
          </FadeReveal>

          {/* CTAs */}
          <FadeReveal delay={0.62} className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="#abonnement" className="btn-primary px-8 py-4 text-base">
              <Wallet size={17} />
              S&apos;abonner — 11,90€/mois
            </Link>
            <Link href="#outils" className="btn-ghost px-8 py-4 text-base">
              Voir les outils <ArrowRight size={16} />
            </Link>
          </FadeReveal>

          {/* Trust strip */}
          <FadeReveal
            delay={0.82}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
          >
            {[
              { icon: Zap,           text: "Accès immédiat" },
              { icon: Lock,          text: "Paiement sécurisé" },
              { icon: CheckCircle2,  text: "Sans engagement" },
              { icon: Users,         text: "+50 abonnés actifs" },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5 text-xs text-white/30">
                <Icon size={11} className="text-[#c9a55a]" />
                {text}
              </span>
            ))}
          </FadeReveal>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#09090b] to-transparent" />
      </section>

      {/* ══════════════════════════════════════════════
          2. BLOC — DÉJÀ ABONNÉ (très visible)
      ══════════════════════════════════════════════ */}
      <section className="bg-[#09090b] pb-10 pt-0 sm:pb-16">
        <div className="mx-auto max-w-3xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.6, ease }}
            className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(201,165,90,0.22)] bg-[#111113]"
            style={{ boxShadow: "0 0 60px rgba(201,165,90,0.06), 0 20px 60px rgba(0,0,0,0.35)" }}
          >
            {/* Accent line top */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#c9a55a]/50 to-transparent" />

            {/* Glow */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-0 h-[160px] w-[400px] -translate-x-1/2 rounded-full bg-[rgba(201,165,90,0.06)] blur-[60px]" />
            </div>

            <div className="relative flex flex-col items-center gap-6 px-8 py-9 sm:flex-row sm:justify-between">
              {/* Left */}
              <div className="flex items-center gap-5">
                <div
                  className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-[rgba(201,165,90,0.28)]"
                  style={{ background: "rgba(201,165,90,0.10)", boxShadow: "0 0 20px rgba(201,165,90,0.18)" }}
                >
                  <LogIn size={22} className="text-[#c9a55a]" />
                </div>
                <div>
                  <p className="text-base font-extrabold text-white sm:text-lg">
                    Déjà abonné ?
                  </p>
                  <p className="mt-0.5 text-sm text-white/40">
                    Accédez directement à votre espace de gestion.
                  </p>
                </div>
              </div>

              {/* Right */}
              <Link
                href="/login"
                className="group flex w-full items-center justify-center gap-2.5 rounded-xl border border-[rgba(201,165,90,0.35)] bg-[rgba(201,165,90,0.10)] px-7 py-3.5 text-sm font-bold text-[#c9a55a] transition-all duration-200 hover:bg-[rgba(201,165,90,0.18)] hover:border-[rgba(201,165,90,0.55)] hover:shadow-[0_0_24px_rgba(201,165,90,0.18)] sm:w-auto"
              >
                Se connecter
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          3. OUTILS
      ══════════════════════════════════════════════ */}
      <section id="outils" className="bg-[#0f0f13] py-14 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.6, ease }}
            className="mb-14 text-center"
          >
            <span className="badge badge-gold-dark mb-4 inline-flex">
              <Sparkles size={10} /> Ce qui est inclus
            </span>
            <h2 className="display-section text-white">
              11 outils,{" "}
              <span className="text-gold">un seul abonnement.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-white/45">
              Conçus pour les indépendants et entrepreneurs qui veulent aller
              vite sans sacrifier la qualité.
            </p>
          </motion.div>

          {/* Grid */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={staggerContainerFast}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.title}
                  variants={cardReveal}
                  className="group overflow-hidden rounded-[1.5rem] border border-white/[0.07] bg-[#09090b] transition-all duration-300 hover:-translate-y-1"
                  style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}
                  whileHover={{
                    boxShadow: `0 16px 48px rgba(${tool.rgb}, 0.14)`,
                    borderColor: `rgba(${tool.rgb}, 0.3)`,
                  }}
                  transition={{ duration: 0.3, ease }}
                >
                  <div
                    className="h-[2px] w-full"
                    style={{ background: `linear-gradient(90deg, ${tool.color}, transparent)` }}
                  />
                  <div className="p-6">
                    <motion.div
                      className="mb-4 inline-flex h-[52px] w-[52px] items-center justify-center rounded-2xl border"
                      style={{
                        background: `rgba(${tool.rgb}, 0.14)`,
                        borderColor: `rgba(${tool.rgb}, 0.30)`,
                        boxShadow: `0 0 16px rgba(${tool.rgb}, 0.22)`,
                      }}
                      whileHover={{ scale: 1.13, boxShadow: `0 0 28px rgba(${tool.rgb}, 0.55)` }}
                      transition={{ duration: 0.22 }}
                    >
                      <Icon size={22} style={{ color: tool.color }} />
                    </motion.div>
                    <h3 className="text-base font-extrabold text-white">{tool.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/40">{tool.desc}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {tool.chips.map((chip) => (
                        <span
                          key={chip}
                          className="rounded-full px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider"
                          style={{
                            background: `rgba(${tool.rgb}, 0.1)`,
                            color: tool.color,
                            border: `1px solid rgba(${tool.rgb}, 0.2)`,
                          }}
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* CTA sous les outils */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.55, ease, delay: 0.2 }}
            className="mt-14 text-center"
          >
            <Link href="#abonnement" className="btn-primary px-8 py-3.5 text-sm">
              <Wallet size={16} />
              S&apos;abonner — accès à tout pour 11,90€/mois{" "}
              <ArrowRight size={14} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          4. STAT STRIP
      ══════════════════════════════════════════════ */}
      <section className="border-y border-white/[0.05] bg-[#09090b] py-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={staggerContainerFast}
          className="mx-auto flex max-w-4xl flex-col items-center justify-around gap-8 px-6 sm:flex-row"
        >
          {[
            { value: "11", label: "Outils inclus", icon: Sparkles },
            { value: "+50", label: "Abonnés actifs", icon: Users },
            { value: "11,90€", label: "Par mois tout compris", icon: Wallet },
            { value: "< 2 min", label: "Prise en main", icon: Zap },
          ].map(({ value, label, icon: Icon }) => (
            <motion.div
              key={label}
              variants={cardReveal}
              className="flex flex-col items-center gap-2 text-center"
            >
              <Icon size={14} className="text-[#c9a55a]/60" />
              <span className="text-3xl font-black text-white">{value}</span>
              <span className="text-xs text-white/35">{label}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          5. TÉMOIGNAGES
      ══════════════════════════════════════════════ */}
      <section className="bg-[#0f0f13] py-14 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.6, ease }}
            className="mb-12 text-center"
          >
            <span className="badge badge-gold-dark mb-4 inline-flex">
              <Star size={10} /> Ils utilisent DJAMA
            </span>
            <h2 className="display-section text-white">
              Ce qu&apos;en disent{" "}
              <span className="text-gold">nos abonnés.</span>
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={staggerContainerFast}
            className="grid gap-5 sm:grid-cols-3"
          >
            {TESTIMONIALS.map((t) => (
              <motion.div
                key={t.name}
                variants={cardReveal}
                className="flex flex-col gap-4 rounded-[1.5rem] border border-white/[0.07] bg-[#09090b] p-7 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.03]"
              >
                {/* Stars */}
                <div className="flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} size={12} className="fill-[#c9a55a] text-[#c9a55a]" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-white/60">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-auto flex items-center gap-3 border-t border-white/[0.06] pt-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(201,165,90,0.12)] text-sm font-bold text-[#c9a55a]">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{t.name}</p>
                    <p className="text-xs text-white/35">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          6. CARTE ABONNEMENT
      ══════════════════════════════════════════════ */}
      <section id="abonnement" className="bg-[#09090b] py-14 sm:py-28">
        <div className="mx-auto max-w-lg px-6">
          {/* Header section */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.5, ease }}
            className="mb-10 text-center"
          >
            <span className="badge badge-gold-dark mb-4 inline-flex">
              <TrendingUp size={10} /> Offre unique
            </span>
            <h2 className="display-section text-white">
              Simple, transparent,{" "}
              <span className="text-gold">sans surprise.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-white/40">
              Un seul tarif. Tous les outils. Pas de fonctionnalités cachées derrière un plan supérieur.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={viewport}
            transition={{ duration: 0.75, ease }}
            className="relative overflow-hidden rounded-[2rem] border border-[rgba(201,165,90,0.30)] bg-[#111113]"
            style={{ boxShadow: "0 0 80px rgba(201,165,90,0.08), 0 40px 100px rgba(0,0,0,0.5)" }}
          >
            {/* Glow interne */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-[320px] w-[440px] rounded-full bg-[rgba(176,141,87,0.09)] blur-[80px]" />
            </div>

            {/* Filet doré top */}
            <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-[#c9a55a] to-transparent" />

            <div className="relative px-8 py-11">
              {/* Badges ligne */}
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(201,165,90,0.22)] bg-[rgba(201,165,90,0.08)] px-3 py-1 text-[0.62rem] font-bold uppercase tracking-widest text-[#c9a55a]">
                  <Sparkles size={8} /> Abonnement mensuel
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(74,222,128,0.22)] bg-[rgba(74,222,128,0.06)] px-3 py-1 text-[0.62rem] font-bold uppercase tracking-widest text-[#4ade80]">
                  <CheckCircle2 size={8} /> Sans engagement
                </div>
              </div>

              <h3 className="text-xl font-extrabold leading-snug text-white">
                Accédez à tous les outils DJAMA
              </h3>
              <p className="mt-1.5 text-sm text-white/35">
                11 outils • Mises à jour continues • Résiliable à tout moment
              </p>

              {/* Prix */}
              <div className="my-8 flex items-end gap-2">
                <span className="text-[5rem] font-black leading-none tracking-tight text-white">
                  11,90
                </span>
                <div className="mb-4 flex flex-col leading-none">
                  <span className="text-3xl font-black text-[#c9a55a]">€</span>
                  <span className="mt-1 text-xs text-white/35">/ mois</span>
                </div>
              </div>

              {/* Divider doré */}
              <div className="divider-gold mb-8" />

              {/* Inclus */}
              <ul className="mb-9 space-y-3">
                {INCLUS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#e5e7eb]">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: "#c9a55a" }} />
                    {item}
                  </li>
                ))}
              </ul>

              {/* ── Stripe ── */}
              <StripeButton label="Commencer maintenant →" />

              {/* Trust ligne */}
              <p className="mt-5 text-center text-[0.72rem] text-white/28">
                Paiement sécurisé via Stripe • Accès immédiat • Sans engagement
              </p>

              {/* Lien connexion */}
              <div className="mt-6 flex items-center justify-center gap-2">
                <div className="h-px flex-1 bg-white/[0.06]" />
                <p className="text-[0.72rem] text-white/28">
                  Déjà abonné ?{" "}
                  <Link href="/login" className="font-bold text-[#c9a55a] hover:underline">
                    Se connecter →
                  </Link>
                </p>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          7. SECTION CONFIANCE
      ══════════════════════════════════════════════ */}
      <section className="hero-dark relative overflow-hidden py-14 sm:py-24">
        <div className="pointer-events-none absolute left-[15%] top-0 h-[280px] w-[340px] rounded-full bg-[rgba(201,165,90,0.05)] blur-[70px]" />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={staggerContainer}
          className="relative z-10 mx-auto max-w-6xl px-6"
        >
          <div className="mb-14 text-center">
            <motion.span variants={fadeIn} className="badge badge-gold-dark mb-4 inline-flex">
              <Shield size={10} /> Votre abonnement, sans risque
            </motion.span>
            <h2 className="display-section text-white">
              Conçu pour vous{" "}
              <span className="text-gold">faire confiance.</span>
            </h2>
          </div>

          <motion.div
            variants={staggerContainerFast}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {TRUST.map(({ icon: Icon, color, rgb, title, desc }) => (
              <motion.div
                key={title}
                variants={cardReveal}
                className="group rounded-[1.5rem] border border-white/[0.07] bg-white/[0.03] p-6 transition-all duration-300 hover:bg-white/[0.06]"
              >
                <motion.div
                  className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border"
                  style={{
                    background: `rgba(${rgb}, 0.14)`,
                    borderColor: `rgba(${rgb}, 0.28)`,
                    boxShadow: `0 0 14px rgba(${rgb}, 0.20)`,
                  }}
                  whileHover={{ scale: 1.12, boxShadow: `0 0 26px rgba(${rgb}, 0.52)` }}
                  transition={{ duration: 0.22 }}
                >
                  <Icon size={21} style={{ color }} />
                </motion.div>
                <h3 className="text-sm font-extrabold text-white">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-white/40">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          8. CTA FINAL
      ══════════════════════════════════════════════ */}
      <section className="bg-[#09090b] py-14 sm:py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.6, ease }}
          >
            <div className="pointer-events-none absolute inset-x-0 flex justify-center">
              <div className="h-[200px] w-[500px] rounded-full bg-[rgba(176,141,87,0.07)] blur-[80px]" />
            </div>
            <span className="badge badge-gold-dark mb-6 inline-flex">
              <Sparkles size={10} /> Commencer maintenant
            </span>
            <h2 className="display-section text-white">
              Prêt à passer au niveau{" "}
              <span className="text-gold">supérieur ?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base text-white/45">
              Rejoignez les entrepreneurs qui utilisent DJAMA pour gérer leur activité en toute sérénité.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link href="#abonnement" className="btn-primary px-9 py-4 text-base">
                <Wallet size={17} />
                S&apos;abonner — 11,90€/mois
              </Link>
              <Link href="/login" className="btn-ghost px-9 py-4 text-base">
                <LogIn size={16} />
                Déjà abonné
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          9. FOOTER MINIMAL
      ══════════════════════════════════════════════ */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <p className="text-xs text-white/20">
            © 2025 DJAMA · Tous droits réservés
          </p>
          <div className="flex items-center gap-5 text-xs text-white/25">
            <a href="mailto:contact@djama.space" className="transition hover:text-[#c9a55a]">
              contact@djama.space
            </a>
            <Link href="/login" className="transition hover:text-[#c9a55a]">
              Se connecter
            </Link>
            <Link href="/" className="transition hover:text-white/50">
              Accueil
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
