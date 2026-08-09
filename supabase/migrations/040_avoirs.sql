-- ── Migration 040 : Avoirs (notes de crédit) ─────────────────────────────
-- 1. Élargir le CHECK constraint sur documents.type pour inclure 'avoir'
-- 2. Ajouter source_id (UUID nullable) pour lier un avoir à sa facture source

-- Supprimer l'ancien constraint (nom exact dans Supabase)
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_type_check;

-- Recréer avec 'avoir' inclus
ALTER TABLE documents
  ADD CONSTRAINT documents_type_check
  CHECK (type IN ('devis', 'facture', 'avoir'));

-- Colonne de référence à la facture source
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS source_id uuid
  REFERENCES documents(id) ON DELETE SET NULL;
