-- ════════════════════════════════════════════════════════
-- EXPENSES SCHEMA FIX — Corrige table expenses existante
-- À exécuter si expenses_schema.sql a échoué
-- ════════════════════════════════════════════════════════

-- ── 1. Notes de frais (nouvelle table) ───────────────────────────────────
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

ALTER TABLE expense_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "expense_reports_own" ON expense_reports;
CREATE POLICY "expense_reports_own" ON expense_reports
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 2. Extension de la table expenses existante ───────────────────────────
-- Ajoute toutes les colonnes manquantes (IF NOT EXISTS = sûr si déjà présente)

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS expense_report_id uuid REFERENCES expense_reports(id) ON DELETE SET NULL;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS currency          text    DEFAULT 'EUR';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category          text    DEFAULT 'autre';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_method    text    DEFAULT 'carte_pro';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS status            text    DEFAULT 'draft';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS vat_amount        numeric DEFAULT 0;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS vat_recoverable   boolean DEFAULT false;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_url       text    DEFAULT '';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS invoice_number    text    DEFAULT '';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS project           text    DEFAULT '';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS cost_center       text    DEFAULT '';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS notes             text    DEFAULT '';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS updated_at        timestamptz DEFAULT now();

-- Index utiles
CREATE INDEX IF NOT EXISTS idx_expenses_user   ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date   ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_report ON expenses(expense_report_id);

-- RLS expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "expenses_own" ON expenses;
CREATE POLICY "expenses_own" ON expenses
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 3. Budgets (nouvelle table) ───────────────────────────────────────────
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

ALTER TABLE expense_budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "expense_budgets_own" ON expense_budgets;
CREATE POLICY "expense_budgets_own" ON expense_budgets
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 4. Triggers updated_at ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_expenses_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS expense_updated_at ON expenses;
CREATE TRIGGER expense_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_expenses_timestamp();

DROP TRIGGER IF EXISTS report_updated_at ON expense_reports;
CREATE TRIGGER report_updated_at
  BEFORE UPDATE ON expense_reports
  FOR EACH ROW EXECUTE FUNCTION update_expenses_timestamp();

-- ── 5. Storage bucket receipts ────────────────────────────────────────────
-- Si cette partie échoue, créez le bucket manuellement dans Storage → New bucket
-- name: receipts | public: true | max size: 10MB
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts', 'receipts', true, 10485760,
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Policies Storage (optionnel — à faire dans Storage → Policies si ça échoue ici)
DROP POLICY IF EXISTS "receipts_insert_own" ON storage.objects;
CREATE POLICY "receipts_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "receipts_select_own" ON storage.objects;
CREATE POLICY "receipts_select_own" ON storage.objects
  FOR SELECT USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "receipts_delete_own" ON storage.objects;
CREATE POLICY "receipts_delete_own" ON storage.objects
  FOR DELETE USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
