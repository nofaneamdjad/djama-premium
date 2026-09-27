-- ── P0.4 Soft-delete sur expenses ──────────────────────────────────────────
-- Ajoute deleted_at à expenses (droit comptable : pas de suppression physique)
-- Idempotent — sûr à rejouer

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE expenses ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
  END IF;
END; $$;

-- Index pour filtrer les non-supprimées efficacement
CREATE INDEX IF NOT EXISTS idx_expenses_not_deleted
  ON expenses(user_id) WHERE deleted_at IS NULL;

-- Recréer la politique SELECT en filtrant deleted_at
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

-- Les suppressions physiques ne sont plus autorisées (soft-delete via UPDATE)
DROP POLICY IF EXISTS "expenses_own_delete" ON expenses;
