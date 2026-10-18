import type { CardTheme } from "./types";

export interface CardTemplate {
  id:          string;
  name:        string;
  description: string;
  category:    string;
  theme:       CardTheme;
  preview:     string;  // couleur dominante pour la prévisualisation
}

export const CARD_TEMPLATES: CardTemplate[] = [
  {
    id: "minimaliste",
    name: "Minimaliste",
    description: "Sobre, propre, intemporel. Idéal pour tous les profils.",
    category: "Universel",
    preview: "#f8fafc",
    theme: {
      primaryColor:   "#1a1a1a",
      bgColor:        "#ffffff",
      textColor:      "#1a1a1a",
      accentColor:    "#6b7280",
      fontFamily:     "Inter",
      borderRadius:   "md",
      backgroundType: "solid",
      avatarShape:    "circle",
      layout:         "left",
      shadowCard:     false,
    },
  },
  {
    id: "entreprise",
    name: "Entreprise",
    description: "Professionnel et structuré. Adapté aux PME et grandes entreprises.",
    category: "Corporate",
    preview: "#1e3a5f",
    theme: {
      primaryColor:   "#2563eb",
      bgColor:        "#0f172a",
      textColor:      "#f8fafc",
      accentColor:    "#60a5fa",
      fontFamily:     "Inter",
      borderRadius:   "sm",
      backgroundType: "gradient",
      gradient:       "160deg,#0f172a,#1e3a5f",
      avatarShape:    "rounded",
      layout:         "left",
      shadowCard:     true,
    },
  },
  {
    id: "entrepreneur",
    name: "Entrepreneur",
    description: "Signature DJAMA. Pour les fondateurs et dirigeants ambitieux.",
    category: "Leadership",
    preview: "#c9a55a",
    theme: {
      primaryColor:   "#c9a55a",
      bgColor:        "#0e1420",
      textColor:      "#f5f0e8",
      accentColor:    "#e8c882",
      fontFamily:     "Inter",
      borderRadius:   "lg",
      backgroundType: "gradient",
      gradient:       "135deg,#0e1420,#1a2240",
      avatarShape:    "circle",
      layout:         "centered",
      shadowCard:     true,
    },
  },
  {
    id: "consultant",
    name: "Consultant",
    description: "Confiance et expertise. Pour les consultants et coachs.",
    category: "Professions libérales",
    preview: "#064e3b",
    theme: {
      primaryColor:   "#10b981",
      bgColor:        "#022c22",
      textColor:      "#ecfdf5",
      accentColor:    "#6ee7b7",
      fontFamily:     "Inter",
      borderRadius:   "md",
      backgroundType: "gradient",
      gradient:       "150deg,#022c22,#064e3b",
      avatarShape:    "circle",
      layout:         "left",
      shadowCard:     true,
    },
  },
  {
    id: "creatif",
    name: "Créatif",
    description: "Audacieux et mémorable. Pour les créatifs, designers, artistes.",
    category: "Créatif",
    preview: "#7c3aed",
    theme: {
      primaryColor:   "#a855f7",
      bgColor:        "#1a0533",
      textColor:      "#fdf4ff",
      accentColor:    "#e879f9",
      fontFamily:     "Inter",
      borderRadius:   "lg",
      backgroundType: "gradient",
      gradient:       "135deg,#1a0533,#3b0764",
      avatarShape:    "circle",
      layout:         "centered",
      shadowCard:     true,
    },
  },
  {
    id: "commercial",
    name: "Commercial",
    description: "Dynamique et percutant. Pour les commerciaux et business developers.",
    category: "Ventes",
    preview: "#ea580c",
    theme: {
      primaryColor:   "#f97316",
      bgColor:        "#1c0a00",
      textColor:      "#fff7ed",
      accentColor:    "#fb923c",
      fontFamily:     "Inter",
      borderRadius:   "md",
      backgroundType: "gradient",
      gradient:       "140deg,#1c0a00,#431407",
      avatarShape:    "rounded",
      layout:         "left",
      shadowCard:     true,
    },
  },
  {
    id: "luxe",
    name: "Luxe",
    description: "Élégance et raffinement. Pour les profils premium et haut de gamme.",
    category: "Premium",
    preview: "#78350f",
    theme: {
      primaryColor:   "#c9a55a",
      bgColor:        "#09090b",
      textColor:      "#fafaf9",
      accentColor:    "#e8c882",
      fontFamily:     "Inter",
      borderRadius:   "none",
      backgroundType: "solid",
      avatarShape:    "square",
      layout:         "split",
      shadowCard:     false,
    },
  },
  {
    id: "corporate",
    name: "Corporate",
    description: "Institutionnel et sobre. Pour les cadres et directions.",
    category: "Corporate",
    preview: "#374151",
    theme: {
      primaryColor:   "#4b5563",
      bgColor:        "#111827",
      textColor:      "#f9fafb",
      accentColor:    "#9ca3af",
      fontFamily:     "Inter",
      borderRadius:   "sm",
      backgroundType: "solid",
      avatarShape:    "rounded",
      layout:         "left",
      shadowCard:     false,
    },
  },
];

export function getTemplate(id: string): CardTemplate {
  return CARD_TEMPLATES.find(t => t.id === id) ?? CARD_TEMPLATES[0];
}

// Génère un slug URL-safe depuis un nom complet
export function generateSlug(firstName: string, lastName: string, suffix?: string): string {
  const base = `${firstName}-${lastName}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")  // enlever les accents
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return suffix ? `${base}-${suffix}` : base;
}

// Génère le VCF (vCard 3.0) à partir d'une carte
export function generateVCF(card: import("./types").BusinessCard): string {
  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
  ];

  const fn = [card.first_name, card.last_name].filter(Boolean).join(" ") || card.name;
  lines.push(`FN:${fn}`);

  if (card.first_name || card.last_name) {
    lines.push(`N:${card.last_name ?? ""};${card.first_name ?? ""};;;`);
  }

  if (card.job_title)  lines.push(`TITLE:${card.job_title}`);
  if (card.company)    lines.push(`ORG:${card.company}`);
  if (card.department) lines.push(`ORG;TYPE=DEPARTMENT:${card.department}`);
  if (card.bio)        lines.push(`NOTE:${card.bio.replace(/\n/g, "\\n")}`);
  if (card.email)      lines.push(`EMAIL;TYPE=WORK:${card.email}`);
  if (card.phone)      lines.push(`TEL;TYPE=WORK,VOICE:${card.phone}`);
  if (card.phone_whatsapp && card.phone_whatsapp !== card.phone) {
    lines.push(`TEL;TYPE=CELL:${card.phone_whatsapp}`);
  }
  if (card.website)    lines.push(`URL:${card.website.startsWith("http") ? card.website : `https://${card.website}`}`);

  if (card.city || card.address || card.country) {
    lines.push(`ADR;TYPE=WORK:;;${card.address ?? ""};${card.city ?? ""};;;${card.country ?? ""}`);
  }

  const social = card.social ?? {};
  if (social.linkedin)  lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${social.linkedin}`);
  if (social.twitter)   lines.push(`X-SOCIALPROFILE;TYPE=twitter:${social.twitter}`);
  if (social.instagram) lines.push(`X-SOCIALPROFILE;TYPE=instagram:${social.instagram}`);

  if (card.avatar_url) lines.push(`PHOTO;VALUE=URL:${card.avatar_url}`);

  lines.push(`X-DJAMA-CARD:https://djama.space/c/${card.slug}`);
  lines.push(`REV:${new Date().toISOString()}`);
  lines.push("END:VCARD");

  return lines.join("\r\n");
}
