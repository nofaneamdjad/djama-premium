-- ═══════════════════════════════════════════════════════════════════════════
-- 149 — WEBSITE BUILDER : constructeur de sites multi-tenant
-- Tables : websites · website_pages · website_sections · website_media · website_versions
-- Idempotent, sûr à rejouer.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── 1. websites ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS websites (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id  uuid        REFERENCES organizations(id) ON DELETE SET NULL,

  name             text        NOT NULL,
  description      text,

  -- Publication / accès
  subdomain        text        UNIQUE,               -- {subdomain}.djama.site
  custom_domain    text,
  status           text        NOT NULL DEFAULT 'draft'
                               CHECK (status IN ('draft','published','archived')),

  -- Langue
  lang             text        NOT NULL DEFAULT 'fr',
  secondary_langs  text[]      DEFAULT '{}',

  -- Identité visuelle (thème global du site)
  theme            jsonb       NOT NULL DEFAULT '{}',
  -- { primaryColor, secondaryColor, accentColor, bgColor,
  --   fontHeading, fontBody, borderRadius, buttonStyle,
  --   darkMode: bool, customCss }

  -- SEO global
  seo_title        text,
  seo_description  text,
  seo_image_url    text,
  favicon_url      text,

  -- Miniature (screenshot)
  thumbnail_url    text,

  -- Template d'origine (pour retrouver le thème initial)
  template_id      text,

  -- Statistiques légères (mise à jour par trigger ou cron)
  page_count       integer     NOT NULL DEFAULT 0,
  published_pages  integer     NOT NULL DEFAULT 0,

  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  published_at     timestamptz
);

