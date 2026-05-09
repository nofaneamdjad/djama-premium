-- ════════════════════════════════════════════════════════
-- EXPENSES FULL SCHEMA — Notes de frais + Dépenses + Budgets
-- ════════════════════════════════════════════════════════

-- ── 1. Notes de frais (créée en premier car expenses y fait référence) ───────
CREATE TABLE IF NOT EXISTS expense_reports (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  title        text        NOT NULL,
  period_start date,
  period_end   date,
  status       text        DEFAULT 'draft',     -- draft | submitted | approved | rejected | reimbursed
  total_amount numeric     DEFAULT 0,
  notes        text        DEFAULT '',
  submitted_at timestamptz,
  approved_at  timestamptz,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expense_reports_user ON expense_reports(user_id);

ALTER TABLE expense_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "expense_reports_own" ON expense_reports;
CREATE POLICY "expense_reports_own" ON expense_reports
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 2. Dépenses ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        REFERENCES auth.users(id)      ON DELETE CASCADE,
  expense_report_id uuid        REFERENCES expense_reports(id) ON DELETE SET NULL,
  date              date        NOT NULL DEFAULT CURRENT_DATE,
  amount            numeric     NOT NULL DEFAULT 0,
  currency          text        DEFAULT 'EUR',
  category          text        DEFAULT 'autre',       -- transport | repas | logiciel | carburant | hotel | equipement | communication | formation | publicite | fournitures | autre
  description       text        NOT NULL DEFAULT '',
  payment_method    text        DEFAULT 'carte_pro',   -- carte_pro | carte_perso | virement | cash | autre
  status            text        DEFAULT 'draft',       -- draft | submitted | approved | rejected | reimbursed
  vat_amount        numeric     DEFAULT 0,
  vat_recoverable   boolean     DEFAULT false,
  receipt_url       text        DEFAULT '',
  invoice_number    text        DEFAULT '',
  project           text        DEFAULT '',
  cost_center       text        DEFAULT '',
  notes             text        DEFAULT '',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_user   ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date   ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_report ON expenses(expense_report_id);
CREATE INDEX IF NOT EXISTS idx_expenses_cat    ON expenses(category);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "expenses_own" ON expenses;
CREATE POLICY "expenses_own" ON expenses
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 3. Budgets par catégorie ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expense_budgets (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  category   text    NOT NULL,
  amount     numeric NOT NULL DEFAULT 0,
  period     text    DEFAULT 'monthly',   -- monthly | yearly
  year       integer NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer,
  month      integer,                     -- 1-12 pour mensuel, NULL pour annuel
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category, period, year, month)
);

CREATE INDEX IF NOT EXISTS idx_expense_budgets_user ON expense_budgets(user_id);

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

DROP TRIGGER IF EXISTS expense_report_updated_at ON expense_reports;
CREATE TRIGGER expense_report_updated_at
  BEFORE UPDATE ON expense_reports
  FOR EACH ROW EXECUTE FUNCTION update_expenses_timestamp();

-- ── 5. Storage bucket pour les justificatifs ──────────────────────────────
-- Bucket "receipts" (public, max 10 Mo, images + PDF)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts', 'receipts', true, 10485760,
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- RLS Storage
DROP POLICY IF EXISTS "receipts_insert_own" ON storage.objects;
CREATE POLICY "receipts_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "receipts_select_own" ON storage.objects;
CREATE POLICY "receipts_select_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "receipts_delete_own" ON storage.objects;
CREATE POLICY "receipts_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
