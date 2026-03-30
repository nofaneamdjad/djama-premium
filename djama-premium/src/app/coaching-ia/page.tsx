"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain,
  BookOpen,
  FileText,
  Video,
  Users,
  Zap,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Clock,
  BarChart2,
  Lightbulb,
  Rocket,
  Image as ImageIcon,
  Bot,
  PenLine,
  Globe,
  ShoppingBag,
  Code2,
  Briefcase,
  GraduationCap,
  Megaphone,
  Calendar,
  Star,
  ChevronDown,
  ChevronUp,
  Play,
} from "lucide-react";
import { useState } from "react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainerFast, cardReveal, viewport } from "@/lib/animations";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Data ───────────────────────────────────────── */
const CHAPTERS = [
  { num: "01", title: "Introduction à l'intelligence artificielle",      icon: Brain },
  { num: "02", title: "Comprendre les modèles d'IA",                     icon: BarChart2 },
  { num: "03", title: "Utiliser ChatGPT efficacement",                   icon: Bot },
  { num: "04", title: "Prompt engineering avancé",                       icon: PenLine },
  { num: "05", title: "Automatiser son travail avec l'IA",               icon: Zap },
  { num: "06", title: "Génération de texte et rédaction assistée",       icon: FileText },
  { num: "07", title: "Création d'images avec IA",                       icon: ImageIcon },
  { num: "08", title: "Analyse de données avec IA",                      icon: BarChart2 },
  { num: "09", title: "IA pour entrepreneurs",                           icon: Briefcase },
  { num: "10", title: "IA pour étudiants",                               icon: GraduationCap },
  { num: "11", title: "IA pour le marketing",                            icon: Megaphone },
  { num: "12", title: "Automatisation des tâches",                       icon: Zap },
  { num: "13", title: "Création de contenu avec IA",                     icon: PenLine },
  { num: "14", title: "Outils IA indispensables",                        icon: Lightbulb },
  { num: "15", title: "Organisation et productivité avec IA",            icon: Calendar },
  { num: "16", title: "Création d'agents IA",                            icon: Bot },
  { num: "17", title: "IA et business en ligne",                         icon: ShoppingBag },
  { num: "18", title: "IA et programmation",                             icon: Code2 },
  { num: "19", title: "Cas pratiques",                                   icon: Rocket },
  { num: "20", title: "Projet final",                                    icon: Star },
];

const SUPPORTS = [
  {
    icon: BookOpen,
    title: "20 cours écrits",
    desc: "Contenus structurés, clairs et progressifs — lisibles à votre rythme, de n'importe quel appareil.",
    detail: "Un cours par chapitre",
  },
  {
    icon: FileText,
    title: "PDF résumé",
    desc: "Un PDF de synthèse pour chaque cours — idéal pour réviser rapidement les points clés.",
    detail: "20 fiches PDF incluses",
  },
  {
    icon: Globe,
    title: "Ressources & outils IA",
    desc: "Accès à une sélection des meilleurs outils IA avec guides d'utilisation et liens directs.",
    detail: "Mis à jour régulièrement",
  },
];

const COMPETENCES = [
  { icon: Bot,          text: "Utiliser les meilleurs outils IA" },
  { icon: Zap,          text: "Automatiser des tâches répétitives" },
  { icon: PenLine,      text: "Créer du contenu avec l'IA" },
  { icon: Lightbulb,    text: "Structurer ses idées efficacement" },
  { icon: Clock,        text: "Gagner du temps au quotidien" },
  { icon: Rocket,       text: "Développer un projet avec l'IA" },
];

const OFFER_INCLUDES = [
  "20 cours écrits complets",
  "20 PDF de résumé",
  "2h de visio théorique",
  "6h de pratique avec coach",
  "Exercices pratiques guidés",
  "Cas réels et projets concrets",
  "Support et accompagnement 3 mois",
  "Accès aux ressources et outils IA",
];

const STATS = [
  { value: "20",  label: "Cours complets" },
  { value: "8h",  label: "Accompagnement" },
  { value: "3",   label: "Mois de suivi" },
  { value: "190€",label: "Tarif unique" },
];

