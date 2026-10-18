// ── Types Analytics DJAMA — Jalon A ──────────────────────────────────────────

export type Period = "month" | "quarter" | "year";

export const PERIOD_LABELS: Record<Period, string> = {
  month:   "Ce mois",
  quarter: "Ce trimestre",
  year:    "Cette année",
};

export interface PeriodRange {
  start:     string; // YYYY-MM-DD
  end:       string;
  prevStart: string;
  prevEnd:   string;
}

// ── Données par onglet ──────────────────────────────────────────────────────

export interface OverviewData {
  ca_current:  number;
  ca_prev:     number;
  dep_current: number;
  dep_prev:    number;
  impayés:     number;
  nb_clients:  number;
  nb_projets:  number;
  factures: {
    total:     number;
    payées:    number;
    envoyées:  number;
    brouillon: number;
  };
  devis: {
    total:           number;
    acceptes:        number;
    taux_conversion: number; // 0-100
  };
  mensuel: { month_key: string; ca: number; depenses: number }[];
}

export interface VentesData {
  ca_total:        number;
  ca_prev:         number;
  nb_factures:     number;
  taux_conversion: number; // 0-100
  factures: {
    total:     number;
    payées:    number;
    envoyées:  number;
    brouillon: number;
  };
  mensuel:     { month_key: string; ca_paye: number; nb: number }[];
  top_clients: { client_name: string; ca_total: number; nb_factures: number }[];
}

export interface ClientsData {
  nb_total:       number;
  clients_actifs: number;
  nouveaux:       number;
  nouveaux_prev:  number;
  top_clients:    { client_name: string; ca_total: number; nb_factures: number }[];
}

export interface FinancesData {
  dep_current:      number;
  dep_prev:         number;
  ca_current:       number;
  ratio_charges:    number; // 0-100
  depenses_par_cat: { category: string; total: number; nb: number }[];
  mensuel:          { month_key: string; ca: number; depenses: number }[];
}
