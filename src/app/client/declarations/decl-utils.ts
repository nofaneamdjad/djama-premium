// Utilitaires partagés du module Déclarations

import type { DeclStatut, EcheanceStatut, StatutCouverture } from "./decl-types";

export const GOLD = "#c9a55a";

export function tok(isDark: boolean) {
  return {
    bg:         isDark ? "#111111"                : "#f8f8f5",
    glass:      isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)",
    glassMd:    isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    border:     isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
    borderSoft: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
    text:       isDark ? "#e8e2d6"                : "#1a1a1a",
    text2:      isDark ? "#a09880"                : "#4a4a4a",
    text3:      isDark ? "#6b6256"                : "#7a7a7a",
    text4:      isDark ? "#4a4540"                : "#9a9a9a",
  };
}

export function fmt(n: number, devise = "EUR") {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: devise, maximumFractionDigits: 2 }).format(n);
}

export function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso + "T12:00:00"));
}

export function daysUntil(iso: string): number {
  const d = new Date(iso + "T23:59:59");
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

// Statuts déclarations
export const DECL_STATUT_CFG: Record<DeclStatut, { label: string; color: string; bg: string }> = {
  brouillon:       { label: "Brouillon",      color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  en_preparation:  { label: "En préparation", color: GOLD,      bg: `${GOLD}18`              },
  a_valider:       { label: "À valider",      color: "#f59e0b", bg: "rgba(245,158,11,0.15)"  },
  validee:         { label: "Validée",        color: "#22c55e", bg: "rgba(34,197,94,0.12)"   },
  deposee:         { label: "Déposée",        color: "#22c55e", bg: "rgba(34,197,94,0.12)"   },
  accusee:         { label: "Accusée",        color: "#10b981", bg: "rgba(16,185,129,0.12)"  },
  rejetee:         { label: "Rejetée",        color: "#ef4444", bg: "rgba(239,68,68,0.12)"   },
};

// Statuts échéances
export const ECHEANCE_STATUT_CFG: Record<EcheanceStatut, { label: string; color: string }> = {
  a_faire:  { label: "À faire",    color: GOLD      },
  faite:    { label: "Faite",      color: "#22c55e" },
  en_retard:{ label: "En retard",  color: "#ef4444" },
  reportee: { label: "Reportée",   color: "#6b7280" },
};

// Couverture obligations
export const COUVERTURE_CFG: Record<StatutCouverture, { label: string; color: string }> = {
  information:          { label: "Information",           color: "#6b7280" },
  preparation_assistee: { label: "Préparation assistée",  color: GOLD      },
  export:               { label: "Export disponible",     color: "#3b82f6" },
  transmission:         { label: "Transmission intégrée", color: "#22c55e" },
  non_pris_en_charge:   { label: "Non pris en charge",    color: "#9ca3af" },
};

// Pays disponibles (architecture cible, pas couverture réglementaire complète)
export const PAYS_LABELS: Record<string, string> = {
  FR: "France",
  BE: "Belgique",
  DE: "Allemagne",
  ES: "Espagne",
  IT: "Italie",
  GB: "Royaume-Uni",
  US: "États-Unis",
  CA: "Canada",
  MA: "Maroc",
  SN: "Sénégal",
  CI: "Côte d'Ivoire",
  MG: "Madagascar",
  KM: "Comores",
  MU: "Maurice",
  ZA: "Afrique du Sud",
  AE: "Émirats arabes unis",
  SA: "Arabie saoudite",
  IN: "Inde",
  SG: "Singapour",
  AU: "Australie",
};

// Territoires fiscaux français spéciaux
export const TERRITOIRE_LABELS: Record<string, string> = {
  FRA_METRO: "France métropolitaine",
  FRA_REU:   "La Réunion",
  FRA_MAY:   "Mayotte",
  FRA_GUA:   "Guadeloupe",
  FRA_MAR:   "Martinique",
  FRA_GUY:   "Guyane",
};

// Couleurs par type d'échéance
export const ECHEANCE_COLORS: Record<string, string> = {
  tva:               "#c9a55a",
  is:                "#3b82f6",
  cfe:               "#8b5cf6",
  urssaf:            "#f59e0b",
  dsn:               "#f97316",
  cfp:               "#06b6d4",
  taxe_apprentissage:"#10b981",
  autre:             "#6b7280",
};

export function periodeLabel(debut: string, fin: string): string {
  const d = new Date(debut + "T12:00:00");
  const f = new Date(fin + "T12:00:00");
  if (d.getFullYear() === f.getFullYear() && d.getMonth() === f.getMonth()) {
    return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  }
  if (d.getFullYear() === f.getFullYear()) {
    const qStart = Math.floor(d.getMonth() / 3);
    const qEnd   = Math.floor(f.getMonth() / 3);
    if (qStart === qEnd) return `T${qStart + 1} ${d.getFullYear()}`;
    return `${d.toLocaleDateString("fr-FR", { month: "short" })} – ${f.toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}`;
  }
  return `${d.getFullYear()}–${f.getFullYear()}`;
}

// ── Phase 16 — Multi-devises ─────────────────────────────────────────────────
// Taux de référence indicatifs vs EUR (source : BCE approximative)
// À NE PAS utiliser pour des calculs fiscaux officiels — uniquement pour l'affichage
export const REF_RATES_VS_EUR: Record<string, number> = {
  EUR: 1,
  USD: 1.08, GBP: 0.86, CHF: 0.94, CAD: 1.47, AUD: 1.65,
  JPY: 159,  CNY: 7.8,  INR: 89.5, SGD: 1.45, AED: 3.97,
  SAR: 4.05, MAD: 10.8, XOF: 655,  XAF: 655,  MGA: 4700,
  KMF: 492,  MUR: 48.5, ZAR: 20.2, BRL: 5.6,  MXN: 18.5,
  TRY: 34.5, SEK: 11.2, NOK: 11.4, DKK: 7.46,
};

export function convertToEUR(amount: number, fromDevise: string): number {
  const rate = REF_RATES_VS_EUR[fromDevise] ?? 1;
  return amount / rate;
}

export function convertFromEUR(amount: number, toDevise: string): number {
  const rate = REF_RATES_VS_EUR[toDevise] ?? 1;
  return amount * rate;
}

// ── Obligations par défaut pour un profil FR assujetti TVA mensuelle ─────────
export function getDefaultObligations(profile: {
  pays_constitution: string;
  regime_tva: string;
  assujetti_tva: boolean;
  a_salaries: boolean;
  forme_juridique: string | null;
}): Array<{ type_obligation: string; libelle: string; autorite: string; periodicite: string; formulaire: string; categorie: string }> {
  const obs = [];
  if (profile.pays_constitution === "FR") {
    if (profile.assujetti_tva && profile.regime_tva === "mensuel") {
      obs.push({ type_obligation: "tva_ca3", libelle: "TVA mensuelle (CA3)", autorite: "DGFiP", periodicite: "mensuelle", formulaire: "CA3", categorie: "fiscale" });
    }
    if (profile.assujetti_tva && profile.regime_tva === "trimestriel") {
      obs.push({ type_obligation: "tva_ca12", libelle: "TVA trimestrielle (CA12)", autorite: "DGFiP", periodicite: "trimestrielle", formulaire: "CA12", categorie: "fiscale" });
    }
    const isIS = ["SARL","SAS","SA","SNC"].includes(profile.forme_juridique ?? "");
    if (isIS) {
      obs.push({ type_obligation: "is_2065", libelle: "Impôt sur les sociétés (IS)", autorite: "DGFiP", periodicite: "annuelle", formulaire: "2065", categorie: "fiscale" });
      obs.push({ type_obligation: "is_acompte", libelle: "Acompte IS", autorite: "DGFiP", periodicite: "trimestrielle", formulaire: "2571", categorie: "fiscale" });
    }
    obs.push({ type_obligation: "cfe", libelle: "Cotisation foncière des entreprises (CFE)", autorite: "DGFiP", periodicite: "annuelle", formulaire: "1447-C", categorie: "fiscale" });
    if (profile.a_salaries) {
      obs.push({ type_obligation: "urssaf_dsn", libelle: "DSN mensuelle (URSSAF)", autorite: "URSSAF", periodicite: "mensuelle", formulaire: "DSN", categorie: "sociale" });
    }
  }
  return obs;
}
