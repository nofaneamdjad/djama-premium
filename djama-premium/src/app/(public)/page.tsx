"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, Mail, Star, Zap, Users, Shield,
  CheckCircle2, Sparkles, StickyNote, Calendar, ReceiptText,
  TrendingUp, FileText, Search, Wrench, HeartHandshake,
  Globe, Brain, Lock, MessageCircle,
} from "lucide-react";
import { getSiteData } from "@/lib/site-data";
import { fadeIn, staggerContainer, staggerContainerFast, cardReveal, viewport } from "@/lib/animations";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { useLanguage } from "@/lib/language-context";

const ease = [0.16, 1, 0.3, 1] as const;

const OVERVIEW_ICONS = [Globe, ReceiptText, HeartHandshake, Brain] as const;
const OVERVIEW_COLORS = [
  { color: "#c9a55a", bg: "rgba(201,165,90,0.10)",  border: "rgba(201,165,90,0.22)"  },
  { color: "#60a5fa", bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.22)"  },
  { color: "#4ade80", bg: "rgba(74,222,128,0.08)",  border: "rgba(74,222,128,0.20)"  },
  { color: "#a78bfa", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.20)" },
] as const;

const VALUE_ICONS = [Shield, Zap, TrendingUp, Users] as const;
const VALUE_COLORS = ["#c9a55a", "#60a5fa", "#4ade80", "#a78bfa"] as const;

const TOOL_ICONS = [ReceiptText, Calendar, StickyNote] as const;
const TOOL_COLORS = ["#4ade80", "#60a5fa", "#c9a55a"] as const;

const APPROACH_ICONS = [Search, Wrench, HeartHandshake] as const;
const APPROACH_COLORS = ["#c9a55a", "#60a5fa", "#4ade80"] as const;

