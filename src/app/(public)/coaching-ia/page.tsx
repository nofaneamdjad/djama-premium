"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain, BookOpen, FileText, Video, Users, Zap, CheckCircle2, ArrowRight,
  Sparkles, Clock, BarChart2, Lightbulb, Rocket, Bot, PenLine, Globe,
  Code2, Briefcase, GraduationCap, Megaphone, Calendar, Star, ChevronDown,
  ChevronUp, Play, Trophy, Target, Gamepad2, Flame, ClipboardList, Swords,
  Puzzle, Dumbbell, Film, FlaskConical, MessageSquare, Wand2, Cpu, Network,
  Shield, Award, TrendingUp, Users2,
} from "lucide-react";
import { useState } from "react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainerFast, cardReveal, viewport } from "@/lib/animations";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── MODULES (10 × 7 = 70 chapitres) ─────────────────────── */
const MODULES = [
  {
    num: "01", color: "#60a5fa", title: "Comprendre l'IA",
    tagline: "Les fondations pour tout comprendre",
    chapters: ["Qu'est-ce que l'IA ?","Brève histoire de l'IA","Comment fonctionne un LLM","Les limites de l'IA","Éthique et responsabilité IA","L'IA dans votre secteur","Quiz : Fondations IA"],
  },
  {
    num: "02", color: "#a78bfa", title: "Prompt Engineering",
    tagline: "L'art de parler aux IA",
    chapters: ["Les bases du prompting","Techniques avancées (CoT, Few-shot)","Prompts pour entrepreneurs","Itérer et affiner","Bibliothèque de prompts DJAMA","Prompts multimodaux","Exercice : construire vos prompts"],
  },
  {
    num: "03", color: "#34d399", title: "Maîtriser ChatGPT",
    tagline: "L'outil le plus utilisé au monde",
    chapters: ["GPT-4o, o1, o3 — quel modèle choisir","Interface et raccourcis","GPTs Custom sur mesure","ChatGPT pour la recherche","ChatGPT pour le contenu","ChatGPT et le code","Workflow ChatGPT complet"],
  },
  {
    num: "04", color: "#f97316", title: "Maîtriser Claude",
    tagline: "L'IA la plus sûre et nuancée",
    chapters: ["Claude vs ChatGPT — vraies différences","Travailler avec de longs documents","Rédaction avancée avec Claude","Les Projets Claude","Claude API et intégrations","Claude pour le code","Exercice en conditions réelles"],
  },
  {
    num: "05", color: "#06b6d4", title: "Gemini, Mistral & Autres",
    tagline: "L'écosystème IA complet",
    chapters: ["Google Gemini — l'écosystème Google","Mistral — l'IA européenne open source","Perplexity — l'IA pour la recherche","DALL-E, Midjourney, Stable Diffusion","IA audio et vidéo","Choisir le bon outil","Tour d'horizon des IA"],
  },
  {
    num: "06", color: "#fbbf24", title: "Automatisation & Workflows",
    tagline: "Travaillez moins, produisez plus",
    chapters: ["Les bases de l'automatisation","Zapier — automatiser sans coder","Make — workflows avancés","n8n — open source et souverain","Les 10 workflows IA indispensables","Agents IA autonomes","Construire votre stack IA"],
  },
  {
    num: "07", color: "#ec4899", title: "IA pour Entrepreneurs",
    tagline: "Croissance et opérations dopées par l'IA",
    chapters: ["IA et prospection commerciale","IA et stratégie marketing","IA et service client","IA et gestion de projet","IA et finances","IA et ressources humaines","Construire votre roadmap IA"],
  },
  {
    num: "08", color: "#8b5cf6", title: "Création de Contenu IA",
    tagline: "Multipliez votre production",
    chapters: ["Stratégie de contenu IA","LinkedIn — bâtir votre audience","Newsletter — fidéliser et convertir","Vidéo et podcast avec l'IA","SEO et contenu optimisé","Images et visuels IA","Construire votre machine à contenu"],
  },
  {
    num: "09", color: "#14b8a6", title: "Agents IA & Niveau Avancé",
    tagline: "Le futur de l'IA est autonome",
    chapters: ["Architecture des agents IA","RAG — Retrieval Augmented Generation","Fine-tuning — personnaliser un modèle","LangChain, LlamaIndex, CrewAI","Sécurité et risques de l'IA","L'avenir de l'IA — se préparer","Construire un mini-agent"],
  },
  {
    num: "10", color: "#f59e0b", title: "Projet Final & Certification",
    tagline: "Prouvez votre maîtrise",
    chapters: ["Bilan des 9 modules","Définir votre projet de certification","Construire votre solution IA","Présenter et pitcher votre solution","Plan d'action 90 jours","Rejoindre la communauté DJAMA","Certification DJAMA IA Expert"],
  },
];

