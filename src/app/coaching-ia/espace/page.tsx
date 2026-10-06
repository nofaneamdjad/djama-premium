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
  Shield, RefreshCw, Gamepad2, Trophy, Timer, LayoutDashboard, Users2, StopCircle,
} from "lucide-react";
import { COACHING_MODULES, getNextChapter, type Module, type Chapter } from "@/lib/coaching-content";
import { useCoachingIAAccess } from "@/lib/use-require-coaching-ia";
import { useTheme } from "@/lib/theme-context";

const ease = [0.16, 1, 0.3, 1] as const;
const GOLD = "#c9a55a";

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
   STORAGE — Répétition espacée (SM-2 simplifié)
───────────────────────────────────────────────────────── */
const SR_KEY = "djama_sr_items";

interface SRItem {
  id:          string;
  nextReview:  number; // timestamp ms
  interval:    number; // jours
  easeFactor:  number; // 1.3 – 3.0
  repetitions: number;
}

function loadSRItems(): Record<string, SRItem> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SR_KEY);
    return raw ? JSON.parse(raw) as Record<string, SRItem> : {};
  } catch { return {}; }
}
function saveSRItems(items: Record<string, SRItem>) {
  try { localStorage.setItem(SR_KEY, JSON.stringify(items)); } catch {}
}

function enqueueForReview(chapterId: string) {
  const items = loadSRItems();
  if (items[chapterId]) return;
  items[chapterId] = {
    id:          chapterId,
    nextReview:  Date.now() + 24 * 60 * 60 * 1000,
    interval:    1,
    easeFactor:  2.5,
    repetitions: 0,
  };
  saveSRItems(items);
}

