-- 162_vendors.sql
-- Module Prestataires & Partenaires — fondations complètes
-- Tables: vendors, vendor_missions, vendor_documents, vendor_quote_requests, vendor_quote_responses

-- ─── vendors ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendors (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid        REFERENCES organizations(id) ON DELETE SET NULL,

  -- Identité
  name            text        NOT NULL DEFAULT '',
  type            text        NOT NULL DEFAULT 'prestataire'
                              CHECK (type IN ('prestataire','agence','freelance','cabinet','consultant','autre')),
  relationship    text        NOT NULL DEFAULT 'prestataire'
                              CHECK (relationship IN ('prestataire','partenaire','sous-traitant','fournisseur')),
  status          text        NOT NULL DEFAULT 'actif'
                              CHECK (status IN ('actif','inactif','prospect')),

  -- Spécialités et catégories
  speciality      text,
  specialities    text[],
  sector          text,
  tags            text[],

  -- Localisation
  country         text        NOT NULL DEFAULT 'France',
  city            text,
  address         text,
  website         text,
  linkedin        text,

  -- Contact principal
  contact_name    text,
  contact_email   text,
  contact_phone   text,
  contact_role    text,

  -- Relation
  since           date,
  rating          smallint    DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  notes           text,

  -- Lien CRM optionnel (non bloquant)
  crm_contact_id  uuid        REFERENCES contacts(id) ON DELETE SET NULL,

  -- Méta
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS vendors_user_id_idx         ON vendors (user_id);
CREATE INDEX IF NOT EXISTS vendors_organization_id_idx ON vendors (organization_id);
CREATE INDEX IF NOT EXISTS vendors_status_idx          ON vendors (status);
CREATE INDEX IF NOT EXISTS vendors_type_idx            ON vendors (type);

DROP POLICY IF EXISTS "vendors_select" ON vendors;
DROP POLICY IF EXISTS "vendors_insert" ON vendors;
DROP POLICY IF EXISTS "vendors_update" ON vendors;
DROP POLICY IF EXISTS "vendors_delete" ON vendors;

CREATE POLICY "vendors_select" ON vendors FOR SELECT USING (
  user_id = auth.uid()
  OR (organization_id IS NOT NULL AND is_org_member(organization_id))
);
CREATE POLICY "vendors_insert" ON vendors FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "vendors_update" ON vendors FOR UPDATE USING (
  user_id = auth.uid()
  OR (organization_id IS NOT NULL AND is_org_member(organization_id))
);
CREATE POLICY "vendors_delete" ON vendors FOR DELETE USING (user_id = auth.uid());


-- ─── vendor_missions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_missions (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid        REFERENCES organizations(id) ON DELETE SET NULL,
  vendor_id       uuid        NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  project_id      uuid        REFERENCES projects(id) ON DELETE SET NULL,

  title           text        NOT NULL DEFAULT '',
  description     text,
  status          text        NOT NULL DEFAULT 'en_cours'
                              CHECK (status IN ('prospect','en_cours','terminee','annulee')),
  start_date      date,
  end_date        date,
  amount          numeric(12,2),
  currency        text        NOT NULL DEFAULT 'EUR',
  notes           text,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vendor_missions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS vendor_missions_vendor_id_idx  ON vendor_missions (vendor_id);
CREATE INDEX IF NOT EXISTS vendor_missions_user_id_idx    ON vendor_missions (user_id);
CREATE INDEX IF NOT EXISTS vendor_missions_project_id_idx ON vendor_missions (project_id);
CREATE INDEX IF NOT EXISTS vendor_missions_status_idx     ON vendor_missions (status);

DROP POLICY IF EXISTS "vendor_missions_select" ON vendor_missions;
DROP POLICY IF EXISTS "vendor_missions_insert" ON vendor_missions;
DROP POLICY IF EXISTS "vendor_missions_update" ON vendor_missions;
DROP POLICY IF EXISTS "vendor_missions_delete" ON vendor_missions;

CREATE POLICY "vendor_missions_select" ON vendor_missions FOR SELECT USING (
  user_id = auth.uid()
  OR (organization_id IS NOT NULL AND is_org_member(organization_id))
);
CREATE POLICY "vendor_missions_insert" ON vendor_missions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "vendor_missions_update" ON vendor_missions FOR UPDATE USING (
  user_id = auth.uid()
  OR (organization_id IS NOT NULL AND is_org_member(organization_id))
);
CREATE POLICY "vendor_missions_delete" ON vendor_missions FOR DELETE USING (user_id = auth.uid());


-- ─── vendor_documents ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_documents (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id       uuid        NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  title           text        NOT NULL DEFAULT '',
  document_type   text        NOT NULL DEFAULT 'autre'
                              CHECK (document_type IN ('contrat','devis','facture','nda','bon_commande','autre')),
  document_id     uuid        REFERENCES documents(id) ON DELETE SET NULL,
  contract_id     uuid        REFERENCES contracts(id) ON DELETE SET NULL,
  file_url        text,
  notes           text,
  doc_date        date,

  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vendor_documents ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS vendor_documents_vendor_id_idx ON vendor_documents (vendor_id);
CREATE INDEX IF NOT EXISTS vendor_documents_user_id_idx   ON vendor_documents (user_id);

DROP POLICY IF EXISTS "vendor_documents_select" ON vendor_documents;
DROP POLICY IF EXISTS "vendor_documents_insert" ON vendor_documents;
DROP POLICY IF EXISTS "vendor_documents_update" ON vendor_documents;
DROP POLICY IF EXISTS "vendor_documents_delete" ON vendor_documents;

CREATE POLICY "vendor_documents_select" ON vendor_documents FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.id = vendor_id
    AND (v.user_id = auth.uid() OR (v.organization_id IS NOT NULL AND is_org_member(v.organization_id)))
  )
);
CREATE POLICY "vendor_documents_insert" ON vendor_documents FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "vendor_documents_update" ON vendor_documents FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "vendor_documents_delete" ON vendor_documents FOR DELETE USING (user_id = auth.uid());


-- ─── vendor_quote_requests ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_quote_requests (
  id                  uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id     uuid        REFERENCES organizations(id) ON DELETE SET NULL,
  project_id          uuid        REFERENCES projects(id) ON DELETE SET NULL,
  selected_vendor_id  uuid        REFERENCES vendors(id) ON DELETE SET NULL,

  title               text        NOT NULL DEFAULT '',
  description         text,
  category            text,
  deadline            date,
  budget_max          numeric(12,2),
  currency            text        NOT NULL DEFAULT 'EUR',
  status              text        NOT NULL DEFAULT 'ouvert'
                                  CHECK (status IN ('ouvert','attribue','ferme','annule')),
  notes               text,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vendor_quote_requests ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS vqr_user_id_idx ON vendor_quote_requests (user_id);
CREATE INDEX IF NOT EXISTS vqr_status_idx  ON vendor_quote_requests (status);

DROP POLICY IF EXISTS "vqr_select" ON vendor_quote_requests;
DROP POLICY IF EXISTS "vqr_insert" ON vendor_quote_requests;
DROP POLICY IF EXISTS "vqr_update" ON vendor_quote_requests;
DROP POLICY IF EXISTS "vqr_delete" ON vendor_quote_requests;

CREATE POLICY "vqr_select" ON vendor_quote_requests FOR SELECT USING (
  user_id = auth.uid()
  OR (organization_id IS NOT NULL AND is_org_member(organization_id))
);
CREATE POLICY "vqr_insert" ON vendor_quote_requests FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "vqr_update" ON vendor_quote_requests FOR UPDATE USING (
  user_id = auth.uid()
  OR (organization_id IS NOT NULL AND is_org_member(organization_id))
);
CREATE POLICY "vqr_delete" ON vendor_quote_requests FOR DELETE USING (user_id = auth.uid());


-- ─── vendor_quote_responses ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_quote_responses (
  id               uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_request_id uuid        NOT NULL REFERENCES vendor_quote_requests(id) ON DELETE CASCADE,
  vendor_id        uuid        NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  amount           numeric(12,2),
  currency         text        NOT NULL DEFAULT 'EUR',
  description      text,
  delivery_days    integer,
  validity_date    date,
  status           text        NOT NULL DEFAULT 'recu'
                               CHECK (status IN ('recu','retenu','rejete')),
  document_id      uuid        REFERENCES documents(id) ON DELETE SET NULL,
  notes            text,

  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vendor_quote_responses ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS vqresp_qr_id_idx     ON vendor_quote_responses (quote_request_id);
CREATE INDEX IF NOT EXISTS vqresp_vendor_id_idx ON vendor_quote_responses (vendor_id);
CREATE INDEX IF NOT EXISTS vqresp_user_id_idx   ON vendor_quote_responses (user_id);

DROP POLICY IF EXISTS "vqresp_select" ON vendor_quote_responses;
DROP POLICY IF EXISTS "vqresp_insert" ON vendor_quote_responses;
DROP POLICY IF EXISTS "vqresp_update" ON vendor_quote_responses;
DROP POLICY IF EXISTS "vqresp_delete" ON vendor_quote_responses;

CREATE POLICY "vqresp_select" ON vendor_quote_responses FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "vqresp_insert" ON vendor_quote_responses FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "vqresp_update" ON vendor_quote_responses FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "vqresp_delete" ON vendor_quote_responses FOR DELETE USING (user_id = auth.uid());


-- ─── Triggers updated_at ──────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TRIGGER vendors_updated_at
    BEFORE UPDATE ON vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN
  CREATE TRIGGER vendor_missions_updated_at
    BEFORE UPDATE ON vendor_missions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN
  CREATE TRIGGER vendor_quote_requests_updated_at
    BEFORE UPDATE ON vendor_quote_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN
  CREATE TRIGGER vendor_quote_responses_updated_at
    BEFORE UPDATE ON vendor_quote_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