const OUTILS_IA = [
  { name: "ChatGPT",    desc: "GPT-4o & o1" },
  { name: "Claude",     desc: "Anthropic" },
  { name: "Gemini",     desc: "Google AI" },
  { name: "Mistral",    desc: "IA européenne" },
  { name: "Perplexity", desc: "Recherche IA" },
  { name: "DALL-E 3",   desc: "Génération image" },
  { name: "Midjourney", desc: "Image pro" },
  { name: "Zapier",     desc: "Automatisation" },
  { name: "Make",       desc: "Workflows" },
  { name: "n8n",        desc: "Open source" },
  { name: "ElevenLabs", desc: "Audio IA" },
  { name: "Runway",     desc: "Vidéo IA" },
];

const PROGRAMME_6MOIS = [
  { mois: "Mois 1–2", color: "#60a5fa", titre: "Fondations & Outils IA", seances: 8, detail: "ChatGPT, Claude, Gemini, Prompt Engineering — maîtrisez les bases et les outils essentiels" },
  { mois: "Mois 3–4", color: "#a78bfa", titre: "Automatisation & Business", seances: 8, detail: "Zapier, Make, agents IA, workflows, applications métier concrètes" },
  { mois: "Mois 5–6", color: "#f59e0b", titre: "Projet & Certification", seances: 8, detail: "Projet final sur mesure, déploiement, certification DJAMA IA Expert" },
];

const QUIZ_JEUX = [
  { color: "#a78bfa", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.2)", title: "Quiz de compréhension", desc: "Un quiz rapide après chaque cours — 5 questions, résultat instantané, correction commentée.", detail: "70 quiz — 1 par chapitre" },
  { color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)",  title: "Défi de la semaine",    desc: "Un challenge hebdomadaire chronométré sur un cas réel. Meilleur résultat = session bonus.", detail: "Toutes les semaines" },
  { color: "#4ade80", bg: "rgba(74,222,128,0.08)",  border: "rgba(74,222,128,0.2)",  title: "Tournoi de prompts",   desc: "Créez le meilleur prompt pour une tâche donnée. Débriefing collectif et astuces coach.", detail: "1 tournoi / mois" },
  { color: "#38bdf8", bg: "rgba(56,189,248,0.08)",  border: "rgba(56,189,248,0.2)",  title: "Jeu de rôle IA",       desc: "Simulez une vraie mission : rédiger une offre, analyser un concurrent, automatiser un process.", detail: "Scénarios réels" },
  { color: "#f472b6", bg: "rgba(244,114,182,0.08)", border: "rgba(244,114,182,0.2)", title: "Sprint créatif 30 min", desc: "Un exercice intense et ciblé : produire un maximum de valeur avec l'IA en 30 minutes.", detail: "Chrono inclus" },
  { color: "#c9a55a", bg: "rgba(201,165,90,0.08)",  border: "rgba(201,165,90,0.2)",  title: "Escape Room IA",       desc: "Un scénario mystère à résoudre uniquement avec des outils IA — chaque indice = nouvelle compétence.", detail: "Trimestriel" },
];

const COMPETENCES = [
  { icon: Bot,       text: "Maîtriser ChatGPT, Claude et Gemini" },
  { icon: PenLine,   text: "Créer du contenu 10× plus vite" },
  { icon: Zap,       text: "Automatiser vos tâches répétitives" },
  { icon: Network,   text: "Construire des workflows IA complets" },
  { icon: Rocket,    text: "Développer et déployer des agents IA" },
  { icon: Award,     text: "Obtenir votre certification DJAMA" },
  { icon: TrendingUp,text: "Gagner 10h+ par semaine" },
  { icon: Briefcase, text: "Appliquer l'IA à votre business" },
  { icon: Code2,     text: "Automatiser sans coder (no-code)" },
];

