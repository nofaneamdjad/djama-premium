-- ════════════════════════════════════════════════════════════════════════
-- 165_sites_website_builder.sql — Table sites + site_views (website builder)
-- ════════════════════════════════════════════════════════════════════════
--
-- La table `sites` est utilisée par les routes api/site-builder/* mais
-- n'avait aucune migration. Elle est distincte de la table `websites`
-- créée en 149 (nouveau système non encore utilisé par les routes).
--
-- Tables créées :
--   1. sites      — configuration d'un site (slug + config JSON)
--   2. site_views — compteur de vues par jour (analytics public)

-- ─── 1. sites ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sites (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug         text        NOT NULL,
  config       jsonb       NOT NULL DEFAULT '{}',
  published    boolean     NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sites_slug_unique UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_sites_user_id   ON sites(user_id);
CREATE INDEX IF NOT EXISTS idx_sites_slug      ON sites(slug);
CREATE INDEX IF NOT EXISTS idx_sites_published ON sites(user_id, published) WHERE published = true;

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sites_own" ON sites;
CREATE POLICY "sites_own" ON sites
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── 2. site_views — analytics visiteurs ──────────────────────────────────
-- Incrémenté par api/site-builder/track (endpoint public, rate-limited par IP)
-- Lu par api/site-builder/stats (endpoint authentifié)
CREATE TABLE IF NOT EXISTS site_views (
  id      uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid  NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  date    date  NOT NULL DEFAULT CURRENT_DATE,
  views   integer NOT NULL DEFAULT 1,
  CONSTRAINT site_views_unique UNIQUE (site_id, date)
);

CREATE INDEX IF NOT EXISTS idx_site_views_site_date ON site_views(site_id, date);

ALTER TABLE site_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_views_owner_read" ON site_views;
CREATE POLICY "site_views_owner_read" ON site_views
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = site_views.site_id
        AND sites.user_id = auth.uid()
    )
  );

-- track endpoint insère via service_role (admin) — pas de policy INSERT user
