"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Circle, BookOpen, ChevronRight, ChevronDown,
  Bot, Send, Loader2, User, Sparkles, Calendar, Mail,
  Clock, Award, Target, TrendingUp, MessageSquare,
  ArrowRight, Lock, Play, RotateCcw, ChevronLeft,
  CreditCard, Landmark, Brain, Lightbulb, Download,
  Star, Maximize2, Minimize2, Copy, Check, X,
  FileText, Zap, HelpCircle, BookMarked, Rocket,
  Shield, RefreshCw, Gamepad2, Trophy, Timer,
} from "lucide-react";
import { COACHING_MODULES, getNextChapter, type Module, type Chapter } from "@/lib/coaching-content";
import { useCoachingIAAccess } from "@/lib/use-require-coaching-ia";

const ease = [0.16, 1, 0.3, 1] as const;
const ACCENT = "#a78bfa";

/* ─────────────────────────────────────────────────────────
   STORAGE — Progress
───────────────────────────────────────────────────────── */
const STORAGE_KEY = "djama_coaching_progress";
const FAV_KEY     = "djama_coaching_favorites";

function loadProgress(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) as string[] : []);
  } catch { return new Set(); }
}
function saveProgress(s: Set<string>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...s])); } catch {}
}
function loadFavorites(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return new Set(raw ? JSON.parse(raw) as string[] : []);
  } catch { return new Set(); }
}
function saveFavorites(s: Set<string>) {
  try { localStorage.setItem(FAV_KEY, JSON.stringify([...s])); } catch {}
}

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
type View      = "chapter" | "assistant" | "booking" | "favorites" | "jeux";
type AiAction  = "summarize" | "simplify" | "quiz" | "action_plan" | "create_prompt";

/* ─────────────────────────────────────────────────────────
   UTILITY — CopyButton
───────────────────────────────────────────────────────── */
function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={copy}
      title="Copier"
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[0.65rem] font-semibold transition-all ${
        copied
          ? "border-[rgba(52,211,153,0.4)] bg-[rgba(52,211,153,0.1)] text-[#34d399]"
          : "border-white/[0.1] bg-white/[0.04] text-white/40 hover:border-white/[0.2] hover:text-white/70"
      } ${className}`}
    >
      {copied ? <><Check size={10} /> Copié !</> : <><Copy size={10} /> Copier</>}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPOSANT — AI Tools Bar
───────────────────────────────────────────────────────── */
function AiToolsBar({
  chapter, module, onOpenAssistant,
}: {
  chapter:         Chapter;
  module:          Module;
  onOpenAssistant: (q: string) => void;
}) {
  const [loading,     setLoading]     = useState(false);
  const [activeAction, setActiveAction] = useState<AiAction | null>(null);
  const [result,      setResult]      = useState<string | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [question,    setQuestion]    = useState("");
  const [askOpen,     setAskOpen]     = useState(false);

  async function callAi(action: AiAction) {
    if (loading) return;
    setActiveAction(action);
    setLoading(true);
    setResult(null);
    setError(null);

    const context = [
      chapter.intro,
      ...(chapter.keyPoints?.map((kp) => `${kp.title}: ${kp.text}`) ?? []),
      chapter.example ?? "",
      ...(chapter.tips ?? []),
    ].filter(Boolean).join("\n\n").slice(0, 3000);

    try {
      const res = await fetch("/api/coaching-ia/ai-tools", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action, context, chapterTitle: chapter.title }),
      });
      const data = await res.json() as { result?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setResult(data.result ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  function handlePdf() {
    const content = [
      `${module.title}`,
      `Chapitre : ${chapter.title}`,
      `Durée : ${chapter.duration}`,
      "",
      "─── Introduction ───",
      chapter.intro,
      "",
      ...(chapter.keyPoints?.flatMap((kp, i) => [
        `${i + 1}. ${kp.title}`,
        kp.text,
        "",
      ]) ?? []),
      chapter.example ? ["─── Exemple concret ───", chapter.example, ""].join("\n") : "",
      ...(chapter.tips ? ["─── À retenir ───", ...chapter.tips.map((t) => `• ${t}`), ""] : []),
      ...(chapter.actions ? ["─── Actions à faire ───", ...chapter.actions.map((a) => `☐ ${a}`), ""] : []),
    ].filter(Boolean).join("\n");

    const win = window.open("", "_blank", "width=820,height=700");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html lang="fr"><head>
      <meta charset="UTF-8"/>
      <title>${chapter.title} — DJAMA Coaching IA</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
             color:#111;max-width:700px;margin:2rem auto;padding:0 1.5rem;line-height:1.7}
        .badge{display:inline-block;background:#f3f0ff;color:#7c3aed;
               border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700;
               letter-spacing:.06em;text-transform:uppercase;margin-bottom:1.2rem}
        h1{font-size:1.6rem;font-weight:800;margin-bottom:.3rem}
        .meta{font-size:.75rem;color:#888;margin-bottom:2rem}
        h2{font-size:.65rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
           color:#9ca3af;margin:1.8rem 0 .8rem}
        p{font-size:.925rem;color:#374151;margin-bottom:.6rem}
        .key-point{border-left:3px solid #a78bfa;padding:.7rem 1rem;
                   background:#f8f7ff;margin:.6rem 0;border-radius:0 8px 8px 0}
        .key-point strong{display:block;font-size:.8rem;font-weight:700;
                          color:#5b21b6;margin-bottom:.25rem}
        .key-point p{color:#4b5563;font-size:.85rem}
        .example-box{background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;
                     padding:.85rem 1rem;margin:1rem 0}
        .example-box .label{font-size:.65rem;font-weight:700;color:#d97706;
                             text-transform:uppercase;letter-spacing:.1em;margin-bottom:.4rem}
        .tip{display:flex;align-items:flex-start;gap:.6rem;margin:.4rem 0;font-size:.85rem;color:#374151}
        .tip::before{content:"✓";color:#10b981;font-weight:700;flex-shrink:0}
        .action{display:flex;align-items:flex-start;gap:.6rem;margin:.4rem 0;
                font-size:.85rem;color:#374151}
        .action::before{content:"☐";color:#6d28d9;font-weight:700;flex-shrink:0}
        .footer{margin-top:3rem;padding-top:1rem;border-top:1px solid #e5e7eb;
                font-size:.7rem;color:#9ca3af;text-align:center}
        @media print{body{margin:0}button{display:none}}
      </style>
      </head><body>
      <div class="badge">Coaching IA DJAMA — ${module.title}</div>
      <h1>${chapter.title}</h1>
      <p class="meta">Durée estimée : ${chapter.duration} · Formation DJAMA</p>
      <h2>Introduction</h2>
      <p>${chapter.intro}</p>
      ${chapter.keyPoints ? `
        <h2>Points clés</h2>
        ${chapter.keyPoints.map((kp, i) => `
          <div class="key-point">
            <strong>${i + 1}. ${kp.title}</strong>
            <p>${kp.text}</p>
          </div>`).join("")}` : ""}
      ${chapter.example ? `
        <div class="example-box">
          <div class="label">Exemple concret</div>
          <p>${chapter.example}</p>
        </div>` : ""}
      ${chapter.tips ? `
        <h2>À retenir</h2>
        ${chapter.tips.map((t) => `<div class="tip">${t}</div>`).join("")}` : ""}
      ${chapter.actions ? `
        <h2>Actions à faire maintenant</h2>
        ${chapter.actions.map((a) => `<div class="action">${a}</div>`).join("")}` : ""}
      <div class="footer">DJAMA Coaching IA · djama.fr · ${new Date().toLocaleDateString("fr-FR")}</div>
      <script>window.onload=()=>window.print();<\/script>
      </body></html>`);
    win.document.close();
  }

  const TOOLS = [
    {
      action:  "summarize" as AiAction,
      icon:    Brain,
      label:   "Résumer avec IA",
      color:   "#a78bfa",
      colorBg: "rgba(167,139,250,0.1)",
      border:  "rgba(167,139,250,0.25)",
    },
    {
      action:  "simplify" as AiAction,
      icon:    Lightbulb,
      label:   "Expliquer simplement",
      color:   "#f9a826",
      colorBg: "rgba(249,168,38,0.1)",
      border:  "rgba(249,168,38,0.25)",
    },
    {
      action:  "quiz" as AiAction,
      icon:    BookMarked,
      label:   "Générer un quiz",
      color:   "#34d399",
      colorBg: "rgba(52,211,153,0.1)",
      border:  "rgba(52,211,153,0.25)",
    },
    {
      action:  "action_plan" as AiAction,
      icon:    Rocket,
      label:   "Plan d'action",
      color:   "#f87171",
      colorBg: "rgba(248,113,113,0.1)",
      border:  "rgba(248,113,113,0.25)",
    },
    {
      action:  "create_prompt" as AiAction,
      icon:    Zap,
      label:   "Créer des prompts",
      color:   "#38bdf8",
      colorBg: "rgba(56,189,248,0.1)",
      border:  "rgba(56,189,248,0.25)",
    },
  ];

  return (
    <div className="mb-8">
      {/* Tool buttons */}
      <div className="flex flex-wrap gap-2">
        {TOOLS.map(({ action, icon: Icon, label, color, colorBg, border }) => (
          <button
            key={action}
            onClick={() => {
              if (activeAction === action && (result || error)) {
                setResult(null); setError(null); setActiveAction(null);
              } else {
                callAi(action);
              }
            }}
            disabled={loading && activeAction !== action}
            className="flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[0.72rem] font-semibold transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderColor: border, background: colorBg, color }}
          >
            {loading && activeAction === action
              ? <Loader2 size={12} className="animate-spin" />
              : <Icon size={12} />
            }
            {label}
          </button>
        ))}

        <button
          onClick={() => setAskOpen((p) => !p)}
          className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[0.72rem] font-semibold transition-all hover:scale-[1.02] ${
            askOpen
              ? "border-[rgba(96,165,250,0.4)] bg-[rgba(96,165,250,0.15)] text-[#60a5fa]"
              : "border-[rgba(96,165,250,0.2)] bg-[rgba(96,165,250,0.07)] text-[#60a5fa]"
          }`}
        >
          <HelpCircle size={12} /> Poser une question
        </button>

        <button
          onClick={handlePdf}
          className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-2 text-[0.72rem] font-semibold text-white/40 transition-all hover:scale-[1.02] hover:border-white/[0.2] hover:text-white/65"
        >
          <Download size={12} /> Télécharger PDF
        </button>
      </div>

      {/* AI Result panel */}
      <AnimatePresence>
        {(loading || result || error) && activeAction !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease }}
            className="overflow-hidden"
          >
            <div className="mt-3 overflow-hidden rounded-2xl border border-[rgba(167,139,250,0.2)] bg-[rgba(167,139,250,0.05)]">
              {/* Result header */}
              <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(167,139,250,0.15)]">
                    <Bot size={12} className="text-[#a78bfa]" />
                  </div>
                  <span className="text-[0.65rem] font-bold uppercase tracking-widest text-[#a78bfa]">
                    {activeAction === "summarize"    ? "Résumé IA"
                     : activeAction === "simplify"  ? "Explication simple"
                     : activeAction === "quiz"       ? "Quiz interactif"
                     : activeAction === "action_plan"? "Plan d'action"
                     : "Prompts prêts à l'emploi"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {result && <CopyButton text={result} />}
                  <button
                    onClick={() => { setResult(null); setError(null); setActiveAction(null); }}
                    className="rounded-lg p-1 text-white/30 transition hover:bg-white/[0.06] hover:text-white/60"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
              {/* Result content */}
              <div className="px-4 py-4 text-sm leading-[1.75] text-white/70" style={{ whiteSpace: "pre-wrap" }}>
                {loading
                  ? (
                    <div className="flex items-center gap-3 text-white/40">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#a78bfa]"
                            style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                      Génération en cours…
                    </div>
                  )
                  : error
                    ? <p className="text-red-400">{error}</p>
                    : result
                }
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ask question panel */}
      <AnimatePresence>
        {askOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-2xl border border-[rgba(96,165,250,0.2)] bg-[rgba(96,165,250,0.05)] p-4">
              <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-widest text-[#60a5fa]">
                Posez votre question sur ce cours
              </p>
              <div className="flex gap-2">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={`Ex : "Je n'ai pas bien compris la partie sur ${chapter.keyPoints?.[0]?.title ?? chapter.title}…"`}
                  rows={2}
                  className="flex-1 resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-[rgba(96,165,250,0.35)] transition-colors"
                />
                <button
                  onClick={() => {
                    if (!question.trim()) return;
                    onOpenAssistant(
                      `[Cours : ${module.title} — ${chapter.title}]\n\n${question.trim()}`
                    );
                    setQuestion("");
                    setAskOpen(false);
                  }}
                  disabled={!question.trim()}
                  className="self-end flex items-center gap-1.5 rounded-xl bg-[rgba(96,165,250,0.2)] px-3.5 py-2 text-xs font-bold text-[#60a5fa] transition hover:bg-[rgba(96,165,250,0.3)] disabled:opacity-40"
                >
                  <Send size={13} /> Envoyer
                </button>
              </div>
              <p className="mt-2 text-[0.6rem] text-white/25">
                L&apos;assistant IA pédagogique vous répondra dans le panneau Assistant
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPOSANT — Module Sidebar Item
───────────────────────────────────────────────────────── */
function ModuleSidebarItem({
  module, completed, total, expanded, onToggle,
  onSelectChapter, selectedChapterId, favorites,
}: {
  module:            Module;
  completed:         number;
  total:             number;
  expanded:          boolean;
  onToggle:          () => void;
  onSelectChapter:   (chapterId: string) => void;
  selectedChapterId: string | null;
  favorites:         Set<string>;
}) {
  const pct          = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isModuleDone = completed === total && total > 0;

  return (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-white/[0.05]"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-xs font-semibold text-white/80">
              M{module.id} · {module.title}
            </p>
            {isModuleDone && (
              <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[0.5rem] font-black uppercase tracking-widest"
                style={{ background: `rgba(${module.rgb},0.15)`, color: `rgb(${module.rgb})` }}>
                ✓
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: `rgb(${module.rgb})` }} />
            </div>
            <span className="text-[0.55rem] text-white/25">{pct}%</span>
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
                const isFav    = favorites.has(ch.id);
                return (
                  <button key={ch.id} onClick={() => onSelectChapter(ch.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-all ${
                      selected
                        ? "bg-white/[0.08] text-white"
                        : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
                    }`}
                  >
                    {isDone
                      ? <CheckCircle2 size={11} style={{ color: `rgb(${module.rgb})`, flexShrink: 0 }} />
                      : <Circle size={11} className="shrink-0 text-white/20" />
                    }
                    <span className="flex-1 truncate text-[0.68rem]">{ch.title}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {isFav && <Star size={9} className="fill-[#f9a826] text-[#f9a826]" />}
                      <span className={`text-[0.55rem] ${
                        ch.type === "exercise" ? "text-[#f9a826]"
                        : ch.type === "quiz"   ? "text-[#60a5fa]"
                        : "text-white/20"
                      }`}>
                        {ch.type === "exercise" ? "Ex" : ch.type === "quiz" ? "Q" : ""}
                      </span>
                    </div>
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
   COMPOSANT — Chapter Viewer (redesigné)
