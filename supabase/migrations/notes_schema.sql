-- ════════════════════════════════════════════════════════
-- NOTES IA — Extension du schéma
-- ════════════════════════════════════════════════════════

-- ── 1. Dossiers (créé avant la FK dans notes) ─────────────────────────────────
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

-- ── 2. Enrichir la table notes existante ─────────────────────────────────────
ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS note_type     text    DEFAULT 'texte',
  ADD COLUMN IF NOT EXISTS folder_id     uuid    REFERENCES note_folders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tags          text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_archived   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_favorite   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS linked_entity text    DEFAULT '',
  ADD COLUMN IF NOT EXISTS word_count    integer DEFAULT 0;

-- Migrer les anciens 'category' → 'note_type' pour les notes existantes
UPDATE notes SET note_type =
  CASE category
    WHEN 'réunion'   THEN 'réunion'
    WHEN 'idées'     THEN 'idée'
    WHEN 'tâches'    THEN 'checklist'
    WHEN 'personnel' THEN 'journal'
    ELSE 'texte'
  END
WHERE note_type IS NULL OR note_type = 'texte';

CREATE INDEX IF NOT EXISTS idx_notes_type     ON notes(note_type);
CREATE INDEX IF NOT EXISTS idx_notes_folder   ON notes(folder_id);
CREATE INDEX IF NOT EXISTS idx_notes_archived ON notes(is_archived);

-- ── 3. Versions de notes ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS note_versions (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id  uuid REFERENCES notes(id) ON DELETE CASCADE,
  title    text DEFAULT '',
  content  text NOT NULL,
  saved_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nver_note ON note_versions(note_id);
ALTER TABLE note_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nver_own" ON note_versions;
CREATE POLICY "nver_own" ON note_versions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM notes n WHERE n.id = note_id AND n.user_id = auth.uid())
  );

-- ── 4. Commentaires de notes ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS note_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id     uuid REFERENCES notes(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text DEFAULT '',
  content     text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ncom_note ON note_comments(note_id);
ALTER TABLE note_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ncom_own" ON note_comments;
CREATE POLICY "ncom_own" ON note_comments
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
