-- Colonnes client manquantes dans la table documents
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'documents'
  ) THEN
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS client_societe   text NOT NULL DEFAULT '';
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS client_telephone text NOT NULL DEFAULT '';
    CREATE INDEX IF NOT EXISTS idx_documents_user_updated ON documents(user_id, updated_at DESC);
  END IF;
END $$;
