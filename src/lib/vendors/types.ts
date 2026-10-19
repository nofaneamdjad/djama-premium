export type VendorStatus       = "actif" | "inactif" | "prospect";
export type VendorType         = "prestataire" | "agence" | "freelance" | "cabinet" | "consultant" | "autre";
export type VendorRelationship = "prestataire" | "partenaire" | "sous-traitant" | "fournisseur";
export type MissionStatus      = "prospect" | "en_cours" | "terminee" | "annulee";
export type QuoteStatus        = "ouvert" | "attribue" | "ferme" | "annule";
export type ResponseStatus     = "recu" | "retenu" | "rejete";

export interface Vendor {
  id:              string;
  user_id:         string;
  organization_id: string | null;
  name:            string;
  type:            VendorType;
  relationship:    VendorRelationship;
  status:          VendorStatus;
  speciality:      string | null;
  specialities:    string[] | null;
  sector:          string | null;
  tags:            string[] | null;
  country:         string;
  city:            string | null;
  address:         string | null;
  website:         string | null;
  linkedin:        string | null;
  contact_name:    string | null;
  contact_email:   string | null;
  contact_phone:   string | null;
  contact_role:    string | null;
  since:           string | null;
  rating:          number;
  notes:           string | null;
  crm_contact_id:  string | null;
  created_at:      string;
  updated_at:      string;
  // computed
  missions_count?:        number;
  active_missions_count?: number;
}

export interface VendorMission {
  id:              string;
  user_id:         string;
  organization_id: string | null;
  vendor_id:       string;
  project_id:      string | null;
  title:           string;
  description:     string | null;
  status:          MissionStatus;
  start_date:      string | null;
  end_date:        string | null;
  amount:          number | null;
  currency:        string;
  notes:           string | null;
  created_at:      string;
  updated_at:      string;
  project?:        { id: string; title: string } | null;
}

export interface VendorDocument {
  id:            string;
  user_id:       string;
  vendor_id:     string;
  title:         string;
  document_type: "contrat" | "devis" | "facture" | "nda" | "bon_commande" | "autre";
  document_id:   string | null;
  contract_id:   string | null;
  file_url:      string | null;
  notes:         string | null;
  doc_date:      string | null;
  created_at:    string;
}

export interface VendorQuoteRequest {
  id:                 string;
  user_id:            string;
  organization_id:    string | null;
  project_id:         string | null;
  selected_vendor_id: string | null;
  title:              string;
  description:        string | null;
  category:           string | null;
  deadline:           string | null;
  budget_max:         number | null;
  currency:           string;
  status:             QuoteStatus;
  notes:              string | null;
  created_at:         string;
  updated_at:         string;
  responses?:         VendorQuoteResponse[];
  project?:           { id: string; title: string } | null;
  selected_vendor?:   { id: string; name: string } | null;
}

export interface VendorQuoteResponse {
  id:               string;
  user_id:          string;
  quote_request_id: string;
  vendor_id:        string;
  amount:           number | null;
  currency:         string;
  description:      string | null;
  delivery_days:    number | null;
  validity_date:    string | null;
  status:           ResponseStatus;
  document_id:      string | null;
  notes:            string | null;
  created_at:       string;
  updated_at:       string;
  vendor?:          { id: string; name: string } | null;
}

export const VENDOR_TYPE_LABELS: Record<VendorType, string> = {
  prestataire: "Prestataire",
  agence:      "Agence",
  freelance:   "Freelance",
  cabinet:     "Cabinet",
  consultant:  "Consultant",
  autre:       "Autre",
};

export const VENDOR_RELATIONSHIP_LABELS: Record<VendorRelationship, string> = {
  prestataire:     "Prestataire",
  partenaire:      "Partenaire",
  "sous-traitant": "Sous-traitant",
  fournisseur:     "Fournisseur",
};

export const VENDOR_STATUS_LABELS: Record<VendorStatus, string> = {
  actif:    "Actif",
  inactif:  "Inactif",
  prospect: "Prospect",
};

export const MISSION_STATUS_LABELS: Record<MissionStatus, string> = {
  prospect:  "Prospect",
  en_cours:  "En cours",
  terminee:  "Terminée",
  annulee:   "Annulée",
};

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  ouvert:   "Ouvert",
  attribue: "Attribué",
  ferme:    "Fermé",
  annule:   "Annulé",
};

export const VENDOR_SPECIALITIES = [
  "Développement web",
  "Développement mobile",
  "Design UI/UX",
  "Marketing digital",
  "SEO / SEA",
  "Comptabilité",
  "Conseil juridique",
  "Ressources humaines",
  "Communication",
  "Rédaction / Copywriting",
  "Photographie / Vidéo",
  "Traduction",
  "Logistique",
  "Conseil stratégique",
  "Formation",
  "Cybersécurité",
  "Data / BI",
  "Cloud / Infrastructure",
  "Autre",
];
