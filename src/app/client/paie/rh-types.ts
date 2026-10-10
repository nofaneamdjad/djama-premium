export interface Employe {
  id: string;
  user_id: string;
  nom: string;
  poste?: string;
  email?: string;
  telephone?: string;
  departement?: string;
  etablissement?: string;
  matricule?: string;
  salaire_brut: number;
  date_embauche?: string;
  type_contrat: "CDI" | "CDD" | "Freelance" | "Stage" | "Alternance";
  actif: boolean;
  statut?: "actif" | "suspendu" | "sorti";
  regime?: string;
  quotite_horaire?: number;
  responsable_id?: string;
  date_sortie?: string;
  motif_sortie?: string;
  created_at: string;
}

export interface RhContrat {
  id: string;
  user_id: string;
  employe_id: string;
  type_contrat: string;
  date_debut: string;
  date_fin?: string;
  salaire_brut: number;
  quotite_horaire?: number;
  classification?: string;
  periode_essai_fin?: string;
  statut: "actif" | "termine" | "rompu" | "suspendu";
  notes?: string;
  created_at: string;
}

export interface DemandeConge {
  id: string;
  user_id: string;
  employe_id: string;
  type: "cp" | "rtt" | "maladie" | "maternite" | "paternite" | "sans_solde" | "exceptionnel";
  date_debut: string;
  date_fin: string;
  nb_jours: number;
  statut: "en_attente" | "approuvee" | "refusee";
  motif_refus?: string;
  notes?: string;
  created_at: string;
  // joined
  employe?: { nom: string; poste?: string };
}

export interface VariablePaie {
  id: string;
  user_id: string;
  employe_id: string;
  month_key: string;
  type: "prime" | "heures_sup" | "indemnite" | "retenue" | "avance";
  libelle: string;
  montant: number;
  created_at: string;
}

export interface RhDocument {
  id: string;
  user_id: string;
  employe_id?: string;
  type: "contrat" | "avenant" | "bulletin" | "attestation" | "justificatif" | "courrier" | "autre";
  titre: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  created_at: string;
}

export interface AbsenceBalance {
  cp: number;
  rtt: number;
  maladie: number;
}

export type SectionId =
  | "overview"
  | "salaries"
  | "contrats"
  | "conges"
  | "temps"
  | "paie"
  | "documents"
  | "recrutement"
  | "rapports"
  | "parametres";
