-- Colonnes client manquantes dans la table documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS client_societe   text NOT NULL DEFAULT '';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS client_telephone text NOT NULL DEFAULT '';

-- Extension de la limite pour les requêtes de listing (index sur updated_at)
CREATE INDEX IF NOT EXISTS idx_documents_user_updated ON documents(user_id, updated_at DESC);
