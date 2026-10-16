// ── Types partagés — Website Builder DJAMA ────────────────────────────────

export type WebsiteStatus = "draft" | "published" | "archived";
export type PageStatus    = "draft" | "published";
export type SectionType   =
  | "nav" | "hero" | "services" | "about" | "features" | "gallery"
  | "testimonials" | "faq" | "contact" | "pricing" | "team" | "cta"
  | "stats" | "logos" | "blog_feed" | "products" | "booking"
  | "rich_text" | "divider" | "spacer" | "video";

// ── Website ────────────────────────────────────────────────────────────────

export interface WebsiteTheme {
  primaryColor:    string;
  secondaryColor:  string;
  accentColor:     string;
  bgColor:         string;
  textColor:       string;
  fontHeading:     string;   // ex: "Inter", "Playfair Display"
  fontBody:        string;
  borderRadius:    "none" | "sm" | "md" | "lg" | "xl" | "full";
  buttonStyle:     "solid" | "outline" | "ghost";
  darkMode:        boolean;
  customCss?:      string;
}

export const DEFAULT_THEME: WebsiteTheme = {
  primaryColor:   "#2563EB",
  secondaryColor: "#1E40AF",
  accentColor:    "#F59E0B",
  bgColor:        "#FFFFFF",
  textColor:      "#111827",
  fontHeading:    "Inter",
  fontBody:       "Inter",
  borderRadius:   "md",
  buttonStyle:    "solid",
  darkMode:       false,
};

export interface Website {
  id:              string;
  user_id:         string;
  organization_id: string | null;
  name:            string;
  description:     string | null;
  subdomain:       string | null;
  custom_domain:   string | null;
  status:          WebsiteStatus;
  lang:            string;
  secondary_langs: string[];
  theme:           WebsiteTheme;
  seo_title:       string | null;
  seo_description: string | null;
  seo_image_url:   string | null;
  favicon_url:     string | null;
  thumbnail_url:   string | null;
  template_id:     string | null;
  page_count:      number;
  published_pages: number;
  created_at:      string;
  updated_at:      string;
  published_at:    string | null;
}

// ── Page ──────────────────────────────────────────────────────────────────

export interface WebsitePage {
  id:              string;
  website_id:      string;
  user_id:         string;
  title:           string;
  slug:            string;
  parent_id:       string | null;
  position:        number;
  is_homepage:     boolean;
  in_nav:          boolean;
  status:          PageStatus;
  seo_title:       string | null;
  seo_description: string | null;
  og_image_url:    string | null;
  created_at:      string;
  updated_at:      string;
  sections?:       WebsiteSection[];  // chargé à la demande
}

// ── Section ───────────────────────────────────────────────────────────────

export interface WebsiteSection {
  id:         string;
  page_id:    string;
  website_id: string;
  user_id:    string;
  type:       SectionType;
  position:   number;
  visible:    boolean;
  props:      Record<string, unknown>;
  styles:     SectionStyles;
  created_at: string;
  updated_at: string;
}

export interface SectionStyles {
  bg?:          string;
  textColor?:   string;
  paddingTop?:  "none" | "sm" | "md" | "lg" | "xl";
  paddingBot?:  "none" | "sm" | "md" | "lg" | "xl";
  alignment?:   "left" | "center" | "right";
  fullWidth?:   boolean;
}

// ── Version ───────────────────────────────────────────────────────────────

export interface WebsiteVersion {
  id:         string;
  website_id: string;
  label:      string | null;
  created_at: string;
}

// ── Template ──────────────────────────────────────────────────────────────

export interface SiteTemplate {
  id:       string;
  label:    string;
  category: string;
  desc:     string;
  color:    string;
  icon:     string;   // icône lucide ou emoji
  preview?: string;   // URL d'aperçu
  theme:    Partial<WebsiteTheme>;
  pages: {
    title:    string;
    slug:     string;
    isHome:   boolean;
    sections: { type: SectionType; props: Record<string, unknown>; styles?: SectionStyles }[];
  }[];
}
