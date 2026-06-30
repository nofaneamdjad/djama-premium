"use client";
// coaching-ia page
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain, BookOpen, Zap, CheckCircle2, ArrowRight,
  Sparkles, BarChart2, Bot, PenLine, ImageIcon,
  Briefcase, GraduationCap, Megaphone, Calendar,
  ShoppingBag, Code2, Rocket, Star, Lightbulb,
  Flame, Dumbbell, Film, FlaskConical, ClipboardList,
  Trophy, Award, Crown, Play, Loader2, Wallet,
  Gamepad2, ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainerFast, cardReveal, viewport } from "@/lib/animations";
import { supabase } from "@/lib/supabase";

const GOLD = "#c9a55a";
const ease = [0.16, 1, 0.3, 1] as const;

/* ── 20 COURS ─────────────────────────────────────────────── */
const COURS = [
  { num: "01", title: "Introduction à l'IA",         icon: Brain,          color: "#d946ef" },
  { num: "02", title: "Comprendre les modèles",       icon: BarChart2,      color: "#a78bfa" },
  { num: "03", title: "Utiliser ChatGPT",             icon: Bot,            color: "#60a5fa" },
  { num: "04", title: "Prompt engineering avancé",    icon: PenLine,        color: "#34d399" },
  { num: "05", title: "Automatiser son travail",      icon: Zap,            color: "#f97316" },
  { num: "06", title: "Génération de texte",          icon: BookOpen,       color: "#fbbf24" },
  { num: "07", title: "Création d'images avec IA",    icon: ImageIcon,      color: "#f472b6" },
  { num: "08", title: "Analyse de données",           icon: BarChart2,      color: "#38bdf8" },
  { num: "09", title: "IA pour entrepreneurs",        icon: Briefcase,      color: "#4ade80" },
  { num: "10", title: "IA pour optimiser son temps",  icon: GraduationCap,  color: "#c9a55a" },
  { num: "11", title: "IA pour le marketing",         icon: Megaphone,      color: "#fb923c" },
  { num: "12", title: "Automatisation des tâches",    icon: Zap,            color: "#818cf8" },
  { num: "13", title: "Création de contenu",          icon: PenLine,        color: "#2dd4bf" },
  { num: "14", title: "Outils IA indispensables",     icon: Lightbulb,      color: "#facc15" },
  { num: "15", title: "Organisation & productivité",  icon: Calendar,       color: "#a3e635" },
  { num: "16", title: "Création d'agents IA",         icon: Bot,            color: "#e879f9" },
  { num: "17", title: "IA et business en ligne",      icon: ShoppingBag,    color: "#67e8f9" },
  { num: "18", title: "IA et programmation",          icon: Code2,          color: "#86efac" },
  { num: "19", title: "Cas pratiques",                icon: Rocket,         color: "#fda4af" },
  { num: "20", title: "Projet final & Certification", icon: Star,           color: "#c9a55a" },
];

/* ── 6 ACTIVITÉS ─────────────────────────────────────────── */
const ACTIVITES = [
  { Icon: Flame,         color: "#f59e0b", title: "Défi quotidien",         desc: "Un défi court sur un vrai outil IA. 5 à 15 min par jour pour ancrer les habitudes.", badge: "5–15 min"     },
  { Icon: Dumbbell,      color: "#a78bfa", title: "Atelier guidé",          desc: "Exercices étape par étape avec le Prof IA — correction immédiate.",                  badge: "Avec Prof IA"  },
  { Icon: Film,          color: "#38bdf8", title: "Scénario entrepreneur",  desc: "Des situations réelles du quotidien — résolvez-les avec l'IA.",                     badge: "Cas réels"    },
  { Icon: Rocket,        color: "#4ade80", title: "Mini-projet",            desc: "Créez un livrable concret à chaque étape clé : email, post, workflow.",             badge: "Livrable réel" },
  { Icon: FlaskConical,  color: "#f472b6", title: "Lab IA libre",           desc: "Un espace d'exploration sans contrainte pour tester vos idées.",                    badge: "Exploration"   },
  { Icon: ClipboardList, color: GOLD,      title: "Étude de cas",           desc: "Décryptage d'un projet IA réel : analyse, méthode, résultats chiffrés.",            badge: "Analyse"       },
];

