-- Journal d'audit immuable pour les documents (factures, devis, avoirs)
-- Immutabilité garantie : aucune RLS policy INSERT/UPDATE/DELETE côté client
-- Seul le service_role (API routes) peut écrire dans cette table.

CREATE TABLE IF NOT EXISTS document_audit_log (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid        NOT NULL REFERENCES documents(id)   ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  action      text        NOT NULL,
  details     jsonb       NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE document_audit_log ENABLE ROW LEVEL SECURITY;

-- Lecture : propriétaire du document uniquement
CREATE POLICY "audit_log_select_own" ON document_audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- Pas de policy INSERT/UPDATE/DELETE via RLS
-- → impossible de modifier ou supprimer via client Supabase
-- → seul le service_role (backend) peut insérer

CREATE INDEX IF NOT EXISTS audit_log_doc_created_idx
  ON document_audit_log (document_id, created_at DESC);
