"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, Mail, Star, Zap, Users, Shield,
  CheckCircle2, Sparkles,
  TrendingUp, HeartHandshake, Globe, Brain,
} from "lucide-react";
import { getSiteData } from "@/lib/site-data";
import {
  fadeIn, staggerContainer, staggerContainerFast, cardReveal, viewport,
} from "@/lib/animations";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { useLanguage } from "@/lib/language-context";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── 4 services principaux ─────────────────────────────────── */
const MAIN_SERVICES = [
  {
    icon: Globe,
    color: "#c9a55a",
    bg: "rgba(201,165,90,0.10)",
    border: "rgba(201,165,90,0.22)",
    title: "Création de sites web",
    excerpt: "Sites vitrine, e-commerce et applications web sur mesure.",
    benefits: [
      "Site vitrine ou e-commerce complet",
      "Design premium responsive",
      "SEO technique inclus",
    ],
    href: "/services",
    cta: "Voir les offres",
  },
  {
    icon: Zap,
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.10)",
    border: "rgba(96,165,250,0.22)",
    title: "Automatisation & IA",
    excerpt: "Optimisez vos processus avec des outils intelligents.",
    benefits: [
      "Workflows automatisés par l'IA",
      "Outils sur mesure intégrés",
      "Gain de temps immédiat",
    ],
    href: "/services",
    cta: "Voir les offres",
  },
  {
    icon: Brain,
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    border: "rgba(167,139,250,0.20)",
    title: "Coaching IA",
    excerpt: "Formation intensive pour maîtriser l'IA dans votre activité.",
    benefits: [
      "5 modules vidéo + exercices",
      "Assistant IA personnel inclus",
      "Accès complet 3 mois",
    ],
    href: "/services/coaching-ia",
    cta: "Découvrir la formation",
  },
  {
    icon: Users,
    color: "#4ade80",
    bg: "rgba(74,222,128,0.08)",
    border: "rgba(74,222,128,0.20)",
    title: "Soutien scolaire",
    excerpt: "Accompagnement personnalisé pour progresser sereinement.",
    benefits: [
      "Toutes matières & niveaux",
      "Suivi régulier et progressif",
      "14€ / heure seulement",
    ],
    href: "/services/soutien-scolaire",
    cta: "En savoir plus",
  },
] as const;

/* ── Pourquoi DJAMA ─────────────────────────────────────────── */
const WHY_ITEMS = [
  {
    icon: Zap,
    color: "#c9a55a",
    title: "Exécution rapide",
    desc: "Processus IA-augmenté : nous livrons plus vite que les agences traditionnelles, sans sacrifier la qualité.",
  },
  {
    icon: Shield,
    color: "#60a5fa",
    title: "Qualité premium",
    desc: "Chaque livrable est soigné dans les détails. L'image que vous projetez mérite le meilleur.",
  },
  {
    icon: HeartHandshake,
    color: "#4ade80",
    title: "Accompagnement humain",
    desc: "Pas de ticket anonyme — une vraie relation directe avec l'équipe qui travaille pour vous.",
  },
  {
    icon: Brain,
    color: "#a78bfa",
    title: "Vision IA & business",
    desc: "Nous comprenons les enjeux business et techniques pour créer des solutions vraiment efficaces.",
  },
] as const;

