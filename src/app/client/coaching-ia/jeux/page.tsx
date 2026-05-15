"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, ChevronLeft, ChevronRight, CheckCircle2, Trophy, Play,
  RefreshCw, Zap, Star, Timer, Shuffle, XCircle, Send,
  Sparkles, Target, RotateCcw, Award,
} from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const QUIZ_QUESTIONS = [
  { q: "Que signifie 'prompt engineering' ?", opts: ["Programmer un robot", "Rédiger des instructions efficaces pour guider une IA", "Créer une app mobile", "Coder en Python"], correct: 1, expl: "Le prompt engineering consiste à formuler des instructions précises pour obtenir les meilleures réponses d'un LLM." },
  { q: "Quel modèle est derrière ChatGPT ?", opts: ["BERT", "LLaMA", "GPT-4", "Mistral"], correct: 2, expl: "ChatGPT est basé sur GPT-4o (Generative Pre-trained Transformer), développé par OpenAI." },
  { q: "Que signifie 'hallucination' dans le contexte de l'IA ?", opts: ["Un bug visuel", "L'IA invente des infos fausses", "Une technique de prompt", "Un type de modèle"], correct: 1, expl: "Une hallucination désigne le phénomène où un modèle génère des informations fausses présentées avec confiance." },
  { q: "Quelle est la meilleure façon d'obtenir une réponse précise ?", opts: ["Poser une question courte", "Donner contexte + rôle + tâche claire", "Écrire en majuscules", "Poser plusieurs questions à la fois"], correct: 1, expl: "Un bon prompt inclut : un contexte précis, un rôle assigné à l'IA, et une tâche clairement définie." },
  { q: "Qu'est-ce qu'un 'agent IA' ?", opts: ["Un commercial IA", "Un modèle qui effectue des actions autonomes", "Un antivirus intelligent", "Un assistant vocal simple"], correct: 1, expl: "Un agent IA est un système capable d'agir de façon autonome : chercher des infos, exécuter du code, prendre des décisions." },
  { q: "Que signifie RAG ?", opts: ["Rapid AI Generation", "Retrieval-Augmented Generation", "Random Answer Generator", "Real Agent Gateway"], correct: 1, expl: "RAG connecte un LLM à une base de données externe pour des réponses plus précises et actualisées." },
  { q: "Quelle est la fonction de la 'température' dans un LLM ?", opts: ["Refroidir le serveur", "Contrôler la créativité des réponses", "Accélérer le traitement", "Réduire les coûts"], correct: 1, expl: "Température basse = réponses précises et déterministes. Température haute = réponses créatives et variées." },
  { q: "Qu'est-ce que le fine-tuning ?", opts: ["Optimiser les prompts", "Réentraîner un modèle sur des données spécifiques", "Ajuster l'interface", "Filtrer les réponses"], correct: 1, expl: "Le fine-tuning consiste à réentraîner un modèle existant sur des données spécifiques pour l'adapter à un domaine." },
  { q: "Combien de tokens représente environ un mot en français ?", opts: ["0.25 token", "0.75 token", "2 tokens", "5 tokens"], correct: 1, expl: "En français, un token représente environ ¾ d'un mot. Les textes français utilisent donc plus de tokens qu'en anglais." },
  { q: "Quelle technique force l'IA à raisonner étape par étape ?", opts: ["Few-shot", "Chain of Thought", "RAG", "Fine-tuning"], correct: 1, expl: "Chain of Thought (CoT) demande à l'IA de réfléchir pas-à-pas avant de répondre, améliorant la précision sur des problèmes complexes." },
];

