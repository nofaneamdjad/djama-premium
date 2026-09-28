export type MovementType = "entree" | "sortie" | "retour" | "perte" | "casse" | "transfert" | "ajustement";
export type OrderStatus  = "draft" | "sent" | "confirmed" | "received" | "cancelled";
export type StockState   = "rupture" | "critique" | "faible" | "normal" | "surstock";

export interface Warehouse {
  id: string; user_id: string; name: string; address: string; is_default: boolean; created_at: string;
}

export interface Supplier {
  id: string; user_id: string; name: string; contact: string; email: string; phone: string;
  address: string; payment_terms: string; lead_time_days: number; notes: string; created_at: string;
  fournisseur_id?: string | null;
}

export interface FournisseurImport {
  id: string; company_name: string; contact_name: string; email: string; phone: string; payment_terms: string;
}

export interface Product {
  id: string; user_id: string; supplier_id: string | null; warehouse_id: string | null;
  name: string; sku: string; barcode: string; description: string; category: string;
  image_url: string; unit: string; purchase_price: number; sale_price: number; vat_rate: number;
  stock_current: number; stock_minimum: number; stock_reserved: number; stock_on_order: number;
  location: string; supplier_name: string; is_active: boolean; created_at: string; updated_at: string;
}

export interface Movement {
  id: string; user_id: string; product_id: string; product_name: string;
  type: MovementType; quantity: number; before_qty: number; after_qty: number;
  warehouse_id: string | null; warehouse_name: string;
  to_warehouse_id: string | null; to_warehouse_name: string;
  reason: string; reference: string; unit_cost: number; date: string; created_at: string;
}

export interface SupplierOrder {
  id: string; user_id: string; supplier_id: string | null; supplier_name: string;
  status: OrderStatus; order_date: string; expected_date: string | null;
  total_amount: number; notes: string; created_at: string;
}

export interface LoyalClient {
  id: string; user_id: string; name: string; email: string; phone: string;
  address: string; notes: string; created_at: string;
}

export interface ClientDelivery {
  id: string; user_id: string; client_id: string | null; client_name: string;
  product_id: string | null; product_name: string;
  quantity: number; unit: string; delivery_date: string; notes: string; created_at: string;
}

export type StocksRapport = {
  score_sante:           number;
  resume_executif:       string;
  points_forts:          string[];
  alertes:               string[];
  recommandations:       string[];
  produits_prioritaires: { nom: string; sku: string; etat: string; action: string }[];
  objectif_semaine:      string;
};
