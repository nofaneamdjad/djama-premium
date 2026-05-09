-- ════════════════════════════════════════════════════════
-- TRÉSORERIE FULL SCHEMA — Comptes + Transactions + Récurrents
-- ════════════════════════════════════════════════════════

-- ── 1. Comptes bancaires ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS treasury_accounts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL DEFAULT 'Compte principal',
  bank       text DEFAULT '',
  iban       text DEFAULT '',
  balance    numeric DEFAULT 0,
  currency   text DEFAULT 'EUR',
  color      text DEFAULT '#3b82f6',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_taccounts_user ON treasury_accounts(user_id);
ALTER TABLE treasury_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "taccounts_own" ON treasury_accounts;
CREATE POLICY "taccounts_own" ON treasury_accounts
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 2. Transactions manuelles ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS treasury_transactions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id       uuid REFERENCES treasury_accounts(id) ON DELETE SET NULL,
  type             text NOT NULL DEFAULT 'expense',     -- income | expense
  category         text DEFAULT 'autre',
  label            text NOT NULL DEFAULT '',
  amount           numeric NOT NULL DEFAULT 0,
  currency         text DEFAULT 'EUR',
  date             date NOT NULL DEFAULT CURRENT_DATE,
  payment_method   text DEFAULT 'virement',             -- virement | carte | cash | prelevement | cheque
  status           text DEFAULT 'completed',            -- completed | pending | cancelled
  client_supplier  text DEFAULT '',
  invoice_ref      text DEFAULT '',
  project          text DEFAULT '',
  notes            text DEFAULT '',
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ttransactions_user ON treasury_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ttransactions_date ON treasury_transactions(date);
CREATE INDEX IF NOT EXISTS idx_ttransactions_type ON treasury_transactions(type);
ALTER TABLE treasury_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ttransactions_own" ON treasury_transactions;
CREATE POLICY "ttransactions_own" ON treasury_transactions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 3. Éléments récurrents (pour prévisions) ──────────────────────────────
CREATE TABLE IF NOT EXISTS treasury_recurring (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text NOT NULL DEFAULT 'expense',     -- income | expense
  label      text NOT NULL,
  amount     numeric NOT NULL DEFAULT 0,
  frequency  text DEFAULT 'monthly',              -- weekly | monthly | quarterly | yearly
  next_date  date,
  category   text DEFAULT 'autre',
  active     boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trecurring_user ON treasury_recurring(user_id);
ALTER TABLE treasury_recurring ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trecurring_own" ON treasury_recurring;
CREATE POLICY "trecurring_own" ON treasury_recurring
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 4. Trigger updated_at comptes ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_taccount_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS taccount_updated_at ON treasury_accounts;
CREATE TRIGGER taccount_updated_at
  BEFORE UPDATE ON treasury_accounts
  FOR EACH ROW EXECUTE FUNCTION update_taccount_timestamp();