/* ── Constantes ─────────────────────────────────────────────── */
const REAL_ACCENTS  = ["#c9a55a", "#60a5fa", "#a78bfa"] as const;
const STAT_ICONS    = [Users, TrendingUp, Zap, HeartHandshake] as const;
const STAT_COLORS   = ["#c9a55a", "#60a5fa", "#4ade80", "#a78bfa"] as const;

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */
export default function Home() {
  const data  = getSiteData();
  const { dict } = useLanguage();
  const h = dict.home;

  return (
    <div className="bg-white">

      {/* ══════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════ */}
      <section className="hero-dark hero-grid relative overflow-hidden">
        {/* Glows ambiants */}
        <div className="pointer-events-none absolute -left-20 -top-16 h-80 w-80 rounded-full bg-[rgba(201,165,90,0.07)] blur-[100px]" />
        <div className="pointer-events-none absolute right-0 top-1/4 h-64 w-64 rounded-full bg-[rgba(167,139,250,0.05)] blur-[80px]" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-40 pt-48">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto]">

            {/* Texte principal */}
            <div className="max-w-2xl">

              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease }}
                className="mb-8"
              >
                <span className="badge badge-gold-dark">
                  <Sparkles size={10} /> {h.hero.badge}
                </span>
              </motion.div>

              {/* Titre principal */}
              <h1 className="display-hero text-white">
                <MultiLineReveal
                  lines={h.hero.titleLines}
                  highlight={1}
                  stagger={0.16}
                  wordStagger={0.065}
                  delay={0.1}
                  lineClassName="block"
                />
              </h1>

              {/* Sous-titre */}
              <FadeReveal
                delay={0.65}
                as="p"
                className="mt-6 max-w-lg text-lg leading-[1.8] text-white/50"
              >
                {h.hero.subtitle}
              </FadeReveal>

              {/* CTAs */}
              <FadeReveal delay={0.8} className="mt-10 flex flex-wrap gap-3">
                <Link href="/contact" className="btn-primary px-7 py-4 text-base">
                  {h.hero.cta1} <ArrowRight size={16} />
                </Link>
                <Link href="/services" className="btn-ghost px-7 py-4 text-base">
                  {h.hero.cta2}
                </Link>
              </FadeReveal>

              {/* Preuve sociale */}
              <FadeReveal
                delay={0.95}
                className="mt-12 flex items-center gap-5 border-t border-white/[0.07] pt-10"
              >
                <div className="flex -space-x-2.5">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      style={{ zIndex: 5 - i }}
                      className="h-9 w-9 rounded-full border-2 border-[#09090b] bg-gradient-to-br from-[#c9a55a] to-[#8c6d3f]"
                    />
                  ))}
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={11} className="fill-[#c9a55a] text-[#c9a55a]" />
                    ))}
                  </div>
                  <p className="text-sm text-white/40">
                    <span className="font-bold text-white/70">{h.hero.socialProof}</span>
                  </p>
                </div>
              </FadeReveal>
            </div>

            {/* Panneau visuel droit — desktop uniquement */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease }}
              className="hidden lg:flex flex-col gap-3 w-64"
            >
              {[
                { icon: Globe,  color: "#c9a55a", label: "Sites web sur mesure" },
                { icon: Zap,    color: "#60a5fa", label: "Automatisation & IA" },
                { icon: Brain,  color: "#a78bfa", label: "Coaching IA" },
                { icon: Users,  color: "#4ade80", label: "Soutien scolaire" },
              ].map(({ icon: Icon, color, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 backdrop-blur-sm"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `${color}1a` }}
                  >
                    <Icon size={16} style={{ color }} />
                  </div>
                  <span className="text-sm font-medium text-white/75">{label}</span>
                  <div className="ml-auto h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                </div>
              ))}
              <div className="mt-2 rounded-2xl border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.06)] px-4 py-4 text-center">
                <p className="text-2xl font-black text-[#c9a55a]">50+</p>
                <p className="mt-0.5 text-xs text-white/40">clients accompagnés</p>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Fondu vers le blanc */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ══════════════════════════════════════════
          2. STATS — CRÉDIBILITÉ
      ══════════════════════════════════════════ */}
      <section className="py-16 border-b border-[var(--border)]">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainerFast}
          className="mx-auto max-w-6xl px-6"
        >
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {h.stats.map(({ value, label, sub }, i) => {
              const Icon  = STAT_ICONS[i];
              const color = STAT_COLORS[i];
              return (
                <motion.div
                  key={label}
                  variants={cardReveal}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_16px_40px_rgba(0,0,0,0.07)]"
                >
                  <div
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `${color}14` }}
                  >
                    <Icon size={18} style={{ color }} />
                  </div>
                  <p className="text-3xl font-black tracking-tight text-[var(--ink)]">{value}</p>
                  <div>
                    <p className="text-sm font-bold leading-snug text-[var(--ink)]">{label}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">{sub}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════
          3. SERVICES PRINCIPAUX
      ══════════════════════════════════════════ */}
      <section className="py-24">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="mx-auto max-w-6xl px-6"
        >
          {/* Header section */}
          <div className="mb-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <motion.span variants={fadeIn} className="badge badge-gold-light">
                <Sparkles size={10} /> {h.servicesSection.badge}
              </motion.span>
              <h2 className="display-section mt-4 text-[var(--ink)]">
                <MultiLineReveal
                  lines={h.servicesSection.titleLines}
                  highlight={1}
                  stagger={0.13}
                  wordStagger={0.06}
                />
              </h2>
              <FadeReveal
                delay={0.2}
                as="p"
                className="mt-3 max-w-md text-base leading-relaxed text-[var(--muted)]"
              >
                {h.servicesSection.subtitle}
              </FadeReveal>
            </div>
            <FadeReveal delay={0.25} className="shrink-0">
              <Link href="/services" className="btn-light text-sm whitespace-nowrap">
                {h.servicesSection.cta} <ArrowRight size={14} />
              </Link>
            </FadeReveal>
          </div>

          {/* 4 cartes services */}
          <motion.div
            variants={staggerContainerFast}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {MAIN_SERVICES.map(({ icon: Icon, color, bg, border, title, excerpt, benefits, href, cta }) => (
              <motion.div key={title} variants={cardReveal}>
                <Link
                  href={href}
                  className="group flex h-full flex-col rounded-[1.5rem] border border-[var(--border)] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-transparent hover:shadow-[0_20px_56px_rgba(0,0,0,0.10)]"
                >
                  {/* Icône */}
                  <div
                    className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border transition-transform duration-300 group-hover:scale-110"
                    style={{ background: bg, borderColor: border }}
                  >
                    <Icon size={22} style={{ color }} />
                  </div>

                  {/* Titre + accroche */}
                  <h3 className="text-base font-extrabold text-[var(--ink)]">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{excerpt}</p>

                  {/* 3 bénéfices */}
                  <ul className="mt-5 flex flex-col gap-2.5">
                    {benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-xs text-[var(--muted)]">
                        <CheckCircle2
                          size={13}
                          className="mt-0.5 shrink-0"
                          style={{ color }}
                        />
                        {b}
                      </li>
                    ))}
                  </ul>

                  {/* Lien CTA */}
                  <div
                    className="mt-6 flex items-center gap-1.5 text-xs font-bold"
                    style={{ color }}
                  >
                    {cta}
                    <ArrowRight
                      size={11}
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════
          4. RÉALISATIONS
      ══════════════════════════════════════════ */}
      <section className="bg-[var(--surface)] py-24">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="mx-auto max-w-6xl px-6"
        >
          <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <motion.span variants={fadeIn} className="badge badge-gold-light">
                <Sparkles size={10} /> {h.realisationsSection.badge}
              </motion.span>
              <h2 className="display-section mt-4 text-[var(--ink)]">
                <MultiLineReveal
                  lines={h.realisationsSection.titleLines}
                  highlight={1}
                  stagger={0.13}
                  wordStagger={0.07}
                />
              </h2>
              <FadeReveal
                delay={0.2}
                as="p"
                className="mt-3 max-w-md text-base leading-relaxed text-[var(--muted)]"
              >
                {h.realisationsSection.subtitle}
              </FadeReveal>
            </div>
            <FadeReveal delay={0.25} className="shrink-0">
              <Link href="/realisations" className="btn-light text-sm whitespace-nowrap">
                {h.realisationsSection.cta} <ArrowRight size={14} />
              </Link>
            </FadeReveal>
          </div>

          <motion.div variants={staggerContainerFast} className="grid gap-6 md:grid-cols-3">
            {h.realisationsSection.projects.map(({ name, category, desc, tag }, i) => (
              <motion.div key={name} variants={cardReveal}>
                <Link
                  href="/realisations"
                  className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_20px_56px_rgba(0,0,0,0.10)]"
                >
                  {/* Aperçu coloré */}
                  <div
                    className="relative h-32 w-full overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${REAL_ACCENTS[i]}1a 0%, ${REAL_ACCENTS[i]}06 100%)`,
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-50 transition-opacity duration-300 group-hover:opacity-80"
                      style={{
                        background: `radial-gradient(ellipse 70% 70% at 25% 35%, ${REAL_ACCENTS[i]}38 0%, transparent 70%)`,
                      }}
                    />
                    {/* Barre accent top */}
                    <div
                      className="absolute top-0 h-1 w-full"
                      style={{ background: `linear-gradient(90deg, ${REAL_ACCENTS[i]}, ${REAL_ACCENTS[i]}55)` }}
                    />
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    {/* Tag */}
                    <span
                      className="mb-4 self-start rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider"
                      style={{
                        background: `${REAL_ACCENTS[i]}14`,
                        color: REAL_ACCENTS[i],
                        border: `1px solid ${REAL_ACCENTS[i]}28`,
                      }}
                    >
                      {tag}
                    </span>

                    <h3 className="text-xl font-black tracking-tight text-[var(--ink)]">{name}</h3>
                    <p className="mt-0.5 text-xs font-semibold text-[var(--muted)]">{category}</p>
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>

                    <div
                      className="mt-5 flex items-center gap-1.5 text-xs font-bold"
                      style={{ color: REAL_ACCENTS[i] }}
                    >
                      Voir le projet
                      <ArrowRight
                        size={11}
                        className="transition-transform duration-200 group-hover:translate-x-0.5"
                      />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════
          5. POURQUOI DJAMA
      ══════════════════════════════════════════ */}
      <section className="py-24">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="mx-auto max-w-6xl px-6"
        >
          <div className="mb-14 text-center">
            <motion.span variants={fadeIn} className="badge badge-gold-light">
              <Sparkles size={10} /> Nos avantages
            </motion.span>
            <h2 className="display-section mt-4 text-[var(--ink)]">
              <MultiLineReveal
                lines={["Pourquoi choisir", "DJAMA ?"]}
                highlight={1}
                stagger={0.13}
                wordStagger={0.07}
                lineClassName="justify-center"
              />
            </h2>
            <FadeReveal
              delay={0.2}
              as="p"
              className="mx-auto mt-3 max-w-md text-base text-[var(--muted)]"
            >
              Une seule équipe, tous vos besoins digitaux couverts.
            </FadeReveal>
          </div>

          <motion.div
            variants={staggerContainerFast}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {WHY_ITEMS.map(({ icon: Icon, color, title, desc }) => (
              <motion.div
                key={title}
                variants={cardReveal}
                className="group flex flex-col rounded-[1.5rem] border border-[var(--border)] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)]"
              >
                <div
                  className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110"
                  style={{ background: `${color}12` }}
                >
                  <Icon size={22} style={{ color }} />
                </div>
                <h3 className="text-sm font-extrabold text-[var(--ink)]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════
          6. CTA FINAL
      ══════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 pb-28 pt-4">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative overflow-hidden rounded-[2rem] border border-[rgba(201,165,90,0.2)] bg-[var(--ink)] px-8 py-24 text-center shadow-premium-lg md:px-16"
        >
          {/* Glows déco */}
          <div className="pointer-events-none absolute left-[12%] top-[-50px] h-[200px] w-[280px] rounded-full bg-[rgba(201,165,90,0.08)] blur-[55px]" />
          <div className="pointer-events-none absolute bottom-[-30px] right-[10%] h-[160px] w-[200px] rounded-full bg-[rgba(96,165,250,0.05)] blur-[50px]" />

          <div className="relative z-10">
            <motion.span variants={fadeIn} className="badge badge-gold-dark">
              <Sparkles size={10} /> {h.cta.label}
            </motion.span>

            <h2 className="display-section mt-6 text-white">
              <MultiLineReveal
                lines={h.cta.titleLines}
                highlight={1}
                stagger={0.15}
                wordStagger={0.08}
                lineClassName="justify-center text-white"
              />
            </h2>

            <FadeReveal
              delay={0.3}
              as="p"
              className="mx-auto mt-6 max-w-xl text-lg leading-[1.8] text-white/45"
            >
              {h.cta.subtitle}
            </FadeReveal>

            <FadeReveal delay={0.45} className="mt-10 flex flex-wrap justify-center gap-3">
              <Link href="/contact" className="btn-primary px-8 py-4 text-base">
                {h.cta.cta1} <ArrowRight size={16} />
              </Link>
              <Link href="/reserver-appel" className="btn-ghost px-8 py-4 text-base">
                {h.cta.cta2}
              </Link>
            </FadeReveal>

            <FadeReveal
              delay={0.55}
              className="mt-9 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-8"
            >
              <a
                href={`mailto:${data.contact.email}`}
                className="flex items-center gap-2 text-sm text-white/35 transition hover:text-white/65"
              >
                <Mail size={13} className="text-[#c9a55a]" />
                {data.contact.email}
              </a>
              <span className="hidden text-white/15 sm:inline">·</span>
              <span className="flex items-center gap-2 text-sm text-white/35">
                <CheckCircle2 size={13} className="text-[#c9a55a]" />
                Sans engagement · Réponse sous 24h
              </span>
              <span className="hidden text-white/15 sm:inline">·</span>
              <span className="flex items-center gap-2 text-sm text-white/35">
                <CheckCircle2 size={13} className="text-[#c9a55a]" />
                Appel découverte gratuit · 30 min
              </span>
            </FadeReveal>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