const OFFER_INCLUDES = [
  "10 modules · 70 chapitres complets",
  "Accès à vie aux contenus",
  "Tous les outils IA couverts (ChatGPT, Claude, Gemini, Mistral...)",
  "24 séances individuelles avec expert humain (6 mois)",
  "Activités pratiques & défis quotidiens",
  "70 quiz — 1 par chapitre",
  "Jeux pédagogiques & tournois de prompts",
  "Bibliothèque de 100+ prompts testés",
  "Communauté privée DJAMA IA Expert",
  "Certification officielle DJAMA IA Expert",
];

const STATS = [
  { value: "70",   label: "Chapitres" },
  { value: "24",   label: "Séances expert" },
  { value: "6",    label: "Mois de parcours" },
  { value: "24h",  label: "Coaching humain" },
];

/* ── Page principale ────────────────────────────── */
export default function CoachingIAPage() {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  return (
    <main className="overflow-x-hidden bg-white">

      {/* ═══ HERO ══════════════════════════════════════════════ */}
      <section className="hero-dark hero-grid relative overflow-hidden px-4 pb-14 pt-20 sm:pb-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[700px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[rgba(var(--gold),0.08)] blur-[110px]" />
          <div className="absolute right-[-80px] bottom-0 h-[300px] w-[300px] rounded-full bg-[rgba(124,111,205,0.06)] blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <FadeReveal delay={0.05}>
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--gold),0.25)] bg-[rgba(var(--gold),0.08)] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[rgb(var(--gold))]">
              <Brain size={13} />
              Coaching IA — Formation Premium DJAMA
            </div>
          </FadeReveal>

          <div className="mt-6">
            <MultiLineReveal
              lines={["Maîtrisez toute l'IA", "en 6 mois."]}
              highlight={0}
              delay={0.1}
              className="justify-center"
              lineClassName="text-5xl font-extrabold tracking-tight text-white md:text-7xl"
            />
          </div>

          <FadeReveal delay={0.45} className="mt-6">
            <p className="mx-auto max-w-2xl text-base text-white/50 md:text-lg">
              10 modules · 70 chapitres · ChatGPT, Claude, Gemini, Mistral et tous les outils IA —
              plus <strong className="text-white/80">24 séances individuelles</strong> avec un expert humain sur 6 mois.
            </p>
          </FadeReveal>

          <FadeReveal delay={0.56}>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[rgba(244,63,94,0.35)] bg-[rgba(244,63,94,0.1)] px-4 py-1.5 text-xs font-bold text-[#f87171]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f87171] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#f87171]" />
              </span>
              Places limitées — inscriptions ouvertes
            </div>
          </FadeReveal>

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

          <FadeReveal delay={0.75}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/services/coaching-ia#offre"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] px-7 py-3.5 text-sm font-extrabold text-black shadow-[0_4px_24px_rgba(201,165,90,0.4)] transition-shadow hover:shadow-[0_8px_40px_rgba(201,165,90,0.55)]"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative flex items-center gap-2">
                  Commencer maintenant <ArrowRight size={15} />
                </span>
              </Link>
              <a
                href="#programme"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-bold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                Voir les 10 modules <ChevronDown size={15} />
              </a>
            </div>
          </FadeReveal>
        </div>
      </section>

      {/* ═══ OUTILS COUVERTS ════════════════════════════════════ */}
      <section className="border-y border-[var(--border)] bg-[#f9f7f4] py-8">
        <div className="mx-auto max-w-5xl px-6">
          <FadeReveal className="mb-6 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
              Tous les outils IA couverts dans la formation
            </p>
          </FadeReveal>
          <motion.div
            variants={staggerContainerFast}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {OUTILS_IA.map(({ name, desc }) => (
              <motion.div
                key={name}
                variants={cardReveal}
                whileHover={{ y: -3, scale: 1.04 }}
                className="flex items-center gap-2.5 rounded-2xl border border-[var(--border)] bg-white px-4 py-2.5 shadow-sm transition-all hover:border-[rgba(var(--gold),0.4)] hover:shadow-[0_4px_16px_rgba(var(--gold),0.1)]"
              >
                <div>
                  <p className="text-xs font-extrabold text-[var(--ink)]">{name}</p>
                  <p className="text-[0.6rem] text-[var(--muted)]">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ PROGRAMME — 10 MODULES ═════════════════════════════ */}
      <section id="programme" className="mx-auto max-w-5xl px-6 py-10 sm:py-20">
        <FadeReveal className="mb-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--gold),0.2)] bg-[rgba(var(--gold),0.05)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[rgb(var(--gold))]">
            <BookOpen size={11} />
            10 modules · 70 chapitres
          </div>
        </FadeReveal>
        <FadeReveal delay={0.1} className="mb-3 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Programme complet —{" "}
            <span className="text-[rgb(var(--gold))]">tout sur l'IA</span>
          </h2>
        </FadeReveal>
        <FadeReveal delay={0.2} className="mb-12 text-center">
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[var(--muted)] md:text-base">
            De zéro à expert : fondations, tous les outils IA, automatisation, business,
            contenu, agents autonomes et certification finale.
          </p>
        </FadeReveal>

        <motion.div
          variants={staggerContainerFast}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="space-y-3"
        >
          {MODULES.map((mod) => {
            const isOpen = expandedModule === mod.num;
            return (
              <motion.div key={mod.num} variants={cardReveal}>
                <button
                  type="button"
                  onClick={() => setExpandedModule(isOpen ? null : mod.num)}
                  className="group w-full rounded-2xl border border-[var(--border)] bg-white px-5 py-4 text-left transition-all duration-200 hover:border-[rgba(var(--gold),0.4)] hover:shadow-[0_4px_20px_rgba(var(--gold),0.08)]"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: mod.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[0.65rem] font-bold uppercase tracking-widest" style={{ color: mod.color }}>Module {mod.num}</span>
                        <span className="rounded-full px-2 py-0.5 text-[0.55rem] font-bold" style={{ backgroundColor: mod.color + "18", color: mod.color }}>7 chapitres</span>
                      </div>
                      <p className="font-extrabold text-[var(--ink)] leading-tight">{mod.title}</p>
                      <p className="text-xs text-[var(--muted)]">{mod.tagline}</p>
                    </div>
                    <div className="shrink-0 transition-transform duration-200" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                      <ChevronDown size={16} className="text-[var(--muted)]" />
                    </div>
                  </div>
                  {isOpen && (
                    <motion.ul
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 space-y-1.5 pl-12"
                    >
                      {mod.chapters.map((ch, i) => (
                        <li key={ch} className="flex items-center gap-2.5 text-sm text-[var(--ink)]">
                          <span className="text-[0.6rem] font-bold tabular-nums text-[var(--muted)]">{mod.num}.{i + 1}</span>
                          <CheckCircle2 size={11} style={{ color: mod.color }} className="shrink-0" />
                          {ch}
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </button>
              </motion.div>
            );
          })}
        </motion.div>

        <FadeReveal delay={0.1}>
          <div className="mt-8 flex items-center justify-center gap-6 rounded-2xl border border-[var(--border)] bg-[rgba(var(--gold),0.03)] px-8 py-5">
            {[
              { val: "10", label: "Modules" },
              { val: "70", label: "Chapitres" },
              { val: "100+", label: "Templates prompts" },
              { val: "∞",  label: "Accès à vie" },
            ].map(({ val, label }) => (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <span className="text-xl font-extrabold text-[rgb(var(--gold))]">{val}</span>
                <span className="text-xs text-[var(--muted)]">{label}</span>
              </div>
            ))}
          </div>
        </FadeReveal>
      </section>

      {/* ═══ PROGRAMME 6 MOIS EXPERT HUMAIN ════════════════════ */}
      <section className="relative overflow-hidden bg-[#0f1117] py-12 sm:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-[rgba(var(--gold),0.06)] blur-[90px]" />
          <div className="absolute right-1/4 top-1/2 h-[350px] w-[350px] -translate-y-1/2 rounded-full bg-[rgba(124,111,205,0.05)] blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6">
          <FadeReveal className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.08)] px-4 py-2 text-xs font-bold uppercase tracking-widest mb-5" style={{ color: "#c9a55a" }}>
              <Users size={12} />
              Accompagnement humain — 6 mois
            </div>
            <h2 className="text-3xl font-extrabold text-white md:text-4xl">
              24 séances avec un expert humain
            </h2>
            <p className="mt-4 text-sm text-white/50 max-w-xl mx-auto">
              1 séance par semaine pendant 6 mois = 24h d&apos;accompagnement individuel
              avec un expert IA certifié DJAMA. Aucun autre programme n&apos;offre ça.
            </p>
          </FadeReveal>

          {/* 3 phases */}
          <div className="mb-10 grid gap-5 md:grid-cols-3">
            {PROGRAMME_6MOIS.map(({ mois, color, titre, seances, detail }, i) => (
              <motion.div
                key={mois}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewport}
                transition={{ duration: 0.5, ease, delay: i * 0.1 }}
                className="rounded-3xl border border-white/[0.1] bg-white/[0.05] p-6 backdrop-blur-sm"
                style={{ borderColor: color + "30" }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{mois}</span>
                  <span className="rounded-full px-2.5 py-0.5 text-[0.6rem] font-bold" style={{ color, backgroundColor: color + "18", border: `1px solid ${color}30` }}>
                    {seances} séances
                  </span>
                </div>
                <h3 className="mb-2 text-base font-extrabold text-white">{titre}</h3>
                <p className="text-xs leading-relaxed text-white/40">{detail}</p>
              </motion.div>
            ))}
          </div>

          {/* Stats accompagnement */}
          <FadeReveal delay={0.2}>
            <div className="flex flex-wrap items-center justify-center gap-8 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-8 py-6">
              {[
                { val: "24",  label: "Séances individuelles",   icon: Calendar },
                { val: "24h", label: "Accompagnement total",    icon: Clock },
                { val: "6",   label: "Mois de suivi",           icon: TrendingUp },
                { val: "1/1", label: "Coaching individuel",     icon: Users2 },
              ].map(({ val, label, icon: Icon }) => (
                <div key={label} className="flex flex-col items-center gap-1 text-center">
                  <Icon size={14} className="mb-0.5 text-[#c9a55a]" />
                  <span className="text-2xl font-extrabold" style={{ color: "#c9a55a" }}>{val}</span>
                  <span className="text-xs text-white/40">{label}</span>
                </div>
              ))}
            </div>
          </FadeReveal>
        </div>
      </section>

      {/* ═══ QUIZ & JEUX ════════════════════════════════════════ */}
      <section className="bg-[#f9f7f4] py-10 sm:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <FadeReveal className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--gold),0.2)] bg-[rgba(var(--gold),0.07)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[rgb(var(--gold))] mb-4">
              <Gamepad2 size={11} />
              Quiz & Jeux pédagogiques
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              Apprendre l&apos;IA,{" "}
              <span className="text-[rgb(var(--gold))]">c&apos;est aussi jouer.</span>
            </h2>
            <p className="mt-3 mx-auto max-w-2xl text-sm text-[var(--muted)]">
              70 quiz, défis hebdomadaires, tournois de prompts et escape rooms pour rendre l&apos;apprentissage addictif.
            </p>
          </FadeReveal>

          <motion.div variants={staggerContainerFast} initial="hidden" whileInView="visible" viewport={viewport} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {QUIZ_JEUX.map(({ color, bg, border, title, desc, detail }) => (
              <motion.div key={title} variants={cardReveal} whileHover={{ scale: 1.02, y: -4 }}
                className="group relative overflow-hidden rounded-3xl border p-6 transition-all duration-300"
                style={{ backgroundColor: bg, borderColor: border }}>
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${color}15 0%, transparent 60%)` }} />
                <div className="relative mb-4 flex items-start justify-between gap-3">
                  <div className="h-2.5 w-2.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: color }} />
                  <span className="rounded-full px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider shrink-0" style={{ color, backgroundColor: color + "18", border: `1px solid ${color}30` }}>{detail}</span>
                </div>
                <h3 className="relative text-base font-extrabold text-[var(--ink)]">{title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ COMPÉTENCES ACQUISES ═══════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-6 py-10 sm:py-20">
        <FadeReveal className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--gold),0.2)] bg-[rgba(var(--gold),0.05)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[rgb(var(--gold))] mb-4">
            <Sparkles size={11} />
            Compétences acquises
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Ce que vous allez maîtriser
          </h2>
          <p className="mt-3 text-sm text-[var(--muted)]">
            À la fin des 6 mois, vous serez opérationnel sur tous ces points — avec la certification pour le prouver.
          </p>
        </FadeReveal>

        <motion.div variants={staggerContainerFast} initial="hidden" whileInView="visible" viewport={viewport} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COMPETENCES.map(({ icon: Icon, text }) => (
            <motion.div key={text} variants={cardReveal} whileHover={{ scale: 1.02, y: -3 }}
              className="group flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-all duration-300 hover:border-[rgba(var(--gold),0.4)] hover:shadow-[0_8px_30px_rgba(var(--gold),0.1)]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgba(var(--gold),0.2)] bg-[rgba(var(--gold),0.07)] transition-colors duration-300 group-hover:bg-[rgba(var(--gold),0.14)]">
                <Icon size={18} className="text-[rgb(var(--gold))]" />
              </div>
              <span className="text-sm font-semibold text-[var(--ink)]">{text}</span>
              <CheckCircle2 size={14} className="ml-auto shrink-0 text-[var(--muted)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:text-[rgb(var(--gold))]" />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══ OFFRE & TARIF ══════════════════════════════════════ */}
      <section className="bg-[#f9f7f4] py-10 sm:py-20">
        <div className="mx-auto max-w-4xl px-6">
          <FadeReveal className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              Programme complet,{" "}
              <span className="text-[rgb(var(--gold))]">certification incluse</span>
            </h2>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Tout est inclus. 70 chapitres + 24 séances expert + certification DJAMA.
            </p>
          </FadeReveal>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.6, ease }}
            className="overflow-hidden rounded-3xl border border-[rgba(var(--gold),0.3)] bg-white shadow-[0_16px_60px_rgba(var(--gold),0.12)]"
          >
            <div className="relative overflow-hidden bg-[#0f1117] px-8 py-10 text-center">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-1/2 h-[300px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(var(--gold),0.08)] blur-[70px]" />
              </div>
              <div className="relative">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(var(--gold),0.25)] bg-[rgba(var(--gold),0.08)] px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-[rgb(var(--gold))]">
                  <Trophy size={10} />
                  Programme Expert IA — 6 mois · 24 séances
                </div>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <div className="text-center">
                    <p className="text-xs text-white/30 mb-1">Contenu digital</p>
                    <p className="text-3xl font-extrabold text-white/60">70 chapitres</p>
                  </div>
                  <span className="text-white/20 text-2xl font-thin">+</span>
                  <div className="text-center">
                    <p className="text-xs text-white/30 mb-1">Coaching humain</p>
                    <p className="text-3xl font-extrabold text-white">24 séances</p>
                  </div>
                  <span className="text-white/20 text-2xl font-thin">+</span>
                  <div className="text-center">
                    <p className="text-xs text-white/30 mb-1">Certification</p>
                    <p className="text-3xl font-extrabold" style={{ color: "#c9a55a" }}>DJAMA</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-white/30">Contactez-nous pour le tarif personnalisé selon votre profil</p>
              </div>
            </div>

            <div className="grid gap-0 md:grid-cols-2">
              <div className="p-8">
                <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Tout est inclus</p>
                <ul className="space-y-3">
                  {OFFER_INCLUDES.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-[var(--ink)]">
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[rgb(var(--gold))]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col justify-center border-t border-[var(--border)] p-8 md:border-l md:border-t-0">
                <p className="mb-2 text-lg font-extrabold text-[var(--ink)]">Prêt à maîtriser l'IA ?</p>
                <p className="mb-7 text-sm text-[var(--muted)]">
                  Démarrez votre parcours de 6 mois. 1 séance / semaine avec votre expert dédié.
                </p>

                <div className="flex flex-col gap-3">
                  <Link
                    href="/services/coaching-ia#offre"
                    className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] px-6 py-4 text-sm font-extrabold text-black shadow-[0_4px_20px_rgba(201,165,90,0.35)] transition-shadow hover:shadow-[0_8px_36px_rgba(201,165,90,0.5)]"
                  >
                    <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    <span className="relative flex items-center gap-2">
                      <Brain size={16} />
                      Démarrer mon parcours 6 mois
                      <ArrowRight size={15} />
                    </span>
                  </Link>

                  <Link
                    href="/coaching-ia/espace"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-white px-6 py-3.5 text-sm font-bold text-[var(--ink)] transition-all hover:border-[rgba(var(--gold),0.4)] hover:text-[rgb(var(--gold))]"
                  >
                    <Play size={15} />
                    Accéder à l&apos;espace formation
                  </Link>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {["1 séance / semaine","24 séances · 6 mois","Certification officielle"].map((g) => (
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
