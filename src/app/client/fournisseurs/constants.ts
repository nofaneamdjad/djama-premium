import {
  Package, Wrench, Monitor, Factory, Truck, FileText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { FournCat, OrderStatus, InvoiceStatus, FOrder, FInvoice, FOrderItem } from "./types";

export const violet = "#8b5cf6";
export const gold   = "#c9a55a";
export const ease   = [0.16, 1, 0.3, 1] as const;

export const CATEGORIES: { value: FournCat; label: string; icon: LucideIcon }[] = [
  { value: "produits",  label: "Produits",            icon: Package },
  { value: "services",  label: "Services",             icon: Wrench },
  { value: "logiciels", label: "Logiciels/SaaS",       icon: Monitor },
  { value: "matieres",  label: "Matières premières",   icon: Factory },
  { value: "transport", label: "Transport/Logistique",  icon: Truck },
  { value: "autre",     label: "Autre",                icon: FileText },
];

export const ORDER_STATUS: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  draft:       { label: "Brouillon",          color: "text-gray-400",    bg: "bg-gray-400/10" },
  sent:        { label: "Envoyée",            color: "text-sky-400",     bg: "bg-sky-500/10" },
  confirmed:   { label: "Confirmée",          color: "text-yellow-400",  bg: "bg-yellow-500/10" },
  in_delivery: { label: "En livraison",       color: "text-blue-400",    bg: "bg-blue-500/10" },
  received:    { label: "Reçue",              color: "text-emerald-400", bg: "bg-emerald-500/10" },
  partial:     { label: "Partiellement reçue", color: "text-orange-400", bg: "bg-orange-500/10" },
  cancelled:   { label: "Annulée",            color: "text-red-400",     bg: "bg-red-500/10" },
};

export const INV_STATUS: Record<InvoiceStatus, { label: string; color: string; bg: string }> = {
  unpaid:   { label: "Non payée",  color: "text-orange-400", bg: "bg-orange-500/10" },
  partial:  { label: "Partielle",  color: "text-yellow-400", bg: "bg-yellow-500/10" },
  paid:     { label: "Payée",      color: "text-emerald-400",bg: "bg-emerald-500/10" },
  overdue:  { label: "En retard",  color: "text-red-400",    bg: "bg-red-500/10" },
  disputed: { label: "Contestée",  color: "text-purple-400", bg: "bg-purple-500/10" },
};

export const PAYMENT_METHODS = ["virement", "chèque", "prélèvement", "carte", "PayPal", "autre"];
export const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "MAD", "CAD"];
export const UNITS = ["pièce", "kg", "g", "litre", "ml", "m²", "m", "boîte", "palette", "heure", "jour"];

export const COUNTRIES = [
  "France", "Belgique", "Suisse", "Luxembourg", "Canada", "Maroc", "International",
  "Allemagne", "Autriche", "Espagne", "Italie", "Portugal", "Pays-Bas", "Pologne",
  "Suède", "Norvège", "Danemark", "Finlande", "Irlande", "Royaume-Uni", "Grèce",
  "Turquie", "Ukraine", "Russie", "République Tchèque", "Hongrie", "Roumanie",
  "Bulgarie", "Croatie", "Serbie", "Slovaquie", "Slovénie", "Lituanie", "Lettonie",
  "Estonie", "Chypre", "Malte", "Islande", "Albanie", "Macédoine du Nord",
  "Bosnie-Herzégovine", "Monténégro", "Kosovo", "Moldova", "Biélorussie",
  "Algérie", "Tunisie", "Égypte", "Sénégal", "Côte d'Ivoire", "Mali",
  "Burkina Faso", "Niger", "Guinée", "Cameroun", "Congo", "RD Congo",
  "Madagascar", "Mozambique", "Tanzanie", "Kenya", "Éthiopie", "Nigeria",
  "Ghana", "Afrique du Sud", "Angola", "Zambie", "Zimbabwe", "Namibie",
  "Botswana", "Rwanda", "Ouganda", "Tchad", "Soudan", "Libye",
  "Mauritanie", "Togo", "Bénin", "Gabon", "Centrafrique", "Djibouti",
  "États-Unis", "Mexique", "Brésil", "Argentine", "Chili", "Colombie",
  "Pérou", "Venezuela", "Équateur", "Bolivie", "Paraguay", "Uruguay",
  "Cuba", "Haïti", "République Dominicaine", "Panama", "Costa Rica",
  "Guatemala", "Honduras", "Salvador", "Nicaragua", "Jamaïque",
  "Chine", "Japon", "Inde", "Corée du Sud", "Indonésie", "Philippines",
  "Viêt Nam", "Thaïlande", "Malaisie", "Singapour", "Myanmar", "Cambodge",
  "Bangladesh", "Pakistan", "Sri Lanka", "Népal", "Iran", "Irak",
  "Arabie Saoudite", "Émirats Arabes Unis", "Qatar", "Koweït", "Bahreïn",
  "Oman", "Yémen", "Jordanie", "Liban", "Israël", "Palestine",
  "Kazakhstan", "Ouzbékistan", "Azerbaïdjan", "Arménie", "Géorgie",
  "Mongolie", "Taïwan", "Hong Kong",
  "Australie", "Nouvelle-Zélande", "Papouasie-Nouvelle-Guinée", "Fidji",
];

export const EMPTY_ITEM = (): FOrderItem => ({
  name: "", reference: "", quantity: 1, received_quantity: 0,
  unit_price: 0, discount_percent: 0, vat_rate: 20, total_price: 0,
});

export function calcItemTotal(item: FOrderItem): number {
  return Math.round(item.quantity * item.unit_price * (1 - item.discount_percent / 100) * 100) / 100;
}

export const EMPTY_FOURN = () => ({
  company_name: "", contact_name: "", email: "", phone: "", address: "", city: "",
  country: "France", website: "", siret: "", vat_number: "", iban: "",
  payment_method: "virement", payment_terms: "30 jours", currency: "EUR", credit_limit: 0,
  category: "produits" as FournCat, notes: "", is_active: true,
});

export const EMPTY_ORDER = (): Partial<FOrder> => ({
  order_number: `BC-${Date.now().toString().slice(-6)}`,
  status: "draft", order_date: new Date().toISOString().split("T")[0],
  expected_date: null, tracking_number: "", subtotal: 0, vat_amount: 0,
  total_amount: 0, vat_rate: 20, currency: "EUR", payment_status: "unpaid", notes: "",
});

export const EMPTY_INVOICE = (): Partial<FInvoice> => ({
  invoice_number: "", issue_date: new Date().toISOString().split("T")[0],
  due_date: null, subtotal: 0, vat_amount: 0, total_amount: 0, paid_amount: 0, vat_rate: 20,
  currency: "EUR", status: "unpaid", payment_method: "", notes: "",
});
