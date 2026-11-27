import type Anthropic from "@anthropic-ai/sdk";

export const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: "lister_factures",
    description: "Liste les dernières factures avec montants, statuts et dates d'échéance",
    input_schema: {
      type: "object" as const,
      properties: {
        statut: {
          type: "string",
          enum: ["toutes", "brouillon", "envoyée", "payée", "en retard", "annulée"],
          description: "Filtrer par statut (défaut: toutes)",
        },
        limit: {
          type: "number",
          description: "Nombre de résultats (défaut: 10, max: 20)",
        },
      },
    },
  },
  {
    name: "lister_clients",
    description: "Liste ou recherche les clients dans le CRM",
    input_schema: {
      type: "object" as const,
      properties: {
        recherche: {
          type: "string",
          description: "Terme de recherche (nom, email, entreprise)",
        },
        statut: {
          type: "string",
          enum: ["tous", "actif", "inactif", "prospect"],
          description: "Filtrer par statut (défaut: tous)",
        },
        limit: {
          type: "number",
          description: "Nombre de résultats (défaut: 10)",
        },
      },
    },
  },
  {
    name: "analyser_revenus",
    description: "Analyse les revenus encaissés et factures sur une période",
    input_schema: {
      type: "object" as const,
      properties: {
        periode: {
          type: "string",
          enum: ["mois_en_cours", "mois_dernier", "trimestre_en_cours", "annee_en_cours"],
          description: "Période d'analyse",
        },
      },
    },
  },
  {
    name: "lister_devis",
    description: "Liste les derniers devis avec montants et statuts",
    input_schema: {
      type: "object" as const,
      properties: {
        statut: {
          type: "string",
          enum: ["tous", "brouillon", "envoyé", "accepté", "refusé", "expiré"],
          description: "Filtrer par statut (défaut: tous)",
        },
        limit: {
          type: "number",
          description: "Nombre de résultats (défaut: 10)",
        },
      },
    },
  },
  {
    name: "creer_facture",
    description:
      "Prépare la création d'une nouvelle facture et génère un lien vers le formulaire pré-rempli",
    input_schema: {
      type: "object" as const,
      properties: {
        client_nom: {
          type: "string",
          description: "Nom ou entreprise du client",
        },
        montant_ht: {
          type: "number",
          description: "Montant hors taxes en euros",
        },
        description_service: {
          type: "string",
          description: "Description du service ou produit facturé",
        },
      },
    },
  },
  {
    name: "creer_devis",
    description:
      "Prépare la création d'un nouveau devis et génère un lien vers le formulaire pré-rempli",
    input_schema: {
      type: "object" as const,
      properties: {
        client_nom: {
          type: "string",
          description: "Nom ou entreprise du client",
        },
        montant_ht: {
          type: "number",
          description: "Montant hors taxes estimé en euros",
        },
        description_service: {
          type: "string",
          description: "Description du service ou produit à devis",
        },
      },
    },
  },
  {
    name: "obtenir_stats_dashboard",
    description:
      "Obtient les KPIs du tableau de bord : revenus du mois, factures en attente, devis en cours, taux de paiement",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
];

export const TOOL_LABELS: Record<string, string> = {
  lister_factures:       "Consultation des factures",
  lister_clients:        "Recherche dans le CRM",
  analyser_revenus:      "Analyse des revenus",
  lister_devis:          "Consultation des devis",
  creer_facture:         "Préparation de la facture",
  creer_devis:           "Préparation du devis",
  obtenir_stats_dashboard: "Lecture du tableau de bord",
};
