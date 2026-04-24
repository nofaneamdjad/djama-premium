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

/* ════════════════════════════════════════
   COPILOTE BUSINESS — CHAT IA
════════════════════════════════════════ */
export type ChatActionVariant = "primary" | "secondary" | "warning" | "danger" | "ghost";

export interface ChatAction {
  label:   string;
  icon?:   string;           // nom d'icône lucide (ex: "AlertCircle")
  href?:   string;           // lien de navigation
  variant: ChatActionVariant;
}

export interface ChatKPIs {
  ca_this_month:  number;
  ca_last_month:  number;
  ca_change_pct:  number;    // % entier (peut être négatif)
  unpaid_count:   number;
  unpaid_total:   number;
  score:          number;    // 0-100
}

export interface ChatHistoryItem {
  role:    "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  message: string;
  history: ChatHistoryItem[];
}

export interface ChatApiResponse {
  text:         string;
  actions?:     ChatAction[];
  suggestions?: string[];
  kpis?:        ChatKPIs;   // uniquement sur le premier message (init)
}
