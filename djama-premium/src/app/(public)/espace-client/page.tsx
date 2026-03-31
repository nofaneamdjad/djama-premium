"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  CalendarDays,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Lock,
  Wallet,
  Download,
  Eye,
  Bell,
  ListChecks,
  LayoutDashboard,
  AlertTriangle,
} from "lucide-react";
import StripeButton from "@/components/ui/StripeButton";
import { FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainerFast, cardReveal, viewport } from "@/lib/animations";

/* ─── Banner accès requis ─────────────────────────────── */
function AccessBanner() {
  const params = useSearchParams();
  const show = params.get("acces") === "requis";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-3 border-b border-[rgba(201,165,90,0.25)] bg-[rgba(15,17,23,0.97)] px-4 py-3.5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl"
        >
          <AlertTriangle size={15} style={{ color: "#c9a55a", flexShrink: 0 }} />
          <p className="text-sm font-semibold text-white">
            Cet outil est réservé aux abonnés.{" "}
            <span className="text-[#c9a55a]">Abonnez-vous ci-dessous pour y accéder.</span>
          </p>
          <Link
            href="#abonnement"
            className="ml-2 rounded-full border border-[rgba(201,165,90,0.4)] bg-[rgba(201,165,90,0.12)] px-3 py-1 text-xs font-bold text-[#c9a55a] transition hover:bg-[rgba(201,165,90,0.2)]"
          >
            Voir l&apos;offre ↓
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const ease = [0.16, 1, 0.3, 1] as const;

/* ─── Contenu ────────────────────────────────────── */

const TOOLS = [
  {
    icon: FileText,
    title: "Factures & Devis",
    color: "#c9a55a",
    glow: "rgba(201,165,90,0.15)",
    bg: "from-[#1a1200] via-[#2a1c00] to-[#1e1500]",
    points: [
      { icon: Zap,      text: "Création en moins de 2 minutes" },
      { icon: Download, text: "Export PDF propre et professionnel" },
      { icon: Eye,      text: "Aperçu direct avant téléchargement" },
      { icon: FileText, text: "Logo personnalisé et numérotation auto" },
    ],
  },
  {
    icon: CalendarDays,
    title: "Planning / Agenda",
    color: "#7c6fcd",
    glow: "rgba(124,111,205,0.15)",
    bg: "from-[#0d0d1a] via-[#111132] to-[#1a1040]",
    points: [
      { icon: CalendarDays, text: "Vue jour, semaine et mois" },
      { icon: Bell,         text: "Rappels et notifications" },
      { icon: ListChecks,   text: "Gestion des tâches et priorités" },
      { icon: LayoutDashboard, text: "Tableau de bord unifié" },
    ],
  },
];

const INCLUS = [
  "Générateur de factures et devis",
  "Planning / agenda complet",
  "Tableau de bord personnel",
  "Accès immédiat après paiement",
  "Interface moderne et intuitive",
  "Sans engagement, résiliable à tout moment",
];

const REASSURANCES = [
  { icon: Zap,    label: "Accès immédiat" },
  { icon: Shield, label: "Paiement sécurisé" },
  { icon: Lock,   label: "Données protégées" },
];

/* ─── Page ───────────────────────────────────────── */
export default function EspaceClientPage() {
  return (
    <div className="bg-white">
      <Suspense>
        <AccessBanner />
      </Suspense>

      {/* ══ HERO MINIMAL ══════════════════════════════ */}
      <section className="hero-dark hero-grid relative overflow-hidden pb-28 pt-36">
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-[520px] w-[640px] rounded-full bg-[rgba(176,141,87,0.11)] blur-[110px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-[rgba(176,141,87,0.3)] bg-[rgba(176,141,87,0.1)] px-5 py-2 text-xs font-bold uppercase tracking-widest text-[#c9a55a]"
          >
            <Sparkles size={10} />
            Espace Client DJAMA
          </motion.div>

          {/* Titre */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.1 }}
            className="display-hero text-white"
          >
            Vos outils pro,{" "}
            <span className="text-gold">11,90€&nbsp;/&nbsp;mois.</span>
          </motion.h1>

          <FadeReveal delay={0.5} as="p" className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/55">
            Un abonnement mensuel simple pour accéder à vos outils de gestion —
            factures, devis et agenda — depuis un espace personnel moderne.
          </FadeReveal>

          {/* CTA hero */}
          <FadeReveal delay={0.7} className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="#abonnement" className="btn-primary px-8 py-4 text-base">
              <Wallet size={17} />
              S&apos;abonner maintenant
            </Link>
            <Link href="#outils" className="btn-ghost px-8 py-4 text-base">
              Voir les outils <ArrowRight size={16} />
            </Link>
          </FadeReveal>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ══ CARTE ABONNEMENT ════════════════════════════ */}
      <section id="abonnement" className="mx-auto max-w-lg px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={viewport}
          transition={{ duration: 0.8, ease }}
          className="relative overflow-hidden rounded-[2rem] border border-[rgba(201,165,90,0.3)] bg-[var(--ink)] shadow-[0_40px_100px_rgba(0,0,0,0.22)]"
        >
          {/* Glow interne */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[300px] w-[400px] rounded-full bg-[rgba(176,141,87,0.1)] blur-[80px]" />
          </div>

          {/* Filet top doré */}
          <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-[#c9a55a] to-transparent" />

          <div className="relative px-8 py-10">
            {/* Label offre */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.3)] bg-[rgba(201,165,90,0.1)] px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-[#c9a55a]">
              <Sparkles size={9} /> Abonnement mensuel
            </div>

            {/* Prix */}
            <div className="mb-1 flex items-end gap-1.5">
              <span className="text-[4.5rem] font-black leading-none text-white">11,90</span>
              <div className="mb-2.5 flex flex-col leading-none">
                <span className="text-2xl font-black text-white">€</span>
                <span className="mt-1 text-xs text-white/40">/&nbsp;mois</span>
              </div>
            </div>
            <p className="mb-7 text-sm text-white/35">Sans engagement · Résiliable à tout moment</p>

            {/* Divider */}
            <div className="divider-gold mb-7" />

            {/* Ce qui est inclus */}
            <ul className="mb-8 space-y-3">
              {INCLUS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-[#e5e7eb]">
                  <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0" style={{ color: "#c9a55a" }} />
                  {item}
                </li>
              ))}
            </ul>

            {/* ── Bouton Stripe (abonnement carte bancaire) ── */}
            <StripeButton label="S'abonner pour 11,90€ / mois" />

            {/* Séparateur */}
            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/8" />
              <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-white/25">ou</span>
              <div className="h-px flex-1 bg-white/8" />
            </div>

            {/* ── Bouton PayPal ── */}
            <a
              href="https://www.paypal.com/paypalme/djamapremium/11.90"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2.5 rounded-[1rem] border border-[rgba(255,196,57,0.35)] bg-[#FFD140] py-3.5 text-sm font-bold text-[#09090b] transition-all duration-300 hover:brightness-105 hover:shadow-[0_0_28px_rgba(255,209,64,0.3)]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" fill="#003087"/>
              </svg>
              Payer via PayPal — 11,90€
            </a>

            {/* ── Message rassurant ── */}
            <div className="mt-6 rounded-xl border border-[rgba(201,165,90,0.15)] bg-[rgba(201,165,90,0.07)] px-4 py-4">
              <p className="text-center text-xs leading-relaxed text-[#d4b87a]">
                🔒 Paiement 100 % sécurisé. Vos accès vous sont envoyés par email
                sous quelques minutes. Aucune surprise, aucun frais caché.
                Résiliable à tout moment.
              </p>
            </div>

            {/* ── Badges confiance ── */}
            <div className="mt-5 flex justify-center gap-5">
              {REASSURANCES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-[0.7rem] text-white/30">
                  <Icon size={11} style={{ color: "#c9a55a" }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ══ OUTILS INCLUS ═══════════════════════════════ */}
      <section id="outils" className="bg-[var(--surface)] py-24">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.6, ease }}
            className="mb-14 text-center"
          >
            <h2 className="display-section text-[var(--ink)]">
              Deux outils,{" "}
              <span className="text-gold">tout ce qu&apos;il vous faut.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-[var(--muted)]">
              Conçus pour les indépendants et entrepreneurs qui veulent aller vite
              sans sacrifier la qualité.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={staggerContainerFast}
            className="grid gap-6 md:grid-cols-2"
          >
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.title}
                  variants={cardReveal}
                  className="overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-white shadow-[0_2px_12px_rgba(9,9,11,0.05)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_24px_56px_rgba(9,9,11,0.1)]"
                  style={{ "--hover-border": `${tool.color}40` } as React.CSSProperties}
                >
                  {/* Header visuel sombre */}
                  <div className={`relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br ${tool.bg}`}>
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                        backgroundSize: "26px 26px",
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-32 w-32 rounded-full blur-3xl" style={{ background: tool.glow }} />
                    </div>
                    <div
                      className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border"
                      style={{
                        background: tool.glow,
                        borderColor: `${tool.color}30`,
                        boxShadow: `0 0 28px ${tool.glow}`,
                      }}
                    >
                      <Icon size={30} style={{ color: tool.color }} />
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="p-7">
                    <h3 className="mb-5 text-xl font-extrabold text-[var(--ink)]">{tool.title}</h3>
                    <ul className="space-y-3">
                      {tool.points.map(({ icon: PIcon, text }) => (
                        <li key={text} className="flex items-center gap-3 text-sm text-[var(--muted)]">
                          <div
                            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                            style={{ background: `${tool.color}12` }}
                          >
                            <PIcon size={13} style={{ color: tool.color }} />
                          </div>
                          {text}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ══ DÉJÀ ABONNÉ ═════════════════════════════════ */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.6, ease }}
        >
          <p className="mb-3 text-sm font-semibold text-[var(--muted)]">Déjà abonné ?</p>
          <Link href="/login" className="btn-light inline-flex items-center gap-2">
            <Lock size={15} />
            Accéder à mon espace client
          </Link>
        </motion.div>
      </section>

    </div>
  );
}
