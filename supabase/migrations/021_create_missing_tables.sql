-- ═══════════════════════════════════════════════════════════════
-- DJAMA — Migration 021 : Fix tables manquantes (018 non appliqué)
-- Copie-colle ce fichier dans l'éditeur SQL de Supabase Dashboard
-- ═══════════════════════════════════════════════════════════════

-- ── 1. CONTACTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL DEFAULT '',
  email       text,
  phone       text,
  company     text,
  status      text        NOT NULL DEFAULT 'prospect',
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ── 2. TIME_ENTRIES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS time_entries (
  id               uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  project          text        NOT NULL DEFAULT '',
  client_name      text,
  description      text,
  date             date        NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes integer     NOT NULL DEFAULT 0,
  hourly_rate      numeric(10,2),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ── 3. EXPENSES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id               uuid          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          uuid          REFERENCES auth.users(id) ON DELETE CASCADE,
  date             date          NOT NULL DEFAULT CURRENT_DATE,
  category         text          NOT NULL DEFAULT 'autre',
  description      text          NOT NULL DEFAULT '',
  amount           numeric(10,2) NOT NULL DEFAULT 0,
  created_at       timestamptz   NOT NULL DEFAULT now(),
  updated_at       timestamptz   NOT NULL DEFAULT now()
);
-- Colonnes étendues requises par migrations 074+ (idempotent si expenses vient de 018)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS status           text          DEFAULT 'draft';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS vat_amount       numeric(12,2) DEFAULT 0;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS vat_recoverable  boolean       DEFAULT false;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS organization_id  uuid;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS deleted_at       timestamptz;

-- ── 4. CONTRACTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contracts (
  id          uuid          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid          REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text          NOT NULL DEFAULT '',
  client_name text          NOT NULL DEFAULT '',
  type        text          NOT NULL DEFAULT 'prestation',
  -- prestation | nda | cdi | cdd | autre
  content     text          NOT NULL DEFAULT '',
  status      text          NOT NULL DEFAULT 'brouillon',
  -- brouillon | envoyé | signé | expiré
  amount      numeric(10,2),
  start_date  date,
  end_date    date,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now()
);

-- ── 5. REVIEWS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name text        NOT NULL DEFAULT '',
  rating      integer     NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  message     text,
  source      text        NOT NULL DEFAULT 'direct',
  -- google | linkedin | direct | autre
  project     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── RLS ─────────────────────────────────────────────────────────
ALTER TABLE contacts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews      ENABLE ROW LEVEL SECURITY;

-- Contacts
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='contacts' AND policyname='contacts_own') THEN
    CREATE POLICY "contacts_own" ON contacts USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Time entries
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='time_entries' AND policyname='time_entries_own') THEN
    CREATE POLICY "time_entries_own" ON time_entries USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Expenses
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='expenses' AND policyname='expenses_own') THEN
    CREATE POLICY "expenses_own" ON expenses USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Contracts
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='contracts' AND policyname='contracts_own') THEN
    CREATE POLICY "contracts_own" ON contracts USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Reviews
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reviews' AND policyname='reviews_own') THEN
    CREATE POLICY "reviews_own" ON reviews USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── Index ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contacts_user      ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user  ON time_entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user      ON expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_user     ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user       ON reviews(user_id);

-- ── Trigger updated_at ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_col()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='contacts_updated_at') THEN
    CREATE TRIGGER contacts_updated_at
      BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_col();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='time_entries_updated_at') THEN
    CREATE TRIGGER time_entries_updated_at
      BEFORE UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_col();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='expenses_updated_at') THEN
    CREATE TRIGGER expenses_updated_at
      BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_col();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='contracts_updated_at') THEN
    CREATE TRIGGER contracts_updated_at
      BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_col();
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- TABLES MANQUANTES — fichiers 000x/001x ignorés par le CLI Supabase
-- (CREATE TABLE IF NOT EXISTS = no-op si la table existe déjà)
-- ═══════════════════════════════════════════════════════════════

