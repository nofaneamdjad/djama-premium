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
  Timer, BarChart2, ClipboardList,
} from "lucide-react";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════
   CONSTANTES
═══════════════════════════════════════════════════════════ */
const ease = [0.16, 1, 0.3, 1] as const;
const GOLD = "#c9a55a";

/* ── Cours ─────────────────────────────────────────────── */
const COURS = [
  { num: "01", title: "Introduction à l'IA",               icon: Brain,         done: true  },
  { num: "02", title: "Comprendre les modèles",            icon: BarChart2,     done: true  },
  { num: "03", title: "Utiliser ChatGPT",                  icon: Bot,           done: true  },
  { num: "04", title: "Prompt engineering avancé",         icon: PenLine,       done: false, active: true },
  { num: "05", title: "Automatiser son travail",           icon: Zap,           done: false },
  { num: "06", title: "Génération de texte",               icon: FileText,      done: false },
  { num: "07", title: "Création d'images avec IA",         icon: ImageIcon,     done: false },
  { num: "08", title: "Analyse de données",                icon: BarChart3,     done: false },
  { num: "09", title: "IA pour entrepreneurs",             icon: Briefcase,     done: false },
  { num: "10", title: "IA pour étudiants",                 icon: GraduationCap, done: false },
  { num: "11", title: "IA pour le marketing",              icon: Megaphone,     done: false },
  { num: "12", title: "Automatisation des tâches",         icon: Zap,           done: false },
  { num: "13", title: "Création de contenu",               icon: PenLine,       done: false },
  { num: "14", title: "Outils IA indispensables",          icon: Lightbulb,     done: false },
  { num: "15", title: "Organisation & productivité",       icon: Calendar,      done: false },
  { num: "16", title: "Création d'agents IA",              icon: Bot,           done: false },
  { num: "17", title: "IA et business en ligne",           icon: ShoppingBag,   done: false },
  { num: "18", title: "IA et programmation",               icon: Code2,         done: false },
  { num: "19", title: "Cas pratiques",                     icon: Rocket,        done: false },
  { num: "20", title: "Projet final",                      icon: Star,          done: false },
];

/* ── Activités ─────────────────────────────────────────── */
const ACTIVITES = [
  { Icon: Flame,        color: "#f59e0b", title: "Défi quotidien",       desc: "Un défi court sur un vrai outil IA. 5 à 15 min par jour pour progresser sans pression.", badge: "5–15 min" },
  { Icon: Dumbbell,     color: "#a78bfa", title: "Atelier guidé",        desc: "Exercices étape par étape avec accompagnement. Vous apprenez en faisant sur vos vraies situations.", badge: "Avec coach" },
  { Icon: Film,         color: "#38bdf8", title: "Scénario entrepreneur", desc: "Des situations réelles du quotidien d'un entrepreneur — résolvez-les avec l'IA.", badge: "Cas réels" },
  { Icon: Rocket,       color: "#4ade80", title: "Mini-projet",          desc: "À chaque étape clé, créez un livrable concret : email automatisé, contenu généré, workflow IA.", badge: "Livrable réel" },
  { Icon: FlaskConical, color: "#f472b6", title: "Lab IA libre",         desc: "Un espace d'exploration sans contrainte — testez, ratez, recommencez.", badge: "Exploration" },
  { Icon: ClipboardList,color: "#c9a55a", title: "Étude de cas",         desc: "Décryptage d'un projet IA réel — comprenez comment il a été construit.", badge: "Analyse" },
];

