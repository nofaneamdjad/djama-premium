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

/** Mapping préfixe /api → slug, pour l'enforcement du plan gratuit sur les API features */
export const API_PREFIX_TO_SLUG: Array<[string, string]> = [
  ["/api/factures",        "factures"],
  ["/api/relances",        "factures"],
  ["/api/rapport-mensuel", "factures"],
  ["/api/depenses",        "depenses"],
  ["/api/tresorerie",      "tresorerie"],
  ["/api/comptabilite",    "comptabilite"],
  ["/api/crm-rapport",     "crm"],
  ["/api/contrats",        "contrats"],
  ["/api/stocks",          "stocks"],
  ["/api/stocks-rapport",  "stocks"],
  ["/api/catalog",         "stocks"],
  ["/api/planning",        "planning"],
  ["/api/equipe",          "equipe"],
  ["/api/notes",           "bloc-notes"],
  ["/api/projets",         "projets"],
  ["/api/sourcing",        "sourcing"],
  ["/api/social",          "reseaux-sociaux"],
  ["/api/assistant",       "assistant"],
  ["/api/ai-chat",         "assistant"],
  ["/api/scanner",         "scanner"],
  ["/api/checklists",      "checklists"],
  ["/api/mindmap",         "mindmap"],
  ["/api/transcribe",      "productivite"],
  ["/api/summarize-meeting","productivite"],
  ["/api/coaching-ia",     "coaching-ia"],
  ["/api/coaching",        "coaching-ia"],
  ["/api/blog",            "blog"],
  ["/api/reputation",      "reputation"],
  ["/api/site-builder",    "site-web"],
];

/**
 * Renvoie le slug d'app pour un chemin /client/..., ou null si non couvert.
 * Utilisé par le middleware pour l'enforcement des permissions organisation.
 */
export function getSlugForClientPath(pathname: string): string | null {
  for (const [slug, href] of Object.entries(SLUG_TO_HREF)) {
    if (pathname === href || pathname.startsWith(href + "/")) return slug;
  }
  return null;
}

/**
 * Renvoie le slug d'app pour un chemin d'API feature, ou null si non couvert.
 * Utilisé par le middleware pour l'enforcement du plan gratuit sur les routes API.
 */
export function getSlugForApiPath(pathname: string): string | null {
  for (const [prefix, slug] of API_PREFIX_TO_SLUG) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return slug;
  }
  return null;
}

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
