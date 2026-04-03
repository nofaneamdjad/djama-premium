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

/* ── Services ─────────────────────────────────────────────── */
const MAIN_SERVICES = [
  {
    icon: Globe,
    color: "#c9a55a",
    bg: "rgba(201,165,90,0.10)",
    border: "rgba(201,165,90,0.20)",
    title: "Création de sites web",
    excerpt: "Sites vitrine, e-commerce et applications sur mesure.",
    href: "/services",
    cta: "Voir les offres",
  },
  {
    icon: Zap,
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.10)",
    border: "rgba(96,165,250,0.20)",
    title: "Automatisation & IA",
    excerpt: "Automatisez vos tâches répétitives avec des outils intelligents.",
    href: "/services",
    cta: "Voir les offres",
  },
  {
    icon: Brain,
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    border: "rgba(167,139,250,0.18)",
    title: "Coaching IA",
    excerpt: "Maîtrisez l'IA en 5 modules intensifs avec un assistant personnel.",
    href: "/services/coaching-ia",
    cta: "Découvrir",
  },
  {
    icon: Users,
    color: "#4ade80",
    bg: "rgba(74,222,128,0.08)",
    border: "rgba(74,222,128,0.18)",
    title: "Soutien scolaire",
    excerpt: "Accompagnement personnalisé, toutes matières, dès 14€/h.",
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
    desc: "Livraison accélérée par l'IA sans compromis sur la qualité.",
  },
  {
    icon: Shield,
    color: "#60a5fa",
    title: "Qualité premium",
    desc: "Chaque détail est soigné. L'image que vous projetez le mérite.",
  },
  {
    icon: HeartHandshake,
    color: "#4ade80",
    title: "Accompagnement humain",
    desc: "Une relation directe avec l'équipe, pas un ticket anonyme.",
  },
  {
    icon: Brain,
    color: "#a78bfa",
    title: "Vision IA & business",
    desc: "Nous créons des solutions qui produisent de vrais résultats.",
  },
] as const;

