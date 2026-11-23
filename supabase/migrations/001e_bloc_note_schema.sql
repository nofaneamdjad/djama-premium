-- ════════════════════════════════════════════════════════
-- BLOC NOTE — Capture rapide (séparé de Notes IA)
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS quick_notes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  -- text | checklist | voice
  type        text        DEFAULT 'text',
  title       text        DEFAULT '',
  -- Pour "checklist" : JSON stringifié des items [{id,text,done}]
  -- Pour "voice"     : transcription IA
  -- Pour "text"      : contenu brut (markdown léger)
  content     text        DEFAULT '',
  color       text        DEFAULT '#1a1a2e',
  tags        text[]      DEFAULT '{}',
  is_pinned   boolean     DEFAULT false,
  is_archived boolean     DEFAULT false,
  reminder_at timestamptz,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qn_user     ON quick_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_qn_pinned   ON quick_notes(is_pinned);
CREATE INDEX IF NOT EXISTS idx_qn_archived ON quick_notes(is_archived);
CREATE INDEX IF NOT EXISTS idx_qn_type     ON quick_notes(type);
CREATE INDEX IF NOT EXISTS idx_qn_updated  ON quick_notes(updated_at DESC);

ALTER TABLE quick_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "qn_own" ON quick_notes;
CREATE POLICY "qn_own" ON quick_notes
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_quick_notes_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS qn_updated_at ON quick_notes;
CREATE TRIGGER qn_updated_at
  BEFORE UPDATE ON quick_notes
  FOR EACH ROW EXECUTE FUNCTION update_quick_notes_timestamp();