/* ── Composant chapitre ─────────────────────────── */
function ChapterItem({ num, title, icon: Icon, index }: {
  num: string; title: string; icon: React.ElementType; index: number;
}) {
  return (
    <motion.div
      variants={cardReveal}
      whileHover={{ x: 4 }}
      transition={{ duration: 0.18 }}
      className="group flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-white/60 px-5 py-4 transition-all duration-200 hover:border-[rgba(var(--gold),0.4)] hover:bg-[rgba(var(--gold),0.03)] hover:shadow-[0_4px_20px_rgba(var(--gold),0.08)]"
    >
      {/* Numéro */}
      <span className="w-7 shrink-0 text-right text-xs font-extrabold tabular-nums text-[var(--muted)] transition-colors duration-200 group-hover:text-[rgb(var(--gold))]">
        {num}
      </span>

      {/* Separateur */}
      <div className="h-8 w-px shrink-0 bg-[var(--border)] transition-colors duration-200 group-hover:bg-[rgba(var(--gold),0.3)]" />

      {/* Icône */}
      <Icon size={15} className="shrink-0 text-[var(--muted)] transition-colors duration-200 group-hover:text-[rgb(var(--gold))]" />

      {/* Titre */}
      <span className="flex-1 text-sm font-semibold text-[var(--ink)]">{title}</span>

      {/* Arrow hint */}
      <ArrowRight size={13} className="shrink-0 text-[var(--muted)] opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100 group-hover:text-[rgb(var(--gold))]" />
    </motion.div>
  );
}

