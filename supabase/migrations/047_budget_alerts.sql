-- ── Migration 047 : Alertes budget push/email ────────────────────────────

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'expense_budgets'
  ) THEN
    ALTER TABLE expense_budgets
      ADD COLUMN IF NOT EXISTS alert_threshold int     NOT NULL DEFAULT 80,
      ADD COLUMN IF NOT EXISTS notify_push     boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS notify_email    boolean NOT NULL DEFAULT false;

    CREATE TABLE IF NOT EXISTS budget_alert_log (
      id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      budget_id   uuid        REFERENCES expense_budgets(id) ON DELETE CASCADE NOT NULL,
      period      text        NOT NULL,
      threshold   int         NOT NULL,
      sent_at     timestamptz NOT NULL DEFAULT now()
    );

    ALTER TABLE budget_alert_log ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "budget_alert_log_user" ON budget_alert_log;
    CREATE POLICY "budget_alert_log_user"
      ON budget_alert_log FOR ALL
      USING  (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    CREATE UNIQUE INDEX IF NOT EXISTS budget_alert_log_uniq
      ON budget_alert_log (budget_id, period, threshold);
  END IF;
END $$;
