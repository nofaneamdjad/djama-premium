"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Sparkles, Target, BarChart3, BookOpen, ArrowRight,
  Play, Lock, CheckCircle2, Trophy, Zap, RotateCcw,
  ChevronLeft, ChevronRight, Star, Flame, Bot, PenLine,
  ImageIcon, Briefcase, GraduationCap, Megaphone, Calendar,
  ShoppingBag, Code2, Rocket, Award, Lightbulb, Dumbbell,
  FlaskConical, Film, FileText, Gamepad2, RefreshCw, Send,
  Timer, BarChart2, ClipboardList, ExternalLink,
} from "lucide-react";
import Link from "next/link";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Cours ─────────────────────────────────────────────── */
const COURS = [
  { num: "01", title: "Introduction à l'IA",               icon: Brain,         done: true,  unlocked: true  },
  { num: "02", title: "Comprendre les modèles",            icon: BarChart2,     done: true,  unlocked: true  },
  { num: "03", title: "Utiliser ChatGPT",                  icon: Bot,           done: true,  unlocked: true  },
  { num: "04", title: "Prompt engineering avancé",         icon: PenLine,       done: false, unlocked: true, active: true },
  { num: "05", title: "Automatiser son travail",           icon: Zap,           done: false, unlocked: false },
  { num: "06", title: "Génération de texte",               icon: FileText,      done: false, unlocked: false },
  { num: "07", title: "Création d'images avec IA",         icon: ImageIcon,     done: false, unlocked: false },
  { num: "08", title: "Analyse de données",                icon: BarChart3,     done: false, unlocked: false },
  { num: "09", title: "IA pour entrepreneurs",             icon: Briefcase,     done: false, unlocked: false },
  { num: "10", title: "IA pour étudiants",                 icon: GraduationCap, done: false, unlocked: false },
  { num: "11", title: "IA pour le marketing",              icon: Megaphone,     done: false, unlocked: false },
  { num: "12", title: "Automatisation des tâches",         icon: Zap,           done: false, unlocked: false },
  { num: "13", title: "Création de contenu",               icon: PenLine,       done: false, unlocked: false },
  { num: "14", title: "Outils IA indispensables",          icon: Lightbulb,     done: false, unlocked: false },
  { num: "15", title: "Organisation & productivité",       icon: Calendar,      done: false, unlocked: false },
  { num: "16", title: "Création d'agents IA",              icon: Bot,           done: false, unlocked: false },
  { num: "17", title: "IA et business en ligne",           icon: ShoppingBag,   done: false, unlocked: false },
  { num: "18", title: "IA et programmation",               icon: Code2,         done: false, unlocked: false },
  { num: "19", title: "Cas pratiques",                     icon: Rocket,        done: false, unlocked: false },
  { num: "20", title: "Projet final",                      icon: Star,          done: false, unlocked: false },
];

/* ── Activités ─────────────────────────────────────────── */
const ACTIVITES = [
  { Icon: Flame,        color: "#f59e0b", title: "Défi quotidien",        desc: "Un défi court sur un vrai outil IA. 5 à 15 min par jour pour progresser sans pression.", badge: "5–15 min" },
  { Icon: Dumbbell,     color: "#a78bfa", title: "Atelier guidé",         desc: "Exercices étape par étape avec accompagnement. Vous apprenez en faisant sur vos vraies situations.", badge: "Avec coach" },
  { Icon: Film,         color: "#38bdf8", title: "Scénario entrepreneur", desc: "Des situations réelles du quotidien d'un entrepreneur — résolvez-les avec l'IA.", badge: "Cas réels" },
  { Icon: Rocket,       color: "#4ade80", title: "Mini-projet",           desc: "À chaque étape clé, créez un livrable concret : email automatisé, contenu généré, workflow IA.", badge: "Livrable réel" },
  { Icon: FlaskConical, color: "#f472b6", title: "Lab IA libre",          desc: "Un espace d'exploration sans contrainte — testez, ratez, recommencez.", badge: "Exploration" },
  { Icon: ClipboardList,color: "#c9a55a", title: "Étude de cas",          desc: "Décryptage d'un projet IA réel — comprenez comment il a été construit.", badge: "Analyse" },
];