/* ── Quiz ──────────────────────────────────────────────── */
const QUIZ = [
  {
    q: "Que signifie 'prompt engineering' ?",
    opts: ["Programmer un robot IA", "Rédiger des instructions efficaces pour guider une IA", "Créer une application mobile", "Coder en Python"],
    correct: 1,
    expl: "Le prompt engineering consiste à formuler des instructions précises pour obtenir les meilleures réponses d'un modèle d'IA.",
  },
  {
    q: "Quel modèle est derrière ChatGPT ?",
    opts: ["BERT", "LLaMA", "GPT-4", "Mistral"],
    correct: 2,
    expl: "ChatGPT est basé sur GPT-4 (Generative Pre-trained Transformer 4), développé par OpenAI.",
  },
  {
    q: "Que signifie 'hallucination' dans le contexte de l'IA ?",
    opts: ["Un bug visuel", "Quand l'IA invente des informations fausses", "Une technique de prompt", "Un type de modèle"],
    correct: 1,
    expl: "Une hallucination IA désigne le phénomène où un modèle génère des informations fausses mais présentées avec confiance.",
  },
  {
    q: "Quelle est la meilleure façon d'obtenir une réponse précise d'une IA ?",
    opts: ["Poser une question courte", "Donner du contexte + un rôle + une tâche claire", "Écrire en majuscules", "Poser plusieurs questions à la fois"],
    correct: 1,
    expl: "Un bon prompt inclut : un contexte, un rôle assigné à l'IA, et une tâche clairement définie.",
  },
  {
    q: "Qu'est-ce qu'un 'agent IA' ?",
    opts: ["Un commercial qui vend de l'IA", "Un modèle qui peut effectuer des actions autonomes", "Un antivirus intelligent", "Un assistant vocal"],
    correct: 1,
    expl: "Un agent IA est un système capable d'agir de façon autonome : chercher des infos, exécuter du code, prendre des décisions.",
  },
];

/* ── Flash Cards ───────────────────────────────────────── */
const FLASH_CARDS = [
  { term: "LLM",              def: "Large Language Model — modèle d'IA entraîné sur de grandes quantités de texte pour comprendre et générer du langage." },
  { term: "Prompt",           def: "Instruction ou question envoyée à une IA pour obtenir une réponse. La qualité du prompt détermine la qualité de la réponse." },
  { term: "Token",            def: "Unité de texte utilisée par les LLMs. Un token ≈ ¾ d'un mot. Les modèles ont une limite de tokens par requête." },
  { term: "Fine-tuning",      def: "Technique consistant à réentraîner un modèle sur des données spécifiques pour l'adapter à un domaine particulier." },
  { term: "RAG",              def: "Retrieval-Augmented Generation — technique qui connecte une IA à une base de données externe pour des réponses plus précises." },
  { term: "Température",      def: "Paramètre qui contrôle la créativité de l'IA. 0 = réponses déterministes, 1 = réponses créatives et variées." },
  { term: "Chain of Thought", def: "Technique de prompt qui demande à l'IA de 'penser étape par étape', améliorant la précision des raisonnements complexes." },
  { term: "Multimodal",       def: "Se dit d'un modèle capable de traiter plusieurs types de données : texte, images, audio, vidéo." },
];

