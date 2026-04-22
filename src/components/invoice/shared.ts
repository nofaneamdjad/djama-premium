/**
 * Types partagés entre les composants React de preview de templates.
 */

export interface PreviewLineItem {
  description: string;
  quantity:    number;
  unit_price:  number;
  total:       number;
}

export interface PreviewData {
  type:            "invoice" | "quote";
  reference:       string;
  issue_date:      string;
  due_date?:       string | null;
  valid_until?:    string | null;
  client_name:     string;
  client_email:    string;
  client_company?: string | null;
  client_address?: string | null;
  subject:         string;
  items:           PreviewLineItem[];
  subtotal:        number;
  tax_rate:        number;
  tax_amount:      number;
  total:           number;
  notes?:          string | null;
  company?: {
    name?:    string;
    email?:   string;
    website?: string;
    logoUrl?: string | null;
  };
}

// Données de démonstration pour les thumbnails du sélecteur
export const DEMO_DATA: PreviewData = {
  type:         "invoice",
  reference:    "FAC-2025-0001",
  issue_date:   "2025-01-15",
  due_date:     "2025-02-15",
  client_name:  "Marie Dupont",
  client_email: "marie@example.com",
  client_company: "Société Exemple SAS",
  subject:      "Création site web premium",
  items: [
    { description: "Conception & Design UI/UX", quantity: 1, unit_price: 1200, total: 1200 },
    { description: "Développement Next.js",     quantity: 1, unit_price: 2400, total: 2400 },
    { description: "Intégration contenu",        quantity: 1, unit_price:  600, total:  600 },
  ],
  subtotal:  4200,
  tax_rate:  20,
  tax_amount: 840,
  total:     5040,
  company: {
    name:    "DJAMA",
    email:   "contact@djama.fr",
    website: "www.djama.fr",
  },
};

// Helpers pour les previews
export function fmtDate(d?: string | null): string {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export function fmtEur(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}
