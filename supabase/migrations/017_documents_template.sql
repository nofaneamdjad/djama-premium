-- Migration 017 — Ajoute la colonne template à la table documents (espace client)
-- Valeur par défaut : 'modern' (compatible avec l'existant)

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'documents'
  ) THEN
    ALTER TABLE documents
      ADD COLUMN IF NOT EXISTS template TEXT NOT NULL DEFAULT 'modern';

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.constraint_column_usage
      WHERE table_name = 'documents' AND constraint_name = 'documents_template_check'
    ) THEN
      ALTER TABLE documents
        ADD CONSTRAINT documents_template_check
          CHECK (template IN ('modern', 'minimal', 'classic', 'premium', 'colorful'));
    END IF;

    CREATE INDEX IF NOT EXISTS idx_documents_template ON documents (template);
  END IF;
END $$;
