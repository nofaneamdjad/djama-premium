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
  /** Couleur d'accent choisie par l'utilisateur — appliquée à TOUS les templates */
  color?:          string;
  company?: {
    name?:      string;
    email?:     string;
    website?:   string;
    logoUrl?:   string | null;
    /** Taille d'affichage du logo : sm=30px, md=48px, lg=70px */
    logoSize?:  "sm" | "md" | "lg";
  };
}

// ─── Helpers couleur ──────────────────────────────────────────────────────────

/** Retourne "#fff" ou une couleur sombre selon la luminance du fond */
export function getContrastText(hex: string): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.55 ? "#1a1a2e" : "#ffffff";
  } catch {
    return "#ffffff";
  }
}

/** Retourne une version allégée (tint) d'une couleur hex */
export function lightenHex(hex: string, amount = 0.55): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.round(r + (255 - r) * amount)},${Math.round(g + (255 - g) * amount)},${Math.round(b + (255 - b) * amount)})`;
  } catch {
    return "#cccccc";
  }
}

/** Retourne rgba(r,g,b,opacity) depuis un hex */
export function alphaHex(hex: string, opacity: number): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${opacity})`;
  } catch {
    return `rgba(0,0,0,${opacity})`;
  }
}

// ─── Données de démonstration ─────────────────────────────────────────────────

export const DEMO_DATA: PreviewData = {
  type:         "invoice",
  reference:    "FAC-2025-0001",
  issue_date:   "2025-01-15",
  due_date:     "2025-02-15",
  client_name:  "Marie Dupont",
  client_email: "marie@example.com",
  client_company: "Société Exemple SAS",
  subject:      "Création site web premium",
  color:        "#c9a55a",
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

// ─── Helpers formatage ────────────────────────────────────────────────────────

export function fmtDate(d?: string | null): string {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export function fmtEur(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}
