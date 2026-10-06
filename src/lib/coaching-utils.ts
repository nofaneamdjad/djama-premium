/**
 * coaching-utils.ts
 * Fonctions pures utilisées par le module Coaching IA.
 * Aucune dépendance DOM / localStorage / React — testables en environnement Node.
 */

/* ── XP / Niveaux ─────────────────────────────────────────────────────── */

export const XP_PER_CHAPTER = 50;

export const LEVEL_DATA = [
  { name: "Novice",    min: 0,    color: "#94a3b8" },
  { name: "Apprenti",  min: 300,  color: "#60a5fa" },
  { name: "Praticien", min: 700,  color: "#a78bfa" },
  { name: "Expert IA", min: 1400, color: "#f59e0b" },
  { name: "Maître IA", min: 2500, color: "#c9a55a" },
] as const;

export function getLevel(xp: number) {
  let idx = 0;
  for (let i = 0; i < LEVEL_DATA.length; i++) { if (xp >= LEVEL_DATA[i].min) idx = i; }
  const next = LEVEL_DATA[idx + 1] as (typeof LEVEL_DATA)[number] | undefined;
  const pct  = next
    ? Math.min(100, Math.round(((xp - LEVEL_DATA[idx].min) / (next.min - LEVEL_DATA[idx].min)) * 100))
    : 100;
  return { ...LEVEL_DATA[idx], pct, xpNext: next ? next.min - xp : 0, nextName: next?.name };
}

/* ── Badges ───────────────────────────────────────────────────────────── */

export interface BadgeState {
  completedCount: number;
  streak:         number;
  overallPct:     number;
  doneModules:    number;
  quizDone:       number;
}

export function checkBadgeEarned(id: string, s: BadgeState): boolean {
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

/* ── Extraction de références de modules depuis un texte IA ─────────── */

export function extractModuleRefs(text: string): string[] {
  const refs = new Set<string>();
  const patterns: RegExp[] = [
    /\bmodule\s+(\d{1,2})\b/gi,
    /\bM(\d{1,2})\b/g,
    /\b(\d{1,2})\.\d+\b/g,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const id = m[1];
      if (id && parseInt(id, 10) >= 1 && parseInt(id, 10) <= 10) refs.add(id);
    }
  }
  return [...refs].slice(0, 5);
}

/* ── Algorithme SM-2 (partie pure sans localStorage) ─────────────────── */

export interface SM2Input {
  quality:     0 | 3 | 5;
  interval:    number;  // jours
  easeFactor:  number;  // 1.3 – 3.0
  repetitions: number;
}

export interface SM2Result {
  interval:    number;
  easeFactor:  number;
  repetitions: number;
}

export function calcSM2({ quality, interval, easeFactor, repetitions }: SM2Input): SM2Result {
  if (quality === 0) {
    return { interval: 1, easeFactor, repetitions: 0 };
  }
  let newInterval: number;
  if      (repetitions === 0) newInterval = 1;
  else if (repetitions === 1) newInterval = 6;
  else                        newInterval = Math.max(1, Math.round(interval * easeFactor));

  const newEaseFactor = Math.max(
    1.3,
    easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02),
  );
  return { interval: newInterval, easeFactor: newEaseFactor, repetitions: repetitions + 1 };
}
