-- Colonnes pour la signature électronique des devis
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS share_token    TEXT UNIQUE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS signed_at      TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS signature_data TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS signed_by      TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS viewed_at      TIMESTAMPTZ DEFAULT NULL;

-- Index pour lookup rapide par token
CREATE INDEX IF NOT EXISTS documents_share_token_idx ON documents(share_token) WHERE share_token IS NOT NULL;
