export type OrderStatus   = "draft"|"sent"|"confirmed"|"in_delivery"|"received"|"partial"|"cancelled";
export type InvoiceStatus = "unpaid"|"partial"|"paid"|"overdue"|"disputed";
export type FournCat      = "produits"|"services"|"logiciels"|"matieres"|"transport"|"autre";

export interface Fournisseur {
  id: string; user_id: string; company_name: string; contact_name: string;
  email: string; phone: string; address: string; city: string; country: string;
  website: string; siret: string; vat_number: string; iban: string;
  payment_method: string; payment_terms: string; currency: string; credit_limit: number;
  category: FournCat; notes: string; is_active: boolean;
  score_reliability: number; score_quality: number; score_price: number; score_delays: number;
  total_orders: number; total_late_orders: number; contract_expires_at: string | null;
  created_at: string; updated_at: string;
}

export interface CatalogItem {
  id: string; user_id: string; fournisseur_id: string; name: string; reference: string;
  description: string; category: string; unit: string; unit_price: number; currency: string;
  discount_percent: number; min_quantity: number; lead_time_days: number; is_active: boolean;
  created_at: string;
}

export interface FOrder {
  id: string; user_id: string; fournisseur_id: string | null; fournisseur_name: string;
  order_number: string; status: OrderStatus; order_date: string; expected_date: string | null;
  received_date: string | null; tracking_number: string; shipped_at: string | null;
  subtotal: number; vat_amount: number; total_amount: number; vat_rate: number; currency: string;
  payment_status: string; quality_issues: string; reception_notes: string; notes: string;
  created_at: string;
}

export interface FInvoice {
  id: string; user_id: string; fournisseur_id: string | null; fournisseur_name: string;
  order_id: string | null; invoice_number: string; issue_date: string; due_date: string | null;
  subtotal: number; vat_amount: number; total_amount: number; paid_amount: number; vat_rate: number;
  currency: string; status: InvoiceStatus; payment_date: string | null; payment_method: string;
  notes: string; created_at: string;
}

export interface FOrderItem {
  id?: string; order_id?: string; catalog_id?: string | null; stock_product_id?: string | null;
  name: string; reference: string; quantity: number; received_quantity: number;
  unit_price: number; discount_percent: number; vat_rate: number; total_price: number;
}

export interface FRating {
  id: string; fournisseur_id: string; reliability: number; quality: number;
  price: number; delays: number; comment: string; created_at: string;
}