const doneCours = COURS.filter(c => c.done).length;
const progressPct = Math.round((doneCours / COURS.length) * 100);

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */
export default function CoachingIAPage() {
  const [tab, setTab] = useState<"cours" | "activites" | "jeux">("cours");

  return (
    <div className="min-h-screen bg-[#080a0f]">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[10%] top-[5%] h-[500px] w-[500px] rounded-full bg-[rgba(217,70,239,0.05)] blur-[160px]" />
        <div className="absolute bottom-[10%] right-[5%] h-[400px] w-[400px] rounded-full bg-[rgba(201,165,90,0.04)] blur-[140px]" />
      </div>

      {/* Sub-header */}
      <div className="relative z-10 border-b border-white/6 bg-[rgba(15,17,23,0.88)] px-5 py-3.5 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl blur-sm" style={{ background: "#d946ef30" }} />
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border" style={{ backgroundColor: "#d946ef14", borderColor: "#d946ef30" }}>
              <Brain size={16} style={{ color: "#d946ef" }} />
            </div>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white">Coaching IA</h1>
            <p className="text-[0.65rem] text-white/30">Cours · Activités · Jeux</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-4xl space-y-6 px-5 py-6 sm:px-8">

        {/* Progress overview */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="relative overflow-hidden rounded-[1.75rem] border bg-[rgba(15,17,23,0.75)] p-6"
          style={{ borderColor: "#d946ef25" }}
        >
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #d946ef60, transparent)" }} />
          <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(217,70,239,0.07) 0%, transparent 60%)" }} />

          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-white/70">Progression globale</p>
              <p className="mt-0.5 text-xs text-white/35">Module en cours : Prompt engineering avancé (04/20)</p>
            </div>
            <div className="flex items-center gap-6">
              {[
                { val: `${doneCours}/20`, label: "Cours",      color: "#d946ef" },
                { val: "6",              label: "Activités",  color: "#f59e0b" },
                { val: "5",              label: "Jeux",        color: "#4ade80" },
              ].map(({ val, label, color }) => (
                <div key={label} className="text-center">
                  <p className="text-xl font-black" style={{ color }}>{val}</p>
                  <p className="text-[0.6rem] text-white/35">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1, ease, delay: 0.3 }}
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #d946ef, #a78bfa)" }}
              />
            </div>
            <p className="mt-1.5 text-right text-[0.6rem] text-white/30">{progressPct}% complété</p>
          </div>
        </motion.div>

        {/* Tab navigation */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease, delay: 0.1 }}
          className="flex gap-2 rounded-2xl border border-white/8 bg-[rgba(15,17,23,0.6)] p-1.5"
        >
          {([
            { id: "cours",    label: "📚 Cours",     count: "20" },
            { id: "activites",label: "🛠️ Activités", count: "6"  },
            { id: "jeux",     label: "🎮 Jeux",       count: "5"  },
          ] as const).map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
                tab === id ? "text-white" : "text-white/35 hover:text-white/60"
              }`}
            >
              {tab === id && (
                <motion.div
                  layoutId="tab-bg"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: "rgba(217,70,239,0.15)", border: "1px solid rgba(217,70,239,0.3)" }}
                  transition={{ duration: 0.25, ease }}
                />
              )}
              <span className="relative">{label}</span>
              <span className={`relative rounded-full px-1.5 py-0.5 text-[0.55rem] font-black ${tab === id ? "bg-[rgba(217,70,239,0.3)] text-fuchsia-300" : "bg-white/8 text-white/30"}`}>
                {count}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Tab content */}
        <AnimatePresence mode="wait">

          {/* ════ COURS ════ */}
          {tab === "cours" && (
            <motion.div
              key="cours"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease }}
              className="space-y-2"
            >
              {COURS.map((c, i) => {
                const Icon = c.icon;
                const isActive = (c as any).active;
                const isUnlocked = (c as any).unlocked;

                const row = (
                  <motion.div
                    key={c.num}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, ease, delay: i * 0.03 }}
                    className={`group flex items-center gap-4 rounded-2xl border px-4 py-3.5 transition-all ${
                      c.done
                        ? "border-[rgba(74,222,128,0.2)] bg-[rgba(74,222,128,0.05)] hover:border-[rgba(74,222,128,0.35)]"
                        : isActive
                        ? "border-[rgba(217,70,239,0.35)] bg-[rgba(217,70,239,0.08)] hover:border-[rgba(217,70,239,0.5)]"
                        : "border-white/6 bg-[rgba(15,17,23,0.5)]"
                    } ${isUnlocked ? "cursor-pointer" : "cursor-default opacity-60"}`}
                  >
                    {/* Status icon */}
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                      c.done ? "bg-[rgba(74,222,128,0.15)]" : isActive ? "bg-[rgba(217,70,239,0.15)]" : "bg-white/5"
                    }`}>
                      {c.done
                        ? <CheckCircle2 size={15} className="text-[#4ade80]" />
                        : isActive
                        ? <Play size={14} style={{ color: "#d946ef" }} />
                        : <Lock size={13} className="text-white/20" />
                      }
                    </div>

                    <span className={`w-6 shrink-0 text-xs font-black tabular-nums ${c.done ? "text-[#4ade80]" : isActive ? "text-fuchsia-400" : "text-white/20"}`}>
                      {c.num}
                    </span>

                    <div className={`h-6 w-px shrink-0 ${c.done ? "bg-[rgba(74,222,128,0.3)]" : isActive ? "bg-[rgba(217,70,239,0.3)]" : "bg-white/8"}`} />

                    <Icon size={14} className={c.done ? "text-[#4ade80]" : isActive ? "text-fuchsia-400" : "text-white/20"} />

                    <span className={`flex-1 text-sm font-semibold ${c.done ? "text-white/80" : isActive ? "text-white" : "text-white/30"}`}>
                      {c.title}
                    </span>

                    {c.done && <span className="shrink-0 rounded-full bg-[rgba(74,222,128,0.15)] px-2 py-0.5 text-[0.55rem] font-bold text-[#4ade80]">Terminé</span>}
                    {isActive && <span className="shrink-0 rounded-full bg-[rgba(217,70,239,0.2)] px-2 py-0.5 text-[0.55rem] font-bold text-fuchsia-300">En cours</span>}
                    {isUnlocked && !isActive && !c.done && (
                      <ArrowRight size={12} className="shrink-0 text-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
                    )}
                    {isUnlocked && (
                      <ArrowRight size={12} className={`shrink-0 opacity-0 transition-opacity group-hover:opacity-100 ${c.done ? "text-[#4ade80]" : isActive ? "text-fuchsia-400" : "text-white/20"}`} />
                    )}
                  </motion.div>
                );

                return isUnlocked ? (
                  <Link key={c.num} href={`/client/coaching-ia/cours/${c.num}`} className="block">
                    {row}
                  </Link>
                ) : (
                  <div key={c.num}>{row}</div>
                );
              })}
            </motion.div>
          )}

          {/* ════ ACTIVITÉS ════ */}
          {tab === "activites" && (
            <motion.div
              key="activites"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease }}
              className="grid gap-4 sm:grid-cols-2"
            >
              {ACTIVITES.map(({ Icon, color, title, desc, badge }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease, delay: i * 0.06 }}
                  className="group relative overflow-hidden rounded-[1.5rem] border border-white/8 bg-[rgba(15,17,23,0.65)] p-5 transition-all hover:border-white/15"
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: `radial-gradient(ellipse 60% 50% at 0% 0%, ${color}18 0%, transparent 60%)` }} />
                  <div className="absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }} />

                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border" style={{ backgroundColor: color + "18", borderColor: color + "30" }}>
                      <Icon size={18} style={{ color }} />
                    </div>
                    <span className="rounded-full px-2.5 py-0.5 text-[0.6rem] font-bold" style={{ color, backgroundColor: color + "15", border: `1px solid ${color}25` }}>
                      {badge}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white/90">{title}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/40">{desc}</p>

                  <button className="mt-4 flex items-center gap-1.5 text-xs font-semibold transition-colors" style={{ color }}>
                    Commencer <ArrowRight size={11} />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ════ JEUX ════ */}
          {tab === "jeux" && (
            <motion.div
              key="jeux"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease }}
              className="space-y-5"
            >
              {/* Banner vers page jeux */}
              <Link href="/client/coaching-ia/jeux">
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(167,139,250,0.3)] bg-[rgba(15,17,23,0.75)] p-6 cursor-pointer"
                >
                  <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.6), transparent)" }} />
                  <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(167,139,250,0.09) 0%, transparent 60%)" }} />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">🎮</span>
                      <div>
                        <p className="text-base font-extrabold text-white">Espace Jeux IA</p>
                        <p className="mt-0.5 text-xs text-white/40">5 jeux interactifs pour apprendre l'IA en vous amusant</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-extrabold text-black shadow-[0_4px_20px_rgba(167,139,250,0.35)]" style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed)" }}>
                      Jouer <ArrowRight size={12} />
                    </div>
                  </div>
                </motion.div>
              </Link>

              {/* Aperçu des jeux */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { emoji: "🧩", color: "#a78bfa", title: "Quiz IA",      badge: "10 Q",      href: "/client/coaching-ia/jeux" },
                  { emoji: "🃏", color: "#38bdf8", title: "Flash Cards",  badge: "12 cartes", href: "/client/coaching-ia/jeux" },
                  { emoji: "⚡", color: "#f59e0b", title: "Speed Quiz",   badge: "8 Q rapides", href: "/client/coaching-ia/jeux" },
                  { emoji: "🎯", color: "#4ade80", title: "Vrai ou Faux", badge: "8 Q",       href: "/client/coaching-ia/jeux" },
                  { emoji: "🔥", color: "#f472b6", title: "Défi du jour", badge: "Prompt",    href: "/client/coaching-ia/jeux" },
                ].map(({ emoji, color, title, badge, href }, i) => (
                  <Link key={title} href={href}>
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease, delay: i * 0.06 }}
                      whileHover={{ scale: 1.03, y: -3 }}
                      whileTap={{ scale: 0.97 }}
                      className="relative overflow-hidden rounded-[1.5rem] border border-white/8 bg-[rgba(15,17,23,0.65)] p-4 text-left transition-all hover:border-white/15"
                    >
                      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${color}10 0%, transparent 60%)` }} />
                      <div className="relative flex items-start justify-between mb-3">
                        <span className="text-2xl">{emoji}</span>
                        <span className="rounded-full px-2 py-0.5 text-[0.55rem] font-bold" style={{ color, backgroundColor: color + "15", border: `1px solid ${color}20` }}>{badge}</span>
                      </div>
                      <p className="relative text-sm font-extrabold text-white">{title}</p>
                      <div className="relative mt-2 flex items-center gap-1 text-[0.6rem] font-bold" style={{ color }}>
                        <Play size={8} fill={color} /> Jouer
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