CREATE INDEX IF NOT EXISTS idx_websites_user   ON websites(user_id);
CREATE INDEX IF NOT EXISTS idx_websites_org    ON websites(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_websites_status ON websites(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_websites_subdomain ON websites(subdomain) WHERE subdomain IS NOT NULL;

ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ws_select" ON websites;
DROP POLICY IF EXISTS "ws_insert" ON websites;
DROP POLICY IF EXISTS "ws_update" ON websites;
DROP POLICY IF EXISTS "ws_delete" ON websites;

CREATE POLICY "ws_select" ON websites FOR SELECT
  USING (user_id = auth.uid() OR (organization_id IS NOT NULL AND is_org_member(organization_id)));
CREATE POLICY "ws_insert" ON websites FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "ws_update" ON websites FOR UPDATE
  USING (user_id = auth.uid() OR (organization_id IS NOT NULL AND is_org_member(organization_id)));
CREATE POLICY "ws_delete" ON websites FOR DELETE
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION trg_websites_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_websites_updated_at ON websites;
CREATE TRIGGER trg_websites_updated_at
  BEFORE UPDATE ON websites
  FOR EACH ROW EXECUTE FUNCTION trg_websites_updated_at();


-- ─── 2. website_pages ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS website_pages (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id  uuid        NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  title       text        NOT NULL,
  slug        text        NOT NULL,              -- ex: "contact", "a-propos"
  parent_id   uuid        REFERENCES website_pages(id) ON DELETE SET NULL,
  position    integer     NOT NULL DEFAULT 0,

  is_homepage boolean     NOT NULL DEFAULT false,
  in_nav      boolean     NOT NULL DEFAULT true,
  status      text        NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','published')),

  seo_title        text,
  seo_description  text,
  og_image_url     text,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  UNIQUE(website_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_wpages_website   ON website_pages(website_id);
CREATE INDEX IF NOT EXISTS idx_wpages_homepage  ON website_pages(website_id) WHERE is_homepage;

ALTER TABLE website_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wp_select" ON website_pages;
DROP POLICY IF EXISTS "wp_insert" ON website_pages;
DROP POLICY IF EXISTS "wp_update" ON website_pages;
DROP POLICY IF EXISTS "wp_delete" ON website_pages;

CREATE POLICY "wp_select" ON website_pages FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "wp_insert" ON website_pages FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "wp_update" ON website_pages FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "wp_delete" ON website_pages FOR DELETE
  USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS trg_wpages_updated_at ON website_pages;
CREATE TRIGGER trg_wpages_updated_at
  BEFORE UPDATE ON website_pages
  FOR EACH ROW EXECUTE FUNCTION trg_websites_updated_at();


-- ─── 3. website_sections ────────────────────────────────────────────────────
-- Sections/blocs d'une page (composants structurés)

CREATE TABLE IF NOT EXISTS website_sections (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id     uuid        NOT NULL REFERENCES website_pages(id) ON DELETE CASCADE,
  website_id  uuid        NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Type de section (bibliothèque de composants)
  type        text        NOT NULL,
  -- hero | nav | services | about | gallery | testimonials | faq | contact |
  -- features | pricing | team | cta | video | stats | logos | blog_feed |
  -- products | booking | rich_text | divider | spacer | html_embed

  position    integer     NOT NULL DEFAULT 0,
  visible     boolean     NOT NULL DEFAULT true,

  -- Contenu de la section (textes, images, listes…)
  props       jsonb       NOT NULL DEFAULT '{}',

  -- Style de la section (couleurs locales, marges, fond…)
  styles      jsonb       NOT NULL DEFAULT '{}',

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wsec_page    ON website_sections(page_id);
CREATE INDEX IF NOT EXISTS idx_wsec_website ON website_sections(website_id);

ALTER TABLE website_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wsec_select" ON website_sections;
DROP POLICY IF EXISTS "wsec_insert" ON website_sections;
DROP POLICY IF EXISTS "wsec_update" ON website_sections;
DROP POLICY IF EXISTS "wsec_delete" ON website_sections;

CREATE POLICY "wsec_select" ON website_sections FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "wsec_insert" ON website_sections FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "wsec_update" ON website_sections FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "wsec_delete" ON website_sections FOR DELETE USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS trg_wsec_updated_at ON website_sections;
CREATE TRIGGER trg_wsec_updated_at
  BEFORE UPDATE ON website_sections
  FOR EACH ROW EXECUTE FUNCTION trg_websites_updated_at();


-- ─── 4. website_media ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS website_media (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id   uuid        NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  filename     text        NOT NULL,
  storage_path text        NOT NULL,
  public_url   text,
  mime_type    text        NOT NULL DEFAULT 'image/jpeg',
  size         integer     NOT NULL DEFAULT 0,       -- bytes
  width        integer,
  height       integer,
  alt          text,

  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wmedia_website ON website_media(website_id);

ALTER TABLE website_media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wm_select" ON website_media;
DROP POLICY IF EXISTS "wm_insert" ON website_media;
DROP POLICY IF EXISTS "wm_delete" ON website_media;

CREATE POLICY "wm_select" ON website_media FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "wm_insert" ON website_media FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "wm_delete" ON website_media FOR DELETE USING (user_id = auth.uid());


-- ─── 5. website_versions ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS website_versions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id  uuid        NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Snapshot complet : {pages: [{id, title, slug, sections: [...]}], theme, ...}
  snapshot    jsonb       NOT NULL DEFAULT '{}',
  label       text,                                -- ex: "Version avant refonte"

  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wver_website ON website_versions(website_id);
CREATE INDEX IF NOT EXISTS idx_wver_created ON website_versions(website_id, created_at DESC);

ALTER TABLE website_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wv_select" ON website_versions;
DROP POLICY IF EXISTS "wv_insert" ON website_versions;

CREATE POLICY "wv_select" ON website_versions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "wv_insert" ON website_versions FOR INSERT WITH CHECK (user_id = auth.uid());


-- ─── 6. website_domains ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS website_domains (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id  uuid        NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  domain      text        NOT NULL,         -- ex: www.monentreprise.com
  is_primary  boolean     NOT NULL DEFAULT true,
  verified    boolean     NOT NULL DEFAULT false,
  ssl_status  text        NOT NULL DEFAULT 'pending'
                          CHECK (ssl_status IN ('pending','active','error')),
  dns_target  text,                         -- l'IP ou CNAME à pointer
  verify_token text,                        -- token de vérification TXT
  last_check  timestamptz,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  UNIQUE(domain)
);

CREATE INDEX IF NOT EXISTS idx_wdom_website ON website_domains(website_id);

ALTER TABLE website_domains ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wdom_select" ON website_domains;
DROP POLICY IF EXISTS "wdom_insert" ON website_domains;
DROP POLICY IF EXISTS "wdom_update" ON website_domains;
DROP POLICY IF EXISTS "wdom_delete" ON website_domains;

CREATE POLICY "wdom_select" ON website_domains FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "wdom_insert" ON website_domains FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "wdom_update" ON website_domains FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "wdom_delete" ON website_domains FOR DELETE USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS trg_wdom_updated_at ON website_domains;
CREATE TRIGGER trg_wdom_updated_at
  BEFORE UPDATE ON website_domains
  FOR EACH ROW EXECUTE FUNCTION trg_websites_updated_at();


COMMIT;
