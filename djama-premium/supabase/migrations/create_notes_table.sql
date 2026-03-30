-- ──────────────────────────────────────────────────────────────────────────
-- Migration : table notes — Bloc-notes espace client DJAMA
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notes (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text         NOT NULL DEFAULT '',
  content     text         NOT NULL DEFAULT '',
  category    text         NOT NULL DEFAULT 'personnel'
                           CHECK (category IN ('réunion','idées','tâches','personnel')),
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);

-- Index de recherche rapide
CREATE INDEX IF NOT EXISTS notes_user_id_idx    ON notes(user_id);
CREATE INDEX IF NOT EXISTS notes_updated_at_idx ON notes(user_id, updated_at DESC);

-- Mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notes_set_updated_at ON notes;
CREATE TRIGGER notes_set_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ─────────────────────────────────────────────────────
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Un utilisateur ne voit, crée, modifie et supprime que ses propres notes
DROP POLICY IF EXISTS "notes_select_own"  ON notes;
DROP POLICY IF EXISTS "notes_insert_own"  ON notes;
DROP POLICY IF EXISTS "notes_update_own"  ON notes;
DROP POLICY IF EXISTS "notes_delete_own"  ON notes;

CREATE POLICY "notes_select_own"
  ON notes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notes_insert_own"
  ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notes_update_own"
  ON notes FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notes_delete_own"
  ON notes FOR DELETE USING (auth.uid() = user_id);