-- ── NOTES DE FRAIS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expense_reports (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  title        text        NOT NULL,
  period_start date,
  period_end   date,
  status       text        DEFAULT 'draft',
  total_amount numeric     DEFAULT 0,
  notes        text        DEFAULT '',
  submitted_at timestamptz,
  approved_at  timestamptz,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_expense_reports_user ON expense_reports(user_id);
ALTER TABLE expense_reports ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='expense_reports' AND policyname='expense_reports_own') THEN
    CREATE POLICY "expense_reports_own" ON expense_reports
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS expense_budgets (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  category   text    NOT NULL,
  amount     numeric NOT NULL DEFAULT 0,
  period     text    DEFAULT 'monthly',
  year       integer NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer,
  month      integer,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category, period, year, month)
);
CREATE INDEX IF NOT EXISTS idx_expense_budgets_user ON expense_budgets(user_id);
ALTER TABLE expense_budgets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='expense_budgets' AND policyname='expense_budgets_own') THEN
    CREATE POLICY "expense_budgets_own" ON expense_budgets
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ── TRÉSORERIE ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS treasury_accounts (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text    NOT NULL DEFAULT 'Compte principal',
  bank        text    DEFAULT '',
  iban        text    DEFAULT '',
  balance     numeric DEFAULT 0,
  currency    text    DEFAULT 'EUR',
  color       text    DEFAULT '#3b82f6',
  is_default  boolean DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_taccounts_user ON treasury_accounts(user_id);
ALTER TABLE treasury_accounts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='treasury_accounts' AND policyname='taccounts_own') THEN
    CREATE POLICY "taccounts_own" ON treasury_accounts
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS treasury_transactions (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id       uuid    REFERENCES treasury_accounts(id) ON DELETE SET NULL,
  type             text    NOT NULL DEFAULT 'expense',
  category         text    DEFAULT 'autre',
  label            text    NOT NULL DEFAULT '',
  amount           numeric NOT NULL DEFAULT 0,
  currency         text    DEFAULT 'EUR',
  date             date    NOT NULL DEFAULT CURRENT_DATE,
  payment_method   text    DEFAULT 'virement',
  status           text    DEFAULT 'completed',
  client_supplier  text    DEFAULT '',
  invoice_ref      text    DEFAULT '',
  project          text    DEFAULT '',
  notes            text    DEFAULT '',
  created_at       timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ttransactions_user ON treasury_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ttransactions_date ON treasury_transactions(date);
ALTER TABLE treasury_transactions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='treasury_transactions' AND policyname='ttransactions_own') THEN
    CREATE POLICY "ttransactions_own" ON treasury_transactions
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS treasury_recurring (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text    NOT NULL DEFAULT 'expense',
  label      text    NOT NULL,
  amount     numeric NOT NULL DEFAULT 0,
  frequency  text    DEFAULT 'monthly',
  next_date  date,
  category   text    DEFAULT 'autre',
  active     boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trecurring_user ON treasury_recurring(user_id);
ALTER TABLE treasury_recurring ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='treasury_recurring' AND policyname='trecurring_own') THEN
    CREATE POLICY "trecurring_own" ON treasury_recurring
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ── CRM — extension de contacts + nouvelles tables ───────────────
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS address        text    DEFAULT '';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS city           text    DEFAULT '';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS country        text    DEFAULT '';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS sector         text    DEFAULT '';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS company_size   text    DEFAULT '';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source         text    DEFAULT '';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS priority       text    DEFAULT 'normal';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS type           text    DEFAULT 'prospect';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS website        text    DEFAULT '';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS linkedin       text    DEFAULT '';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS budget         numeric DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS interest_level integer DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tags           text[]  DEFAULT '{}';

