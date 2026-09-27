export type ContractType = "prestation" | "freelance" | "nda" | "partenariat" | "vente" | "saas" | "location" | "cdi" | "cdd" | "devis" | "autre";
export type ContractStatus = "brouillon" | "validation" | "envoyé" | "vu" | "signé" | "refusé" | "expiré" | "actif";
export type SignerStatus = "pending" | "sent" | "viewed" | "signed" | "refused";

export interface Contract {
  id: string;
  user_id: string;
  title: string;
  client_name: string;
  client_email: string;
  client_company: string;
  contract_type: ContractType;
  content: string;
  status: ContractStatus;
  amount: number | null;
  currency?: string;
  start_date: string | null;
  end_date: string | null;
  jurisdiction?: string;
  language?: string;
  duration_months?: number;
  specific_clauses?: string;
  ai_summary?: string;
  ai_risks?: string;
  validation_manager?: boolean;
  validation_legal?: boolean;
  validation_finance?: boolean;
  is_recurring?: boolean;
  invoice_ref?: string;
  project?: string;
  sent_at?: string | null;
  viewed_at?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at?: string;
  logo_url?: string;
}

export interface Signer {
  id: string;
  contract_id: string;
  user_id: string;
  signer_name: string;
  signer_email: string;
  signer_role: string;
  order_index: number;
  status: SignerStatus;
  signed_at: string | null;
  signature_data: string;
  certificate: string;
  created_at: string;
}

export interface CActivity {
  id: string;
  contract_id: string;
  action: string;
  details: string;
  created_at: string;
}

export interface CComment {
  id: string;
  contract_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

export type DraftForm = {
  title: string;
  client_name: string;
  client_email: string;
  client_company: string;
  type: ContractType;
  amount: string;
  currency: string;
  duration_months: string;
  start_date: string;
  end_date: string;
  jurisdiction: string;
  language: string;
  specifics: string;
  selected_clauses: string[];
  logo: string;
};

export type ContractVersion  = { ts: number; content: string };
export type ContractTemplate = { id: string; name: string; type: ContractType; content: string };

export type AIAnalysisResult = {
  score:       number;
  summary:     string;
  risks:       string[];
  suggestions: string[];
  compliance:  { label: string; ok: boolean }[];
  disclaimer:  string;
};
