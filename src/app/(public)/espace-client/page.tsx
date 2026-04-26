"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import {
  FileText, CalendarRange, StickyNote, Brain, Timer, CreditCard, Globe,
  CheckCircle2, ArrowRight, Sparkles, Shield, Zap, Lock, Wallet,
  AlertTriangle, MessageCircle, Users,
} from "lucide-react";
import StripeButton  from "@/components/ui/StripeButton";
import { FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainerFast, cardReveal, viewport, staggerContainer, fadeIn } from "@/lib/animations";

const ease = [0.16, 1, 0.3, 1] as const;

/* ─────────────────────────────────────────────────────────
   BANNER — accès refusé (redirigé depuis un outil protégé)
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

/* ─────────────────────────────────────────────────────────
   Redirection automatique si déjà abonné
───────────────────────────────────────────────────────── */
function AlreadySubscribedRedirect() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    /* Ne pas rediriger si paiement annulé ou accès refusé */
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
      <section className="hero-dark hero-grid relative overflow-hidden pb-14 pt-24 sm:pb-32 sm:pt-40">
        {/* Glow central */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-[500px] w-[600px] rounded-full bg-[rgba(176,141,87,0.10)] blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-[rgba(176,141,87,0.28)] bg-[rgba(176,141,87,0.09)] px-5 py-2 text-xs font-bold uppercase tracking-widest text-[#c9a55a]"
          >
            <Sparkles size={10} />
            Espace Client DJAMA
          </motion.div>

          {/* Titre */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.1 }}
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
            Un abonnement mensuel simple pour accéder à vos 10 outils de gestion —
            Coach IA, CRM, Trésorerie, Contrats, Sourcing et bien plus encore. Toujours disponibles, toujours à jour.
          </FadeReveal>

          {/* CTA */}
          <FadeReveal delay={0.65} className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="#abonnement" className="btn-primary px-8 py-4 text-base">
              <Wallet size={17} />
              S&apos;abonner maintenant
            </Link>
            <Link href="#outils" className="btn-ghost px-8 py-4 text-base">
              Voir les outils <ArrowRight size={16} />
            </Link>
          </FadeReveal>

          {/* Trust strip */}
          <FadeReveal
            delay={0.8}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
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
          2. OUTILS (5 cartes)
      ══════════════════════════════════════════════ */}
      <section id="outils" className="bg-[#0f0f13] py-12 sm:py-24">
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

          {/* Grid 10 tool cards — dark preview cards */}
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
                  style={{
                    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                  }}
                  whileHover={{
                    boxShadow: `0 16px 48px rgba(${tool.rgb}, 0.14)`,
                    borderColor: `rgba(${tool.rgb}, 0.3)`,
                  }}
                  transition={{ duration: 0.3, ease }}
                >
                  {/* Accent line */}
                  <div
                    className="h-[2px] w-full"
                    style={{
                      background: `linear-gradient(90deg, ${tool.color}, transparent)`,
                    }}
                  />
                  <div className="p-6">
                    {/* Icon */}
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

                    <h3 className="text-base font-extrabold text-white">
                      {tool.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/40">
                      {tool.desc}
                    </p>

                    {/* Feature chips */}
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
            className="mt-12 text-center"
          >
            <Link href="#abonnement" className="btn-primary px-8 py-3.5 text-sm">
              <Wallet size={16} />
              S&apos;abonner et accéder aux outils — 11,90€/mois{" "}
              <ArrowRight size={14} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          3. CARTE ABONNEMENT
      ══════════════════════════════════════════════ */}
      <section id="abonnement" className="bg-[#09090b] py-12 sm:py-24">
        <div className="mx-auto max-w-md px-6">
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={viewport}
            transition={{ duration: 0.75, ease }}
            className="relative overflow-hidden rounded-[2rem] border border-[rgba(201,165,90,0.28)] bg-[#111113] shadow-[0_40px_100px_rgba(0,0,0,0.45)]"
          >
            {/* Glow interne */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-[320px] w-[420px] rounded-full bg-[rgba(176,141,87,0.09)] blur-[80px]" />
            </div>

            {/* Filet doré top */}
            <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-[#c9a55a] to-transparent" />

            <div className="relative px-8 py-10">
              {/* Label */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.28)] bg-[rgba(201,165,90,0.09)] px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-[#c9a55a]">
                <Sparkles size={9} /> Abonnement mensuel
              </div>

              {/* Prix */}
              <div className="mb-1 flex items-end gap-1.5">
                <span className="text-[4.5rem] font-black leading-none text-white">
                  11,90
                </span>
                <div className="mb-3 flex flex-col leading-none">
                  <span className="text-2xl font-black text-white">€</span>
                  <span className="mt-1 text-xs text-white/35">/ mois</span>
                </div>
              </div>
              <p className="mb-7 text-sm text-white/35">
                Sans engagement · Résiliable à tout moment · Accès immédiat
              </p>

              {/* Divider doré */}
              <div className="divider-gold mb-7" />

              {/* Inclus */}
              <ul className="mb-8 space-y-2.5">
                {INCLUS.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-[#e5e7eb]"
                  >
                    <CheckCircle2
                      size={14}
                      className="mt-0.5 shrink-0"
                      style={{ color: "#c9a55a" }}
                    />
                    {item}
                  </li>
                ))}
              </ul>

              {/* ── Stripe ── */}
              <StripeButton label="S'abonner — 11,90€ / mois" />

              {/* Message rassurant */}
              <div className="mt-6 rounded-xl border border-[rgba(201,165,90,0.14)] bg-[rgba(201,165,90,0.06)] px-4 py-3.5">
                <p className="text-center text-xs leading-relaxed text-[#d4b87a]">
                  🔒 Paiement 100&nbsp;% sécurisé · Vos accès vous sont envoyés
                  par email sous quelques minutes · Aucun frais caché ·
                  Résiliable à tout moment.
                </p>
              </div>

              {/* Badges confiance inline */}
              <div className="mt-5 flex flex-wrap justify-center gap-5">
                {[
                  { icon: Lock,    label: "Sécurisé" },
                  { icon: Zap,     label: "Immédiat" },
                  { icon: Shield,  label: "RGPD" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-1.5 text-[0.68rem] text-white/30"
                  >
                    <Icon size={11} className="text-[#c9a55a]" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          4. SECTION CONFIANCE
      ══════════════════════════════════════════════ */}
      <section className="hero-dark relative overflow-hidden py-12 sm:py-24">
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
          5. DÉJÀ ABONNÉ
      ══════════════════════════════════════════════ */}
      <section className="mx-auto max-w-4xl px-6 py-10 sm:py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.55, ease }}
          className="rounded-[1.5rem] border border-white/[.08] bg-[#111113] px-8 py-10"
        >
          <p className="mb-1 text-base font-bold text-white">
            Déjà abonné ?
          </p>
          <p className="mb-6 text-sm text-white/45">
            Connectez-vous pour accéder directement à votre espace et vos outils.
          </p>
          <Link
            href="/login"
            className="btn-primary inline-flex items-center gap-2 px-7 py-3.5 text-sm"
          >
            <Lock size={14} />
            Accéder à mon espace client
            <ArrowRight size={14} />
          </Link>
        </motion.div>
      </section>

    </div>
  );
}