CREATE TABLE IF NOT EXISTS contact_activities (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id    uuid        REFERENCES contacts(id)   ON DELETE CASCADE,
  type          text        NOT NULL DEFAULT 'note',
  title         text        NOT NULL,
  description   text        DEFAULT '',
  activity_date timestamptz DEFAULT now(),
  duration_min  integer     DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activities_contact ON contact_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_user    ON contact_activities(user_id);
ALTER TABLE contact_activities ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='contact_activities' AND policyname='activities_own') THEN
    CREATE POLICY "activities_own" ON contact_activities
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS opportunities (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid    REFERENCES auth.users(id)  ON DELETE CASCADE,
  contact_id      uuid    REFERENCES contacts(id)    ON DELETE SET NULL,
  title           text    NOT NULL,
  amount          numeric DEFAULT 0,
  stage           text    DEFAULT 'nouveau',
  probability     integer DEFAULT 20,
  close_date      date,
  product_service text    DEFAULT '',
  notes           text    DEFAULT '',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_opps_contact ON opportunities(contact_id);
CREATE INDEX IF NOT EXISTS idx_opps_user    ON opportunities(user_id);
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='opportunities' AND policyname='opportunities_own') THEN
    CREATE POLICY "opportunities_own" ON opportunities
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS crm_tasks (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid    REFERENCES auth.users(id)    ON DELETE CASCADE,
  contact_id     uuid    REFERENCES contacts(id)      ON DELETE SET NULL,
  opportunity_id uuid    REFERENCES opportunities(id) ON DELETE SET NULL,
  title          text    NOT NULL,
  description    text    DEFAULT '',
  due_date       date,
  priority       text    DEFAULT 'normal',
  done           boolean DEFAULT false,
  type           text    DEFAULT 'action',
  created_at     timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_contact ON crm_tasks(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_user    ON crm_tasks(user_id);
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='crm_tasks' AND policyname='crm_tasks_own') THEN
    CREATE POLICY "crm_tasks_own" ON crm_tasks
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS tickets (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id  uuid    REFERENCES contacts(id)   ON DELETE SET NULL,
  title       text    NOT NULL,
  description text    DEFAULT '',
  status      text    DEFAULT 'ouvert',
  priority    text    DEFAULT 'normale',
  satisfaction integer DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tickets_contact ON tickets(contact_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user    ON tickets(user_id);
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tickets' AND policyname='tickets_own') THEN
    CREATE POLICY "tickets_own" ON tickets
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ── FOURNISSEURS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fournisseurs (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name        text        NOT NULL,
  contact_name        text        DEFAULT '',
  email               text        DEFAULT '',
  phone               text        DEFAULT '',
  address             text        DEFAULT '',
  city                text        DEFAULT '',
  country             text        DEFAULT 'France',
  website             text        DEFAULT '',
  siret               text        DEFAULT '',
  vat_number          text        DEFAULT '',
  iban                text        DEFAULT '',
  payment_method      text        DEFAULT 'virement',
  payment_terms       text        DEFAULT '30 jours',
  currency            text        DEFAULT 'EUR',
  credit_limit        numeric     DEFAULT 0,
  category            text        DEFAULT 'autre',
  notes               text        DEFAULT '',
  is_active           boolean     DEFAULT true,
  score_reliability   numeric     DEFAULT 0,
  score_quality       numeric     DEFAULT 0,
  score_price         numeric     DEFAULT 0,
  score_delays        numeric     DEFAULT 0,
  total_orders        integer     DEFAULT 0,
  total_late_orders   integer     DEFAULT 0,
  contract_expires_at date,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fourn_user     ON fournisseurs(user_id);
CREATE INDEX IF NOT EXISTS idx_fourn_category ON fournisseurs(category);
ALTER TABLE fournisseurs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='fournisseurs' AND policyname='fourn_own') THEN
    CREATE POLICY "fourn_own" ON fournisseurs
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

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
CREATE INDEX IF NOT EXISTS idx_fcat_user  ON fournisseur_catalog(user_id);
CREATE INDEX IF NOT EXISTS idx_fcat_fourn ON fournisseur_catalog(fournisseur_id);
ALTER TABLE fournisseur_catalog ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='fournisseur_catalog' AND policyname='fcat_own') THEN
    CREATE POLICY "fcat_own" ON fournisseur_catalog
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS fournisseur_orders (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  fournisseur_id    uuid        REFERENCES fournisseurs(id) ON DELETE SET NULL,
  fournisseur_name  text        DEFAULT '',
  order_number      text        DEFAULT '',
  status            text        DEFAULT 'draft',
  order_date        date        NOT NULL DEFAULT CURRENT_DATE,
  expected_date     date,
  received_date     date,
  tracking_number   text        DEFAULT '',
  shipped_at        date,
  subtotal          numeric     DEFAULT 0,
  vat_amount        numeric     DEFAULT 0,
  total_amount      numeric     DEFAULT 0,
  currency          text        DEFAULT 'EUR',
  payment_status    text        DEFAULT 'unpaid',
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
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='fournisseur_orders' AND policyname='ford_own') THEN
    CREATE POLICY "ford_own" ON fournisseur_orders
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

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
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='fournisseur_order_items' AND policyname='fitem_own') THEN
    CREATE POLICY "fitem_own" ON fournisseur_order_items FOR ALL USING (
      EXISTS (SELECT 1 FROM fournisseur_orders o WHERE o.id = order_id AND o.user_id = auth.uid())
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS fournisseur_invoices (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  fournisseur_id    uuid        REFERENCES fournisseurs(id) ON DELETE SET NULL,
  fournisseur_name  text        DEFAULT '',
  order_id          uuid        REFERENCES fournisseur_orders(id) ON DELETE SET NULL,
  invoice_number    text        DEFAULT '',
  issue_date        date        NOT NULL DEFAULT CURRENT_DATE,
  due_date          date,
  subtotal          numeric     DEFAULT 0,
  vat_amount        numeric     DEFAULT 0,
  total_amount      numeric     DEFAULT 0,
  paid_amount       numeric     DEFAULT 0,
  currency          text        DEFAULT 'EUR',
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
ALTER TABLE fournisseur_invoices ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='fournisseur_invoices' AND policyname='finv_own') THEN
    CREATE POLICY "finv_own" ON fournisseur_invoices
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS fournisseur_ratings (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  fournisseur_id  uuid    REFERENCES fournisseurs(id) ON DELETE CASCADE,
  order_id        uuid    REFERENCES fournisseur_orders(id) ON DELETE SET NULL,
  reliability     integer DEFAULT 3,
  quality         integer DEFAULT 3,
  price           integer DEFAULT 3,
  delays          integer DEFAULT 3,
  comment         text    DEFAULT '',
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_frat_fourn ON fournisseur_ratings(fournisseur_id);
ALTER TABLE fournisseur_ratings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='fournisseur_ratings' AND policyname='frat_own') THEN
    CREATE POLICY "frat_own" ON fournisseur_ratings
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS fournisseur_documents (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  fournisseur_id  uuid    REFERENCES fournisseurs(id) ON DELETE CASCADE,
  type            text    DEFAULT 'autre',
  name            text    NOT NULL,
  url             text    DEFAULT '',
  expiry_date     date,
  notes           text    DEFAULT '',
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fdoc_fourn ON fournisseur_documents(fournisseur_id);
ALTER TABLE fournisseur_documents ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='fournisseur_documents' AND policyname='fdoc_own') THEN
    CREATE POLICY "fdoc_own" ON fournisseur_documents
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ── STOCKS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_warehouses (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text    NOT NULL,
  address    text    DEFAULT '',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE stock_warehouses ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='stock_warehouses' AND policyname='swh_own') THEN
    CREATE POLICY "swh_own" ON stock_warehouses
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS stock_suppliers (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text    NOT NULL,
  contact         text    DEFAULT '',
  email           text    DEFAULT '',
  phone           text    DEFAULT '',
  address         text    DEFAULT '',
  payment_terms   text    DEFAULT '30 jours',
  lead_time_days  integer DEFAULT 7,
  notes           text    DEFAULT '',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
ALTER TABLE stock_suppliers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='stock_suppliers' AND policyname='ssup_own') THEN
    CREATE POLICY "ssup_own" ON stock_suppliers
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS stock_products (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id     uuid        REFERENCES stock_suppliers(id) ON DELETE SET NULL,
  warehouse_id    uuid        REFERENCES stock_warehouses(id) ON DELETE SET NULL,
  name            text        NOT NULL,
  sku             text        DEFAULT '',
  barcode         text        DEFAULT '',
  description     text        DEFAULT '',
  category        text        DEFAULT 'autre',
  image_url       text        DEFAULT '',
  unit            text        DEFAULT 'pièce',
  purchase_price  numeric     DEFAULT 0,
  sale_price      numeric     DEFAULT 0,
  vat_rate        numeric     DEFAULT 20,
  stock_current   numeric     DEFAULT 0,
  stock_minimum   numeric     DEFAULT 0,
  stock_reserved  numeric     DEFAULT 0,
  stock_on_order  numeric     DEFAULT 0,
  location        text        DEFAULT '',
  supplier_name   text        DEFAULT '',
  is_active       boolean     DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sprods_user     ON stock_products(user_id);
CREATE INDEX IF NOT EXISTS idx_sprods_category ON stock_products(category);
ALTER TABLE stock_products ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='stock_products' AND policyname='sprod_own') THEN
    CREATE POLICY "sprod_own" ON stock_products
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS stock_movements (
  id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id          uuid    REFERENCES stock_products(id) ON DELETE CASCADE,
  product_name        text    DEFAULT '',
  type                text    NOT NULL,
  quantity            numeric NOT NULL,
  before_qty          numeric DEFAULT 0,
  after_qty           numeric DEFAULT 0,
  warehouse_id        uuid    REFERENCES stock_warehouses(id) ON DELETE SET NULL,
  warehouse_name      text    DEFAULT '',
  to_warehouse_id     uuid    REFERENCES stock_warehouses(id) ON DELETE SET NULL,
  to_warehouse_name   text    DEFAULT '',
  reason              text    DEFAULT '',
  reference           text    DEFAULT '',
  unit_cost           numeric DEFAULT 0,
  date                date    NOT NULL DEFAULT CURRENT_DATE,
  created_at          timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_smov_user    ON stock_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_smov_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_smov_date    ON stock_movements(date);
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='stock_movements' AND policyname='smov_own') THEN
    CREATE POLICY "smov_own" ON stock_movements
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS stock_supplier_orders (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id     uuid    REFERENCES stock_suppliers(id) ON DELETE SET NULL,
  supplier_name   text    DEFAULT '',
  status          text    DEFAULT 'draft',
  order_date      date    DEFAULT CURRENT_DATE,
  expected_date   date,
  total_amount    numeric DEFAULT 0,
  notes           text    DEFAULT '',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
ALTER TABLE stock_supplier_orders ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='stock_supplier_orders' AND policyname='sord_own') THEN
    CREATE POLICY "sord_own" ON stock_supplier_orders
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS stock_order_items (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid    REFERENCES stock_supplier_orders(id) ON DELETE CASCADE,
  product_id      uuid    REFERENCES stock_products(id) ON DELETE SET NULL,
  product_name    text    DEFAULT '',
  quantity        numeric DEFAULT 0,
  unit_price      numeric DEFAULT 0,
  total_price     numeric DEFAULT 0
);
ALTER TABLE stock_order_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='stock_order_items' AND policyname='sitem_own') THEN
    CREATE POLICY "sitem_own" ON stock_order_items FOR ALL USING (
      EXISTS (SELECT 1 FROM stock_supplier_orders o WHERE o.id = order_id AND o.user_id = auth.uid())
    );
  END IF;
END $$;

-- ── PRODUCTIVITÉ ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS productivity_tasks (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  title             text        NOT NULL,
  description       text        DEFAULT '',
  priority          text        DEFAULT 'normal',
  status            text        DEFAULT 'todo',
  category          text        DEFAULT '',
  due_date          date,
  due_time          text        DEFAULT '',
  responsible       text        DEFAULT '',
  assignees         text[]      DEFAULT '{}',
  subtasks          jsonb       DEFAULT '[]',
  tags              text[]      DEFAULT '{}',
  estimated_minutes integer     DEFAULT 30,
  time_spent        integer     DEFAULT 0,
  timer_started_at  timestamptz,
  is_recurring      boolean     DEFAULT false,
  recurrence        text        DEFAULT 'none',
  linked_module     text        DEFAULT '',
  linked_id         text        DEFAULT '',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_prod_user     ON productivity_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_prod_status   ON productivity_tasks(status);
CREATE INDEX IF NOT EXISTS idx_prod_due      ON productivity_tasks(due_date);
ALTER TABLE productivity_tasks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='productivity_tasks' AND policyname='prod_own') THEN
    CREATE POLICY "prod_own" ON productivity_tasks
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS task_comments (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id     uuid    REFERENCES productivity_tasks(id) ON DELETE CASCADE,
  author_name text    NOT NULL DEFAULT '',
  content     text    NOT NULL,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tcmt_task ON task_comments(task_id);
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='task_comments' AND policyname='tcmt_own') THEN
    CREATE POLICY "tcmt_own" ON task_comments
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS project_tasks (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL,
  project_id  uuid        NOT NULL,
  title       text        NOT NULL,
  done        boolean     DEFAULT false,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS project_tasks_proj_idx ON project_tasks(project_id);
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='project_tasks' AND policyname='project_tasks_own') THEN
    CREATE POLICY "project_tasks_own" ON project_tasks
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS project_milestones (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL,
  project_id  uuid        NOT NULL,
  title       text        NOT NULL,
  date        date,
  done        boolean     DEFAULT false,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS project_milestones_proj_idx ON project_milestones(project_id);
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='project_milestones' AND policyname='project_milestones_own') THEN
    CREATE POLICY "project_milestones_own" ON project_milestones
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS project_team (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL,
  project_id  uuid        NOT NULL,
  member_name text        NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(project_id, member_name)
);
CREATE INDEX IF NOT EXISTS project_team_proj_idx ON project_team(project_id);
ALTER TABLE project_team ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='project_team' AND policyname='project_team_own') THEN
    CREATE POLICY "project_team_own" ON project_team
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ── PLANNING ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS planning_events (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  title            text        NOT NULL,
  description      text        DEFAULT '',
  event_type       text        DEFAULT 'event',
  start_at         timestamptz NOT NULL,
  end_at           timestamptz NOT NULL,
  is_all_day       boolean     DEFAULT false,
  location         text        DEFAULT '',
  color            text        DEFAULT '#6366f1',
  participants     text[]      DEFAULT '{}',
  reminder_minutes integer     DEFAULT 30,
  meet_link        text        DEFAULT '',
  linked_module    text        DEFAULT '',
  linked_id        text        DEFAULT '',
  recurrence       text        DEFAULT 'none',
  status           text        DEFAULT 'confirmed',
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pe_user  ON planning_events(user_id);
CREATE INDEX IF NOT EXISTS idx_pe_start ON planning_events(start_at);
ALTER TABLE planning_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='planning_events' AND policyname='pe_own') THEN
    CREATE POLICY "pe_own" ON planning_events
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS planning_tasks (
  id                 uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  title              text    NOT NULL,
  description        text    DEFAULT '',
  due_date           date,
  due_time           text    DEFAULT '',
  priority           text    DEFAULT 'normal',
  status             text    DEFAULT 'todo',
  tags               text[]  DEFAULT '{}',
  estimated_minutes  integer DEFAULT 30,
  event_id           uuid    REFERENCES planning_events(id) ON DELETE SET NULL,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pt_user   ON planning_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_pt_due    ON planning_tasks(due_date);
ALTER TABLE planning_tasks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='planning_tasks' AND policyname='pt_own') THEN
    CREATE POLICY "pt_own" ON planning_tasks
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS planning_goals (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text    NOT NULL,
  period      text    DEFAULT 'week',
  target_date date,
  progress    integer DEFAULT 0,
  status      text    DEFAULT 'active',
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pg_user ON planning_goals(user_id);
ALTER TABLE planning_goals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='planning_goals' AND policyname='pg_own') THEN
    CREATE POLICY "pg_own" ON planning_goals
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ── AGENDA_EVENTS (créée dans 001k, skippée) ─────────────────────────────
CREATE TABLE IF NOT EXISTS agenda_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text        NOT NULL DEFAULT '',
  description text        NOT NULL DEFAULT '',
  date        date        NOT NULL DEFAULT CURRENT_DATE,
  start_time  time,
  end_time    time,
  category    text        NOT NULL DEFAULT 'personnel',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ae_user_date ON agenda_events(user_id, date);