const FLASH_CARDS = [
  { term: "LLM", def: "Large Language Model — modèle entraîné sur de vastes corpus de texte pour comprendre et générer du langage naturel." },
  { term: "Prompt", def: "Instruction ou question envoyée à une IA. La qualité du prompt détermine directement la qualité de la réponse." },
  { term: "Token", def: "Unité de texte traitée par les LLMs. 1 token ≈ ¾ d'un mot. Les modèles ont une limite de tokens par requête." },
  { term: "Fine-tuning", def: "Réentraîner un modèle pré-existant sur des données spécifiques pour l'adapter à un domaine particulier." },
  { term: "RAG", def: "Retrieval-Augmented Generation — connecter une IA à une base de données externe pour des réponses plus précises." },
  { term: "Température", def: "Paramètre qui contrôle la créativité de l'IA. 0 = précis et déterministe, 1 = créatif et varié." },
  { term: "Chain of Thought", def: "Technique de prompt qui demande à l'IA de 'penser étape par étape', améliorant la précision sur des raisonnements complexes." },
  { term: "Multimodal", def: "Modèle capable de traiter plusieurs types de données simultanément : texte, images, audio, vidéo." },
  { term: "Context Window", def: "La quantité maximale de texte (en tokens) qu'un modèle peut analyser à la fois dans une conversation." },
  { term: "Embedding", def: "Représentation numérique d'un texte dans un espace vectoriel, permettant à l'IA de mesurer la similarité sémantique." },
  { term: "Hallucination", def: "Phénomène où un LLM génère des informations fausses mais les présente avec confiance, comme si elles étaient vraies." },
  { term: "Zero-shot", def: "Demander à une IA d'effectuer une tâche sans lui fournir d'exemple. Fonctionne bien pour les tâches simples et directes." },
];

const SPEED_QUESTIONS = [
  { q: "ChatGPT est développé par ?", opts: ["Google", "OpenAI", "Meta", "Microsoft"], correct: 1 },
  { q: "LLM signifie ?", opts: ["Large Logic Model", "Large Language Model", "Learning Language Module", "Linear LLM"], correct: 1 },
  { q: "Le modèle Claude est développé par ?", opts: ["OpenAI", "Google", "Anthropic", "Meta"], correct: 2 },
  { q: "LLaMA est un modèle de ?", opts: ["Google", "Apple", "Meta", "Amazon"], correct: 2 },
  { q: "Gemini est le modèle de ?", opts: ["Apple", "Google", "Microsoft", "OpenAI"], correct: 1 },
  { q: "Un 'token' équivaut à environ ?", opts: ["1 mot", "¾ d'un mot", "1 phrase", "1 paragraphe"], correct: 1 },
  { q: "RAG signifie ?", opts: ["Rapid AI Generation", "Retrieval-Augmented Generation", "Real-time AI Gateway", "Random Answer Generation"], correct: 1 },
  { q: "Mistral est un modèle ?", opts: ["Américain", "Français", "Allemand", "Japonais"], correct: 1 },
];

const VRAI_FAUX = [
  { q: "ChatGPT peut se tromper et inventer des informations.", ans: true, expl: "Oui — c'est ce qu'on appelle une 'hallucination'. Toujours vérifier les infos factuelles." },
  { q: "Un prompt plus long donne toujours une meilleure réponse.", ans: false, expl: "Non. La précision et le contexte comptent plus que la longueur. Un prompt court et bien structuré peut être très efficace." },
  { q: "GPT-4 a été développé par OpenAI.", ans: true, expl: "Exact. GPT-4 (Generative Pre-trained Transformer 4) est le modèle principal d'OpenAI derrière ChatGPT." },
  { q: "Il est possible d'utiliser l'IA localement sur son PC sans internet.", ans: true, expl: "Oui, avec des outils comme Ollama + LLaMA 3. Idéal pour la confidentialité des données sensibles." },
  { q: "L'IA a des émotions et une conscience propre.", ans: false, expl: "Non. Les LLMs génèrent du texte statistiquement probable. Ils simulent le langage, sans conscience ni émotions réelles." },
  { q: "Le prompt engineering est une compétence clé pour les entrepreneurs.", ans: true, expl: "Absolument. Savoir formuler des prompts efficaces démultiplie la qualité et la vitesse des résultats obtenus avec l'IA." },
  { q: "On peut partager des données clients confidentielles dans ChatGPT sans risque.", ans: false, expl: "Non. Les données envoyées à ChatGPT peuvent être utilisées pour l'entraînement. Respectez toujours le RGPD." },
  { q: "Fine-tuning et prompt engineering sont la même chose.", ans: false, expl: "Non. Le fine-tuning modifie les poids du modèle via un réentraînement. Le prompt engineering optimise simplement l'instruction." },
];

