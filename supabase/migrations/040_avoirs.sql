-- ── Migration 040 : Avoirs (notes de crédit) ─────────────────────────────
-- 1. Élargir le CHECK constraint sur documents.type pour inclure 'avoir'
-- 2. Ajouter source_id (UUID nullable) pour lier un avoir à sa facture source

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'documents'
  ) THEN
    ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_type_check;
    ALTER TABLE documents
      ADD CONSTRAINT documents_type_check
      CHECK (type IN ('devis', 'facture', 'avoir'));
    ALTER TABLE documents
      ADD COLUMN IF NOT EXISTS source_id uuid
      REFERENCES documents(id) ON DELETE SET NULL;
  END IF;
END $$;
