/**
 * Feature flags bêta DJAMA — classification des applications.
 * Toutes les vérifications doivent se faire côté SERVEUR.
 */

export type AppStatus = "available" | "experimental" | "restricted" | "unavailable";

export interface AppFlag {
  id:          string;
  label:       string;
  status:      AppStatus;
  path?:       string;
  note?:       string;
}

export const BETA_APP_FLAGS: AppFlag[] = [
  // ── DISPONIBLES en bêta ──────────────────────────────────────────
  { id: "factures",     label: "Factures & Devis",         status: "available",     path: "/client/factures"      },
  { id: "depenses",     label: "Dépenses",                 status: "available",     path: "/client/depenses"      },
  { id: "tresorerie",   label: "Trésorerie",               status: "available",     path: "/client/tresorerie"    },
  { id: "crm",          label: "CRM Clients",              status: "available",     path: "/client/crm"           },
  { id: "projets",      label: "Projets",                  status: "available",     path: "/client/projets"       },
  { id: "equipe",       label: "Équipe",                   status: "available",     path: "/client/equipe"        },
  { id: "planning",     label: "Planning",                 status: "available",     path: "/client/planification" },
  { id: "rdv",          label: "Rendez-vous",              status: "available",     path: "/client/rdv"           },
  { id: "contrats",     label: "Contrats",                 status: "available",     path: "/client/contrats"      },
  { id: "blog",         label: "Blog",                     status: "available",     path: "/client/blog"          },
  { id: "espaces",      label: "Espaces privés",           status: "available",     path: "/client/espaces"       },
  { id: "bloc-notes",   label: "Bloc-notes",               status: "available",     path: "/client/bloc-notes"    },
  { id: "carte-visite", label: "Carte de visite",          status: "available",     path: "/client/carte-visite"  },

  // ── EXPÉRIMENTALES — accès bêta, signalement attendu ─────────────
  { id: "analytics",    label: "Analytics",                status: "experimental",  path: "/client/analytics",    note: "Données réelles, visualisations en amélioration" },
  { id: "chatbot",      label: "Chatbot IA",               status: "experimental",  path: "/client/chatbot",      note: "Consomme des crédits IA" },
  { id: "assistant",    label: "Assistant IA",             status: "experimental",  path: "/client/assistant",    note: "Consomme des crédits IA" },
  { id: "sourcing",     label: "Sourcing IA",              status: "experimental",  path: "/client/sourcing",     note: "Consomme des crédits IA" },
  { id: "site-web",     label: "Site Web",                 status: "experimental",  path: "/client/website-builder", note: "En développement actif" },
  { id: "boutique",     label: "Boutique",                 status: "experimental",  path: "/client/boutique",     note: "Paiements en mode test" },
  { id: "reseaux",      label: "Réseaux sociaux",          status: "experimental",  path: "/client/reseaux-sociaux" },

  // ── RESTREINTES — non exposées en bêta publique ───────────────────
  { id: "banque",       label: "Banque",                   status: "restricted",    note: "Connexion bancaire — validation sécurité requise" },
  { id: "declarations", label: "Déclarations fiscales",    status: "restricted",    note: "Données fiscales sensibles — pilotes uniquement" },
  { id: "paie",         label: "Paie & RH",               status: "restricted",    note: "Données RH sensibles — pilotes uniquement" },
  { id: "signature",    label: "Signature électronique",   status: "restricted",    note: "Validation juridique en cours" },
  { id: "comptabilite", label: "Comptabilité",             status: "restricted",    note: "En validation avec experts-comptables" },
  { id: "coaching-ia",  label: "Coaching IA",              status: "restricted",    note: "Programme pilote séparé" },

  // ── INDISPONIBLES ─────────────────────────────────────────────────
  { id: "caisse",       label: "Caisse / POS",             status: "unavailable",   note: "Prévu Q1 2027" },
  { id: "marketplace",  label: "Marketplace",              status: "unavailable",   note: "Prévu Q2 2027" },
  { id: "paie-rh",      label: "Paie & RH avancé",        status: "unavailable",   note: "Prévu Q1 2027" },
];

/** Retourne toutes les apps d'un statut donné */
export function getAppsByStatus(status: AppStatus): AppFlag[] {
  return BETA_APP_FLAGS.filter(a => a.status === status);
}

/** Vérifie côté serveur si un app_id est accessible en bêta */
export function isBetaAccessible(appId: string): boolean {
  const app = BETA_APP_FLAGS.find(a => a.id === appId);
  return !!app && (app.status === "available" || app.status === "experimental");
}

/** Retourne le statut d'une app ou null si inconnue */
export function getAppStatus(appId: string): AppStatus | null {
  return BETA_APP_FLAGS.find(a => a.id === appId)?.status ?? null;
}

/** Apps disponibles pour l'affichage dans l'onboarding */
export const ONBOARDING_APPS = BETA_APP_FLAGS.filter(
  a => a.status === "available" || a.status === "experimental"
);