const DEFI = {
  title: "Automatise ta relance client",
  desc: "Écris un prompt pour demander à ChatGPT de rédiger un email de relance professionnel pour un client qui n'a pas répondu depuis 7 jours. Utilisez la structure : Rôle + Contexte + Tâche + Contraintes.",
  tips: [
    "Donnez un rôle expert à l'IA (ex: 'Tu es un commercial expert')",
    "Précisez le contexte : type de service, durée sans réponse, nom du client",
    "Définissez le ton souhaité : professionnel, chaleureux, urgent...",
    "Demandez un objet d'email + corps + CTA précis",
  ],
  exemple: "Rôle : Tu es un commercial expert en relation client B2B.\n\nContexte : Mon client Marc n'a pas répondu à notre devis de prestation de conseil depuis 7 jours.\n\nTâche : Rédige un email de relance professionnel et chaleureux.\n\nContraintes : Max 120 mots. Inclure objet accrocheur + rappel de valeur + proposition d'appel 15 min cette semaine.",
};

type GameId = "quiz" | "flash" | "speed" | "vraifaux" | "defi" | null;

export default function JeuxPage() {
  const [activeGame, setActiveGame] = useState<GameId>(null);

    const [quizStarted, setQuizStarted] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizDone, setQuizDone] = useState(false);

    const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

    const [speedIndex, setSpeedIndex] = useState(0);
  const [speedScore, setSpeedScore] = useState(0);
  const [speedDone, setSpeedDone] = useState(false);
  const [speedSelected, setSpeedSelected] = useState<number | null>(null);

    const [vfIndex, setVfIndex] = useState(0);
  const [vfAnswer, setVfAnswer] = useState<boolean | null>(null);
  const [vfScore, setVfScore] = useState(0);
  const [vfDone, setVfDone] = useState(false);

    const [prompt, setPrompt] = useState("");
  const [defiDone, setDefiDone] = useState(false);
  const [showExemple, setShowExemple] = useState(false);

    const quizScore = answers.filter((a, i) => a === QUIZ_QUESTIONS[i].correct).length;
  function handleQuizAnswer(idx: number) {
    if (selected !== null) return;
    setSelected(idx);
    setTimeout(() => {
      const next = [...answers, idx];
      setAnswers(next);
      if (qIndex + 1 >= QUIZ_QUESTIONS.length) setQuizDone(true);
      else { setQIndex(q => q + 1); setSelected(null); }
    }, 900);
  }
  function resetQuiz() { setQIndex(0); setSelected(null); setAnswers([]); setQuizDone(false); setQuizStarted(false); }

    function nextCard() { setFlipped(false); setTimeout(() => setCardIndex(i => (i + 1) % FLASH_CARDS.length), 150); }
  function prevCard() { setFlipped(false); setTimeout(() => setCardIndex(i => (i - 1 + FLASH_CARDS.length) % FLASH_CARDS.length), 150); }

    function handleSpeedAnswer(idx: number) {
    if (speedSelected !== null) return;
    setSpeedSelected(idx);
    const correct = idx === SPEED_QUESTIONS[speedIndex].correct;
    if (correct) setSpeedScore(s => s + 1);
    setTimeout(() => {
      if (speedIndex + 1 >= SPEED_QUESTIONS.length) setSpeedDone(true);
      else { setSpeedIndex(i => i + 1); setSpeedSelected(null); }
    }, 600);
  }
  function resetSpeed() { setSpeedIndex(0); setSpeedScore(0); setSpeedDone(false); setSpeedSelected(null); }

    function handleVF(ans: boolean) {
    if (vfAnswer !== null) return;
    setVfAnswer(ans);
    if (ans === VRAI_FAUX[vfIndex].ans) setVfScore(s => s + 1);
    setTimeout(() => {
      if (vfIndex + 1 >= VRAI_FAUX.length) setVfDone(true);
      else { setVfIndex(i => i + 1); setVfAnswer(null); }
    }, 1200);
  }
  function resetVF() { setVfIndex(0); setVfAnswer(null); setVfScore(0); setVfDone(false); }

  const GAMES = [
    { id: "quiz",    color: "#a78bfa", title: "Quiz IA",        badge: "10 Q",      desc: "10 questions sur l'IA avec explications détaillées après chaque réponse." },
    { id: "flash",   color: "#38bdf8", title: "Flash Cards",    badge: "12 cartes", desc: "12 termes clés de l'IA à maîtriser. Cliquez sur la carte pour révéler la définition." },
    { id: "speed",   color: "#f59e0b", title: "Speed Quiz",     badge: "8 Q — 30s", desc: "8 questions rapides. Le but : répondre le plus vite possible. Réflexes et connaissance !" },
    { id: "vraifaux",color: "#4ade80", title: "Vrai ou Faux",   badge: "8 Q",       desc: "8 affirmations sur l'IA. Vrai ou faux ? Testez vos certitudes et découvrez la vérité." },
    { id: "defi",    color: "#f472b6", title: "Défi du jour",   badge: "Prompt",    desc: "Rédigez le meilleur prompt pour une mission réelle d'entrepreneur. Comparez avec l'expert." },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0a0f1e]">

            <div className="relative z-10 border-b border-white/6 bg-white/[0.025] px-5 py-3.5 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <Link href="/client/coaching-ia" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
            <ChevronLeft size={13} /> Coaching IA
          </Link>
          <span className="text-white/15">·</span>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(167,139,250,0.15)] border border-[rgba(167,139,250,0.25)]">
              <Trophy size={13} className="text-[#a78bfa]" />
            </div>
            <span className="text-sm font-extrabold text-white">Jeux IA</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-4xl space-y-6 px-5 py-6 sm:px-8">

                {!activeGame && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="space-y-5"
          >
            <div>
              <h1 className="text-xl font-bold text-white">Choisissez votre jeu</h1>
              <p className="mt-1 text-sm text-white/35">5 jeux pour apprendre l'IA en vous amusant</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {GAMES.map(({ id, color, title, badge, desc }, i) => (
                <motion.button
                  key={id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease, delay: i * 0.06 }}
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveGame(id)}
                  className="relative overflow-hidden rounded-xl border border-white/8 bg-white/[0.025] p-5 text-left transition-all hover:border-white/15"
                >
                  <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${color}10 0%, transparent 60%)` }} />
                  <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }} />

                  <div className="relative mb-4 flex items-start justify-between">
                    <span className="rounded-full px-2.5 py-0.5 text-[0.6rem] font-bold" style={{ color, backgroundColor: color + "15", border: `1px solid ${color}25` }}>{badge}</span>
                  </div>
                  <p className="relative text-sm font-extrabold text-white">{title}</p>
                  <p className="relative mt-1.5 text-xs leading-relaxed text-white/40">{desc}</p>
                  <div className="relative mt-4 flex items-center gap-1.5 text-xs font-bold" style={{ color }}>
                    <Play size={10} fill={color} /> Jouer
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════
            QUIZ IA (10 questions)
        ══════════════════════════════ */}
        {activeGame === "quiz" && (
          <motion.div key="quiz" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={() => { setActiveGame(null); resetQuiz(); }} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
                <ChevronLeft size={13} /> Jeux
              </button>
              <span className="text-sm font-bold text-white">Quiz IA — 10 questions</span>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-[rgba(167,139,250,0.25)] bg-white/[0.025] p-6">
              <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(167,139,250,0.08) 0%, transparent 60%)" }} />

              {!quizStarted ? (
                <div className="relative text-center py-6 space-y-4">
                  <h2 className="text-2xl font-bold text-white">Quiz IA</h2>
                  <p className="text-sm text-white/40">10 questions · Explication après chaque réponse · Score final</p>
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => setQuizStarted(true)}
                    className="inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-extrabold text-black shadow-[0_4px_24px_rgba(167,139,250,0.4)]"
                    style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed)" }}>
                    <Play size={14} fill="black" /> Commencer
                  </motion.button>
                </div>
              ) : quizDone ? (
                <div className="relative text-center py-6 space-y-4">
                  <h2 className="text-3xl font-bold text-white">{quizScore}/10</h2>
                  <p className="text-sm text-white/40">{quizScore === 10 ? "Parfait ! Vous maîtrisez les bases de l'IA." : quizScore >= 7 ? "Excellent résultat !" : quizScore >= 5 ? "Bon début — continuez à apprendre !" : "Relisez les cours et recommencez !"}</p>
                  <div className="mx-auto max-w-xs">
                    <div className="h-3 overflow-hidden rounded-full bg-white/8">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${quizScore * 10}%`, background: quizScore >= 7 ? "#4ade80" : quizScore >= 5 ? "#f59e0b" : "#f87171" }} />
                    </div>
                  </div>
                  <button onClick={resetQuiz} className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-6 py-2.5 text-sm font-bold text-white/60 hover:text-white transition-colors">
                    <RefreshCw size={13} /> Rejouer
                  </button>
                </div>
              ) : (
                <div className="relative space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/40">Question {qIndex + 1}/10</span>
                    <div className="flex gap-1">
                      {QUIZ_QUESTIONS.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all ${i < qIndex ? "w-4 bg-[#a78bfa]" : i === qIndex ? "w-4 bg-[#a78bfa] opacity-50" : "w-4 bg-white/10"}`} />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-[#4ade80]">{answers.filter((a, i) => a === QUIZ_QUESTIONS[i].correct).length} bonnes</span>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div key={qIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                      <p className="text-base font-bold text-white leading-snug mb-4">{QUIZ_QUESTIONS[qIndex].q}</p>
                      <div className="space-y-2.5">
                        {QUIZ_QUESTIONS[qIndex].opts.map((opt, i) => {
                          const isCorrect = i === QUIZ_QUESTIONS[qIndex].correct;
                          const isSelected = selected === i;
                          const revealed = selected !== null;
                          return (
                            <motion.button key={i} whileHover={!revealed ? { x: 4 } : {}}
                              onClick={() => handleQuizAnswer(i)} disabled={revealed}
                              className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all ${
                                !revealed ? "border-white/8 bg-white/4 text-white/70 hover:border-white/20 hover:text-white" :
                                isCorrect ? "border-[rgba(74,222,128,0.5)] bg-[rgba(74,222,128,0.12)] text-[#4ade80]" :
                                isSelected ? "border-[rgba(248,113,113,0.5)] bg-[rgba(248,113,113,0.12)] text-[#f87171]" :
                                "border-white/5 bg-white/2 text-white/25"
                              }`}>
                              <span className="mr-3 font-semibold">{String.fromCharCode(65 + i)}.</span>{opt}
                              {revealed && isCorrect && <CheckCircle2 size={14} className="inline ml-2 text-[#4ade80]" />}
                            </motion.button>
                          );
                        })}
                      </div>
                      {selected !== null && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          className="mt-4 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[rgba(167,139,250,0.08)] px-4 py-3">
                          <p className="text-xs font-bold text-[#a78bfa]">Explication</p>
                          <p className="mt-1 text-xs text-white/55 leading-relaxed">{QUIZ_QUESTIONS[qIndex].expl}</p>
                        </motion.div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════
            FLASH CARDS (12 cartes)
        ══════════════════════════════ */}
        {activeGame === "flash" && (
          <motion.div key="flash" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={() => { setActiveGame(null); setCardIndex(0); setFlipped(false); }} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
                <ChevronLeft size={13} /> Jeux
              </button>
              <span className="text-sm font-bold text-white">Flash Cards IA</span>
              <span className="ml-auto text-xs text-white/30">{cardIndex + 1}/{FLASH_CARDS.length}</span>
            </div>

            <p className="text-center text-xs text-white/35">Cliquez sur la carte pour révéler la définition</p>

            <div className="relative cursor-pointer" style={{ perspective: "1000px" }} onClick={() => setFlipped(f => !f)}>
              <motion.div
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.5, ease }}
                style={{ transformStyle: "preserve-3d", position: "relative" }}
                className="h-56"
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl border border-[rgba(56,189,248,0.25)] bg-white/[0.025] p-6 text-center"
                  style={{ backfaceVisibility: "hidden" }}>
                  <div className="pointer-events-none absolute inset-0 rounded-2xl" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(56,189,248,0.08) 0%, transparent 70%)" }} />
                  <span className="relative text-4xl font-bold text-[#38bdf8]">{FLASH_CARDS[cardIndex].term}</span>
                  <div className="relative flex items-center gap-1.5 text-xs text-white/25">
                    <RotateCcw size={10} /> Cliquez pour retourner
                  </div>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-[rgba(56,189,248,0.35)] bg-white/[0.025] p-6 text-center"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                  <div className="pointer-events-none absolute inset-0 rounded-2xl" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(56,189,248,0.12) 0%, transparent 70%)" }} />
                  <p className="relative text-sm font-extrabold text-[#38bdf8]">{FLASH_CARDS[cardIndex].term}</p>
                  <p className="relative text-sm leading-relaxed text-white/70">{FLASH_CARDS[cardIndex].def}</p>
                </div>
              </motion.div>
            </div>

            <div className="flex items-center justify-between">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={prevCard}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 hover:text-white transition-colors">
                <ChevronLeft size={18} />
              </motion.button>
              <div className="flex flex-wrap justify-center gap-1.5 max-w-xs">
                {FLASH_CARDS.map((_, i) => (
                  <button key={i} onClick={() => { setFlipped(false); setTimeout(() => setCardIndex(i), 150); }}
                    className={`h-1.5 rounded-full transition-all ${i === cardIndex ? "w-5 bg-[#38bdf8]" : "w-1.5 bg-white/15"}`} />
                ))}
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={nextCard}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 hover:text-white transition-colors">
                <ChevronRight size={18} />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════
            SPEED QUIZ (8 questions)
        ══════════════════════════════ */}
        {activeGame === "speed" && (
          <motion.div key="speed" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={() => { setActiveGame(null); resetSpeed(); }} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
                <ChevronLeft size={13} /> Jeux
              </button>
              <span className="text-sm font-bold text-white">Speed Quiz</span>
              {!speedDone && <span className="ml-auto rounded-full bg-[rgba(245,158,11,0.15)] border border-[rgba(245,158,11,0.25)] px-2.5 py-0.5 text-xs font-bold text-[#f59e0b]">Score: {speedScore}</span>}
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-[rgba(245,158,11,0.25)] bg-white/[0.025] p-6">
              <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(245,158,11,0.07) 0%, transparent 60%)" }} />

              {speedDone ? (
                <div className="relative text-center py-6 space-y-4">
                  <h2 className="text-2xl font-bold text-white">{speedScore}/{SPEED_QUESTIONS.length}</h2>
                  <p className="text-sm text-white/40">{speedScore === SPEED_QUESTIONS.length ? "Parfait ! Vous connaissez tous les acteurs de l'IA." : speedScore >= 5 ? "Bon résultat !" : "Relisez le module 2 sur les modèles IA !"}</p>
                  <button onClick={resetSpeed} className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-6 py-2.5 text-sm font-bold text-white/60 hover:text-white transition-colors">
                    <RefreshCw size={13} /> Rejouer
                  </button>
                </div>
              ) : (
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/40">{speedIndex + 1}/{SPEED_QUESTIONS.length}</span>
                    <div className="flex gap-1">
                      {SPEED_QUESTIONS.map((_, i) => (
                        <div key={i} className={`h-1.5 w-5 rounded-full transition-all ${i < speedIndex ? "bg-[#f59e0b]" : i === speedIndex ? "bg-[#f59e0b] opacity-50" : "bg-white/10"}`} />
                      ))}
                    </div>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div key={speedIndex} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.18 }}>
                      <p className="text-lg font-extrabold text-white mb-4">{SPEED_QUESTIONS[speedIndex].q}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {SPEED_QUESTIONS[speedIndex].opts.map((opt, i) => {
                          const isCorrect = i === SPEED_QUESTIONS[speedIndex].correct;
                          const isSelected = speedSelected === i;
                          const revealed = speedSelected !== null;
                          return (
                            <motion.button key={i} whileHover={!revealed ? { scale: 1.02 } : {}} whileTap={!revealed ? { scale: 0.98 } : {}}
                              onClick={() => handleSpeedAnswer(i)} disabled={revealed}
                              className={`rounded-xl border p-3 text-sm font-bold transition-all ${
                                !revealed ? "border-white/10 bg-white/5 text-white/70 hover:border-[rgba(245,158,11,0.4)] hover:text-white" :
                                isCorrect ? "border-[rgba(74,222,128,0.5)] bg-[rgba(74,222,128,0.12)] text-[#4ade80]" :
                                isSelected ? "border-[rgba(248,113,113,0.5)] bg-[rgba(248,113,113,0.12)] text-[#f87171]" :
                                "border-white/5 bg-white/2 text-white/20"
                              }`}>
                              {opt}
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════
            VRAI OU FAUX (8 questions)
        ══════════════════════════════ */}
        {activeGame === "vraifaux" && (
          <motion.div key="vraifaux" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={() => { setActiveGame(null); resetVF(); }} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
                <ChevronLeft size={13} /> Jeux
              </button>
              <span className="text-sm font-bold text-white">Vrai ou Faux</span>
              {!vfDone && <span className="ml-auto rounded-full bg-[rgba(74,222,128,0.15)] border border-[rgba(74,222,128,0.25)] px-2.5 py-0.5 text-xs font-bold text-[#4ade80]">Score: {vfScore}</span>}
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-[rgba(74,222,128,0.2)] bg-white/[0.025] p-6">
              <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(74,222,128,0.06) 0%, transparent 60%)" }} />

              {vfDone ? (
                <div className="relative text-center py-6 space-y-4">
                  <h2 className="text-2xl font-bold text-white">{vfScore}/{VRAI_FAUX.length}</h2>
                  <p className="text-sm text-white/40">{vfScore >= 7 ? "Excellent ! Vous connaissez bien l'IA." : "Relisez les cours pour consolider vos bases."}</p>
                  <button onClick={resetVF} className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-6 py-2.5 text-sm font-bold text-white/60 hover:text-white transition-colors">
                    <RefreshCw size={13} /> Rejouer
                  </button>
                </div>
              ) : (
                <div className="relative space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">{vfIndex + 1}/{VRAI_FAUX.length}</span>
                    <div className="flex gap-1">
                      {VRAI_FAUX.map((_, i) => (
                        <div key={i} className={`h-1.5 w-6 rounded-full transition-all ${i < vfIndex ? "bg-[#4ade80]" : i === vfIndex ? "bg-[#4ade80] opacity-50" : "bg-white/10"}`} />
                      ))}
                    </div>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div key={vfIndex} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.2 }}>
                      <p className="text-lg font-extrabold text-white leading-snug text-center mb-6">{VRAI_FAUX[vfIndex].q}</p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "VRAI", value: true, color: "#4ade80" },
                          { label: "FAUX", value: false, color: "#f87171" },
                        ].map(({ label, value, color }) => {
                          const isSelected = vfAnswer === value;
                          const isCorrect = value === VRAI_FAUX[vfIndex].ans;
                          const revealed = vfAnswer !== null;
                          return (
                            <motion.button key={label} whileHover={!revealed ? { scale: 1.04 } : {}} whileTap={!revealed ? { scale: 0.96 } : {}}
                              onClick={() => handleVF(value)} disabled={revealed}
                              className={`rounded-2xl border py-5 text-base font-extrabold transition-all ${
                                !revealed ? "border-white/10 bg-white/5 text-white/70 hover:text-white" :
                                isCorrect ? "border-[rgba(74,222,128,0.4)] bg-[rgba(74,222,128,0.12)] text-[#4ade80]" :
                                isSelected ? "border-[rgba(248,113,113,0.4)] bg-[rgba(248,113,113,0.1)] text-[#f87171]" :
                                "border-white/5 bg-white/2 text-white/20"
                              }`}>
                              {label}
                            </motion.button>
                          );
                        })}
                      </div>
                      {vfAnswer !== null && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          className={`mt-4 rounded-xl border px-4 py-3 ${vfAnswer === VRAI_FAUX[vfIndex].ans ? "border-[rgba(74,222,128,0.25)] bg-[rgba(74,222,128,0.08)]" : "border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.08)]"}`}>
                          <p className={`text-xs font-bold mb-1 ${vfAnswer === VRAI_FAUX[vfIndex].ans ? "text-[#4ade80]" : "text-[#f87171]"}`}>
                            {vfAnswer === VRAI_FAUX[vfIndex].ans ? "Bonne réponse !" : "Mauvaise réponse"}
                          </p>
                          <p className="text-xs text-white/50 leading-relaxed">{VRAI_FAUX[vfIndex].expl}</p>
                        </motion.div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════
            DÉFI DU JOUR
        ══════════════════════════════ */}
        {activeGame === "defi" && (
          <motion.div key="defi" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={() => { setActiveGame(null); setDefiDone(false); setPrompt(""); setShowExemple(false); }} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
                <ChevronLeft size={13} /> Jeux
              </button>
              <span className="text-sm font-bold text-white">Défi du jour</span>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-[rgba(244,114,182,0.2)] bg-white/[0.025] p-6 space-y-5">
              <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(244,114,182,0.07) 0%, transparent 60%)" }} />

              <div className="relative">
                <span className="text-[0.65rem] font-medium text-white/35" style={{ color: "#f472b6" }}>Mission du jour</span>
                <h2 className="mt-1 text-xl font-bold text-white">{DEFI.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{DEFI.desc}</p>
              </div>

              <div className="relative rounded-xl border border-white/6 bg-white/3 p-4 space-y-2">
                <p className="text-xs font-bold text-white/50">Conseils pour un prompt parfait :</p>
                {DEFI.tips.map((tip) => (
                  <p key={tip} className="flex items-start gap-2 text-xs text-white/40">
                    <ChevronRight size={11} className="shrink-0 mt-0.5 text-[#f472b6]"/>{tip}
                  </p>
                ))}
              </div>

              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  disabled={defiDone}
                  placeholder="Rédigez votre prompt ici en utilisant la structure Rôle + Contexte + Tâche + Contraintes..."
                  rows={5}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 placeholder-white/20 outline-none focus:border-[rgba(244,114,182,0.4)] transition-colors disabled:opacity-50"
                />
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[0.6rem] text-white/25">{prompt.length} caractères</span>
                  {!defiDone && (
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      disabled={prompt.trim().length < 30}
                      onClick={() => setDefiDone(true)}
                      className="flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-extrabold text-white disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(244,114,182,0.3)]"
                      style={{ background: "linear-gradient(135deg, #f472b6, #db2777)" }}>
                      <Send size={11} /> Valider mon prompt
                    </motion.button>
                  )}
                </div>
              </div>

              {defiDone && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="rounded-xl border border-[rgba(74,222,128,0.25)] bg-[rgba(74,222,128,0.08)] px-4 py-3">
                    <p className="text-sm font-bold text-[#4ade80]">Excellent ! Prompt soumis.</p>
                    <p className="mt-1 text-xs text-white/45">Comparez maintenant votre prompt avec l'exemple expert ci-dessous.</p>
                  </div>

                  <button onClick={() => setShowExemple(e => !e)}
                    className="flex w-full items-center justify-between rounded-xl border border-[rgba(244,114,182,0.2)] bg-[rgba(244,114,182,0.08)] px-4 py-3 text-sm font-bold text-[#f472b6] transition hover:bg-[rgba(244,114,182,0.12)]">
                    Voir l'exemple expert
                    <ChevronRight size={14} className={`transition-transform ${showExemple ? "rotate-90" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {showExemple && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="rounded-xl border border-[rgba(244,114,182,0.2)] bg-[rgba(244,114,182,0.05)] p-4">
                          <p className="mb-2 text-[0.65rem] font-medium text-white/35" style={{ color: "#f472b6" }}>Exemple expert</p>
                          <pre className="text-xs leading-relaxed text-white/60 whitespace-pre-wrap font-sans italic">{DEFI.exemple}</pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button onClick={() => { setDefiDone(false); setPrompt(""); setShowExemple(false); }}
                    className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors">
                    <RefreshCw size={11} /> Recommencer
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