export default function Home() {
  const data = getSiteData();
  const { dict } = useLanguage();
  const h = dict.home;
  const ov = dict.overview;

  return (
    <div className="bg-white">

      {/* ══════════════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════════════ */}
      <section className="hero-dark hero-grid relative overflow-hidden">

        {/* Glows */}
        <div className="pointer-events-none absolute left-[-100px] top-[-80px] h-[700px] w-[700px] rounded-full bg-[rgba(201,165,90,0.07)] blur-[150px]" />
        <div className="pointer-events-none absolute right-[5%] bottom-[5%] h-[400px] w-[400px] rounded-full bg-[rgba(59,130,246,0.05)] blur-[110px]" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-32 pt-40">
          <div className="grid items-center gap-14 lg:grid-cols-[1fr_560px]">

            {/* ── Texte gauche ── */}
            <div>
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

              <h1 className="display-hero text-white">
                <MultiLineReveal
                  lines={h.hero.titleLines}
                  highlight={2}
                  stagger={0.16}
                  wordStagger={0.065}
                  delay={0.1}
                  lineClassName="block"
                />
              </h1>

              <FadeReveal delay={0.65} as="p" className="mt-7 max-w-lg text-lg leading-[1.75] text-white/50">
                {h.hero.subtitle}
              </FadeReveal>

              <FadeReveal delay={0.8} className="mt-10 flex flex-wrap gap-3">
                <Link href="/realisations" className="btn-primary px-7 py-4 text-base">
                  {h.hero.cta1} <ArrowRight size={16} />
                </Link>
                <Link href="/services" className="btn-ghost px-7 py-4 text-base">
                  {h.hero.cta2}
                </Link>
              </FadeReveal>

              {/* Preuve sociale */}
              <FadeReveal delay={0.95} className="mt-12 flex items-center gap-5 border-t border-white/[0.07] pt-10">
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
                  <div className="flex items-center gap-1 mb-1">
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

            {/* ── Panneau DJAMA en un regard ── */}
            <motion.div
              initial={{ opacity: 0, y: 44, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1, delay: 0.35, ease }}
            >
              {/* Carte principale */}
              <div className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-[rgba(255,255,255,0.04)] shadow-[0_32px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl">

                {/* Glow top-right */}
                <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-[rgba(201,165,90,0.12)] blur-[60px]" />

                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                      <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                      <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                    </div>
                  </div>
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-white/30">
                    {ov.title}
                  </p>
                  <span className="badge badge-gold-dark text-[0.55rem] py-0.5 px-2">2025</span>
                </div>

                {/* Colonnes */}
                <div className="grid grid-cols-2 divide-x divide-white/[0.06] sm:grid-cols-4 p-0 [&>*:nth-child(n+3)]:border-t [&>*:nth-child(n+3)]:border-white/[0.06] sm:[&>*:nth-child(n+3)]:border-t-0">
                  {ov.cols.map((col, ci) => {
                    const Icon = OVERVIEW_ICONS[ci];
                    const { color, bg, border } = OVERVIEW_COLORS[ci];
                    return (
                      <motion.div
                        key={col.title}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.55 + ci * 0.1, ease }}
                        className="group flex flex-col gap-3 p-3.5 transition-colors duration-300 hover:bg-white/[0.03]"
                      >
                        {/* Icône + titre catégorie */}
                        <div className="flex flex-col gap-2">
                          <div
                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border"
                            style={{ background: bg, borderColor: border }}
                          >
                            <Icon size={14} style={{ color }} />
                          </div>
                          <div>
                            <p className="text-[0.67rem] font-extrabold uppercase tracking-widest" style={{ color }}>
                              {col.title}
                            </p>
                            <span
                              className="mt-1 inline-block rounded-full px-1.5 py-0.5 text-[0.5rem] font-bold uppercase tracking-wider"
                              style={{ background: bg, color, border: `1px solid ${border}` }}
                            >
                              {col.badge}
                            </span>
                          </div>
                        </div>

                        {/* Séparateur */}
                        <div className="h-px w-full rounded-full" style={{ background: border }} />

                        {/* Items */}
                        <ul className="flex flex-col gap-2">
                          {col.items.map(({ label, badge: itemBadge }) => (
                            <li key={label} className="flex flex-col gap-0.5">
                              <span className="flex items-start gap-1.5 text-[0.65rem] leading-snug text-white/55">
                                <span
                                  className="mt-1 h-1 w-1 shrink-0 rounded-full"
                                  style={{ background: color }}
                                />
                                {label}
                              </span>
                              {itemBadge && (
                                <span
                                  className="ml-2.5 self-start rounded-full px-1.5 py-0.5 text-[0.48rem] font-bold uppercase tracking-wider"
                                  style={{ background: `${color}18`, color, border: `1px solid ${color}28` }}
                                >
                                  {itemBadge}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="border-t border-white/[0.07] bg-white/[0.02] px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Lock size={11} className="text-[#c9a55a]" />
                    <p className="text-[0.6rem] text-white/35">Espace client sécurisé · {data.offers.abonnement}</p>
                  </div>
                  <Link
                    href="/abonnement"
                    className="flex items-center gap-1 rounded-xl bg-[#c9a55a] px-3 py-1.5 text-[0.65rem] font-bold text-[#09090b] transition hover:brightness-110"
                  >
                    Commencer <ArrowRight size={10} />
                  </Link>
                </div>
              </div>
            </motion.div>

          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ══════════════════════════════════════════════════
          2. CRÉDIBILITÉ
      ══════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainerFast}
          className="grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          {h.stats.map(({ value, label, sub }, i) => {
            const Icon = [Users, TrendingUp, Zap, HeartHandshake][i];
            return (
              <motion.div
                key={label}
                variants={cardReveal}
                className="group overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(201,165,90,0.3)] hover:shadow-[0_12px_40px_rgba(201,165,90,0.09)]"
              >
                <div className="mb-3 inline-flex rounded-xl bg-[rgba(201,165,90,0.08)] p-3">
                  <Icon size={20} className="text-[#c9a55a]" />
                </div>
                <p className="text-3xl font-black tracking-tight text-[var(--ink)]">{value}</p>
                <p className="mt-1.5 text-sm font-bold leading-snug text-[var(--ink)]">{label}</p>
                <p className="mt-0.5 text-xs text-[var(--muted)]">{sub}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════
          3. PRÉSENTATION DJAMA
      ══════════════════════════════════════════════════ */}
      <section className="bg-[var(--surface)] py-28">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="mx-auto max-w-6xl px-6"
        >
          <div className="grid items-center gap-16 lg:grid-cols-2">

            {/* Texte */}
            <div>
              <motion.span variants={fadeIn} className="badge badge-gold-light">
                <Sparkles size={10} /> {h.presentation.badge}
              </motion.span>
              <h2 className="display-section mt-4 text-[var(--ink)]">
                <MultiLineReveal
                  lines={h.presentation.titleLines}
                  highlight={1}
                  stagger={0.14}
                  wordStagger={0.065}
                />
              </h2>
              <FadeReveal delay={0.2} as="p" className="mt-5 text-base leading-[1.8] text-[var(--muted)]">
                {h.presentation.text1}
              </FadeReveal>
              <FadeReveal delay={0.3} as="p" className="mt-4 text-base leading-[1.8] text-[var(--muted)]">
                {h.presentation.text2}
              </FadeReveal>
              <FadeReveal delay={0.45} className="mt-8 flex flex-wrap gap-3">
                <Link href="/services" className="btn-primary text-sm">
                  {h.presentation.cta1} <ArrowRight size={14} />
                </Link>
                <Link href="/contact" className="btn-ghost text-sm">
                  {h.presentation.cta2}
                </Link>
              </FadeReveal>
            </div>

            {/* 4 mini-cartes valeurs */}
            <motion.div variants={staggerContainerFast} className="grid gap-4 sm:grid-cols-2">
              {h.presentation.values.map(({ title, desc }, i) => {
                const Icon = VALUE_ICONS[i];
                const color = VALUE_COLORS[i];
                return (
                  <motion.div
                    key={title}
                    variants={cardReveal}
                    className="rounded-[1.25rem] border border-[var(--border)] bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="mb-3 inline-flex rounded-xl p-2.5" style={{ background: `${color}12` }}>
                      <Icon size={18} style={{ color }} />
                    </div>
                    <h3 className="text-sm font-extrabold text-[var(--ink)]">{title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">{desc}</p>
                  </motion.div>
                );
              })}
            </motion.div>

          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════
          4. ASSISTANT DJAMA
      ══════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-28">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
        >
          <div className="grid items-center gap-16 lg:grid-cols-[1fr_420px]">

            {/* Texte */}
            <div>
              <motion.span variants={fadeIn} className="badge badge-gold-light">
                <Sparkles size={10} /> {h.assistant.badge}
              </motion.span>
              <h2 className="display-section mt-4 text-[var(--ink)]">
                <MultiLineReveal
                  lines={h.assistant.titleLines}
                  highlight={1}
                  stagger={0.13}
                  wordStagger={0.06}
                />
              </h2>
              <FadeReveal delay={0.25} as="p" className="mt-5 text-base leading-[1.8] text-[var(--muted)]">
                {h.assistant.subtitle}
              </FadeReveal>

              {/* Questions exemples */}
              <FadeReveal delay={0.35} className="mt-8 flex flex-wrap gap-2.5">
                {h.assistant.questions.map((q) => (
                  <span
                    key={q}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-medium text-[var(--muted)] transition hover:border-[rgba(201,165,90,0.35)] hover:text-[var(--ink)]"
                  >
                    <MessageCircle size={10} className="text-[#c9a55a]" />
                    {q}
                  </span>
                ))}
              </FadeReveal>

              <FadeReveal delay={0.5} className="mt-8">
                <button
                  onClick={() => {
                    const btn = document.querySelector<HTMLButtonElement>("[aria-label=\"Ouvrir l'assistant DJAMA\"]");
                    btn?.click();
                  }}
                  className="btn-primary text-sm"
                >
                  <MessageCircle size={15} />
                  {h.assistant.cta}
                </button>
              </FadeReveal>
            </div>

            {/* Card visuelle assistant */}
            <motion.div variants={cardReveal}>
              <div className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(201,165,90,0.18)] bg-[var(--ink)] p-0 shadow-[0_24px_64px_rgba(0,0,0,0.2)]">

                <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-[rgba(201,165,90,0.08)] blur-[70px]" />

                {/* Header fausse fenêtre */}
                <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4">
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#c9a55a] to-[#8c6d3f]">
                    <Sparkles size={13} className="text-[#09090b]" />
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#09090b] bg-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Assistant DJAMA</p>
                    <p className="text-[0.6rem] text-white/30">En ligne · Répond instantanément</p>
                  </div>
                </div>

                {/* Faux messages */}
                <div className="space-y-3 p-5">
                  <div className="flex gap-2.5">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#c9a55a] to-[#8c6d3f]">
                      <Sparkles size={10} className="text-[#09090b]" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-white/[0.06] px-4 py-2.5 text-sm leading-relaxed text-white/75">
                      Bonjour 👋 Je suis l&apos;assistant DJAMA.<br />
                      Je peux répondre à vos questions sur nos services.
                    </div>
                  </div>

                  <div className="flex flex-row-reverse gap-2.5">
                    <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-[#c9a55a] px-4 py-2.5 text-sm font-medium text-[#09090b]">
                      {h.assistant.questions[0]}
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#c9a55a] to-[#8c6d3f]">
                      <Sparkles size={10} className="text-[#09090b]" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-white/[0.06] px-4 py-2.5 text-sm leading-relaxed text-white/75">
                      DJAMA propose 4 pôles : création digitale, outils pro, accompagnement administratif et coaching. Quel aspect vous intéresse ?
                    </div>
                  </div>
                </div>

                {/* Fausse zone input */}
                <div className="border-t border-white/[0.07] bg-white/[0.02] px-5 py-3.5 flex items-center gap-2">
                  <div className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2 text-xs text-white/20">
                    Posez votre question…
                  </div>
                  <button
                    onClick={() => {
                      const btn = document.querySelector<HTMLButtonElement>("[aria-label=\"Ouvrir l'assistant DJAMA\"]");
                      btn?.click();
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#c9a55a] to-[#b08d57] text-[#09090b] transition hover:brightness-110"
                  >
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </motion.div>

          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════
          5. OUTILS DJAMA
      ══════════════════════════════════════════════════ */}
      <section className="hero-dark relative overflow-hidden py-28">
        <div className="pointer-events-none absolute left-[20%] top-0 h-[500px] w-[600px] rounded-full bg-[rgba(201,165,90,0.06)] blur-[130px]" />
        <div className="pointer-events-none absolute right-[5%] bottom-0 h-[350px] w-[350px] rounded-full bg-[rgba(96,165,250,0.05)] blur-[100px]" />

        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative z-10 mx-auto max-w-6xl px-6"
        >
          <div className="grid items-center gap-16 lg:grid-cols-2">

            <div>
              <motion.span variants={fadeIn} className="badge badge-gold-dark">
                <Wrench size={10} /> {h.tools.badge}
              </motion.span>
              <h2 className="display-section mt-4 text-white">
                <MultiLineReveal
                  lines={h.tools.titleLines}
                  highlight={0}
                  stagger={0.14}
                  wordStagger={0.06}
                  lineClassName="text-white"
                />
              </h2>
              <FadeReveal delay={0.25} as="p" className="mt-5 text-base leading-[1.8] text-white/45">
                {h.tools.subtitle}
              </FadeReveal>
              <FadeReveal delay={0.4} className="mt-8 flex flex-wrap gap-3">
                <Link href="/abonnement" className="btn-primary text-sm">
                  {h.tools.cta} — {data.offers.abonnement} <ArrowRight size={14} />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-white/15 px-5 py-3 text-sm font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white"
                >
                  Déjà client ? Se connecter
                </Link>
              </FadeReveal>
            </div>

            <motion.div variants={staggerContainerFast} className="flex flex-col gap-3">
              {h.tools.items.map(({ label, sub }, i) => {
                const Icon = TOOL_ICONS[i];
                const color = TOOL_COLORS[i];
                return (
                  <motion.div
                    key={label}
                    variants={cardReveal}
                    className="flex items-start gap-4 rounded-[1.25rem] border border-white/[0.07] bg-white/[0.04] p-5 transition-all duration-300 hover:bg-white/[0.07]"
                    style={{ transitionDelay: `${i * 0.05}s` }}
                  >
                    <div
                      className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08]"
                      style={{ background: `${color}18` }}
                    >
                      <Icon size={16} style={{ color }} />
                    </div>
                    <div>
                      <p className="font-bold text-white/90">{label}</p>
                      <p className="mt-1 text-sm leading-relaxed text-white/40">{sub}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════
          6. APPROCHE
      ══════════════════════════════════════════════════ */}
      <section className="bg-[var(--surface)] py-28">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="mx-auto max-w-6xl px-6"
        >
          <div className="mb-16 text-center">
            <motion.span variants={fadeIn} className="badge badge-gold-light">
              <Sparkles size={10} /> {h.approach.badge}
            </motion.span>
            <h2 className="display-section mt-4 text-[var(--ink)]">
              <MultiLineReveal
                lines={h.approach.titleLines}
                highlight={1}
                stagger={0.14}
                wordStagger={0.07}
                lineClassName="justify-center"
              />
            </h2>
          </div>

          <motion.div variants={staggerContainerFast} className="grid gap-5 md:grid-cols-3">
            {h.approach.steps.map(({ title, desc }, i) => {
              const Icon = APPROACH_ICONS[i];
              const color = APPROACH_COLORS[i];
              const step = String(i + 1).padStart(2, "0");
              return (
                <motion.div
                  key={step}
                  variants={cardReveal}
                  className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_20px_56px_rgba(0,0,0,0.09)]"
                >
                  <div
                    className="absolute right-5 top-4 select-none text-6xl font-black leading-none opacity-[0.05]"
                    style={{ color }}
                  >
                    {step}
                  </div>
                  <div
                    className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110"
                    style={{ background: `${color}12` }}
                  >
                    <Icon size={22} style={{ color }} />
                  </div>
                  <h3 className="text-base font-extrabold text-[var(--ink)]">{title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>
                  <div
                    className="mt-5 h-0.5 w-8 rounded-full transition-all duration-300 group-hover:w-14"
                    style={{ background: color }}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════
          7. CTA FINAL
      ══════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-28">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport}
          variants={staggerContainer}
          className="relative overflow-hidden rounded-[2rem] border border-[rgba(201,165,90,0.2)] bg-[var(--ink)] px-8 py-20 text-center shadow-premium-lg md:px-16"
        >
          <div className="pointer-events-none absolute left-[12%] top-[-50px] h-[350px] w-[450px] rounded-full bg-[rgba(201,165,90,0.08)] blur-[100px]" />
          <div className="pointer-events-none absolute bottom-[-40px] right-[8%] h-[280px] w-[350px] rounded-full bg-[rgba(96,165,250,0.05)] blur-[90px]" />

          <div className="relative z-10">
            <motion.span variants={fadeIn} className="badge badge-gold-dark">
              <Sparkles size={10} /> {h.cta.label}
            </motion.span>

            <h2 className="display-section mt-6 text-white">
              <MultiLineReveal
                lines={["Parlons de", "votre projet."]}
                highlight={1}
                stagger={0.15}
                wordStagger={0.08}
                lineClassName="justify-center text-white"
              />
            </h2>

            <FadeReveal delay={0.3} as="p" className="mx-auto mt-6 max-w-xl text-lg leading-[1.8] text-white/45">
              {h.cta.subtitle}
            </FadeReveal>

            <FadeReveal delay={0.45} className="mt-10 flex flex-wrap justify-center gap-3">
              <Link href="/contact" className="btn-primary px-8 py-4 text-base">
                {h.cta.cta1} <ArrowRight size={16} />
              </Link>
              <Link href="/services" className="btn-ghost px-8 py-4 text-base">
                {h.cta.cta2}
              </Link>
            </FadeReveal>

            <FadeReveal delay={0.55} className="mt-9 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-8">
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
                <FileText size={13} className="text-[#c9a55a]" />
                Devis gratuit &amp; détaillé
              </span>
            </FadeReveal>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