/* ── 5 JEUX INTERACTIFS ───────────────────────────────────── */
const JEUX = [
  { color: "#a78bfa", bg: "rgba(167,139,250,0.07)", border: "rgba(167,139,250,0.18)", icon: Gamepad2,  title: "Quiz IA",        desc: "10 questions en 5 minutes — testez vos connaissances après chaque cours.", badge: "Après chaque cours" },
  { color: "#38bdf8", bg: "rgba(56,189,248,0.07)",  border: "rgba(56,189,248,0.18)",  icon: BookOpen,  title: "Flash Cards",    desc: "Révisez les concepts clés avec des cartes recto-verso interactives.",      badge: "Mémorisation"       },
  { color: "#4ade80", bg: "rgba(74,222,128,0.07)",  border: "rgba(74,222,128,0.18)",  icon: Zap,       title: "Speed Quiz",     desc: "60 secondes, 5 questions — seulement les plus rapides passent !",          badge: "Chrono"             },
  { color: "#f59e0b", bg: "rgba(245,158,11,0.07)",  border: "rgba(245,158,11,0.18)",  icon: CheckCircle2, title: "Vrai ou Faux", desc: "Mythes et réalités sur l'IA — distinguez le vrai du faux.",              badge: "Culture IA"         },
  { color: "#f472b6", bg: "rgba(244,114,182,0.07)", border: "rgba(244,114,182,0.18)", icon: Flame,     title: "Défi du jour",   desc: "Un défi quotidien différent chaque jour — gardez votre streak actif.",    badge: "Chaque jour"        },
];

/* ── 5 NIVEAUX XP ────────────────────────────────────────── */
const LEVELS = [
  { name: "Novice",    xp: "0 XP",     color: "#94a3b8", Icon: BookOpen },
  { name: "Apprenti",  xp: "200 XP",   color: "#60a5fa", Icon: Brain    },
  { name: "Praticien", xp: "500 XP",   color: "#a78bfa", Icon: Zap      },
  { name: "Expert IA", xp: "1 000 XP", color: "#f59e0b", Icon: Flame    },
  { name: "Maître IA", xp: "1 800 XP", color: "#d946ef", Icon: Crown    },
];

