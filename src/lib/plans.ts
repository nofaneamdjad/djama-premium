/**
 * DJAMA — Définition des plans
 * Plan Gratuit : 3 outils à vie
 * Plan PRO     : tous les outils — 11,90€/mois
 */

export type PlanTier = "free" | "premium";

export interface Tool {
  href: string;
  label: string;
  tier: PlanTier;
}

/** Outils gratuits à vie */
export const FREE_TOOLS: string[] = [
  "/client",               // Accueil — toujours accessible
  "/client/planning",      // Planning
  "/client/planification", // alias
  "/client/bloc-note",     // Bloc-note
  "/client/bloc-notes",    // alias
  "/client/factures",      // Factures & Devis
  "/client/factures/liste",
  "/client/profil",        // Profil — toujours accessible
  "/client/abonnements",   // Abonnement — toujours accessible
];

/** Outils PRO (abonnement requis) */
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
  "/client/portail",
  "/client/paie",
];

export function getToolTier(pathname: string): PlanTier {
  if (PREMIUM_TOOLS.some(p => pathname === p || pathname.startsWith(p + "/"))) {
    return "premium";
  }
  return "free";
}

/** Prix de l'abonnement mensuel */
export const PLAN_PRICE       = 11.90;
export const PLAN_PRICE_LABEL = "11,90€ / mois";
