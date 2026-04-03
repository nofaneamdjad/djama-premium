"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Circle, BookOpen, ChevronRight, ChevronDown,
  Bot, Send, Loader2, User, Sparkles, Calendar, Mail,
  Clock, Award, Target, TrendingUp, MessageSquare,
  ArrowRight, Lock, Play, RotateCcw, ChevronLeft,
  CreditCard, Landmark,
} from "lucide-react";
import { COACHING_MODULES, getNextChapter, type Module, type Chapter } from "@/lib/coaching-content";
import { useCoachingIAAccess } from "@/lib/use-require-coaching-ia";

const ease = [0.16, 1, 0.3, 1] as const;

/* ─────────────────────────────────────────────────────────
   PROGRESS (localStorage)
───────────────────────────────────────────────────────── */
const STORAGE_KEY = "djama_coaching_progress";

function loadProgress(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) as string[] : []);
  } catch { return new Set(); }
}

function saveProgress(completed: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
  } catch { /* storage full or unavailable */ }
}

/* ─────────────────────────────────────────────────────────
   VIEWS
───────────────────────────────────────────────────────── */
type View = "dashboard" | "chapter" | "assistant" | "booking";

/* ─────────────────────────────────────────────────────────
   COMPOSANT : MODULE SIDEBAR ITEM
───────────────────────────────────────────────────────── */
function ModuleSidebarItem({
  module, completed, total, expanded, onToggle, onSelectChapter, selectedChapterId,
}: {
  module: Module;
  completed: number;
  total: number;
  expanded: boolean;
  onToggle: () => void;
  onSelectChapter: (chapterId: string) => void;
  selectedChapterId: string | null;
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-white/[0.05]"
      >
        <span className="text-lg">{module.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-white/80">
            M{module.id} · {module.title}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: `rgb(${module.rgb})`,
                }}
              />
            </div>
            <span className="text-[0.6rem] text-white/30">{pct}%</span>
          </div>
        </div>
        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight size={12} className="text-white/30" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease }}
            className="overflow-hidden"
          >
            <div className="ml-3 mt-1 space-y-0.5 border-l border-white/[0.07] pl-3">
              {module.chapters.map((ch) => {
                const isDone   = completed > module.chapters.indexOf(ch);
                const selected = selectedChapterId === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => onSelectChapter(ch.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-all ${
                      selected
                        ? "bg-white/[0.08] text-white"
                        : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 size={11} style={{ color: `rgb(${module.rgb})`, flexShrink: 0 }} />
                    ) : (
                      <Circle size={11} className="shrink-0 text-white/20" />
                    )}
                    <span className="truncate text-[0.68rem]">{ch.title}</span>
                    <span className={`ml-auto shrink-0 text-[0.55rem] ${
                      ch.type === "exercise" ? "text-[#f9a826]" : ch.type === "quiz" ? "text-[#60a5fa]" : "text-white/20"
                    }`}>
                      {ch.type === "exercise" ? "✍️" : ch.type === "quiz" ? "❓" : "📖"}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPOSANT : CHAPTER VIEWER
───────────────────────────────────────────────────────── */
function ChapterViewer({
  module, chapter, isCompleted, onComplete, onNext, onAskAssistant,
}: {
  module: Module;
  chapter: Chapter;
  isCompleted: boolean;
  onComplete: () => void;
  onNext: () => void;
  onAskAssistant: (q: string) => void;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <span
            className="rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest"
            style={{
              background: `rgba(${module.rgb},0.12)`,
              color:       `rgb(${module.rgb})`,
              border:      `1px solid rgba(${module.rgb},0.2)`,
            }}
          >
            Module {module.id} · {module.emoji} {module.title}
          </span>
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[0.6rem] text-white/30">
            {chapter.duration}
          </span>
          {chapter.type !== "lesson" && (
            <span className={`rounded-full px-2 py-0.5 text-[0.6rem] font-bold ${
              chapter.type === "exercise"
                ? "bg-[rgba(249,168,38,0.1)] text-[#f9a826]"
                : "bg-[rgba(96,165,250,0.1)] text-[#60a5fa]"
            }`}>
              {chapter.type === "exercise" ? "✍️ Exercice" : "❓ Quiz"}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-white">{chapter.title}</h1>
        {isCompleted && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[rgba(52,211,153,0.1)] px-3 py-1 text-xs font-semibold text-[#34d399]">
            <CheckCircle2 size={12} /> Chapitre terminé
          </div>
        )}
      </div>

      {/* Intro */}
      <p className="mb-8 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-5 py-4 text-sm leading-relaxed text-white/65 italic">
        {chapter.intro}
      </p>

      {/* Key points */}
      {chapter.keyPoints && chapter.keyPoints.length > 0 && (
        <div className="mb-8 space-y-4">
          {chapter.keyPoints.map(({ title, text }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease, delay: i * 0.08 }}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5"
            >
              <div className="mb-2 flex items-center gap-2">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
                  style={{ background: `rgba(${module.rgb},0.15)`, color: `rgb(${module.rgb})` }}
                >
                  {i + 1}
                </div>
                <h3 className="text-sm font-semibold text-white">{title}</h3>
              </div>
              <p className="ml-8 text-sm leading-relaxed text-white/55">{text}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Exemple concret */}
      {chapter.example && (
        <div className="mb-8 rounded-2xl border border-[rgba(201,165,90,0.18)] bg-[rgba(201,165,90,0.05)] p-5">
          <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-widest text-[#c9a55a]">
            💡 Exemple concret
          </p>
          <p className="text-sm leading-relaxed text-[#c9a55a]/80">{chapter.example}</p>
        </div>
      )}

      {/* Exercice / Quiz */}
      {chapter.exercise && (
        <div className="mb-8 rounded-2xl border border-[rgba(249,168,38,0.2)] bg-[rgba(249,168,38,0.05)] p-5">
          <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-widest text-[#f9a826]">
            ✍️ {chapter.type === "quiz" ? "Quiz" : "Exercice pratique"}
          </p>
          <p className="mb-5 text-sm leading-relaxed text-white/60">{chapter.exercise.prompt}</p>
          <div className="space-y-2">
            {chapter.exercise.hints.map((hint, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-white/[0.04] p-3">
                <span className="mt-0.5 text-[0.65rem] font-bold text-[#f9a826]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-sm text-white/60">{hint}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => onAskAssistant(`Je travaille sur l'exercice "${chapter.title}". Peux-tu m'aider avec : ${chapter.exercise?.prompt.slice(0, 100)}…`)}
            className="mt-4 flex items-center gap-2 rounded-xl border border-[rgba(167,139,250,0.25)] bg-[rgba(167,139,250,0.08)] px-4 py-2 text-xs font-semibold text-[#a78bfa] transition hover:bg-[rgba(167,139,250,0.14)]"
          >
            <Bot size={13} /> Demander à l&apos;assistant IA
          </button>
        </div>
      )}

      {/* Tips */}
      {chapter.tips && chapter.tips.length > 0 && (
        <div className="mb-8 space-y-2">
          <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-widest text-white/30">
            💎 À retenir
          </p>
          {chapter.tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl bg-white/[0.03] px-4 py-3">
              <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-[#34d399]" />
              <p className="text-sm text-white/55">{tip}</p>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 border-t border-white/[0.07] pt-6 sm:flex-row">
        {!isCompleted ? (
          <button
            onClick={onComplete}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#a78bfa] to-[#7c6fcd] py-3 text-sm font-bold text-white shadow-[0_4px_24px_rgba(167,139,250,0.25)] transition hover:shadow-[0_4px_32px_rgba(167,139,250,0.4)]"
          >
            <CheckCircle2 size={16} /> Marquer comme terminé
          </button>
        ) : (
          <button
            onClick={onNext}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[rgba(167,139,250,0.25)] bg-[rgba(167,139,250,0.08)] py-3 text-sm font-bold text-[#a78bfa] transition hover:bg-[rgba(167,139,250,0.15)]"
          >
            Chapitre suivant <ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPOSANT : ASSISTANT IA
───────────────────────────────────────────────────────── */
type Msg = { role: "user" | "assistant"; content: string };

function AssistantPanel({ currentContext }: { currentContext?: string }) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role:    "assistant",
      content: "Bonjour ! 👋 Je suis votre assistant pédagogique IA. Posez-moi vos questions sur le programme, les concepts IA, ou demandez-moi de l'aide pour les exercices.",
    },
  ]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const newMessages: Msg[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/coaching-ia/assistant", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          messages: newMessages,
          context:  currentContext,
        }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      setMessages([...newMessages, {
        role:    "assistant",
        content: data.reply ?? data.error ?? "Erreur de réponse.",
      }]);
    } catch {
      setMessages([...newMessages, {
        role:    "assistant",
        content: "Une erreur est survenue. Réessayez dans un moment.",
      }]);
    } finally {
      setLoading(false);
    }
  }

  const SUGGESTIONS = [
    "Explique-moi les tokens de façon simple",
    "Donne-moi un exemple de prompt chain-of-thought",
    "Quels outils IA pour un freelance ?",
    "Comment mesurer le ROI de l'IA dans mon business ?",
  ];

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col">
      {/* Header */}
      <div className="border-b border-white/[0.07] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(167,139,250,0.15)]">
            <Bot size={17} className="text-[#a78bfa]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Assistant Pédagogique IA</h2>
            <p className="text-[0.65rem] text-white/30">Spécialisé sur le programme Coaching IA DJAMA</p>
          </div>
          <div className="ml-auto flex h-2 w-2 rounded-full bg-[#34d399] shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
        {/* Suggestions initiales */}
        {messages.length === 1 && (
          <div className="grid grid-cols-2 gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-left text-xs text-white/50 transition hover:border-white/[0.14] hover:text-white/80"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                msg.role === "user"
                  ? "bg-[rgba(201,165,90,0.2)]"
                  : "bg-[rgba(167,139,250,0.15)]"
              }`}
            >
              {msg.role === "user"
                ? <User size={13} className="text-[#c9a55a]" />
                : <Bot size={13} className="text-[#a78bfa]" />
              }
            </div>
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[rgba(201,165,90,0.12)] text-white/80"
                  : "border border-white/[0.07] bg-white/[0.04] text-white/70"
              }`}
              style={{ whiteSpace: "pre-wrap" }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgba(167,139,250,0.15)]">
              <Bot size={13} className="text-[#a78bfa]" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl border border-white/[0.07] bg-white/[0.04] px-4 py-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#a78bfa]"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/[0.07] px-4 py-3">
        <div className="flex items-end gap-2 rounded-2xl border border-white/[0.09] bg-white/[0.04] px-4 py-3 focus-within:border-[rgba(167,139,250,0.4)]">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Posez votre question…"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-white placeholder-white/25 outline-none"
            style={{ maxHeight: "120px" }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#a78bfa] text-white transition disabled:opacity-40"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
        <p className="mt-1.5 text-center text-[0.6rem] text-white/15">
          Entrée pour envoyer · Shift+Entrée pour nouvelle ligne
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPOSANT : RÉSERVATION EXPERT
───────────────────────────────────────────────────────── */
function BookingPanel() {
  const [name,         setName]         = useState("");
  const [email,        setEmail]        = useState("");
  const [availability, setAvailability] = useState("");
  const [goal,         setGoal]         = useState("");
  const [sending,      setSending]      = useState(false);
  const [sent,         setSent]         = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !availability) return;
    setSending(true);

    try {
      await fetch("/api/rdv", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentName:   name,
          studentName:  "Coaching IA",
          email:        email.trim(),
          level:        "Coaching IA",
          subject:      goal || "Session de coaching IA",
          availability,
          message:      goal,
        }),
      });
      setSent(true);
    } finally {
      setSending(false);
    }
  }

  const SLOTS = [
    { value: "semaine-matin",      label: "En semaine — matin (9h-12h)" },
    { value: "semaine-apres-midi", label: "En semaine — après-midi (14h-18h)" },
    { value: "semaine-soir",       label: "En semaine — soir (18h-20h)" },
    { value: "samedi",             label: "Le samedi" },
    { value: "flexible",           label: "Flexible — à définir" },
  ];

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-8">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[rgba(167,139,250,0.2)] bg-[rgba(167,139,250,0.08)] px-3 py-1 text-xs font-bold text-[#a78bfa]">
          <Calendar size={11} /> Session avec un expert
        </div>
        <h2 className="mt-2 text-xl font-bold text-white">Réservez votre coaching individuel</h2>
        <p className="mt-2 text-sm text-white/45">
          Une session de 60 min avec un expert DJAMA pour revoir vos avancées,
          débloquer vos points durs et accélérer votre progression.
        </p>
      </div>

      {/* Bénéfices */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        {[
          { icon: Target,    label: "Objectifs revus",   color: "#a78bfa" },
          { icon: TrendingUp, label: "Progression mesurée", color: "#4ade80" },
          { icon: Award,     label: "Plan ajusté",       color: "#c9a55a" },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 text-center">
            <Icon size={18} className="mx-auto mb-1.5" style={{ color }} />
            <p className="text-[0.65rem] font-medium text-white/50">{label}</p>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-[rgba(52,211,153,0.2)] bg-[rgba(52,211,153,0.06)] p-8 text-center"
          >
            <CheckCircle2 size={40} className="mx-auto mb-4 text-[#34d399]" />
            <h3 className="mb-2 text-lg font-bold text-white">Demande envoyée !</h3>
            <p className="text-sm text-white/50">
              L&apos;équipe DJAMA vous contacte sous 24h pour confirmer la date et l&apos;heure de la session.
            </p>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={handleSubmit} className="space-y-4">
            {/* Nom */}
            <div>
              <label className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-widest text-white/30">
                Votre nom
              </label>
              <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                <User size={14} className="text-white/25" />
                <input
                  type="text"
                  placeholder="Prénom Nom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/20 outline-none"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-widest text-white/30">
                Email
              </label>
              <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                <Mail size={14} className="text-white/25" />
                <input
                  type="email"
                  placeholder="votre@email.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/20 outline-none"
                />
              </div>
            </div>

            {/* Disponibilité */}
            <div>
              <label className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-widest text-white/30">
                Disponibilité préférée
              </label>
              <div className="relative flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                <Clock size={14} className="shrink-0 text-white/25" />
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  required
                  style={{ color: availability ? "white" : "rgba(255,255,255,0.2)" }}
                  className="flex-1 appearance-none bg-transparent text-sm outline-none [&>option]:bg-[#111113] [&>option]:text-white"
                >
                  <option value="" disabled>Quand êtes-vous disponible ?</option>
                  {SLOTS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="pointer-events-none shrink-0 text-white/20" />
              </div>
            </div>

            {/* Objectif */}
            <div>
              <label className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-widest text-white/30">
                Objectif de la session (optionnel)
              </label>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                <textarea
                  placeholder="Ex : je bloque sur module 3, je veux revoir ma stratégie IA, je veux un retour sur mes automatisations…"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  rows={3}
                  className="w-full resize-none bg-transparent text-sm text-white placeholder-white/20 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!name.trim() || !email.trim() || !availability || sending}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#a78bfa] to-[#7c6fcd] py-3.5 text-sm font-bold text-white shadow-[0_4px_24px_rgba(167,139,250,0.2)] transition hover:shadow-[0_4px_32px_rgba(167,139,250,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {sending ? "Envoi…" : "Réserver ma session"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPOSANT : PREVIEW GATE
───────────────────────────────────────────────────────── */
type PaymentTab = "carte" | "paypal" | "virement";

function PreviewGate({ user }: {
  user: { id: string; email: string | undefined; name: string | undefined } | null;
}) {
  const [payTab,       setPayTab]       = useState<PaymentTab>("carte");
  const [loadingPay,   setLoadingPay]   = useState(false);
  const [virEmail,     setVirEmail]     = useState(user?.email ?? "");
  const [virName,      setVirName]      = useState(user?.name ?? "");
  const [virSent,      setVirSent]      = useState(false);
  const [virSending,   setVirSending]   = useState(false);

  const firstModule  = COACHING_MODULES[0];
  const freeChapter  = firstModule.chapters[0];
  const lockedModules = COACHING_MODULES.slice(1);

  async function handleStripe() {
    setLoadingPay(true);
    try {
      const res = await fetch("/api/checkout/coaching-ia", { method: "POST" });
      const data = await res.json() as { url?: string };
      if (data.url) window.location.href = data.url;
    } finally {
      setLoadingPay(false);
    }
  }

  async function handlePayPal() {
    setLoadingPay(true);
    try {
      const res = await fetch("/api/checkout/coaching-ia/paypal", { method: "POST" });
      const data = await res.json() as { url?: string };
      if (data.url) window.location.href = data.url;
    } finally {
      setLoadingPay(false);
    }
  }

  async function handleVirement(e: React.FormEvent) {
    e.preventDefault();
    if (!virEmail.trim() || !virName.trim()) return;
    setVirSending(true);
    try {
      await fetch("/api/checkout/coaching-ia/virement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: virEmail.trim(), name: virName.trim() }),
      });
      setVirSent(true);
    } finally {
      setVirSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#07080e] px-4 py-10 md:px-8">
      {/* Header */}
      <div className="mx-auto mb-10 max-w-5xl text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(167,139,250,0.2)] bg-[rgba(167,139,250,0.07)] px-4 py-1.5 text-xs font-bold tracking-widest text-[#a78bfa] uppercase">
          <Lock size={11} /> Accès restreint
        </div>
        <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">
          Coaching IA DJAMA
        </h1>
        <p className="mt-3 text-sm text-white/45 max-w-md mx-auto">
          Débloquez les 5 modules complets, l&apos;assistant pédagogique IA et les sessions de coaching individuel.
        </p>
      </div>

      <div className="mx-auto max-w-5xl flex flex-col gap-8 lg:flex-row lg:items-start">

        {/* ── LEFT : Preview contenu ─────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Module 1 Chapitre 1 — aperçu gratuit */}
          <div className="rounded-2xl border border-[rgba(96,165,250,0.2)] bg-white/[0.03] overflow-hidden">
            <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4">
              <span className="text-lg">{firstModule.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[#60a5fa]">
                  Module 1 · {firstModule.title}
                </p>
                <p className="truncate text-sm font-semibold text-white mt-0.5">
                  {freeChapter.title}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.08)] px-2.5 py-1 text-[0.6rem] font-bold text-[#34d399]">
                Aperçu gratuit
              </span>
            </div>
            <div className="px-5 py-5">
              <p className="text-sm leading-relaxed text-white/60 italic">
                {freeChapter.intro}
              </p>
              <div className="mt-4 flex items-center gap-2 text-[0.65rem] text-white/25">
                <Clock size={10} /> {freeChapter.duration}
                <span className="mx-1">·</span>
                <BookOpen size={10} /> Leçon
              </div>
            </div>
          </div>

          {/* Modules 2–5 verrouillés */}
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-white/25 px-1">
            Modules inclus dans l&apos;accès complet
          </p>
          {lockedModules.map((mod) => (
            <div key={mod.id} className="relative rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
              {/* Lock overlay */}
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#07080e]/60 backdrop-blur-[2px]">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.06]">
                  <Lock size={14} className="text-white/40" />
                </div>
                <span className="text-[0.65rem] font-semibold text-white/35">Accès complet requis</span>
              </div>
              {/* Blurred content */}
              <div className="pointer-events-none select-none opacity-40 blur-[2px] px-5 py-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">{mod.emoji}</span>
                  <div>
                    <p className="text-[0.6rem] font-bold uppercase tracking-widest" style={{ color: mod.color }}>
                      Module {mod.id}
                    </p>
                    <p className="text-sm font-semibold text-white">{mod.title}</p>
                  </div>
                  <span className="ml-auto text-[0.6rem] text-white/30">{mod.duration}</span>
                </div>
                <p className="text-xs text-white/40 leading-relaxed">{mod.tagline}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {mod.chapters.slice(0, 3).map((ch) => (
                    <span key={ch.id} className="rounded-lg bg-white/[0.04] px-2.5 py-1 text-[0.6rem] text-white/30">
                      {ch.title}
                    </span>
                  ))}
                  {mod.chapters.length > 3 && (
                    <span className="rounded-lg bg-white/[0.04] px-2.5 py-1 text-[0.6rem] text-white/25">
                      +{mod.chapters.length - 3} chapitres
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── RIGHT : Panneau paiement ───────────────── */}
        <div className="lg:sticky lg:top-10 lg:w-[340px] shrink-0">
          <div className="rounded-2xl border border-white/[0.09] bg-white/[0.03] overflow-hidden">

            {/* En-tête */}
            <div className="border-b border-white/[0.07] px-6 py-5">
              <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-[rgba(167,139,250,0.2)] bg-[rgba(167,139,250,0.07)] px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-widest text-[#a78bfa]">
                <Sparkles size={9} /> Accès à vie
              </div>
              <h2 className="mt-2 text-lg font-bold text-white">Débloquer l&apos;accès complet</h2>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-4xl font-extrabold text-white">190€</span>
                <span className="mb-1 text-xs text-white/35">paiement unique</span>
              </div>
              <ul className="mt-4 space-y-1.5">
                {[
                  "5 modules · 17 chapitres",
                  "Assistant pédagogique IA",
                  "Sessions de coaching individuel",
                  "Accès à vie + mises à jour",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-white/55">
                    <CheckCircle2 size={11} className="shrink-0 text-[#34d399]" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Onglets méthode de paiement */}
            <div className="px-6 pt-5">
              <div className="mb-4 flex gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] p-1">
                {([
                  { key: "carte",    icon: <CreditCard size={12} />, label: "Carte"   },
                  { key: "paypal",   icon: <span className="text-[0.65rem] font-extrabold text-[#0070BA]">PP</span>, label: "PayPal" },
                  { key: "virement", icon: <Landmark size={12} />,   label: "Virement" },
                ] as { key: PaymentTab; icon: React.ReactNode; label: string }[]).map(({ key, icon, label }) => (
                  <button
                    key={key}
                    onClick={() => setPayTab(key)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[0.65rem] font-semibold transition-all ${
                      payTab === key
                        ? "bg-[rgba(167,139,250,0.15)] text-[#a78bfa] border border-[rgba(167,139,250,0.25)]"
                        : "text-white/35 hover:text-white/65"
                    }`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>

              {/* Tab : Carte (Stripe) */}
              {payTab === "carte" && (
                <div className="pb-6">
                  <p className="mb-4 text-xs text-white/40 leading-relaxed">
                    Paiement sécurisé via Stripe. CB, Visa, Mastercard — vos données ne nous parviennent jamais.
                  </p>
                  <button
                    onClick={handleStripe}
                    disabled={loadingPay}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#a78bfa] to-[#7c6fcd] py-3.5 text-sm font-bold text-white shadow-[0_4px_24px_rgba(167,139,250,0.25)] transition hover:shadow-[0_4px_32px_rgba(167,139,250,0.4)] disabled:opacity-60"
                  >
                    {loadingPay
                      ? <Loader2 size={15} className="animate-spin" />
                      : <CreditCard size={15} />
                    }
                    {loadingPay ? "Redirection…" : "Payer par carte — 190€"}
                  </button>
                </div>
              )}

              {/* Tab : PayPal */}
              {payTab === "paypal" && (
                <div className="pb-6">
                  <p className="mb-4 text-xs text-white/40 leading-relaxed">
                    Vous serez redirigé vers PayPal pour finaliser votre paiement de 190€.
                  </p>
                  <button
                    onClick={handlePayPal}
                    disabled={loadingPay}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0070BA] py-3.5 text-sm font-bold text-white shadow-[0_4px_20px_rgba(0,112,186,0.3)] transition hover:bg-[#005ea6] hover:shadow-[0_4px_28px_rgba(0,112,186,0.4)] disabled:opacity-60"
                  >
                    {loadingPay
                      ? <Loader2 size={15} className="animate-spin" />
                      : <span className="text-base font-black leading-none">PayPal</span>
                    }
                    {loadingPay ? "Redirection…" : "Payer via PayPal — 190€"}
                  </button>
                </div>
              )}

              {/* Tab : Virement */}
              {payTab === "virement" && (
                <div className="pb-6">
                  <AnimatePresence mode="wait">
                    {virSent ? (
                      <motion.div
                        key="sent"
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-2xl border border-[rgba(52,211,153,0.2)] bg-[rgba(52,211,153,0.06)] px-5 py-6 text-center"
                      >
                        <CheckCircle2 size={32} className="mx-auto mb-3 text-[#34d399]" />
                        <p className="text-sm font-semibold text-white">Demande enregistrée</p>
                        <p className="mt-1.5 text-xs leading-relaxed text-white/45">
                          Nous activons votre accès sous 24h à réception du virement.
                        </p>
                      </motion.div>
                    ) : (
                      <motion.form key="form" onSubmit={handleVirement} className="space-y-3">
                        {/* IBAN info */}
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[0.65rem] text-white/45 leading-relaxed space-y-0.5">
                          <p>Virement de <span className="font-bold text-white/70">190€</span></p>
                          <p>IBAN : <span className="font-mono text-white/65">FR76 3000 6000 0112 3456 7890 189</span></p>
                          <p>BIC : <span className="font-mono text-white/65">AGRIFRPP</span></p>
                          <p>Référence : <span className="font-semibold text-[#a78bfa]">Coaching IA [votre email]</span></p>
                        </div>

                        {/* Email */}
                        <div>
                          <label className="mb-1 block text-[0.6rem] font-semibold uppercase tracking-widest text-white/30">
                            Votre email
                          </label>
                          <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
                            <Mail size={12} className="text-white/25" />
                            <input
                              type="email"
                              required
                              placeholder="votre@email.fr"
                              value={virEmail}
                              onChange={(e) => setVirEmail(e.target.value)}
                              className="flex-1 bg-transparent text-xs text-white placeholder-white/20 outline-none"
                            />
                          </div>
                        </div>

                        {/* Nom complet */}
                        <div>
                          <label className="mb-1 block text-[0.6rem] font-semibold uppercase tracking-widest text-white/30">
                            Nom complet
                          </label>
                          <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
                            <User size={12} className="text-white/25" />
                            <input
                              type="text"
                              required
                              placeholder="Prénom Nom"
                              value={virName}
                              onChange={(e) => setVirName(e.target.value)}
                              className="flex-1 bg-transparent text-xs text-white placeholder-white/20 outline-none"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={!virEmail.trim() || !virName.trim() || virSending}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[rgba(167,139,250,0.25)] bg-[rgba(167,139,250,0.1)] py-3 text-xs font-bold text-[#a78bfa] transition hover:bg-[rgba(167,139,250,0.18)] disabled:opacity-50"
                        >
                          {virSending ? <Loader2 size={13} className="animate-spin" /> : <Landmark size={13} />}
                          {virSending ? "Envoi…" : "Confirmer ma demande de virement"}
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE PRINCIPALE
───────────────────────────────────────────────────────── */
export default function EspaceCoachingIA() {
  /* ── Access gate ────────────────────────────────────────── */
  const { access, user } = useCoachingIAAccess();

  /* ── State ─────────────────────────────────────────────── */
  const [completed,          setCompleted]         = useState<Set<string>>(new Set());
  const [selectedModuleId,   setSelectedModuleId]  = useState<string>("1");
  const [selectedChapterId,  setSelectedChapterId] = useState<string | null>("1.1");
  const [expandedModules,    setExpandedModules]   = useState<Set<string>>(new Set(["1"]));
  const [view,               setView]              = useState<View>("chapter");
  const [sidebarOpen,        setSidebarOpen]       = useState(true);
  const [assistantInitMsg,   setAssistantInitMsg]  = useState<string | undefined>();

  /* ── Charger progress depuis localStorage ────────────── */
  useEffect(() => {
    setCompleted(loadProgress());
  }, []);

  /* ── Helpers ───────────────────────────────────────────── */
  const currentModule  = COACHING_MODULES.find((m) => m.id === selectedModuleId)!;
  const currentChapter = currentModule?.chapters.find((c) => c.id === selectedChapterId) ?? currentModule?.chapters[0];

  const totalChapters     = COACHING_MODULES.reduce((a, m) => a + m.chapters.length, 0);
  const completedCount    = completed.size;
  const overallPct        = Math.round((completedCount / totalChapters) * 100);

  function toggleModule(id: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectChapter(moduleId: string, chapterId: string) {
    setSelectedModuleId(moduleId);
    setSelectedChapterId(chapterId);
    setView("chapter");
  }

  function markCompleted() {
    if (!selectedChapterId) return;
    const next = new Set(completed);
    next.add(selectedChapterId);
    setCompleted(next);
    saveProgress(next);
  }

  function goNext() {
    if (!selectedModuleId || !selectedChapterId) return;
    const nxt = getNextChapter(selectedModuleId, selectedChapterId);
    if (nxt) {
      selectChapter(nxt.moduleId, nxt.chapterId);
      setExpandedModules((p) => new Set([...p, nxt.moduleId]));
    }
  }

  function openAssistantWith(q: string) {
    setAssistantInitMsg(q);
    setView("assistant");
  }

  /* ── Nav gauche sur mobile ────────────────────────────── */
  const currentContext = currentChapter
    ? `Module ${selectedModuleId} "${currentModule?.title}" — Chapitre "${currentChapter.title}"`
    : undefined;

  /* ── Access gate early returns ──────────────────────────── */
  if (access === "loading") return null;

  /* DEV bypass — NEXT_PUBLIC_DEV_BYPASS_COACHING=true dans .env.local */
  const devBypass = process.env.NEXT_PUBLIC_DEV_BYPASS_COACHING === "true";
  if (access === "preview" && !devBypass) return <PreviewGate user={user} />;

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">

      {/* ════════════════════════════════════════════════════
          SIDEBAR GAUCHE
      ════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease }}
            className="flex shrink-0 flex-col overflow-hidden border-r border-white/[0.06] bg-[#07080e]"
            style={{ width: 240 }}
          >
            {/* Progression globale */}
            <div className="border-b border-white/[0.06] px-4 py-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-white/30">
                  Progression
                </span>
                <span className="text-[0.65rem] font-bold text-[#a78bfa]">{overallPct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#a78bfa] to-[#7c6fcd]"
                  initial={{ width: 0 }}
                  animate={{ width: `${overallPct}%` }}
                  transition={{ duration: 0.6, ease }}
                />
              </div>
              <p className="mt-1.5 text-[0.6rem] text-white/20">
                {completedCount} / {totalChapters} chapitres
              </p>
            </div>

            {/* Modules list */}
            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
              {COACHING_MODULES.map((m) => {
                const modCompleted = m.chapters.filter((c) => completed.has(c.id)).length;
                return (
                  <ModuleSidebarItem
                    key={m.id}
                    module={m}
                    completed={modCompleted}
                    total={m.chapters.length}
                    expanded={expandedModules.has(m.id)}
                    onToggle={() => toggleModule(m.id)}
                    onSelectChapter={(cId) => selectChapter(m.id, cId)}
                    selectedChapterId={selectedChapterId}
                  />
                );
              })}
            </div>

            {/* Actions raccourcis */}
            <div className="border-t border-white/[0.06] space-y-1 px-2 py-3">
              <button
                onClick={() => setView("assistant")}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                  view === "assistant"
                    ? "bg-[rgba(167,139,250,0.1)] text-[#a78bfa]"
                    : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
                }`}
              >
                <Bot size={14} /> Assistant IA
              </button>
              <button
                onClick={() => setView("booking")}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                  view === "booking"
                    ? "bg-[rgba(167,139,250,0.1)] text-[#a78bfa]"
                    : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
                }`}
              >
                <Calendar size={14} /> Réserver une session
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════
          CONTENU PRINCIPAL
      ════════════════════════════════════════════════════ */}
      <main className="flex flex-1 flex-col overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-2.5">
          <button
            onClick={() => setSidebarOpen((p) => !p)}
            className="rounded-lg p-1.5 text-white/30 transition hover:bg-white/[0.05] hover:text-white/70"
            title={sidebarOpen ? "Masquer le menu" : "Afficher le menu"}
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>

          <div className="h-4 w-px bg-white/[0.08]" />

          {/* Onglets */}
          {(["chapter", "assistant", "booking"] as View[]).map((v) => {
            const icons = { chapter: BookOpen, assistant: Bot, booking: Calendar };
            const labels = { chapter: "Cours", assistant: "Assistant IA", booking: "Réserver" };
            const Icon = icons[v];
            return (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  view === v
                    ? "border border-[rgba(167,139,250,0.25)] bg-[rgba(167,139,250,0.1)] text-[#a78bfa]"
                    : "text-white/35 hover:bg-white/[0.04] hover:text-white/65"
                }`}
              >
                <Icon size={13} /> {labels[v]}
              </button>
            );
          })}

          {/* Chapitre actuel */}
          {view === "chapter" && currentChapter && (
            <span className="ml-2 truncate text-[0.65rem] text-white/25">
              {currentChapter.title}
            </span>
          )}
        </div>

        {/* Vue principale */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {view === "chapter" && currentChapter && (
              <motion.div
                key={`chapter-${currentChapter.id}`}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25, ease }}
              >
                <ChapterViewer
                  module={currentModule}
                  chapter={currentChapter}
                  isCompleted={completed.has(currentChapter.id)}
                  onComplete={markCompleted}
                  onNext={goNext}
                  onAskAssistant={openAssistantWith}
                />
              </motion.div>
            )}

            {view === "assistant" && (
              <motion.div
                key="assistant"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25, ease }}
                className="h-full"
              >
                <AssistantPanel currentContext={currentContext} />
              </motion.div>
            )}

            {view === "booking" && (
              <motion.div
                key="booking"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25, ease }}
              >
                <BookingPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