/* ── Défi du jour ──────────────────────────────────────── */
const DEFI = {
  title: "Automatise ta relance client",
  desc: "Écris un prompt pour demander à ChatGPT de rédiger un email de relance professionnel pour un client qui n'a pas répondu depuis 7 jours.",
  tips: ["Donne un rôle à l'IA (ex: 'Tu es un commercial expert')", "Précise le ton souhaité (professionnel, chaleureux...)", "Donne le contexte : type de service, nom du client", "Demande un objet + corps d'email"],
  exemple: "Tu es un commercial expert en relation client. Rédige un email de relance pour un client prénommé Marc, qui n'a pas répondu à notre devis depuis 7 jours. Ton : professionnel et chaleureux. Inclure : objet accrocheur, rappel du devis, proposition d'appel.",
};

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */
export default function CoachingIAPage() {
  const [tab, setTab] = useState<"cours" | "activites" | "jeux">("cours");

  /* ── Quiz state ── */
  const [quizStarted, setQuizStarted] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizDone, setQuizDone] = useState(false);

  /* ── Flash cards state ── */
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  /* ── Défi state ── */
  const [prompt, setPrompt] = useState("");
  const [defiDone, setDefiDone] = useState(false);
  const [showExemple, setShowExemple] = useState(false);

  /* ── Jeu actif ── */
  const [activeGame, setActiveGame] = useState<"quiz" | "flash" | "defi" | null>(null);

  const score = answers.filter((a, i) => a === QUIZ[i].correct).length;
  const doneCours = COURS.filter(c => c.done).length;
  const progressPct = Math.round((doneCours / COURS.length) * 100);

  function resetQuiz() {
    setQIndex(0); setSelected(null); setAnswers([]); setQuizDone(false); setQuizStarted(false);
  }
  function handleAnswer(idx: number) {
    if (selected !== null) return;
    setSelected(idx);
    setTimeout(() => {
      const next = [...answers, idx];
      setAnswers(next);
      if (qIndex + 1 >= QUIZ.length) { setQuizDone(true); }
      else { setQIndex(q => q + 1); setSelected(null); }
    }, 900);
  }
  function nextCard() { setFlipped(false); setTimeout(() => setCardIndex(i => (i + 1) % FLASH_CARDS.length), 150); }
  function prevCard() { setFlipped(false); setTimeout(() => setCardIndex(i => (i - 1 + FLASH_CARDS.length) % FLASH_CARDS.length), 150); }

  return (
    <div className="min-h-screen bg-[#080a0f]">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[10%] top-[5%] h-[500px] w-[500px] rounded-full bg-[rgba(217,70,239,0.05)] blur-[160px]" />
        <div className="absolute bottom-[10%] right-[5%] h-[400px] w-[400px] rounded-full bg-[rgba(201,165,90,0.04)] blur-[140px]" />
      </div>

      {/* ── Sub-header ── */}
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

        {/* ── Progress overview ── */}
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
                { val: `${doneCours}/20`, label: "Cours", color: "#d946ef" },
                { val: "6",              label: "Activités", color: "#f59e0b" },
                { val: "3",              label: "Jeux",     color: "#4ade80" },
              ].map(({ val, label, color }) => (
                <div key={label} className="text-center">
                  <p className="text-xl font-black" style={{ color }}>{val}</p>
                  <p className="text-[0.6rem] text-white/35">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Progress bar */}
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

        {/* ── Tab navigation ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease, delay: 0.1 }}
          className="flex gap-2 rounded-2xl border border-white/8 bg-[rgba(15,17,23,0.6)] p-1.5"
        >
          {([
            { id: "cours",    label: "📚 Cours",      count: "20" },
            { id: "activites",label: "🛠️ Activités",  count: "6"  },
            { id: "jeux",     label: "🎮 Jeux",        count: "3"  },
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

        {/* ── Tab content ── */}
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
                return (
                  <motion.div
                    key={c.num}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, ease, delay: i * 0.03 }}
                    className={`flex items-center gap-4 rounded-2xl border px-4 py-3.5 transition-all ${
                      c.done
                        ? "border-[rgba(74,222,128,0.2)] bg-[rgba(74,222,128,0.05)]"
                        : isActive
                        ? "border-[rgba(217,70,239,0.35)] bg-[rgba(217,70,239,0.08)]"
                        : "border-white/6 bg-[rgba(15,17,23,0.5)]"
                    }`}
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

                    {/* Num */}
                    <span className={`w-6 shrink-0 text-xs font-black tabular-nums ${c.done ? "text-[#4ade80]" : isActive ? "text-fuchsia-400" : "text-white/20"}`}>
                      {c.num}
                    </span>

                    {/* Separator */}
                    <div className={`h-6 w-px shrink-0 ${c.done ? "bg-[rgba(74,222,128,0.3)]" : isActive ? "bg-[rgba(217,70,239,0.3)]" : "bg-white/8"}`} />

                    {/* Icon */}
                    <Icon size={14} className={c.done ? "text-[#4ade80]" : isActive ? "text-fuchsia-400" : "text-white/20"} />

                    {/* Title */}
                    <span className={`flex-1 text-sm font-semibold ${c.done ? "text-white/80" : isActive ? "text-white" : "text-white/30"}`}>
                      {c.title}
                    </span>

                    {/* Badge */}
                    {c.done && <span className="shrink-0 rounded-full bg-[rgba(74,222,128,0.15)] px-2 py-0.5 text-[0.55rem] font-bold text-[#4ade80]">Terminé</span>}
                    {isActive && <span className="shrink-0 rounded-full bg-[rgba(217,70,239,0.2)] px-2 py-0.5 text-[0.55rem] font-bold text-fuchsia-300">En cours</span>}
                  </motion.div>
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
              {/* Sélecteur de jeu */}
              {!activeGame && (
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { id: "quiz",  emoji: "🧩", color: "#a78bfa", title: "Quiz IA",       desc: "5 questions sur l'intelligence artificielle. Testez vos connaissances !" },
                    { id: "flash", emoji: "🃏", color: "#38bdf8", title: "Flash Cards",   desc: "8 termes clés de l'IA à maîtriser. Cliquez pour retourner la carte." },
                    { id: "defi",  emoji: "🎯", color: "#f59e0b", title: "Défi du jour",  desc: "Écrivez le meilleur prompt pour une mission concrète d'entrepreneur." },
                  ].map(({ id, emoji, color, title, desc }) => (
                    <motion.button
                      key={id}
                      whileHover={{ scale: 1.03, y: -3 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setActiveGame(id as any)}
                      className="relative overflow-hidden rounded-[1.5rem] border border-white/8 bg-[rgba(15,17,23,0.65)] p-5 text-left transition-all hover:border-white/15"
                    >
                      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${color}12 0%, transparent 60%)` }} />
                      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }} />
                      <span className="relative mb-3 block text-3xl">{emoji}</span>
                      <p className="relative text-sm font-extrabold text-white">{title}</p>
                      <p className="relative mt-1.5 text-xs leading-relaxed text-white/40">{desc}</p>
                      <div className="relative mt-4 flex items-center gap-1 text-xs font-bold" style={{ color }}>
                        Jouer <Play size={10} fill={color} />
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* ══ QUIZ ══ */}
              {activeGame === "quiz" && (
                <motion.div key="quiz-game" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setActiveGame(null); resetQuiz(); }} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70">
                      <ChevronLeft size={13} /> Retour
                    </button>
                    <span className="text-sm font-bold text-white">🧩 Quiz IA</span>
                  </div>

                  <div className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(167,139,250,0.25)] bg-[rgba(15,17,23,0.75)] p-6">
                    <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(167,139,250,0.08) 0%, transparent 60%)" }} />

                    {!quizStarted ? (
                      <div className="relative text-center py-4">
                        <span className="text-4xl">🧩</span>
                        <h3 className="mt-3 text-xl font-black text-white">Quiz IA</h3>
                        <p className="mt-2 text-sm text-white/45">5 questions · Réponse unique · Explication après chaque réponse</p>
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setQuizStarted(true)}
                          className="mt-6 flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-extrabold text-black mx-auto shadow-[0_4px_24px_rgba(167,139,250,0.4)]"
                          style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed)" }}
                        >
                          <Play size={15} fill="black" /> Commencer le quiz
                        </motion.button>
                      </div>
                    ) : quizDone ? (
                      <div className="relative text-center py-4 space-y-4">
                        <div className="text-4xl">{score >= 4 ? "🏆" : score >= 3 ? "⭐" : "💪"}</div>
                        <h3 className="text-2xl font-black text-white">{score}/5 correct{score > 1 ? "s" : ""}</h3>
                        <p className="text-sm text-white/45">{score === 5 ? "Parfait ! Vous maîtrisez ces bases IA." : score >= 3 ? "Bon résultat ! Revoyez les questions manquées." : "Continuez à apprendre, vous progressez !"}</p>
                        {/* Score bar */}
                        <div className="mx-auto max-w-xs">
                          <div className="h-3 overflow-hidden rounded-full bg-white/8">
                            <div className="h-full rounded-full transition-all" style={{ width: `${(score / 5) * 100}%`, background: score >= 4 ? "#4ade80" : score >= 3 ? "#f59e0b" : "#f87171" }} />
                          </div>
                        </div>
                        <button onClick={resetQuiz} className="flex items-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-6 py-2.5 text-sm font-bold text-white/70 transition hover:text-white mx-auto">
                          <RefreshCw size={13} /> Rejouer
                        </button>
                      </div>
                    ) : (
                      <div className="relative space-y-5">
                        {/* Progress */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white/40">Question {qIndex + 1}/5</span>
                          <div className="flex gap-1">
                            {QUIZ.map((_, i) => (
                              <div key={i} className={`h-1.5 w-6 rounded-full transition-all ${i < qIndex ? "bg-[#a78bfa]" : i === qIndex ? "bg-[#a78bfa] opacity-60" : "bg-white/10"}`} />
                            ))}
                          </div>
                        </div>

                        {/* Question */}
                        <AnimatePresence mode="wait">
                          <motion.div key={qIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                            <p className="text-base font-bold text-white leading-snug">{QUIZ[qIndex].q}</p>
                            <div className="mt-4 space-y-2.5">
                              {QUIZ[qIndex].opts.map((opt, i) => {
                                const isCorrect = i === QUIZ[qIndex].correct;
                                const isSelected = selected === i;
                                const revealed = selected !== null;
                                return (
                                  <motion.button
                                    key={i}
                                    whileHover={!revealed ? { x: 4 } : {}}
                                    onClick={() => handleAnswer(i)}
                                    disabled={revealed}
                                    className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all ${
                                      !revealed ? "border-white/8 bg-white/4 text-white/70 hover:border-white/20 hover:text-white" :
                                      isCorrect ? "border-[rgba(74,222,128,0.5)] bg-[rgba(74,222,128,0.12)] text-[#4ade80]" :
                                      isSelected ? "border-[rgba(248,113,113,0.5)] bg-[rgba(248,113,113,0.12)] text-[#f87171]" :
                                      "border-white/5 bg-white/2 text-white/25"
                                    }`}
                                  >
                                    <span className="mr-3 font-black">{String.fromCharCode(65 + i)}.</span>{opt}
                                    {revealed && isCorrect && <CheckCircle2 size={14} className="inline ml-2 text-[#4ade80]" />}
                                  </motion.button>
                                );
                              })}
                            </div>
                            {/* Explication */}
                            {selected !== null && (
                              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[rgba(167,139,250,0.08)] px-4 py-3">
                                <p className="text-xs font-bold text-[#a78bfa]">💡 Explication</p>
                                <p className="mt-1 text-xs text-white/55 leading-relaxed">{QUIZ[qIndex].expl}</p>
                              </motion.div>
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ══ FLASH CARDS ══ */}
              {activeGame === "flash" && (
                <motion.div key="flash-game" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setActiveGame(null); setCardIndex(0); setFlipped(false); }} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70">
                      <ChevronLeft size={13} /> Retour
                    </button>
                    <span className="text-sm font-bold text-white">🃏 Flash Cards IA</span>
                    <span className="ml-auto text-xs text-white/30">{cardIndex + 1}/{FLASH_CARDS.length}</span>
                  </div>

                  {/* Card */}
                  <div
                    className="relative cursor-pointer"
                    style={{ perspective: "1000px" }}
                    onClick={() => setFlipped(f => !f)}
                  >
                    <motion.div
                      animate={{ rotateY: flipped ? 180 : 0 }}
                      transition={{ duration: 0.5, ease }}
                      style={{ transformStyle: "preserve-3d", position: "relative" }}
                      className="h-52"
                    >
                      {/* Front */}
                      <div
                        className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[1.75rem] border border-[rgba(56,189,248,0.25)] bg-[rgba(15,17,23,0.8)] p-6 text-center"
                        style={{ backfaceVisibility: "hidden" }}
                      >
                        <div className="pointer-events-none absolute inset-0 rounded-[1.75rem]" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(56,189,248,0.08) 0%, transparent 70%)" }} />
                        <span className="relative text-4xl font-black text-[#38bdf8]">{FLASH_CARDS[cardIndex].term}</span>
                        <p className="relative text-xs text-white/30">Cliquez pour révéler la définition</p>
                      </div>
                      {/* Back */}
                      <div
                        className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[1.75rem] border border-[rgba(56,189,248,0.35)] bg-[rgba(15,20,35,0.9)] p-6 text-center"
                        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                      >
                        <div className="pointer-events-none absolute inset-0 rounded-[1.75rem]" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(56,189,248,0.12) 0%, transparent 70%)" }} />
                        <p className="relative text-sm font-bold text-[#38bdf8]">{FLASH_CARDS[cardIndex].term}</p>
                        <p className="relative text-sm leading-relaxed text-white/70">{FLASH_CARDS[cardIndex].def}</p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={prevCard} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 hover:text-white">
                      <ChevronLeft size={18} />
                    </motion.button>
                    <div className="flex gap-1.5">
                      {FLASH_CARDS.map((_, i) => (
                        <button key={i} onClick={() => { setFlipped(false); setTimeout(() => setCardIndex(i), 150); }} className={`h-1.5 rounded-full transition-all ${i === cardIndex ? "w-5 bg-[#38bdf8]" : "w-1.5 bg-white/15"}`} />
                      ))}
                    </div>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={nextCard} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 hover:text-white">
                      <ChevronRight size={18} />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ══ DÉFI DU JOUR ══ */}
              {activeGame === "defi" && (
                <motion.div key="defi-game" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setActiveGame(null); setDefiDone(false); setPrompt(""); setShowExemple(false); }} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70">
                      <ChevronLeft size={13} /> Retour
                    </button>
                    <span className="text-sm font-bold text-white">🎯 Défi du jour</span>
                  </div>

                  <div className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(245,158,11,0.25)] bg-[rgba(15,17,23,0.75)] p-6 space-y-5">
                    <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(245,158,11,0.07) 0%, transparent 60%)" }} />

                    {/* Mission */}
                    <div className="relative">
                      <span className="text-[0.6rem] font-bold uppercase tracking-widest text-[#f59e0b]">Mission du jour</span>
                      <h3 className="mt-1 text-lg font-black text-white">{DEFI.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/55">{DEFI.desc}</p>
                    </div>

                    {/* Tips */}
                    <div className="relative rounded-xl border border-white/6 bg-white/3 p-4 space-y-2">
                      <p className="text-xs font-bold text-white/50">💡 Tips pour un bon prompt :</p>
                      {DEFI.tips.map((tip) => (
                        <p key={tip} className="flex items-start gap-2 text-xs text-white/40">
                          <span className="mt-0.5 shrink-0 text-[#f59e0b]">→</span>{tip}
                        </p>
                      ))}
                    </div>

                    {/* Textarea */}
                    <div className="relative">
                      <textarea
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        disabled={defiDone}
                        placeholder="Écrivez votre prompt ici..."
                        rows={4}
                        className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 placeholder-white/20 outline-none focus:border-[rgba(245,158,11,0.4)] transition-colors disabled:opacity-50"
                      />
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[0.6rem] text-white/25">{prompt.length} caractères</span>
                        {!defiDone && (
                          <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            disabled={prompt.trim().length < 20}
                            onClick={() => setDefiDone(true)}
                            className="flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-extrabold text-black disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
                          >
                            <Send size={12} /> Valider mon prompt
                          </motion.button>
                        )}
                      </div>
                    </div>

                    {/* Résultat */}
                    {defiDone && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="rounded-xl border border-[rgba(74,222,128,0.25)] bg-[rgba(74,222,128,0.08)] px-4 py-3">
                          <p className="text-sm font-bold text-[#4ade80]">✅ Bravo ! Prompt soumis.</p>
                          <p className="mt-1 text-xs text-white/45">Votre prompt a été enregistré. Comparez-le maintenant avec l'exemple expert.</p>
                        </div>

                        <button
                          onClick={() => setShowExemple(e => !e)}
                          className="flex w-full items-center justify-between rounded-xl border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.08)] px-4 py-3 text-sm font-bold text-[#f59e0b] transition hover:bg-[rgba(245,158,11,0.12)]"
                        >
                          Voir l'exemple expert
                          <ChevronRight size={14} className={`transition-transform ${showExemple ? "rotate-90" : ""}`} />
                        </button>

                        <AnimatePresence>
                          {showExemple && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                              <div className="rounded-xl border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.05)] p-4">
                                <p className="mb-2 text-[0.6rem] font-bold uppercase tracking-widest text-[#f59e0b]">Exemple expert</p>
                                <p className="text-xs leading-relaxed text-white/60 italic">"{DEFI.exemple}"</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <button onClick={() => { setDefiDone(false); setPrompt(""); setShowExemple(false); }} className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors">
                          <RefreshCw size={11} /> Recommencer
                        </button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
