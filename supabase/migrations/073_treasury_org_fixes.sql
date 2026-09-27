-- ═══════════════════════════════════════════════════════════════════════════
-- 073 — TRÉSORERIE : organisation, calcul solde, intégrations, RLS
-- Corrections P0/P1 — Idempotent, sûr à rejouer
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── 1. organization_id sur les 3 tables treasury ─────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'treasury_accounts' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE treasury_accounts
      ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'treasury_transactions' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE treasury_transactions
      ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'treasury_recurring' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE treasury_recurring
      ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ─── 2. initial_balance : source de vérité pour le calcul du solde ────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'treasury_accounts' AND column_name = 'initial_balance'
  ) THEN
    ALTER TABLE treasury_accounts
      ADD COLUMN initial_balance numeric NOT NULL DEFAULT 0;
    -- Les comptes existants : le balance actuel devient le solde d'ouverture
    UPDATE treasury_accounts
      SET initial_balance = COALESCE(balance, 0)
      WHERE initial_balance = 0;
  END IF;
END $$;

-- ─── 3. Colonnes de déduplication ─────────────────────────────────────────
-- document_payment_id : lien avec document_payments (paiements de factures)
-- expense_id          : lien avec expenses (dépenses remboursées)

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'treasury_transactions' AND column_name = 'document_payment_id'
  ) THEN
    ALTER TABLE treasury_transactions
      ADD COLUMN document_payment_id uuid REFERENCES document_payments(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'treasury_transactions' AND column_name = 'expense_id'
  ) THEN
    ALTER TABLE treasury_transactions
      ADD COLUMN expense_id uuid REFERENCES expenses(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index partiels uniques : empêchent les doublons de synchronisation
CREATE UNIQUE INDEX IF NOT EXISTS idx_trtx_document_payment_id
  ON treasury_transactions(document_payment_id) WHERE document_payment_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_trtx_expense_id
  ON treasury_transactions(expense_id) WHERE expense_id IS NOT NULL;

-- ─── 4. Index pour les requêtes organisation ──────────────────────────────

CREATE INDEX IF NOT EXISTS idx_taccounts_org
  ON treasury_accounts(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ttransactions_org
  ON treasury_transactions(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trecurring_org
  ON treasury_recurring(organization_id) WHERE organization_id IS NOT NULL;

-- ─── 5. Fonction de calcul du solde (VOLATILE pour lire l'état courant) ───

CREATE OR REPLACE FUNCTION compute_treasury_balance(p_account_id uuid)
RETURNS numeric
LANGUAGE sql
VOLATILE
SECURITY DEFINER
AS $$
  SELECT
    a.initial_balance
    + COALESCE(
        SUM(CASE WHEN t.type = 'income'  AND t.status = 'completed' THEN t.amount ELSE 0 END)
      , 0)
    - COALESCE(
        SUM(CASE WHEN t.type = 'expense' AND t.status = 'completed' THEN t.amount ELSE 0 END)
      , 0)
  FROM treasury_accounts a
  LEFT JOIN treasury_transactions t ON t.account_id = a.id
  WHERE a.id = p_account_id
  GROUP BY a.id, a.initial_balance;
$$;

-- ─── 6a. Trigger BEFORE INSERT : initialise initial_balance depuis balance ─
-- Garantit que les nouveaux comptes créés depuis l'UI ont un initial_balance correct

CREATE OR REPLACE FUNCTION trg_set_initial_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.initial_balance = 0 AND NEW.balance IS NOT NULL AND NEW.balance != 0 THEN
    NEW.initial_balance := NEW.balance;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_initial_balance ON treasury_accounts;
CREATE TRIGGER trg_set_initial_balance
  BEFORE INSERT ON treasury_accounts
  FOR EACH ROW EXECUTE FUNCTION trg_set_initial_balance();

-- ─── 6b. Trigger AFTER INSERT/UPDATE/DELETE transactions : recalcule solde ─

CREATE OR REPLACE FUNCTION trg_update_treasury_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance  numeric;
  v_account  uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_account := OLD.account_id;
  ELSE
    v_account := NEW.account_id;
    -- Si le compte a changé (UPDATE), recalculer l'ancien compte aussi
    IF TG_OP = 'UPDATE'
       AND OLD.account_id IS DISTINCT FROM NEW.account_id
       AND OLD.account_id IS NOT NULL
    THEN
      v_balance := compute_treasury_balance(OLD.account_id);
      IF v_balance IS NOT NULL THEN
        UPDATE treasury_accounts SET balance = v_balance WHERE id = OLD.account_id;
      END IF;
    END IF;
  END IF;

  IF v_account IS NOT NULL THEN
    v_balance := compute_treasury_balance(v_account);
    IF v_balance IS NOT NULL THEN
      UPDATE treasury_accounts SET balance = v_balance WHERE id = v_account;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_treasury_balance ON treasury_transactions;
CREATE TRIGGER trg_update_treasury_balance
  AFTER INSERT OR UPDATE OR DELETE ON treasury_transactions
  FOR EACH ROW EXECUTE FUNCTION trg_update_treasury_balance();

-- ─── 7. Recalculer les soldes de tous les comptes existants ───────────────

UPDATE treasury_accounts a
   SET balance = COALESCE(compute_treasury_balance(a.id), a.initial_balance);

-- ─── 8. RLS — nettoyage des anciennes policies ────────────────────────────
-- Les migrations précédentes ont créé des policies en double :
--   tresorerie_schema.sql    → "taccounts_own" (FOR ALL)
--   20260701_rls_policies.sql → "user_select_treasury_*" (per-op)
-- On les supprime toutes et on recrée proprement.

-- treasury_accounts
DROP POLICY IF EXISTS "taccounts_own"                 ON treasury_accounts;
DROP POLICY IF EXISTS "user_select_treasury_accounts" ON treasury_accounts;
DROP POLICY IF EXISTS "user_insert_treasury_accounts" ON treasury_accounts;
DROP POLICY IF EXISTS "user_update_treasury_accounts" ON treasury_accounts;
DROP POLICY IF EXISTS "user_delete_treasury_accounts" ON treasury_accounts;
-- Policies de cette migration (idempotence)
DROP POLICY IF EXISTS "ta_select"                     ON treasury_accounts;
DROP POLICY IF EXISTS "ta_insert"                     ON treasury_accounts;
DROP POLICY IF EXISTS "ta_update"                     ON treasury_accounts;
DROP POLICY IF EXISTS "ta_delete"                     ON treasury_accounts;

-- Lecture : propriétaire OU membre actif de l'organisation
CREATE POLICY "ta_select" ON treasury_accounts FOR SELECT
  USING (
    user_id = auth.uid()
    OR (organization_id IS NOT NULL AND is_org_member(organization_id))
  );

-- Écriture : le créateur est toujours le propriétaire authentifié
CREATE POLICY "ta_insert" ON treasury_accounts FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Modification : propriétaire seulement (les routes admin utilisent service_role)
CREATE POLICY "ta_update" ON treasury_accounts FOR UPDATE
  USING (user_id = auth.uid());

-- Suppression : propriétaire seulement
CREATE POLICY "ta_delete" ON treasury_accounts FOR DELETE
  USING (user_id = auth.uid());

-- treasury_transactions
DROP POLICY IF EXISTS "ttransactions_own"                  ON treasury_transactions;
DROP POLICY IF EXISTS "user_select_treasury_transactions"  ON treasury_transactions;
DROP POLICY IF EXISTS "user_insert_treasury_transactions"  ON treasury_transactions;
DROP POLICY IF EXISTS "user_update_treasury_transactions"  ON treasury_transactions;
DROP POLICY IF EXISTS "user_delete_treasury_transactions"  ON treasury_transactions;
DROP POLICY IF EXISTS "tt_select"                          ON treasury_transactions;
DROP POLICY IF EXISTS "tt_insert"                          ON treasury_transactions;
DROP POLICY IF EXISTS "tt_update"                          ON treasury_transactions;
DROP POLICY IF EXISTS "tt_delete"                          ON treasury_transactions;

CREATE POLICY "tt_select" ON treasury_transactions FOR SELECT
  USING (
    user_id = auth.uid()
    OR (organization_id IS NOT NULL AND is_org_member(organization_id))
  );
CREATE POLICY "tt_insert" ON treasury_transactions FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "tt_update" ON treasury_transactions FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "tt_delete" ON treasury_transactions FOR DELETE
  USING (user_id = auth.uid());

-- treasury_recurring
DROP POLICY IF EXISTS "trecurring_own"                ON treasury_recurring;
DROP POLICY IF EXISTS "user_select_treasury_recurring" ON treasury_recurring;
DROP POLICY IF EXISTS "user_insert_treasury_recurring" ON treasury_recurring;
DROP POLICY IF EXISTS "user_update_treasury_recurring" ON treasury_recurring;
DROP POLICY IF EXISTS "user_delete_treasury_recurring" ON treasury_recurring;
DROP POLICY IF EXISTS "tr_select"                      ON treasury_recurring;
DROP POLICY IF EXISTS "tr_insert"                      ON treasury_recurring;
DROP POLICY IF EXISTS "tr_update"                      ON treasury_recurring;
DROP POLICY IF EXISTS "tr_delete"                      ON treasury_recurring;

CREATE POLICY "tr_select" ON treasury_recurring FOR SELECT
  USING (
    user_id = auth.uid()
    OR (organization_id IS NOT NULL AND is_org_member(organization_id))
  );
CREATE POLICY "tr_insert" ON treasury_recurring FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "tr_update" ON treasury_recurring FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "tr_delete" ON treasury_recurring FOR DELETE
  USING (user_id = auth.uid());

COMMIT;