/* ── Constantes ──────────────────────────────────────────────── */
const REAL_ACCENTS = ["#c9a55a", "#60a5fa", "#a78bfa"] as const;
const STAT_ICONS   = [Users, TrendingUp, Zap, HeartHandshake] as const;
const STAT_COLORS  = ["#c9a55a", "#60a5fa", "#4ade80", "#a78bfa"] as const;

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */
export default function Home() {
  const data = getSiteData();
  const { dict } = useLanguage();
  const h = dict.home;

  return (
    <div className="bg-white">

      {/* ══════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════ */}
      <section className="hero-dark hero-grid relative overflow-hidden">

        {/* Glows ambiants */}
        <div className="pointer-events-none absolute -left-24 top-0 h-96 w-96 rounded-full bg-[rgba(201,165,90,0.06)] blur-[110px]" />
        <div className="pointer-events-none absolute right-0 top-1/3 h-72 w-72 rounded-full bg-[rgba(167,139,250,0.05)] blur-[90px]" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-44 pt-52">
          <div className="flex items-start justify-between gap-16">

            {/* ── Texte gauche ── */}
            <div className="max-w-2xl">

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease }}
                className="mb-7"
              >
                <span className="badge badge-gold-dark">
                  <Sparkles size={10} /> {h.hero.badge}
                </span>
              </motion.div>

              <h1 className="display-hero text-white">
                <MultiLineReveal
                  lines={h.hero.titleLines}
                  highlight={1}
                  stagger={0.15}
                  wordStagger={0.06}
                  delay={0.08}
                  lineClassName="block"
                />
              </h1>

              <FadeReveal
                delay={0.6}
                as="p"
                className="mt-6 max-w-lg text-[1.05rem] leading-[1.85] text-white/50"
              >
                {h.hero.subtitle}
              </FadeReveal>

              <FadeReveal delay={0.75} className="mt-9 flex flex-wrap gap-3">
                <Link href="/contact" className="btn-primary px-7 py-[0.9rem] text-[0.95rem]">
                  {h.hero.cta1} <ArrowRight size={15} />
                </Link>
                <Link href="/services" className="btn-ghost px-7 py-[0.9rem] text-[0.95rem]">
                  {h.hero.cta2}
                </Link>
              </FadeReveal>

              <FadeReveal
                delay={0.9}
                className="mt-11 flex items-center gap-5 border-t border-white/[0.07] pt-9"
              >
                <div className="flex -space-x-2.5">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      style={{ zIndex: 5 - i }}
                      className="h-8 w-8 rounded-full border-2 border-[#09090b] bg-gradient-to-br from-[#c9a55a] to-[#8c6d3f]"
                    />
                  ))}
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={10} className="fill-[#c9a55a] text-[#c9a55a]" />
                    ))}
                  </div>
                  <p className="text-sm text-white/40">
                    <span className="font-semibold text-white/65">{h.hero.socialProof}</span>
                  </p>
                </div>
              </FadeReveal>
            </div>

            {/* ── Panneau droit — desktop uniquement ── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.75, delay: 0.45, ease }}
              className="hidden shrink-0 flex-col gap-2.5 lg:flex"
              style={{ width: "240px" }}
            >
              {[
                { icon: Globe,  color: "#c9a55a", label: "Sites web sur mesure" },
                { icon: Zap,    color: "#60a5fa", label: "Automatisation & IA" },
                { icon: Brain,  color: "#a78bfa", label: "Coaching IA" },
                { icon: Users,  color: "#4ade80", label: "Soutien scolaire" },
              ].map(({ icon: Icon, color, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5"
                >
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${color}18` }}
                  >
                    <Icon size={14} style={{ color }} />
                  </div>
                  <span className="text-[0.82rem] font-medium text-white/70">{label}</span>
                  <div className="ml-auto h-1.5 w-1.5 rounded-full opacity-60" style={{ background: color }} />
                </div>
              ))}

              <div className="mt-3 rounded-xl border border-[rgba(201,165,90,0.18)] bg-[rgba(201,165,90,0.05)] p-5 text-center">
                <p className="text-3xl font-black tracking-tight text-[#c9a55a]">50+</p>
                <p className="mt-1 text-xs text-white/40">clients accompagnés depuis 2022</p>
                <div className="mt-3 flex justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={9} className="fill-[#c9a55a] text-[#c9a55a]" />
                  ))}
                </div>
              </div>
            </motion.div>

          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ══════════════════════════════════════════
          2. STATS — CRÉDIBILITÉ
      ══════════════════════════════════════════ */}
      <section className="border-b border-[var(--border)] py-14">
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
                  className="group flex flex-col items-center gap-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_12px_36px_rgba(0,0,0,0.07)]"
                >
                  <div
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `${color}14` }}
                  >
                    <Icon size={16} style={{ color }} />
                  </div>
                  <p className="text-[2rem] font-black leading-none tracking-tight text-[var(--ink)]">{value}</p>
                  <div>
                    <p className="text-[0.8rem] font-bold leading-snug text-[var(--ink)]">{label}</p>
                    <p className="mt-0.5 text-[0.72rem] text-[var(--muted)]">{sub}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════
          3. SERVICES — PRÉSENTATION SYNTHÉTIQUE
      ══════════════════════════════════════════ */}
      <section className="py-24">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="mx-auto max-w-6xl px-6"
        >
          <div className="mb-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <motion.span variants={fadeIn} className="badge badge-gold-light">
                <Sparkles size={10} /> {h.servicesSection.badge}
              </motion.span>
              <h2 className="display-section mt-4 text-[var(--ink)]">
                <MultiLineReveal
                  lines={h.servicesSection.titleLines}
                  highlight={1}
                  stagger={0.12}
                  wordStagger={0.055}
                />
              </h2>
              <FadeReveal
                delay={0.18}
                as="p"
                className="mt-3 max-w-md text-base leading-relaxed text-[var(--muted)]"
              >
                {h.servicesSection.subtitle}
              </FadeReveal>
            </div>
            <FadeReveal delay={0.22} className="shrink-0">
              <Link href="/services" className="btn-light whitespace-nowrap text-sm">
                {h.servicesSection.cta} <ArrowRight size={14} />
              </Link>
            </FadeReveal>
          </div>

          <motion.div
            variants={staggerContainerFast}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {MAIN_SERVICES.map(({ icon: Icon, color, bg, border, title, excerpt, href, cta }) => (
              <motion.div key={title} variants={cardReveal}>
                <Link
                  href={href}
                  className="group flex h-full flex-col rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-transparent hover:shadow-[0_18px_50px_rgba(0,0,0,0.09)]"
                >
                  <div
                    className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-110"
                    style={{ background: bg, borderColor: border }}
                  >
                    <Icon size={20} style={{ color }} />
                  </div>

                  <h3 className="text-[0.9rem] font-extrabold text-[var(--ink)]">{title}</h3>
                  <p className="mt-1.5 flex-1 text-[0.82rem] leading-relaxed text-[var(--muted)]">{excerpt}</p>

                  <div
                    className="mt-5 flex items-center gap-1.5 text-xs font-bold"
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
          <div className="mb-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <motion.span variants={fadeIn} className="badge badge-gold-light">
                <Sparkles size={10} /> {h.realisationsSection.badge}
              </motion.span>
              <h2 className="display-section mt-4 text-[var(--ink)]">
                <MultiLineReveal
                  lines={h.realisationsSection.titleLines}
                  highlight={1}
                  stagger={0.12}
                  wordStagger={0.06}
                />
              </h2>
              <FadeReveal
                delay={0.18}
                as="p"
                className="mt-3 max-w-md text-base leading-relaxed text-[var(--muted)]"
              >
                {h.realisationsSection.subtitle}
              </FadeReveal>
            </div>
            <FadeReveal delay={0.22} className="shrink-0">
              <Link href="/realisations" className="btn-light whitespace-nowrap text-sm">
                {h.realisationsSection.cta} <ArrowRight size={14} />
              </Link>
            </FadeReveal>
          </div>

          <motion.div variants={staggerContainerFast} className="grid gap-5 md:grid-cols-3">
            {h.realisationsSection.projects.map(({ name, category, desc, tag }, i) => (
              <motion.div key={name} variants={cardReveal}>
                <Link
                  href="/realisations"
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_18px_50px_rgba(0,0,0,0.09)]"
                >
                  {/* Aperçu */}
                  <div
                    className="relative h-36 w-full overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${REAL_ACCENTS[i]}18 0%, ${REAL_ACCENTS[i]}05 100%)` }}
                  >
                    <div
                      className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-100 opacity-60"
                      style={{ background: `radial-gradient(ellipse 65% 65% at 20% 30%, ${REAL_ACCENTS[i]}30 0%, transparent 70%)` }}
                    />
                    <div
                      className="absolute inset-x-0 top-0 h-[3px]"
                      style={{ background: `linear-gradient(90deg, ${REAL_ACCENTS[i]}, ${REAL_ACCENTS[i]}44)` }}
                    />
                    {/* Nom flottant */}
                    <div className="absolute bottom-4 left-5">
                      <p className="text-2xl font-black tracking-tight text-[var(--ink)] opacity-[0.06]">{name}</p>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <span
                      className="mb-3 self-start rounded-full px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider"
                      style={{ background: `${REAL_ACCENTS[i]}12`, color: REAL_ACCENTS[i], border: `1px solid ${REAL_ACCENTS[i]}22` }}
                    >
                      {tag}
                    </span>

                    <h3 className="text-lg font-black tracking-tight text-[var(--ink)]">{name}</h3>
                    <p className="mt-0.5 text-xs font-semibold text-[var(--muted)]">{category}</p>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>

                    <div
                      className="mt-4 flex items-center gap-1.5 text-xs font-bold"
                      style={{ color: REAL_ACCENTS[i] }}
                    >
                      Voir le projet
                      <ArrowRight size={11} className="transition-transform duration-200 group-hover:translate-x-0.5" />
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
          <div className="mb-12 text-center">
            <motion.span variants={fadeIn} className="badge badge-gold-light">
              <Sparkles size={10} /> Nos avantages
            </motion.span>
            <h2 className="display-section mt-4 text-[var(--ink)]">
              <MultiLineReveal
                lines={["Pourquoi choisir", "DJAMA ?"]}
                highlight={1}
                stagger={0.12}
                wordStagger={0.065}
                lineClassName="justify-center"
              />
            </h2>
            <FadeReveal
              delay={0.18}
              as="p"
              className="mx-auto mt-3 max-w-sm text-base text-[var(--muted)]"
            >
              Une seule équipe, tous vos besoins digitaux couverts.
            </FadeReveal>
          </div>

          <motion.div
            variants={staggerContainerFast}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {WHY_ITEMS.map(({ icon: Icon, color, title, desc }) => (
              <motion.div
                key={title}
                variants={cardReveal}
                className="group flex flex-col rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_14px_44px_rgba(0,0,0,0.07)]"
              >
                <div
                  className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${color}12` }}
                >
                  <Icon size={20} style={{ color }} />
                </div>
                <h3 className="text-[0.88rem] font-extrabold text-[var(--ink)]">{title}</h3>
                <p className="mt-2 text-[0.82rem] leading-relaxed text-[var(--muted)]">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════
          6. CTA FINAL
      ══════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 pb-28 pt-2">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative overflow-hidden rounded-[2rem] border border-[rgba(201,165,90,0.18)] bg-[var(--ink)] px-8 py-24 text-center md:px-20"
        >
          {/* Glows */}
          <div className="pointer-events-none absolute left-[10%] top-[-60px] h-[220px] w-[300px] rounded-full bg-[rgba(201,165,90,0.07)] blur-[60px]" />
          <div className="pointer-events-none absolute bottom-[-40px] right-[8%] h-[180px] w-[220px] rounded-full bg-[rgba(96,165,250,0.05)] blur-[55px]" />

          <div className="relative z-10">
            <motion.span variants={fadeIn} className="badge badge-gold-dark">
              <Sparkles size={10} /> {h.cta.label}
            </motion.span>

            <h2 className="display-section mt-6 text-white">
              <MultiLineReveal
                lines={h.cta.titleLines}
                highlight={1}
                stagger={0.14}
                wordStagger={0.07}
                lineClassName="justify-center text-white"
              />
            </h2>

            <FadeReveal
              delay={0.28}
              as="p"
              className="mx-auto mt-5 max-w-lg text-[1.05rem] leading-[1.8] text-white/40"
            >
              {h.cta.subtitle}
            </FadeReveal>

            <FadeReveal delay={0.42} className="mt-10 flex flex-wrap justify-center gap-3">
              <Link href="/contact" className="btn-primary px-8 py-[0.95rem] text-[0.95rem]">
                {h.cta.cta1} <ArrowRight size={15} />
              </Link>
              <Link href="/reserver-appel" className="btn-ghost px-8 py-[0.95rem] text-[0.95rem]">
                {h.cta.cta2}
              </Link>
            </FadeReveal>

            <FadeReveal
              delay={0.55}
              className="mt-8 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-7"
            >
              <a
                href={`mailto:${data.contact.email}`}
                className="flex items-center gap-2 text-sm text-white/30 transition-colors duration-200 hover:text-white/60"
              >
                <Mail size={12} className="text-[#c9a55a]" />
                {data.contact.email}
              </a>
              <span className="hidden text-white/12 sm:inline">·</span>
              <span className="flex items-center gap-2 text-sm text-white/30">
                <CheckCircle2 size={12} className="text-[#c9a55a]" />
                Sans engagement · Réponse sous 24h
              </span>
              <span className="hidden text-white/12 sm:inline">·</span>
              <span className="flex items-center gap-2 text-sm text-white/30">
                <CheckCircle2 size={12} className="text-[#c9a55a]" />
                Appel découverte gratuit · 30 min
              </span>
            </FadeReveal>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
