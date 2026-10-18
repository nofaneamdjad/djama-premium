// ── Prévisions CA — régression linéaire ──────────────────────────────────────
// Algorithme pure TypeScript, aucune dépendance externe.

import { build12MonthBuckets, monthKeyLabel } from "./periods";
import type { ForecastData } from "./types";

interface Regression { slope: number; intercept: number; r2: number }

function linearRegression(ys: number[]): Regression {
  const n = ys.length;
  if (n < 2) return { slope: 0, intercept: ys[0] ?? 0, r2: 0 };

  const xs    = ys.map((_, i) => i);
  const xMean = xs.reduce((s, x) => s + x, 0) / n;
  const yMean = ys.reduce((s, y) => s + y, 0) / n;

  let ssxy = 0, ssxx = 0, ssyy = 0;
  for (let i = 0; i < n; i++) {
    ssxy += (xs[i]! - xMean) * (ys[i]! - yMean);
    ssxx += (xs[i]! - xMean) ** 2;
    ssyy += (ys[i]! - yMean) ** 2;
  }

  const slope     = ssxx > 0 ? ssxy / ssxx : 0;
  const intercept = yMean - slope * xMean;
  const r2        = ssxx > 0 && ssyy > 0 ? (ssxy ** 2) / (ssxx * ssyy) : 0;

  return { slope, intercept, r2: Math.max(0, Math.min(1, r2)) };
}

// Renvoie le mois YYYY-MM à +offset mois depuis aujourd'hui
function futureMonthKey(offset: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function computeForecast(
  caByMonth: Record<string, number>, // month_key → ca
): ForecastData {
  const buckets = build12MonthBuckets();

  // On garde les 6 derniers mois pour la régression (plus représentatif)
  const last6 = buckets.slice(-6).map(k => caByMonth[k] ?? 0);
  const avg6m  = last6.reduce((s, v) => s + v, 0) / 6;

  const reg = linearRegression(last6);

  // Prévision pour les 3 prochains mois (indices 6, 7, 8)
  const next_months = [1, 2, 3].map(offset => ({
    month_key:   futureMonthKey(offset),
    forecast_ca: Math.max(0, Math.round(reg.slope * (6 + offset - 1) + reg.intercept)),
  }));

  const trend: ForecastData["trend"] =
    reg.slope > avg6m * 0.03  ? "hausse" :
    reg.slope < -avg6m * 0.03 ? "baisse" : "stable";

  const confidence: ForecastData["confidence"] =
    reg.r2 >= 0.7 ? "bonne" :
    reg.r2 >= 0.4 ? "moyenne" : "faible";

  return {
    trend,
    slope_per_month: Math.round(reg.slope),
    r2:              Math.round(reg.r2 * 100) / 100,
    confidence,
    avg_6m:          Math.round(avg6m),
    next_months,
  };
}

export { monthKeyLabel };
