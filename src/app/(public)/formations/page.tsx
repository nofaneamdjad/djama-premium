"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Brain, BookOpen, CheckCircle2,
  Sparkles, Zap, Clock, Target, Users, Award,
  ChevronDown, GraduationCap, BarChart3, Bot, Rocket, Shield,
} from "lucide-react";
import { COACHING_MODULES } from "@/lib/coaching-content";

const ease = [0.16, 1, 0.3, 1] as const;
const vp   = { once: true, margin: "-40px" } as const;

const OUTCOMES_IA = [
  { icon: Zap,       color: "#a78bfa", label: "Générer emails, devis et contrats en 30 secondes" },
  { icon: Clock,     color: "#60a5fa", label: "Gagner 5 à 15h de travail par semaine" },
  { icon: Target,    color: "#f9a826", label: "Prospecter et trouver des clients avec l'IA" },
  { icon: BarChart3, color: "#f472b6", label: "Analyser vos données business en secondes" },
  { icon: Bot,       color: "#34d399", label: "Déléguer vos tâches répétitives à des agents IA" },
  { icon: Rocket,    color: "#4ade80", label: "Créer du contenu marketing 10× plus vite" },
];

const MATIERES = [
  { emoji: "📐", label: "Mathématiques",   color: "#60a5fa" },
  { emoji: "🔬", label: "Physique-Chimie", color: "#a78bfa" },
  { emoji: "📖", label: "Français",         color: "#c9a55a" },
  { emoji: "🌍", label: "Anglais",          color: "#4ade80" },
  { emoji: "🗺️", label: "Histoire-Géo",    color: "#fb923c" },
  { emoji: "🌱", label: "SVT",              color: "#34d399" },
  { emoji: "💻", label: "Informatique",     color: "#7c6fcd" },
  { emoji: "🧠", label: "Philosophie",      color: "#f472b6" },
];

