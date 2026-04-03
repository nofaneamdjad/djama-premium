-- ──────────────────────────────────────────────────────────────────────────
-- MIGRATION COMPLÈTE — garantit toutes les colonnes de la table documents
-- À exécuter dans Supabase Dashboard → SQL Editor
--
-- Idempotente : sans danger si la table existe déjà, dans n'importe quel état.
-- Chaque ALTER TABLE ADD COLUMN IF NOT EXISTS ne fait rien si la colonne existe.
-- ──────────────────────────────────────────────────────────────────────────

-- ── 1. Créer la table si elle n'existe pas encore ────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 2. Ajouter chaque colonne manquante (sans danger si déjà présente) ───

-- Identité du document
ALTER TABLE documents ADD COLUMN IF NOT EXISTS type    text NOT NULL DEFAULT 'facture';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS numero  text NOT NULL DEFAULT '';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS statut  text NOT NULL DEFAULT 'brouillon';

-- Émetteur (votre entreprise)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS emetteur_nom     text NOT NULL DEFAULT '';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS emetteur_email   text NOT NULL DEFAULT '';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS emetteur_adresse text NOT NULL DEFAULT '';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS emetteur_siret   text NOT NULL DEFAULT '';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS emetteur_logo    text NOT NULL DEFAULT '';

-- Client
ALTER TABLE documents ADD COLUMN IF NOT EXISTS client_nom     text NOT NULL DEFAULT '';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS client_email   text NOT NULL DEFAULT '';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS client_adresse text NOT NULL DEFAULT '';

-- Dates
ALTER TABLE documents ADD COLUMN IF NOT EXISTS date_document date NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS date_echeance date;

-- RIB / Coordonnées bancaires
ALTER TABLE documents ADD COLUMN IF NOT EXISTS rib_titulaire text NOT NULL DEFAULT '';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS rib_iban      text NOT NULL DEFAULT '';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS rib_bic       text NOT NULL DEFAULT '';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS rib_banque    text NOT NULL DEFAULT '';

-- Mémos
ALTER TABLE documents ADD COLUMN IF NOT EXISTS notes      text NOT NULL DEFAULT '';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS conditions text NOT NULL DEFAULT '';

-- Couleur accent
ALTER TABLE documents ADD COLUMN IF NOT EXISTS couleur text NOT NULL DEFAULT '#c9a55a';

-- Totaux dénormalisés
ALTER TABLE documents ADD COLUMN IF NOT EXISTS total_ht  numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS total_tva numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS total_ttc numeric(12,2) NOT NULL DEFAULT 0;

-- ── 3. Table document_items ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  position    integer       NOT NULL DEFAULT 0,
  description text          NOT NULL DEFAULT '',
  quantity    numeric(10,3) NOT NULL DEFAULT 1,
  unit_price  numeric(12,2) NOT NULL DEFAULT 0,
  vat_rate    numeric(5,2)  NOT NULL DEFAULT 20
);

-- ── 4. Index ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS documents_user_id_idx      ON documents(user_id);
CREATE INDEX IF NOT EXISTS documents_user_updated_idx ON documents(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS document_items_doc_id_idx  ON document_items(document_id, position);

-- ── 5. Trigger updated_at ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_documents_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS documents_set_updated_at ON documents;
CREATE TRIGGER documents_set_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION set_documents_updated_at();

-- ── 6. RLS ────────────────────────────────────────────────────────────────
ALTER TABLE documents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "docs_select_own" ON documents;
DROP POLICY IF EXISTS "docs_insert_own" ON documents;
DROP POLICY IF EXISTS "docs_update_own" ON documents;
DROP POLICY IF EXISTS "docs_delete_own" ON documents;

CREATE POLICY "docs_select_own" ON documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "docs_insert_own" ON documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "docs_update_own" ON documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "docs_delete_own" ON documents FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "items_select_own" ON document_items;
DROP POLICY IF EXISTS "items_insert_own" ON document_items;
DROP POLICY IF EXISTS "items_update_own" ON document_items;
DROP POLICY IF EXISTS "items_delete_own" ON document_items;

CREATE POLICY "items_select_own" ON document_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.user_id = auth.uid()));
CREATE POLICY "items_insert_own" ON document_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.user_id = auth.uid()));
CREATE POLICY "items_update_own" ON document_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.user_id = auth.uid()));
CREATE POLICY "items_delete_own" ON document_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.user_id = auth.uid()));

-- ── 7. Recharger le cache schema PostgREST ────────────────────────────────
NOTIFY pgrst, 'reload schema';

-- ── 8. Vérification : colonnes présentes après migration ──────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'documents'
ORDER BY ordinal_position;
