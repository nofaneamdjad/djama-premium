/**
 * Helpers pour le plan gratuit — edge-safe (pas d'imports Lucide).
 * Utilisé par middleware.ts et plans.ts.
 */

/** Routes toujours accessibles pour les utilisateurs gratuits */
export const FREE_ALWAYS_ALLOWED = [
  "/client",
  "/client/profil",
  "/client/abonnements",
  "/client/dashboard", // page d'accueil dashboard
];

/** Mapping slug → clientHref (sans icons pour être edge-compatible) */
export const SLUG_TO_HREF: Record<string, string> = {
  "factures":        "/client/factures",
  "depenses":        "/client/depenses",
  "tresorerie":      "/client/tresorerie",
  "comptabilite":    "/client/comptabilite",
  "banque":          "/client/banque",
  "declarations":    "/client/declarations",
  "crm":             "/client/crm",
  "contrats":        "/client/contrats",
  "fournisseurs":    "/client/fournisseurs",
  "stocks":          "/client/stocks",
  "productivite":    "/client/productivite",
  "planning":        "/client/planning",
  "equipe":          "/client/equipe",
  "chrono":          "/client/chrono",
  "bloc-notes":      "/client/bloc-notes",
  "checklists":      "/client/checklists",
  "scanner":         "/client/scanner",
  "mindmap":         "/client/mindmap",
  "sourcing":        "/client/sourcing",
  "assistant":       "/client/assistant",
  "projets":         "/client/projets",
  "reseaux-sociaux": "/client/reseaux-sociaux",
  "coaching-ia":     "/coaching-ia/espace",
  "rendez-vous":     "/client/rendez-vous",
  "paiements":       "/client/paiements",
  "signature":       "/client/signature",
  "boutique":        "/client/boutique",
  "caisse":          "/client/caisse",
  "email-marketing": "/client/email-marketing",
  "chatbot":         "/client/chatbot",
  "analytics":       "/client/analytics",
  "marketplace":     "/client/marketplace",
  "carte-visite":    "/client/carte-visite",
  "portail":         "/client/portail",
  "paie":            "/client/paie",
  "reputation":      "/client/reputation",
  "blog":            "/client/blog",
  "temoignages":     "/client/temoignages",
  "planification":   "/client/planification",
  "site-web":        "/client/site-web",
  "mes-sites":       "/client/mes-sites",
  "agences":         "/client/agences",
};

export const VALID_FREE_SLUGS = new Set(Object.keys(SLUG_TO_HREF));

/**
 * Renvoie true si un utilisateur gratuit est autorisé à accéder au chemin.
 * @param pathname  Chemin de la requête (ex: "/client/factures/liste")
 * @param freeApps  Slugs choisis par l'utilisateur (ex: ["factures", "planning"])
 */
export function isPathAllowedForFreeUser(pathname: string, freeApps: string[]): boolean {
  // Routes toujours accessibles
  if (pathname === "/client") return true;
  for (const p of FREE_ALWAYS_ALLOWED) {
    if (pathname === p || pathname.startsWith(p + "/")) return true;
  }

  // Routes des apps choisies
  for (const slug of freeApps) {
    const href = SLUG_TO_HREF[slug];
    if (!href) continue;
    if (pathname === href || pathname.startsWith(href + "/")) return true;
  }

  return false;
}
