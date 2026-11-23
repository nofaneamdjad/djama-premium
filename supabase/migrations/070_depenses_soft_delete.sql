-- P0.4 Soft-delete sur expenses
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='expenses') THEN
    ALTER TABLE expenses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
    CREATE INDEX IF NOT EXISTS idx_expenses_not_deleted
      ON expenses(user_id) WHERE deleted_at IS NULL;
    DROP POLICY IF EXISTS "expenses_own" ON expenses;
    CREATE POLICY "expenses_own" ON expenses
      FOR SELECT USING (user_id = auth.uid() AND deleted_at IS NULL);
    DROP POLICY IF EXISTS "expenses_own_insert" ON expenses;
    CREATE POLICY "expenses_own_insert" ON expenses
      FOR INSERT WITH CHECK (user_id = auth.uid());
    DROP POLICY IF EXISTS "expenses_own_update" ON expenses;
    CREATE POLICY "expenses_own_update" ON expenses
      FOR UPDATE USING (user_id = auth.uid() AND deleted_at IS NULL)
      WITH CHECK (user_id = auth.uid());
    DROP POLICY IF EXISTS "expenses_own_delete" ON expenses;
  END IF;
END $$;
