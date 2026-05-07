"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Brain, BookOpen, GraduationCap, ArrowRight, CheckCircle2, Users, Clock, Award, Sparkles, Play } from "lucide-react";
import { FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainerFast, cardReveal, viewport } from "@/lib/animations";

const FORMATIONS = [
  {
    href: "/coaching-ia",
    emoji: "🤖",
    color: "#a78bfa",
    rgb: "167,139,250",
    badge: "Phare",
    title: "Coaching IA — Formation Premium",
    tagline: "Maîtrisez tous les outils IA en 6 mois",
    desc: "10 modules · 70 chapitres · ChatGPT, Claude, Gemini, Mistral et tous les outils IA. Programme complet de zéro à expert avec certification.",
    details: ["10 modules · 70 chapitres", "Tous les outils IA couverts", "Jeux & quiz pédagogiques", "Certification DJAMA IA Expert"],
    cta: "Voir la formation",
  },
  {
    href: "/services/coaching-ia",
    emoji: "🎯",
    color: "#f59e0b",
    rgb: "245,158,11",
    badge: "Premium",
    title: "Programme Expert IA — 6 mois",
    tagline: "24 séances avec un expert humain",
    desc: "1 séance individuelle par semaine pendant 6 mois. 24h d'accompagnement personnalisé avec un expert IA certifié DJAMA pour transformer votre business.",
    details: ["24 séances · 24h de coaching", "1 séance / semaine", "Expert humain dédié", "Plan d'action 90 jours"],
    cta: "Voir le programme",
  },
  {
    href: "/soutien-scolaire",
    emoji: "📚",
    color: "#34d399",
    rgb: "52,211,153",
    badge: "",
    title: "Soutien Scolaire",
    tagline: "Accompagnement élèves & étudiants",
    desc: "Aide aux devoirs, préparation aux examens, méthodologie. Cours particuliers adaptés au niveau et aux besoins de chaque élève.",
    details: ["Tous niveaux scolaires", "Cours à domicile ou en ligne", "Suivi personnalisé", "Résultats mesurables"],
    cta: "En savoir plus",
  },
];

export default function FormationsPage() {
  return (
    <main className="overflow-x-hidden bg-white">

      {/* Hero */}
      <section className="hero-dark hero-grid relative overflow-hidden px-4 pb-16 pt-24 sm:pb-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[500px] w-[600px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[rgba(167,139,250,0.08)] blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <FadeReveal delay={0.05}>
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(167,139,250,0.25)] bg-[rgba(167,139,250,0.08)] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#a78bfa]">
              <BookOpen size={13} /> Formations DJAMA
            </div>
          </FadeReveal>
          <FadeReveal delay={0.15}>
            <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-white md:text-6xl">
              Nos <span className="text-[#a78bfa]">formations</span>
            </h1>
          </FadeReveal>
          <FadeReveal delay={0.3}>
            <p className="mx-auto mt-5 max-w-xl text-base text-white/50">
              De l'IA aux cours particuliers — des formations conçues pour progresser rapidement et obtenir des résultats concrets.
            </p>
          </FadeReveal>
          <FadeReveal delay={0.4}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
              {[
                { val: "70",   label: "Chapitres IA" },
                { val: "24",   label: "Séances expert" },
                { val: "6",    label: "Mois de parcours" },
                { val: "100%", label: "En ligne" },
              ].map(({ val, label }) => (
                <div key={label} className="flex flex-col items-center">
                  <span className="text-3xl font-extrabold text-[#a78bfa]">{val}</span>
                  <span className="text-xs uppercase tracking-wider text-white/30">{label}</span>
                </div>
              ))}
            </div>
          </FadeReveal>
        </div>
      </section>

      {/* Formations */}
      <section className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <motion.div variants={staggerContainerFast} initial="hidden" whileInView="visible" viewport={viewport} className="space-y-6">
          {FORMATIONS.map(({ href, emoji, color, rgb, badge, title, tagline, desc, details, cta }) => (
            <motion.div key={href} variants={cardReveal} whileHover={{ y: -4 }}
              className="group relative overflow-hidden rounded-3xl border border-[var(--border)] bg-white p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)]">
              {/* Top bar */}
              <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-3xl" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl" style={{ backgroundColor: `rgba(${rgb},0.12)` }}>
                  {emoji}
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {badge && (
                      <span className="rounded-full px-2.5 py-0.5 text-[0.6rem] font-black uppercase tracking-widest"
                        style={{ color, backgroundColor: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.3)` }}>
                        {badge}
                      </span>
                    )}
                    <span className="text-xs text-[var(--muted)]">{tagline}</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-[var(--ink)]">{title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>
                  <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                    {details.map(d => (
                      <li key={d} className="flex items-center gap-1.5 text-xs text-[var(--ink)]">
                        <CheckCircle2 size={12} style={{ color }} /> {d}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href={href}
                  className="shrink-0 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white transition-all"
                  style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 4px 20px rgba(${rgb},0.3)` }}>
                  {cta} <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="bg-[#0f1117] py-16 text-center">
        <FadeReveal>
          <h2 className="text-2xl font-extrabold text-white md:text-3xl">Pas sûr de quelle formation choisir ?</h2>
          <p className="mt-3 text-sm text-white/40">Réservez un appel gratuit de 30 minutes avec notre équipe.</p>
          <Link href="/reserver-appel" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] px-7 py-3.5 text-sm font-extrabold text-black shadow-[0_4px_24px_rgba(201,165,90,0.35)] transition hover:shadow-[0_8px_36px_rgba(201,165,90,0.5)]">
            Appel conseil gratuit <ArrowRight size={15} />
          </Link>
        </FadeReveal>
      </section>
    </main>
  );
}
