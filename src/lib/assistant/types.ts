/**
 * Types partagés — Système Assistant DJAMA PRO
 * Utilisés par les routes API (/api/assistant/*) et la page client.
 */

/* ── Niveaux d'urgence ── */
export type UrgencyLevel = "critique" | "urgent" | "surveiller";
export type NotifLevel   = "urgent" | "important" | "info";

/* ── Types d'action Coach ── */
export type CoachActionType =
  | "relance_client"
  | "optimisation_planning"
  | "opportunite_revenu";

/* ── Type de document ── */
export type DocumentType = "facture" | "devis";

/* ════════════════════════════════════════
   RADAR ARGENT PERDU
════════════════════════════════════════ */
export interface RadarItem {
  id:           string;
  type:         DocumentType;
  label:        string;
  client:       string;
  reference:    string;
  amount:       number;
  urgency:      UrgencyLevel;
  days:         number;
  client_email: string | null;
}

export interface RadarResponse {
  items: RadarItem[];
  total: number;
}

/* ════════════════════════════════════════
   RELANCE INTELLIGENTE
════════════════════════════════════════ */
export interface RelanceRequest {
  type:        DocumentType;
  id:          string;
  client_name: string;
  reference:   string;
  amount:      number;
  days:        number;
}

export interface RelanceResponse {
  subject: string;
  message: string;
}

/* ════════════════════════════════════════
   COACH BUSINESS
════════════════════════════════════════ */
export interface CoachAction {
  type:        CoachActionType;
  priority:    1 | 2 | 3;
  title:       string;
  description: string;
  impact:      string;
  urgency:     "haute" | "moyenne" | "faible";
  badge:       "Aujourd'hui" | "Cette semaine" | "À planifier";
}

export interface CoachResponse {
  resume:  string;
  score:   number;
  actions: CoachAction[];
  insight: string;
  meta: {
    unpaid_total:  number;
    quotes_total:  number;
    generated_at:  string;
  };
}

/* ════════════════════════════════════════
   NOTIFICATIONS
════════════════════════════════════════ */
export interface AppNotification {
  id:           string;
  level:        NotifLevel;
  title:        string;
  description:  string;
  amount?:      number;
  action_url:   string;
  action_label: string;
}

export interface NotificationsResponse {
  notifications:  AppNotification[];
  total_at_risk:  number;
  urgent_count:   number;
}