/* ── Twemoji helper ───────────────────────────────────────── */
function TwemojiImg({ emoji, size = 28 }: { emoji: string; size?: number }) {
  const cp = [...emoji]
    .map(c => c.codePointAt(0)?.toString(16))
    .filter((x): x is string => !!x && x !== "fe0f")
    .join("-");
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${cp}.svg`}
      alt={emoji}
      width={size}
      height={size}
      draggable={false}
      style={{ display: "inline-block", userSelect: "none" }}
    />
  );
}

/* ── 6 BADGES ─────────────────────────────────────────────── */
const BADGES = [
  { emoji: "🚀", title: "Premier pas",   desc: "1er cours terminé",      color: "#4ade80" },
  { emoji: "✍️", title: "Prompt Master", desc: "Prompt engineering ✓",   color: "#d946ef" },
  { emoji: "⚡", title: "Mi-chemin",     desc: "10 cours complétés",     color: "#f59e0b" },
  { emoji: "🔥", title: "Semaine de feu",desc: "7 jours consécutifs",    color: "#f97316" },
  { emoji: "🌟", title: "Expert IA",     desc: "15 cours complétés",     color: "#a78bfa" },
  { emoji: "🎓", title: "Diplômé IA",    desc: "Formation complète",     color: GOLD      },
];

/* ── Bouton Checkout Coaching IA ─────────────────────────── */
function CoachingPayButton() {
  const [loading, setLoading] = useState(false);

  async function pay() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const res = await fetch("/api/checkout/coaching-ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id ?? null, userEmail: user?.email ?? null }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {}
    finally { setLoading(false); }
  }

  return (
    <button
      onClick={pay}
      disabled={loading}
      className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl border border-[rgba(201,165,90,0.3)] bg-white px-6 py-4 text-sm font-extrabold text-[var(--ink)] shadow-sm transition-all hover:border-[rgba(201,165,90,0.5)] hover:shadow-[0_4px_20px_rgba(201,165,90,0.15)] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading ? <><Loader2 size={15} className="animate-spin" />Redirection…</> : <><Wallet size={15} className="text-[#c9a55a]" />Acheter — 190€</>}
    </button>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function ServicesCoachingIAPage() {
  return (
    <main className="overflow-x-hidden bg-white">

      {/* ═══ HERO ══════════════════════════════════════════════ */}
      <section
        className="hero-grid relative overflow-hidden px-4 pb-16 pt-28 sm:pb-32 sm:pt-40"
        style={{ background: "linear-gradient(160deg, #1e0d42 0%, #0d1829 52%, #071525 100%)" }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[700px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[rgba(217,70,239,0.07)] blur-[110px]" />
          <div className="absolute right-[-80px] bottom-0 h-[300px] w-[300px] rounded-full bg-[rgba(167,139,250,0.06)] blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <FadeReveal delay={0.05}>
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(217,70,239,0.3)] bg-[rgba(217,70,239,0.08)] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#d946ef]">
              <Brain size={13} />
              Formation IA · 20 cours vidéo
            </div>
          </FadeReveal>

          <FadeReveal delay={0.15} className="mt-6">
            <h1 className="text-5xl font-extrabold tracking-tight text-white md:text-7xl">
              Maîtrisez l&apos;IA<br />
              <span style={{ color: "#d946ef" }}>de zéro à expert.</span>
            </h1>
          </FadeReveal>

          <FadeReveal delay={0.35} className="mt-6">
            <p className="mx-auto max-w-2xl text-base text-white/50 md:text-lg">
              20 cours vidéo · 6 types d&apos;activités · 5 jeux interactifs ·
              système de niveaux XP · <strong className="text-white/75">certification DJAMA</strong>
            </p>
          </FadeReveal>

          <FadeReveal delay={0.5}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 md:gap-10">
              {[
                { value: "20", label: "Cours vidéo"    },
                { value: "6",  label: "Types d'activités" },
                { value: "5",  label: "Jeux IA"        },
                { value: "6",  label: "Badges"         },
              ].map(({ value, label }) => (
                <div key={label} className="flex flex-col items-center gap-0.5">
                  <span className="text-3xl font-extrabold" style={{ color: GOLD }}>{value}</span>
                  <span className="text-xs uppercase tracking-wider text-white/35">{label}</span>
                </div>
              ))}
            </div>
          </FadeReveal>

          <FadeReveal delay={0.65}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="#offre"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#d946ef] to-[#a78bfa] px-7 py-3.5 text-sm font-extrabold text-white shadow-[0_4px_24px_rgba(217,70,239,0.4)] transition-shadow hover:shadow-[0_8px_40px_rgba(217,70,239,0.55)]"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative flex items-center gap-2">Accéder à la formation <ArrowRight size={15} /></span>
              </Link>
              <a
                href="#cours"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-7 py-3.5 text-sm font-bold text-white/70 transition-colors hover:bg-white/[0.1] hover:text-white"
              >
                Voir les 20 cours <ChevronDown size={15} />
              </a>
            </div>
          </FadeReveal>
        </div>
      </section>

      {/* ═══ 20 COURS VIDÉO ════════════════════════════════════ */}
      <section id="cours" className="mx-auto max-w-5xl px-6 py-12 sm:py-20">
        <FadeReveal className="mb-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(217,70,239,0.2)] bg-[rgba(217,70,239,0.05)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#d946ef]">
            <Play size={11} />
            20 cours vidéo
          </div>
        </FadeReveal>
        <FadeReveal delay={0.1} className="mb-3 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Programme complet —{" "}
            <span style={{ color: "#d946ef" }}>du débutant à l&apos;expert</span>
          </h2>
        </FadeReveal>
        <FadeReveal delay={0.2} className="mb-10 text-center">
          <p className="mx-auto max-w-2xl text-sm text-[var(--muted)]">
            Chaque cours est une vidéo courte et dense — 15 à 30 min —
            suivie d&apos;un quiz, d&apos;une activité pratique et de 100 XP.
          </p>
        </FadeReveal>

        <div className="grid gap-3 sm:grid-cols-2">
          {COURS.map((cours) => {
            const Icon = cours.icon;
            return (
              <div
                key={cours.num}
                className="group flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm transition-all duration-200 hover:border-[rgba(217,70,239,0.3)] hover:shadow-[0_4px_16px_rgba(217,70,239,0.08)] hover:-translate-y-0.5"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200 group-hover:scale-110"
                  style={{ backgroundColor: cours.color + "15", border: `1px solid ${cours.color}30` }}
                >
                  <Icon size={18} style={{ color: cours.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.6rem] font-bold uppercase tracking-widest text-[var(--muted)]">Cours {cours.num}</span>
                    <span className="rounded-full px-1.5 py-0.5 text-[0.55rem] font-bold" style={{ backgroundColor: cours.color + "15", color: cours.color }}>100 XP</span>
                  </div>
                  <p className="text-sm font-bold text-[var(--ink)] leading-tight">{cours.title}</p>
                </div>
                <Play size={14} className="shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100" style={{ color: cours.color }} />
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-[var(--border)] bg-[rgba(217,70,239,0.03)] px-8 py-5">
            {[
              { val: "20",   label: "Cours vidéo" },
              { val: "100",  label: "XP par cours" },
              { val: "2 000", label: "XP max" },
              { val: "∞",    label: "Rejouer" },
            ].map(({ val, label }) => (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <span className="text-xl font-extrabold" style={{ color: "#d946ef" }}>{val}</span>
                <span className="text-xs text-[var(--muted)]">{label}</span>
              </div>
            ))}
          </div>
      </section>

      {/* ═══ GAMIFICATION — NIVEAUX XP ══════════════════════════ */}
      <section className="relative overflow-hidden bg-[#0f1117] py-12 sm:py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/3 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-[rgba(217,70,239,0.05)] blur-[100px]" />
          <div className="absolute right-1/4 top-1/2 h-[350px] w-[350px] -translate-y-1/2 rounded-full bg-[rgba(167,139,250,0.04)] blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6">
          <FadeReveal className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(217,70,239,0.25)] bg-[rgba(217,70,239,0.07)] px-4 py-2 text-xs font-bold uppercase tracking-widest mb-5 text-[#d946ef]">
              <Trophy size={12} />
              Système XP &amp; Niveaux
            </div>
            <h2 className="text-3xl font-extrabold text-white md:text-4xl">
              Progressez,{" "}
              <span style={{ color: "#d946ef" }}>gagnez des niveaux.</span>
            </h2>
            <p className="mt-4 text-sm text-white/45 max-w-xl mx-auto">
              Chaque cours complété rapporte 100 XP. Montez de Novice à Maître IA — chaque niveau débloque de nouveaux défis.
            </p>
          </FadeReveal>

          {/* Progression des niveaux */}
          <div className="relative mb-10">
            {/* Ligne de connexion */}
            <div className="absolute left-1/2 top-8 h-px w-[80%] -translate-x-1/2 bg-gradient-to-r from-[#94a3b830] via-[#d946ef50] to-[#d946ef80]" />

            <motion.div
              variants={staggerContainerFast}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="relative flex items-start justify-between gap-2"
            >
              {LEVELS.map((lvl, i) => {
                const Icon = lvl.Icon;
                const isLast = i === LEVELS.length - 1;
                return (
                  <motion.div
                    key={lvl.name}
                    variants={cardReveal}
                    className="flex flex-col items-center gap-2 text-center flex-1"
                  >
                    <div
                      className="relative flex h-14 w-14 items-center justify-center rounded-2xl border-2 transition-all duration-300"
                      style={{
                        borderColor: lvl.color + "50",
                        background: isLast
                          ? `linear-gradient(135deg, ${lvl.color}20, ${lvl.color}08)`
                          : `${lvl.color}10`,
                        boxShadow: isLast ? `0 0 30px ${lvl.color}30` : "none",
                      }}
                    >
                      <Icon size={22} style={{ color: lvl.color }} />
                      {isLast && (
                        <div className="absolute -top-1.5 -right-1.5">
                          <Crown size={12} style={{ color: lvl.color }} />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[0.65rem] font-bold uppercase tracking-widest" style={{ color: lvl.color }}>{lvl.name}</p>
                      <p className="text-[0.6rem] text-white/35">{lvl.xp}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* 6 Badges */}
          <FadeReveal delay={0.2} className="mb-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.07)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
              <Award size={11} />
              6 badges à débloquer
            </div>
          </FadeReveal>

          <motion.div
            variants={staggerContainerFast}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="grid grid-cols-3 gap-3 sm:grid-cols-6"
          >
            {BADGES.map(({ emoji, title, desc, color }) => (
              <motion.div
                key={title}
                variants={cardReveal}
                whileHover={{ scale: 1.06, y: -4 }}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-center transition-all duration-300"
                style={{ borderColor: color + "25" }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110"
                  style={{ background: color + "18", border: `1px solid ${color}30` }}
                >
                  <TwemojiImg emoji={emoji} size={24} />
                </div>
                <div>
                  <p className="text-[0.65rem] font-extrabold text-white leading-tight">{title}</p>
                  <p className="text-[0.55rem] text-white/30 mt-0.5">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ 6 ACTIVITÉS ════════════════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-6 py-12 sm:py-20">
        <FadeReveal className="mb-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--gold),0.2)] bg-[rgba(var(--gold),0.05)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[rgb(var(--gold))]">
            <Sparkles size={11} />
            6 types d&apos;activités
          </div>
        </FadeReveal>
        <FadeReveal delay={0.1} className="mb-3 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Apprendre en{" "}
            <span className="text-[rgb(var(--gold))]">faisant.</span>
          </h2>
        </FadeReveal>
        <FadeReveal delay={0.2} className="mb-10 text-center">
          <p className="mx-auto max-w-xl text-sm text-[var(--muted)]">
            Après chaque cours, choisissez votre activité — défi, atelier, mini-projet,
            lab libre ou étude de cas. Jamais la même routine.
          </p>
        </FadeReveal>

        <motion.div
          variants={staggerContainerFast}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {ACTIVITES.map(({ Icon, color, title, desc, badge }) => (
            <motion.div
              key={title}
              variants={cardReveal}
              whileHover={{ scale: 1.02, y: -4 }}
              className="group relative overflow-hidden rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)]"
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${color}10 0%, transparent 60%)` }}
              />
              <div className="relative mb-4 flex items-start justify-between">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: color + "15", border: `1px solid ${color}30` }}
                >
                  <Icon size={18} style={{ color }} />
                </div>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider"
                  style={{ color, backgroundColor: color + "15", border: `1px solid ${color}25` }}
                >
                  {badge}
                </span>
              </div>
              <h3 className="relative text-base font-extrabold text-[var(--ink)]">{title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══ 5 JEUX INTERACTIFS ════════════════════════════════ */}
      <section className="bg-[#f9f7f4] py-12 sm:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <FadeReveal className="mb-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(167,139,250,0.2)] bg-[rgba(167,139,250,0.06)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#a78bfa]">
              <Gamepad2 size={11} />
              5 jeux interactifs
            </div>
          </FadeReveal>
          <FadeReveal delay={0.1} className="mb-3 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              L&apos;apprentissage{" "}
              <span style={{ color: "#a78bfa" }}>qui ne ressemble pas à une leçon.</span>
            </h2>
          </FadeReveal>
          <FadeReveal delay={0.2} className="mb-10 text-center">
            <p className="mx-auto max-w-2xl text-sm text-[var(--muted)]">
              Quiz, flash cards, speed quiz — chaque jeu renforce les acquis
              sans que ça ressemble à un effort. Votre streak augmente, vos badges se débloquent.
            </p>
          </FadeReveal>

          <motion.div
            variants={staggerContainerFast}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {JEUX.map(({ color, bg, border, icon: Icon, title, desc, badge }) => (
              <motion.div
                key={title}
                variants={cardReveal}
                whileHover={{ scale: 1.02, y: -4 }}
                className="group relative overflow-hidden rounded-3xl border p-6 transition-all duration-300"
                style={{ backgroundColor: bg, borderColor: border }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${color}12 0%, transparent 60%)` }}
                />
                <div className="relative mb-4 flex items-start justify-between">
                  <div className="h-2.5 w-2.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: color }} />
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider shrink-0"
                    style={{ color, backgroundColor: color + "18", border: `1px solid ${color}30` }}
                  >
                    {badge}
                  </span>
                </div>
                <h3 className="relative text-base font-extrabold text-[var(--ink)]">{title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>
              </motion.div>
            ))}

            {/* Card certification teaser */}
            <motion.div
              variants={cardReveal}
              whileHover={{ scale: 1.02, y: -4 }}
              className="group relative overflow-hidden rounded-3xl border p-6 transition-all duration-300"
              style={{ backgroundColor: GOLD + "08", borderColor: GOLD + "20" }}
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${GOLD}12 0%, transparent 60%)` }} />
              <div className="relative mb-4 flex items-start justify-between">
                <div className="h-2.5 w-2.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: GOLD }} />
                <span className="rounded-full px-2.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider shrink-0" style={{ color: GOLD, backgroundColor: GOLD + "18", border: `1px solid ${GOLD}30` }}>
                  20/20 cours
                </span>
              </div>
              <h3 className="relative text-base font-extrabold text-[var(--ink)]">Certification DJAMA</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-[var(--muted)]">Complétez les 20 cours et débloquez votre certificat officiel DJAMA IA.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══ CERTIFICATION ══════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#0f1117] py-12 sm:py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]" style={{ background: GOLD + "08" }} />
        </div>
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <FadeReveal>
            <div
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest mb-6"
              style={{ borderColor: GOLD + "30", backgroundColor: GOLD + "08", color: GOLD }}
            >
              <GraduationCap size={12} />
              Certification officielle
            </div>
          </FadeReveal>
          <FadeReveal delay={0.1}>
            <h2 className="text-3xl font-extrabold text-white md:text-4xl">
              Certification{" "}
              <span style={{ color: GOLD }}>DJAMA IA.</span>
            </h2>
          </FadeReveal>
          <FadeReveal delay={0.2} className="mt-4">
            <p className="text-sm text-white/45 max-w-xl mx-auto">
              Complétez les 20 cours et obtenez votre certificat officiel DJAMA — reconnu, partageable sur LinkedIn, preuve concrète de votre maîtrise de l&apos;IA.
            </p>
          </FadeReveal>

          <FadeReveal delay={0.3} className="mt-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport}
              transition={{ duration: 0.6, ease }}
              className="inline-block rounded-3xl border p-8"
              style={{ borderColor: GOLD + "25", background: `linear-gradient(135deg, ${GOLD}08, transparent)` }}
            >
              <div className="mb-3 flex items-center justify-center gap-3">
                <GraduationCap size={28} style={{ color: GOLD }} />
                <span className="text-2xl font-black text-white">DJAMA</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>Certifié · Expert en Intelligence Artificielle</p>
              <div className="mt-4 flex items-center justify-center gap-4">
                {["20 cours", "2 000 XP", "Badge Diplômé"].map(item => (
                  <span key={item} className="flex items-center gap-1.5 text-xs text-white/50">
                    <CheckCircle2 size={11} style={{ color: GOLD }} />
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          </FadeReveal>
        </div>
      </section>

      {/* ═══ OFFRE & TARIFS ════════════════════════════════════ */}
      <section id="offre" className="bg-[#f9f7f4] py-12 sm:py-20">
        <div className="mx-auto max-w-4xl px-6">
          <FadeReveal className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              Accéder à la formation
            </h2>
            <p className="mt-3 text-sm text-[var(--muted)]">
              20 cours · activités · jeux · badges · certification — tout inclus.
            </p>
          </FadeReveal>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Plan abonné */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport}
              transition={{ duration: 0.5, ease }}
              className="relative overflow-hidden rounded-3xl border-2 bg-[#0f1117] p-8"
              style={{ borderColor: "#d946ef40" }}
            >
              <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(217,70,239,0.07) 0%, transparent 60%)" }} />
              <div className="relative">
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[rgba(217,70,239,0.3)] bg-[rgba(217,70,239,0.1)] px-3 py-1 text-xs font-bold text-[#d946ef]">
                  <Star size={10} /> Recommandé
                </div>
                <p className="mt-3 text-sm font-bold text-white/50">Abonnés DJAMA Pro</p>
                <p className="text-4xl font-black text-white mt-1">GRATUIT</p>
                <p className="text-xs text-white/35 mt-1">inclus avec l&apos;abonnement 11,90€/mois</p>
                <ul className="mt-6 space-y-2.5">
                  {[
                    "Accès immédiat aux 20 cours",
                    "6 types d'activités inclus",
                    "5 jeux interactifs",
                    "Système XP & 6 badges",
                    "Certification DJAMA",
                    "Mises à jour à vie",
                  ].map(item => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-white/70">
                      <CheckCircle2 size={14} style={{ color: "#d946ef" }} className="shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link
                    href="/espace-client"
                    className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#d946ef] to-[#a78bfa] px-6 py-4 text-sm font-extrabold text-white shadow-[0_4px_20px_rgba(217,70,239,0.35)] transition-shadow hover:shadow-[0_8px_36px_rgba(217,70,239,0.5)]"
                  >
                    <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    <span className="relative flex items-center gap-2"><Play size={15} /> Accéder à ma formation</span>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Plan achat individuel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport}
              transition={{ duration: 0.5, ease, delay: 0.1 }}
              className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white p-8 shadow-sm"
            >
              <p className="text-sm font-bold text-[var(--muted)]">Achat individuel</p>
              <p className="text-4xl font-black text-[var(--ink)] mt-1">190€</p>
              <p className="text-xs text-[var(--muted)] mt-1">paiement unique · accès 3 mois</p>
              <ul className="mt-6 space-y-2.5">
                {[
                  "20 cours vidéo complets",
                  "Activités & jeux inclus",
                  "Système XP & badges",
                  "Certification DJAMA",
                  "Satisfait ou remboursé 7j",
                ].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-[var(--ink)]">
                    <CheckCircle2 size={14} className="shrink-0 text-[rgb(var(--gold))]" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <CoachingPayButton />
              </div>
            </motion.div>
          </div>

          {/* Garantie */}
          <FadeReveal delay={0.2} className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-5 py-2.5 text-xs text-[var(--muted)] shadow-sm">
              <CheckCircle2 size={13} className="text-[rgb(var(--gold))]" />
              Satisfait ou remboursé sous 7 jours · Accès immédiat · Paiement sécurisé Stripe
            </div>
          </FadeReveal>
        </div>
      </section>

    </main>
  );
}
