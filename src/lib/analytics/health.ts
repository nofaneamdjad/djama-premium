// ── Score de santé financière DJAMA ──────────────────────────────────────────
// Calcul pur TypeScript, 4 indicateurs × 25 pts = 100 pts max.

import { deltaPercent } from "./periods";
import type { OverviewData, HealthData, AlertItem } from "./types";

export function computeHealthScore(d: OverviewData): HealthData {
  const benefice = d.ca_current - d.dep_current;

  // ── Indicateur 1 : Rentabilité (bénéfice / CA) ──────────────────────────
  const rentabilitePct = d.ca_current > 0 ? (benefice / d.ca_current) * 100 : 0;
  const rentabiliteScore =
    rentabilitePct >= 30 ? 25 :
    rentabilitePct >= 15 ? 20 :
    rentabilitePct >= 0  ? 12 :
    rentabilitePct >= -15 ? 5 : 0;

  // ── Indicateur 2 : Croissance CA vs période précédente ───────────────────
  const dCA = deltaPercent(d.ca_current, d.ca_prev);
  const croissanceScore =
    dCA >= 20 ? 25 :
    dCA >= 5  ? 20 :
    dCA >= -5 ? 15 :
    dCA >= -20 ? 8 : 0;

  // ── Indicateur 3 : Taux de recouvrement (payées / émises) ────────────────
  const emises  = d.factures.payées + d.factures.envoyées;
  const tauxRec = emises > 0 ? (d.factures.payées / emises) * 100 : 100;
  const recouvrementScore =
    tauxRec >= 90 ? 25 :
    tauxRec >= 70 ? 18 :
    tauxRec >= 50 ? 10 : 4;

  // ── Indicateur 4 : Maîtrise des dépenses (ratio charges/CA) ─────────────
  const ratioCh = d.ca_current > 0 ? (d.dep_current / d.ca_current) * 100 : 100;
  const depensesScore =
    ratioCh <= 40 ? 25 :
    ratioCh <= 60 ? 18 :
    ratioCh <= 80 ? 10 :
    ratioCh <= 100 ? 5 : 0;

  const score = rentabiliteScore + croissanceScore + recouvrementScore + depensesScore;

  const label =
    score >= 85 ? "Excellent" :
    score >= 65 ? "Bon"       :
    score >= 45 ? "Moyen"     :
    score >= 25 ? "À améliorer" : "Critique";

  const color =
    score >= 85 ? "#10b981" :
    score >= 65 ? "#c9a55a" :
    score >= 45 ? "#f59e0b" :
    score >= 25 ? "#f97316" : "#ef4444";

  const indicators = [
    {
      label:  "Rentabilité",
      score:  Math.round(rentabilitePct),
      ok:     rentabilitePct >= 15,
      detail: `${rentabilitePct >= 0 ? "+" : ""}${Math.round(rentabilitePct)}% de marge nette`,
    },
    {
      label:  "Croissance CA",
      score:  dCA,
      ok:     dCA >= 0,
      detail: `${dCA > 0 ? "+" : ""}${dCA}% vs période précédente`,
    },
    {
      label:  "Recouvrement",
      score:  Math.round(tauxRec),
      ok:     tauxRec >= 70,
      detail: `${Math.round(tauxRec)}% des factures émises payées`,
    },
    {
      label:  "Maîtrise des charges",
      score:  Math.round(100 - ratioCh),
      ok:     ratioCh <= 70,
      detail: `${Math.round(ratioCh)}% du CA en dépenses`,
    },
  ];

  return { score, label, color, indicators, alerts: computeAlerts(d, dCA, ratioCh) };
}

function computeAlerts(d: OverviewData, dCA: number, ratioCh: number): AlertItem[] {
  const alerts: AlertItem[] = [];

  if (dCA <= -25 && d.ca_prev > 0) {
    alerts.push({
      type:    "danger",
      message: `CA en baisse de ${Math.abs(dCA)}% vs la période précédente`,
    });
  } else if (dCA <= -10 && d.ca_prev > 0) {
    alerts.push({
      type:    "warning",
      message: `CA en recul de ${Math.abs(dCA)}% vs la période précédente`,
    });
  }

  if (ratioCh > 90 && d.ca_current > 0) {
    alerts.push({
      type:    "danger",
      message: `Ratio charges/CA critique : ${Math.round(ratioCh)}%`,
    });
  } else if (ratioCh > 70 && d.ca_current > 0) {
    alerts.push({
      type:    "warning",
      message: `Ratio charges/CA élevé : ${Math.round(ratioCh)}% (cible < 70%)`,
    });
  }

  const tauxImpayés = d.ca_current + d.impayés > 0 ? (d.impayés / (d.ca_current + d.impayés)) * 100 : 0;
  if (tauxImpayés > 30 && d.impayés > 500) {
    alerts.push({
      type:    "warning",
      message: `Impayés importants : ${Math.round(tauxImpayés)}% du CA total émis`,
    });
  }

  if (d.ca_current === 0 && d.factures.envoyées === 0 && d.factures.brouillon === 0) {
    alerts.push({
      type:    "info",
      message: "Aucune facture créée ou envoyée sur cette période",
    });
  }

  return alerts;
}
