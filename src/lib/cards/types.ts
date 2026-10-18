// ── Types — Module Carte de Visite Digitale ───────────────────────────────────

export type CardStatus = "active" | "draft" | "archived" | "disabled";

export interface CardTheme {
  primaryColor:    string;
  bgColor:         string;
  textColor:       string;
  accentColor:     string;
  fontFamily:      string;
  borderRadius:    "none" | "sm" | "md" | "lg" | "full";
  backgroundType:  "solid" | "gradient" | "pattern";
  gradient?:       string;  // ex: "135deg,#c9a55a,#1e293b"
  avatarShape:     "circle" | "rounded" | "square";
  layout:          "centered" | "left" | "split";
  headerBg?:       string;
  shadowCard?:     boolean;
}

export interface SocialLinks {
  linkedin?:  string;
  twitter?:   string;
  instagram?: string;
  facebook?:  string;
  youtube?:   string;
  tiktok?:    string;
  github?:    string;
  dribbble?:  string;
  behance?:   string;
  snapchat?:  string;
}

export interface CustomLink {
  id:    string;
  label: string;
  url:   string;
  icon?: string;  // lucide icon name
}

export interface HoursEntry {
  day:    string;  // "Lundi" | "Monday" | etc.
  open?:  string;
  close?: string;
  closed: boolean;
}

export interface BusinessCard {
  id:              string;
  user_id:         string;
  slug:            string;
  status:          CardStatus;
  name:            string;

  // Profil
  first_name:      string | null;
  last_name:       string | null;
  job_title:       string | null;
  company:         string | null;
  department:      string | null;
  bio:             string | null;
  avatar_url:      string | null;
  logo_url:        string | null;

  // Contact
  phone:           string | null;
  phone_whatsapp:  string | null;
  email:           string | null;
  website:         string | null;
  address:         string | null;
  city:            string | null;
  country:         string | null;

  // Données enrichies
  social:          SocialLinks;
  links:           CustomLink[];
  hours:           HoursEntry[] | null;

  // Design
  template_id:     string;
  theme:           CardTheme;

  // Paramètres
  lang:                 string;
  show_contact_form:    boolean;
  allow_save_contact:   boolean;

  // Compteurs
  view_count:      number;
  contact_count:   number;

  // Dates
  created_at:      string;
  updated_at:      string;
  published_at:    string | null;
}

export interface CardContact {
  id:          string;
  card_id:     string;
  owner_id:    string;
  name:        string | null;
  email:       string | null;
  phone:       string | null;
  message:     string | null;
  company:     string | null;
  source:      "form" | "vcf" | "qr" | "nfc";
  consent:     boolean;
  added_to_crm: boolean;
  crm_contact_id: string | null;
  created_at:  string;
}

export interface CardVisitStats {
  totalViews:       number;
  uniqueViews:      number;
  vcfDownloads:     number;
  qrScans:          number;
  clicksPhone:      number;
  clicksEmail:      number;
  clicksWhatsApp:   number;
  clicksWebsite:    number;
  shares:           number;
  contactsReceived: number;
  period:           "7d" | "30d" | "90d";
  daily:            { date: string; views: number }[];
}
