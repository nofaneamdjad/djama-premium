-- ──────────────────────────────────────────────────────────────────────────
-- Migration : tables documents + document_items — Factures & Devis DJAMA
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ──────────────────────────────────────────────────────────────────────────

-- ── Table documents ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type             text         NOT NULL DEFAULT 'facture'
                                CHECK (type IN ('devis', 'facture')),
  numero           text         NOT NULL DEFAULT '',
  statut           text         NOT NULL DEFAULT 'brouillon'
                                CHECK (statut IN ('brouillon','envoyé','payé','en_retard')),
  -- Émetteur (vendeur)
  emetteur_nom     text         NOT NULL DEFAULT '',
  emetteur_email   text         NOT NULL DEFAULT '',
  emetteur_adresse text         NOT NULL DEFAULT '',
  emetteur_siret   text         NOT NULL DEFAULT '',
  -- Client
  client_nom       text         NOT NULL DEFAULT '',
  client_email     text         NOT NULL DEFAULT '',
  client_adresse   text         NOT NULL DEFAULT '',
  -- Dates
  date_document    date         NOT NULL DEFAULT CURRENT_DATE,
  date_echeance    date,
  -- Mémos
  notes            text         NOT NULL DEFAULT '',
  conditions       text         NOT NULL DEFAULT '',
  -- Totaux dénormalisés (mis à jour à chaque save)
  total_ht         numeric(12,2) NOT NULL DEFAULT 0,
  total_tva        numeric(12,2) NOT NULL DEFAULT 0,
  total_ttc        numeric(12,2) NOT NULL DEFAULT 0,
  -- Timestamps
  created_at       timestamptz  NOT NULL DEFAULT now(),
  updated_at       timestamptz  NOT NULL DEFAULT now()
);

-- ── Table document_items ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_items (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   uuid         NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  position      integer      NOT NULL DEFAULT 0,
  description   text         NOT NULL DEFAULT '',
  quantity      numeric(10,3) NOT NULL DEFAULT 1,
  unit_price    numeric(12,2) NOT NULL DEFAULT 0,
  vat_rate      numeric(5,2)  NOT NULL DEFAULT 20
);

-- ── Index ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS documents_user_id_idx       ON documents(user_id);
CREATE INDEX IF NOT EXISTS documents_user_updated_idx  ON documents(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS document_items_doc_id_idx   ON document_items(document_id, position);

-- ── updated_at trigger ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_documents_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS documents_set_updated_at ON documents;
CREATE TRIGGER documents_set_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION set_documents_updated_at();

-- ── Row Level Security ─────────────────────────────────────────────────────
ALTER TABLE documents       ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_items  ENABLE ROW LEVEL SECURITY;

-- documents : lecture / écriture / suppression sur ses propres documents
DROP POLICY IF EXISTS "docs_select_own"  ON documents;
DROP POLICY IF EXISTS "docs_insert_own"  ON documents;
DROP POLICY IF EXISTS "docs_update_own"  ON documents;
DROP POLICY IF EXISTS "docs_delete_own"  ON documents;

CREATE POLICY "docs_select_own" ON documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "docs_insert_own" ON documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "docs_update_own" ON documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "docs_delete_own" ON documents FOR DELETE USING (auth.uid() = user_id);

-- document_items : accès via le document parent
DROP POLICY IF EXISTS "items_select_own"  ON document_items;
DROP POLICY IF EXISTS "items_insert_own"  ON document_items;
DROP POLICY IF EXISTS "items_update_own"  ON document_items;
DROP POLICY IF EXISTS "items_delete_own"  ON document_items;

CREATE POLICY "items_select_own" ON document_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.user_id = auth.uid()));
CREATE POLICY "items_insert_own" ON document_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.user_id = auth.uid()));
CREATE POLICY "items_update_own" ON document_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.user_id = auth.uid()));
CREATE POLICY "items_delete_own" ON document_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.user_id = auth.uid()));
