import type {
  MovementType, OrderStatus, StockState,
  Product, Supplier, LoyalClient, ClientDelivery,
} from "./types";

export const gold  = "#c9a55a";
export const green = "#10b981";
export const ease  = [0.16, 1, 0.3, 1] as const;

export const CATEGORIES = [
  "alimentaire", "électronique", "vêtement", "cosmétique", "mobilier",
  "papeterie", "outillage", "informatique", "sport", "santé", "autre",
];

export const UNITS = ["pièce", "kg", "g", "litre", "ml", "m²", "m", "boîte", "palette", "carton"];

export const MOV_TYPES: { value: MovementType; label: string; color: string; sign: number }[] = [
  { value: "entree",     label: "Entrée",     color: "#10b981", sign: +1 },
  { value: "sortie",     label: "Sortie",     color: "#ef4444", sign: -1 },
  { value: "retour",     label: "Retour",     color: "#3b82f6", sign: +1 },
  { value: "perte",      label: "Perte",      color: "#f97316", sign: -1 },
  { value: "casse",      label: "Casse",      color: "#ef4444", sign: -1 },
  { value: "transfert",  label: "Transfert",  color: "#8b5cf6", sign:  0 },
  { value: "ajustement", label: "Ajustement", color: "#c9a55a", sign:  0 },
];

export const ORDER_STATUS: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  draft:     { label: "Brouillon",  color: "text-gray-400",    bg: "bg-gray-400/10" },
  sent:      { label: "Envoyée",    color: "text-sky-400",     bg: "bg-sky-500/10" },
  confirmed: { label: "Confirmée",  color: "text-yellow-400",  bg: "bg-yellow-500/10" },
  received:  { label: "Reçue",      color: "text-emerald-400", bg: "bg-emerald-500/10" },
  cancelled: { label: "Annulée",    color: "text-red-400",     bg: "bg-red-500/10" },
};

export const EMPTY_PRODUCT = (): Partial<Product> => ({
  name: "", sku: "", barcode: "", description: "", category: "autre", unit: "pièce",
  purchase_price: 0, sale_price: 0, vat_rate: 20,
  stock_current: 0, stock_minimum: 0, stock_reserved: 0, stock_on_order: 0,
  location: "", supplier_name: "", is_active: true,
});

export const EMPTY_SUPPLIER = (): Partial<Supplier> => ({
  name: "", contact: "", email: "", phone: "", address: "",
  payment_terms: "30 jours", lead_time_days: 7, notes: "",
});

export const EMPTY_CLIENT = (): Partial<LoyalClient> => ({
  name: "", email: "", phone: "", address: "", notes: "",
});

export const EMPTY_DELIVERY = (): Partial<ClientDelivery> => ({
  client_id: null, client_name: "", product_id: null, product_name: "",
  quantity: 1, unit: "pièce",
  delivery_date: new Date().toISOString().split("T")[0], notes: "",
});

export const STOCK_STATES: Record<StockState, { label: string; color: string; bg: string; border: string }> = {
  rupture:  { label: "RUPTURE",  color: "#ef4444", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.25)" },
  critique: { label: "CRITIQUE", color: "#f97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.25)" },
  faible:   { label: "FAIBLE",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
  normal:   { label: "NORMAL",   color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)" },
  surstock: { label: "SURSTOCK", color: "#60a5fa", bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.25)" },
};

export function getStockState(p: Product): StockState {
  if (p.stock_current <= 0) return "rupture";
  if (p.stock_minimum > 0 && p.stock_current <= p.stock_minimum * 0.5) return "critique";
  if (p.stock_minimum > 0 && p.stock_current <= p.stock_minimum) return "faible";
  if (p.stock_minimum > 0 && p.stock_current > p.stock_minimum * 4) return "surstock";
  return "normal";
}

/** Explicit column list for bulk product queries — excludes image_url (base64 JPEG) */
export const PRODUCT_LIST_COLS = [
  "id", "user_id", "supplier_id", "warehouse_id",
  "name", "sku", "barcode", "description", "category",
  "unit", "purchase_price", "sale_price", "vat_rate",
  "stock_current", "stock_minimum", "stock_reserved", "stock_on_order",
  "location", "supplier_name", "is_active", "created_at", "updated_at",
].join(",");
