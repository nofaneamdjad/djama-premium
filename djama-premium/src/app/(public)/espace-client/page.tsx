"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import {
  FileText, CalendarDays, StickyNote, LayoutDashboard, FolderOpen,
  CheckCircle2, ArrowRight, Sparkles, Shield, Zap, Lock, Wallet,
  AlertTriangle, MessageCircle, Users,
} from "lucide-react";
import StripeButton from "@/components/ui/StripeButton";
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
    icon: CalendarDays,
    title: "Planning / Agenda",
    desc: "Gérez votre agenda en vue Jour, Semaine ou Mois avec rappels et gestion des RDV.",
    color: "#60a5fa",
    rgb: "96,165,250",
    chips: ["Jour / Semaine / Mois", "Rappels", "RDV", "Intuitif"],
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
    icon: LayoutDashboard,
    title: "Tableau de bord",
    desc: "Vue d'ensemble de votre activité et accès rapide à tous vos outils DJAMA.",
    color: "#a78bfa",
    rgb: "167,139,250",
    chips: ["Vue globale", "Accès rapide", "Résumé", "Perso"],
  },
  {
    icon: FolderOpen,
    title: "Documents",
    desc: "Retrouvez tous vos documents générés, classés et stockés en sécurité.",
    color: "#fb923c",
    rgb: "251,146,60",
    chips: ["Classement", "Historique", "PDF", "Sécurisé"],
  },
] as const;

const INCLUS = [
  "Accès à tous les 5 outils inclus",
  "Générateur de factures et devis PDF",
  "Planning / agenda complet",
  "Bloc-notes professionnel",
  "Tableau de bord personnel",
  "Stockage et gestion de documents",
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
   PAGE
───────────────────────────────────────────────────────── */
export default function EspaceClientPage() {
  return (
    <div className="bg-white">
      <Suspense>
        <AccessBanner />
      </Suspense>

      {/* ══════════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════════ */}
      <section className="hero-dark hero-grid relative overflow-hidden pb-32 pt-40">
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
            Un abonnement mensuel simple pour accéder à vos outils de gestion —
            factures, agenda, notes et plus encore. Toujours disponibles, toujours à jour.
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

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ══════════════════════════════════════════════
          2. OUTILS (5 cartes)
      ══════════════════════════════════════════════ */}
      <section id="outils" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.6, ease }}
            className="mb-14 text-center"
          >
            <span className="badge badge-gold-light mb-4 inline-flex">
              <Sparkles size={10} /> Ce qui est inclus
            </span>
            <h2 className="display-section text-[var(--ink)]">
              5 outils,{" "}
              <span className="text-gold">un seul abonnement.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-[var(--muted)]">
              Conçus pour les indépendants et entrepreneurs qui veulent aller
              vite sans sacrifier la qualité.
            </p>
          </motion.div>

          {/* Grid 5 tool cards — dark preview cards */}
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
                    <div
                      className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition-transform duration-300 group-hover:scale-110"
                      style={{
                        background: `rgba(${tool.rgb}, 0.12)`,
                        borderColor: `rgba(${tool.rgb}, 0.24)`,
                      }}
                    >
                      <Icon size={20} style={{ color: tool.color }} />
                    </div>

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
      <section id="abonnement" className="bg-[var(--surface)] py-24">
        <div className="mx-auto max-w-md px-6">
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={viewport}
            transition={{ duration: 0.75, ease }}
            className="relative overflow-hidden rounded-[2rem] border border-[rgba(201,165,90,0.28)] bg-[var(--ink)] shadow-[0_40px_100px_rgba(0,0,0,0.28)]"
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

              {/* Séparateur */}
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.07]" />
                <span className="text-[0.65rem] font-bold uppercase tracking-widest text-white/20">
                  ou
                </span>
                <div className="h-px flex-1 bg-white/[0.07]" />
              </div>

              {/* ── PayPal ── */}
              <a
                href="https://www.paypal.com/paypalme/djamapremium/11.90"
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2.5 rounded-[1rem] border border-[rgba(255,196,57,0.32)] bg-[#FFD140] py-3.5 text-sm font-bold text-[#09090b] transition-all duration-300 hover:brightness-105 hover:shadow-[0_0_24px_rgba(255,209,64,0.28)]"
              >
                {/* PayPal SVG */}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"
                    fill="#003087"
                  />
                </svg>
                Payer avec PayPal — 11,90€
              </a>

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
      <section className="hero-dark relative overflow-hidden py-24">
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
                <div
                  className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: `rgba(${rgb}, 0.12)`,
                    borderColor: `rgba(${rgb}, 0.22)`,
                  }}
                >
                  <Icon size={20} style={{ color }} />
                </div>
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
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.55, ease }}
          className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] px-8 py-10"
        >
          <p className="mb-1 text-base font-bold text-[var(--ink)]">
            Déjà abonné ?
          </p>
          <p className="mb-6 text-sm text-[var(--muted)]">
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
