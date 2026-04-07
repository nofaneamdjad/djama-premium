-- ═══════════════════════════════════════════════════════════════
-- DJAMA — Migration 008 : Médias réalisations + Logos partenaires
-- Exécuter dans : Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════


-- ── 1. Colonnes médias sur la table realisations ──────────────

ALTER TABLE realisations
  ADD COLUMN IF NOT EXISTS media_type    text CHECK (media_type IN ('image', 'video')) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS image_url     text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS video_url     text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS thumbnail_url text DEFAULT NULL;


-- ── 2. Table logos partenaires ────────────────────────────────

CREATE TABLE IF NOT EXISTS partner_logos (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text NOT NULL DEFAULT '',
  logo_url    text NOT NULL DEFAULT '',
  website_url text DEFAULT NULL,
  is_active   boolean DEFAULT true,
  sort_order  integer DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE partner_logos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select partner_logos"
  ON partner_logos FOR SELECT
  USING (true);

CREATE POLICY "insert partner_logos"
  ON partner_logos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "update partner_logos"
  ON partner_logos FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "delete partner_logos"
  ON partner_logos FOR DELETE
  USING (true);
