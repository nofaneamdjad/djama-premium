-- 113_apply_notes_editor_columns.sql
-- Applique toutes les colonnes nécessaires à DJAMA Notes éditeur
-- IDEMPOTENT : IF NOT EXISTS sur toutes les opérations
-- À exécuter dans Supabase Dashboard → SQL Editor

-- ── 1. Contenu riche JSON ─────────────────────────────────────────────────────
ALTER TABLE notes ADD COLUMN IF NOT EXISTS content_json     text;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS thumbnail_text   text    NOT NULL DEFAULT '';

-- ── 2. Type de document ───────────────────────────────────────────────────────
ALTER TABLE notes ADD COLUMN IF NOT EXISTS doc_type         text    NOT NULL DEFAULT 'note';
ALTER TABLE notes DROP CONSTRAINT IF EXISTS chk_notes_doc_type;
ALTER TABLE notes ADD CONSTRAINT chk_notes_doc_type
  CHECK (doc_type IN ('note', 'document', 'template'));

-- ── 3. Mise en page ───────────────────────────────────────────────────────────
ALTER TABLE notes ADD COLUMN IF NOT EXISTS page_format       text    NOT NULL DEFAULT 'A4';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS page_orientation  text    NOT NULL DEFAULT 'portrait';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS page_margin_top    integer NOT NULL DEFAULT 25;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS page_margin_bottom integer NOT NULL DEFAULT 25;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS page_margin_left   integer NOT NULL DEFAULT 25;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS page_margin_right  integer NOT NULL DEFAULT 25;
ALTER TABLE notes DROP CONSTRAINT IF EXISTS chk_notes_page_format;
ALTER TABLE notes DROP CONSTRAINT IF EXISTS chk_notes_page_orient;
ALTER TABLE notes ADD CONSTRAINT chk_notes_page_format  CHECK (page_format IN ('A4','A3','Letter'));
ALTER TABLE notes ADD CONSTRAINT chk_notes_page_orient  CHECK (page_orientation IN ('portrait','landscape'));

-- ── 4. is_pinned (si pas déjà présent) ───────────────────────────────────────
ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;

-- ── 5. Colonnes ajoutées par notes_schema.sql (idem, idempotent) ──────────────
ALTER TABLE notes ADD COLUMN IF NOT EXISTS note_type    text    DEFAULT 'texte';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS tags         text[]  DEFAULT '{}';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_archived  boolean DEFAULT false;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_favorite  boolean DEFAULT false;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS linked_entity text   DEFAULT '';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS word_count   integer DEFAULT 0;

-- ── 6. Table dossiers ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS note_folders (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text    NOT NULL,
  color      text    DEFAULT '#a78bfa',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nfold_user ON note_folders(user_id);
ALTER TABLE note_folders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nfold_own" ON note_folders;
CREATE POLICY "nfold_own" ON note_folders
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- FK dossier sur notes
ALTER TABLE notes ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES note_folders(id) ON DELETE SET NULL;

-- ── 7. Versions de notes ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS note_versions (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id  uuid REFERENCES notes(id) ON DELETE CASCADE,
  title    text DEFAULT '',
  content  text NOT NULL DEFAULT '',
  content_json text,
  saved_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nver_note ON note_versions(note_id);
ALTER TABLE note_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nver_own" ON note_versions;
CREATE POLICY "nver_own" ON note_versions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM notes n WHERE n.id = note_id AND n.user_id = auth.uid())
  );

-- ── 8. Table de partage ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS note_shares (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id              uuid NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  shared_by            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_user_id  uuid          REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_org_id   uuid,
  role                 text NOT NULL DEFAULT 'reader'
                         CHECK (role IN ('editor', 'commenter', 'reader')),
  created_at           timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE note_shares ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ns_select" ON note_shares;
DROP POLICY IF EXISTS "ns_insert" ON note_shares;
DROP POLICY IF EXISTS "ns_delete" ON note_shares;
CREATE POLICY "ns_select" ON note_shares FOR SELECT USING (
  shared_by = auth.uid() OR shared_with_user_id = auth.uid()
);
CREATE POLICY "ns_insert" ON note_shares FOR INSERT WITH CHECK (shared_by = auth.uid());
CREATE POLICY "ns_delete" ON note_shares FOR DELETE USING (shared_by = auth.uid());

-- ── 9. Index de performance ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notes_doc_type  ON notes(doc_type);
CREATE INDEX IF NOT EXISTS idx_notes_archived  ON notes(is_archived);
CREATE INDEX IF NOT EXISTS idx_notes_favorite  ON notes(is_favorite);
CREATE INDEX IF NOT EXISTS idx_notes_folder    ON notes(folder_id);
CREATE INDEX IF NOT EXISTS idx_note_shares_note ON note_shares(note_id);
CREATE INDEX IF NOT EXISTS idx_note_shares_user ON note_shares(shared_with_user_id) WHERE shared_with_user_id IS NOT NULL;
