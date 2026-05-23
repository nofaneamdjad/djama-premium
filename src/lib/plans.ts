/**
 * DJAMA — Définition des plans freemium
 * Modifie ici pour changer quels outils sont gratuits/premium
 */

export type PlanTier = "free" | "premium";

export interface Tool {
  href: string;
  label: string;
  tier: PlanTier;
  /** Limite spéciale pour les outils gratuits (ex: 3 factures/mois) */
  freeLimit?: { count: number; period: "month"; label: string };
}

/** Outils gratuits à vie */
export const FREE_TOOLS: string[] = [
  "/client",
  "/client/planning",
  "/client/planification",
  "/client/bloc-note",
  "/client/bloc-notes",
  "/client/factures",        // limité à 3/mois
  "/client/factures/liste",
];

/** Tous les outils premium (accès trial 30j puis payant) */
export const PREMIUM_TOOLS: string[] = [
  "/client/dashboard",
  "/client/crm",
  "/client/assistant",
  "/client/depenses",
  "/client/tresorerie",
  "/client/contrats",
  "/client/fournisseurs",
  "/client/stocks",
  "/client/productivite",
  "/client/equipe",
  "/client/chrono",
  "/client/notes",
  "/client/sourcing",
  "/client/reputation",
  "/client/reseaux-sociaux",
  "/client/temoignages",
  "/client/coaching-ia",
  "/coaching-ia/espace",
];

export function getToolTier(pathname: string): PlanTier {
  // Vérifie les préfixes premium
  if (PREMIUM_TOOLS.some(p => pathname === p || pathname.startsWith(p + "/"))) {
    return "premium";
  }
  return "free";
}

/** Prix de l'abonnement mensuel */
export const PLAN_PRICE = 11.90;
export const PLAN_PRICE_LABEL = "11,90€ / mois";
export const TRIAL_DAYS = 30;
