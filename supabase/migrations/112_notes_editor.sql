-- 112_notes_editor.sql : DJAMA Notes — Refonte éditeur professionnel
-- AUCUNE MIGRATION DESTRUCTIVE. Toutes les opérations sont idempotentes.

-- ── 1. Contenu riche Tiptap (JSON sérialisé) ─────────────────────────────────
ALTER TABLE notes ADD COLUMN IF NOT EXISTS content_json text;

-- ── 2. Type de document ───────────────────────────────────────────────────────
ALTER TABLE notes ADD COLUMN IF NOT EXISTS doc_type text NOT NULL DEFAULT 'note';
ALTER TABLE notes DROP CONSTRAINT IF EXISTS chk_notes_doc_type;
ALTER TABLE notes ADD CONSTRAINT chk_notes_doc_type
  CHECK (doc_type IN ('note', 'document', 'template'));

-- ── 3. Mise en page du document ───────────────────────────────────────────────
ALTER TABLE notes ADD COLUMN IF NOT EXISTS page_format      text    NOT NULL DEFAULT 'A4';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS page_orientation text    NOT NULL DEFAULT 'portrait';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS page_margin_top    integer NOT NULL DEFAULT 25;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS page_margin_bottom integer NOT NULL DEFAULT 25;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS page_margin_left   integer NOT NULL DEFAULT 25;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS page_margin_right  integer NOT NULL DEFAULT 25;
ALTER TABLE notes DROP CONSTRAINT IF EXISTS chk_notes_page_format;
ALTER TABLE notes DROP CONSTRAINT IF EXISTS chk_notes_page_orient;
ALTER TABLE notes ADD CONSTRAINT chk_notes_page_format  CHECK (page_format IN ('A4','A3','Letter'));
ALTER TABLE notes ADD CONSTRAINT chk_notes_page_orient  CHECK (page_orientation IN ('portrait','landscape'));

-- ── 4. Aperçu texte pour vignette ────────────────────────────────────────────
ALTER TABLE notes ADD COLUMN IF NOT EXISTS thumbnail_text text NOT NULL DEFAULT '';

-- ── 5. Multi-tenant : organization_id ─────────────────────────────────────────
ALTER TABLE notes ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE notes n
SET organization_id = (
  SELECT om.organization_id
  FROM organization_members om
  WHERE om.user_id = n.user_id
  ORDER BY CASE om.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END,
           om.created_at ASC
  LIMIT 1
)
WHERE n.organization_id IS NULL;

-- ── 6. Liens ERP (Phase 8 — colonnes FK prêtes) ───────────────────────────────
ALTER TABLE notes ADD COLUMN IF NOT EXISTS linked_project_id  uuid REFERENCES projects(id)           ON DELETE SET NULL;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS linked_contact_id  uuid REFERENCES contacts(id)           ON DELETE SET NULL;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS linked_task_id     uuid REFERENCES productivity_tasks(id) ON DELETE SET NULL;

-- ── 7. Table de partage de notes ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS note_shares (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id          uuid NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  shared_by        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_user uuid          REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_org  uuid          REFERENCES organizations(id) ON DELETE CASCADE,
  role             text NOT NULL DEFAULT 'reader'
                     CHECK (role IN ('editor', 'commenter', 'reader')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_note_share_target CHECK (
    shared_with_user IS NOT NULL OR shared_with_org IS NOT NULL
  )
);
ALTER TABLE note_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ns_select" ON note_shares;
DROP POLICY IF EXISTS "ns_insert" ON note_shares;
DROP POLICY IF EXISTS "ns_delete" ON note_shares;

CREATE POLICY "ns_select" ON note_shares FOR SELECT USING (
  shared_by = auth.uid()
  OR shared_with_user = auth.uid()
  OR (shared_with_org IS NOT NULL AND shared_with_org IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ))
);
CREATE POLICY "ns_insert" ON note_shares FOR INSERT WITH CHECK (shared_by = auth.uid());
CREATE POLICY "ns_delete" ON note_shares FOR DELETE USING (shared_by = auth.uid());

-- ── 8. Index de performance ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notes_org       ON notes(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notes_doc_type  ON notes(doc_type);
CREATE INDEX IF NOT EXISTS idx_notes_lp        ON notes(linked_project_id) WHERE linked_project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_note_shares_note ON note_shares(note_id);
CREATE INDEX IF NOT EXISTS idx_note_shares_user ON note_shares(shared_with_user) WHERE shared_with_user IS NOT NULL;

-- ── 9. note_folders : multi-tenant ───────────────────────────────────────────
ALTER TABLE note_folders ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE note_folders nf
SET organization_id = (
  SELECT om.organization_id FROM organization_members om
  WHERE om.user_id = nf.user_id
  ORDER BY CASE om.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END, om.created_at ASC
  LIMIT 1
)
WHERE nf.organization_id IS NULL;
