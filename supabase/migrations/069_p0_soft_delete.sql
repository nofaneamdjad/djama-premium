-- Migration 069 — P0.4 : Soft-delete sur documents
-- Raison : Art. L123-22 Code de commerce — conservation obligatoire 10 ans.
--          Un DELETE physique détruit les justificatifs comptables.
-- Idempotent : ADD COLUMN IF NOT EXISTS, CREATE INDEX IF NOT EXISTS,
--              DROP POLICY IF EXISTS avant recréation.

-- ─── 1. Colonne deleted_at ────────────────────────────────────────────────────
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- ─── 2. Index pour les requêtes courantes (non-supprimés) ────────────────────
CREATE INDEX IF NOT EXISTS idx_documents_not_deleted
  ON documents (user_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_documents_org_not_deleted
  ON documents (organization_id, created_at DESC)
  WHERE deleted_at IS NULL AND organization_id IS NOT NULL;

-- ─── 3. Mettre à jour les policies RLS SELECT pour exclure les supprimés ─────
-- La policy SELECT existante s'appelle probablement "Users can view own documents"
-- On la recrée avec le filtre deleted_at IS NULL.
-- Si la policy n'existe pas encore sous ce nom, la DROP est silencieuse.

DROP POLICY IF EXISTS "Users can view own documents" ON documents;
CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  USING (
    auth.uid() = user_id
    AND deleted_at IS NULL
  );

-- Policy org membres (ajoutée par migration 065)
DROP POLICY IF EXISTS "Org members can view shared documents" ON documents;
CREATE POLICY "Org members can view shared documents"
  ON documents FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND is_org_member(organization_id)
    AND deleted_at IS NULL
  );