export default function FormationsPage() {
  const [openMod, setOpenMod] = useState<string | null>("1");

  return (
    <div className="w-full overflow-x-hidden bg-[#09090b]">

      {/* ════════════════════════════════════════════════════
          §1 · HERO
      ════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pb-24 pt-20 sm:pb-32 sm:pt-36">
        <div className="hero-grid absolute inset-0 opacity-20" />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-[rgba(167,139,250,0.10)] blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-[rgba(167,139,250,0.3)] bg-[rgba(167,139,250,0.08)] px-5 py-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#a78bfa]"
          >
            <BookOpen size={11} /> Formations DJAMA
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.1 }}
            className="display-hero text-white"
          >
            Formez-vous à{" "}
            <span className="text-[#a78bfa]">l&apos;IA</span> et{" "}
            <span className="text-[#c9a55a]">progressez</span> vite.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease, delay: 0.3 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg"
          >
            De la maîtrise complète des outils IA au soutien scolaire personnalisé.
            Des programmes concrets pour des résultats mesurables.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 border-t border-white/[0.07] pt-8"
          >
            {[
              { val: "70",   label: "Chapitres IA" },
              { val: "24",   label: "Séances expert" },
              { val: "6",    label: "Mois de parcours" },
              { val: "8",    label: "Matières scolaires" },
            ].map(({ val, label }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className="text-3xl font-black text-[#a78bfa] sm:text-4xl">{val}</span>
                <span className="text-[0.62rem] font-bold uppercase tracking-widest text-white/30">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          §2 · COACHING IA — fond blanc
      ════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-white py-16 sm:py-24">
        <div className="dot-grid-light pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">

          {/* Header section */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={vp}
            transition={{ duration: 0.5 }}
            className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="max-w-xl">
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(167,139,250,0.3)] bg-[rgba(167,139,250,0.07)] px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#7c3aed]">
                <Brain size={9} /> Formation en ligne · Paiement unique
              </span>
              <h2 className="display-section text-[#09090b]">
                Coaching IA{" "}
                <span className="text-[#a78bfa]">Formation Premium</span>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#6b7280]">
                10 modules · 70 chapitres. ChatGPT, Claude, Gemini, Mistral et tous les outils IA.
                Programme complet de zéro à expert avec certification DJAMA.
              </p>
            </div>

            <div className="shrink-0 rounded-3xl border border-[rgba(167,139,250,0.2)] bg-[rgba(167,139,250,0.04)] p-6 text-center shadow-sm">
              <span className="block text-[2.6rem] font-black leading-none tracking-tight text-[#09090b]">190€</span>
              <span className="mt-1 block text-xs font-semibold text-[#6b7280]">Paiement unique</span>
              <Link
                href="/services/coaching-ia"
                className="mt-4 flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-extrabold text-white transition-all hover:brightness-110 active:scale-95"
                style={{
                  background:  "linear-gradient(135deg,#a78bfa,#7c6fcd)",
                  boxShadow:   "0 4px 20px rgba(167,139,250,0.35)",
                }}
              >
                Voir la formation <ArrowRight size={14} />
              </Link>
              <p className="mt-2.5 text-[0.62rem] text-[#9ca3af]">Garanti 7 jours · Accès immédiat</p>
            </div>
          </motion.div>

          {/* Ce que vous saurez faire */}
          <div className="mb-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {OUTCOMES_IA.map(({ icon: Icon, color, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={vp}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="group flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                  style={{ background: `${color}15`, boxShadow: `0 0 0 1px ${color}22` }}
                >
                  <Icon size={17} style={{ color }} />
                </div>
                <p className="text-[0.82rem] font-semibold leading-snug text-[#09090b]">{label}</p>
              </motion.div>
            ))}
          </div>

          {/* Modules accordion */}
          <div className="space-y-3">
            {COACHING_MODULES.slice(0, 5).map((module, idx) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={vp}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-sm"
              >
                <button
                  onClick={() => setOpenMod(openMod === module.id ? null : module.id)}
                  className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-black/[0.02]"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base"
                    style={{ background: `rgba(${module.rgb},0.10)`, border: `1px solid rgba(${module.rgb},0.2)` }}
                  >
                    {module.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.6rem] font-bold text-[#9ca3af]">Module {module.id} · {module.duration}</p>
                    <p className="truncate font-semibold text-[#09090b]">{module.title}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className="hidden rounded-full px-2 py-0.5 text-[0.6rem] font-bold sm:inline"
                      style={{ background: `rgba(${module.rgb},0.08)`, color: `rgb(${module.rgb})` }}
                    >
                      {module.chapters.length} ch.
                    </span>
                    <motion.div animate={{ rotate: openMod === module.id ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={13} className="text-[#9ca3af]" />
                    </motion.div>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {openMod === module.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-black/[0.05] px-5 pb-5 pt-4">
                        <div className="grid gap-2 sm:grid-cols-2">
                          {module.chapters.map(ch => (
                            <div key={ch.id} className="flex items-center gap-2.5 rounded-xl bg-[#f9fafb] px-3.5 py-2.5">
                              <span style={{ color: `rgb(${module.rgb})` }}>
                                {ch.type === "exercise" ? "✍️" : ch.type === "quiz" ? "❓" : "📖"}
                              </span>
                              <span className="min-w-0 flex-1 truncate text-xs text-[#374151]">{ch.title}</span>
                              <span className="flex shrink-0 items-center gap-1 text-[0.6rem] text-[#9ca3af]">
                                <Clock size={8} /> {ch.duration}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}

            <div className="pt-2 text-center">
              <Link
                href="/services/coaching-ia#programme"
                className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(167,139,250,0.25)] bg-[rgba(167,139,250,0.05)] px-5 py-2.5 text-sm font-bold text-[#a78bfa] transition hover:bg-[rgba(167,139,250,0.1)]"
              >
                Voir les 10 modules complets <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          §3 · PROGRAMME EXPERT 6 MOIS — fond sombre
      ════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#09090b] py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-1/2 h-[600px] w-[600px] -translate-y-1/2 translate-x-1/2 rounded-full bg-[rgba(249,168,38,0.05)] blur-[100px]" />
        </div>
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">

            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={vp}
              transition={{ duration: 0.6, ease }}
            >
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(249,168,38,0.3)] bg-[rgba(249,168,38,0.08)] px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#f9a826]">
                <Users size={9} /> Accompagnement humain · 6 mois
              </span>
              <h2 className="mb-5 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
                Programme Expert IA{" "}
                <span className="text-[#f9a826]">24 séances.</span>
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-white/55">
                1 séance individuelle par semaine pendant 6 mois avec un expert IA certifié DJAMA.
                24 heures d&apos;accompagnement pour transformer en profondeur votre façon de travailler.
              </p>
              <ul className="mb-8 space-y-3">
                {[
                  "24 séances · 24h d'accompagnement personnalisé",
                  "1 séance / semaine, planifiée à votre rythme",
                  "Expert humain dédié, certifié DJAMA IA",
                  "Plan d'action 90 jours construit ensemble",
                  "Accès complet à l'espace formation inclus",
                ].map(text => (
                  <li key={text} className="flex items-start gap-3 text-sm text-white/70">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#f9a826]" />
                    {text}
                  </li>
                ))}
              </ul>
              <Link
                href="/services/coaching-ia"
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-extrabold text-black transition-all hover:brightness-110 active:scale-95"
                style={{ background: "linear-gradient(135deg,#f9a826,#e07d0c)", boxShadow: "0 4px 20px rgba(249,168,38,0.35)" }}
              >
                Voir le programme expert <ArrowRight size={14} />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={vp}
              transition={{ duration: 0.6, ease, delay: 0.1 }}
            >
              <div className="overflow-hidden rounded-3xl border border-[rgba(249,168,38,0.18)] bg-white/[0.03] p-6 shadow-[0_0_60px_rgba(0,0,0,0.3)]">
                <div className="space-y-3">
                  {[
                    { phase: "Phase 1 · Mois 1-2", desc: "8 séances — fondations IA",    color: "#f9a826", icon: "🧠" },
                    { phase: "Phase 2 · Mois 3-4", desc: "8 séances — automatisation",   color: "#4ade80", icon: "⚡" },
                    { phase: "Phase 3 · Mois 5-6", desc: "8 séances — certification",     color: "#a78bfa", icon: "🏆" },
                  ].map(({ phase, desc, color, icon }) => (
                    <div key={phase} className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4">
                      <span className="text-2xl">{icon}</span>
                      <div>
                        <p className="text-[0.62rem] font-black uppercase tracking-wider" style={{ color }}>{phase}</p>
                        <p className="text-sm font-semibold text-white/80">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { val: "24",  sub: "séances" },
                    { val: "6",   sub: "mois" },
                    { val: "1:1", sub: "individuel" },
                  ].map(({ val, sub }) => (
                    <div key={sub} className="flex flex-col items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] py-4 text-center">
                      <span className="text-xl font-black text-[#f9a826]">{val}</span>
                      <span className="mt-0.5 text-[0.58rem] text-white/35">{sub}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          §4 · SOUTIEN SCOLAIRE — fond blanc
      ════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-white py-16 sm:py-24">
        <div className="dot-grid-light pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={vp}
            transition={{ duration: 0.5 }}
            className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.07)] px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#10b981]">
                <GraduationCap size={9} /> Cours particuliers · En ligne
              </span>
              <h2 className="display-section text-[#09090b]">
                Soutien <span className="text-[#34d399]">Scolaire</span>
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#6b7280]">
                Cours particuliers individuels pour collégiens et lycéens. En ligne, à votre rythme,
                avec un professeur dédié qui suit l&apos;élève et communique avec les parents.
              </p>
            </div>
            <Link
              href="/services/soutien-scolaire"
              className="shrink-0 inline-flex items-center gap-2 rounded-2xl border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.06)] px-5 py-2.5 text-sm font-bold text-[#10b981] transition hover:bg-[rgba(52,211,153,0.12)]"
            >
              Réserver un cours <ArrowRight size={13} />
            </Link>
          </motion.div>

          {/* Matières */}
          <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {MATIERES.map(({ emoji, label, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={vp}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="text-2xl">{emoji}</span>
                <span className="text-sm font-semibold text-[#09090b]">{label}</span>
              </motion.div>
            ))}
          </div>

          {/* 3 atouts */}
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                title: "Tous niveaux",
                items: ["6ème → Terminale", "Aide aux devoirs", "Préparation examens", "Méthodes de travail"],
                color: "#34d399", icon: GraduationCap,
              },
              {
                title: "100% en ligne",
                items: ["Google Meet ou Zoom", "Tableau interactif", "Exercices en temps réel", "Séances enregistrables"],
                color: "#60a5fa", icon: BookOpen,
              },
              {
                title: "Suivi personnalisé",
                items: ["Professeur dédié", "Bilan régulier", "Objectifs clairs", "Communication parents"],
                color: "#a78bfa", icon: Users,
              },
            ].map(({ title, items, color, icon: Icon }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={vp}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm"
              >
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `${color}15`, border: `1px solid ${color}22` }}
                >
                  <Icon size={18} style={{ color }} />
                </div>
                <p className="mb-3 font-bold text-[#09090b]">{title}</p>
                <ul className="space-y-2">
                  {items.map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-[#4b5563]">
                      <CheckCircle2 size={11} style={{ color }} /> {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          §5 · CTA FINAL — fond sombre
      ════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#09090b] py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(167,139,250,0.07)] blur-[120px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={vp}
          transition={{ duration: 0.55, ease }}
          className="relative z-10 mx-auto max-w-lg px-4 text-center sm:px-6"
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(249,168,38,0.3)] bg-[rgba(249,168,38,0.08)] px-4 py-1.5 text-xs font-bold text-[#f9a826]">
            <Sparkles size={11} /> Prêt à vous former ?
          </span>
          <h2 className="display-section mb-4 text-white">
            Choisissez votre{" "}
            <span className="text-[#a78bfa]">formation.</span>
          </h2>
          <p className="mb-8 text-sm text-white/40">
            Pas sûr ? Réservez un appel gratuit de 30 minutes avec notre équipe.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/services/coaching-ia"
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-extrabold text-white transition hover:brightness-110 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg,#a78bfa,#7c6fcd)", boxShadow: "0 4px 20px rgba(167,139,250,0.35)" }}
            >
              Coaching IA — 190€ <ArrowRight size={14} />
            </Link>
            <Link
              href="/reserver-appel"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.05] px-7 py-3.5 text-sm font-semibold text-white/70 transition hover:border-white/[0.2] hover:bg-white/[0.08]"
            >
              Appel conseil gratuit <ArrowRight size={14} />
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[0.68rem] text-white/25">
            <span className="flex items-center gap-1.5"><Shield size={9} className="text-[#a78bfa]" /> Garanti 7 jours</span>
            <span className="flex items-center gap-1.5"><Zap size={9} className="text-[#a78bfa]" /> Accès immédiat</span>
            <span className="flex items-center gap-1.5"><Award size={9} className="text-[#a78bfa]" /> Certification DJAMA</span>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
