-- ── P1.1 Organisation : org_id + deleted_at sur expense_reports et expense_budgets ──
-- ── P1.2 RLS expenses / expense_reports / expense_budgets : accès membres d'org   ──
-- Idempotent — sûr à rejouer. Tout conditionnel à l'existence des tables.

-- ── expense_reports ───────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='expense_reports') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expense_reports' AND column_name='organization_id') THEN
      ALTER TABLE expense_reports ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expense_reports' AND column_name='deleted_at') THEN
      ALTER TABLE expense_reports ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
    END IF;
    CREATE INDEX IF NOT EXISTS idx_expense_reports_not_deleted ON expense_reports(user_id) WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_expense_reports_org ON expense_reports(organization_id) WHERE organization_id IS NOT NULL AND deleted_at IS NULL;
    DROP POLICY IF EXISTS "expense_reports_own"    ON expense_reports;
    DROP POLICY IF EXISTS "expense_reports_select" ON expense_reports;
    DROP POLICY IF EXISTS "expense_reports_insert" ON expense_reports;
    DROP POLICY IF EXISTS "expense_reports_update" ON expense_reports;
    DROP POLICY IF EXISTS "expense_reports_delete" ON expense_reports;
    CREATE POLICY "expense_reports_select" ON expense_reports FOR SELECT USING (
      deleted_at IS NULL AND (user_id = auth.uid() OR (organization_id IS NOT NULL AND is_org_member(organization_id)))
    );
    CREATE POLICY "expense_reports_insert" ON expense_reports FOR INSERT WITH CHECK (user_id = auth.uid());
    CREATE POLICY "expense_reports_update" ON expense_reports FOR UPDATE
      USING (user_id = auth.uid() AND deleted_at IS NULL) WITH CHECK (user_id = auth.uid());
  END IF;
END; $$;

-- ── expense_budgets ───────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='expense_budgets') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expense_budgets' AND column_name='organization_id') THEN
      ALTER TABLE expense_budgets ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL;
    END IF;
    CREATE INDEX IF NOT EXISTS idx_expense_budgets_org ON expense_budgets(organization_id) WHERE organization_id IS NOT NULL;
    DROP POLICY IF EXISTS "expense_budgets_own"    ON expense_budgets;
    DROP POLICY IF EXISTS "expense_budgets_select" ON expense_budgets;
    DROP POLICY IF EXISTS "expense_budgets_insert" ON expense_budgets;
    DROP POLICY IF EXISTS "expense_budgets_update" ON expense_budgets;
    DROP POLICY IF EXISTS "expense_budgets_delete" ON expense_budgets;
    CREATE POLICY "expense_budgets_select" ON expense_budgets FOR SELECT USING (
      user_id = auth.uid() OR (organization_id IS NOT NULL AND is_org_member(organization_id))
    );
    CREATE POLICY "expense_budgets_insert" ON expense_budgets FOR INSERT WITH CHECK (user_id = auth.uid());
    CREATE POLICY "expense_budgets_update" ON expense_budgets FOR UPDATE
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
    CREATE POLICY "expense_budgets_delete" ON expense_budgets FOR DELETE USING (user_id = auth.uid());
  END IF;
END; $$;

-- ── expenses (toujours présente via migration 018) ────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='expenses') THEN
    CREATE INDEX IF NOT EXISTS idx_expenses_org ON expenses(organization_id) WHERE organization_id IS NOT NULL AND deleted_at IS NULL;
    DROP POLICY IF EXISTS "expenses_own"        ON expenses;
    DROP POLICY IF EXISTS "expenses_own_insert" ON expenses;
    DROP POLICY IF EXISTS "expenses_own_update" ON expenses;
    DROP POLICY IF EXISTS "expenses_own_delete" ON expenses;
    CREATE POLICY "expenses_own" ON expenses FOR SELECT USING (
      deleted_at IS NULL AND (user_id = auth.uid() OR (organization_id IS NOT NULL AND is_org_member(organization_id)))
    );
    CREATE POLICY "expenses_own_insert" ON expenses FOR INSERT WITH CHECK (user_id = auth.uid());
    CREATE POLICY "expenses_own_update" ON expenses FOR UPDATE
      USING (user_id = auth.uid() AND deleted_at IS NULL) WITH CHECK (user_id = auth.uid());
  END IF;
END; $$;
