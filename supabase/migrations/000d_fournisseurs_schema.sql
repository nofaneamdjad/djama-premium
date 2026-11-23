-- ════════════════════════════════════════════════════════
-- MODULE FOURNISSEURS — Schéma complet
-- ════════════════════════════════════════════════════════

-- ── 1. Fiche fournisseur ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fournisseurs (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Identité
  company_name        text        NOT NULL,
  contact_name        text        DEFAULT '',
  email               text        DEFAULT '',
  phone               text        DEFAULT '',
  address             text        DEFAULT '',
  city                text        DEFAULT '',
  country             text        DEFAULT 'France',
  website             text        DEFAULT '',
  -- Légal
  siret               text        DEFAULT '',
  vat_number          text        DEFAULT '',
  -- Finance
  iban                text        DEFAULT '',
  payment_method      text        DEFAULT 'virement',   -- virement | cheque | prelevement | carte
  payment_terms       text        DEFAULT '30 jours',
  currency            text        DEFAULT 'EUR',
  credit_limit        numeric     DEFAULT 0,
  -- Catégorie
  category            text        DEFAULT 'autre',      -- produits | services | logiciels | matieres | transport | autre
  notes               text        DEFAULT '',
  is_active           boolean     DEFAULT true,
  -- Scores évaluation (0-5)
  score_reliability   numeric     DEFAULT 0,
  score_quality       numeric     DEFAULT 0,
  score_price         numeric     DEFAULT 0,
  score_delays        numeric     DEFAULT 0,
  total_orders        integer     DEFAULT 0,
  total_late_orders   integer     DEFAULT 0,
  -- Contrat lié
  contract_expires_at date,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fourn_user     ON fournisseurs(user_id);
CREATE INDEX IF NOT EXISTS idx_fourn_category ON fournisseurs(category);
ALTER TABLE fournisseurs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fourn_own" ON fournisseurs;
CREATE POLICY "fourn_own" ON fournisseurs
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 2. Catalogue fournisseur ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fournisseur_catalog (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  fournisseur_id   uuid    REFERENCES fournisseurs(id) ON DELETE CASCADE,
  name             text    NOT NULL,
  reference        text    DEFAULT '',
  description      text    DEFAULT '',
  category         text    DEFAULT '',
  unit             text    DEFAULT 'pièce',
  unit_price       numeric DEFAULT 0,
  currency         text    DEFAULT 'EUR',
  discount_percent numeric DEFAULT 0,
  min_quantity     numeric DEFAULT 1,
  lead_time_days   integer DEFAULT 7,
  is_active        boolean DEFAULT true,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fcat_user    ON fournisseur_catalog(user_id);
CREATE INDEX IF NOT EXISTS idx_fcat_fourn   ON fournisseur_catalog(fournisseur_id);
ALTER TABLE fournisseur_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fcat_own" ON fournisseur_catalog;
CREATE POLICY "fcat_own" ON fournisseur_catalog
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 3. Commandes fournisseurs ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fournisseur_orders (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  fournisseur_id    uuid        REFERENCES fournisseurs(id) ON DELETE SET NULL,
  fournisseur_name  text        DEFAULT '',
  order_number      text        DEFAULT '',
  -- Statut : draft | sent | confirmed | in_delivery | received | partial | cancelled
  status            text        DEFAULT 'draft',
  -- Dates
  order_date        date        NOT NULL DEFAULT CURRENT_DATE,
  expected_date     date,
  received_date     date,
  -- Suivi livraison
  tracking_number   text        DEFAULT '',
  shipped_at        date,
  -- Finance
  subtotal          numeric     DEFAULT 0,
  vat_amount        numeric     DEFAULT 0,
  total_amount      numeric     DEFAULT 0,
  currency          text        DEFAULT 'EUR',
  payment_status    text        DEFAULT 'unpaid',  -- unpaid | partial | paid
  -- Réception
  quality_issues    text        DEFAULT '',
  reception_notes   text        DEFAULT '',
  notes             text        DEFAULT '',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ford_user   ON fournisseur_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_ford_fourn  ON fournisseur_orders(fournisseur_id);
CREATE INDEX IF NOT EXISTS idx_ford_status ON fournisseur_orders(status);
ALTER TABLE fournisseur_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ford_own" ON fournisseur_orders;
CREATE POLICY "ford_own" ON fournisseur_orders
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 4. Lignes de commande ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fournisseur_order_items (
  id                uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          uuid    REFERENCES fournisseur_orders(id) ON DELETE CASCADE,
  catalog_id        uuid    REFERENCES fournisseur_catalog(id) ON DELETE SET NULL,
  name              text    NOT NULL,
  reference         text    DEFAULT '',
  quantity          numeric DEFAULT 1,
  received_quantity numeric DEFAULT 0,
  unit_price        numeric DEFAULT 0,
  discount_percent  numeric DEFAULT 0,
  vat_rate          numeric DEFAULT 20,
  total_price       numeric DEFAULT 0
);

ALTER TABLE fournisseur_order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fitem_own" ON fournisseur_order_items;
CREATE POLICY "fitem_own" ON fournisseur_order_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM fournisseur_orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

-- ── 5. Factures fournisseurs reçues ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fournisseur_invoices (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  fournisseur_id    uuid        REFERENCES fournisseurs(id) ON DELETE SET NULL,
  fournisseur_name  text        DEFAULT '',
  order_id          uuid        REFERENCES fournisseur_orders(id) ON DELETE SET NULL,
  invoice_number    text        DEFAULT '',
  issue_date        date        NOT NULL DEFAULT CURRENT_DATE,
  due_date          date,
  -- Montants
  subtotal          numeric     DEFAULT 0,
  vat_amount        numeric     DEFAULT 0,
  total_amount      numeric     DEFAULT 0,
  paid_amount       numeric     DEFAULT 0,
  currency          text        DEFAULT 'EUR',
  -- Statut : unpaid | partial | paid | overdue | disputed
  status            text        DEFAULT 'unpaid',
  payment_date      date,
  payment_method    text        DEFAULT '',
  notes             text        DEFAULT '',
  pdf_url           text        DEFAULT '',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finv_user   ON fournisseur_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_finv_fourn  ON fournisseur_invoices(fournisseur_id);
CREATE INDEX IF NOT EXISTS idx_finv_status ON fournisseur_invoices(status);
CREATE INDEX IF NOT EXISTS idx_finv_due    ON fournisseur_invoices(due_date);
ALTER TABLE fournisseur_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "finv_own" ON fournisseur_invoices;
CREATE POLICY "finv_own" ON fournisseur_invoices
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 6. Évaluations fournisseur ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fournisseur_ratings (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  fournisseur_id  uuid    REFERENCES fournisseurs(id) ON DELETE CASCADE,
  order_id        uuid    REFERENCES fournisseur_orders(id) ON DELETE SET NULL,
  reliability     integer DEFAULT 3,   -- 1-5
  quality         integer DEFAULT 3,
  price           integer DEFAULT 3,
  delays          integer DEFAULT 3,
  comment         text    DEFAULT '',
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_frat_fourn ON fournisseur_ratings(fournisseur_id);
ALTER TABLE fournisseur_ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "frat_own" ON fournisseur_ratings;
CREATE POLICY "frat_own" ON fournisseur_ratings
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 7. Documents fournisseur ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fournisseur_documents (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  fournisseur_id  uuid    REFERENCES fournisseurs(id) ON DELETE CASCADE,
  -- contrat | devis | bon_commande | bon_livraison | facture | certificat | autre
  type            text    DEFAULT 'autre',
  name            text    NOT NULL,
  url             text    DEFAULT '',
  expiry_date     date,
  notes           text    DEFAULT '',
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fdoc_fourn ON fournisseur_documents(fournisseur_id);
ALTER TABLE fournisseur_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fdoc_own" ON fournisseur_documents;
CREATE POLICY "fdoc_own" ON fournisseur_documents
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 8. Triggers updated_at ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_fourn_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS fourn_updated_at ON fournisseurs;
CREATE TRIGGER fourn_updated_at BEFORE UPDATE ON fournisseurs FOR EACH ROW EXECUTE FUNCTION update_fourn_timestamp();

DROP TRIGGER IF EXISTS fcat_updated_at ON fournisseur_catalog;
CREATE TRIGGER fcat_updated_at BEFORE UPDATE ON fournisseur_catalog FOR EACH ROW EXECUTE FUNCTION update_fourn_timestamp();

DROP TRIGGER IF EXISTS ford_updated_at ON fournisseur_orders;
CREATE TRIGGER ford_updated_at BEFORE UPDATE ON fournisseur_orders FOR EACH ROW EXECUTE FUNCTION update_fourn_timestamp();

DROP TRIGGER IF EXISTS finv_updated_at ON fournisseur_invoices;
CREATE TRIGGER finv_updated_at BEFORE UPDATE ON fournisseur_invoices FOR EACH ROW EXECUTE FUNCTION update_fourn_timestamp();