ALTER TABLE agenda_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='agenda_events' AND policyname='ae_own') THEN
    CREATE POLICY "ae_own" ON agenda_events FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ── CONTRACT_VERSIONS + CONTRACT_TEMPLATES (créées dans 001x, skippée) ─────
CREATE TABLE IF NOT EXISTS contract_versions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_id uuid        NOT NULL REFERENCES contracts(id)  ON DELETE CASCADE,
  content     text        NOT NULL,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cv_contract ON contract_versions(contract_id);
ALTER TABLE contract_versions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='contract_versions' AND policyname='cv_own') THEN
    CREATE POLICY "cv_own" ON contract_versions FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS contract_templates (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  type        text        NOT NULL,
  content     text        NOT NULL,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ct_user ON contract_templates(user_id);
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='contract_templates' AND policyname='ct_own') THEN
    CREATE POLICY "ct_own" ON contract_templates FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ── DOCUMENTS (base) — sans CHECK sur type/statut pour compatibilité avoirs ──
-- NB : les contraintes CHECK sur type et statut sont intentionnellement absentes
-- (migration 040 ajoute 'avoir', migration 067 ajoute 'partiellement_payé', etc.)
CREATE TABLE IF NOT EXISTS documents (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type             text          NOT NULL DEFAULT 'facture',
  numero           text          NOT NULL DEFAULT '',
  statut           text          NOT NULL DEFAULT 'brouillon',
  emetteur_nom     text          NOT NULL DEFAULT '',
  emetteur_email   text          NOT NULL DEFAULT '',
  emetteur_adresse text          NOT NULL DEFAULT '',
  emetteur_siret   text          NOT NULL DEFAULT '',
  client_nom       text          NOT NULL DEFAULT '',
  client_email     text          NOT NULL DEFAULT '',
  client_adresse   text          NOT NULL DEFAULT '',
  date_document    date          NOT NULL DEFAULT CURRENT_DATE,
  date_echeance    date,
  notes            text          NOT NULL DEFAULT '',
  conditions       text          NOT NULL DEFAULT '',
  total_ht         numeric(12,2) NOT NULL DEFAULT 0,
  total_tva        numeric(12,2) NOT NULL DEFAULT 0,
  total_ttc        numeric(12,2) NOT NULL DEFAULT 0,
  -- colonnes requises par migrations 058 + 074 (org sharing, comptabilité)
  organization_id  uuid,
  deleted_at       timestamptz,
  montant_paye     numeric(12,2) NOT NULL DEFAULT 0,
  created_at       timestamptz   NOT NULL DEFAULT now(),
  updated_at       timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_documents_user   ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_type   ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_statut ON documents(statut);
CREATE INDEX IF NOT EXISTS idx_documents_org    ON documents(organization_id) WHERE organization_id IS NOT NULL;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='documents' AND policyname='documents_own') THEN
    CREATE POLICY "documents_own" ON documents
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ── DOCUMENT_ITEMS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_items (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  uuid          NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  position     integer       NOT NULL DEFAULT 0,
  description  text          NOT NULL DEFAULT '',
  quantity     numeric(10,3) NOT NULL DEFAULT 1,
  unit_price   numeric(12,2) NOT NULL DEFAULT 0,
  vat_rate     numeric(5,2)  NOT NULL DEFAULT 20
);
CREATE INDEX IF NOT EXISTS idx_doc_items_doc ON document_items(document_id);
ALTER TABLE document_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='document_items' AND policyname='doc_items_own') THEN
    CREATE POLICY "doc_items_own" ON document_items FOR SELECT
      USING (
        EXISTS (SELECT 1 FROM documents d WHERE d.id = document_items.document_id AND d.user_id = auth.uid())
      );
  END IF;
