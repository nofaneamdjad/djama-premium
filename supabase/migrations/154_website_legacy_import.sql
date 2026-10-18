-- ─────────────────────────────────────────────────────────────────────────────
-- 154 — Migration legacy : sites → websites
--
-- Ce script importe les sites créés avec l'ancien constructeur (table `sites`)
-- vers le nouveau système (table `websites`).
--
-- UTILISATION :
--   - Exécuter manuellement depuis le SQL Editor Supabase
--   - Vérifier les données importées avant de couper l'accès aux anciens sites
--   - Les anciens sites restent dans `sites` — aucune donnée n'est supprimée
--   - Les sites déjà migrés sont ignorés (UNIQUE sur subdomain)
-- ─────────────────────────────────────────────────────────────────────────────

-- Vérifier si la table `sites` (ancien système) existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'sites'
  ) THEN
    RAISE NOTICE 'Table `sites` introuvable — aucune migration à effectuer.';
    RETURN;
  END IF;

  -- Compter les sites à migrer
  RAISE NOTICE 'Sites à migrer : %', (SELECT COUNT(*) FROM sites);

  -- ── Insérer dans websites ─────────────────────────────────────────────────
  INSERT INTO websites (
    user_id,
    name,
    description,
    subdomain,
    status,
    lang,
    secondary_langs,
    theme,
    seo_title,
    seo_description,
    page_count,
    published_pages,
    created_at,
    updated_at,
    published_at
  )
  SELECT
    s.user_id,
    COALESCE(s.name, 'Site importé'),
    s.description,
    -- Sous-domaine : utiliser le slug existant ou générer depuis le nom
    LOWER(REGEXP_REPLACE(COALESCE(s.slug, s.name, 'site-' || EXTRACT(EPOCH FROM s.created_at)::bigint), '[^a-z0-9-]', '-', 'g')),
    CASE
      WHEN s.published = TRUE  THEN 'published'
      WHEN s.archived  = TRUE  THEN 'archived'
      ELSE 'draft'
    END,
    COALESCE(s.lang, 'fr'),
    '{}',  -- secondary_langs vide par défaut
    jsonb_build_object(
      'primaryColor',   COALESCE(s.primary_color,   '#2563EB'),
      'secondaryColor', COALESCE(s.secondary_color, '#1E40AF'),
      'accentColor',    COALESCE(s.accent_color,    '#F59E0B'),
      'bgColor',        COALESCE(s.bg_color,        '#FFFFFF'),
      'textColor',      COALESCE(s.text_color,      '#111827'),
      'fontHeading',    COALESCE(s.font_heading,    'Inter'),
      'fontBody',       COALESCE(s.font_body,       'Inter'),
      'borderRadius',   'md',
      'buttonStyle',    'solid',
      'darkMode',       FALSE
    ),
    s.seo_title,
    s.seo_description,
    0,  -- page_count : recalculé après import des pages
    0,  -- published_pages
    s.created_at,
    s.updated_at,
    CASE WHEN s.published = TRUE THEN s.published_at ELSE NULL END
  FROM sites s
  -- Ignorer les sites dont le sous-domaine existe déjà dans websites
  WHERE NOT EXISTS (
    SELECT 1 FROM websites w
    WHERE w.subdomain = LOWER(REGEXP_REPLACE(
      COALESCE(s.slug, s.name, 'site-' || EXTRACT(EPOCH FROM s.created_at)::bigint),
      '[^a-z0-9-]', '-', 'g'
    ))
  );

  RAISE NOTICE 'Import terminé. Sites importés : %',
    (SELECT COUNT(*) FROM websites WHERE created_at < now() - INTERVAL '1 second');

END $$;

-- ── Vue de correspondance pour les redirections ───────────────────────────────
-- Crée une table de mapping old_site_id → new_website_id pour les redirections
-- des anciennes URLs publiques (/s/{slug}) vers les nouvelles ({subdomain}.djama.site)

CREATE TABLE IF NOT EXISTS website_legacy_mapping (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  old_site_id     uuid        NOT NULL,      -- ID dans `sites`
  old_slug        text        NOT NULL,      -- slug dans `sites`
  new_website_id  uuid        NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  migrated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(old_site_id),
  UNIQUE(old_slug)
);

CREATE INDEX IF NOT EXISTS idx_legacy_mapping_old_slug ON website_legacy_mapping(old_slug);
CREATE INDEX IF NOT EXISTS idx_legacy_mapping_website  ON website_legacy_mapping(new_website_id);

-- RLS : lecture publique (nécessaire pour les redirections sans session)
ALTER TABLE website_legacy_mapping ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wlm_select_public" ON website_legacy_mapping;
CREATE POLICY "wlm_select_public" ON website_legacy_mapping FOR SELECT USING (true);

DROP POLICY IF EXISTS "wlm_insert_own" ON website_legacy_mapping;
CREATE POLICY "wlm_insert_own" ON website_legacy_mapping FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites w WHERE w.id = new_website_id AND w.user_id = auth.uid()
    )
  );
