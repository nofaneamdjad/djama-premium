-- ── Migration 047 : Alertes budget push/email ────────────────────────────
-- Ajoute la configuration d'alerte sur chaque ligne de budget :
--   alert_threshold : seuil déclencheur en % (par défaut 80 %)
--   notify_push     : envoyer une notification push
--   notify_email    : envoyer un email Resend
--
-- budget_alert_log : évite les doublons (1 alerte/budget/période/seuil)

ALTER TABLE expense_budgets
  ADD COLUMN IF NOT EXISTS alert_threshold int     NOT NULL DEFAULT 80,
  ADD COLUMN IF NOT EXISTS notify_push     boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_email    boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS budget_alert_log (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  budget_id   uuid        REFERENCES expense_budgets(id) ON DELETE CASCADE NOT NULL,
  period      text        NOT NULL,  -- ex. "2026-08"
  threshold   int         NOT NULL,  -- 80 ou 100
  sent_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE budget_alert_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_alert_log_user"
  ON budget_alert_log FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE UNIQUE INDEX IF NOT EXISTS budget_alert_log_uniq
  ON budget_alert_log (budget_id, period, threshold);