END $$;

-- ── DOCUMENT_PAYMENTS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_payments (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid          NOT NULL REFERENCES documents(id)  ON DELETE CASCADE,
  amount      numeric(12,2) NOT NULL CHECK (amount > 0),
  date        date          NOT NULL DEFAULT CURRENT_DATE,
  method      text          NOT NULL DEFAULT 'virement',
  notes       text          NOT NULL DEFAULT '',
  created_at  timestamptz   DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_doc_payments_doc  ON document_payments(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_payments_user ON document_payments(user_id);
ALTER TABLE document_payments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='document_payments' AND policyname='pay_select_own') THEN
    CREATE POLICY "pay_select_own" ON document_payments FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY "pay_insert_own" ON document_payments FOR INSERT WITH CHECK (user_id = auth.uid());
    CREATE POLICY "pay_delete_own" ON document_payments FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

-- ── ORG_MESSAGE_GROUPS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_message_groups (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL,
  name            text        NOT NULL,
  description     text,
  created_by      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_direct       boolean     NOT NULL DEFAULT FALSE,
  created_at      timestamptz NOT NULL DEFAULT NOW(),
  updated_at      timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_msg_groups_org ON org_message_groups(organization_id);
ALTER TABLE org_message_groups ENABLE ROW LEVEL SECURITY;

-- ── ORG_MESSAGE_GROUP_MEMBERS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_message_group_members (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        uuid        NOT NULL REFERENCES org_message_groups(id) ON DELETE CASCADE,
  organization_id uuid        NOT NULL,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at       timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_msg_group_members_group ON org_message_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_msg_group_members_user  ON org_message_group_members(user_id, organization_id);
ALTER TABLE org_message_group_members ENABLE ROW LEVEL SECURITY;

-- ── ORG_MESSAGES ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL,
  group_id        uuid        NOT NULL REFERENCES org_message_groups(id) ON DELETE CASCADE,
  sender_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content         text        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 10000),
  file_url        text,
  file_name       text,
  is_deleted      boolean     NOT NULL DEFAULT FALSE,
  edited_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_org_messages_group  ON org_messages(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_org_messages_org    ON org_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_messages_sender ON org_messages(sender_id);
ALTER TABLE org_messages ENABLE ROW LEVEL SECURITY;

-- ── ORG_MESSAGE_READS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_message_reads (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        uuid        NOT NULL REFERENCES org_message_groups(id) ON DELETE CASCADE,
  organization_id uuid        NOT NULL,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at    timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_msg_reads_user  ON org_message_reads(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_msg_reads_group ON org_message_reads(group_id);
ALTER TABLE org_message_reads ENABLE ROW LEVEL SECURITY;

-- ── TEAM_MEMBERS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text        NOT NULL,
  email         text        DEFAULT '',
  phone         text        DEFAULT '',
  position      text        DEFAULT '',
  department    text        DEFAULT '',
  role          text        DEFAULT 'employee',
  status        text        DEFAULT 'active',
  avatar_color  text        DEFAULT '#0ea5e9',
  entry_date    date,
  notes         text        DEFAULT '',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tm_user   ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tm_status ON team_members(status);
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='team_members' AND policyname='tm_own') THEN
    CREATE POLICY "tm_own" ON team_members FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ── TEAM_TASKS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_tasks (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  title           text        NOT NULL,
  description     text        DEFAULT '',
  assigned_to     uuid        REFERENCES team_members(id) ON DELETE SET NULL,
  assigned_name   text        DEFAULT '',
  priority        text        DEFAULT 'normal',
  status          text        DEFAULT 'todo',
  due_date        date,
  project         text        DEFAULT '',
  estimated_hours numeric     DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tt_user     ON team_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tt_assigned ON team_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tt_status   ON team_tasks(status);
ALTER TABLE team_tasks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='team_tasks' AND policyname='tt_own') THEN
    CREATE POLICY "tt_own" ON team_tasks FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ── TEAM_MESSAGES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_messages (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name  text        NOT NULL DEFAULT '',
  content      text        NOT NULL,
  channel      text        DEFAULT 'général',
  mentions     text[]      DEFAULT '{}',
  created_at   timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tmsg_user    ON team_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_tmsg_channel ON team_messages(channel);
CREATE INDEX IF NOT EXISTS idx_tmsg_date    ON team_messages(created_at DESC);
ALTER TABLE team_messages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='team_messages' AND policyname='tmsg_own') THEN
    CREATE POLICY "tmsg_own" ON team_messages FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ── TEAM_LEAVES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_leaves (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id    uuid    REFERENCES team_members(id) ON DELETE CASCADE,
  member_name  text    DEFAULT '',
  type         text    DEFAULT 'vacation',
  start_date   date    NOT NULL,
  end_date     date    NOT NULL,
  status       text    DEFAULT 'pending',
  reason       text    DEFAULT '',
  created_at   timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tl_user   ON team_leaves(user_id);
CREATE INDEX IF NOT EXISTS idx_tl_member ON team_leaves(member_id);
ALTER TABLE team_leaves ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='team_leaves' AND policyname='tl_own') THEN
    CREATE POLICY "tl_own" ON team_leaves FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ── TEAM_MEETINGS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_meetings (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  title              text        NOT NULL,
  description        text        DEFAULT '',
  date_at            timestamptz NOT NULL,
  duration_minutes   integer     DEFAULT 60,
  location           text        DEFAULT '',
  meet_link          text        DEFAULT '',
  participants       text[]      DEFAULT '{}',
  notes              text        DEFAULT '',
  status             text        DEFAULT 'planned',
  created_at         timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tmeet_user ON team_meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_tmeet_date ON team_meetings(date_at);
ALTER TABLE team_meetings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='team_meetings' AND policyname='tmeet_own') THEN
    CREATE POLICY "tmeet_own" ON team_meetings FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ── BOOKING_PAGES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS booking_pages (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token                text        UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  title                text        NOT NULL DEFAULT 'Prendre un rendez-vous',
  description          text        NOT NULL DEFAULT '',
  duration_minutes     int         NOT NULL DEFAULT 30,
  advance_notice_hours int         NOT NULL DEFAULT 1,
  days_ahead           int         NOT NULL DEFAULT 30,
  available_days       int[]       NOT NULL DEFAULT ARRAY[1,2,3,4,5],
  start_hour           int         NOT NULL DEFAULT 9,
  end_hour             int         NOT NULL DEFAULT 18,
  is_active            boolean     NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_booking_pages_user_id ON booking_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_pages_token   ON booking_pages(token);
ALTER TABLE booking_pages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='booking_pages' AND policyname='owner_booking_pages') THEN
    CREATE POLICY "owner_booking_pages" ON booking_pages FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── BOOKING_APPOINTMENTS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS booking_appointments (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_page_id uuid        NOT NULL REFERENCES booking_pages(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
  date            date        NOT NULL,
  start_time      time        NOT NULL,
  end_time        time        NOT NULL,
  client_name     text        NOT NULL,
  client_email    text        NOT NULL,
  client_message  text        NOT NULL DEFAULT '',
  status          text        NOT NULL DEFAULT 'confirmed',
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_booking_appts_page_date ON booking_appointments(booking_page_id, date);
ALTER TABLE booking_appointments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='booking_appointments' AND policyname='owner_booking_appointments') THEN
    CREATE POLICY "owner_booking_appointments" ON booking_appointments FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── EMPLOYE_EVALUATIONS
CREATE TABLE IF NOT EXISTS employe_evaluations (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL,
  member_id    text        NOT NULL,
  member_name  text        NOT NULL,
  date         date        NOT NULL,
  score        int         CHECK (score BETWEEN 1 AND 10),
  notes        text,
  created_at   timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS employe_evals_member_idx ON employe_evaluations(member_id);
ALTER TABLE employe_evaluations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='employe_evaluations' AND policyname='users_own_evaluations') THEN
    CREATE POLICY "users_own_evaluations" ON employe_evaluations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── TIMESHEETS
CREATE TABLE IF NOT EXISTS timesheets (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL,
  member_id   text        NOT NULL,
  day_key     date        NOT NULL,
  hours       decimal(4,2) DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, member_id, day_key)
);
CREATE INDEX IF NOT EXISTS timesheets_member_idx ON timesheets(member_id);
CREATE INDEX IF NOT EXISTS timesheets_user_idx   ON timesheets(user_id);
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='timesheets' AND policyname='users_own_timesheets') THEN
    CREATE POLICY "users_own_timesheets" ON timesheets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── PRIVATE_SPACES (no FK to organizations — created in 054)
-- space_members added right after so is_space_member() fn in 108 can reference it
CREATE TABLE IF NOT EXISTS private_spaces (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text    NOT NULL,
  description text    DEFAULT '',
  color       text    DEFAULT '#c9a55a',
  access_code text    NOT NULL,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, access_code)
);
CREATE INDEX IF NOT EXISTS idx_ps_user ON private_spaces(user_id);
ALTER TABLE private_spaces ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='private_spaces' AND policyname='ps_own') THEN
    CREATE POLICY "ps_own" ON private_spaces FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ── CHRONO_PROJECTS
CREATE TABLE IF NOT EXISTS chrono_projects (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text    NOT NULL,
  client_name  text    DEFAULT '',
  color        text    DEFAULT '#a78bfa',
  hourly_rate  numeric DEFAULT 0,
  budget_hours numeric DEFAULT 0,
  is_active    boolean DEFAULT true,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cpro_user ON chrono_projects(user_id);
ALTER TABLE chrono_projects ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='chrono_projects' AND policyname='cpro_own') THEN
    CREATE POLICY "cpro_own" ON chrono_projects FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ── CHRONO_GOALS
CREATE TABLE IF NOT EXISTS chrono_goals (
  id                      uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid    REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  daily_minutes           integer DEFAULT 480,
  weekly_minutes          integer DEFAULT 2400,
  daily_billable_minutes  integer DEFAULT 360,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);
ALTER TABLE chrono_goals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='chrono_goals' AND policyname='cgoal_own') THEN
    CREATE POLICY "cgoal_own" ON chrono_goals FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ── SOURCING_SESSIONS
