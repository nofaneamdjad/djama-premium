-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 110 — Espaces Privés : journal d'activité
-- Phase 4
--
-- Actions journalisées :
--   member_added, member_removed, role_changed,
--   file_uploaded, file_deleted, space_created, space_updated, space_archived
--
-- RLS : basée sur is_space_member() (migration 108).
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS space_activity_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id    UUID        NOT NULL REFERENCES private_spaces(id) ON DELETE CASCADE,
  org_id      UUID        REFERENCES organizations(id)           ON DELETE SET NULL,
  user_id     UUID        REFERENCES auth.users(id)              ON DELETE SET NULL,
  user_name   TEXT        NOT NULL DEFAULT '',
  action      TEXT        NOT NULL,
  details     JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour la liste d'activité tri DESC par espace
CREATE INDEX IF NOT EXISTS idx_sal_space_ts
  ON space_activity_log (space_id, created_at DESC);

ALTER TABLE space_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sal_read"   ON space_activity_log;
DROP POLICY IF EXISTS "sal_insert" ON space_activity_log;

-- Membres peuvent lire l'activité de leurs espaces
CREATE POLICY "sal_read" ON space_activity_log
  FOR SELECT
  USING (is_space_member(space_id));

-- Membres actifs peuvent insérer des entrées d'activité (via API admin en pratique)
CREATE POLICY "sal_insert" ON space_activity_log
  FOR INSERT
  WITH CHECK (is_space_member(space_id));

DO $$
BEGIN
  RAISE NOTICE '[110] space_activity_log créée — journal d''activité opérationnel';
END;
$$;
