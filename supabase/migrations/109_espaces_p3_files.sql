-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 109 — Espaces Privés : documents & Storage
-- Phase 3 — space_files table
--
-- Le bucket 'space-files' (public: false) est créé programmatiquement
-- par /api/espaces/files/upload au premier upload.
--
-- RLS : basée sur is_space_member() définie en migration 108.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS space_files (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id      UUID        NOT NULL REFERENCES private_spaces(id) ON DELETE CASCADE,
  org_id        UUID        REFERENCES organizations(id)           ON DELETE SET NULL,
  name          TEXT        NOT NULL,
  storage_path  TEXT        NOT NULL,
  size          BIGINT      NOT NULL DEFAULT 0,
  mime_type     TEXT        NOT NULL DEFAULT 'application/octet-stream',
  uploaded_by   UUID        REFERENCES auth.users(id)              ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sf_space ON space_files (space_id);
CREATE INDEX IF NOT EXISTS idx_sf_org   ON space_files (org_id);

ALTER TABLE space_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sf_read"   ON space_files;
DROP POLICY IF EXISTS "sf_manage" ON space_files;

-- Membres de l'espace peuvent lire les fichiers
CREATE POLICY "sf_read" ON space_files
  FOR SELECT
  USING (is_space_member(space_id));

-- Owner et admins peuvent gérer les fichiers (admin client utilisé dans l'API)
CREATE POLICY "sf_manage" ON space_files
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM private_spaces ps
      JOIN organizations o ON o.id = ps.organization_id
      WHERE ps.id = space_id AND o.owner_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM private_spaces ps2
      WHERE ps2.id = space_id AND ps2.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM private_spaces ps
      JOIN organizations o ON o.id = ps.organization_id
      WHERE ps.id = space_id AND o.owner_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM private_spaces ps2
      WHERE ps2.id = space_id AND ps2.user_id = auth.uid()
    )
  );

-- Vérification
DO $$
BEGIN
  RAISE NOTICE '[109] space_files créée — bucket "space-files" (public: false) à créer via Supabase Storage';
END;
$$;