───────────────────────────────────────────────────────── */
function ChapterViewer({
  module, chapter, isCompleted, isFavorite,
  onComplete, onNext, onToggleFavorite, onAskAssistant,
}: {
  module:           Module;
  chapter:          Chapter;
  isCompleted:      boolean;
  isFavorite:       boolean;
  onComplete:       () => void;
  onNext:           () => void;
  onToggleFavorite: () => void;
  onAskAssistant:   (q: string) => void;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8">

      {/* ── En-tête chapitre ── */}
      <div className="mb-7">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full px-3 py-1 text-[0.62rem] font-bold uppercase tracking-widest"
            style={{ background: `rgba(${module.rgb},0.12)`, color: `rgb(${module.rgb})`, border: `1px solid rgba(${module.rgb},0.22)` }}>
            M{module.id} · {module.title}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[0.6rem] text-white/35">
            <Clock size={9} /> {chapter.duration}
          </span>
          {chapter.type !== "lesson" && (
            <span className={`rounded-full px-2.5 py-0.5 text-[0.6rem] font-bold ${
              chapter.type === "exercise"
                ? "bg-[rgba(249,168,38,0.1)] text-[#f9a826]"
                : "bg-[rgba(96,165,250,0.1)] text-[#60a5fa]"
            }`}>
              {chapter.type === "exercise" ? "Exercice" : "Quiz"}
            </span>
          )}
          {isCompleted && (
            <span className="rounded-full bg-[rgba(52,211,153,0.1)] px-2.5 py-0.5 text-[0.6rem] font-semibold text-[#34d399]">
              ✓ Terminé
            </span>
          )}
        </div>

        <div className="flex items-start justify-between gap-3">
          <h1 className="text-[1.5rem] font-extrabold leading-snug text-white">{chapter.title}</h1>
          <button
            onClick={onToggleFavorite}
            title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            className={`mt-0.5 shrink-0 rounded-xl border p-2 transition-all hover:scale-110 ${
              isFavorite
                ? "border-[rgba(249,168,38,0.4)] bg-[rgba(249,168,38,0.12)] text-[#f9a826]"
                : "border-white/[0.08] bg-transparent text-white/25 hover:border-[rgba(249,168,38,0.3)] hover:text-[#f9a826]"
            }`}
          >
            <Star size={14} className={isFavorite ? "fill-[#f9a826]" : ""} />
          </button>
        </div>
      </div>

      {/* ── AI Tools Bar ── */}
      <AiToolsBar chapter={chapter} module={module} onOpenAssistant={onAskAssistant} />

      {/* ── Introduction ── */}
      <div className="mb-8 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.02] px-6 py-5">
        <p className="text-[0.65rem] font-bold uppercase tracking-widest text-white/25 mb-3">
          Introduction
        </p>
        <p className="text-[0.95rem] leading-[1.85] text-white/65 italic">{chapter.intro}</p>
      </div>

      {/* ── Points clés ── */}
      {chapter.keyPoints && chapter.keyPoints.length > 0 && (
        <div className="mb-8">
          <p className="mb-4 text-[0.65rem] font-bold uppercase tracking-widest text-white/25">
            Points clés
          </p>
          <div className="space-y-3">
            {chapter.keyPoints.map(({ title, text }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease, delay: i * 0.07 }}
                className="group rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.05]"
              >
                <div className="mb-2.5 flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black"
                    style={{ background: `rgba(${module.rgb},0.15)`, color: `rgb(${module.rgb})` }}>
                    {i + 1}
                  </div>
                  <h3 className="text-sm font-bold text-white">{title}</h3>
                </div>
                <p className="ml-10 text-sm leading-[1.75] text-white/55">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Exemple concret ── */}
      {chapter.example && (
        <div className="mb-8 rounded-2xl border border-[rgba(201,165,90,0.2)] bg-gradient-to-br from-[rgba(201,165,90,0.06)] to-[rgba(201,165,90,0.03)] p-5">
          <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-widest text-[#c9a55a]">
            Exemple concret
          </p>
          <p className="text-sm leading-[1.75] text-[#c9a55a]/80">{chapter.example}</p>
        </div>
      )}

      {/* ── Exercice / Quiz ── */}
      {chapter.exercise && (
        <div className="mb-8 rounded-2xl border border-[rgba(249,168,38,0.22)] bg-[rgba(249,168,38,0.05)] p-5">
          <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-widest text-[#f9a826]">
            {chapter.type === "quiz" ? "Quiz" : "Exercice pratique"}
          </p>
          <p className="mb-5 text-sm leading-[1.75] text-white/65">{chapter.exercise.prompt}</p>
          <div className="space-y-2">
            {chapter.exercise.hints.map((hint, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-white/[0.04] p-3">
                <span className="mt-0.5 text-[0.62rem] font-black text-[#f9a826]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-sm text-white/60">{hint}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => onAskAssistant(
              `[Exercice : ${chapter.title}]\n\nJe travaille sur cet exercice :\n"${chapter.exercise?.prompt.slice(0, 150)}"\n\nPeux-tu m'aider ?`
            )}
            className="mt-4 flex items-center gap-2 rounded-xl border border-[rgba(167,139,250,0.25)] bg-[rgba(167,139,250,0.08)] px-4 py-2 text-xs font-semibold text-[#a78bfa] transition hover:bg-[rgba(167,139,250,0.14)]"
          >
            <Bot size={13} /> Demander à l&apos;assistant IA
          </button>
        </div>
      )}

      {/* ── Templates à copier ── */}
      {chapter.templates && chapter.templates.length > 0 && (
        <div className="mb-8">
          <p className="mb-4 text-[0.65rem] font-bold uppercase tracking-widest text-white/25">
            Templates prêts à copier
          </p>
          <div className="space-y-3">
            {chapter.templates.map((template, i) => (
              <div key={i} className="rounded-2xl border border-[rgba(96,165,250,0.18)] bg-[rgba(96,165,250,0.05)] overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
                  <span className="text-[0.62rem] font-bold uppercase tracking-widest text-[#60a5fa]">
                    Template {i + 1}
                  </span>
                  <CopyButton text={template} />
                </div>
                <pre className="px-4 py-3 text-xs leading-[1.8] text-white/55 whitespace-pre-wrap break-words font-mono">
                  {template}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── À retenir ── */}
      {chapter.tips && chapter.tips.length > 0 && (
        <div className="mb-8 rounded-2xl border border-[rgba(52,211,153,0.18)] bg-[rgba(52,211,153,0.04)] p-5">
          <p className="mb-4 text-[0.65rem] font-bold uppercase tracking-widest text-[#34d399]">
            À retenir
          </p>
          <ul className="space-y-2.5">
            {chapter.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#34d399]" />
                <p className="text-sm leading-[1.7] text-white/60">{tip}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Actions à faire ── */}
      {chapter.actions && chapter.actions.length > 0 && (
        <div className="mb-8 rounded-2xl border border-[rgba(167,139,250,0.2)] bg-[rgba(167,139,250,0.05)] p-5">
          <p className="mb-4 text-[0.65rem] font-bold uppercase tracking-widest text-[#a78bfa]">
            Actions à faire maintenant
          </p>
          <ul className="space-y-2.5">
            {chapter.actions.map((action, i) => (
              <li key={i} className="flex items-start gap-3">
                <Rocket size={14} className="mt-0.5 shrink-0 text-[#a78bfa]" />
                <p className="text-sm leading-[1.7] text-white/65">{action}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Actions nav ── */}
      <div className="flex flex-col gap-3 border-t border-white/[0.07] pt-6 sm:flex-row">
        {!isCompleted ? (
          <button onClick={onComplete}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#a78bfa] to-[#7c6fcd] py-3.5 text-sm font-bold text-white shadow-[0_4px_24px_rgba(167,139,250,0.25)] transition hover:shadow-[0_4px_36px_rgba(167,139,250,0.4)]"
          >
            <CheckCircle2 size={16} /> Marquer comme terminé
          </button>
        ) : (
          <button onClick={onNext}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[rgba(167,139,250,0.3)] bg-[rgba(167,139,250,0.1)] py-3.5 text-sm font-bold text-[#a78bfa] transition hover:bg-[rgba(167,139,250,0.18)]"
          >
            Chapitre suivant <ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPOSANT — Assistant IA (mis à jour)
───────────────────────────────────────────────────────── */
type Msg = { role: "user" | "assistant"; content: string };

function AssistantPanel({
  currentContext, initMessage, onInitConsumed,
}: {
  currentContext?: string;
  initMessage?:    string;
  onInitConsumed:  () => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([{
    role:    "assistant",
    content: "Bonjour ! Je suis votre assistant pédagogique IA. Posez-moi vos questions sur le programme, les concepts IA, ou demandez-moi de l'aide pour les exercices.",
  }]);
  const [input,   setInput]   = useState(initMessage ?? "");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  /* Pré-remplir si initMessage change */
  useEffect(() => {
    if (initMessage) { setInput(initMessage); }
  }, [initMessage]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    onInitConsumed();

    const newMessages: Msg[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/coaching-ia/assistant", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: newMessages, context: currentContext }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      setMessages([...newMessages, {
        role:    "assistant",
        content: data.reply ?? data.error ?? "Erreur de réponse.",
      }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Erreur. Réessayez dans un instant." }]);
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
      <div className="border-b border-white/[0.07] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(167,139,250,0.15)]">
            <Bot size={17} className="text-[#a78bfa]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Assistant Pédagogique IA</h2>
            <p className="text-[0.65rem] text-white/30">Spécialisé sur le programme Coaching IA DJAMA</p>
          </div>
          <div className="ml-auto h-2 w-2 rounded-full bg-[#34d399] shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
        {messages.length === 1 && (
          <div className="grid grid-cols-2 gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => sendMessage(s)}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-left text-xs text-white/50 transition hover:border-white/[0.14] hover:text-white/80"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
              msg.role === "user" ? "bg-[rgba(201,165,90,0.2)]" : "bg-[rgba(167,139,250,0.15)]"
            }`}>
              {msg.role === "user"
                ? <User size={13} className="text-[#c9a55a]" />
                : <Bot size={13} className="text-[#a78bfa]" />
              }
            </div>
            <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-[rgba(201,165,90,0.12)] text-white/80"
                : "border border-white/[0.07] bg-white/[0.04] text-white/70"
            }`} style={{ whiteSpace: "pre-wrap" }}>
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
                <div key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#a78bfa]"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-white/[0.07] px-4 py-3">
        <div className="flex items-end gap-2 rounded-2xl border border-white/[0.09] bg-white/[0.04] px-4 py-3 focus-within:border-[rgba(167,139,250,0.4)] transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Posez votre question…"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-white placeholder-white/25 outline-none"
            style={{ maxHeight: "120px" }}
          />
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#a78bfa] text-white transition disabled:opacity-40">
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
   COMPOSANT — Panneau Favoris
───────────────────────────────────────────────────────── */
function FavoritesPanel({
  favorites, onSelectChapter,
}: {
  favorites:       Set<string>;
  onSelectChapter: (moduleId: string, chapterId: string) => void;
}) {
  const favChapters = COACHING_MODULES.flatMap((m) =>
    m.chapters
      .filter((c) => favorites.has(c.id))
      .map((c) => ({ module: m, chapter: c }))
  );

  if (favChapters.length === 0) {
    return (
      <div className="flex h-[calc(100vh-56px)] flex-col items-center justify-center gap-4 text-center px-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          <Star size={28} className="text-white/20" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white/50">Aucun favori</p>
          <p className="mt-1 text-xs text-white/25">
            Cliquez sur l&apos;étoile dans n&apos;importe quel cours pour le sauvegarder ici.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[rgba(249,168,38,0.25)] bg-[rgba(249,168,38,0.08)] px-3 py-1 text-xs font-bold text-[#f9a826]">
          <Star size={11} className="fill-[#f9a826]" /> {favChapters.length} favoris
        </div>
        <h2 className="text-xl font-bold text-white">Vos cours mis en favoris</h2>
        <p className="mt-1.5 text-sm text-white/35">Reprenez rapidement là où vous étiez.</p>
      </div>

      <div className="space-y-3">
        {favChapters.map(({ module, chapter }) => (
          <motion.button
            key={chapter.id}
            onClick={() => onSelectChapter(module.id, chapter.id)}
            whileHover={{ x: 4 }}
            transition={{ duration: 0.18 }}
            className="group flex w-full items-start gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 text-left transition-all hover:border-white/[0.12] hover:bg-white/[0.05]"
          >
            <div className="flex-1 min-w-0">
              <p className="mb-0.5 text-[0.62rem] font-bold uppercase tracking-widest"
                style={{ color: module.color }}>
                M{module.id} · {module.title}
              </p>
              <p className="truncate font-semibold text-white">{chapter.title}</p>
              <div className="mt-1 flex items-center gap-2 text-[0.6rem] text-white/30">
                <Clock size={9} /> {chapter.duration}
                <span>·</span>
                <span>{chapter.type === "exercise" ? "Exercice" : chapter.type === "quiz" ? "Quiz" : "Cours"}</span>
              </div>
            </div>
            <ArrowRight size={14} className="mt-1 shrink-0 text-white/20 transition-transform group-hover:translate-x-0.5 group-hover:text-white/50" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPOSANT — Booking Panel (inchangé)
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
          parentName:  name, studentName: "Coaching IA",
          email:       email.trim(), level: "Coaching IA",
          subject:     goal || "Session de coaching IA",
          availability, message: goal,
        }),
      });
      setSent(true);
    } finally { setSending(false); }
  }

  const SLOTS = [
    { value: "semaine-matin",      label: "En semaine — matin (9h-12h)" },
    { value: "semaine-apres-midi", label: "En semaine — après-midi (14h-18h)" },
    { value: "semaine-soir",       label: "En semaine — soir (18h-20h)" },
    { value: "samedi-matin",       label: "Samedi matin (9h-12h)" },
    { value: "samedi-apres-midi",  label: "Samedi après-midi (14h-17h)" },
    { value: "flexible",           label: "Flexible — à définir ensemble" },
  ];

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[rgba(167,139,250,0.2)] bg-[rgba(167,139,250,0.08)] px-3 py-1 text-xs font-bold text-[#a78bfa]">
          <Calendar size={11} /> Programme Expert IA — 6 mois
        </div>
        <h2 className="mt-2 text-xl font-bold text-white">Coaching individuel avec un expert humain</h2>
        <p className="mt-2 text-sm text-white/45">
          1 séance par semaine pendant 6 mois = <span className="text-white/70 font-semibold">24 séances · 24h d&apos;accompagnement</span> avec un expert IA certifié DJAMA.
        </p>
      </div>

      {/* Programme 6 mois */}
      <div className="mb-6 rounded-2xl border border-[rgba(167,139,250,0.15)] bg-[rgba(167,139,250,0.05)] p-4">
        <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-widest text-[#a78bfa]">Le programme</p>
        <div className="space-y-2">
          {[
            { mois: "Mois 1–2",   label: "Fondations & outils",          detail: "8 séances — ChatGPT, Claude, Gemini, prompting", color: "#60a5fa" },
            { mois: "Mois 3–4",   label: "Automatisation & business",    detail: "8 séances — Workflows, agents, cas concrets",     color: "#a78bfa" },
            { mois: "Mois 5–6",   label: "Projet & certification",       detail: "8 séances — Projet final, déploiement, certification DJAMA", color: "#f59e0b" },
          ].map(({ mois, label, detail, color }) => (
            <div key={mois} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              <div>
                <p className="text-xs font-bold text-white">{mois} — {label}</p>
                <p className="text-[0.65rem] text-white/40">{detail}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2">
          <span className="text-[0.65rem] text-white/40">Total accompagnement</span>
          <span className="text-sm font-bold text-[#f59e0b]">24 séances · 24h · 6 mois</span>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { icon: Target,     label: "Objectifs clairs",      color: "#a78bfa" },
          { icon: TrendingUp, label: "Progression mesurée",   color: "#4ade80" },
          { icon: Award,      label: "Certification finale",   color: "#f59e0b" },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 text-center">
            <Icon size={18} className="mx-auto mb-1.5" style={{ color }} />
            <p className="text-[0.65rem] font-medium text-white/50">{label}</p>
          </div>
        ))}
      </div>

      {/* Formulaire */}
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div key="sent" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-[rgba(52,211,153,0.2)] bg-[rgba(52,211,153,0.06)] p-8 text-center">
            <CheckCircle2 size={40} className="mx-auto mb-4 text-[#34d399]" />
            <h3 className="mb-2 text-lg font-bold text-white">Demande envoyée !</h3>
            <p className="text-sm text-white/50">Un expert DJAMA vous contacte sous 24h pour planifier votre première séance et démarrer votre parcours de 6 mois.</p>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: "Votre nom", icon: User, type: "text", value: name, setter: setName, placeholder: "Prénom Nom" },
              { label: "Email", icon: Mail, type: "email", value: email, setter: setEmail, placeholder: "votre@email.fr" },
            ].map(({ label, icon: Icon, type, value, setter, placeholder }) => (
              <div key={label}>
                <label className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-widest text-white/30">{label}</label>
                <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                  <Icon size={14} className="text-white/25" />
                  <input type={type} placeholder={placeholder} value={value}
                    onChange={(e) => setter(e.target.value)} required
                    className="flex-1 bg-transparent text-sm text-white placeholder-white/20 outline-none" />
                </div>
              </div>
            ))}
            <div>
              <label className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-widest text-white/30">Créneau préféré (séances hebdomadaires)</label>
              <div className="relative flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                <Clock size={14} className="shrink-0 text-white/25" />
                <select value={availability} onChange={(e) => setAvailability(e.target.value)} required
                  style={{ color: availability ? "white" : "rgba(255,255,255,0.2)" }}
                  className="flex-1 appearance-none bg-transparent text-sm outline-none [&>option]:bg-[#111113] [&>option]:text-white">
                  <option value="" disabled>Quand êtes-vous disponible chaque semaine ?</option>
                  {SLOTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <ChevronDown size={12} className="pointer-events-none shrink-0 text-white/20" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-widest text-white/30">Votre objectif principal (optionnel)</label>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                <textarea placeholder="Ex : automatiser mon marketing, former mon équipe à l'IA, créer un chatbot pour mes clients…"
                  value={goal} onChange={(e) => setGoal(e.target.value)} rows={3}
                  className="w-full resize-none bg-transparent text-sm text-white placeholder-white/20 outline-none" />
              </div>
            </div>
            <button type="submit" disabled={!name.trim() || !email.trim() || !availability || sending}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#a78bfa] to-[#7c6fcd] py-3.5 text-sm font-bold text-white shadow-[0_4px_24px_rgba(167,139,250,0.2)] transition hover:shadow-[0_4px_32px_rgba(167,139,250,0.35)] disabled:cursor-not-allowed disabled:opacity-50">
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {sending ? "Envoi…" : "Démarrer mon parcours 6 mois"}
            </button>
            <p className="text-center text-[0.6rem] text-white/25">1 séance/semaine · 24 séances · 24h avec un expert humain certifié</p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPOSANT — Pending Gate
   Affiché quand l'utilisateur a soumis un paiement (virement)
   mais que l'admin n'a pas encore activé l'accès.
───────────────────────────────────────────────────────── */
function PendingGate({
  user,
}: {
  user: { id: string; email: string | undefined; name: string | undefined } | null;
}) {
  const STEPS = [
    { icon: Landmark,       color: "#60a5fa", label: "Vous avez effectué votre virement",          done: true  },
    { icon: Clock,          color: "#f9a826", label: "Nous vérifions la réception du paiement",    done: false },
    { icon: CheckCircle2,   color: "#34d399", label: "Activation de votre accès (24–48h ouvrés)",  done: false },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07080e] px-4 py-12">
      <div className="w-full max-w-md">

        {/* Icône centrale */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-[rgba(249,168,38,0.25)] bg-[rgba(249,168,38,0.08)]">
              <Clock size={36} style={{ color: "#f9a826" }} />
            </div>
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-[rgba(249,168,38,0.4)] bg-[#07080e]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#f9a826]" />
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">Paiement en cours de vérification</h1>
          <p className="mt-2.5 text-sm leading-relaxed text-white/45">
            Votre virement a bien été enregistré. Notre équipe l&apos;activera dès réception du paiement.
          </p>
          {user?.email && (
            <div className="mt-3 flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5">
              <Mail size={11} className="text-white/30" />
              <span className="text-xs text-white/50">{user.email}</span>
            </div>
          )}
        </div>

        {/* Étapes */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          <div className="border-b border-white/[0.06] px-5 py-3.5">
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-white/30">Statut de votre accès</p>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {STEPS.map(({ icon: Icon, color, label, done }, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all"
                  style={{
                    background: done ? `rgba(52,211,153,0.12)` : `rgba(${color === "#f9a826" ? "249,168,38" : "96,165,250"},0.08)`,
                    border:     done ? `1px solid rgba(52,211,153,0.25)` : `1px solid rgba(255,255,255,0.08)`,
                  }}
                >
                  {done
                    ? <CheckCircle2 size={15} style={{ color: "#34d399" }} />
                    : <Icon size={15} style={{ color }} />
                  }
                </div>
                <p className={`text-sm ${done ? "font-semibold text-white/75" : "text-white/40"}`}>{label}</p>
                {i === 1 && (
                  <span className="ml-auto flex items-center gap-1.5 rounded-full border border-[rgba(249,168,38,0.3)] bg-[rgba(249,168,38,0.08)] px-2.5 py-0.5 text-[0.6rem] font-bold text-[#f9a826]">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f9a826] opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#f9a826]" />
                    </span>
                    En cours
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Coordonnées du virement (rappel) */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-3.5">
            <Landmark size={14} style={{ color: "#60a5fa" }} />
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-white/30">Rappel — coordonnées du virement</p>
          </div>
          <div className="space-y-2.5 px-5 py-4 text-xs">
            {[
              { label: "Bénéficiaire", value: "EI AMDJAD Nofane",                  mono: false },
              { label: "IBAN",         value: "FR76 4061 8804 5900 0406 3964 945", mono: true  },
              { label: "BIC",          value: "BOUSFRPPXXX",                        mono: true  },
              { label: "Montant",      value: "190,00 €",                           mono: false },
              { label: "Référence",    value: "COACHING-IA",                        mono: true  },
            ].map(({ label, value, mono }) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <span className="text-white/30">{label}</span>
                <span className={`font-semibold text-white/65 ${mono ? "font-mono tracking-wide" : ""}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bandeau rassurant */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
          {[
            { icon: Shield,  label: "Accès sécurisé",       color: "#34d399" },
            { icon: Clock,   label: "Activation sous 24–48h", color: "#60a5fa" },
            { icon: Zap,     label: "Email de confirmation", color: "#a78bfa" },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-1.5 text-[0.63rem] text-white/40">
              <Icon size={9} style={{ color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] py-3 text-sm font-semibold text-white/60 transition hover:border-white/[0.18] hover:text-white/90"
          >
            <RefreshCw size={14} /> Vérifier mon accès
          </button>
          <a
            href="/contact"
            className="flex items-center justify-center gap-2 rounded-2xl border border-[rgba(167,139,250,0.2)] bg-[rgba(167,139,250,0.07)] py-3 text-sm font-semibold text-[#a78bfa] transition hover:bg-[rgba(167,139,250,0.12)]"
          >
            <Mail size={14} /> Contacter le support
          </a>
        </div>

        <p className="mt-6 text-center text-[0.65rem] text-white/20">
          Une fois votre paiement confirmé, vous recevrez un email avec votre lien d&apos;accès.
        </p>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPOSANT — Preview Gate (inchangé)
───────────────────────────────────────────────────────── */
type PaymentTab = "carte" | "paypal" | "virement";

function PreviewGate({ user }: {
  user: { id: string; email: string | undefined; name: string | undefined } | null;
}) {
  const [payTab,     setPayTab]     = useState<PaymentTab>("carte");
  const [loadingPay, setLoadingPay] = useState(false);
  const [virEmail,   setVirEmail]   = useState(user?.email ?? "");
  const [virName,    setVirName]    = useState(user?.name  ?? "");
  const [virSent,    setVirSent]    = useState(false);
  const [virSending, setVirSending] = useState(false);

  const firstModule  = COACHING_MODULES[0];
  const freeChapter  = firstModule.chapters[0];
  const lockedModules = COACHING_MODULES.slice(1);

  async function handleStripe() {
    setLoadingPay(true);
    try {
      const res = await fetch("/api/checkout/coaching-ia", { method: "POST" });
      const data = await res.json() as { url?: string };
      if (data.url) window.location.href = data.url;
    } finally { setLoadingPay(false); }
  }

  async function handlePayPal() {
    setLoadingPay(true);
    try {
      const res = await fetch("/api/checkout/coaching-ia/paypal", { method: "POST" });
      const data = await res.json() as { url?: string };
      if (data.url) window.location.href = data.url;
    } finally { setLoadingPay(false); }
  }

  async function handleVirement(e: React.FormEvent) {
    e.preventDefault();
    if (!virEmail.trim() || !virName.trim()) return;
    setVirSending(true);
    try {
      await fetch("/api/checkout/coaching-ia/virement", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: virEmail.trim(), name: virName.trim() }),
      });
      setVirSent(true);
    } finally { setVirSending(false); }
  }

  return (
    <div className="min-h-screen bg-[#07080e] px-4 py-10 md:px-8">
      <div className="mx-auto mb-10 max-w-5xl text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(167,139,250,0.2)] bg-[rgba(167,139,250,0.07)] px-4 py-1.5 text-xs font-bold tracking-widest text-[#a78bfa] uppercase">
          <Lock size={11} /> Accès restreint
        </div>
        <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">Coaching IA DJAMA</h1>
        <p className="mt-3 text-sm text-white/45 max-w-md mx-auto">
          Débloquez les {COACHING_MODULES.length} modules complets, l&apos;assistant pédagogique IA et les sessions de coaching individuel.
        </p>
      </div>

      <div className="mx-auto max-w-5xl flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex-1 min-w-0 space-y-4">
          {/* Free preview */}
          <div className="rounded-2xl border border-[rgba(96,165,250,0.2)] bg-white/[0.03] overflow-hidden">
            <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4">
              <div className="flex-1 min-w-0">
                <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[#60a5fa]">Module 1 · {firstModule.title}</p>
                <p className="truncate text-sm font-semibold text-white mt-0.5">{freeChapter.title}</p>
              </div>
              <span className="shrink-0 rounded-full border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.08)] px-2.5 py-1 text-[0.6rem] font-bold text-[#34d399]">Aperçu gratuit</span>
            </div>
            <div className="px-5 py-5">
              <p className="text-sm leading-relaxed text-white/60 italic">{freeChapter.intro}</p>
              <div className="mt-4 flex items-center gap-2 text-[0.65rem] text-white/25">
                <Clock size={10} /> {freeChapter.duration}<span className="mx-1">·</span><BookOpen size={10} /> Leçon
              </div>
            </div>
          </div>

          {/* Locked modules */}
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-white/25 px-1">Modules inclus dans l&apos;accès complet</p>
          {lockedModules.map((mod) => (
            <div key={mod.id} className="relative rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#07080e]/60 backdrop-blur-[2px]">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.06]">
                  <Lock size={14} className="text-white/40" />
                </div>
                <span className="text-[0.65rem] font-semibold text-white/35">Accès complet requis</span>
              </div>
              <div className="pointer-events-none select-none opacity-40 blur-[2px] px-5 py-4">
                <div className="flex items-center gap-3 mb-3">
                  <div>
                    <p className="text-[0.6rem] font-bold uppercase tracking-widest" style={{ color: mod.color }}>Module {mod.id}</p>
                    <p className="text-sm font-semibold text-white">{mod.title}</p>
                  </div>
                  <span className="ml-auto text-[0.6rem] text-white/30">{mod.duration}</span>
                </div>
                <p className="text-xs text-white/40 leading-relaxed">{mod.tagline}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {mod.chapters.slice(0, 3).map((ch) => (
                    <span key={ch.id} className="rounded-lg bg-white/[0.04] px-2.5 py-1 text-[0.6rem] text-white/30">{ch.title}</span>
                  ))}
                  {mod.chapters.length > 3 && (
                    <span className="rounded-lg bg-white/[0.04] px-2.5 py-1 text-[0.6rem] text-white/25">+{mod.chapters.length - 3} chapitres</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Payment panel */}
        <div className="lg:sticky lg:top-10 lg:w-[340px] shrink-0">
          <div className="rounded-2xl border border-white/[0.09] bg-white/[0.03] overflow-hidden">
            <div className="border-b border-white/[0.07] px-6 py-5">
              <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-[rgba(167,139,250,0.2)] bg-[rgba(167,139,250,0.07)] px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-widest text-[#a78bfa]">
                <Sparkles size={9} /> Accès complet
              </div>
              <h2 className="mt-2 text-lg font-bold text-white">Débloquer l&apos;accès complet</h2>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-4xl font-extrabold text-white">190€</span>
                <span className="mb-1 text-xs text-white/35">paiement unique · 3 mois</span>
              </div>
              <ul className="mt-4 space-y-1.5">
                {[
                  `${COACHING_MODULES.length} modules · ${COACHING_MODULES.reduce((a, m) => a + m.chapters.length, 0)} chapitres`,
                  "Assistant pédagogique IA",
                  "Outils IA dans chaque cours (résumé, simplification)",
                  "Sessions de coaching individuel",
                  "Accès 3 mois + mises à jour",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-white/55">
                    <CheckCircle2 size={11} className="shrink-0 text-[#34d399]" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="px-6 pt-5">
              <div className="mb-4 flex gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] p-1">
                {([
                  { key: "carte",    icon: <CreditCard size={12} />, label: "Carte"    },
                  { key: "paypal",   icon: <span className="text-[0.65rem] font-extrabold text-[#0070BA]">PP</span>, label: "PayPal" },
                  { key: "virement", icon: <Landmark size={12} />,   label: "Virement" },
                ] as { key: PaymentTab; icon: React.ReactNode; label: string }[]).map(({ key, icon, label }) => (
                  <button key={key} onClick={() => setPayTab(key)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[0.65rem] font-semibold transition-all ${
                      payTab === key
                        ? "bg-[rgba(167,139,250,0.15)] text-[#a78bfa] border border-[rgba(167,139,250,0.25)]"
                        : "text-white/35 hover:text-white/65"
                    }`}>
                    {icon} {label}
                  </button>
                ))}
              </div>

              {payTab === "carte" && (
                <div className="pb-6">
                  <p className="mb-4 text-xs text-white/40 leading-relaxed">Paiement sécurisé via Stripe. Vos données ne nous parviennent jamais.</p>
                  <button onClick={handleStripe} disabled={loadingPay}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#a78bfa] to-[#7c6fcd] py-3.5 text-sm font-bold text-white shadow-[0_4px_24px_rgba(167,139,250,0.25)] transition hover:shadow-[0_4px_32px_rgba(167,139,250,0.4)] disabled:opacity-60">
                    {loadingPay ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
                    {loadingPay ? "Redirection…" : "Commencer maintenant → 190€"}
                  </button>
                </div>
              )}
              {payTab === "paypal" && (
                <div className="pb-6">
                  <p className="mb-4 text-xs text-white/40 leading-relaxed">Vous serez redirigé vers PayPal pour finaliser votre paiement.</p>
                  <button onClick={handlePayPal} disabled={loadingPay}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0070BA] py-3.5 text-sm font-bold text-white transition hover:bg-[#005ea6] disabled:opacity-60">
                    {loadingPay ? <Loader2 size={15} className="animate-spin" /> : <span className="text-base font-black leading-none">PayPal</span>}
                    {loadingPay ? "Redirection…" : "Payer via PayPal — 190€"}
                  </button>
                </div>
              )}
              {payTab === "virement" && (
                <div className="pb-6">
                  <AnimatePresence mode="wait">
                    {virSent ? (
                      <motion.div key="sent" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                        className="rounded-2xl border border-[rgba(52,211,153,0.2)] bg-[rgba(52,211,153,0.06)] px-5 py-6 text-center">
                        <CheckCircle2 size={32} className="mx-auto mb-3 text-[#34d399]" />
                        <p className="text-sm font-semibold text-white">Demande enregistrée</p>
                        <p className="mt-1.5 text-xs leading-relaxed text-white/45">Accès activé sous 24h à réception.</p>
                      </motion.div>
                    ) : (
                      <motion.form key="form" onSubmit={handleVirement} className="space-y-3">
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[0.65rem] text-white/45 space-y-0.5">
                          <p>Bénéficiaire : <span className="font-semibold text-white/70">EI AMDJAD Nofane</span></p>
                          <p>IBAN : <span className="font-mono text-white/65">FR76 4061 8804 5900 0406 3964 945</span></p>
                          <p>BIC : <span className="font-mono text-white/65">BOUSFRPPXXX</span></p>
                          <p>Montant : <span className="font-bold text-white/70">190,00 €</span></p>
                          <p>Référence : <span className="font-semibold text-[#a78bfa]">COACHING-IA</span></p>
                        </div>
                        {[
                          { label: "Email", type: "email", value: virEmail, setter: setVirEmail, placeholder: "votre@email.fr", icon: Mail },
                          { label: "Nom complet", type: "text", value: virName, setter: setVirName, placeholder: "Prénom Nom", icon: User },
                        ].map(({ label, type, value, setter, placeholder, icon: Icon }) => (
                          <div key={label}>
                            <label className="mb-1 block text-[0.6rem] font-semibold uppercase tracking-widest text-white/30">{label}</label>
                            <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
                              <Icon size={12} className="text-white/25" />
                              <input type={type} required placeholder={placeholder} value={value}
                                onChange={(e) => setter(e.target.value)}
                                className="flex-1 bg-transparent text-xs text-white placeholder-white/20 outline-none" />
                            </div>
                          </div>
                        ))}
                        <button type="submit" disabled={!virEmail.trim() || !virName.trim() || virSending}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[rgba(167,139,250,0.25)] bg-[rgba(167,139,250,0.1)] py-3 text-xs font-bold text-[#a78bfa] transition hover:bg-[rgba(167,139,250,0.18)] disabled:opacity-50">
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
   COMPOSANT — Jeux Panel
───────────────────────────────────────────────────────── */
const QUIZ_Q = [
  { q: "Que signifie 'prompt engineering' ?", opts: ["Programmer un robot", "Rédiger des instructions efficaces pour une IA", "Créer une app mobile", "Coder en Python"], correct: 1, expl: "Le prompt engineering consiste à formuler des instructions précises pour obtenir les meilleures réponses d'un LLM." },
  { q: "Quel modèle est derrière ChatGPT ?", opts: ["BERT", "LLaMA", "GPT-4", "Mistral"], correct: 2, expl: "ChatGPT est basé sur GPT-4o, développé par OpenAI." },
  { q: "Que signifie 'hallucination' dans le contexte de l'IA ?", opts: ["Un bug visuel", "L'IA invente des infos fausses", "Une technique de prompt", "Un type de modèle"], correct: 1, expl: "Une hallucination désigne le phénomène où un modèle génère des informations fausses présentées avec confiance." },
  { q: "Quelle structure de prompt est recommandée ?", opts: ["Une phrase courte", "Rôle + Contexte + Tâche + Format", "Écrire en majuscules", "Poser plusieurs questions"], correct: 1, expl: "Un bon prompt inclut un rôle, un contexte précis, une tâche définie et des contraintes de format." },
  { q: "Qu'est-ce qu'un 'agent IA' ?", opts: ["Un commercial IA", "Un modèle qui effectue des actions autonomes", "Un antivirus", "Un assistant vocal"], correct: 1, expl: "Un agent IA agit de façon autonome : cherche des infos, exécute du code, prend des décisions." },
  { q: "Que signifie RAG ?", opts: ["Rapid AI Generation", "Retrieval-Augmented Generation", "Random Answer Generator", "Real Agent Gateway"], correct: 1, expl: "RAG connecte un LLM à une base de données externe pour des réponses plus précises et actualisées." },
  { q: "Quel modèle est français et open source ?", opts: ["ChatGPT", "Claude", "Mistral", "DALL-E"], correct: 2, expl: "Mistral est une entreprise française qui publie des modèles open source très performants." },
  { q: "La 'température' contrôle quoi dans un LLM ?", opts: ["La vitesse", "La créativité des réponses", "La sécurité", "Le coût"], correct: 1, expl: "Température 0 = réponses précises. Température 1 = réponses créatives et variées." },
];

const FLASH_Q = [
  { term: "LLM", def: "Large Language Model — modèle entraîné sur de vastes corpus de texte pour comprendre et générer du langage." },
  { term: "Prompt", def: "Instruction envoyée à l'IA. La qualité du prompt détermine directement la qualité de la réponse." },
  { term: "Token", def: "Unité de texte traitée par les LLMs. 1 token ≈ ¾ d'un mot. Les modèles ont une limite de tokens." },
  { term: "Fine-tuning", def: "Réentraîner un modèle sur des données spécifiques pour l'adapter à un domaine particulier." },
  { term: "RAG", def: "Retrieval-Augmented Generation — connecter une IA à une base de données externe pour des réponses précises." },
  { term: "Température", def: "Paramètre contrôlant la créativité de l'IA. 0 = déterministe, 1 = très créatif." },
  { term: "Chain of Thought", def: "Demander à l'IA de raisonner étape par étape pour améliorer la précision sur des problèmes complexes." },
  { term: "Hallucination", def: "Quand un LLM génère des informations fausses mais les présente avec confiance." },
  { term: "Context Window", def: "La quantité maximale de texte qu'un modèle peut analyser à la fois dans une conversation." },
  { term: "Multimodal", def: "Modèle capable de traiter plusieurs types de données : texte, images, audio, vidéo." },
];

const VF_Q = [
  { q: "ChatGPT peut inventer des informations fausses.", ans: true, expl: "Oui — c'est ce qu'on appelle une 'hallucination'. Toujours vérifier les infos factuelles importantes." },
  { q: "Un prompt plus long donne toujours une meilleure réponse.", ans: false, expl: "Non. La précision et la structure comptent plus que la longueur." },
  { q: "GPT-4 a été développé par OpenAI.", ans: true, expl: "Exact. GPT-4 (Generative Pre-trained Transformer 4) est le modèle principal d'OpenAI." },
  { q: "Il est possible d'utiliser l'IA localement sans internet.", ans: true, expl: "Oui, avec Ollama + LLaMA. Idéal pour la confidentialité des données sensibles." },
  { q: "L'IA a des émotions et une conscience propre.", ans: false, expl: "Non. Les LLMs génèrent du texte statistiquement probable. Ils simulent le langage, sans conscience." },
  { q: "On peut partager des données clients dans ChatGPT sans risque.", ans: false, expl: "Non. Respectez le RGPD — ne partagez jamais de données personnelles de clients." },
];

function JeuxPanel() {
  type GameId = "quiz" | "flash" | "vraifaux" | null;
  const [game, setGame] = useState<GameId>(null);

  /* Quiz */
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizSel, setQuizSel] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizDone, setQuizDone] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  /* Flash */
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  /* Vrai/Faux */
  const [vfIdx, setVfIdx] = useState(0);
  const [vfAns, setVfAns] = useState<boolean | null>(null);
  const [vfScore, setVfScore] = useState(0);
  const [vfDone, setVfDone] = useState(false);

  const quizScore = quizAnswers.filter((a, i) => a === QUIZ_Q[i].correct).length;

  function handleQuiz(idx: number) {
    if (quizSel !== null) return;
    setQuizSel(idx);
    setTimeout(() => {
      const next = [...quizAnswers, idx];
      setQuizAnswers(next);
      if (quizIdx + 1 >= QUIZ_Q.length) setQuizDone(true);
      else { setQuizIdx(q => q + 1); setQuizSel(null); }
    }, 900);
  }
  function resetQuiz() { setQuizIdx(0); setQuizSel(null); setQuizAnswers([]); setQuizDone(false); setQuizStarted(false); }
  function nextCard() { setFlipped(false); setTimeout(() => setCardIdx(i => (i + 1) % FLASH_Q.length), 150); }
  function prevCard() { setFlipped(false); setTimeout(() => setCardIdx(i => (i - 1 + FLASH_Q.length) % FLASH_Q.length), 150); }
  function handleVF(ans: boolean) {
    if (vfAns !== null) return;
    setVfAns(ans);
    if (ans === VF_Q[vfIdx].ans) setVfScore(s => s + 1);
    setTimeout(() => {
      if (vfIdx + 1 >= VF_Q.length) setVfDone(true);
      else { setVfIdx(i => i + 1); setVfAns(null); }
    }, 1300);
  }
  function resetVF() { setVfIdx(0); setVfAns(null); setVfScore(0); setVfDone(false); }

  const cardColor = "#a78bfa";

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {game && (
          <button onClick={() => setGame(null)} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
            <ChevronLeft size={13} /> Jeux
          </button>
        )}
        {!game && (
          <>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(167,139,250,0.12)] border border-[rgba(167,139,250,0.2)]">
              <Gamepad2 size={15} className="text-[#a78bfa]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Jeux IA</h2>
              <p className="text-xs text-white/35">Apprenez l'IA en jouant — 3 jeux interactifs</p>
            </div>
          </>
        )}
      </div>

      {/* Game selector */}
      {!game && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { id: "quiz",    color: "#a78bfa", title: "Quiz IA",      badge: "8 questions", desc: "Testez vos connaissances sur l'IA avec explications." },
            { id: "flash",   color: "#38bdf8", title: "Flash Cards",  badge: "10 cartes",   desc: "10 termes clés — cliquez pour révéler la définition." },
            { id: "vraifaux",color: "#4ade80", title: "Vrai ou Faux", badge: "6 questions", desc: "6 affirmations sur l'IA — vrai ou faux ?" },
          ].map(({ id, color, title, badge, desc }) => (
            <motion.button
              key={id}
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setGame(id as GameId)}
              className="relative overflow-hidden rounded-[1.5rem] border border-white/8 bg-[rgba(15,17,23,0.65)] p-5 text-left"
            >
              <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${color}10 0%, transparent 60%)` }} />
              <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }} />
              <div className="relative mb-3 flex items-start justify-between">
                <span className="rounded-full px-2 py-0.5 text-[0.6rem] font-bold" style={{ color, backgroundColor: color + "15", border: `1px solid ${color}25` }}>{badge}</span>
              </div>
              <p className="relative text-sm font-extrabold text-white">{title}</p>
              <p className="relative mt-1.5 text-xs leading-relaxed text-white/40">{desc}</p>
              <div className="relative mt-3 flex items-center gap-1 text-xs font-bold" style={{ color }}>
                <Play size={9} fill={color} /> Jouer
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* ═══ QUIZ ═══ */}
      {game === "quiz" && (
        <div className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(167,139,250,0.25)] bg-[rgba(15,17,23,0.75)] p-6">
          <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(167,139,250,0.08) 0%, transparent 60%)" }} />
          <div className="relative">
            {!quizStarted ? (
              <div className="text-center py-6 space-y-4">
                <h3 className="text-xl font-black text-white">Quiz IA — 8 questions</h3>
                <p className="text-sm text-white/40">Explication après chaque réponse</p>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => setQuizStarted(true)}
                  className="inline-flex items-center gap-2 rounded-2xl px-7 py-3 text-sm font-extrabold text-black shadow-[0_4px_20px_rgba(167,139,250,0.35)]"
                  style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed)" }}>
                  <Play size={13} fill="black" /> Commencer
                </motion.button>
              </div>
            ) : quizDone ? (
              <div className="text-center py-4 space-y-4">
                <p className="text-2xl font-black text-white">{quizScore}/8</p>
                <p className="text-sm text-white/40">{quizScore >= 7 ? "Excellent ! Vous maîtrisez les bases." : "Relisez les cours et réessayez."}</p>
                <button onClick={resetQuiz} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-xs font-bold text-white/60 hover:text-white">
                  <RefreshCw size={11} /> Rejouer
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Question {quizIdx + 1}/8</span>
                  <div className="flex gap-1">{QUIZ_Q.map((_, i) => <div key={i} className={`h-1.5 w-5 rounded-full ${i < quizIdx ? "bg-[#a78bfa]" : i === quizIdx ? "bg-[#a78bfa] opacity-50" : "bg-white/10"}`} />)}</div>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div key={quizIdx} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
                    <p className="text-base font-bold text-white mb-3">{QUIZ_Q[quizIdx].q}</p>
                    <div className="space-y-2">
                      {QUIZ_Q[quizIdx].opts.map((opt, i) => {
                        const isCorrect = i === QUIZ_Q[quizIdx].correct;
                        const isSel = quizSel === i;
                        const rev = quizSel !== null;
                        return (
                          <motion.button key={i} whileHover={!rev ? { x: 3 } : {}}
                            onClick={() => handleQuiz(i)} disabled={rev}
                            className={`w-full rounded-xl border px-4 py-2.5 text-left text-xs font-semibold transition-all ${
                              !rev ? "border-white/8 bg-white/4 text-white/65 hover:border-white/20 hover:text-white" :
                              isCorrect ? "border-[rgba(74,222,128,0.4)] bg-[rgba(74,222,128,0.1)] text-[#4ade80]" :
                              isSel ? "border-[rgba(248,113,113,0.4)] bg-[rgba(248,113,113,0.1)] text-[#f87171]" :
                              "border-white/4 bg-white/2 text-white/20"
                            }`}>
                            <span className="mr-2 font-black">{String.fromCharCode(65 + i)}.</span>{opt}
                            {rev && isCorrect && <CheckCircle2 size={12} className="inline ml-2 text-[#4ade80]" />}
                          </motion.button>
                        );
                      })}
                    </div>
                    {quizSel !== null && (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        className="mt-3 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[rgba(167,139,250,0.08)] px-4 py-3">
                        <p className="text-xs font-bold text-[#a78bfa]">Explication</p>
                        <p className="mt-1 text-xs text-white/55 leading-relaxed">{QUIZ_Q[quizIdx].expl}</p>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ FLASH CARDS ═══ */}
      {game === "flash" && (
        <div className="space-y-4">
          <p className="text-center text-xs text-white/35">Cliquez sur la carte pour révéler la définition</p>
          <div style={{ perspective: "1000px" }} className="cursor-pointer" onClick={() => setFlipped(f => !f)}>
            <motion.div animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.5 }} style={{ transformStyle: "preserve-3d" }} className="relative h-52">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[1.75rem] border border-[rgba(56,189,248,0.25)] bg-[rgba(15,17,23,0.8)] p-6 text-center" style={{ backfaceVisibility: "hidden" }}>
                <div className="pointer-events-none absolute inset-0 rounded-[1.75rem]" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(56,189,248,0.08) 0%, transparent 70%)" }} />
                <span className="relative text-4xl font-black text-[#38bdf8]">{FLASH_Q[cardIdx].term}</span>
                <p className="relative text-xs text-white/25">Cliquez pour retourner</p>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[1.75rem] border border-[rgba(56,189,248,0.3)] bg-[rgba(15,20,35,0.9)] p-6 text-center" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                <div className="pointer-events-none absolute inset-0 rounded-[1.75rem]" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(56,189,248,0.1) 0%, transparent 70%)" }} />
                <p className="relative text-sm font-extrabold text-[#38bdf8]">{FLASH_Q[cardIdx].term}</p>
                <p className="relative text-sm leading-relaxed text-white/65">{FLASH_Q[cardIdx].def}</p>
              </div>
            </motion.div>
          </div>
          <div className="flex items-center justify-between">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={prevCard} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 hover:text-white">
              <ChevronLeft size={16} />
            </motion.button>
            <div className="flex flex-wrap justify-center gap-1.5 max-w-sm">
              {FLASH_Q.map((_, i) => <button key={i} onClick={() => { setFlipped(false); setTimeout(() => setCardIdx(i), 150); }} className={`h-1.5 rounded-full transition-all ${i === cardIdx ? "w-5 bg-[#38bdf8]" : "w-1.5 bg-white/15"}`} />)}
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={nextCard} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 hover:text-white">
              <ChevronRight size={16} />
            </motion.button>
          </div>
          <p className="text-center text-xs text-white/25">{cardIdx + 1} / {FLASH_Q.length}</p>
        </div>
      )}

      {/* ═══ VRAI OU FAUX ═══ */}
      {game === "vraifaux" && (
        <div className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(74,222,128,0.2)] bg-[rgba(15,17,23,0.75)] p-6">
          <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(74,222,128,0.06) 0%, transparent 60%)" }} />
          <div className="relative">
            {vfDone ? (
              <div className="text-center py-4 space-y-4">
                <p className="text-2xl font-black text-white">{vfScore}/{VF_Q.length}</p>
                <p className="text-sm text-white/40">{vfScore >= 5 ? "Excellent !" : "Relisez les cours pour consolider vos bases."}</p>
                <button onClick={resetVF} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-xs font-bold text-white/60 hover:text-white">
                  <RefreshCw size={11} /> Rejouer
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Question {vfIdx + 1}/{VF_Q.length}</span>
                  <span className="text-xs font-bold text-[#4ade80]">Score : {vfScore}</span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div key={vfIdx} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.2 }}>
                    <p className="text-lg font-extrabold text-white text-center mb-6 leading-snug">{VF_Q[vfIdx].q}</p>
                    <div className="grid grid-cols-2 gap-3">
                      {([{ label: "VRAI", val: true, color: "#4ade80" }, { label: "FAUX", val: false, color: "#f87171" }] as const).map(({ label, val, color }) => {
                        const isCor = val === VF_Q[vfIdx].ans;
                        const isSel = vfAns === val;
                        const rev = vfAns !== null;
                        return (
                          <motion.button key={label} whileHover={!rev ? { scale: 1.04 } : {}} whileTap={!rev ? { scale: 0.96 } : {}}
                            onClick={() => handleVF(val)} disabled={rev}
                            className={`rounded-2xl border py-5 text-base font-extrabold transition-all ${
                              !rev ? "border-white/10 bg-white/5 text-white/70 hover:text-white" :
                              isCor ? "border-[rgba(74,222,128,0.4)] bg-[rgba(74,222,128,0.12)] text-[#4ade80]" :
                              isSel ? "border-[rgba(248,113,113,0.4)] bg-[rgba(248,113,113,0.1)] text-[#f87171]" :
                              "border-white/5 bg-white/2 text-white/20"
                            }`}>
                            {label}
                          </motion.button>
                        );
                      })}
                    </div>
                    {vfAns !== null && (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        className={`mt-4 rounded-xl border px-4 py-3 ${vfAns === VF_Q[vfIdx].ans ? "border-[rgba(74,222,128,0.25)] bg-[rgba(74,222,128,0.08)]" : "border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.08)]"}`}>
                        <p className={`text-xs font-bold mb-1 ${vfAns === VF_Q[vfIdx].ans ? "text-[#4ade80]" : "text-[#f87171]"}`}>{vfAns === VF_Q[vfIdx].ans ? "Bonne réponse !" : "Mauvaise réponse"}</p>
                        <p className="text-xs text-white/50 leading-relaxed">{VF_Q[vfIdx].expl}</p>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE PRINCIPALE
───────────────────────────────────────────────────────── */
export default function EspaceCoachingIA() {
  const { access, user } = useCoachingIAAccess();

  /* ── State ─────────────────────────────────────────────── */
  const [completed,         setCompleted]         = useState<Set<string>>(new Set());
  const [favorites,         setFavorites]         = useState<Set<string>>(new Set());
  const [selectedModuleId,  setSelectedModuleId]  = useState<string>("1");
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>("1.1");
  const [expandedModules,   setExpandedModules]   = useState<Set<string>>(new Set(["1"]));
  const [view,              setView]              = useState<View>("chapter");
  const [sidebarOpen,       setSidebarOpen]       = useState(true);
  const [focusMode,         setFocusMode]         = useState(false);
  const [assistantInitMsg,  setAssistantInitMsg]  = useState<string | undefined>();

  /* ── Load from localStorage ────────────────────────────── */
  useEffect(() => {
    setCompleted(loadProgress());
    setFavorites(loadFavorites());
  }, []);

  /* ── Helpers ───────────────────────────────────────────── */
  const currentModule  = COACHING_MODULES.find((m) => m.id === selectedModuleId)!;
  const currentChapter = currentModule?.chapters.find((c) => c.id === selectedChapterId) ?? currentModule?.chapters[0];

  const totalChapters  = COACHING_MODULES.reduce((a, m) => a + m.chapters.length, 0);
  const completedCount = completed.size;
  const overallPct     = Math.round((completedCount / totalChapters) * 100);
  const favCount       = favorites.size;

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

  function toggleFavorite() {
    if (!selectedChapterId) return;
    const next = new Set(favorites);
    next.has(selectedChapterId) ? next.delete(selectedChapterId) : next.add(selectedChapterId);
    setFavorites(next);
    saveFavorites(next);
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

  const currentContext = currentChapter
    ? `Module ${selectedModuleId} "${currentModule?.title}" — Chapitre "${currentChapter.title}"`
    : undefined;

  /* ── Access gate ──────────────────────────────────────── */
  if (access === "loading") return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#07080e]">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-[rgba(167,139,250,0.15)]" />
        <div className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-t-[#a78bfa]" />
        <Brain size={22} className="relative text-[#a78bfa]" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-white/60">Vérification de votre accès…</p>
        <p className="mt-1 text-xs text-white/25">Authentification en cours</p>
      </div>
    </div>
  );
  /* Virement ou paiement en attente de confirmation admin */
  if (access === "pending") return <PendingGate user={user} />;
  const devBypass = process.env.NEXT_PUBLIC_DEV_BYPASS_COACHING === "true";
  if (access === "preview" && !devBypass) return <PreviewGate user={user} />;

  const TAB_ITEMS: { key: View; icon: React.ElementType; label: string; badge?: number }[] = [
    { key: "chapter",   icon: BookOpen,    label: "Cours" },
    { key: "assistant", icon: Bot,         label: "Assistant IA" },
    { key: "jeux",      icon: Gamepad2,    label: "Jeux IA" },
    { key: "favorites", icon: Star,        label: "Favoris", badge: favCount || undefined },
    { key: "booking",   icon: Calendar,    label: "Réserver" },
  ];

  return (
    <div className={`flex overflow-hidden bg-[#07080e] transition-all duration-300 ${focusMode ? "h-screen" : "h-[calc(100vh-56px)]"}`}>

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && !focusMode && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 248, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease }}
            className="flex shrink-0 flex-col overflow-hidden border-r border-white/[0.06] bg-[#07080e]"
            style={{ width: 248 }}
          >
            {/* Progress global */}
            <div className="border-b border-white/[0.06] px-4 py-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[0.62rem] font-semibold uppercase tracking-widest text-white/30">
                  Progression globale
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
              <p className="mt-1.5 text-[0.58rem] text-white/20">
                {completedCount}/{totalChapters} chapitres · {COACHING_MODULES.length} modules
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
                    favorites={favorites}
                  />
                );
              })}
            </div>

            {/* Sidebar bottom shortcuts */}
            <div className="border-t border-white/[0.06] space-y-1 px-2 py-3">
              <button onClick={() => setView("assistant")}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                  view === "assistant"
                    ? "bg-[rgba(167,139,250,0.1)] text-[#a78bfa]"
                    : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
                }`}>
                <Bot size={14} /> Assistant IA
              </button>
              <button onClick={() => setView("favorites")}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                  view === "favorites"
                    ? "bg-[rgba(249,168,38,0.1)] text-[#f9a826]"
                    : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
                }`}>
                <span className="flex items-center gap-3"><Star size={14} /> Favoris</span>
                {favCount > 0 && (
                  <span className="rounded-full bg-[rgba(249,168,38,0.15)] px-1.5 py-0.5 text-[0.55rem] font-bold text-[#f9a826]">
                    {favCount}
                  </span>
                )}
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── CONTENU PRINCIPAL ────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2">

          {/* Toggle sidebar / focus mode */}
          <button
            onClick={() => focusMode ? setFocusMode(false) : setSidebarOpen((p) => !p)}
            title={focusMode ? "Quitter le mode focus" : sidebarOpen ? "Masquer le menu" : "Afficher le menu"}
            className="rounded-lg p-1.5 text-white/30 transition hover:bg-white/[0.05] hover:text-white/70"
          >
            {focusMode
              ? <Minimize2 size={15} />
              : sidebarOpen ? <ChevronLeft size={15} /> : <ChevronRight size={15} />
            }
          </button>

          <div className="h-4 w-px bg-white/[0.08]" />

          {/* Tabs */}
          {TAB_ITEMS.map(({ key, icon: Icon, label, badge }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                view === key
                  ? "border border-[rgba(167,139,250,0.25)] bg-[rgba(167,139,250,0.1)] text-[#a78bfa]"
                  : "text-white/35 hover:bg-white/[0.04] hover:text-white/65"
              }`}
            >
              <Icon size={13} /> {label}
              {badge !== undefined && badge > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#f9a826] text-[0.5rem] font-black text-black">
                  {badge}
                </span>
              )}
            </button>
          ))}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Current chapter breadcrumb */}
          {view === "chapter" && currentChapter && !focusMode && (
            <span className="hidden truncate text-[0.62rem] text-white/20 sm:block max-w-[200px]">
              {currentChapter.title}
            </span>
          )}

          {/* Focus mode button */}
          {view === "chapter" && (
            <button
              onClick={() => { setFocusMode((p) => !p); if (!focusMode) setSidebarOpen(false); }}
              title={focusMode ? "Quitter le mode concentration" : "Mode concentration"}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[0.65rem] font-medium transition-all ${
                focusMode
                  ? "border-[rgba(96,165,250,0.35)] bg-[rgba(96,165,250,0.1)] text-[#60a5fa]"
                  : "border-white/[0.08] text-white/30 hover:border-white/[0.15] hover:text-white/60"
              }`}
            >
              <Maximize2 size={12} />
              {focusMode ? "Quitter focus" : "Focus"}
            </button>
          )}
        </div>

        {/* Vue principale */}
        <div className={`flex-1 overflow-y-auto ${focusMode ? "bg-[#07080e]" : ""}`}>
          <AnimatePresence mode="wait">

            {view === "chapter" && currentChapter && (
              <motion.div key={`chapter-${currentChapter.id}`}
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22, ease }}
                className={focusMode ? "mx-auto max-w-2xl" : ""}
              >
                <ChapterViewer
                  module={currentModule}
                  chapter={currentChapter}
                  isCompleted={completed.has(currentChapter.id)}
                  isFavorite={favorites.has(currentChapter.id)}
                  onComplete={markCompleted}
                  onNext={goNext}
                  onToggleFavorite={toggleFavorite}
                  onAskAssistant={openAssistantWith}
                />
              </motion.div>
            )}

            {view === "assistant" && (
              <motion.div key="assistant"
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22, ease }}
                className="h-full"
              >
                <AssistantPanel
                  currentContext={currentContext}
                  initMessage={assistantInitMsg}
                  onInitConsumed={() => setAssistantInitMsg(undefined)}
                />
              </motion.div>
            )}

            {view === "favorites" && (
              <motion.div key="favorites"
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22, ease }}
              >
                <FavoritesPanel
                  favorites={favorites}
                  onSelectChapter={selectChapter}
                />
              </motion.div>
            )}

            {view === "booking" && (
              <motion.div key="booking"
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22, ease }}
              >
                <BookingPanel />
              </motion.div>
            )}

            {view === "jeux" && (
              <motion.div key="jeux"
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22, ease }}
              >
                <JeuxPanel />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
