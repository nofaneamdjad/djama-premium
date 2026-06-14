-- ══════════════════════════════════════════════════════════════════
-- Migration 031 : Tables notebooks et notebook_pages
-- Utilisées par src/app/client/bloc-notes/page.tsx pour le canvas.
-- Idempotent — CREATE TABLE IF NOT EXISTS + DROP POLICY IF EXISTS.
-- ══════════════════════════════════════════════════════════════════

-- ── notebooks ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notebooks (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT        NOT NULL,
  cover_id    TEXT        DEFAULT 'midnight',
  page_style  TEXT        DEFAULT 'lined',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notebooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notebooks_owner" ON notebooks;
CREATE POLICY "notebooks_owner" ON notebooks
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notebooks_user ON notebooks(user_id);

-- ── notebook_pages ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notebook_pages (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  notebook_id  UUID        REFERENCES notebooks(id) ON DELETE CASCADE NOT NULL,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  page_number  INTEGER     NOT NULL DEFAULT 1,
  strokes      JSONB       DEFAULT '[]',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notebook_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notebook_pages_owner" ON notebook_pages;
CREATE POLICY "notebook_pages_owner" ON notebook_pages
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notebook_pages_nb   ON notebook_pages(notebook_id);
CREATE INDEX IF NOT EXISTS idx_notebook_pages_user ON notebook_pages(user_id);
