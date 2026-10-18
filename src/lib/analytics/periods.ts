// ── Helpers de période — Analytics DJAMA ─────────────────────────────────────

import type { Period, PeriodRange } from "./types";

const iso = (d: Date) => d.toISOString().slice(0, 10);

export function getPeriodRange(p: Period): PeriodRange {
  const now = new Date();
  const y   = now.getFullYear();
  const m   = now.getMonth();

  if (p === "month") {
    return {
      start:     iso(new Date(y, m, 1)),
      end:       iso(new Date(y, m + 1, 0)),
      prevStart: iso(new Date(y, m - 1, 1)),
      prevEnd:   iso(new Date(y, m, 0)),
    };
  }
  if (p === "quarter") {
    const q = Math.floor(m / 3);
    return {
      start:     iso(new Date(y, q * 3, 1)),
      end:       iso(new Date(y, q * 3 + 3, 0)),
      prevStart: iso(new Date(y, (q - 1) * 3, 1)),
      prevEnd:   iso(new Date(y, q * 3, 0)),
    };
  }
  return {
    start:     `${y}-01-01`,
    end:       `${y}-12-31`,
    prevStart: `${y - 1}-01-01`,
    prevEnd:   `${y - 1}-12-31`,
  };
}

export function get12MonthsRange(): { start: string; end: string } {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  return { start: iso(start), end: iso(now) };
}

// Construit un tableau de 12 bucket vides (du plus ancien au plus récent)
export function build12MonthBuckets(): string[] {
  const now     = new Date();
  const buckets: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.push(key);
  }
  return buckets;
}

// YYYY-MM → "jan.", "fév.", etc.
export function monthKeyLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  if (!y || !m) return key;
  return new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "short" });
}

export function deltaPercent(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}
