-- ════════════════════════════════════════════════════════════════════
-- Migration 137 — Bloc-notes : index performance
-- Idempotente
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Index composite principal (requête Bloc-notes / DOC IA) ───────
-- WHERE user_id = $1 AND is_archived = false ORDER BY updated_at DESC
CREATE INDEX IF NOT EXISTS idx_notes_user_archived_updated
  ON notes(user_id, is_archived, updated_at DESC);

-- ── 2. Index composite avec doc_type ─────────────────────────────────
-- WHERE user_id = $1 AND doc_type = $2 AND is_archived = false ORDER BY updated_at DESC
CREATE INDEX IF NOT EXISTS idx_notes_user_doctype_archived
  ON notes(user_id, doc_type, is_archived, updated_at DESC);

-- ── 3. Index titre pour la recherche ILIKE (préfixe) ─────────────────
-- WHERE user_id = $1 AND title ILIKE '%q%' AND is_archived = false
-- Note : ILIKE ne bénéficie pas pleinement d'un B-tree, mais couvre le tri.
-- Un index GIN pg_trgm sera ajouté si le volume justifie une recherche full-text.
CREATE INDEX IF NOT EXISTS idx_notes_user_title_active
  ON notes(user_id, title)
  WHERE is_archived = false;

-- ── 4. RLS — conformité ───────────────────────────────────────────────
-- Les 4 politiques existantes (notes_select_own / notes_insert_own /
-- notes_update_own / notes_delete_own) filtrent sur user_id = auth.uid()
-- sans condition sur doc_type : elles sont correctes pour tous les types
-- (note, document, template). Aucune nouvelle politique n'est nécessaire.

-- ── 5. note_versions — index user_id indirect ────────────────────────
-- Requête : SELECT * FROM note_versions WHERE note_id IN (...)
-- Couvert par idx_nver_note (note_id) existant depuis migration 113.