CREATE TABLE IF NOT EXISTS sourcing_sessions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text NOT NULL DEFAULT 'Session sans titre',
  messages   jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE sourcing_sessions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='sourcing_sessions' AND policyname='sourcing_sessions_self') THEN
    CREATE POLICY "sourcing_sessions_self" ON sourcing_sessions USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS sourcing_sessions_user ON sourcing_sessions(user_id, created_at DESC);

-- ── SOURCING_NEGOTIATIONS
CREATE TABLE IF NOT EXISTS sourcing_negotiations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier   text NOT NULL,
  status     text NOT NULL DEFAULT 'En cours',
  notes      text DEFAULT '',
  amount     text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE sourcing_negotiations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='sourcing_negotiations' AND policyname='sourcing_neg_self') THEN
    CREATE POLICY "sourcing_neg_self" ON sourcing_negotiations USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS sourcing_neg_user ON sourcing_negotiations(user_id);

-- ── AI_CONVERSATIONS
CREATE TABLE IF NOT EXISTS ai_conversations (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text        DEFAULT 'Nouvelle conversation',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_aiconv_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_aiconv_date ON ai_conversations(updated_at DESC);
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ai_conversations' AND policyname='aiconv_own') THEN
    CREATE POLICY "aiconv_own" ON ai_conversations FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ── AI_MESSAGES
CREATE TABLE IF NOT EXISTS ai_messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid        REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role            text        NOT NULL DEFAULT 'user',
  content         text        NOT NULL,
  modules_used    text[]      DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_aimsg_conv ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_aimsg_user ON ai_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_aimsg_date ON ai_messages(created_at);
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ai_messages' AND policyname='aimsg_own') THEN
    CREATE POLICY "aimsg_own" ON ai_messages FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ── SPACE_MEMBERS (no FK to organizations — created in 054)
CREATE TABLE IF NOT EXISTS space_members (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id    uuid        NOT NULL REFERENCES private_spaces(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id)     ON DELETE CASCADE,
  org_id      uuid,  -- no FK, organizations created in 054
  role        text        NOT NULL DEFAULT 'member'
                          CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by  uuid        REFERENCES auth.users(id)              ON DELETE SET NULL,
  joined_at   timestamptz NOT NULL DEFAULT NOW(),
  created_at  timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (space_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_sm_space ON space_members (space_id);
CREATE INDEX IF NOT EXISTS idx_sm_user  ON space_members (user_id);
ALTER TABLE space_members ENABLE ROW LEVEL SECURITY;

-- Table note_folders (001z_notes_schema.sql et 001m skippés)
CREATE TABLE IF NOT EXISTS note_folders (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  color      text        DEFAULT '#a78bfa',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nfold_user ON note_folders (user_id);
ALTER TABLE note_folders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nfold_own" ON note_folders;
CREATE POLICY "nfold_own" ON note_folders
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Table notes (001m_create_notes_table.sql skippé)
CREATE TABLE IF NOT EXISTS notes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text        NOT NULL DEFAULT '',
  content     text        NOT NULL DEFAULT '',
  category    text        NOT NULL DEFAULT 'personnel',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notes_user_id_idx    ON notes (user_id);
CREATE INDEX IF NOT EXISTS notes_updated_at_idx ON notes (user_id, updated_at DESC);
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notes_select_own" ON notes;
DROP POLICY IF EXISTS "notes_insert_own" ON notes;
DROP POLICY IF EXISTS "notes_update_own" ON notes;
DROP POLICY IF EXISTS "notes_delete_own" ON notes;
CREATE POLICY "notes_select_own" ON notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notes_insert_own" ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notes_update_own" ON notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notes_delete_own" ON notes FOR DELETE USING (auth.uid() = user_id);

-- Colonnes chrono manquantes (001h_chrono_schema.sql est skippé)
ALTER TABLE time_entries
  ADD COLUMN IF NOT EXISTS task_title   text    DEFAULT '',
  ADD COLUMN IF NOT EXISTS category     text    DEFAULT 'autre',
  ADD COLUMN IF NOT EXISTS is_billable  boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_billed    boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS invoice_ref  text    DEFAULT '',
  ADD COLUMN IF NOT EXISTS timer_mode   text    DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS notes        text    DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_te_date    ON time_entries (date);
CREATE INDEX IF NOT EXISTS idx_te_project ON time_entries (project);
CREATE INDEX IF NOT EXISTS idx_te_billed  ON time_entries (is_billed);
