-- Migration 069 — P0.4 : Soft-delete sur documents
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='documents') THEN
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
    CREATE INDEX IF NOT EXISTS idx_documents_not_deleted
      ON documents (user_id, created_at DESC)
      WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_documents_org_not_deleted
      ON documents (organization_id, created_at DESC)
      WHERE deleted_at IS NULL AND organization_id IS NOT NULL;
    DROP POLICY IF EXISTS "Users can view own documents" ON documents;
    CREATE POLICY "Users can view own documents"
      ON documents FOR SELECT
      USING (auth.uid() = user_id AND deleted_at IS NULL);
    DROP POLICY IF EXISTS "Org members can view shared documents" ON documents;
    CREATE POLICY "Org members can view shared documents"
      ON documents FOR SELECT
      USING (
        organization_id IS NOT NULL
        AND is_org_member(organization_id)
        AND deleted_at IS NULL
      );
  END IF;
END $$;
