// Utilitaires partagés — Module Banque DJAMA

export const GOLD = "#c9a55a";

export function tok(isDark: boolean) {
  return {
    bg:         isDark ? "#0a0b12"                : "#f2f4f7",
    glass:      isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)",
    glassMd:    isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    glassLg:    isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.055)",
    border:     isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
    borderSoft: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
    text:       isDark ? "#e4ddd4"                : "#1a1a1a",
    text2:      isDark ? "#9a9080"                : "#4a4a4a",
    text3:      isDark ? "#5c5650"                : "#7a7a7a",
    text4:      isDark ? "#3a3630"                : "#9a9a9a",
  };
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BankAccount {
  id: string;
  user_id: string;
  organization_id: string | null;
  name: string;
  bank: string;
  iban: string;
  balance: number;
  initial_balance: number;
  currency: string;
  color: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface BankTransaction {
  id: string;
  user_id: string;
  account_id: string | null;
  type: "income" | "expense";
  category: string;
  label: string;
  amount: number;
  currency: string;
  date: string;
  payment_method: string;
  status: "completed" | "pending" | "cancelled";
  client_supplier: string;
  invoice_ref: string;
  notes: string;
  bank_ref: string | null;
  source: string;
  reconciliation_status: "unmatched" | "suggested" | "reconciled" | "excluded";
  tags: string[];
  import_file_id: string | null;
  document_payment_id: string | null;
  expense_id: string | null;
  created_at: string;
}

export interface BankConnection {
  id: string;
  user_id: string;
  provider: string;
  institution_name: string;
  institution_country: string | null;
  status: "pending" | "active" | "expired" | "error" | "revoked";
  accounts_count: number;
  consent_expires_at: string | null;
  last_sync_at: string | null;
  last_error: string | null;
  created_at: string;
}

export interface BankImportFile {
  id: string;
  user_id: string;
  account_id: string | null;
  filename: string;
  file_format: string;
  status: string;
  transactions_total: number;
  transactions_imported: number;
  transactions_skipped: number;
  error_message: string | null;
  created_at: string;
}

export interface BankReconciliation {
  id: string;
  transaction_id: string;
  match_type: string;
  document_id: string | null;
  expense_id_ref: string | null;
  match_score: number;
  match_reason: string | null;
  status: "suggested" | "validated" | "rejected";
  notes: string | null;
  created_at: string;
}

export interface BankRule {
  id: string;
  name: string;
  description: string | null;
  conditions: RuleCondition[];
  actions: RuleActions;
  priority: number;
  active: boolean;
  match_count: number;
  created_at: string;
}

export interface RuleCondition {
  field: "label" | "amount" | "category" | "payment_method" | "client_supplier";
  operator: "contains" | "equals" | "starts_with" | "greater_than" | "less_than";
  value: string;
}

export interface RuleActions {
  set_category?: string;
  add_tag?: string;
  set_reconciliation_status?: string;
}

// ── Catégories ────────────────────────────────────────────────────────────────

export const INCOME_CATS = [
  { value: "client",       label: "Paiement client",        color: "#10b981" },
  { value: "refund",       label: "Remboursement",          color: "#06b6d4" },
  { value: "investment",   label: "Apport / investissement",color: "#8b5cf6" },
  { value: "other_income", label: "Autre entrée",           color: "#6b7280" },
];

export const EXPENSE_CATS = [
  { value: "fournisseurs",  label: "Fournisseurs",          color: "#f59e0b" },
  { value: "salaires",      label: "Salaires / charges",    color: "#ef4444" },
  { value: "loyer",         label: "Loyer / immobilier",    color: "#6366f1" },
  { value: "transport",     label: "Transport",             color: "#0ea5e9" },
  { value: "marketing",     label: "Marketing / publicité", color: "#e11d48" },
  { value: "logiciels",     label: "Logiciels / SaaS",      color: "#8b5cf6" },
  { value: "services",      label: "Services",              color: "#14b8a6" },
  { value: "banque_frais",  label: "Frais bancaires",       color: "#94a3b8" },
  { value: "impots_taxes",  label: "Impôts / taxes",        color: "#f97316" },
  { value: "other_expense", label: "Autre",                 color: "#6b7280" },
];

export function getCatColor(cat: string): string {
  return [...INCOME_CATS, ...EXPENSE_CATS].find(c => c.value === cat)?.color ?? "#6b7280";
}

export function getCatLabel(cat: string): string {
  return [...INCOME_CATS, ...EXPENSE_CATS].find(c => c.value === cat)?.label ?? cat;
}

// ── Formatage ─────────────────────────────────────────────────────────────────

export function fmtAmount(n: number, currency = "EUR") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}

export function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso.includes("T") ? iso : iso + "T12:00:00"));
}

export function fmtDateShort(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(iso.includes("T") ? iso : iso + "T12:00:00"));
}

// ── Payment methods ───────────────────────────────────────────────────────────

export const PAYMENT_METHODS = [
  { v: "virement",    l: "Virement" },
  { v: "carte",       l: "Carte bancaire" },
  { v: "cash",        l: "Espèces" },
  { v: "prelevement", l: "Prélèvement" },
  { v: "cheque",      l: "Chèque" },
  { v: "autre",       l: "Autre" },
];

export const CURRENCIES = [
  "EUR", "USD", "GBP", "CHF", "CAD", "MAD", "XOF", "XAF",
  "AED", "SGD", "JPY", "CNY", "INR", "BRL", "MXN",
];
