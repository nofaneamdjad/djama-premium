-- Recovery: garantit que expense_reports / expenses / expense_budgets existent.
-- CREATE TABLE IF NOT EXISTS = no-op si la table existe déjà.

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

CREATE TABLE IF NOT EXISTS expenses (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        REFERENCES auth.users(id)      ON DELETE CASCADE,
  expense_report_id uuid        REFERENCES expense_reports(id) ON DELETE SET NULL,
  date              date        NOT NULL DEFAULT CURRENT_DATE,
  amount            numeric     NOT NULL DEFAULT 0,
  currency          text        DEFAULT 'EUR',
  category          text        DEFAULT 'autre',
  description       text        NOT NULL DEFAULT '',
  payment_method    text        DEFAULT 'carte_pro',
  status            text        DEFAULT 'draft',
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

-- Bucket justificatifs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('receipts', 'receipts', true, 10485760,
  ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO NOTHING;