function updateSRItem(chapterId: string, quality: 0 | 3 | 5): SRItem {
  const items = loadSRItems();
  const prev  = items[chapterId] ?? {
    id: chapterId, nextReview: Date.now(), interval: 1, easeFactor: 2.5, repetitions: 0,
  };
  let { interval, easeFactor, repetitions } = prev;

  if (quality === 0) {
    interval = 1; repetitions = 0;
  } else {
    if      (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.max(1, Math.round(interval * easeFactor));
    easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    repetitions++;
  }

  const next: SRItem = {
    id:          chapterId,
    nextReview:  Date.now() + interval * 24 * 60 * 60 * 1000,
    interval,
    easeFactor,
    repetitions,
  };
  items[chapterId] = next;
  saveSRItems(items);
  return next;
}

function getDueItems(): SRItem[] {
  const items = loadSRItems();
  const now   = Date.now() + 60 * 60 * 1000; // +1h buffer
  return Object.values(items).filter((i) => i.nextReview <= now);
}

function getUpcomingItems(days = 7): { day: number; count: number }[] {
  const items = Object.values(loadSRItems());
  const now   = Date.now();
  const result: Record<number, number> = {};
  for (let d = 1; d <= days; d++) result[d] = 0;
  for (const item of items) {
    const daysDiff = Math.ceil((item.nextReview - now) / (24 * 60 * 60 * 1000));
    if (daysDiff >= 1 && daysDiff <= days) result[daysDiff]++;
  }
  return Object.entries(result).map(([d, c]) => ({ day: Number(d), count: c })).filter((x) => x.count > 0);
}

/* ─────────────────────────────────────────────────────────
   STORAGE — Objectifs quotidiens (Phase 9)
───────────────────────────────────────────────────────── */
const DAILY_GOAL_KEY  = "djama_daily_goal";
const DAILY_STATS_KEY = "djama_daily_stats";

function loadDailyGoal(): number {
  if (typeof window === "undefined") return 2;
  try { return Number(localStorage.getItem(DAILY_GOAL_KEY) ?? "2"); } catch { return 2; }
}
function saveDailyGoal(n: number) {
  try { localStorage.setItem(DAILY_GOAL_KEY, String(n)); } catch {}
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

interface DailyStats { date: string; count: number }

function loadDailyStats(): DailyStats {
  if (typeof window === "undefined") return { date: getTodayKey(), count: 0 };
  try {
    const raw = localStorage.getItem(DAILY_STATS_KEY);
    const data = raw ? JSON.parse(raw) as DailyStats : null;
    if (data?.date === getTodayKey()) return data;
    return { date: getTodayKey(), count: 0 };
  } catch { return { date: getTodayKey(), count: 0 }; }
}
function bumpDailyStats() {
  const s = loadDailyStats();
  try { localStorage.setItem(DAILY_STATS_KEY, JSON.stringify({ date: getTodayKey(), count: s.count + 1 })); } catch {}
}

/* ─────────────────────────────────────────────────────────
   CONTEXTE PROFESSIONNEL (Phase 12)
   Stocké en localStorage — injecté dans chaque appel IA
───────────────────────────────────────────────────────── */
const CTX_KEY = "djama_user_context";

interface UserCtx { role: string; objective: string; level: "debutant" | "intermediaire" | "avance" }

function loadUserCtx(): UserCtx {
  if (typeof window === "undefined") return { role: "", objective: "", level: "debutant" };
  try {
    const raw = localStorage.getItem(CTX_KEY);
    return raw ? JSON.parse(raw) as UserCtx : { role: "", objective: "", level: "debutant" };
  } catch { return { role: "", objective: "", level: "debutant" }; }
}
function saveUserCtx(ctx: UserCtx) {
  try { localStorage.setItem(CTX_KEY, JSON.stringify(ctx)); } catch {}
}
function formatUserCtxForPrompt(ctx: UserCtx): string | undefined {
  const parts: string[] = [];
  if (ctx.role)      parts.push(`Secteur / rôle : ${ctx.role}`);
  const lvlLabel = ctx.level === "intermediaire" ? "Intermédiaire" : ctx.level === "avance" ? "Avancé" : "Débutant";
  parts.push(`Niveau IA déclaré : ${lvlLabel}`);
  if (ctx.objective) parts.push(`Objectif principal : ${ctx.objective}`);
  return parts.length > 1 ? parts.join("\n") : undefined;
}

function ContexteProCard() {
  const { isDark } = useTheme();
  const [ctx,     setCtx]     = useState<UserCtx>({ role: "", objective: "", level: "debutant" });
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState<UserCtx>(ctx);

  useEffect(() => { const c = loadUserCtx(); setCtx(c); setDraft(c); }, []);

  function save() { saveUserCtx(draft); setCtx(draft); setEditing(false); }

  const isEmpty = !ctx.role && !ctx.objective;
  const lvlLabels = { debutant: "Débutant", intermediaire: "Intermédiaire", avance: "Avancé" };
  const lvlColors = { debutant: "#60a5fa", intermediaire: "#f59e0b", avance: "#8b5cf6" };

  const cp = {
    pri:   isDark ? "text-white"        : "text-[#0e1420]",
    sec:   isDark ? "text-white/50"     : "text-[#0e1420]/55",
    mut:   isDark ? "text-white/30"     : "text-[#0e1420]/35",
    card:  isDark ? "border-white/[0.07] bg-white/[0.03]" : "border-black/[0.07] bg-white shadow-sm",
    input: isDark
      ? "border-white/[0.1] bg-white/[0.04] text-white placeholder:text-white/20 focus:border-white/[0.2]"
      : "border-black/[0.1] bg-black/[0.02] text-[#0e1420] placeholder:text-[#0e1420]/25 focus:border-black/[0.2]",
    lbl: `text-[0.62rem] font-bold uppercase tracking-widest ${isDark ? "text-white/25" : "text-[#0e1420]/30"}`,
  };

  return (
    <div className={`rounded-2xl border p-5 ${cp.card}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(201,165,90,0.12)] border border-[rgba(201,165,90,0.2)]">
            <User size={14} className="text-[#c9a55a]" />
          </div>
          <p className={`text-sm font-extrabold ${cp.pri}`}>Mon profil professionnel</p>
        </div>
        {!editing && (
          <button onClick={() => { setDraft(ctx); setEditing(true); }}
            className={`rounded-lg border px-3 py-1 text-[0.62rem] font-bold transition-colors ${
              isDark ? "border-white/10 bg-white/[0.04] text-white/50 hover:text-white" : "border-black/10 bg-black/[0.03] text-[#0e1420]/50 hover:text-[#0e1420]"
            }`}>
            {isEmpty ? "Configurer" : "Modifier"}
          </button>
        )}
      </div>

      {!editing ? (
        isEmpty ? (
          <div className="rounded-xl border border-dashed border-[rgba(201,165,90,0.2)] p-4 text-center">
            <p className={`text-xs ${cp.mut}`}>Personnalisez le Coach IA avec votre contexte professionnel.</p>
            <p className={`mt-0.5 text-[0.6rem] ${cp.mut} opacity-60`}>Secteur, objectif, niveau — les réponses seront adaptées à votre réalité.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ctx.role && (
              <div className="flex items-center gap-2">
                <span className={`text-[0.6rem] w-20 shrink-0 ${cp.mut}`}>Secteur</span>
                <span className={`text-xs font-semibold ${cp.sec}`}>{ctx.role}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className={`text-[0.6rem] w-20 shrink-0 ${cp.mut}`}>Niveau IA</span>
              <span className="text-xs font-bold" style={{ color: lvlColors[ctx.level] }}>{lvlLabels[ctx.level]}</span>
            </div>
            {ctx.objective && (
              <div className="flex items-start gap-2">
                <span className={`text-[0.6rem] w-20 shrink-0 mt-0.5 ${cp.mut}`}>Objectif</span>
                <span className={`text-xs leading-relaxed ${cp.sec}`}>{ctx.objective}</span>
              </div>
            )}
          </div>
        )
      ) : (
        <div className="space-y-4">
          <div>
            <p className={`mb-1.5 ${cp.lbl}`}>Secteur / rôle professionnel</p>
            <input
              value={draft.role}
              onChange={(e) => setDraft({ ...draft, role: e.target.value })}
              placeholder="Ex: Gérant d'épicerie à Mayotte, importateur-exportateur, consultant…"
              className={`w-full rounded-xl border px-4 py-2.5 text-xs outline-none transition-all ${cp.input}`}
            />
          </div>
          <div>
            <p className={`mb-2 ${cp.lbl}`}>Niveau en IA</p>
            <div className="flex gap-2">
              {(["debutant", "intermediaire", "avance"] as const).map((l) => (
                <button key={l}
                  onClick={() => setDraft({ ...draft, level: l })}
                  className="flex-1 rounded-xl border py-2 text-[0.62rem] font-bold transition-all"
                  style={draft.level === l
                    ? { borderColor: `${lvlColors[l]}50`, background: `${lvlColors[l]}15`, color: lvlColors[l] }
                    : { borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
                  {lvlLabels[l]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className={`mb-1.5 ${cp.lbl}`}>Objectif principal avec l'IA</p>
            <textarea
              value={draft.objective}
              onChange={(e) => setDraft({ ...draft, objective: e.target.value })}
              placeholder="Ex: Automatiser mes devis et relances clients, créer du contenu pour mon e-commerce…"
              rows={2}
              className={`w-full resize-none rounded-xl border px-4 py-2.5 text-xs outline-none transition-all ${cp.input}`}
            />
          </div>
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={save}
              className="flex-1 rounded-xl py-2 text-xs font-bold text-black"
              style={{ background: "linear-gradient(135deg, #c9a55a, #a07840)" }}>
              Enregistrer
            </motion.button>
            <button onClick={() => setEditing(false)}
              className={`rounded-xl border px-4 py-2 text-xs font-bold transition-colors ${
                isDark ? "border-white/10 text-white/50 hover:text-white" : "border-black/10 text-[#0e1420]/50"
              }`}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   DONNÉES — Domaines de compétences transversales (Phase 9)
───────────────────────────────────────────────────────── */
const SKILL_DOMAINS = [
  { id: "fondamentaux", label: "Fondamentaux IA",      moduleIds: ["1"],         color: "#06b6d4", icon: Brain },
  { id: "prompting",    label: "Prompt Engineering",   moduleIds: ["2"],         color: "#8b5cf6", icon: Zap },
  { id: "outils",       label: "Maîtrise des outils",  moduleIds: ["3","4","5"], color: "#f59e0b", icon: Sparkles },
  { id: "automation",   label: "Automatisation",       moduleIds: ["6"],         color: "#10b981", icon: RefreshCw },
  { id: "business",     label: "IA pour le Business",  moduleIds: ["7","8"],     color: "#ec4899", icon: Target },
  { id: "avance",       label: "IA Avancée & Projet",  moduleIds: ["9","10"],    color: "#f97316", icon: Award },
] as const;

function getSkillLevel(pct: number): { label: string; color: string } {
  if (pct === 0)   return { label: "Non commencé",  color: "#6b7280" };
  if (pct < 25)    return { label: "Débutant",       color: "#ef4444" };
  if (pct < 50)    return { label: "Intermédiaire",  color: "#f59e0b" };
  if (pct < 75)    return { label: "Avancé",          color: "#3b82f6" };
  if (pct < 100)   return { label: "Expert",          color: "#8b5cf6" };
  return           { label: "Certifié",              color: "#34d399" };
}

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
type View      = "dashboard" | "chapter" | "assistant" | "booking" | "favorites" | "jeux" | "progression";
type AiAction  = "summarize" | "simplify" | "quiz" | "action_plan" | "create_prompt";

/* ─────────────────────────────────────────────────────────
   UTILITY — CopyButton
───────────────────────────────────────────────────────── */
function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const { isDark } = useTheme();
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  const idle = isDark
    ? "border-white/[0.1] bg-white/[0.04] text-white/40 hover:border-white/[0.2] hover:text-white/70"
    : "border-black/10 bg-black/[0.03] text-[#0e1420]/40 hover:border-black/20 hover:text-[#0e1420]/70";
  return (
    <button
      onClick={copy}
      title="Copier"
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[0.65rem] font-semibold transition-all ${
        copied ? "border-[rgba(52,211,153,0.4)] bg-[rgba(52,211,153,0.1)] text-[#34d399]" : idle
      } ${className}`}
    >
      {copied ? <><Check size={10} /> Copié !</> : <><Copy size={10} /> Copier</>}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   GAMIFICATION
───────────────────────────────────────────────────────── */
const STREAK_KEY     = "djama_coaching_streak";
const STREAK_DAY_KEY = "djama_coaching_streak_day";
const XP_PER_CHAPTER = 50;

const LEVEL_DATA = [
  { name: "Novice",    min: 0,    color: "#94a3b8" },
  { name: "Apprenti",  min: 300,  color: "#60a5fa" },
  { name: "Praticien", min: 700,  color: "#a78bfa" },
  { name: "Expert IA", min: 1400, color: "#f59e0b" },
  { name: "Maître IA", min: 2500, color: "#c9a55a" },
];

function getLevel(xp: number) {
  let idx = 0;
  for (let i = 0; i < LEVEL_DATA.length; i++) { if (xp >= LEVEL_DATA[i].min) idx = i; }
  const next = LEVEL_DATA[idx + 1];
  const pct  = next ? Math.min(100, Math.round(((xp - LEVEL_DATA[idx].min) / (next.min - LEVEL_DATA[idx].min)) * 100)) : 100;
  return { ...LEVEL_DATA[idx], pct, xpNext: next ? next.min - xp : 0, nextName: next?.name };
}

function loadStreak(): { streak: number; updatedToday: boolean } {
  if (typeof window === "undefined") return { streak: 0, updatedToday: false };
  try {
    const today   = new Date().toDateString();
    const lastDay = localStorage.getItem(STREAK_DAY_KEY);
    const stored  = parseInt(localStorage.getItem(STREAK_KEY) ?? "0", 10);
    if (!lastDay) return { streak: 0, updatedToday: false };
    if (lastDay === today) return { streak: stored, updatedToday: true };
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    return { streak: lastDay === yesterday.toDateString() ? stored : 0, updatedToday: false };
  } catch { return { streak: 0, updatedToday: false }; }
}

function bumpStreak() {
  if (typeof window === "undefined") return;
  const today = new Date().toDateString();
  const { updatedToday, streak } = loadStreak();
  if (updatedToday) return;
  localStorage.setItem(STREAK_KEY, String(streak + 1));
  localStorage.setItem(STREAK_DAY_KEY, today);
}

/* ─────────────────────────────────────────────────────────
   GAMIFICATION — Badges persistants + Toasts (Phase 10)
───────────────────────────────────────────────────────── */
const EARNED_BADGES_KEY = "djama_earned_badges";

function loadEarnedBadges(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(EARNED_BADGES_KEY);
    return new Set(raw ? JSON.parse(raw) as string[] : []);
  } catch { return new Set(); }
}
function saveEarnedBadges(s: Set<string>) {
  try { localStorage.setItem(EARNED_BADGES_KEY, JSON.stringify([...s])); } catch {}
}

type BadgeDef = { id: string; label: string; Icon: React.ElementType; color: string; desc: string };

const ALL_BADGES: BadgeDef[] = [
  { id: "first",     label: "Premier pas",      Icon: CheckCircle2, color: "#34d399", desc: "1er chapitre terminé" },
  { id: "week",      label: "7 jours de suite", Icon: Timer,        color: "#f59e0b", desc: "Série de 7 jours" },
  { id: "halfway",   label: "Mi-parcours",       Icon: Zap,          color: "#60a5fa", desc: "50% du programme" },
  { id: "module",    label: "Module Expert",     Icon: Brain,        color: GOLD,      desc: "1 module à 100%" },
  { id: "quiz",      label: "Quiz Master",       Icon: Trophy,       color: GOLD,      desc: "5 quiz validés" },
  { id: "certified", label: "Certifié DJAMA",    Icon: Award,        color: "#34d399", desc: "100% du programme" },
];

function checkBadgeEarned(id: string, s: {
  completedCount: number; streak: number; overallPct: number;
  doneModules: number; quizDone: number;
}): boolean {
  switch (id) {
    case "first":     return s.completedCount >= 1;
    case "week":      return s.streak >= 7;
    case "halfway":   return s.overallPct >= 50;
    case "module":    return s.doneModules >= 1;
    case "quiz":      return s.quizDone >= 5;
    case "certified": return s.overallPct === 100;
    default:          return false;
  }
}

function LevelUpToast({ name, color }: { name: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -24, scale: 0.9 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border px-6 py-4 shadow-xl backdrop-blur-sm"
      style={{ borderColor: `${color}40`, background: "linear-gradient(135deg, #07080eee, #12141aee)", boxShadow: `0 0 40px ${color}28` }}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${color}22`, border: `1px solid ${color}35` }}>
        <Trophy size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-white/40">Nouveau niveau !</p>
        <p className="text-base font-extrabold" style={{ color }}>{name}</p>
      </div>
      <motion.div animate={{ rotate: [0, 15, -15, 10, -10, 0] }} transition={{ delay: 0.3, duration: 0.6 }}>
        <Sparkles size={15} style={{ color }} />
      </motion.div>
    </motion.div>
  );
}

function BadgeToast({ label, Icon, color }: { label: string; Icon: React.ElementType; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -24, scale: 0.9 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border px-6 py-4 shadow-xl backdrop-blur-sm"
      style={{ borderColor: `${color}40`, background: "linear-gradient(135deg, #07080eee, #12141aee)", boxShadow: `0 0 40px ${color}28` }}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${color}22`, border: `1px solid ${color}35` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-white/40">Badge débloqué !</p>
        <p className="text-base font-extrabold" style={{ color }}>{label}</p>
      </div>
      <motion.div animate={{ scale: [1, 1.3, 1, 1.2, 1] }} transition={{ delay: 0.3, duration: 0.5 }}>
        <Star size={14} fill={color} style={{ color }} />
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   VIDEO PLAYER
───────────────────────────────────────────────────────── */
function VideoPlayer({ title, color, isDark = true }: { title: string; color: string; isDark?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const vidBg = isDark ? `linear-gradient(135deg, #07080e, ${color}18)` : `linear-gradient(135deg, #f0f2fb, ${color}22)`;
  const borderCls = isDark ? "border-white/8" : "border-black/[0.08]";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className={`mb-7 relative aspect-video w-full overflow-hidden rounded-2xl border cursor-pointer ${borderCls}`}
      style={{ background: vidBg }}
      onClick={() => setPlaying(p => !p)}
    >
      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 80% 60% at 50% 50%, ${color}10, transparent)` }} />
      <div className="pointer-events-none absolute inset-0 opacity-15" style={{ backgroundImage: `linear-gradient(${color}18 1px, transparent 1px), linear-gradient(90deg, ${color}18 1px, transparent 1px)`, backgroundSize: "44px 44px" }} />
      {!playing ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <motion.div whileHover={{ scale: 1.1 }}
            className="flex h-16 w-16 items-center justify-center rounded-full border-2"
            style={{ borderColor: color + "70", background: color + "25", boxShadow: `0 0 32px ${color}28` }}>
            <Play size={24} fill={color} style={{ color, marginLeft: 3 }} />
          </motion.div>
          <p className="text-sm font-bold text-white/80">{title}</p>
          <span className="rounded-full px-3 py-1 text-[0.6rem] font-bold" style={{ background: color + "20", color, border: `1px solid ${color}35` }}>Voir la leçon vidéo</span>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
            className="flex h-16 w-16 items-center justify-center rounded-full border-2"
            style={{ background: color + "28", borderColor: color + "60" }}>
            <div className="flex gap-2">
              <div className="h-5 w-1.5 rounded-full" style={{ background: color }} />
              <div className="h-5 w-1.5 rounded-full" style={{ background: color }} />
            </div>
          </motion.div>
          <p className="text-xs text-white/40">Cliquez pour pauser</p>
        </div>
      )}
      <div className="absolute bottom-3 right-3 rounded-lg bg-black/60 px-2.5 py-1 text-[0.6rem] font-bold text-white/60 backdrop-blur-sm">12:30</div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   QUIZ PAR MODULE (chapitres type="quiz")
───────────────────────────────────────────────────────── */
const MODULE_QUIZ: Record<string, { q: string; opts: string[]; correct: number }[]> = {
  "1": [
    { q: "Que signifie 'hallucination' dans le contexte d'un LLM ?", opts: ["Un bug d'affichage", "L'IA invente des infos fausses", "Un modèle créatif", "Une image générée"], correct: 1 },
    { q: "Que signifie LLM ?", opts: ["Light Learning Module", "Large Language Model", "Linked Logic Machine", "Language Learning Method"], correct: 1 },
    { q: "Quelle architecture a lancé l'ère des LLMs modernes ?", opts: ["CNN (1998)", "RNN (2014)", "Transformer (2017)", "Encoder/Decoder (2010)"], correct: 2 },
  ],
  "2": [
    { q: "Quelle méthode force l'IA à raisonner étape par étape ?", opts: ["Persona prompting", "Chain of Thought", "Few-shot learning", "RAG"], correct: 1 },
    { q: "Dans la méthode RCTC, que signifie le R ?", opts: ["Résultat", "Rôle", "Réponse", "Référence"], correct: 1 },
    { q: "Qu'est-ce que le 'few-shot' prompting ?", opts: ["Un prompt très court", "Donner des exemples dans le prompt", "Une IA entraînée peu de temps", "Un prompt en plusieurs messages"], correct: 1 },
  ],
  "3": [
    { q: "Quel modèle est développé par Anthropic ?", opts: ["GPT-4", "Gemini", "Claude", "Mistral"], correct: 2 },
    { q: "Que signifie RAG ?", opts: ["Random AI Generator", "Retrieval-Augmented Generation", "Reinforced Agent Guide", "Real AI Gateway"], correct: 1 },
    { q: "Quelle entreprise a créé ChatGPT ?", opts: ["Google", "Meta", "Anthropic", "OpenAI"], correct: 3 },
  ],
  "4": [
    { q: "Quel outil ChatGPT permet d'analyser des fichiers CSV ?", opts: ["Code Interpreter", "Advanced Data Analysis", "Plugin Data", "CSV Reader"], correct: 1 },
    { q: "Que signifie KPI ?", opts: ["Key Performance Indicator", "Knowledge Processing Index", "Key Product Interface", "Key Process Integration"], correct: 0 },
    { q: "Quel outil d'automatisation sans code est le plus utilisé ?", opts: ["Python", "Zapier", "Docker", "GitHub Actions"], correct: 1 },
  ],
  "5": [
    { q: "Quel outil de génération d'images est intégré à ChatGPT Plus ?", opts: ["Midjourney", "DALL-E 3", "Stable Diffusion", "Adobe Firefly"], correct: 1 },
    { q: "Que signifie 'negative prompt' en génération d'images ?", opts: ["Un prompt pessimiste", "Ce qu'on ne veut pas voir", "Un prompt d'erreur", "Un raccourci clavier"], correct: 1 },
    { q: "Quelle commande Midjourney définit le format de l'image ?", opts: ["--quality", "--ar", "--style", "--version"], correct: 1 },
  ],
  "6": [
    { q: "Qu'est-ce qu'un agent IA ?", opts: ["Un modèle qui répond aux questions", "Un modèle qui effectue des actions autonomes", "Un chatbot basique", "Un réseau de neurones"], correct: 1 },
    { q: "Quel outil permet d'héberger un LLM localement ?", opts: ["Zapier", "Ollama", "Vercel", "HuggingChat"], correct: 1 },
    { q: "Que signifie Fine-tuning ?", opts: ["Ajuster la température", "Réentraîner un modèle sur des données spécifiques", "Nettoyer le prompt", "Accélérer l'inférence"], correct: 1 },
  ],
  "7": [
    { q: "Budget mensuel typique d'un stack IA complet pour entrepreneur ?", opts: ["10-20€", "50-80€", "80-200€", "500€+"], correct: 2 },
    { q: "Quelle compétence reste irremplaçable par l'IA ?", opts: ["Rédaction de base", "Analyse de données simples", "Jugement et vision stratégique", "Traduction"], correct: 2 },
    { q: "Gain de productivité moyen estimé avec l'IA ?", opts: ["30 min/jour", "1h/jour", "2–4h/jour", "8h/jour"], correct: 2 },
  ],
};

function InlineModuleQuiz({ moduleId, onComplete }: { moduleId: string; onComplete: () => void }) {
  const { isDark } = useTheme();
  const questions = MODULE_QUIZ[moduleId] ?? MODULE_QUIZ["1"]!;
  const [started,  setStarted]  = useState(false);
  const [qIdx,     setQIdx]     = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers,  setAnswers]  = useState<number[]>([]);
  const [done,     setDone]     = useState(false);

  const score = answers.filter((a, i) => a === questions[i]!.correct).length;
  const threshold = Math.ceil(questions.length / 2);

  function handleAnswer(idx: number) {
    if (selected !== null) return;
    setSelected(idx);
    setTimeout(() => {
      const next = [...answers, idx];
      setAnswers(next);
      if (qIdx + 1 >= questions.length) {
        setDone(true);
        if (next.filter((a, i) => a === questions[i]!.correct).length >= threshold) onComplete();
      } else { setQIdx(q => q + 1); setSelected(null); }
    }, 900);
  }

  function reset() { setQIdx(0); setSelected(null); setAnswers([]); setDone(false); setStarted(false); }

  const qBorderDiv = isDark ? "border-white/[0.07]" : "border-black/6";
  const qTextSec   = isDark ? "text-white/35" : "text-[#0e1420]/40";
  const qTextMut   = isDark ? "text-white/40" : "text-[#0e1420]/45";
  const qTextPri   = isDark ? "text-white" : "text-[#0e1420]";
  const qPipeDim   = isDark ? "bg-white/10" : "bg-black/8";
  const qOptIdle   = isDark
    ? "border-white/8 bg-white/4 text-white/65 hover:border-white/20 hover:text-white"
    : "border-black/[0.08] bg-black/[0.02] text-[#0e1420]/65 hover:border-black/20 hover:text-[#0e1420]";
  const qOptDim    = isDark ? "border-white/4 bg-white/2 text-white/20" : "border-black/4 bg-black/[0.01] text-[#0e1420]/20";
  const resetBtn   = isDark
    ? "border-white/10 bg-white/5 text-white/60 hover:text-white"
    : "border-black/10 bg-black/[0.03] text-[#0e1420]/60 hover:text-[#0e1420]";

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-[rgba(167,139,250,0.22)] bg-[rgba(167,139,250,0.05)]">
      <div className={`flex items-center gap-3 border-b px-5 py-4 ${qBorderDiv}`}>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(167,139,250,0.15)]"><Trophy size={14} className="text-[#a78bfa]" /></div>
        <div>
          <p className={`text-sm font-extrabold ${qTextPri}`}>Quiz de validation</p>
          <p className={`text-[0.62rem] ${qTextSec}`}>{questions.length} questions · Validé si ≥ {threshold}/{questions.length}</p>
        </div>
      </div>
      <div className="p-5">
        {!started ? (
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setStarted(true)}
            className="flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-extrabold text-black"
            style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed)" }}>
            <Play size={13} fill="black" /> Lancer le quiz
          </motion.button>
        ) : done ? (
          <div className="space-y-3 text-center py-2">
            <p className="text-3xl font-extrabold" style={{ color: score >= threshold ? "#34d399" : "#f59e0b" }}>{score}/{questions.length}</p>
            <p className={`text-xs ${qTextMut}`}>{score >= threshold ? "Module validé ! Progression sauvegardée." : "Relisez le cours et réessayez."}</p>
            {score >= threshold && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.1)] px-3 py-1 text-xs font-bold text-[#34d399]">
                <CheckCircle2 size={11} /> Quiz validé
              </motion.div>
            )}
            <button onClick={reset} className={`inline-flex items-center gap-2 rounded-xl border px-5 py-2 text-xs font-bold transition-colors ${resetBtn}`}>
              <RotateCcw size={11} /> Rejouer
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-xs ${qTextMut}`}>Question {qIdx + 1}/{questions.length}</span>
              <div className="flex gap-1">{questions.map((_, i) => <div key={i} className={`h-1.5 w-8 rounded-full transition-all ${i < qIdx ? "bg-[#a78bfa]" : i === qIdx ? "bg-[#a78bfa] opacity-50" : qPipeDim}`} />)}</div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={qIdx} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
                <p className={`text-sm font-bold mb-3 ${qTextPri}`}>{questions[qIdx]!.q}</p>
                <div className="space-y-2">
                  {questions[qIdx]!.opts.map((opt, i) => {
                    const isCorrect = i === questions[qIdx]!.correct;
                    const isSel = selected === i;
                    const rev = selected !== null;
                    return (
                      <motion.button key={i} whileHover={!rev ? { x: 3 } : {}}
                        onClick={() => handleAnswer(i)} disabled={rev}
                        className={`w-full rounded-xl border px-4 py-2.5 text-left text-xs font-semibold transition-all ${
                          !rev ? qOptIdle :
                          isCorrect ? "border-[rgba(52,211,153,0.4)] bg-[rgba(52,211,153,0.1)] text-[#34d399]" :
                          isSel ? "border-[rgba(248,113,113,0.4)] bg-[rgba(248,113,113,0.1)] text-[#f87171]" :
                          qOptDim
                        }`}>
                        <span className="mr-2 font-black">{String.fromCharCode(65 + i)}.</span>{opt}
                        {rev && isCorrect && <CheckCircle2 size={12} className="inline ml-2 text-[#34d399]" />}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
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
  const { isDark } = useTheme();
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
          className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[0.72rem] font-semibold transition-all hover:scale-[1.02] ${
            isDark
              ? "border-white/[0.1] bg-white/[0.04] text-white/40 hover:border-white/[0.2] hover:text-white/65"
              : "border-black/10 bg-black/[0.03] text-[#0e1420]/40 hover:border-black/20 hover:text-[#0e1420]/65"
          }`}
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
              <div className={`flex items-center justify-between border-b px-4 py-3 ${isDark ? "border-white/[0.07]" : "border-black/6"}`}>
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
                    className={`rounded-lg p-1 transition ${isDark ? "text-white/30 hover:bg-white/[0.06] hover:text-white/60" : "text-[#0e1420]/30 hover:bg-black/[0.05] hover:text-[#0e1420]/60"}`}
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
              <div className={`px-4 py-4 text-sm leading-[1.75] ${isDark ? "text-white/70" : "text-[#0e1420]/70"}`} style={{ whiteSpace: "pre-wrap" }}>
                {loading
                  ? (
                    <div className={`flex items-center gap-3 ${isDark ? "text-white/40" : "text-[#0e1420]/40"}`}>
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
                  className={`flex-1 resize-none rounded-xl border px-3 py-2 text-sm outline-none focus:border-[rgba(96,165,250,0.35)] transition-colors ${
                    isDark
                      ? "border-white/[0.08] bg-white/[0.04] text-white placeholder-white/25"
                      : "border-black/10 bg-black/[0.03] text-[#0e1420] placeholder-[#0e1420]/30"
                  }`}
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
              <p className={`mt-2 text-[0.6rem] ${isDark ? "text-white/25" : "text-[#0e1420]/30"}`}>
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
  const { isDark } = useTheme();
  const pct          = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isModuleDone = completed === total && total > 0;
  const sHov  = isDark ? "hover:bg-white/[0.05]"  : "hover:bg-black/[0.04]";
  const sName = isDark ? "text-white/80"           : "text-[#0e1420]/80";
  const sPct  = isDark ? "text-white/25"           : "text-[#0e1420]/30";
  const sBar  = isDark ? "bg-white/[0.08]"         : "bg-black/[0.07]";
  const sArrow= isDark ? "text-white/30"           : "text-[#0e1420]/30";
  const sBord = isDark ? "border-white/[0.07]"     : "border-black/[0.08]";
  const sCirc = isDark ? "text-white/20"           : "text-[#0e1420]/20";
  const sTypDim = isDark ? "text-white/20"         : "text-[#0e1420]/20";

  return (
    <div>
      <button
        onClick={onToggle}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${sHov}`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className={`truncate text-xs font-semibold ${sName}`}>
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
            <div className={`h-1 flex-1 overflow-hidden rounded-full ${sBar}`}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: `rgb(${module.rgb})` }} />
            </div>
            <span className={`text-[0.55rem] ${sPct}`}>{pct}%</span>
          </div>
        </div>
        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight size={12} className={sArrow} />
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
            <div className={`ml-3 mt-1 space-y-0.5 border-l pl-3 ${sBord}`}>
              {module.chapters.map((ch) => {
                const isDone   = completed > module.chapters.indexOf(ch);
                const selected = selectedChapterId === ch.id;
                const isFav    = favorites.has(ch.id);
                return (
                  <button key={ch.id} onClick={() => onSelectChapter(ch.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-all ${
                      selected
                        ? isDark ? "bg-white/[0.08] text-white" : "bg-black/[0.06] text-[#0e1420]"
                        : isDark ? "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
                                 : "text-[#0e1420]/40 hover:bg-black/[0.03] hover:text-[#0e1420]/70"
                    }`}
                  >
                    {isDone
                      ? <CheckCircle2 size={11} style={{ color: `rgb(${module.rgb})`, flexShrink: 0 }} />
                      : <Circle size={11} className={`shrink-0 ${sCirc}`} />
                    }
                    <span className="flex-1 truncate text-[0.68rem]">{ch.title}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {isFav && <Star size={9} className="fill-[#f9a826] text-[#f9a826]" />}
                      <span className={`text-[0.55rem] ${
                        ch.type === "exercise" ? "text-[#f9a826]"
                        : ch.type === "quiz"   ? "text-[#60a5fa]"
                        : sTypDim
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
  const { isDark } = useTheme();
  const cPri   = isDark ? "text-white"     : "text-[#0e1420]";
  const cSec   = isDark ? "text-white/65"  : "text-[#0e1420]/65";
  const cMut   = isDark ? "text-white/55"  : "text-[#0e1420]/55";
  const cFaint = isDark ? "text-white/25"  : "text-[#0e1420]/35";
  const cCard  = isDark ? "border-white/[0.07] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.05]"
                        : "border-black/[0.08] bg-white shadow-sm hover:border-black/12 hover:shadow-md";
  const cIntro = isDark ? "border-white/[0.08] from-white/[0.04] to-white/[0.02]"
                        : "border-black/[0.08] from-white to-[#f7f7fb]";
  const cDivider = isDark ? "border-white/[0.07]" : "border-black/6";
  const cDurBadge = isDark ? "bg-white/[0.06] text-white/35" : "bg-black/[0.05] text-[#0e1420]/45";
  const cHintRow  = isDark ? "bg-white/[0.04]" : "bg-black/[0.03]";
  const cTplBord  = isDark ? "border-white/[0.06]" : "border-black/6";
  const cTplPre   = isDark ? "text-white/55" : "text-[#0e1420]/60";
  const cFavIdle  = isDark
    ? "border-white/[0.08] text-white/25 hover:border-[rgba(249,168,38,0.3)] hover:text-[#f9a826]"
    : "border-black/10 text-[#0e1420]/25 hover:border-[rgba(249,168,38,0.4)] hover:text-[#f9a826]";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8">

      {/* ── En-tête chapitre ── */}
      <div className="mb-7">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full px-3 py-1 text-[0.62rem] font-bold uppercase tracking-widest"
            style={{ background: `rgba(${module.rgb},0.12)`, color: `rgb(${module.rgb})`, border: `1px solid rgba(${module.rgb},0.22)` }}>
            M{module.id} · {module.title}
          </span>
          <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.6rem] ${cDurBadge}`}>
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
          <h1 className={`text-[1.5rem] font-extrabold leading-snug ${cPri}`}>{chapter.title}</h1>
          <button
            onClick={onToggleFavorite}
            title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            className={`mt-0.5 shrink-0 rounded-xl border p-2 transition-all hover:scale-110 ${
              isFavorite
                ? "border-[rgba(249,168,38,0.4)] bg-[rgba(249,168,38,0.12)] text-[#f9a826]"
                : cFavIdle
            }`}
          >
            <Star size={14} className={isFavorite ? "fill-[#f9a826]" : ""} />
          </button>
        </div>
      </div>

      {/* ── Vidéo ── */}
      <VideoPlayer title={chapter.title} color={`rgb(${module.rgb})`} isDark={isDark} />

      {/* ── AI Tools Bar ── */}
      <AiToolsBar chapter={chapter} module={module} onOpenAssistant={onAskAssistant} />

      {/* ── Introduction ── */}
      <div className={`mb-8 rounded-2xl border bg-gradient-to-br px-6 py-5 ${cIntro}`}>
        <p className={`text-[0.65rem] font-bold uppercase tracking-widest mb-3 ${cFaint}`}>
          Introduction
        </p>
        <p className={`text-[0.95rem] leading-[1.85] italic ${cSec}`}>{chapter.intro}</p>
      </div>

      {/* ── Points clés ── */}
      {chapter.keyPoints && chapter.keyPoints.length > 0 && (
        <div className="mb-8">
          <p className={`mb-4 text-[0.65rem] font-bold uppercase tracking-widest ${cFaint}`}>
            Points clés
          </p>
          <div className="space-y-3">
            {chapter.keyPoints.map(({ title, text }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease, delay: i * 0.07 }}
                className={`group rounded-2xl border p-5 transition-all duration-200 ${cCard}`}
              >
                <div className="mb-2.5 flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black"
                    style={{ background: `rgba(${module.rgb},0.15)`, color: `rgb(${module.rgb})` }}>
                    {i + 1}
                  </div>
                  <h3 className={`text-sm font-bold ${cPri}`}>{title}</h3>
                </div>
                <p className={`ml-10 text-sm leading-[1.75] ${cMut}`}>{text}</p>
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
          <p className={`mb-5 text-sm leading-[1.75] ${cSec}`}>{chapter.exercise.prompt}</p>
          <div className="space-y-2">
            {chapter.exercise.hints.map((hint, i) => (
              <div key={i} className={`flex items-start gap-3 rounded-xl p-3 ${cHintRow}`}>
                <span className="mt-0.5 text-[0.62rem] font-black text-[#f9a826]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className={`text-sm ${isDark ? "text-white/60" : "text-[#0e1420]/60"}`}>{hint}</p>
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
          <p className={`mb-4 text-[0.65rem] font-bold uppercase tracking-widest ${cFaint}`}>
            Templates prêts à copier
          </p>
          <div className="space-y-3">
            {chapter.templates.map((template, i) => (
              <div key={i} className="rounded-2xl border border-[rgba(96,165,250,0.18)] bg-[rgba(96,165,250,0.05)] overflow-hidden">
                <div className={`flex items-center justify-between border-b px-4 py-2.5 ${cTplBord}`}>
                  <span className="text-[0.62rem] font-bold uppercase tracking-widest text-[#60a5fa]">
                    Template {i + 1}
                  </span>
                  <CopyButton text={template} />
                </div>
                <pre className={`px-4 py-3 text-xs leading-[1.8] whitespace-pre-wrap break-words font-mono ${cTplPre}`}>
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
                <p className={`text-sm leading-[1.7] ${isDark ? "text-white/60" : "text-[#0e1420]/60"}`}>{tip}</p>
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
                <p className={`text-sm leading-[1.7] ${cSec}`}>{action}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Quiz interactif (chapitres type="quiz") ── */}
      {chapter.type === "quiz" && (
        <InlineModuleQuiz moduleId={module.id} onComplete={onComplete} />
      )}

      {/* ── Actions nav ── */}
      <div className={`flex flex-col gap-3 border-t pt-6 sm:flex-row ${cDivider}`}>
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
  type CoachMode = "direct" | "socratic" | "exercise";
  const { isDark } = useTheme();
  const [mode,    setMode]    = useState<CoachMode>("direct");
  const [messages, setMessages] = useState<Msg[]>([{
    role:    "assistant",
    content: "Bonjour ! Je suis votre Coach IA Pédagogique DJAMA. Choisissez un mode ci-dessus, puis posez vos questions sur les 10 modules ou demandez un exercice pratique.",
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
      const userContext = formatUserCtxForPrompt(loadUserCtx());
      const res = await fetch("/api/coaching-ia/assistant", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: newMessages, context: currentContext, mode, userContext }),
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

  const SUGGESTIONS = mode === "socratic"
    ? [
        "Par où commencer pour comprendre les LLMs ?",
        "Qu'est-ce que le prompting selon toi ?",
        "Pourquoi mes prompts ne donnent pas les résultats voulus ?",
        "Comment choisir entre ChatGPT et Claude ?",
      ]
    : mode === "exercise"
    ? [
        "Lance-moi un exercice sur le prompt engineering",
        "Teste mes connaissances sur les agents IA",
        "Exercice : rédige un prompt pour mon secteur",
        "Donne-moi un défi d'automatisation",
      ]
    : [
        "Explique-moi les tokens de façon simple",
        "Donne-moi un exemple de prompt chain-of-thought",
        "Quels outils IA pour un entrepreneur ?",
        "Comment mesurer le ROI de l'IA ?",
      ];

  const aDivider  = isDark ? "border-white/[0.07]"  : "border-black/6";
  const aTitleSec = isDark ? "text-white/30"         : "text-[#0e1420]/35";
  const aSugBtn   = isDark
    ? "border-white/[0.08] bg-white/[0.03] text-white/50 hover:border-white/[0.14] hover:text-white/80"
    : "border-black/[0.08] bg-black/[0.02] text-[#0e1420]/50 hover:border-black/14 hover:text-[#0e1420]/80";
  const aMsgUser  = isDark ? "bg-[rgba(201,165,90,0.12)] text-white/80"
                           : "bg-[rgba(201,165,90,0.12)] text-[#0e1420]/80";
  const aMsgBot   = isDark
    ? "border border-white/[0.07] bg-white/[0.04] text-white/70"
    : "border border-black/[0.08] bg-white shadow-sm text-[#0e1420]/70";
  const aLoadBub  = isDark
    ? "border border-white/[0.07] bg-white/[0.04]"
    : "border border-black/[0.08] bg-white shadow-sm";
  const aInputWrap= isDark
    ? "border-white/[0.09] bg-white/[0.04] focus-within:border-[rgba(201,165,90,0.4)]"
    : "border-black/10 bg-white shadow-sm focus-within:border-[rgba(201,165,90,0.35)]";
  const aInputTxt = isDark ? "text-white placeholder-white/25" : "text-[#0e1420] placeholder-[#0e1420]/30";
  const aHintTxt  = isDark ? "text-white/15" : "text-[#0e1420]/20";
  const aTitlePri = isDark ? "text-white" : "text-[#0e1420]";

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col">
      <div className={`border-b ${aDivider}`}>
        {/* Titre */}
        <div className="flex items-center gap-3 px-6 pt-4 pb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(167,139,250,0.15)]">
            <Bot size={17} className="text-[#a78bfa]" />
          </div>
          <div>
            <h2 className={`text-sm font-bold ${aTitlePri}`}>Coach IA Pédagogique DJAMA</h2>
            <p className={`text-[0.65rem] ${aTitleSec}`}>10 modules · 3 modes d&apos;apprentissage</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-[#34d399] shadow-[0_0_5px_rgba(52,211,153,0.5)]" />
            <span className={`text-[0.6rem] ${isDark ? "text-white/25" : "text-[#0e1420]/30"}`}>En ligne</span>
          </div>
        </div>
        {/* Sélecteur de mode */}
        <div className="flex items-center gap-1 px-4 pb-3">
          {([
            { key: "direct",   label: "Expliquer",   icon: BookOpen,   desc: "Réponses directes" },
            { key: "socratic", label: "Questionner",  icon: HelpCircle, desc: "Mode socratique" },
            { key: "exercise", label: "S'entraîner",  icon: Zap,        desc: "Exercices pratiques" },
          ] as { key: "direct"|"socratic"|"exercise"; label: string; icon: React.ElementType; desc: string }[]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              title={label}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                mode === key
                  ? "border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.1)] text-[#c9a55a]"
                  : isDark
                    ? "text-white/35 hover:bg-white/[0.05] hover:text-white/70"
                    : "text-[#0e1420]/35 hover:bg-black/[0.04] hover:text-[#0e1420]/70"
              }`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
        {messages.length === 1 && (
          <div className="space-y-3">
            {/* Actions rapides contextuelles (si chapitre en cours) */}
            {currentContext && (
              <div>
                <p className={`mb-2 text-[0.6rem] font-semibold uppercase tracking-wider ${aTitleSec}`}>
                  Actions rapides — chapitre en cours
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Résume ce chapitre",
                    "Donne-moi un exemple concret",
                    "Crée un quiz rapide",
                    "Propose-moi un exercice",
                  ].map((s) => (
                    <button key={s} onClick={() => sendMessage(s)}
                      className={`rounded-lg border px-3 py-1.5 text-xs transition ${aSugBtn}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Suggestions selon le mode */}
            <div>
              <p className={`mb-2 text-[0.6rem] font-semibold uppercase tracking-wider ${aTitleSec}`}>
                {mode === "socratic" ? "Sujets à explorer" : mode === "exercise" ? "Exercices disponibles" : "Questions fréquentes"}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => sendMessage(s)}
                    className={`rounded-xl border px-3 py-2.5 text-left text-xs transition ${aSugBtn}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
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
              msg.role === "user" ? aMsgUser : aMsgBot
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
            <div className={`flex items-center gap-1.5 rounded-2xl px-4 py-3 ${aLoadBub}`}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#a78bfa]"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className={`border-t px-4 py-3 ${aDivider}`}>
        <div className={`flex items-end gap-2 rounded-2xl border px-4 py-3 transition-colors ${aInputWrap}`}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Posez votre question…"
            rows={1}
            className={`flex-1 resize-none bg-transparent text-sm outline-none ${aInputTxt}`}
            style={{ maxHeight: "120px" }}
          />
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#a78bfa] text-white transition disabled:opacity-40">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
        <p className={`mt-1.5 text-center text-[0.6rem] ${aHintTxt}`}>
          Entrée pour envoyer · Shift+Entrée pour nouvelle ligne
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPOSANT — Panneau Favoris
───────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────
   COMPOSANT — Révisions (SM-2 + Favoris)
───────────────────────────────────────────────────────── */
const CHAPTER_KEY_POINTS: Record<string, string[]> = {
  lesson:   ["Définition des concepts principaux", "Exemples concrets", "Cas d'usage métier"],
  exercise: ["Méthode ou technique appliquée", "Erreurs fréquentes à éviter", "Comment l'appliquer dans mon contexte"],
  quiz:     ["Réponses aux questions du quiz", "Points de confusion identifiés", "À mettre en pratique"],
};

function RevisionsPanel({
  favorites, onSelectChapter,
}: {
  favorites:       Set<string>;
  onSelectChapter: (moduleId: string, chapterId: string) => void;
}) {
  const { isDark } = useTheme();
  type RevTab = "sr" | "favorites";

  const [tab,         setTab]         = useState<RevTab>("sr");
  const [srItems,     setSrItems]     = useState<SRItem[]>(() => getDueItems());
  const [idx,         setIdx]         = useState(0);
  const [revealed,    setRevealed]    = useState(false);
  const [sessionDone, setSessionDone] = useState(0);
  const [sessionFail, setSessionFail] = useState(0);

  const upcoming = getUpcomingItems(7);
  const totalSR  = Object.keys(loadSRItems()).length;

  function handleVerdict(quality: 0 | 3 | 5) {
    const item = srItems[idx];
    if (!item) return;
    updateSRItem(item.id, quality);
    if (quality === 0) setSessionFail((n) => n + 1);
    else setSessionDone((n) => n + 1);
    setRevealed(false);
    setIdx((i) => i + 1);
  }

  function restartSession() {
    setSrItems(getDueItems());
    setIdx(0);
    setRevealed(false);
    setSessionDone(0);
    setSessionFail(0);
  }

  const rv = {
    card:    isDark ? "border-white/[0.07] bg-white/[0.03]" : "border-black/[0.07] bg-white shadow-sm",
    pri:     isDark ? "text-white"    : "text-[#0e1420]",
    sec:     isDark ? "text-white/50" : "text-[#0e1420]/55",
    mut:     isDark ? "text-white/30" : "text-[#0e1420]/35",
    bar:     isDark ? "bg-white/[0.07]" : "bg-black/[0.07]",
    lbl:     `text-[0.62rem] font-bold uppercase tracking-widest ${isDark ? "text-white/25" : "text-[#0e1420]/30"}`,
    tabAct:  "border-[rgba(201,165,90,0.3)] bg-[rgba(201,165,90,0.08)] text-[#c9a55a]",
    tabIdle: isDark ? "border-white/[0.07] text-white/40 hover:text-white/70" : "border-black/[0.07] text-[#0e1420]/40 hover:text-[#0e1420]/70",
    fCard:   isDark
      ? "border-white/[0.07] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.05]"
      : "border-black/[0.08] bg-white shadow-sm hover:border-black/12 hover:shadow-md",
  };

  const currentItem = srItems[idx];
  const isDone      = idx >= srItems.length;

  // Résoudre chapter + module pour l'item courant
  const resolveChapter = (id: string) => {
    for (const m of COACHING_MODULES) {
      const ch = m.chapters.find((c) => c.id === id);
      if (ch) return { module: m, chapter: ch };
    }
    return null;
  };

  const currentResolved = currentItem ? resolveChapter(currentItem.id) : null;
  const keyPoints       = CHAPTER_KEY_POINTS[currentResolved?.chapter.type ?? "lesson"] ?? CHAPTER_KEY_POINTS.lesson!;

  const favChapters = COACHING_MODULES.flatMap((m) =>
    m.chapters.filter((c) => favorites.has(c.id)).map((c) => ({ module: m, chapter: c }))
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        {([
          { key: "sr"        as RevTab, label: `À réviser${srItems.length > 0 ? ` (${srItems.length - idx > 0 ? srItems.length - idx : 0})` : ""}` },
          { key: "favorites" as RevTab, label: `Favoris (${favChapters.length})` },
        ]).map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`rounded-xl border px-4 py-2 text-xs font-bold transition-all ${tab === key ? rv.tabAct : rv.tabIdle}`}>
            {label}
          </button>
        ))}
        {totalSR > 0 && (
          <span className={`ml-auto text-[0.6rem] ${rv.mut}`}>{totalSR} ch. suivies</span>
        )}
      </div>

      {/* ── Tab SR ── */}
      {tab === "sr" && (
        <div className="space-y-5">

          {/* Queue vide */}
          {srItems.length === 0 && (
            <div className={`rounded-2xl border p-8 text-center ${rv.card}`}>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.08)]">
                <CheckCircle2 size={24} className="text-[#34d399]" />
              </div>
              <p className={`text-sm font-bold ${rv.pri}`}>Aucune révision aujourd&apos;hui</p>
              <p className={`mt-1 text-xs ${rv.sec}`}>
                {totalSR === 0
                  ? "Terminez des chapitres pour activer la répétition espacée."
                  : `${totalSR} chapitres suivis — la prochaine révision est planifiée.`}
              </p>
              {upcoming.length > 0 && (
                <div className={`mt-5 space-y-1.5 text-left rounded-xl border p-4 ${rv.card}`}>
                  <p className={`mb-2 text-[0.6rem] font-bold uppercase tracking-wider ${rv.mut}`}>Prochaines révisions</p>
                  {upcoming.map(({ day, count }) => (
                    <div key={day} className="flex items-center justify-between">
                      <span className={`text-xs ${rv.sec}`}>Dans {day === 1 ? "1 jour" : `${day} jours`}</span>
                      <span className="rounded-full px-2 py-0.5 text-[0.55rem] font-bold"
                        style={{ background: "rgba(201,165,90,0.15)", color: GOLD }}>{count} ch.</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Session terminée */}
          {srItems.length > 0 && isDone && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border p-8 text-center ${rv.card}`}>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.1)]">
                <Award size={24} style={{ color: GOLD }} />
              </div>
              <p className={`text-sm font-bold ${rv.pri}`}>Session terminée !</p>
              <div className="mt-3 flex justify-center gap-6 text-xs">
                <div>
                  <p className="font-black text-[#34d399] text-base">{sessionDone}</p>
                  <p className={rv.mut}>Maîtrisés</p>
                </div>
                <div>
                  <p className="font-black text-red-400 text-base">{sessionFail}</p>
                  <p className={rv.mut}>À retravailler</p>
                </div>
              </div>
              <button onClick={restartSession}
                className={`mt-5 flex items-center justify-center gap-1.5 w-full rounded-xl border py-2.5 text-sm font-semibold transition ${rv.tabIdle}`}>
                <RotateCcw size={13} /> Relancer les révisions
              </button>
              {upcoming.length > 0 && (
                <div className={`mt-4 space-y-1.5 text-left rounded-xl border p-4 ${rv.card}`}>
                  <p className={`mb-2 text-[0.6rem] font-bold uppercase tracking-wider ${rv.mut}`}>Prochaines révisions planifiées</p>
                  {upcoming.map(({ day, count }) => (
                    <div key={day} className="flex items-center justify-between">
                      <span className={`text-xs ${rv.sec}`}>Dans {day === 1 ? "1 jour" : `${day} jours`}</span>
                      <span className="rounded-full px-2 py-0.5 text-[0.55rem] font-bold"
                        style={{ background: "rgba(201,165,90,0.15)", color: GOLD }}>{count} ch.</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Carte de révision active */}
          {srItems.length > 0 && !isDone && currentResolved && (
            <div className="space-y-4">
              {/* Progression */}
              <div className="flex items-center justify-between">
                <span className={`text-xs ${rv.mut}`}>{idx + 1} / {srItems.length}</span>
                <div className="flex gap-3 text-xs">
                  <span className="text-[#34d399] font-semibold">{sessionDone} ✓</span>
                  <span className="text-red-400 font-semibold">{sessionFail} ✗</span>
                </div>
              </div>
              <div className={`h-1.5 overflow-hidden rounded-full ${rv.bar}`}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${(idx / srItems.length) * 100}%`, background: GOLD }} />
              </div>

              {/* Carte */}
              <motion.div key={idx}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`rounded-2xl border p-6 ${rv.card}`}>
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded-full px-2 py-0.5 text-[0.55rem] font-black uppercase tracking-wider"
                    style={{ background: currentResolved.module.color + "20", color: currentResolved.module.color }}>
                    M{currentResolved.module.id} · {currentResolved.module.title}
                  </span>
                  <span className={`text-[0.55rem] ${rv.mut}`}>
                    Rép. {currentItem.repetitions} · Prochain dans {currentItem.interval}j
                  </span>
                </div>
                <h3 className={`mt-3 text-base font-bold ${rv.pri}`}>{currentResolved.chapter.title}</h3>
                <p className={`mt-1 text-xs ${rv.sec}`}>
                  {currentResolved.chapter.type === "quiz" ? "Quiz" : currentResolved.chapter.type === "exercise" ? "Exercice" : "Cours"} · {currentResolved.chapter.duration}
                </p>

                {!revealed ? (
                  <button onClick={() => setRevealed(true)}
                    className="mt-5 w-full rounded-xl border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.07)] py-2.5 text-sm font-semibold text-[#c9a55a] transition hover:border-[rgba(201,165,90,0.4)]">
                    Rappeler les points clés
                  </button>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-3">
                    <div className={`rounded-xl border p-4 space-y-2 ${isDark ? "border-white/[0.06] bg-white/[0.03]" : "border-black/[0.06] bg-black/[0.02]"}`}>
                      <p className={`text-[0.58rem] font-bold uppercase tracking-wider mb-2 ${rv.mut}`}>Vérifiez que vous savez :</p>
                      {keyPoints.map((pt, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span style={{ color: currentResolved.module.color }} className="text-[0.65rem] font-black mt-0.5">{i + 1}.</span>
                          <p className={`text-xs ${rv.sec}`}>{pt}</p>
                        </div>
                      ))}
                    </div>
                    <p className={`text-center text-[0.6rem] ${rv.mut}`}>Comment avez-vous retenu ce chapitre ?</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => handleVerdict(0)}
                        className="flex flex-col items-center gap-1 rounded-xl border border-red-500/20 bg-red-500/10 py-3 text-xs font-semibold text-red-400 transition hover:border-red-500/35">
                        <X size={14} /> Oublié
                      </button>
                      <button onClick={() => handleVerdict(3)}
                        className={`flex flex-col items-center gap-1 rounded-xl border py-3 text-xs font-semibold transition ${rv.tabIdle}`}>
                        <HelpCircle size={14} /> Difficile
                      </button>
                      <button onClick={() => handleVerdict(5)}
                        className="flex flex-col items-center gap-1 rounded-xl border border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.1)] py-3 text-xs font-semibold text-[#34d399] transition hover:border-[rgba(52,211,153,0.4)]">
                        <CheckCircle2 size={14} /> Maîtrisé
                      </button>
                    </div>
                    <button onClick={() => onSelectChapter(currentResolved.module.id, currentResolved.chapter.id)}
                      className={`flex w-full items-center justify-center gap-1.5 text-xs py-2 ${rv.mut} hover:text-[${GOLD}] transition`}>
                      <BookOpen size={11} /> Revoir le cours
                    </button>
                  </motion.div>
                )}
              </motion.div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab Favoris ── */}
      {tab === "favorites" && (
        <div>
          {favChapters.length === 0 ? (
            <div className={`rounded-2xl border p-8 text-center ${rv.card}`}>
              <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border ${rv.card}`}>
                <Star size={22} className={rv.mut} />
              </div>
              <p className={`text-sm font-semibold ${rv.sec}`}>Aucun favori</p>
              <p className={`mt-1 text-xs ${rv.mut}`}>Cliquez sur l&apos;étoile dans un cours pour le sauvegarder ici.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {favChapters.map(({ module, chapter }) => (
                <motion.button key={chapter.id}
                  onClick={() => onSelectChapter(module.id, chapter.id)}
                  whileHover={{ x: 4 }} transition={{ duration: 0.18 }}
                  className={`group flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition-all ${rv.fCard}`}>
                  <div className="flex-1 min-w-0">
                    <p className="mb-0.5 text-[0.62rem] font-bold uppercase tracking-widest" style={{ color: module.color }}>
                      M{module.id} · {module.title}
                    </p>
                    <p className={`truncate font-semibold ${rv.pri}`}>{chapter.title}</p>
                    <div className={`mt-1 flex items-center gap-2 text-[0.6rem] ${rv.mut}`}>
                      <Clock size={9} /> {chapter.duration}
                      <span>·</span>
                      <span>{chapter.type === "exercise" ? "Exercice" : chapter.type === "quiz" ? "Quiz" : "Cours"}</span>
                    </div>
                  </div>
                  <ArrowRight size={14} className={`mt-1 shrink-0 transition-transform group-hover:translate-x-0.5 ${rv.mut}`} />
                </motion.button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FavoritesPanel({
  favorites, onSelectChapter,
}: {
  favorites:       Set<string>;
  onSelectChapter: (moduleId: string, chapterId: string) => void;
}) {
  const { isDark } = useTheme();
  const favChapters = COACHING_MODULES.flatMap((m) =>
    m.chapters
      .filter((c) => favorites.has(c.id))
      .map((c) => ({ module: m, chapter: c }))
  );

  const fPri  = isDark ? "text-white"    : "text-[#0e1420]";
  const fSec  = isDark ? "text-white/35" : "text-[#0e1420]/40";
  const fMut  = isDark ? "text-white/30" : "text-[#0e1420]/35";
  const fCard = isDark
    ? "border-white/[0.07] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.05]"
    : "border-black/[0.08] bg-white shadow-sm hover:border-black/12 hover:shadow-md";
  const fIcon = isDark ? "text-white/20" : "text-[#0e1420]/20";
  const fEmpty= isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-black/[0.08] bg-white shadow-sm";
  const fArrow= isDark ? "text-white/20 group-hover:text-white/50" : "text-[#0e1420]/20 group-hover:text-[#0e1420]/50";

  if (favChapters.length === 0) {
    return (
      <div className="flex h-[calc(100vh-56px)] flex-col items-center justify-center gap-4 text-center px-6">
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${fEmpty}`}>
          <Star size={28} className={fIcon} />
        </div>
        <div>
          <p className={`text-sm font-semibold ${isDark ? "text-white/50" : "text-[#0e1420]/50"}`}>Aucun favori</p>
          <p className={`mt-1 text-xs ${fMut}`}>
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
        <h2 className={`text-xl font-bold ${fPri}`}>Vos cours mis en favoris</h2>
        <p className={`mt-1.5 text-sm ${fSec}`}>Reprenez rapidement là où vous étiez.</p>
      </div>

      <div className="space-y-3">
        {favChapters.map(({ module, chapter }) => (
          <motion.button
            key={chapter.id}
            onClick={() => onSelectChapter(module.id, chapter.id)}
            whileHover={{ x: 4 }}
            transition={{ duration: 0.18 }}
            className={`group flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition-all ${fCard}`}
          >
            <div className="flex-1 min-w-0">
              <p className="mb-0.5 text-[0.62rem] font-bold uppercase tracking-widest"
                style={{ color: module.color }}>
                M{module.id} · {module.title}
              </p>
              <p className={`truncate font-semibold ${fPri}`}>{chapter.title}</p>
              <div className={`mt-1 flex items-center gap-2 text-[0.6rem] ${fMut}`}>
                <Clock size={9} /> {chapter.duration}
                <span>·</span>
                <span>{chapter.type === "exercise" ? "Exercice" : chapter.type === "quiz" ? "Quiz" : "Cours"}</span>
              </div>
            </div>
            <ArrowRight size={14} className={`mt-1 shrink-0 transition-transform group-hover:translate-x-0.5 ${fArrow}`} />
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
  const { isDark } = useTheme();
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

  const bPri    = isDark ? "text-white"    : "text-[#0e1420]";
  const bSec    = isDark ? "text-white/45" : "text-[#0e1420]/50";
  const bBold   = isDark ? "text-white/70" : "text-[#0e1420]/75";
  const bMut    = isDark ? "text-white/40" : "text-[#0e1420]/45";
  const bLabel  = isDark ? "text-white/30" : "text-[#0e1420]/40";
  const bHint   = isDark ? "text-white/25" : "text-[#0e1420]/30";
  const bCard   = isDark ? "border-white/[0.06] bg-white/[0.02]"  : "border-black/6 bg-[#f7f7fb]";
  const bInner  = isDark ? "border-white/[0.06] bg-white/[0.02]"  : "border-black/6 bg-white";
  const bSummary= isDark ? "bg-white/[0.03]" : "bg-black/[0.03]";
  const bStatCard=isDark ? "border-white/[0.07] bg-white/[0.03]"  : "border-black/[0.08] bg-white shadow-sm";
  const bStatTxt =isDark ? "text-white/50"   : "text-[#0e1420]/55";
  const bInput   = isDark
    ? "border-white/[0.08] bg-white/[0.03] text-white placeholder-white/20"
    : "border-black/10 bg-white text-[#0e1420] placeholder-[#0e1420]/30";
  const bIconMut = isDark ? "text-white/25"  : "text-[#0e1420]/30";
  const bChevron = isDark ? "text-white/20"  : "text-[#0e1420]/25";
  const bSentTxt = isDark ? "text-white/50"  : "text-[#0e1420]/55";

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[rgba(167,139,250,0.2)] bg-[rgba(167,139,250,0.08)] px-3 py-1 text-xs font-bold text-[#a78bfa]">
          <Calendar size={11} /> Programme Expert IA — 6 mois
        </div>
        <h2 className={`mt-2 text-xl font-bold ${bPri}`}>Coaching individuel avec un expert humain</h2>
        <p className={`mt-2 text-sm ${bSec}`}>
          1 séance par semaine pendant 6 mois = <span className={`font-semibold ${bBold}`}>24 séances · 24h d&apos;accompagnement</span> avec un expert IA certifié DJAMA.
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
            <div key={mois} className={`flex items-start gap-3 rounded-xl border p-3 ${bCard}`}>
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              <div>
                <p className={`text-xs font-bold ${bPri}`}>{mois} — {label}</p>
                <p className={`text-[0.65rem] ${bMut}`}>{detail}</p>
              </div>
            </div>
          ))}
        </div>
        <div className={`mt-3 flex items-center justify-between rounded-xl px-3 py-2 ${bSummary}`}>
          <span className={`text-[0.65rem] ${bMut}`}>Total accompagnement</span>
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
          <div key={label} className={`rounded-xl border p-3 text-center ${bStatCard}`}>
            <Icon size={18} className="mx-auto mb-1.5" style={{ color }} />
            <p className={`text-[0.65rem] font-medium ${bStatTxt}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Formulaire */}
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div key="sent" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-[rgba(52,211,153,0.2)] bg-[rgba(52,211,153,0.06)] p-8 text-center">
            <CheckCircle2 size={40} className="mx-auto mb-4 text-[#34d399]" />
            <h3 className={`mb-2 text-lg font-bold ${bPri}`}>Demande envoyée !</h3>
            <p className={`text-sm ${bSentTxt}`}>Un expert DJAMA vous contacte sous 24h pour planifier votre première séance et démarrer votre parcours de 6 mois.</p>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: "Votre nom", icon: User, type: "text", value: name, setter: setName, placeholder: "Prénom Nom" },
              { label: "Email", icon: Mail, type: "email", value: email, setter: setEmail, placeholder: "votre@email.fr" },
            ].map(({ label, icon: Icon, type, value, setter, placeholder }) => (
              <div key={label}>
                <label className={`mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-widest ${bLabel}`}>{label}</label>
                <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${bInner}`}>
                  <Icon size={14} className={bIconMut} />
                  <input type={type} placeholder={placeholder} value={value}
                    onChange={(e) => setter(e.target.value)} required
                    className={`flex-1 bg-transparent text-sm outline-none ${bInput}`} />
                </div>
              </div>
            ))}
            <div>
              <label className={`mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-widest ${bLabel}`}>Créneau préféré (séances hebdomadaires)</label>
              <div className={`relative flex items-center gap-3 rounded-2xl border px-4 py-3 ${bInner}`}>
                <Clock size={14} className={`shrink-0 ${bIconMut}`} />
                <select value={availability} onChange={(e) => setAvailability(e.target.value)} required
                  style={{ color: availability ? (isDark ? "white" : "#0e1420") : (isDark ? "rgba(255,255,255,0.2)" : "rgba(14,20,32,0.3)") }}
                  className={`flex-1 appearance-none bg-transparent text-sm outline-none ${isDark ? "[color-scheme:dark] [&>option]:bg-[#111113] [&>option]:text-white" : "[&>option]:bg-white [&>option]:text-[#0e1420]"}`}>
                  <option value="" disabled>Quand êtes-vous disponible chaque semaine ?</option>
                  {SLOTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <ChevronDown size={12} className={`pointer-events-none shrink-0 ${bChevron}`} />
              </div>
            </div>
            <div>
              <label className={`mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-widest ${bLabel}`}>Votre objectif principal (optionnel)</label>
              <div className={`rounded-2xl border px-4 py-3 ${bInner}`}>
                <textarea placeholder="Ex : automatiser mon marketing, former mon équipe à l'IA, créer un chatbot pour mes clients…"
                  value={goal} onChange={(e) => setGoal(e.target.value)} rows={3}
                  className={`w-full resize-none bg-transparent text-sm outline-none ${bInput}`} />
              </div>
            </div>
            <button type="submit" disabled={!name.trim() || !email.trim() || !availability || sending}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#a78bfa] to-[#7c6fcd] py-3.5 text-sm font-bold text-white shadow-[0_4px_24px_rgba(167,139,250,0.2)] transition hover:shadow-[0_4px_32px_rgba(167,139,250,0.35)] disabled:cursor-not-allowed disabled:opacity-50">
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {sending ? "Envoi…" : "Démarrer mon parcours 6 mois"}
            </button>
            <p className={`text-center text-[0.6rem] ${bHint}`}>1 séance/semaine · 24 séances · 24h avec un expert humain certifié</p>
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
  const { isDark } = useTheme();
  const STEPS = [
    { icon: Landmark,       color: "#60a5fa", label: "Vous avez effectué votre virement",          done: true  },
    { icon: Clock,          color: "#f9a826", label: "Nous vérifions la réception du paiement",    done: false },
    { icon: CheckCircle2,   color: "#34d399", label: "Activation de votre accès (24–48h ouvrés)",  done: false },
  ];

  const pBg     = isDark ? "bg-[#07080e]"          : "bg-[#f0f2fb]";
  const pPri    = isDark ? "text-white"              : "text-[#0e1420]";
  const pSec    = isDark ? "text-white/45"           : "text-[#0e1420]/50";
  const pMut    = isDark ? "text-white/30"           : "text-[#0e1420]/35";
  const pFaint  = isDark ? "text-white/40"           : "text-[#0e1420]/45";
  const pCard   = isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-black/[0.08] bg-white shadow-sm";
  const pInner  = isDark ? "border-white/[0.08] bg-white/[0.02]" : "border-black/[0.08] bg-white shadow-sm";
  const pDivider= isDark ? "border-white/[0.06]"    : "border-black/5";
  const pDivRow = isDark ? "divide-white/[0.05]"    : "divide-black/[0.04]";
  const pEmailPill = isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-black/[0.08] bg-white shadow-sm";
  const pBadgeDot  = isDark ? "bg-[#07080e]" : "bg-[#f0f2fb]";
  const pRefreshBtn= isDark
    ? "border-white/[0.1] bg-white/[0.04] text-white/60 hover:border-white/[0.18] hover:text-white/90"
    : "border-black/10 bg-white text-[#0e1420]/60 shadow-sm hover:border-black/18 hover:text-[#0e1420]/90";
  const pBanner = isDark ? "border-white/[0.07] bg-white/[0.02]" : "border-black/6 bg-white shadow-sm";

  return (
    <div className={`flex min-h-screen items-center justify-center px-4 py-12 ${pBg}`}>
      <div className="w-full max-w-md">

        {/* Icône centrale */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-[rgba(249,168,38,0.25)] bg-[rgba(249,168,38,0.08)]">
              <Clock size={36} style={{ color: "#f9a826" }} />
            </div>
            <span className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-[rgba(249,168,38,0.4)] ${pBadgeDot}`}>
              <span className="h-2.5 w-2.5 rounded-full bg-[#f9a826]" />
            </span>
          </div>
          <h1 className={`text-2xl font-bold ${pPri}`}>Paiement en cours de vérification</h1>
          <p className={`mt-2.5 text-sm leading-relaxed ${pSec}`}>
            Votre virement a bien été enregistré. Notre équipe l&apos;activera dès réception du paiement.
          </p>
          {user?.email && (
            <div className={`mt-3 flex items-center gap-2 rounded-full border px-4 py-1.5 ${pEmailPill}`}>
              <Mail size={11} className={pMut} />
              <span className={`text-xs ${pFaint}`}>{user.email}</span>
            </div>
          )}
        </div>

        {/* Étapes */}
        <div className={`mb-6 overflow-hidden rounded-2xl border ${pCard}`}>
          <div className={`border-b px-5 py-3.5 ${pDivider}`}>
            <p className={`text-[0.65rem] font-bold uppercase tracking-widest ${pMut}`}>Statut de votre accès</p>
          </div>
          <div className={`divide-y ${pDivRow}`}>
            {STEPS.map(({ icon: Icon, color, label, done }, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all"
                  style={{
                    background: done ? `rgba(52,211,153,0.12)` : `rgba(${color === "#f9a826" ? "249,168,38" : "96,165,250"},0.08)`,
                    border:     done ? `1px solid rgba(52,211,153,0.25)` : `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                  }}
                >
                  {done
                    ? <CheckCircle2 size={15} style={{ color: "#34d399" }} />
                    : <Icon size={15} style={{ color }} />
                  }
                </div>
                <p className={`text-sm ${done ? `font-semibold ${isDark ? "text-white/75" : "text-[#0e1420]/75"}` : pFaint}`}>{label}</p>
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
        <div className={`mb-6 overflow-hidden rounded-2xl border ${pInner}`}>
          <div className={`flex items-center gap-3 border-b px-5 py-3.5 ${pDivider}`}>
            <Landmark size={14} style={{ color: "#60a5fa" }} />
            <p className={`text-[0.65rem] font-bold uppercase tracking-widest ${pMut}`}>Rappel — coordonnées du virement</p>
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
                <span className={pMut}>{label}</span>
                <span className={`font-semibold ${isDark ? "text-white/65" : "text-[#0e1420]/70"} ${mono ? "font-mono tracking-wide" : ""}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bandeau rassurant */}
        <div className={`mb-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 rounded-xl border px-4 py-3 ${pBanner}`}>
          {[
            { icon: Shield,  label: "Accès sécurisé",       color: "#34d399" },
            { icon: Clock,   label: "Activation sous 24–48h", color: "#60a5fa" },
            { icon: Zap,     label: "Email de confirmation", color: "#a78bfa" },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className={`flex items-center gap-1.5 text-[0.63rem] ${pFaint}`}>
              <Icon size={9} style={{ color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => window.location.reload()}
            className={`flex items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-semibold transition ${pRefreshBtn}`}
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

        <p className={`mt-6 text-center text-[0.65rem] ${isDark ? "text-white/20" : "text-[#0e1420]/25"}`}>
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
  const { isDark } = useTheme();
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

  const prBg     = isDark ? "bg-[#07080e]" : "bg-[#f0f2fb]";
  const prPri    = isDark ? "text-white"   : "text-[#0e1420]";
  const prSec    = isDark ? "text-white/45": "text-[#0e1420]/50";
  const prMut    = isDark ? "text-white/35": "text-[#0e1420]/40";
  const prFaint  = isDark ? "text-white/25": "text-[#0e1420]/30";
  const prCard   = isDark ? "border-white/[0.09] bg-white/[0.03]" : "border-black/[0.08] bg-white shadow-sm";
  const prDiv    = isDark ? "border-white/[0.07]" : "border-black/6";
  const prTabBar = isDark ? "border-white/[0.07] bg-white/[0.03]" : "border-black/[0.08] bg-[#f0f2fb]";
  const prTabIdle= isDark ? "text-white/35 hover:text-white/65" : "text-[#0e1420]/35 hover:text-[#0e1420]/65";
  const prInner  = isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-black/[0.08] bg-[#f7f7fb]";
  const prIco    = isDark ? "text-white/25" : "text-[#0e1420]/30";
  const prInputTxt = isDark ? "text-white placeholder-white/20" : "text-[#0e1420] placeholder-[#0e1420]/30";
  const prVirTxt = isDark ? "text-white/45 space-y-0.5" : "text-[#0e1420]/50 space-y-0.5";
  const prVirBold= isDark ? "text-white/70" : "text-[#0e1420]/75";
  const prVirMono= isDark ? "text-white/65" : "text-[#0e1420]/70";
  const prSentTxt= isDark ? "text-white/45" : "text-[#0e1420]/50";
  const prLockBg = isDark ? "bg-[#07080e]/60" : "bg-[#f0f2fb]/70";
  const prLockIcon= isDark ? "border-white/[0.12] bg-white/[0.06] text-white/40" : "border-black/10 bg-black/[0.05] text-[#0e1420]/40";
  const prLockTxt = isDark ? "text-white/35" : "text-[#0e1420]/40";
  const prChipTxt = isDark ? "text-white/30" : "text-[#0e1420]/40";

  return (
    <div className={`min-h-screen px-4 py-10 md:px-8 ${prBg}`}>
      <div className="mx-auto mb-10 max-w-5xl text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(167,139,250,0.2)] bg-[rgba(167,139,250,0.07)] px-4 py-1.5 text-xs font-bold tracking-widest text-[#a78bfa] uppercase">
          <Lock size={11} /> Accès restreint
        </div>
        <h1 className={`mt-3 text-3xl font-bold md:text-4xl ${prPri}`}>Coaching IA DJAMA</h1>
        <p className={`mt-3 text-sm max-w-md mx-auto ${prSec}`}>
          Débloquez les {COACHING_MODULES.length} modules complets, l&apos;assistant pédagogique IA et les sessions de coaching individuel.
        </p>
      </div>

      <div className="mx-auto max-w-5xl flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex-1 min-w-0 space-y-4">
          {/* Free preview */}
          <div className={`rounded-2xl border overflow-hidden ${prCard}`}>
            <div className={`flex items-center gap-3 border-b px-5 py-4 ${prDiv}`}>
              <div className="flex-1 min-w-0">
                <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[#60a5fa]">Module 1 · {firstModule.title}</p>
                <p className={`truncate text-sm font-semibold mt-0.5 ${prPri}`}>{freeChapter.title}</p>
              </div>
              <span className="shrink-0 rounded-full border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.08)] px-2.5 py-1 text-[0.6rem] font-bold text-[#34d399]">Aperçu gratuit</span>
            </div>
            <div className="px-5 py-5">
              <p className={`text-sm leading-relaxed italic ${isDark ? "text-white/60" : "text-[#0e1420]/60"}`}>{freeChapter.intro}</p>
              <div className={`mt-4 flex items-center gap-2 text-[0.65rem] ${prFaint}`}>
                <Clock size={10} /> {freeChapter.duration}<span className="mx-1">·</span><BookOpen size={10} /> Leçon
              </div>
            </div>
          </div>

          {/* Locked modules */}
          <p className={`text-[0.65rem] font-bold uppercase tracking-widest px-1 ${prChipTxt}`}>Modules inclus dans l&apos;accès complet</p>
          {lockedModules.map((mod) => (
            <div key={mod.id} className={`relative rounded-2xl border overflow-hidden ${isDark ? "border-white/[0.07] bg-white/[0.02]" : "border-black/[0.08] bg-white"}`}>
              <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 backdrop-blur-[2px] ${prLockBg}`}>
                <div className={`flex h-8 w-8 items-center justify-center rounded-full border ${prLockIcon}`}>
                  <Lock size={14} />
                </div>
                <span className={`text-[0.65rem] font-semibold ${prLockTxt}`}>Accès complet requis</span>
              </div>
              <div className="pointer-events-none select-none opacity-40 blur-[2px] px-5 py-4">
                <div className="flex items-center gap-3 mb-3">
                  <div>
                    <p className="text-[0.6rem] font-bold uppercase tracking-widest" style={{ color: mod.color }}>Module {mod.id}</p>
                    <p className={`text-sm font-semibold ${prPri}`}>{mod.title}</p>
                  </div>
                  <span className={`ml-auto text-[0.6rem] ${prMut}`}>{mod.duration}</span>
                </div>
                <p className={`text-xs leading-relaxed ${prMut}`}>{mod.tagline}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {mod.chapters.slice(0, 3).map((ch) => (
                    <span key={ch.id} className={`rounded-lg px-2.5 py-1 text-[0.6rem] ${isDark ? "bg-white/[0.04] text-white/30" : "bg-black/[0.04] text-[#0e1420]/35"}`}>{ch.title}</span>
                  ))}
                  {mod.chapters.length > 3 && (
                    <span className={`rounded-lg px-2.5 py-1 text-[0.6rem] ${isDark ? "bg-white/[0.04] text-white/25" : "bg-black/[0.04] text-[#0e1420]/30"}`}>+{mod.chapters.length - 3} chapitres</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Payment panel */}
        <div className="lg:sticky lg:top-10 lg:w-[340px] shrink-0">
          <div className={`rounded-2xl border overflow-hidden ${prCard}`}>
            <div className={`border-b px-6 py-5 ${prDiv}`}>
              <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-[rgba(167,139,250,0.2)] bg-[rgba(167,139,250,0.07)] px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-widest text-[#a78bfa]">
                <Sparkles size={9} /> Accès complet
              </div>
              <h2 className={`mt-2 text-lg font-bold ${prPri}`}>Débloquer l&apos;accès complet</h2>
              <div className="mt-3 flex items-end gap-2">
                <span className={`text-4xl font-extrabold ${prPri}`}>190€</span>
                <span className={`mb-1 text-xs ${prMut}`}>paiement unique · 3 mois</span>
              </div>
              <ul className="mt-4 space-y-1.5">
                {[
                  `${COACHING_MODULES.length} modules · ${COACHING_MODULES.reduce((a, m) => a + m.chapters.length, 0)} chapitres`,
                  "Assistant pédagogique IA",
                  "Outils IA dans chaque cours (résumé, simplification)",
                  "Sessions de coaching individuel",
                  "Accès 3 mois + mises à jour",
                ].map((item) => (
                  <li key={item} className={`flex items-center gap-2 text-xs ${isDark ? "text-white/55" : "text-[#0e1420]/60"}`}>
                    <CheckCircle2 size={11} className="shrink-0 text-[#34d399]" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="px-6 pt-5">
              <div className={`mb-4 flex gap-1.5 rounded-xl border p-1 ${prTabBar}`}>
                {([
                  { key: "carte",    icon: <CreditCard size={12} />, label: "Carte"    },
                  { key: "paypal",   icon: <span className="text-[0.65rem] font-extrabold text-[#0070BA]">PP</span>, label: "PayPal" },
                  { key: "virement", icon: <Landmark size={12} />,   label: "Virement" },
                ] as { key: PaymentTab; icon: React.ReactNode; label: string }[]).map(({ key, icon, label }) => (
                  <button key={key} onClick={() => setPayTab(key)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[0.65rem] font-semibold transition-all ${
                      payTab === key
                        ? "bg-[rgba(167,139,250,0.15)] text-[#a78bfa] border border-[rgba(167,139,250,0.25)]"
                        : prTabIdle
                    }`}>
                    {icon} {label}
                  </button>
                ))}
              </div>

              {payTab === "carte" && (
                <div className="pb-6">
                  <p className={`mb-4 text-xs leading-relaxed ${prMut}`}>Paiement sécurisé via Stripe. Vos données ne nous parviennent jamais.</p>
                  <button onClick={handleStripe} disabled={loadingPay}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#a78bfa] to-[#7c6fcd] py-3.5 text-sm font-bold text-white shadow-[0_4px_24px_rgba(167,139,250,0.25)] transition hover:shadow-[0_4px_32px_rgba(167,139,250,0.4)] disabled:opacity-60">
                    {loadingPay ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
                    {loadingPay ? "Redirection…" : "Commencer maintenant → 190€"}
                  </button>
                </div>
              )}
              {payTab === "paypal" && (
                <div className="pb-6">
                  <p className={`mb-4 text-xs leading-relaxed ${prMut}`}>Vous serez redirigé vers PayPal pour finaliser votre paiement.</p>
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
                        <p className={`text-sm font-semibold ${prPri}`}>Demande enregistrée</p>
                        <p className={`mt-1.5 text-xs leading-relaxed ${prSentTxt}`}>Accès activé sous 24h à réception.</p>
                      </motion.div>
                    ) : (
                      <motion.form key="form" onSubmit={handleVirement} className="space-y-3">
                        <div className={`rounded-xl border px-4 py-3 text-[0.65rem] ${prVirTxt} ${prInner}`}>
                          <p>Bénéficiaire : <span className={`font-semibold ${prVirBold}`}>EI AMDJAD Nofane</span></p>
                          <p>IBAN : <span className={`font-mono ${prVirMono}`}>FR76 4061 8804 5900 0406 3964 945</span></p>
                          <p>BIC : <span className={`font-mono ${prVirMono}`}>BOUSFRPPXXX</span></p>
                          <p>Montant : <span className={`font-bold ${prVirBold}`}>190,00 €</span></p>
                          <p>Référence : <span className="font-semibold text-[#a78bfa]">COACHING-IA</span></p>
                        </div>
                        {[
                          { label: "Email", type: "email", value: virEmail, setter: setVirEmail, placeholder: "votre@email.fr", icon: Mail },
                          { label: "Nom complet", type: "text", value: virName, setter: setVirName, placeholder: "Prénom Nom", icon: User },
                        ].map(({ label, type, value, setter, placeholder, icon: Icon }) => (
                          <div key={label}>
                            <label className={`mb-1 block text-[0.6rem] font-semibold uppercase tracking-widest ${prMut}`}>{label}</label>
                            <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${prInner}`}>
                              <Icon size={12} className={prIco} />
                              <input type={type} required placeholder={placeholder} value={value}
                                onChange={(e) => setter(e.target.value)}
                                className={`flex-1 bg-transparent text-xs outline-none ${prInputTxt}`} />
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

/* ─────────────────────────────────────────────────────────
   DONNÉES — Flashcards (5 par module)
───────────────────────────────────────────────────────── */
const MODULE_FLASHCARDS: Record<string, { front: string; back: string }[]> = {
  "1":  [
    { front: "Qu'est-ce qu'un LLM ?",          back: "Large Language Model — modèle IA entraîné sur d'immenses corpus pour prédire le token suivant. GPT-4, Claude et Gemini en sont des exemples." },
    { front: "Hallucination IA — définition ?", back: "Quand un LLM génère des informations fausses présentées avec confiance. Ex : inventer une citation, un fait ou une référence légale inexistante." },
    { front: "Que signifie 'température' ?",    back: "Paramètre de créativité : faible (0.1) = prévisible ; élevée (1.0+) = créatif mais moins fiable. Par défaut ~0.7 dans la plupart des modèles." },
    { front: "Qu'est-ce qu'un token ?",         back: "Unité de texte traitée par un LLM. ~0.75 mot en anglais, ~0.5-0.6 en français. 1 000 tokens ≈ 750 mots. Les limites contexte s'expriment en tokens." },
    { front: "IA faible vs IA forte ?",         back: "IA faible (actuelle) : optimisée pour une tâche précise. IA forte/AGI (théorique) : raisonnement général comparable à l'humain — n'existe pas encore." },
  ],
  "2":  [
    { front: "Méthode RCTC ?",                  back: "Rôle – Contexte – Tâche – Contraintes. Structure fondamentale d'un prompt efficace pour cadrer précisément le comportement du modèle." },
    { front: "Chain-of-Thought prompting ?",    back: "Demander à l'IA de raisonner 'étape par étape'. Améliore drastiquement la précision sur les tâches complexes de raisonnement et de calcul." },
    { front: "Few-shot vs Zero-shot ?",         back: "Zero-shot : aucun exemple. Few-shot : 2 à 5 exemples fournis dans le prompt. Few-shot améliore la cohérence du format et du style de sortie." },
    { front: "Qu'est-ce que le context window ?", back: "Nombre max de tokens traités en une fois. Claude Sonnet : 200k tokens. GPT-4o : 128k. Au-delà, le modèle 'oublie' le début de la conversation." },
    { front: "Prompt système vs utilisateur ?", back: "Système : instructions persistantes (rôle, règles, ton). Utilisateur : la demande en cours. Le système conditionne toute la conversation." },
  ],
  "3":  [
    { front: "GPT-4o vs o1 — différence ?",    back: "GPT-4o : multimodal, rapide, usage courant. o1 : modèle de raisonnement lent — pense longuement avant de répondre, meilleur en maths/logique." },
    { front: "Qu'est-ce qu'un GPT Custom ?",   back: "Assistant ChatGPT personnalisé avec instructions, fichiers et actions. Partageable via lien privé — idéal pour codifier un workflow récurrent." },
    { front: "Code Interpreter ChatGPT ?",     back: "Sandbox Python intégré à ChatGPT. Analyse CSV, crée des graphiques, calculs complexes, génère des fichiers. Disponible avec ChatGPT Plus." },
    { front: "ChatGPT Free vs Plus ?",         back: "Free : GPT-4o mini, limites de messages. Plus (20$/mois) : GPT-4o, o1, DALL-E, Code Interpreter, mémoire persistante, navigation web." },
    { front: "Mémoire ChatGPT ?",              back: "ChatGPT retient des infos entre conversations (Paramètres > Personnalisation > Mémoire). Visualisable et modifiable à tout moment." },
  ],
  "4":  [
    { front: "Claude vs ChatGPT — point fort de Claude ?", back: "Claude excelle sur : documents très longs (200k tokens), instructions complexes, rédaction nuancée, constance sur de longues conversations." },
    { front: "Qu'est-ce qu'un Projet Claude ?", back: "Espace de travail persistant dans Claude.ai avec instructions et fichiers partagés entre toutes les conversations. Idéal pour les workflows répétitifs." },
    { front: "Haiku vs Sonnet vs Opus ?",      back: "Haiku : rapide, économique. Sonnet : équilibre vitesse/intelligence (usage courant). Opus : le plus puissant (tâches très complexes)." },
    { front: "Constitutional AI ?",            back: "Méthode Anthropic : Claude est entraîné avec un livre de règles éthiques, s'auto-évalue et corrige ses réponses pour être utile et honnête." },
    { front: "Avantage API Claude vs web ?",   back: "API : system prompts custom, streaming, contrôle du modèle, intégration apps, automation à grande échelle, gestion fine des coûts." },
  ],
  "5":  [
    { front: "Gemini Ultra vs Pro vs Flash ?", back: "Ultra : concurrent GPT-4o, multimodal avancé. Pro : usage général gratuit. Flash : ultrarapide et économique via API." },
    { front: "Avantage unique de Perplexity ?", back: "Moteur de recherche IA avec sources citées en temps réel. Idéal pour veille, recherche de faits récents, synthèses documentées." },
    { front: "Mistral — pourquoi l'utiliser ?", back: "Open-source, hébergeable localement, RGPD-friendly, européen. Mistral Large rivalise avec GPT-4 à coût réduit." },
    { front: "Commande --ar dans Midjourney ?", back: "Définit le ratio d'aspect. --ar 16:9 (paysage), --ar 1:1 (carré), --ar 9:16 (vertical Stories). S'utilise en fin de prompt." },
    { front: "Qu'est-ce qu'ElevenLabs ?",      back: "Outil IA de synthèse vocale ultra-réaliste. Clone de voix, audiobooks, voix-off vidéo. Référence du marché pour la génération audio." },
  ],
  "6":  [
    { front: "Zapier vs Make ?",               back: "Zapier : débutants, 6000+ apps, rapide à mettre en place. Make : workflows complexes avec branchements, transformation de données et itérations." },
    { front: "Qu'est-ce qu'un webhook ?",      back: "URL qui reçoit des données en temps réel lors d'un événement. Ex : formulaire → webhook → Zapier → CRM + email + Slack simultanément." },
    { front: "n8n vs Zapier ?",                back: "n8n : open-source, auto-hébergeable, coût quasi-nul, logique avancée. Zapier : SaaS clé en main, abordable mais limité sur les cas complexes." },
    { front: "Agent IA autonome ?",            back: "IA qui planifie et exécute des séquences d'actions pour atteindre un objectif sans intervention humaine à chaque étape." },
    { front: "Top 3 workflows IA ROI PME ?",   back: "1) Qualification leads. 2) Réponse emails/support auto. 3) Création contenu hebdomadaire (LinkedIn + newsletter)." },
  ],
  "7":  [
    { front: "IA + prospection ?",             back: "Personnalisation à l'échelle : analyser profil LinkedIn → générer message personnalisé → automatiser l'envoi. Résultat : taux de réponse ×2 à ×3." },
    { front: "IA + service client — 3 usages ?", back: "1) Chatbot 24/7 (60-80% tickets simples). 2) Classification auto des urgences. 3) Suggestion de réponses aux agents avec contexte." },
    { front: "Stack IA mensuel entrepreneur ?", back: "ChatGPT Plus (20$) + Claude Pro (20$) + Zapier Starter (20$) + image (10$) = ~70$/mois. ROI dès 2-4h économisées/semaine." },
    { front: "Comment mesurer le ROI de l'IA ?", back: "(Heures économisées × taux horaire) + Revenus supplémentaires – Coût outils. Tracker avant/après sur les 3 tâches les plus chronophages." },
    { front: "IA + RH — 3 cas ?",              back: "1) Fiches de poste optimisées. 2) Présélection CV automatique. 3) FAQ onboarding IA répondant aux nouvelles recrues 24/7." },
  ],
  "8":  [
    { front: "Framework post LinkedIn IA ?",   back: "1 insight fort + story + enseignement actionnable + CTA. IA pour brainstorm et brouillon. Toi pour l'angle authentique." },
    { front: "Content repurposing IA ?",       back: "1 article → 5 posts LinkedIn + newsletter + tweets + script vidéo. IA automatise la reformulation. Gain : ×5 de contenu pour le même effort." },
    { front: "SEO + IA — 5 étapes ?",          back: "1) Mots-clés (Perplexity). 2) Plan IA optimisé. 3) Rédaction Claude/ChatGPT. 4) Meta-description. 5) Maillage interne suggéré par l'IA." },
    { front: "Top 3 outils vidéo IA ?",        back: "HeyGen (avatar IA). Opus Clip (découpe auto longs formats). Captions.ai (sous-titres + édition). Descript (édition par texte)." },
    { front: "Structure newsletter IA ?",      back: "1 insight principal + 3 outils/actus IA + 1 prompt de la semaine + 1 CTA simple. IA pour le fond, vous pour la voix." },
  ],
  "9":  [
    { front: "Qu'est-ce que le RAG ?",         back: "Retrieval-Augmented Generation : recherche sémantique dans vos docs + génération LLM. Accès à vos données privées sans fine-tuning coûteux." },
    { front: "Fine-tuning vs RAG ?",           back: "RAG : données changeantes, coût bas. Fine-tuning : adapter style/ton du modèle ou comportements très spécifiques et répétitifs." },
    { front: "LangChain — à quoi ça sert ?",  back: "Framework Python pour chaîner LLMs + outils (recherche, DB, code). Facilite agents, chatbots RAG et pipelines IA complexes." },
    { front: "Prompt injection ?",             back: "Attaque : texte malveillant dans les données traitées par l'IA modifie son comportement. Ex : email client contenant 'Ignore tes instructions...'." },
    { front: "Vector database ?",             back: "DB stockant des embeddings (représentations vectorielles). Permet recherche sémantique. Ex : Pinecone, Weaviate, Supabase pgvector." },
  ],
  "10": [
    { front: "3 critères bon projet final DJAMA ?", back: "1) Résout un vrai problème. 2) Utilise 2+ outils IA combinés. 3) Mesurable : KPIs chiffrés avant/après avec démo fonctionnelle." },
    { front: "Structure présentation projet IA ?", back: "Problème → Solution IA → Architecture → Démo/prototype → Résultats → Prochaines étapes. 10-15 min, slides épurés." },
    { front: "Certification DJAMA ?",          back: "Attestation interne DJAMA validant la maîtrise du programme. Preuve de compétences pour clients et partenaires. Non reconnue par l'État." },
    { front: "Pitcher un projet IA à un client ?", back: "Angle ROI : 'Cette solution économise X h/semaine soit Y€/mois'. Montrez la démo en live. Anticipez : 'ça va remplacer mes équipes ?' (non)." },
    { front: "Après la certification ?",       back: "Rejoindre la communauté DJAMA Alumni, partager sur LinkedIn (badge DJAMA), explorer agents avancés, RAG custom, formation équipe." },
  ],
};

/* ─────────────────────────────────────────────────────────
   DONNÉES — Études de cas (1 par module)
───────────────────────────────────────────────────────── */
const MODULE_CASES: Record<string, { scenario: string; question: string; hints: string[] }> = {
  "1":  { scenario: "Vous êtes consultant RH. Un DG veut intégrer l'IA dans son process de recrutement (200 embauches/an). Sa crainte : 'L'IA va se tromper et les candidats vont le savoir.'", question: "Comment répondez-vous à ses objections et proposez-vous une intégration réaliste et responsable ?", hints: ["Quelles tâches RH sont répétitives vs à forte valeur humaine ?", "Que peut faire l'IA sans risque majeur ? Que doit rester humain ?"] },
  "2":  { scenario: "Vous dirigez une agence conseil. En une heure vous devez envoyer des propositions commerciales personnalisées à 3 prospects : une boulangerie artisanale, une startup SaaS B2B, et un cabinet d'avocats.", question: "Construisez un prompt RCTC réutilisable qui génère ces 3 propositions avec le bon ton pour chaque cible.", hints: ["Comment définir le Rôle pour qu'il s'adapte à chaque cible ?", "Quelles Contraintes permettent de différencier les 3 versions ?"] },
  "3":  { scenario: "Votre équipe de 5 commerciaux passe 2h/jour à rédiger des comptes-rendus de réunion manuellement. Vous voulez automatiser ça avec ChatGPT cette semaine.", question: "Décrivez le workflow complet : capture de l'info, traitement ChatGPT, format du CR en sortie.", hints: ["Comment les infos entrent dans le système (vocal ? formulaire ?) ?", "Quel format de CR est le plus utile pour le CRM et le manager ?"] },
  "4":  { scenario: "Vous êtes coach business avec 150 pages de méthodes propriétaires. Vous voulez les rendre accessibles 24h/24 à vos clients entre les sessions.", question: "Claude Projets, API + RAG, ou GPT Custom ? Justifiez votre choix et décrivez l'architecture.", hints: ["Claude Projets peut ingérer vos docs directement dans l'interface", "Pour une vraie app multi-clients : pensez API + RAG sur vos PDF"] },
  "5":  { scenario: "Vous lancez une marque de cosmétiques naturels. Budget marketing : 500€/mois. Vous devez créer des visuels, posts et vidéos pour Instagram et LinkedIn.", question: "Composez votre stack IA image/vidéo/contenu sous 80€/mois et décrivez l'usage au quotidien.", hints: ["DALL-E intégré à ChatGPT vs Midjourney — coût/qualité ?", "Quel outil pour transformer des photos en Reels courts ?"] },
  "6":  { scenario: "Chaque semaine votre assistante collecte 20 devis fournisseurs par email, les copie dans Excel, calcule les totaux et vous envoie un résumé. Cela prend 4h (30€/h).", question: "Concevez un workflow no-code qui ramène ce travail à 30 minutes. Quel outil choisissez-vous et quel ROI ?", hints: ["Déclencheur : à quel moment le workflow commence-t-il ?", "Zapier, Make ou n8n : lequel convient ici et pourquoi ?"] },
  "7":  { scenario: "Vous êtes PDG d'une PME de 12 personnes. Votre directeur commercial part dans 6 semaines. Vous devez maintenir le chiffre d'affaires pendant la transition.", question: "Quelles sont vos 3 actions prioritaires intégrant l'IA pour maintenir la performance commerciale ?", hints: ["Comment capturer les process du commercial sortant ?", "Quels outils IA peuvent couvrir certaines tâches en urgence ?"] },
  "8":  { scenario: "Vous êtes coach bien-être indépendant. Vous avez 45 minutes/semaine pour votre présence digitale. Objectif : LinkedIn + newsletter mensuelle.", question: "Construisez votre machine à contenu IA : que produisez-vous, avec quels outils, en combien de temps ?", hints: ["Quel contenu peut être préparé en batch mensuel (1h) ?", "Comment recycler un sujet fort en plusieurs formats en 20 min ?"] },
  "9":  { scenario: "Vous construisez un assistant IA pour une chaîne de 15 restaurants qui répond aux questions clients (horaires, allergènes, réservations). Le menu change chaque semaine.", question: "Quelle architecture (RAG, fine-tuning, GPT Custom) et pourquoi ? Listez les composants nécessaires.", hints: ["Les menus changent souvent — quel impact sur le choix technique ?", "Fine-tuning vs RAG pour des données fréquemment mises à jour ?"] },
  "10": { scenario: "Vous avez terminé le programme DJAMA. Votre manager vous demande de présenter en 15 min comment l'IA va transformer votre département l'année prochaine, avec un plan chiffré.", question: "Structurez votre présentation : points clés, outils concrets, KPIs attendus, budget.", hints: ["Structure : problème → opportunité IA → 3 cas prioritaires → ROI → plan 90 jours", "Préparez la question : 'Quel risque si on ne fait rien ?'"] },
};

/* ─────────────────────────────────────────────────────────
   DONNÉES — Questions réponse libre (1 par module)
───────────────────────────────────────────────────────── */
const MODULE_LIBRE_QUESTIONS: Record<string, string> = {
  "1":  "Expliquez pourquoi un LLM peut 'halluciner' dans vos propres mots. Donnez un exemple concret et proposez une approche pour détecter ou limiter ce risque en contexte professionnel.",
  "2":  "Rédigez un prompt complet en méthode RCTC pour une tâche réelle de votre quotidien. Expliquez chaque section et justifiez vos choix.",
  "3":  "Décrivez un workflow ChatGPT concret qui vous ferait gagner 30 minutes/jour. Soyez précis : entrées, traitement, sorties attendues.",
  "4":  "Un client demande un assistant basé sur 500 pages de documentation interne. Proposez une solution Claude avec avantages, limites et architecture.",
  "5":  "Vous avez 50€/mois pour un stack IA dans une TPE consulting. Quels 3 outils choisissez-vous et comment les utiliseriez-vous au quotidien ?",
  "6":  "Identifiez un processus répétitif dans votre activité et décrivez le workflow d'automatisation no-code : déclencheur → actions → sortie.",
  "7":  "Rédigez un plan de transformation IA pour votre activité sur 90 jours. 3 cas d'usage prioritaires avec ROI estimé pour chacun.",
  "8":  "Construisez un calendrier éditorial IA pour 4 semaines sur LinkedIn. Thèmes, formats, fréquence et comment l'IA intervient pour chaque contenu.",
  "9":  "Comparez RAG vs Fine-tuning pour un cas d'usage de votre choix. Justifiez votre recommandation technique et estimez le coût de mise en place.",
  "10": "Présentez votre projet final DJAMA en 200 mots : problème, solution IA choisie, architecture, métriques de succès et prochaines étapes.",
};

/* ─────────────────────────────────────────────────────────
   COMPOSANT — FlashcardDeck
───────────────────────────────────────────────────────── */
function FlashcardDeck({ moduleId }: { moduleId: string }) {
  const { isDark } = useTheme();
  const allCards = MODULE_FLASHCARDS[moduleId] ?? MODULE_FLASHCARDS["1"]!;
  const [idx,     setIdx]     = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known,   setKnown]   = useState<Set<number>>(new Set());
  const [toRedo,  setToRedo]  = useState<Set<number>>(new Set());

  const isDone = known.size + toRedo.size >= allCards.length;
  const card   = allCards[idx];

  function advance(verdict: "known" | "redo") {
    const setter = verdict === "known" ? setKnown : setToRedo;
    setter(prev => new Set([...prev, idx]));
    setFlipped(false);
    setTimeout(() => {
      let next = -1;
      for (let i = 1; i <= allCards.length; i++) {
        const ni = (idx + i) % allCards.length;
        if (!known.has(ni) && !toRedo.has(ni) && ni !== idx) { next = ni; break; }
      }
      if (next >= 0) setIdx(next);
    }, 180);
  }

  function reset() { setKnown(new Set()); setToRedo(new Set()); setIdx(0); setFlipped(false); }

  const fc = {
    card: isDark ? "border-white/[0.08] bg-white/[0.04]" : "border-black/[0.08] bg-white shadow-md",
    pri:  isDark ? "text-white" : "text-[#0e1420]",
    sec:  isDark ? "text-white/55" : "text-[#0e1420]/60",
    mut:  isDark ? "text-white/30" : "text-[#0e1420]/35",
    idle: isDark ? "border-white/[0.09] text-white/40 hover:text-white/70" : "border-black/[0.09] text-[#0e1420]/40 hover:text-[#0e1420]/70",
  };

  if (isDone) return (
    <div className="flex flex-col items-center gap-5 py-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.1)]">
        <Award size={26} style={{ color: GOLD }} />
      </div>
      <div>
        <p className={`text-sm font-bold ${fc.pri}`}>Deck terminé !</p>
        <p className={`mt-1 text-xs ${fc.sec}`}>{known.size} maîtrisées · {toRedo.size} à retravailler</p>
      </div>
      <div className="flex gap-3">
        <button onClick={reset} className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold transition ${fc.idle}`}>
          <RotateCcw size={12} /> Recommencer
        </button>
        {toRedo.size > 0 && (
          <button onClick={() => { setKnown(new Set()); setToRedo(new Set()); setIdx([...toRedo][0] ?? 0); setFlipped(false); }}
            className="flex items-center gap-1.5 rounded-xl border border-[rgba(201,165,90,0.3)] bg-[rgba(201,165,90,0.08)] px-4 py-2 text-xs font-semibold text-[#c9a55a]">
            Retravailler les {toRedo.size} manquées
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className={`text-xs ${fc.mut}`}>{idx + 1} / {allCards.length}</span>
        <div className="flex gap-3 text-xs">
          <span className="text-[#34d399] font-semibold">{known.size} ✓</span>
          <span className="text-red-400 font-semibold">{toRedo.size} ✗</span>
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }}>
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${((known.size + toRedo.size) / allCards.length) * 100}%`, background: GOLD }} />
      </div>

      <motion.div
        key={`${idx}-${flipped}`}
        initial={{ rotateY: flipped ? -90 : 90, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ duration: 0.22 }}
        onClick={() => setFlipped(f => !f)}
        className={`relative min-h-[170px] cursor-pointer rounded-2xl border p-6 ${fc.card}`}
      >
        <span className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider ${
          flipped ? "bg-[rgba(201,165,90,0.15)] text-[#c9a55a]" : isDark ? "bg-white/[0.06] text-white/30" : "bg-black/[0.05] text-[#0e1420]/30"
        }`}>{flipped ? "Réponse" : "Question"}</span>
        <div className="flex min-h-[110px] items-center justify-center text-center">
          <p className={`leading-relaxed ${flipped ? `text-sm ${fc.sec}` : `text-base font-semibold ${fc.pri}`}`}>
            {flipped ? card?.back : card?.front}
          </p>
        </div>
        {!flipped && <p className={`mt-2 text-center text-[0.6rem] ${fc.mut}`}>Cliquez pour voir la réponse</p>}
      </motion.div>

      {flipped ? (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
          <button onClick={() => advance("redo")}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 py-3 text-sm font-semibold text-red-400 transition hover:border-red-500/35">
            <X size={14} /> À retravailler
          </button>
          <button onClick={() => advance("known")}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.1)] py-3 text-sm font-semibold text-[#34d399] transition hover:border-[rgba(52,211,153,0.4)]">
            <CheckCircle2 size={14} /> Je maîtrise
          </button>
        </motion.div>
      ) : (
        <button onClick={() => setFlipped(true)}
          className={`w-full rounded-xl border py-3 text-sm font-semibold transition ${fc.idle}`}>
          Retourner la carte
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPOSANT — Réponse libre (évaluation IA)
───────────────────────────────────────────────────────── */
function LibreMode({ moduleId }: { moduleId: string }) {
  const { isDark } = useTheme();
  const question  = MODULE_LIBRE_QUESTIONS[moduleId] ?? MODULE_LIBRE_QUESTIONS["1"]!;
  const module    = COACHING_MODULES.find(m => m.id === moduleId);
  const [response,   setResponse]   = useState("");
  const [evaluation, setEvaluation] = useState<string | null>(null);
  const [loading,    setLoading]    = useState(false);

  async function evaluate() {
    if (response.trim().length < 30 || loading) return;
    setLoading(true);
    try {
      const res  = await fetch("/api/coaching-ia/assistant", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          messages: [{ role: "user", content: `Évalue cette réponse d'apprenant.\n\nQuestion : "${question}"\n\nRéponse :\n"${response}"\n\nDonne une évaluation constructive : points forts, lacunes, et une version améliorée.` }],
          mode:    "exercise",
          context: module ? `Module ${moduleId} — ${module.title}` : undefined,
        }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      setEvaluation(data.reply ?? data.error ?? "Erreur.");
    } catch { setEvaluation("Erreur. Réessayez."); }
    finally { setLoading(false); }
  }

  const lc = {
    card:  isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-black/[0.08] bg-white shadow-sm",
    pri:   isDark ? "text-white" : "text-[#0e1420]",
    sec:   isDark ? "text-white/55" : "text-[#0e1420]/60",
    mut:   isDark ? "text-white/30" : "text-[#0e1420]/35",
    input: isDark
      ? "border-white/[0.09] bg-white/[0.04] text-white placeholder-white/25 focus:border-[rgba(201,165,90,0.4)]"
      : "border-black/10 bg-white text-[#0e1420] placeholder-[#0e1420]/30 shadow-sm focus:border-[rgba(201,165,90,0.35)]",
    idle:  isDark ? "border-white/[0.09] text-white/40 hover:text-white/70" : "border-black/[0.09] text-[#0e1420]/40 hover:text-[#0e1420]/70",
  };

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-5 ${lc.card}`}>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[rgba(201,165,90,0.15)]">
            <FileText size={12} style={{ color: GOLD }} />
          </div>
          <span className={`text-[0.6rem] font-bold uppercase tracking-wider ${lc.mut}`}>Question ouverte · Module {moduleId}</span>
        </div>
        <p className={`text-sm leading-relaxed ${lc.pri}`}>{question}</p>
      </div>

      {!evaluation ? (
        <div className="space-y-3">
          <textarea value={response} onChange={e => setResponse(e.target.value)} rows={6}
            placeholder="Rédigez votre réponse ici (minimum 30 caractères)…"
            className={`w-full resize-none rounded-2xl border px-4 py-3 text-sm outline-none transition ${lc.input}`} />
          <button onClick={evaluate} disabled={response.trim().length < 30 || loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${GOLD}bb, ${GOLD})` }}>
            {loading ? <><Loader2 size={14} className="animate-spin" /> Évaluation…</> : <><Sparkles size={14} /> Soumettre pour évaluation IA</>}
          </button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className={`rounded-2xl border p-5 ${lc.card}`}>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[rgba(52,211,153,0.15)]">
                <CheckCircle2 size={12} className="text-[#34d399]" />
              </div>
              <span className={`text-[0.6rem] font-bold uppercase tracking-wider ${lc.mut}`}>Évaluation du Coach IA</span>
            </div>
            <p className={`whitespace-pre-wrap text-sm leading-relaxed ${lc.sec}`}>{evaluation}</p>
          </div>
          <button onClick={() => { setResponse(""); setEvaluation(null); }}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition ${lc.idle}`}>
            <RotateCcw size={13} /> Nouvelle réponse
          </button>
        </motion.div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPOSANT — Cas pratique (évaluation IA)
───────────────────────────────────────────────────────── */
function CasPratiqueMode({ moduleId }: { moduleId: string }) {
  const { isDark }  = useTheme();
  const cas         = MODULE_CASES[moduleId] ?? MODULE_CASES["1"]!;
  const module      = COACHING_MODULES.find(m => m.id === moduleId);
  const [response,   setResponse]   = useState("");
  const [evaluation, setEvaluation] = useState<string | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [showHints,  setShowHints]  = useState(false);

  async function evaluate() {
    if (response.trim().length < 50 || loading) return;
    setLoading(true);
    try {
      const res  = await fetch("/api/coaching-ia/assistant", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          messages: [{ role: "user", content: `Évalue cette réponse à un cas pratique.\n\nScénario : "${cas.scenario}"\nQuestion : "${cas.question}"\n\nRéponse :\n"${response}"\n\nÉvalue point par point : ce qui est juste, ce qui manque, exemple de réponse complète.` }],
          mode:    "exercise",
          context: module ? `Module ${moduleId} — Cas pratique : ${module.title}` : undefined,
        }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      setEvaluation(data.reply ?? data.error ?? "Erreur.");
    } catch { setEvaluation("Erreur. Réessayez."); }
    finally { setLoading(false); }
  }

  const cc = {
    card:  isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-black/[0.08] bg-white shadow-sm",
    gold:  "border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.06)]",
    pri:   isDark ? "text-white" : "text-[#0e1420]",
    sec:   isDark ? "text-white/55" : "text-[#0e1420]/60",
    mut:   isDark ? "text-white/30" : "text-[#0e1420]/35",
    input: isDark
      ? "border-white/[0.09] bg-white/[0.04] text-white placeholder-white/25 focus:border-[rgba(201,165,90,0.4)]"
      : "border-black/10 bg-white text-[#0e1420] placeholder-[#0e1420]/30 shadow-sm focus:border-[rgba(201,165,90,0.35)]",
    idle:  isDark ? "border-white/[0.09] text-white/40 hover:text-white/70" : "border-black/[0.09] text-[#0e1420]/40 hover:text-[#0e1420]/70",
  };

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-5 ${cc.card}`}>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[rgba(201,165,90,0.15)]">
            <Lightbulb size={12} style={{ color: GOLD }} />
          </div>
          <span className={`text-[0.6rem] font-bold uppercase tracking-wider ${cc.mut}`}>Scénario</span>
        </div>
        <p className={`mb-4 text-sm leading-relaxed ${cc.sec}`}>{cas.scenario}</p>
        <div className={`rounded-xl border p-3 ${cc.gold}`}>
          <p className={`mb-1 text-[0.6rem] font-bold uppercase tracking-wide ${cc.mut}`}>Question</p>
          <p className={`text-sm font-medium ${cc.pri}`}>{cas.question}</p>
        </div>
      </div>

      <button onClick={() => setShowHints(s => !s)}
        className={`flex items-center gap-1.5 text-xs font-semibold transition ${isDark ? "text-white/35 hover:text-white/60" : "text-[#0e1420]/35 hover:text-[#0e1420]/60"}`}>
        <HelpCircle size={12} />
        {showHints ? "Masquer les indices" : "Voir les indices"}
        <ChevronDown size={11} className={`transition-transform ${showHints ? "rotate-180" : ""}`} />
      </button>

      {showHints && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className={`rounded-xl border p-4 space-y-2 ${cc.card}`}>
          {cas.hints.map((h, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-0.5 text-[0.62rem] font-black" style={{ color: GOLD }}>{i + 1}.</span>
              <p className={`text-xs ${cc.sec}`}>{h}</p>
            </div>
          ))}
        </motion.div>
      )}

      {!evaluation ? (
        <div className="space-y-3">
          <textarea value={response} onChange={e => setResponse(e.target.value)} rows={7}
            placeholder="Développez votre approche, vos choix et votre justification…"
            className={`w-full resize-none rounded-2xl border px-4 py-3 text-sm outline-none transition ${cc.input}`} />
          <button onClick={evaluate} disabled={response.trim().length < 50 || loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${GOLD}bb, ${GOLD})` }}>
            {loading ? <><Loader2 size={14} className="animate-spin" /> Analyse…</> : <><Sparkles size={14} /> Analyser ma réponse</>}
          </button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className={`rounded-2xl border p-5 ${cc.card}`}>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[rgba(52,211,153,0.15)]">
                <CheckCircle2 size={12} className="text-[#34d399]" />
              </div>
              <span className={`text-[0.6rem] font-bold uppercase tracking-wider ${cc.mut}`}>Analyse du Coach IA</span>
            </div>
            <p className={`whitespace-pre-wrap text-sm leading-relaxed ${cc.sec}`}>{evaluation}</p>
          </div>
          <button onClick={() => { setResponse(""); setEvaluation(null); setShowHints(false); }}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition ${cc.idle}`}>
            <RotateCcw size={13} /> Nouveau cas pratique
          </button>
        </motion.div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   DONNÉES — Scénarios de simulation
───────────────────────────────────────────────────────── */
type SimScenario = "prospect" | "negociation" | "management" | "interview";

const SIM_SCENARIOS: {
  key:        SimScenario;
  label:      string;
  persona:    string;
  role:       string;
  desc:       string;
  difficulty: "Intermédiaire" | "Avancé" | "Expert";
  color:      string;
  emoji:      string;
}[] = [
  {
    key:        "prospect",
    label:      "Prospection commerciale",
    persona:    "Thomas Blanc, Directeur Commercial PME",
    role:       "Vous êtes consultant IA en charge de le convaincre",
    desc:       "Thomas est sceptique, a eu de mauvaises expériences et a des objections bien préparées. Votre objectif : obtenir un RDV de démonstration.",
    difficulty: "Intermédiaire",
    color:      "#06b6d4",
    emoji:      "🤝",
  },
  {
    key:        "negociation",
    label:      "Négociation tarifaire",
    persona:    "Sophie Ferrara, Responsable Achats Groupe",
    role:       "Vous êtes le fournisseur — défendez votre offre à 18 000€/an",
    desc:       "Sophie a un budget de 12 000€ et une offre concurrente à 14 000€. Elle connaît toutes les techniques de négociation.",
    difficulty: "Avancé",
    color:      "#f59e0b",
    emoji:      "💼",
  },
  {
    key:        "management",
    label:      "Entretien de recadrage",
    persona:    "Karim Benali, Développeur Senior",
    role:       "Vous êtes son manager — 3 projets en retard ce trimestre",
    desc:       "Karim est défensif mais cache une vraie frustration. Un bon manager découvrira la cause réelle et trouvera un plan d'action.",
    difficulty: "Expert",
    color:      "#8b5cf6",
    emoji:      "👔",
  },
  {
    key:        "interview",
    label:      "Entretien d'embauche",
    persona:    "Clara Moreau, DRH Scale-up Tech",
    role:       "Vous postulez au poste de Responsable Marketing IA",
    desc:       "Clara cherche authenticité et maîtrise réelle de l'IA. Elle creuse les généralités et ne se contente pas du discours.",
    difficulty: "Avancé",
    color:      "#ec4899",
    emoji:      "🎯",
  },
];

/* ─────────────────────────────────────────────────────────
   COMPOSANT — Simulation jeu de rôle
───────────────────────────────────────────────────────── */
function SimulationMode() {
  const { isDark } = useTheme();
  type SimMsg = { role: "user" | "assistant"; content: string };

  const [selected,   setSelected]   = useState<SimScenario | null>(null);
  const [messages,   setMessages]   = useState<SimMsg[]>([]);
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [debrief,    setDebrief]    = useState<string | null>(null);
  const [briefing,   setBriefing]   = useState(false);
  const scrollRef                   = useRef<HTMLDivElement>(null);

  const scenario = SIM_SCENARIOS.find(s => s.key === selected);

  async function sendMessage() {
    if (!selected || !input.trim() || loading) return;
    const userMsg: SimMsg = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res  = await fetch("/api/coaching-ia/simulation", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ scenario: selected, messages: next }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      if (data.reply) setMessages(m => [...m, { role: "assistant", content: data.reply! }]);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function requestDebrief() {
    if (!selected || loading) return;
    setLoading(true);
    try {
      const res  = await fetch("/api/coaching-ia/simulation", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ scenario: selected, messages, debrief: true }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      setDebrief(data.reply ?? null);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  function reset() { setSelected(null); setMessages([]); setInput(""); setDebrief(null); setBriefing(false); }

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const sm = {
    card:  isDark ? "border-white/[0.07] bg-white/[0.03]" : "border-black/[0.07] bg-white shadow-sm",
    pri:   isDark ? "text-white" : "text-[#0e1420]",
    sec:   isDark ? "text-white/55" : "text-[#0e1420]/60",
    mut:   isDark ? "text-white/30" : "text-[#0e1420]/35",
    input: isDark
      ? "border-white/[0.09] bg-white/[0.04] text-white placeholder-white/25 focus:border-[rgba(201,165,90,0.4)]"
      : "border-black/10 bg-white text-[#0e1420] placeholder-[#0e1420]/30 shadow-sm focus:border-[rgba(201,165,90,0.35)]",
    idle:  isDark ? "border-white/[0.09] text-white/40 hover:text-white/70" : "border-black/[0.09] text-[#0e1420]/40 hover:text-[#0e1420]/70",
    aiBg:  isDark ? "bg-white/[0.05] border border-white/[0.07]" : "bg-[#f4f5f7] border border-black/[0.05]",
    uBg:   "bg-[rgba(201,165,90,0.12)] border border-[rgba(201,165,90,0.2)]",
  };

  /* ── Sélection scénario ── */
  if (!selected) return (
    <div className="space-y-4">
      <p className={`text-xs font-semibold ${sm.mut}`}>Choisissez un scénario :</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SIM_SCENARIOS.map((sc) => (
          <motion.button key={sc.key} onClick={() => { setSelected(sc.key); setBriefing(true); }}
            whileHover={{ scale: 1.015, y: -2 }} whileTap={{ scale: 0.99 }}
            className={`relative overflow-hidden rounded-2xl border p-4 text-left transition-all ${sm.card}`}
            style={{ borderColor: sc.color + "30" }}>
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${sc.color}70, transparent)` }} />
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-2xl">{sc.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className={`text-xs font-bold ${sm.pri}`}>{sc.label}</span>
                  <span className="rounded-full px-2 py-0.5 text-[0.5rem] font-black uppercase tracking-wider"
                    style={{ background: sc.color + "20", color: sc.color }}>{sc.difficulty}</span>
                </div>
                <p className={`text-[0.65rem] font-semibold mb-1`} style={{ color: sc.color }}>{sc.persona}</p>
                <p className={`text-[0.62rem] leading-relaxed ${sm.sec}`}>{sc.desc}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );

  /* ── Briefing ── */
  if (briefing && messages.length === 0 && !debrief) return (
    <div className="space-y-5">
      <button onClick={reset} className={`flex items-center gap-1.5 text-xs ${sm.mut} hover:text-[${GOLD}] transition`}>
        <ChevronLeft size={13} /> Changer de scénario
      </button>
      <div className={`rounded-2xl border p-5 ${sm.card}`}
        style={{ borderColor: (scenario?.color ?? GOLD) + "30" }}>
        <div className="mb-4 flex items-center gap-3">
          <span className="text-3xl">{scenario?.emoji}</span>
          <div>
            <p className={`text-sm font-extrabold ${sm.pri}`}>{scenario?.label}</p>
            <p className="text-[0.62rem] font-semibold" style={{ color: scenario?.color }}>{scenario?.persona}</p>
          </div>
        </div>
        <div className={`mb-3 rounded-xl border p-3 ${isDark ? "border-white/[0.06] bg-white/[0.03]" : "border-black/[0.06] bg-black/[0.02]"}`}>
          <p className={`mb-1 text-[0.58rem] font-bold uppercase tracking-wider ${sm.mut}`}>Votre rôle</p>
          <p className={`text-sm font-semibold ${sm.pri}`}>{scenario?.role}</p>
        </div>
        <p className={`text-xs leading-relaxed ${sm.sec}`}>{scenario?.desc}</p>
      </div>
      <div className={`rounded-xl border p-4 ${isDark ? "border-[rgba(201,165,90,0.15)] bg-[rgba(201,165,90,0.05)]" : "border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.04)]"}`}>
        <p className={`text-[0.62rem] font-bold uppercase tracking-wide mb-1.5`} style={{ color: GOLD }}>Conseils</p>
        <ul className={`space-y-1 text-xs ${sm.sec}`}>
          <li>→ Répondez naturellement comme dans une vraie situation</li>
          <li>→ L'IA reste en personnage — traitez-la comme une vraie personne</li>
          <li>→ À la fin, cliquez "Débrief IA" pour une analyse détaillée</li>
        </ul>
      </div>
      <button onClick={() => setBriefing(false)}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white"
        style={{ background: `linear-gradient(135deg, ${scenario?.color ?? GOLD}bb, ${scenario?.color ?? GOLD})` }}>
        <Play size={15} /> Démarrer la simulation
      </button>
    </div>
  );

  /* ── Interface de chat ── */
  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{scenario?.emoji}</span>
          <div>
            <p className={`text-xs font-bold ${sm.pri}`}>{scenario?.label}</p>
            <p className="text-[0.58rem]" style={{ color: scenario?.color }}>{scenario?.persona}</p>
          </div>
        </div>
        <button onClick={reset} className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[0.62rem] font-semibold transition ${sm.idle}`}>
          <RotateCcw size={10} /> Nouveau
        </button>
      </div>

      {/* Messages */}
      {!debrief ? (
        <>
          <div ref={scrollRef} className="max-h-[320px] min-h-[180px] overflow-y-auto space-y-2.5 pr-0.5">
            {messages.length === 0 && (
              <div className={`rounded-xl p-3 text-xs ${sm.sec} ${sm.aiBg}`}>
                <p className="font-semibold mb-0.5" style={{ color: scenario?.color }}>{scenario?.persona}</p>
                <p>Bonjour. Je vous écoute.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`rounded-xl p-3 text-xs leading-relaxed ${m.role === "assistant" ? sm.aiBg : sm.uBg}`}>
                {m.role === "assistant" && (
                  <p className="font-semibold mb-0.5 text-[0.6rem] uppercase tracking-wide" style={{ color: scenario?.color }}>{scenario?.persona}</p>
                )}
                <p className={m.role === "assistant" ? sm.sec : sm.pri}>{m.content}</p>
              </div>
            ))}
            {loading && (
              <div className={`flex items-center gap-2 rounded-xl p-3 ${sm.aiBg}`}>
                <Loader2 size={12} className="animate-spin" style={{ color: scenario?.color }} />
                <span className={`text-xs ${sm.mut}`}>En train de réfléchir…</span>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
              placeholder="Votre réponse…"
              className={`flex-1 rounded-xl border px-3 py-2.5 text-xs outline-none transition ${sm.input}`} />
            <button onClick={sendMessage} disabled={!input.trim() || loading}
              className="flex items-center gap-1 rounded-xl px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-40 transition"
              style={{ background: `linear-gradient(135deg, ${scenario?.color ?? GOLD}bb, ${scenario?.color ?? GOLD})` }}>
              <Send size={12} />
            </button>
          </div>

          {messages.length >= 4 && (
            <button onClick={requestDebrief} disabled={loading}
              className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition disabled:opacity-40 ${sm.idle}`}>
              <StopCircle size={12} /> Terminer et obtenir le débrief IA
            </button>
          )}
        </>
      ) : (
        /* ── Débrief ── */
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className={`rounded-2xl border p-5 ${sm.card}`}>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[rgba(201,165,90,0.15)]">
                <Award size={12} style={{ color: GOLD }} />
              </div>
              <span className={`text-[0.6rem] font-bold uppercase tracking-wider ${sm.mut}`}>Débrief du Coach IA</span>
            </div>
            <p className={`whitespace-pre-wrap text-xs leading-relaxed ${sm.sec}`}>{debrief}</p>
          </div>
          <button onClick={reset}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition ${sm.idle}`}>
            <RotateCcw size={13} /> Nouvelle simulation
          </button>
        </motion.div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPOSANT — ExercicesPanel (remplace JeuxPanel)
───────────────────────────────────────────────────────── */
function ExercicesPanel({ completed }: { completed: Set<string> }) {
  type ExMode = "quiz" | "flashcards" | "libre" | "cas" | "simulation";
  const { isDark }        = useTheme();
  const [exMode,          setExMode]         = useState<ExMode>("quiz");
  const [selectedModule,  setSelectedModule] = useState("1");

  const module       = COACHING_MODULES.find(m => m.id === selectedModule);
  const moduleProgress = module
    ? Math.round((module.chapters.filter(c => completed.has(c.id)).length / module.chapters.length) * 100)
    : 0;

  const ep = {
    pri:  isDark ? "text-white" : "text-[#0e1420]",
    sec:  isDark ? "text-white/50" : "text-[#0e1420]/55",
    mut:  isDark ? "text-white/30" : "text-[#0e1420]/35",
    card: isDark ? "border-white/[0.07] bg-white/[0.03]" : "border-black/[0.07] bg-white shadow-sm",
    mod:  isDark ? "border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04]" : "border-black/[0.07] hover:border-black/12 hover:bg-black/[0.02]",
  };

  const EX_MODES: { key: ExMode; label: string; icon: React.ElementType; desc: string }[] = [
    { key: "quiz",       label: "Quiz",          icon: HelpCircle, desc: "QCM par module" },
    { key: "flashcards", label: "Flashcards",    icon: BookMarked, desc: "Retenir les concepts" },
    { key: "libre",      label: "Réponse libre", icon: FileText,   desc: "Évaluée par l'IA" },
    { key: "cas",        label: "Cas pratique",  icon: Lightbulb,  desc: "Scénario réel" },
    { key: "simulation", label: "Jeu de rôle",   icon: Users2,     desc: "4 simulations pro" },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.1)]">
          <Gamepad2 size={15} style={{ color: GOLD }} />
        </div>
        <div>
          <h2 className={`text-base font-extrabold ${ep.pri}`}>S&apos;entraîner</h2>
          <p className={`text-xs ${ep.sec}`}>4 formats · 10 modules · Évaluation IA</p>
        </div>
      </div>

      {/* Sélecteur de format */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {EX_MODES.map(({ key, label, icon: Icon, desc }) => (
          <button key={key} onClick={() => setExMode(key)}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition-all ${
              exMode === key ? "border-[rgba(201,165,90,0.3)] bg-[rgba(201,165,90,0.08)]" : ep.mod
            }`}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
              exMode === key ? "bg-[rgba(201,165,90,0.2)]" : isDark ? "bg-white/[0.06]" : "bg-black/[0.04]"
            }`}>
              <Icon size={15}
                style={{ color: exMode === key ? GOLD : undefined }}
                className={exMode === key ? "" : isDark ? "text-white/40" : "text-[#0e1420]/40"} />
            </div>
            <span className={`text-[0.7rem] font-bold ${exMode === key ? "text-[#c9a55a]" : ep.sec}`}>{label}</span>
            <span className={`text-[0.55rem] leading-tight ${ep.mut}`}>{desc}</span>
          </button>
        ))}
      </div>

      {/* Sélecteur de module — masqué en mode simulation */}
      <div className={exMode === "simulation" ? "hidden" : ""}>
        <p className={`mb-2 text-[0.6rem] font-semibold uppercase tracking-wider ${ep.mut}`}>Module</p>
        <div className="flex flex-wrap gap-1.5">
          {COACHING_MODULES.map((m) => {
            const pct = Math.round((m.chapters.filter(c => completed.has(c.id)).length / m.chapters.length) * 100);
            return (
              <button key={m.id} onClick={() => setSelectedModule(m.id)}
                className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                  selectedModule === m.id
                    ? "border-[rgba(201,165,90,0.3)] bg-[rgba(201,165,90,0.08)] text-[#c9a55a]"
                    : `${ep.mod} ${ep.sec}`
                }`}>
                {m.id}
                {pct === 100 && <CheckCircle2 size={9} className="text-[#34d399]" />}
              </button>
            );
          })}
        </div>
        {module && (
          <p className={`mt-1.5 text-[0.62rem] ${ep.mut}`}>{module.title} · {moduleProgress}% complété</p>
        )}
      </div>

      {/* Zone d'exercice */}
      <div className={`rounded-2xl border p-5 ${ep.card}`}>
        {exMode === "quiz"       && <InlineModuleQuiz key={selectedModule} moduleId={selectedModule} onComplete={() => {}} />}
        {exMode === "flashcards" && <FlashcardDeck    key={selectedModule} moduleId={selectedModule} />}
        {exMode === "libre"      && <LibreMode        key={selectedModule} moduleId={selectedModule} />}
        {exMode === "cas"        && <CasPratiqueMode  key={selectedModule} moduleId={selectedModule} />}
        {exMode === "simulation" && <SimulationMode />}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPOSANT — Progression
───────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────
   COMPOSANT — Compétences & Objectifs (Phase 9)
───────────────────────────────────────────────────────── */
function CompetencesObjectifs({ completed }: { completed: Set<string> }) {
  const { isDark } = useTheme();
  const [showModules,  setShowModules]  = useState(false);
  const [dailyGoal,    setDailyGoalSt]  = useState(() => loadDailyGoal());
  const [dailyDone,    setDailyDone]    = useState(() => loadDailyStats().count);

  function changeGoal(n: number) {
    setDailyGoalSt(n);
    saveDailyGoal(n);
  }

  const co = {
    card:  isDark ? "border-white/[0.07] bg-white/[0.03]" : "border-black/[0.07] bg-white shadow-sm",
    gold:  "border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.06)]",
    pri:   isDark ? "text-white"    : "text-[#0e1420]",
    sec:   isDark ? "text-white/50" : "text-[#0e1420]/55",
    mut:   isDark ? "text-white/30" : "text-[#0e1420]/35",
    bar:   isDark ? "bg-white/[0.07]" : "bg-black/[0.07]",
    lbl:   `text-[0.62rem] font-bold uppercase tracking-widest ${isDark ? "text-white/25" : "text-[#0e1420]/30"}`,
    idle:  isDark ? "border-white/[0.07] text-white/40 hover:text-white/70" : "border-black/[0.07] text-[#0e1420]/40 hover:text-[#0e1420]/70",
  };

  // Calcul des domaines de compétences
  const domainStats = SKILL_DOMAINS.map((domain) => {
    const ids      = domain.moduleIds as readonly string[];
    const modules  = COACHING_MODULES.filter((m) => ids.includes(m.id));
    const total    = modules.reduce((a, m) => a + m.chapters.length, 0);
    const done     = modules.reduce((a, m) => a + m.chapters.filter((c) => completed.has(c.id)).length, 0);
    const pct      = total > 0 ? Math.round((done / total) * 100) : 0;
    const level    = getSkillLevel(pct);
    return { domain, total, done, pct, level };
  });

  const todayPct = Math.min(100, Math.round((dailyDone / dailyGoal) * 100));
  const weekPct  = Math.min(100, Math.round((dailyDone / (dailyGoal * 5)) * 100));

  return (
    <div className="space-y-5">
      <p className={co.lbl}>Compétences & Objectifs</p>

      {/* Carte compétences transversales */}
      <div className={`rounded-2xl border p-5 ${co.card}`}>
        <p className={`mb-4 text-xs font-bold ${co.pri}`}>Compétences transversales</p>
        <div className="space-y-3">
          {domainStats.map(({ domain, pct, level, done, total }) => {
            const Icon = domain.icon;
            return (
              <div key={domain.id}>
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: domain.color + "18", border: `1px solid ${domain.color}28` }}>
                      <Icon size={11} style={{ color: domain.color }} />
                    </div>
                    <span className={`text-xs font-semibold ${co.pri}`}>{domain.label}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-full px-2 py-0.5 text-[0.5rem] font-black uppercase tracking-wide"
                      style={{ background: level.color + "20", color: level.color }}>{level.label}</span>
                    <span className={`text-xs font-bold tabular-nums`} style={{ color: level.color }}>{pct}%</span>
                  </div>
                </div>
                <div className={`relative h-2 overflow-hidden rounded-full ${co.bar}`}>
                  <motion.div className="absolute inset-y-0 left-0 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    style={{ background: `linear-gradient(90deg, ${domain.color}88, ${domain.color})` }} />
                </div>
                <p className={`mt-0.5 text-[0.55rem] ${co.mut}`}>
                  {domain.moduleIds.map((id) => `M${id}`).join(", ")} · {done}/{total} ch.
                </p>
              </div>
            );
          })}
        </div>

        {/* Toggle détail par module */}
        <button onClick={() => setShowModules((s) => !s)}
          className={`mt-4 flex items-center gap-1.5 text-[0.62rem] font-semibold transition ${co.sec} hover:text-[${GOLD}]`}>
          <ChevronDown size={11} className={`transition-transform ${showModules ? "rotate-180" : ""}`} />
          {showModules ? "Masquer" : "Voir le détail par module"}
        </button>
        {showModules && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 space-y-2">
            {COACHING_MODULES.map((m) => {
              const done = m.chapters.filter((c) => completed.has(c.id)).length;
              const pct  = Math.round((done / m.chapters.length) * 100);
              return (
                <div key={m.id} className="flex items-center gap-3">
                  <span className={`w-5 text-center text-[0.55rem] font-black ${co.mut}`}>{m.id}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`h-1 overflow-hidden rounded-full ${co.bar}`}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: m.color }} />
                    </div>
                  </div>
                  <span className={`w-8 text-right text-[0.55rem] font-bold tabular-nums ${co.sec}`}>{pct}%</span>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Objectifs quotidiens */}
      <div className={`rounded-2xl border p-5 ${co.card}`}>
        <div className="mb-4 flex items-center justify-between">
          <p className={`text-xs font-bold ${co.pri}`}>Objectif du jour</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((n) => (
              <button key={n} onClick={() => changeGoal(n)}
                className={`rounded-lg border px-2.5 py-1 text-[0.62rem] font-bold transition-all ${
                  dailyGoal === n
                    ? "border-[rgba(201,165,90,0.3)] bg-[rgba(201,165,90,0.1)] text-[#c9a55a]"
                    : co.idle
                }`}>
                {n} {n === 1 ? "ch." : "ch."}
              </button>
            ))}
          </div>
        </div>

        {/* Barre aujourd'hui */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={`text-[0.62rem] ${co.mut}`}>Aujourd&apos;hui</span>
            <span className={`text-[0.62rem] font-semibold ${dailyDone >= dailyGoal ? "text-[#34d399]" : co.sec}`}>
              {dailyDone} / {dailyGoal} chapitres
              {dailyDone >= dailyGoal && " ✓"}
            </span>
          </div>
          <div className={`h-2.5 overflow-hidden rounded-full ${co.bar}`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${todayPct}%` }}
              transition={{ duration: 0.6 }}
              className="h-full rounded-full"
              style={{ background: dailyDone >= dailyGoal ? "#34d399" : `linear-gradient(90deg, ${GOLD}88, ${GOLD})` }} />
          </div>
        </div>

        {/* Rythme hebdo estimé */}
        <div className={`mt-4 flex items-center justify-between rounded-xl border p-3 ${isDark ? "border-white/[0.05] bg-white/[0.02]" : "border-black/[0.05] bg-black/[0.01]"}`}>
          <div>
            <p className={`text-[0.6rem] font-bold uppercase tracking-wider ${co.mut}`}>Rythme sur 5 jours</p>
            <p className={`mt-0.5 text-xs font-semibold ${co.pri}`}>{dailyGoal * 5} chapitres / semaine</p>
          </div>
          <div className="text-right">
            <p className={`text-[0.6rem] ${co.mut}`}>Programme en</p>
            <p className="text-xs font-bold" style={{ color: GOLD }}>
              {completed.size === 0
                ? `~${Math.ceil(COACHING_MODULES.reduce((a, m) => a + m.chapters.length, 0) / (dailyGoal * 5))} sem.`
                : `~${Math.ceil((COACHING_MODULES.reduce((a, m) => a + m.chapters.length, 0) - completed.size) / (dailyGoal * 5))} sem. restantes`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   HELPERS — Calcul du parcours adaptatif
───────────────────────────────────────────────────────── */
function computeParcours(completed: Set<string>) {
  const stats = COACHING_MODULES.map((m) => {
    const done     = m.chapters.filter((c) => completed.has(c.id)).length;
    const pct      = m.chapters.length > 0 ? Math.round((done / m.chapters.length) * 100) : 0;
    const firstTodo = m.chapters.find((c) => !completed.has(c.id)) ?? null;
    return { module: m, done, pct, firstTodo };
  });

  // Modules en cours (au moins 1 fait, pas 100%)
  const inProgress = stats.filter((s) => s.done > 0 && s.pct < 100).sort((a, b) => a.pct - b.pct);
  // Modules non commencés
  const notStarted = stats.filter((s) => s.done === 0).slice(0, 2);
  // Modules les plus faibles (tri par % croissant, pas 100%)
  const weak       = stats.filter((s) => s.pct < 100).sort((a, b) => a.pct - b.pct).slice(0, 3);

  // Plan du jour : 3 chapitres recommandés
  const plan: { chapter: { id: string; title: string; type: string }; moduleTitle: string; moduleColor: string; reason: string }[] = [];

  // 1. Prochain chapitre du module en cours le plus avancé (momentum)
  const momentum = inProgress.length > 0 ? inProgress[inProgress.length - 1] : null;
  if (momentum?.firstTodo) {
    plan.push({ chapter: momentum.firstTodo, moduleTitle: momentum.module.title, moduleColor: momentum.module.color, reason: "Continuer l'élan" });
  }

  // 2. Premier chapitre du module le plus faible non commencé
  if (notStarted.length > 0 && plan.length < 3) {
    const ns = notStarted[0];
    const ch = ns.firstTodo;
    if (ch) plan.push({ chapter: ch, moduleTitle: ns.module.title, moduleColor: ns.module.color, reason: "Nouveau module" });
  }

  // 3. Premier chapitre incomplet du module le plus faible en cours
  if (inProgress.length > 1 && plan.length < 3) {
    const wk = inProgress[0];
    const ch = wk.firstTodo;
    if (ch && !plan.find((p) => p.chapter.id === ch.id)) {
      plan.push({ chapter: ch, moduleTitle: wk.module.title, moduleColor: wk.module.color, reason: "Renforcer les bases" });
    }
  }

  return { stats, weak, plan, inProgress, notStarted };
}

/* ─────────────────────────────────────────────────────────
   COMPOSANT — Parcours personnalisé (inséré dans ProgressionPanel)
───────────────────────────────────────────────────────── */
function ParcoursPersonnalise({
  completed, onSelectChapter, onSetView,
}: {
  completed:       Set<string>;
  onSelectChapter: (id: string) => void;
  onSetView:       (v: View) => void;
}) {
  const { isDark } = useTheme();
  const { plan, weak, inProgress, stats } = computeParcours(completed);
  const [aiPlan,   setAiPlan]   = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  const totalDone = completed.size;
  const total     = COACHING_MODULES.reduce((a, m) => a + m.chapters.length, 0);

  async function generateAiPlan() {
    if (loading) return;
    setLoading(true);
    const progressSummary = stats.map((s) =>
      `Module ${s.module.id} (${s.module.title}) : ${s.pct}% (${s.done}/${s.module.chapters.length} chapitres)`
    ).join("\n");
    const prompt = `Voici ma progression dans le Coaching IA DJAMA :\n\n${progressSummary}\n\nTotal : ${totalDone}/${total} chapitres complétés.\n\nGénère-moi un plan de travail personnalisé et motivant pour les 7 prochains jours. Inclus : objectifs journaliers réalistes (20-30 min/jour), l'ordre des modules à prioriser avec justification, des conseils spécifiques à mon niveau actuel. Sois concret et actionnable.`;
    try {
      const res  = await fetch("/api/coaching-ia/assistant", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          mode:    "direct",
        }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      setAiPlan(data.reply ?? null);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  const pp = {
    card: isDark ? "border-white/[0.07] bg-white/[0.03]" : "border-black/[0.07] bg-white shadow-sm",
    pri:  isDark ? "text-white" : "text-[#0e1420]",
    sec:  isDark ? "text-white/50" : "text-[#0e1420]/55",
    mut:  isDark ? "text-white/30" : "text-[#0e1420]/35",
    bar:  isDark ? "bg-white/[0.07]" : "bg-black/[0.07]",
    lbl:  `text-[0.62rem] font-bold uppercase tracking-widest ${isDark ? "text-white/25" : "text-[#0e1420]/30"}`,
    idle: isDark ? "border-white/[0.09] text-white/40 hover:text-white/70" : "border-black/[0.09] text-[#0e1420]/40 hover:text-[#0e1420]/70",
  };

  if (totalDone === 0) return (
    <div className={`rounded-2xl border p-5 ${pp.card}`}>
      <p className={pp.lbl}>Parcours personnalisé</p>
      <p className={`mt-3 text-sm ${pp.sec}`}>Commencez votre premier chapitre pour activer les recommandations adaptatives.</p>
      <button onClick={() => onSetView("chapter")}
        className="mt-3 flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
        style={{ background: `linear-gradient(135deg, ${GOLD}bb, ${GOLD})` }}>
        <Play size={13} /> Démarrer le programme
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      <p className={pp.lbl}>Parcours personnalisé</p>

      {/* Plan du jour */}
      {plan.length > 0 && (
        <div className={`rounded-2xl border p-5 ${pp.card}`}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[rgba(201,165,90,0.12)] border border-[rgba(201,165,90,0.2)]">
                <Target size={13} style={{ color: GOLD }} />
              </div>
              <p className={`text-sm font-bold ${pp.pri}`}>Plan du jour</p>
            </div>
            <span className={`text-[0.58rem] font-semibold ${pp.mut}`}>{plan.length} chapitres · ~{plan.length * 12} min</span>
          </div>
          <div className="space-y-2">
            {plan.map((item, i) => (
              <motion.button key={item.chapter.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                onClick={() => { onSelectChapter(item.chapter.id); onSetView("chapter"); }}
                className={`group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${pp.card} hover:border-[rgba(201,165,90,0.25)]`}>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[0.58rem] font-black text-white"
                  style={{ background: `linear-gradient(135deg, ${item.moduleColor}bb, ${item.moduleColor})` }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${pp.pri}`}>{item.chapter.title}</p>
                  <p className={`text-[0.58rem] ${pp.mut}`}>{item.moduleTitle}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="rounded-full px-2 py-0.5 text-[0.5rem] font-bold uppercase tracking-wider"
                    style={{ background: item.moduleColor + "18", color: item.moduleColor }}>{item.reason}</span>
                  <ChevronRight size={12} className={`transition-transform group-hover:translate-x-0.5 ${pp.mut}`} />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Modules à renforcer */}
      {weak.length > 0 && (
        <div className={`rounded-2xl border p-5 ${pp.card}`}>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)]">
              <Target size={13} className="text-red-400" />
            </div>
            <p className={`text-sm font-bold ${pp.pri}`}>Modules à renforcer</p>
          </div>
          <div className="space-y-3">
            {weak.map((s) => (
              <div key={s.module.id}>
                <div className="mb-1 flex items-center justify-between">
                  <p className={`text-xs font-semibold ${pp.pri}`}>{s.module.id}. {s.module.title}</p>
                  <span className={`text-xs font-bold`} style={{ color: s.pct < 30 ? "#ef4444" : s.pct < 60 ? "#f59e0b" : s.module.color }}>
                    {s.pct}%
                  </span>
                </div>
                <div className={`h-1.5 overflow-hidden rounded-full ${pp.bar}`}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${s.pct}%`, background: s.pct < 30 ? "#ef4444" : s.pct < 60 ? "#f59e0b" : s.module.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan IA personnalisé */}
      {!aiPlan ? (
        <button onClick={generateAiPlan} disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.06)] py-3 text-sm font-semibold text-[#c9a55a] transition hover:border-[rgba(201,165,90,0.4)] disabled:opacity-50">
          {loading ? <><Loader2 size={14} className="animate-spin" /> Génération…</> : <><Sparkles size={14} /> Générer mon plan IA sur 7 jours</>}
        </button>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border p-5 ${pp.card}`}>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[rgba(201,165,90,0.15)]">
                <Sparkles size={11} style={{ color: GOLD }} />
              </div>
              <span className={`text-[0.6rem] font-bold uppercase tracking-wider ${pp.mut}`}>Plan IA personnalisé — 7 jours</span>
            </div>
            <button onClick={() => setAiPlan(null)} className={`text-[0.6rem] ${pp.mut} hover:text-[${GOLD}] transition`}>
              <RotateCcw size={11} />
            </button>
          </div>
          <p className={`whitespace-pre-wrap text-xs leading-relaxed ${pp.sec}`}>{aiPlan}</p>
        </motion.div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   CERTIFICAT DJAMA (Phase 11)
   Rendu visuel CSS + export PNG via Canvas API
───────────────────────────────────────────────────────── */
function CertificatDJAMA({
  userName, completedCount, totalChapters, xp, doneModules, overallPct,
}: {
  userName:       string;
  completedCount: number;
  totalChapters:  number;
  xp:             number;
  doneModules:    number;
  overallPct:     number;
}) {
  const dateStr  = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const isFull   = overallPct === 100;
  const certName = userName || "Apprenant DJAMA";

  function downloadPNG() {
    const W = 800, H = 560;
    const canvas = document.createElement("canvas");
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fond
    ctx.fillStyle = "#07080e";
    ctx.fillRect(0, 0, W, H);

    // Gradient overlay
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "rgba(201,165,90,0.06)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Bordures
    ctx.strokeStyle = "#c9a55a";
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, W - 36, H - 36);
    ctx.strokeStyle = "rgba(201,165,90,0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(26, 26, W - 52, H - 52);

    // Coins décoratifs
    const corner = (x: number, y: number, sx: number, sy: number) => {
      ctx.strokeStyle = "rgba(201,165,90,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + sx * 22, y); ctx.lineTo(x, y); ctx.lineTo(x, y + sy * 22);
      ctx.stroke();
    };
    corner(33, 33, 1, 1); corner(W - 33, 33, -1, 1);
    corner(33, H - 33, 1, -1); corner(W - 33, H - 33, -1, -1);

    // DJAMA
    ctx.fillStyle = "#c9a55a";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    ctx.fillText("D J A M A", W / 2, 72);

    // Séparateur
    ctx.strokeStyle = "rgba(201,165,90,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W / 2 - 60, 82); ctx.lineTo(W / 2 + 60, 82); ctx.stroke();

    // Titre
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 30px Georgia, serif";
    ctx.fillText(isFull ? "Certificat de Formation" : "Attestation de Progression", W / 2, 125);

    // Sous-titre
    ctx.fillStyle = "#c9a55a";
    ctx.font = "15px Arial";
    ctx.fillText("Coaching IA DJAMA", W / 2, 156);

    // "certifie que"
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "13px Arial";
    ctx.fillText("certifie que", W / 2, 200);

    // Nom
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 34px Georgia, serif";
    ctx.fillText(certName, W / 2, 246);

    // Trait sous le nom
    const nw = ctx.measureText(certName).width;
    ctx.strokeStyle = "rgba(201,165,90,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W / 2 - nw / 2, 256); ctx.lineTo(W / 2 + nw / 2, 256); ctx.stroke();

    // Corps
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "13px Arial";
    if (isFull) {
      ctx.fillText("a complété avec succès les 10 modules du programme Coaching IA DJAMA,", W / 2, 292);
      ctx.fillText(`soit ${completedCount} chapitres pour un total de ${xp} XP.`, W / 2, 312);
    } else {
      ctx.fillText(`a complété ${doneModules} module${doneModules > 1 ? "s" : ""} sur 10 du programme Coaching IA DJAMA,`, W / 2, 292);
      ctx.fillText(`soit ${completedCount} chapitres (${overallPct}%) pour un total de ${xp} XP.`, W / 2, 312);
    }

    // Date
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "12px Arial";
    ctx.fillText(`Délivré le ${dateStr}`, W / 2, 356);

    // Stats
    ctx.fillStyle = "#c9a55a";
    ctx.font = "bold 10px Arial";
    ctx.fillText(`${doneModules}/10 MODULES  ·  ${completedCount}/${totalChapters} CHAPITRES  ·  ${xp} XP`, W / 2, 398);

    // Disclaimer
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.font = "9px Arial";
    ctx.fillText("Certificat de formation interne DJAMA — non accrédité par un organisme officiel de certification", W / 2, 440);

    // Déclenchement téléchargement
    const link    = document.createElement("a");
    link.download = isFull ? "certificat-djama-coaching-ia.png" : "attestation-djama-progression.png";
    link.href     = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-[rgba(201,165,90,0.3)]"
      style={{ background: "linear-gradient(135deg, rgba(201,165,90,0.04), rgba(0,0,0,0))" }}>

      {/* Preview visuel */}
      <div className="relative p-8 text-center" style={{ background: "linear-gradient(135deg, #07080e, #0c0d13)" }}>
        {/* Cadre décoratif */}
        <div className="pointer-events-none absolute inset-4 rounded-xl border border-[rgba(201,165,90,0.18)]" />
        <div className="pointer-events-none absolute inset-6 rounded-xl border border-[rgba(201,165,90,0.08)]" />
        {/* Coins */}
        {[["top-7 left-7", "border-t-2 border-l-2 rounded-tl"], ["top-7 right-7", "border-t-2 border-r-2 rounded-tr"], ["bottom-7 left-7", "border-b-2 border-l-2 rounded-bl"], ["bottom-7 right-7", "border-b-2 border-r-2 rounded-br"]].map(([pos, border]) => (
          <div key={pos} className={`absolute ${pos} h-5 w-5 border-[rgba(201,165,90,0.55)] ${border}`} />
        ))}

        <p className="mb-4 text-[0.5rem] font-black uppercase tracking-[0.4em] text-[#c9a55a]">D&nbsp;J&nbsp;A&nbsp;M&nbsp;A</p>

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(201,165,90,0.4)] bg-[rgba(201,165,90,0.1)]">
          <Award size={28} className="text-[#c9a55a]" />
        </div>

        <h3 className="text-xl font-black text-white">
          {isFull ? "Certificat de Formation" : "Attestation de Progression"}
        </h3>
        <p className="mt-0.5 text-xs font-semibold text-[#c9a55a]">Coaching IA DJAMA</p>

        <p className="mt-5 text-[0.65rem] text-white/35">certifie que</p>
        <p className="mt-1 text-xl font-black text-white">{certName}</p>
        <div className="mx-auto my-3 h-px w-40" style={{ background: "linear-gradient(90deg, transparent, rgba(201,165,90,0.5), transparent)" }} />

        <p className="text-xs text-white/50 leading-relaxed">
          {isFull
            ? <>a complété avec succès les 10 modules du programme,<br />{completedCount} chapitres · {xp} XP</>
            : <>{doneModules} module{doneModules > 1 ? "s" : ""} complété{doneModules > 1 ? "s" : ""} sur 10 · {completedCount} chapitres ({overallPct}%) · {xp} XP</>
          }
        </p>

        <p className="mt-4 text-[0.6rem] text-white/25">Délivré le {dateStr}</p>

        {!isFull && (
          <div className="mt-4">
            <div className="mx-auto mb-1 h-1 w-48 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#c9a55a]" style={{ width: `${overallPct}%` }} />
            </div>
            <p className="text-[0.55rem] text-white/20">{overallPct}% du programme complété</p>
          </div>
        )}

        <p className="mt-5 text-[0.5rem] text-white/15">
          Certificat de formation interne DJAMA — non accrédité par un organisme officiel de certification
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-[rgba(201,165,90,0.15)] px-5 py-4">
        <div>
          <p className="text-xs font-bold text-white">{isFull ? "Formation complète" : `${doneModules}/10 modules terminés`}</p>
          <p className="text-[0.58rem] text-white/30">{xp} XP · {completedCount}/{totalChapters} chapitres</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          onClick={downloadPNG}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-black"
          style={{ background: "linear-gradient(135deg, #c9a55a, #a07840)" }}
        >
          <Download size={11} /> Télécharger PNG
        </motion.button>
      </div>
    </motion.div>
  );
}

function ProgressionPanel({ completed, onSelectChapter, onSetView, userName }: { completed: Set<string>; onSelectChapter: (id: string) => void; onSetView: (v: View) => void; userName?: string }) {
  const { isDark } = useTheme();
  const totalChapters  = COACHING_MODULES.reduce((a, m) => a + m.chapters.length, 0);
  const completedCount = completed.size;
  const overallPct     = Math.round((completedCount / totalChapters) * 100);
  const doneModules    = COACHING_MODULES.filter((m) => m.chapters.every((c) => completed.has(c.id))).length;
  const xp             = completedCount * XP_PER_CHAPTER;
  const levelInfo      = getLevel(xp);
  const { streak }     = loadStreak();
  const quizDone       = COACHING_MODULES.flatMap((m) => m.chapters).filter((c) => c.type === "quiz" && completed.has(c.id)).length;
  const bState         = { completedCount, streak, overallPct, doneModules, quizDone };

  const dp = {
    pri:  isDark ? "text-white"          : "text-[#0e1420]",
    sec:  isDark ? "text-white/50"       : "text-[#0e1420]/55",
    mut:  isDark ? "text-white/30"       : "text-[#0e1420]/35",
    faint:isDark ? "text-white/20"       : "text-[#0e1420]/25",
    card: isDark ? "border-white/[0.07] bg-white/[0.03]" : "border-black/[0.07] bg-white shadow-sm",
    bar:  isDark ? "bg-white/[0.07]"    : "bg-black/[0.07]",
    lbl:  `text-[0.62rem] font-bold uppercase tracking-widest ${isDark ? "text-white/25" : "text-[#0e1420]/30"}`,
  };

  const LEVEL_ICONS: Record<string, React.ElementType> = {
    "Novice":    Circle,
    "Apprenti":  BookOpen,
    "Praticien": Zap,
    "Expert IA": Brain,
    "Maître IA": Award,
  };
  const LevelIcon = LEVEL_ICONS[levelInfo.name] ?? Circle;

  const BADGES = ALL_BADGES.map((b) => ({
    ...b,
    desc:   b.id === "week" ? `Série : ${streak}j` : b.desc,
    earned: checkBadgeEarned(b.id, bState),
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-8 sm:px-8">
      {/* En-tête */}
      <div>
        <p className={dp.lbl}>Progression</p>
        <h2 className={`mt-2 text-2xl font-black ${dp.pri}`}>{overallPct}% complété</h2>
        <p className={`mt-1 text-sm ${dp.sec}`}>{completedCount} chapitres sur {totalChapters}</p>
      </div>

      {/* Parcours personnalisé (Phase 7) */}
      <ParcoursPersonnalise
        completed={completed}
        onSelectChapter={onSelectChapter}
        onSetView={onSetView}
      />

      {/* Niveau + XP */}
      <div className={`rounded-2xl border p-5 ${dp.card}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: `${levelInfo.color}18`, border: `1px solid ${levelInfo.color}30` }}>
              <LevelIcon size={18} style={{ color: levelInfo.color }} />
            </div>
            <div>
              <p className={`text-sm font-extrabold ${dp.pri}`}>{levelInfo.name}</p>
              <p className={`text-[0.6rem] ${dp.mut}`}>{xp} XP total</p>
            </div>
          </div>
          {levelInfo.nextName && (
            <div className="text-right">
              <p className={`text-[0.58rem] ${dp.mut}`}>Prochain niveau</p>
              <p className="text-xs font-bold" style={{ color: levelInfo.color }}>
                {levelInfo.xpNext} XP → {levelInfo.nextName}
              </p>
            </div>
          )}
        </div>
        <div className={`h-1.5 overflow-hidden rounded-full ${dp.bar}`}>
          <motion.div className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${levelInfo.pct}%` }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{ background: `linear-gradient(90deg, ${levelInfo.color}aa, ${levelInfo.color})` }} />
        </div>
        <p className={`mt-1.5 text-[0.58rem] ${dp.faint}`}>{levelInfo.pct}% vers {levelInfo.nextName ?? "niveau maximum"}</p>
      </div>

      {/* Badges */}
      <div>
        <p className={`mb-4 ${dp.lbl}`}>Badges</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {BADGES.map(({ id, label, Icon, color, desc, earned }) => (
            <div key={id}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all ${dp.card} ${!earned ? "opacity-40 grayscale" : ""}`}
              style={earned ? { borderColor: `${color}30`, background: `${color}07` } : {}}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <p className={`text-xs font-bold ${dp.pri}`}>{label}</p>
              <p className={`text-[0.58rem] ${dp.mut}`}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Compétences & Objectifs (Phase 9) */}
      <CompetencesObjectifs completed={completed} />

      {/* Certificat DJAMA (Phase 11) — visible dès 1 module complété */}
      {doneModules >= 1 && (
        <div>
          <p className={`mb-4 ${dp.lbl}`}>Certificat</p>
          <CertificatDJAMA
            userName={userName ?? ""}
            completedCount={completedCount}
            totalChapters={totalChapters}
            xp={xp}
            doneModules={doneModules}
            overallPct={overallPct}
          />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPOSANT — Dashboard
───────────────────────────────────────────────────────── */
function DashboardPanel({
  completed, favorites, onSelectChapter, onSetView, userName,
}: {
  completed:       Set<string>;
  favorites:       Set<string>;
  onSelectChapter: (moduleId: string, chapterId: string) => void;
  onSetView:       (v: View) => void;
  userName?:       string;
}) {
  const { isDark } = useTheme();
  const totalChapters  = COACHING_MODULES.reduce((a, m) => a + m.chapters.length, 0);
  const completedCount = completed.size;
  const overallPct     = Math.round((completedCount / totalChapters) * 100);
  const totalModules   = COACHING_MODULES.length;
  const doneModules    = COACHING_MODULES.filter((m) => m.chapters.every((c) => completed.has(c.id))).length;
  const xp             = completedCount * XP_PER_CHAPTER;
  const levelInfo      = getLevel(xp);
  const { streak }     = loadStreak();

  /* Prochain chapitre non terminé */
  let nextModule:  Module  | null = null;
  let nextChapter: Chapter | null = null;
  for (const m of COACHING_MODULES) {
    for (const ch of m.chapters) {
      if (!completed.has(ch.id)) { nextModule = m; nextChapter = ch; break; }
    }
    if (nextChapter) break;
  }

  /* Progression du module en cours */
  const modulePct = nextModule
    ? Math.round((nextModule.chapters.filter((c) => completed.has(c.id)).length / nextModule.chapters.length) * 100)
    : 0;

  /* Recommandations (prochains chapitres non terminés après nextChapter) */
  const upcoming: { m: Module; ch: Chapter }[] = [];
  let afterNext = false;
  for (const m of COACHING_MODULES) {
    for (const ch of m.chapters) {
      if (ch.id === nextChapter?.id) { afterNext = true; continue; }
      if (afterNext && !completed.has(ch.id) && upcoming.length < 3) upcoming.push({ m, ch });
    }
  }

  const firstName = userName?.split(" ")[0] ?? "vous";

  const dp = {
    pri:  isDark ? "text-white"          : "text-[#0e1420]",
    sec:  isDark ? "text-white/50"       : "text-[#0e1420]/55",
    mut:  isDark ? "text-white/30"       : "text-[#0e1420]/35",
    faint:isDark ? "text-white/20"       : "text-[#0e1420]/25",
    card: isDark ? "border-white/[0.07] bg-white/[0.03]" : "border-black/[0.07] bg-white shadow-sm",
    bar:  isDark ? "bg-white/[0.07]"    : "bg-black/[0.07]",
    lbl:  `text-[0.62rem] font-bold uppercase tracking-widest ${isDark ? "text-white/25" : "text-[#0e1420]/30"}`,
  };

  const LEVEL_ICONS: Record<string, React.ElementType> = {
    "Novice":    Circle,
    "Apprenti":  BookOpen,
    "Praticien": Zap,
    "Expert IA": Brain,
    "Maître IA": Award,
  };
  const LevelIcon = LEVEL_ICONS[levelInfo.name] ?? Circle;

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-8 sm:px-8">

      {/* ── En-tête ── */}
      <div>
        <p className={dp.lbl}>Centre de formation DJAMA</p>
        <h1 className={`mt-2 text-3xl font-black leading-tight ${dp.pri}`}>
          Bonjour, {firstName}
        </h1>
        <p className={`mt-1.5 text-sm ${dp.sec}`}>
          {completedCount === 0
            ? "Commencez votre parcours de formation."
            : `Continuez votre progression · ${overallPct}% complété`}
        </p>
      </div>

      {/* ── Continuer ── */}
      {nextChapter && nextModule && (
        <div>
          <p className={`mb-3 ${dp.lbl}`}>Continuer</p>
          <motion.button
            whileHover={{ y: -2 }}
            onClick={() => { onSelectChapter(nextModule!.id, nextChapter!.id); onSetView("chapter"); }}
            className={`group w-full text-left rounded-2xl border p-6 transition-all hover:border-[rgba(201,165,90,0.3)] ${dp.card}`}
          >
            <div className="flex items-start gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: `rgba(${nextModule.rgb},0.12)`, border: `1px solid rgba(${nextModule.rgb},0.2)` }}>
                <Play size={22} fill={`rgb(${nextModule.rgb})`} style={{ color: `rgb(${nextModule.rgb})`, marginLeft: 2 }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[0.6rem] font-bold uppercase tracking-widest mb-1"
                  style={{ color: `rgb(${nextModule.rgb})` }}>{nextModule.title}</p>
                <p className={`text-base font-bold truncate ${dp.pri}`}>{nextChapter.title}</p>
                <div className={`mt-1 flex items-center gap-3 text-[0.65rem] ${dp.mut}`}>
                  <span className="flex items-center gap-1"><Clock size={10} /> {nextChapter.duration}</span>
                  <span>·</span>
                  <span>{nextChapter.type === "quiz" ? "Quiz" : nextChapter.type === "exercise" ? "Exercice" : "Cours"}</span>
                </div>
                <div className="mt-3">
                  <div className={`h-1 rounded-full overflow-hidden ${dp.bar}`}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${modulePct}%`, background: `rgb(${nextModule.rgb})` }} />
                  </div>
                  <p className={`mt-1 text-[0.58rem] ${dp.faint}`}>{modulePct}% du module terminé</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition ml-2"
                style={{ background: "rgba(201,165,90,0.1)", border: "1px solid rgba(201,165,90,0.25)", color: GOLD }}>
                Continuer <ArrowRight size={14} />
              </div>
            </div>
          </motion.button>
        </div>
      )}

      {/* ── Votre progression ── */}
      <div>
        <p className={`mb-4 ${dp.lbl}`}>Votre progression</p>
        {/* Niveau XP */}
        <div className={`rounded-2xl border p-5 mb-3 ${dp.card}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: `${levelInfo.color}18`, border: `1px solid ${levelInfo.color}30` }}>
                <LevelIcon size={18} style={{ color: levelInfo.color }} />
              </div>
              <div>
                <p className={`text-sm font-extrabold ${dp.pri}`}>{levelInfo.name}</p>
                <p className={`text-[0.6rem] ${dp.mut}`}>{xp} XP total</p>
              </div>
            </div>
            {levelInfo.nextName && (
              <div className="text-right">
                <p className={`text-[0.58rem] ${dp.mut}`}>Prochain niveau</p>
                <p className="text-xs font-bold" style={{ color: levelInfo.color }}>
                  {levelInfo.xpNext} XP → {levelInfo.nextName}
                </p>
              </div>
            )}
          </div>
          <div className={`h-1.5 overflow-hidden rounded-full ${dp.bar}`}>
            <motion.div className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${levelInfo.pct}%` }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              style={{ background: `linear-gradient(90deg, ${levelInfo.color}aa, ${levelInfo.color})` }} />
          </div>
          <p className={`mt-1.5 text-[0.58rem] ${dp.faint}`}>{levelInfo.pct}% vers {levelInfo.nextName ?? "niveau maximum"}</p>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {([
            { label: "Modules terminés",  value: `${doneModules}/${totalModules}`, Icon: Award,      color: "#34d399" },
            { label: "Chapitres validés", value: `${completedCount}/${totalChapters}`, Icon: CheckCircle2, color: "#60a5fa" },
            { label: "Série actuelle",    value: `${streak}j`,                     Icon: Timer,      color: "#f59e0b" },
            { label: "Progression",       value: `${overallPct}%`,                 Icon: TrendingUp, color: GOLD },
          ] as { label: string; value: string; Icon: React.ElementType; color: string }[]).map(({ label, value, Icon, color }) => (
            <div key={label} className={`rounded-xl border p-4 ${dp.card}`}>
              <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                <Icon size={13} style={{ color }} />
              </div>
              <p className={`text-lg font-extrabold ${dp.pri}`}>{value}</p>
              <p className={`text-[0.6rem] ${dp.mut}`}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Parcours ── */}
      <div>
        <p className={`mb-4 ${dp.lbl}`}>Parcours</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {COACHING_MODULES.map((m) => {
            const done = m.chapters.filter((c) => completed.has(c.id)).length;
            const pct  = m.chapters.length > 0 ? Math.round((done / m.chapters.length) * 100) : 0;
            const firstIncomplete = m.chapters.find((c) => !completed.has(c.id));
            return (
              <motion.button
                key={m.id}
                whileHover={{ y: -2 }}
                onClick={() => {
                  const target = firstIncomplete ?? m.chapters[0]!;
                  onSelectChapter(m.id, target.id);
                  onSetView("chapter");
                }}
                className={`group rounded-2xl border p-4 text-left transition-all hover:border-[rgba(201,165,90,0.25)] ${dp.card}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[0.58rem] font-bold uppercase tracking-widest" style={{ color: m.color }}>Module {m.id}</span>
                  <span className={`text-[0.6rem] font-bold ${dp.sec}`}>{pct}%</span>
                </div>
                <p className={`mb-1 text-sm font-bold ${dp.pri}`}>{m.title}</p>
                <p className={`mb-3 text-[0.62rem] leading-relaxed ${dp.mut}`}>{m.tagline}</p>
                <div className={`h-1 overflow-hidden rounded-full ${dp.bar}`}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: m.color }} />
                </div>
                <p className={`mt-1.5 text-[0.55rem] ${dp.faint}`}>{done}/{m.chapters.length} chapitres · {m.duration}</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Profil professionnel (Phase 12) ── */}
      <div>
        <p className={`mb-4 ${dp.lbl}`}>Personnaliser votre expérience</p>
        <ContexteProCard />
      </div>

      {/* ── Recommandé pour vous ── */}
      {upcoming.length > 0 && (
        <div>
          <p className={`mb-4 ${dp.lbl}`}>Recommandé pour vous</p>
          <div className="space-y-2">
            {upcoming.map(({ m, ch }) => (
              <motion.button
                key={ch.id}
                whileHover={{ x: 3 }}
                onClick={() => { onSelectChapter(m.id, ch.id); onSetView("chapter"); }}
                className={`group flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all hover:border-[rgba(201,165,90,0.25)] ${dp.card}`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `rgba(${m.rgb},0.1)`, border: `1px solid rgba(${m.rgb},0.2)` }}>
                  <BookOpen size={14} style={{ color: `rgb(${m.rgb})` }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.58rem] font-bold uppercase tracking-widest mb-0.5"
                    style={{ color: `rgb(${m.rgb})` }}>{m.title}</p>
                  <p className={`text-sm font-semibold truncate ${dp.pri}`}>{ch.title}</p>
                </div>
                <div className={`flex items-center gap-1 text-[0.62rem] shrink-0 ${dp.faint}`}>
                  <Clock size={10} /> {ch.duration}
                </div>
                <ChevronRight size={14} className={`shrink-0 transition group-hover:text-[${GOLD}] ${dp.faint}`} />
              </motion.button>
            ))}
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
  const { isDark } = useTheme();

  /* ── State ─────────────────────────────────────────────── */
  const [completed,         setCompleted]         = useState<Set<string>>(new Set());
  const [favorites,         setFavorites]         = useState<Set<string>>(new Set());
  const [selectedModuleId,  setSelectedModuleId]  = useState<string>("1");
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>("1.1");
  const [expandedModules,   setExpandedModules]   = useState<Set<string>>(new Set(["1"]));
  const [view,              setView]              = useState<View>("dashboard");
  const [sidebarOpen,       setSidebarOpen]       = useState(true);
  const [focusMode,         setFocusMode]         = useState(false);
  const [assistantInitMsg,  setAssistantInitMsg]  = useState<string | undefined>();
  const [levelUpToast,      setLevelUpToast]      = useState<{ name: string; color: string } | null>(null);
  const [badgeToast,        setBadgeToast]        = useState<{ label: string; Icon: React.ElementType; color: string } | null>(null);

  /* ── Load from localStorage + sync Supabase ───────────── */
  useEffect(() => {
    // 1. Instant hydration from localStorage
    const local = loadProgress();
    setCompleted(local);
    setFavorites(loadFavorites());

    // 2. Enroll silently (idempotent)
    fetch("/api/coaching-ia/enroll", { method: "POST" }).catch(() => {});

    // 3. Merge Supabase progress → localStorage wins on conflict
    fetch("/api/coaching-ia/progress")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { completed: string[] } | null) => {
        if (!data?.completed?.length) return;
        const merged = new Set([...local, ...data.completed]);
        if (merged.size === local.size) return; // nothing new
        setCompleted(merged);
        saveProgress(merged);
      })
      .catch(() => {});
  }, []);

  /* ── Helpers ───────────────────────────────────────────── */
  const currentModule  = COACHING_MODULES.find((m) => m.id === selectedModuleId)!;
  const currentChapter = currentModule?.chapters.find((c) => c.id === selectedChapterId) ?? currentModule?.chapters[0];

  const totalChapters  = COACHING_MODULES.reduce((a, m) => a + m.chapters.length, 0);
  const completedCount = completed.size;
  const overallPct     = Math.round((completedCount / totalChapters) * 100);
  const favCount       = favorites.size;
  const srDueCount     = getDueItems().length;

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

    const xpBefore    = completed.size * XP_PER_CHAPTER;
    const levelBefore = getLevel(xpBefore).name;

    const next = new Set(completed);
    next.add(selectedChapterId);
    setCompleted(next);
    saveProgress(next);
    bumpStreak();
    bumpDailyStats();
    enqueueForReview(selectedChapterId);

    // Level-up toast
    const xpAfter    = next.size * XP_PER_CHAPTER;
    const levelAfter = getLevel(xpAfter);
    if (levelAfter.name !== levelBefore) {
      setLevelUpToast({ name: levelAfter.name, color: levelAfter.color });
      setTimeout(() => setLevelUpToast(null), 3500);
    }

    // Badge unlock toast (premier badge non encore déclenché)
    const earned      = loadEarnedBadges();
    const { streak }  = loadStreak();
    const newPct      = Math.round((next.size / totalChapters) * 100);
    const newDoneMods = COACHING_MODULES.filter((m) => m.chapters.every((c) => next.has(c.id))).length;
    const newQuizDone = COACHING_MODULES.flatMap((m) => m.chapters).filter((c) => c.type === "quiz" && next.has(c.id)).length;
    const bs          = { completedCount: next.size, streak, overallPct: newPct, doneModules: newDoneMods, quizDone: newQuizDone };
    for (const badge of ALL_BADGES) {
      if (checkBadgeEarned(badge.id, bs) && !earned.has(badge.id)) {
        earned.add(badge.id);
        saveEarnedBadges(earned);
        setBadgeToast({ label: badge.label, Icon: badge.Icon, color: badge.color });
        setTimeout(() => setBadgeToast(null), 3500);
        break;
      }
    }

    fetch("/api/coaching-ia/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ legacy_id: selectedChapterId, completed: true }),
    }).catch(() => {});
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
  const eBg   = isDark ? "bg-[#07080e]" : "bg-[#f0f2fb]";
  const eSbBg = isDark ? "bg-[#07080e] border-white/[0.06]" : "bg-white border-black/[0.08]";
  const eSbTxt= isDark ? "text-white/30" : "text-[#0e1420]/35";
  const eSbFaint = isDark ? "text-white/20" : "text-[#0e1420]/25";
  const eSbBar   = isDark ? "bg-white/[0.07]" : "bg-black/[0.07]";
  const eTbBord  = isDark ? "border-white/[0.06]" : "border-black/[0.08]";
  const eTbBtn   = isDark ? "text-white/30 hover:bg-white/[0.05] hover:text-white/70" : "text-[#0e1420]/30 hover:bg-black/[0.04] hover:text-[#0e1420]/70";
  const eTbDiv   = isDark ? "bg-white/[0.08]" : "bg-black/[0.08]";
  const eTabIdle = isDark ? "text-white/35 hover:bg-white/[0.04] hover:text-white/65" : "text-[#0e1420]/40 hover:bg-black/[0.04] hover:text-[#0e1420]/70";
  const eBreadcrumb = isDark ? "text-white/20" : "text-[#0e1420]/25";
  const eFocusIdle  = isDark ? "border-white/[0.08] text-white/30 hover:border-white/[0.15] hover:text-white/60" : "border-black/[0.08] text-[#0e1420]/30 hover:border-black/15 hover:text-[#0e1420]/60";

  const eSbShortcutAssistant = view === "assistant"
    ? "bg-[rgba(201,165,90,0.1)] text-[#c9a55a]"
    : isDark ? "text-white/40 hover:bg-white/[0.04] hover:text-white/70" : "text-[#0e1420]/40 hover:bg-black/[0.04] hover:text-[#0e1420]/70";
  const eSbShortcutFavorites = view === "favorites"
    ? "bg-[rgba(249,168,38,0.1)] text-[#f9a826]"
    : isDark ? "text-white/40 hover:bg-white/[0.04] hover:text-white/70" : "text-[#0e1420]/40 hover:bg-black/[0.04] hover:text-[#0e1420]/70";

  if (access === "loading") return (
    <div className={`flex min-h-screen flex-col items-center justify-center gap-5 ${eBg}`}>
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-[rgba(201,165,90,0.15)]" />
        <div className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-t-[#c9a55a]" />
        <Brain size={22} className="relative" style={{ color: GOLD }} />
      </div>
      <div className="text-center">
        <p className={`text-sm font-semibold ${isDark ? "text-white/60" : "text-[#0e1420]/60"}`}>Vérification de votre accès…</p>
        <p className={`mt-1 text-xs ${isDark ? "text-white/25" : "text-[#0e1420]/30"}`}>Authentification en cours</p>
      </div>
    </div>
  );
  /* Virement ou paiement en attente de confirmation admin */
  if (access === "pending") return <PendingGate user={user} />;
  const devBypass = process.env.NEXT_PUBLIC_DEV_BYPASS_COACHING === "true";
  if (access === "preview" && !devBypass) return <PreviewGate user={user} />;

  const TAB_ITEMS: { key: View; icon: React.ElementType; label: string; badge?: number }[] = [
    { key: "dashboard",   icon: LayoutDashboard, label: "Accueil" },
    { key: "chapter",     icon: BookOpen,         label: "Cours" },
    { key: "assistant",   icon: Bot,              label: "Coach IA" },
    { key: "jeux",        icon: Gamepad2,         label: "S'entraîner" },
    { key: "favorites",   icon: Star,             label: "Révisions", badge: (srDueCount + favCount) || undefined },
    { key: "progression", icon: TrendingUp,       label: "Progression" },
  ];

  return (
    <div className={`flex overflow-hidden transition-all duration-300 ${eBg} ${focusMode ? "h-screen" : "h-[calc(100vh-56px)]"}`}>

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && !focusMode && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 248, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease }}
            className={`flex shrink-0 flex-col overflow-hidden border-r ${eSbBg}`}
            style={{ width: 248 }}
          >
            {/* Progress global */}
            <div className={`border-b px-4 py-4 ${isDark ? "border-white/[0.06]" : "border-black/[0.08]"}`}>
              <div className="mb-2 flex items-center justify-between">
                <span className={`text-[0.62rem] font-semibold uppercase tracking-widest ${eSbTxt}`}>
                  Progression globale
                </span>
                <span className="text-[0.65rem] font-bold" style={{ color: GOLD }}>{overallPct}%</span>
              </div>
              <div className={`h-1.5 overflow-hidden rounded-full ${eSbBar}`}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${GOLD}aa, ${GOLD})` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${overallPct}%` }}
                  transition={{ duration: 0.6, ease }}
                />
              </div>
              <p className={`mt-1.5 text-[0.58rem] ${eSbFaint}`}>
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
            <div className={`border-t space-y-1 px-2 py-3 ${isDark ? "border-white/[0.06]" : "border-black/[0.08]"}`}>
              <button onClick={() => setView("assistant")}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${eSbShortcutAssistant}`}>
                <Bot size={14} /> Assistant IA
              </button>
              <button onClick={() => setView("favorites")}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${eSbShortcutFavorites}`}>
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
        <div className={`relative flex items-center gap-2 border-b px-3 py-2 ${eTbBord} ${isDark ? "bg-[#07080e]" : "bg-white"}`}>

          {/* Toggle sidebar / focus mode */}
          <button
            onClick={() => focusMode ? setFocusMode(false) : setSidebarOpen((p) => !p)}
            title={focusMode ? "Quitter le mode focus" : sidebarOpen ? "Masquer le menu" : "Afficher le menu"}
            className={`rounded-lg p-1.5 transition ${eTbBtn}`}
          >
            {focusMode
              ? <Minimize2 size={15} />
              : sidebarOpen ? <ChevronLeft size={15} /> : <ChevronRight size={15} />
            }
          </button>

          <div className={`h-4 w-px ${eTbDiv}`} />

          {/* Tabs */}
          {TAB_ITEMS.map(({ key, icon: Icon, label, badge }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                view === key
                  ? "border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.1)] text-[#c9a55a]"
                  : eTabIdle
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

          {/* Spacer + KPI chip progression */}
          <div className="flex-1" />
          {completedCount > 0 && (
            <motion.div
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setView("dashboard")}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 border border-[rgba(201,165,90,0.2)] cursor-pointer transition-all hover:border-[rgba(201,165,90,0.35)]"
              style={{ background: "rgba(201,165,90,0.06)" }}
            >
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: GOLD }}/>
              <div>
                <p className="text-xs font-bold leading-none" style={{ color: GOLD }}>{overallPct}%</p>
                <p className="text-[0.5rem] uppercase tracking-wide mt-0.5 whitespace-nowrap text-white/35">{completedCount}/{totalChapters}</p>
              </div>
            </motion.div>
          )}

          {/* Current chapter breadcrumb */}
          {view === "chapter" && currentChapter && !focusMode && (
            <span className={`hidden truncate text-[0.62rem] sm:block max-w-[200px] ${eBreadcrumb}`}>
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
                  : eFocusIdle
              }`}
            >
              <Maximize2 size={12} />
              {focusMode ? "Quitter focus" : "Focus"}
            </button>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(201,165,90,0.4),transparent)" }}/>
        </div>

        {/* Vue principale */}
        <div className={`flex-1 overflow-y-auto ${focusMode ? eBg : ""}`}>
          <AnimatePresence mode="wait">

            {view === "dashboard" && (
              <motion.div key="dashboard"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.22, ease }}
              >
                <DashboardPanel
                  completed={completed}
                  favorites={favorites}
                  onSelectChapter={selectChapter}
                  onSetView={setView}
                  userName={user?.name}
                />
              </motion.div>
            )}

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
                <RevisionsPanel
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
                <ExercicesPanel completed={completed} />
              </motion.div>
            )}

            {view === "progression" && (
              <motion.div key="progression"
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22, ease }}
              >
                <ProgressionPanel
                  completed={completed}
                  onSelectChapter={(chapterId) => selectChapter(chapterId.split(".")[0] ?? "1", chapterId)}
                  onSetView={setView}
                  userName={user?.name ?? user?.email}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* Toasts gamification (Phase 10) */}
      <AnimatePresence>
        {levelUpToast && <LevelUpToast name={levelUpToast.name} color={levelUpToast.color} />}
      </AnimatePresence>
      <AnimatePresence>
        {badgeToast && <BadgeToast label={badgeToast.label} Icon={badgeToast.Icon} color={badgeToast.color} />}
      </AnimatePresence>
    </div>
  );
}
