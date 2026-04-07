// ═══════════════════════════════════════════════════════════════
// DJAMA — Types Supabase
// Source de vérité unique pour tous les types DB
// ═══════════════════════════════════════════════════════════════

// ── Services ─────────────────────────────────────────────────────
export type ServiceCategory =
  | 'Digital'
  | 'Création de contenu'
  | 'Documents & Outils'
  | 'Accompagnement'
  | 'Coaching';

export type ServiceRow = {
  id: string;
  slug: string;          // colonne ajoutée par migration 003
  title: string;
  category: ServiceCategory;
  price: string;
  description: string;
  active: boolean;
  sort_order: number;
  created_at: string;
};

// ── Réalisations ─────────────────────────────────────────────────
export type RealisationStatus   = 'publié' | 'brouillon';
export type RealisationMediaType = 'image' | 'video' | null;

export type RealisationRow = {
  id: string;
  name: string;
  category: string;
  tag: string;
  description: string;
  year: number;
  status: RealisationStatus;
  url: string | null;
  accent_color: string;
  highlights: string[];
  // Médias (migration 008)
  media_type:    RealisationMediaType;
  image_url:     string | null;
  video_url:     string | null;
  thumbnail_url: string | null;
  created_at: string;
};

// ── Logos partenaires (migration 008) ────────────────────────────
export type PartnerLogoRow = {
  id:          string;
  name:        string;
  logo_url:    string;
  website_url: string | null;
  is_active:   boolean;
  sort_order:  number;
  created_at:  string;
};

// ── Contenu du site (ancien système, gardé pour compatibilité) ───
export type ContentRow = {
  id: string;
  key: string;
  value: string;
  updated_at: string;
};

// ── Paramètres globaux du site (migration 004) ───────────────────
export type SiteSettingRow = {
  id: string;
  key: string;
  value: string;
  label: string;
  section: string;   // 'contact' | 'cta' | 'branding'
  updated_at: string;
};

// Map pratique key → value pour le frontend
export type SiteSettings = Record<string, string>;

// ── Réseaux sociaux (migration 004) ─────────────────────────────
export type SocialPlatform =
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'youtube'
  | 'twitter'
  | 'tiktok'
  | 'snapchat';

export type SocialLinkRow = {
  id: string;
  platform: SocialPlatform;
  url: string;
  active: boolean;
  sort_order: number;
  created_at: string;
};

// ── Messages de contact (migration 004) ──────────────────────────
export type MessageSource = 'contact' | 'devis' | 'reservation' | 'ia' | 'autre';
export type MessageStatus = 'nouveau' | 'lu' | 'traité';

export type ContactMessageRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: MessageSource;
  subject: string;
  message: string;
  status: MessageStatus;
  metadata: Record<string, unknown>;
  created_at: string;
};

// Payload pour l'insertion (sans id/created_at)
export type ContactMessagePayload = Omit<ContactMessageRow, 'id' | 'created_at' | 'metadata'> & {
  metadata?: Record<string, unknown>;
};

// ── Accès utilisateurs (migration 013) ───────────────────────
export type AccessSource = 'manual' | 'stripe' | 'paypal' | 'migrated';

export type UserAccessRow = {
  id:               string;
  email:            string;
  name:             string;
  espace_premium:   boolean;
  coaching_ia:      boolean;
  soutien_scolaire: boolean;
  outils_saas:      boolean;
  source:           AccessSource;
  notes:            string | null;
  access_code:      string | null;
  created_at:       string;
  updated_at:       string;
};

// ── Réservations ──────────────────────────────────────────────
export type ReservationRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  notes: string | null;
  scheduled_at: string | null;
  status: string;
  created_at: string;
};

// ── Devis (migration 010) ─────────────────────────────────────
export type QuoteStatus = 'brouillon' | 'envoyé' | 'accepté' | 'refusé' | 'converti' | 'expiré';

export type QuoteItemRow = {
  id: string;
  quote_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  sort_order: number;
  created_at: string;
};

export type QuoteRow = {
  id: string;
  reference: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  client_company: string | null;
  client_address: string | null;
  subject: string;
  description: string | null;
  budget: string | null;
  status: QuoteStatus;
  issue_date: string | null;
  valid_until: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Nested (when fetched with quote_items(*))
  quote_items?: QuoteItemRow[];
};

// ── Factures (migration 010) ──────────────────────────────────
export type InvoiceStatus        = 'brouillon' | 'envoyée' | 'payée' | 'en retard' | 'annulée';
export type InvoicePaymentStatus = 'non payée' | 'payée' | 'partielle';

export type InvoiceItemRow = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  sort_order: number;
  created_at: string;
};

export type InvoiceRow = {
  id: string;
  reference: string;
  quote_id: string | null;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  client_company: string | null;
  client_address: string | null;
  subject: string;
  description: string | null;
  status: InvoiceStatus;
  issue_date: string | null;
  due_date: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  payment_method: string | null;
  payment_status: InvoicePaymentStatus;
  notes: string | null;
  footer_text: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
  // Nested
  invoice_items?: InvoiceItemRow[];
};