/* ── Page principale ────────────────────────────── */
export default function CoachingIAPage() {
  const [showAll, setShowAll] = useState(false);
  const visibleChapters = showAll ? CHAPTERS : CHAPTERS.slice(0, 10);

  return (
    <main className="overflow-x-hidden bg-white">

      {/* ═══ HERO ══════════════════════════════════════════ */}
      <section className="hero-dark hero-grid relative overflow-hidden px-4 pb-28 pt-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[700px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[rgba(var(--gold),0.08)] blur-[110px]" />
          <div className="absolute right-[-80px] bottom-0 h-[300px] w-[300px] rounded-full bg-[rgba(124,111,205,0.06)] blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Badge */}
          <FadeReveal delay={0.05}>
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--gold),0.25)] bg-[rgba(var(--gold),0.08)] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[rgb(var(--gold))]">
              <Brain size={13} />
              Coaching IA — Formation premium
            </div>
          </FadeReveal>

          {/* Titre */}
          <div className="mt-6">
            <MultiLineReveal
              lines={["Maîtrisez l'IA", "en 3 mois."]}
              highlight={0}
              delay={0.1}
              className="justify-center"
              lineClassName="text-5xl font-extrabold tracking-tight text-white md:text-7xl"
            />
          </div>

          {/* Sous-titre */}
          <FadeReveal delay={0.45} className="mt-6">
            <p className="mx-auto max-w-2xl text-base text-white/50 md:text-lg">
              20 cours structurés, 8h d'accompagnement personnalisé avec un coach,
              des outils concrets — pour transformer l'IA en avantage réel dans votre activité.
            </p>
          </FadeReveal>

          {/* Stats */}
          <FadeReveal delay={0.6}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 md:gap-10">
              {STATS.map(({ value, label }) => (
                <div key={label} className="flex flex-col items-center gap-0.5">
                  <span className="text-3xl font-extrabold text-[rgb(var(--gold))]">{value}</span>
                  <span className="text-xs uppercase tracking-wider text-white/35">{label}</span>
                </div>
              ))}
            </div>
          </FadeReveal>

          {/* CTA */}
          <FadeReveal delay={0.75}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/contact"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] px-7 py-3.5 text-sm font-extrabold text-black shadow-[0_4px_24px_rgba(201,165,90,0.4)] transition-shadow hover:shadow-[0_8px_40px_rgba(201,165,90,0.55)]"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative flex items-center gap-2">
                  Réserver ce coaching <ArrowRight size={15} />
                </span>
              </Link>
              <a
                href="#programme"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-bold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                Voir le programme <ChevronDown size={15} />
              </a>
            </div>
          </FadeReveal>
        </div>
      </section>

      {/* ═══ PROGRAMME ══════════════════════════════════════ */}
      <section id="programme" className="mx-auto max-w-5xl px-6 py-20">
        <FadeReveal className="mb-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--gold),0.2)] bg-[rgba(var(--gold),0.05)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[rgb(var(--gold))]">
            <BookOpen size={11} />
            20 chapitres
          </div>
        </FadeReveal>
        <FadeReveal delay={0.1} className="mb-3 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Programme complet —{" "}
            <span className="text-[rgb(var(--gold))]">20 cours sur l'IA</span>
          </h2>
        </FadeReveal>
        <FadeReveal delay={0.2} className="mb-12 text-center">
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[var(--muted)] md:text-base">
            Formation conçue pour apprendre à utiliser l'IA dans son activité,
            gagner du temps, automatiser et développer des projets.
          </p>
        </FadeReveal>

        <motion.div
          variants={staggerContainerFast}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="grid gap-2 md:grid-cols-2"
        >
          {visibleChapters.map((c, i) => (
            <ChapterItem key={c.num} {...c} index={i} />
          ))}
        </motion.div>

        {/* Voir plus / moins */}
        <FadeReveal delay={0.1}>
          <div className="mt-6 flex justify-center">
            <motion.button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-white px-6 py-3 text-xs font-bold text-[var(--muted)] shadow-sm transition-all hover:border-[rgba(var(--gold),0.4)] hover:text-[rgb(var(--gold))]"
            >
              {showAll ? (
                <><ChevronUp size={14} /> Réduire le programme</>
              ) : (
                <><ChevronDown size={14} /> Voir les 10 derniers cours</>
              )}
            </motion.button>
          </div>
        </FadeReveal>
      </section>

      {/* ═══ SUPPORTS DE COURS ══════════════════════════════ */}
      <section className="bg-[#f9f7f4] py-20">
        <div className="mx-auto max-w-5xl px-6">
          <FadeReveal className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--gold),0.2)] bg-[rgba(var(--gold),0.07)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[rgb(var(--gold))] mb-4">
              <FileText size={11} />
              Supports inclus
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              Tout ce dont vous avez besoin
            </h2>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Chaque cours est livré avec ses ressources pour que rien ne vous échappe.
            </p>
          </FadeReveal>

          <motion.div
            variants={staggerContainerFast}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="grid gap-6 md:grid-cols-3"
          >
            {SUPPORTS.map(({ icon: Icon, title, desc, detail }) => (
              <motion.div
                key={title}
                variants={cardReveal}
                whileHover={{ y: -4 }}
                className="group rounded-3xl border border-[var(--border)] bg-white p-7 shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(var(--gold),0.1)]"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(var(--gold),0.2)] bg-[rgba(var(--gold),0.07)] transition-colors duration-300 group-hover:bg-[rgba(var(--gold),0.14)]">
                  <Icon size={22} className="text-[rgb(var(--gold))]" />
                </div>
                <h3 className="text-lg font-extrabold text-[var(--ink)]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[rgba(var(--gold),0.2)] bg-[rgba(var(--gold),0.05)] px-3 py-1 text-xs font-bold text-[rgb(var(--gold))]">
                  <CheckCircle2 size={10} />
                  {detail}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ ACCOMPAGNEMENT ═════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#0f1117] py-24">
        {/* Glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-[rgba(var(--gold),0.06)] blur-[90px]" />
          <div className="absolute right-1/4 top-1/2 h-[350px] w-[350px] -translate-y-1/2 rounded-full bg-[rgba(124,111,205,0.05)] blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6">
          <FadeReveal className="mb-14 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--gold),0.25)] bg-[rgba(var(--gold),0.08)] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[rgb(var(--gold))] mb-5">
              <Users size={12} />
              Accompagnement humain
            </div>
            <h2 className="text-3xl font-extrabold text-white md:text-4xl">
              8h avec un coach dédié
            </h2>
            <p className="mt-4 text-sm text-white/40 max-w-xl mx-auto">
              L'IA s'apprend mieux avec quelqu'un qui vous guide. Chaque heure est pensée pour avancer concrètement.
            </p>
          </FadeReveal>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Théorique */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={viewport}
              transition={{ duration: 0.6, ease }}
              className="group rounded-3xl border border-white/8 bg-white/[0.04] p-8 backdrop-blur-sm transition-all duration-300 hover:border-[rgba(var(--gold),0.25)] hover:bg-white/[0.07]"
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(var(--gold),0.2)] bg-[rgba(var(--gold),0.08)]">
                  <Video size={22} className="text-[rgb(var(--gold))]" />
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase tracking-widest text-[rgb(var(--gold))]">Cours théorique</span>
                  <span className="text-2xl font-extrabold text-white">2h de visio</span>
                </div>
              </div>
              <p className="mb-6 text-sm leading-relaxed text-white/45">
                Deux heures de cours en visioconférence pour poser les bases solides de l'IA
                — explications claires, exemples concrets, questions-réponses en direct.
              </p>
              <ul className="space-y-3">
                {[
                  "Fondamentaux de l'IA expliqués simplement",
                  "Tour des outils essentiels en live",
                  "Démonstrations en temps réel",
                  "Session de questions-réponses",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-xs text-white/55">
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-[rgb(var(--gold))]" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Pratique */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={viewport}
              transition={{ duration: 0.6, ease, delay: 0.1 }}
              className="group relative rounded-3xl border border-[rgba(var(--gold),0.25)] bg-[rgba(var(--gold),0.05)] p-8 backdrop-blur-sm transition-all duration-300 hover:border-[rgba(var(--gold),0.45)] hover:bg-[rgba(var(--gold),0.09)]"
            >
              {/* Badge recommandé */}
              <div className="absolute right-5 top-5 rounded-full bg-[rgba(var(--gold),0.15)] px-2.5 py-1 text-[0.6rem] font-extrabold uppercase tracking-widest text-[rgb(var(--gold))]">
                Cœur du programme
              </div>

              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(var(--gold),0.35)] bg-[rgba(var(--gold),0.12)]">
                  <Play size={22} className="text-[rgb(var(--gold))]" />
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase tracking-widest text-[rgb(var(--gold))]">Pratique avec coach</span>
                  <span className="text-2xl font-extrabold text-white">6h d'ateliers</span>
                </div>
              </div>
              <p className="mb-6 text-sm leading-relaxed text-white/45">
                Six heures d'ateliers pratiques en coaching individuel — vous apprenez en faisant,
                sur vos propres projets, avec un accompagnement personnalisé à chaque étape.
              </p>
              <ul className="space-y-3">
                {[
                  "Exercices pratiques sur vos cas réels",
                  "Automatisation de vos tâches concrètes",
                  "Accompagnement personnalisé",
                  "Suivi de progression entre les séances",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-xs text-white/55">
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-[rgb(var(--gold))]" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Total heures */}
          <FadeReveal delay={0.2}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-white/8 bg-white/[0.03] px-8 py-5">
              {[
                { val: "2h",  label: "Cours théorique en visio" },
                { val: "6h",  label: "Pratique avec coach" },
                { val: "8h",  label: "Total accompagnement" },
                { val: "3",   label: "Mois de suivi inclus" },
              ].map(({ val, label }) => (
                <div key={label} className="flex flex-col items-center gap-0.5">
                  <span className="text-xl font-extrabold text-[rgb(var(--gold))]">{val}</span>
                  <span className="text-xs text-white/35">{label}</span>
                </div>
              ))}
            </div>
          </FadeReveal>
        </div>
      </section>

      {/* ═══ CE QUE VOUS ALLEZ APPRENDRE ═══════════════════ */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <FadeReveal className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--gold),0.2)] bg-[rgba(var(--gold),0.05)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[rgb(var(--gold))] mb-4">
            <Sparkles size={11} />
            Compétences acquises
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Ce que vous allez maîtriser
          </h2>
          <p className="mt-3 text-sm text-[var(--muted)]">
            À la fin de la formation, vous serez opérationnel sur tous ces points.
          </p>
        </FadeReveal>

        <motion.div
          variants={staggerContainerFast}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {COMPETENCES.map(({ icon: Icon, text }) => (
            <motion.div
              key={text}
              variants={cardReveal}
              whileHover={{ scale: 1.02, y: -3 }}
              className="group flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-all duration-300 hover:border-[rgba(var(--gold),0.4)] hover:shadow-[0_8px_30px_rgba(var(--gold),0.1)]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgba(var(--gold),0.2)] bg-[rgba(var(--gold),0.07)] transition-colors duration-300 group-hover:bg-[rgba(var(--gold),0.14)]">
                <Icon size={18} className="text-[rgb(var(--gold))]" />
              </div>
              <span className="text-sm font-semibold text-[var(--ink)]">{text}</span>
              <CheckCircle2 size={14} className="ml-auto shrink-0 text-[var(--muted)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:text-[rgb(var(--gold))]" />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══ OFFRE & TARIF ══════════════════════════════════ */}
      <section className="bg-[#f9f7f4] py-20">
        <div className="mx-auto max-w-4xl px-6">
          <FadeReveal className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              Une offre complète,{" "}
              <span className="text-[rgb(var(--gold))]">un seul tarif</span>
            </h2>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Tout est inclus. Pas de frais cachés, pas d'abonnement.
            </p>
          </FadeReveal>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.6, ease }}
            className="overflow-hidden rounded-3xl border border-[rgba(var(--gold),0.3)] bg-white shadow-[0_16px_60px_rgba(var(--gold),0.12)]"
          >
            {/* En-tête tarif */}
            <div className="relative overflow-hidden bg-[#0f1117] px-8 py-10 text-center">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-1/2 h-[300px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(var(--gold),0.08)] blur-[70px]" />
              </div>
              <div className="relative">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(var(--gold),0.25)] bg-[rgba(var(--gold),0.08)] px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-[rgb(var(--gold))]">
                  <Star size={10} />
                  Offre complète — 3 mois
                </div>
                <div className="mt-2 flex items-end justify-center gap-2">
                  <span className="text-6xl font-extrabold text-white">190€</span>
                  <span className="mb-2 text-sm text-white/40">/ 3 mois</span>
                </div>
                <p className="mt-2 text-xs text-white/30">Paiement unique — PayPal ou virement</p>
              </div>
            </div>

            {/* Contenu inclus */}
            <div className="grid gap-0 md:grid-cols-2">
              <div className="p-8">
                <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
                  Tout est inclus
                </p>
                <ul className="space-y-3">
                  {OFFER_INCLUDES.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-[var(--ink)]">
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[rgb(var(--gold))]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="flex flex-col justify-center border-t border-[var(--border)] p-8 md:border-l md:border-t-0">
                <p className="mb-2 text-lg font-extrabold text-[var(--ink)]">
                  Prêt à passer à l'action&nbsp;?
                </p>
                <p className="mb-7 text-sm text-[var(--muted)]">
                  Contactez-nous pour réserver votre place et commencer votre accompagnement dès cette semaine.
                </p>

                <div className="flex flex-col gap-3">
                  <Link
                    href="/contact"
                    className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] px-6 py-4 text-sm font-extrabold text-black shadow-[0_4px_20px_rgba(201,165,90,0.35)] transition-shadow hover:shadow-[0_8px_36px_rgba(201,165,90,0.5)]"
                  >
                    <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    <span className="relative flex items-center gap-2">
                      <Brain size={16} />
                      Réserver ce coaching
                      <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                    </span>
                  </Link>

                  <a
                    href="#programme"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-white px-6 py-3.5 text-sm font-bold text-[var(--ink)] transition-all hover:border-[rgba(var(--gold),0.4)] hover:text-[rgb(var(--gold))]"
                  >
                    <BookOpen size={15} />
                    Voir le programme complet
                  </a>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {["Sans engagement","Suivi 3 mois","Support inclus"].map((g) => (
                    <span key={g} className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                      <CheckCircle2 size={11} className="text-[rgb(var(--gold))]" />
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

    </main>
  );
}
