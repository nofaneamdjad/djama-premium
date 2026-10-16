// Types partagés du module Déclarations DJAMA

export type SectionId =
  | "overview"
  | "obligations"
  | "calendrier"
  | "preparer"
  | "documents"
  | "historique"
  | "parametres";

export type DeclStatut =
  | "brouillon"
  | "en_preparation"
  | "a_valider"
  | "validee"
  | "deposee"
  | "accusee"
  | "rejetee";

export type EcheanceStatut = "a_faire" | "faite" | "en_retard" | "reportee";

export type StatutCouverture =
  | "non_disponible"
  | "information"
  | "calendrier_verifie"
  | "preparation_assistee"
  | "export_officiel"
  | "depot_integre"
  | "non_pris_en_charge"
  // anciens libellés conservés pour rétrocompatibilité
  | "export"
  | "transmission";

export interface FiscalProfile {
  id: string;
  user_id: string;
  raison_sociale: string | null;
  forme_juridique: string | null;
  pays_constitution: string;
  pays_activite: string[];
  territoire_fiscal: string | null;
  siren: string | null;
  siret: string | null;
  numero_tva_intra: string | null;
  autres_identifiants: Record<string, string>;
  regime_fiscal: string;
  regime_tva: string;
  assujetti_tva: boolean;
  taux_tva_principal: number;
  activite_principale: string | null;
  code_naf: string | null;
  date_debut_activite: string | null;
  secteur: string | null;
  debut_exercice: string;
  duree_exercice: number;
  devise_principale: string;
  a_salaries: boolean;
  etablissements_etrangers: boolean;
  comptable_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeclEtablissement {
  id:                    string;
  user_id:               string;
  profile_id:            string | null;
  nom:                   string;
  pays:                  string;
  territoire_fiscal:     string | null;
  adresse:               string | null;
  identifiant_local:     string | null;
  numero_tva_local:      string | null;
  devise_locale:         string;
  forme_juridique_locale: string | null;
  regime_fiscal_local:   string | null;
  assujetti_tva_local:   boolean;
  regime_tva_local:      string | null;
  a_salaries_local:      boolean;
  date_debut_activite:   string | null;
  actif:                 boolean;
  notes:                 string | null;
  created_at:            string;
  updated_at:            string;
}

export interface Obligation {
  id: string;
  user_id: string;
  pays: string;
  territoire: string | null;
  type_obligation: string;
  categorie: string;
  libelle: string;
  description: string | null;
  autorite: string | null;
  formulaire: string | null;
  periodicite: string;
  source_reglementaire: string | null;
  date_verification: string | null;
  statut_couverture: StatutCouverture;
  active: boolean;
  created_at: string;
}

export interface Declaration {
  id: string;
  user_id: string;
  obligation_id: string | null;
  periode_debut: string;
  periode_fin: string;
  date_echeance: string | null;
  type_declaration: string;
  libelle: string;
  pays: string;
  territoire: string | null;
  montant_principal: number | null;
  montant_tva: number | null;
  devise: string;
  donnees: Record<string, unknown>;
  statut: DeclStatut;
  canal_transmission: string | null;
  date_transmission: string | null;
  reference_transmission: string | null;
  accuse_reception: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Justificatif {
  id: string;
  user_id: string;
  declaration_id: string | null;
  titre: string;
  type_document: string;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  duree_conservation_ans: number;
  notes: string | null;
  created_at: string;
}

export interface Echeance {
  id: string;
  user_id: string;
  obligation_id: string | null;
  declaration_id: string | null;
  libelle: string;
  type_echeance: string;
  pays: string;
  date_echeance: string;
  montant_estime: number | null;
  devise: string;
  statut: EcheanceStatut;
  rappel_jours_avant: number;
  notes: string | null;
  created_at: string;
}

// ── Phase 13 — Collaboration ─────────────────────────────────────────────────

export type CollaborateurRole =
  | "consultation"
  | "preparation"
  | "verification"
  | "validation"
  | "export"
  | "transmission";

export type CollaborateurStatut = "invite" | "actif" | "revoque";

export interface Collaborateur {
  id: string;
  owner_user_id: string;
  collaborateur_email: string;
  collaborateur_user_id: string | null;
  role: CollaborateurRole;
  statut: CollaborateurStatut;
  message: string | null;
  created_at: string;
  updated_at: string;
}

export interface Commentaire {
  id: string;
  owner_user_id: string;
  declaration_id: string;
  auteur_user_id: string;
  auteur_email: string;
  auteur_role: string | null;
  contenu: string;
  created_at: string;
}

// ── Types données TVA depuis les RPCs comptabilité ───────────────────────────
export interface TvaKpis {
  ca_ht: number;
  tva_collectee: number;
  charges_ht: number;
  tva_deductible: number;
  resultat: number;
  has_data: boolean;
}

export interface TvaBreakdownRow {
  account_code: string;
  account_label: string;
  net_amount: number;
}
