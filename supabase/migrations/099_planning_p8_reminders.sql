-- ════════════════════════════════════════════════════════════════════════
-- 099_planning_p8_reminders.sql
-- Phase 8 Planning : Rappels réels
--
-- Crée planning_reminders :
--   event_id        → planning_events(id) ON DELETE CASCADE
--   user_id         → auth.users(id) ON DELETE CASCADE
--   remind_at       TIMESTAMPTZ  (quand envoyer le rappel)
--   channel         TEXT  : email | push | both
--   sent_at         TIMESTAMPTZ NULL (NULL = pas encore envoyé)
--   sent_ok         BOOLEAN
--
-- Un job cron (Edge Function ou pg_cron) SELECT les rappels
-- WHERE remind_at <= now() AND sent_at IS NULL, les envoie, et met
-- sent_at = now().
--
-- Idempotent
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS planning_reminders (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid         NOT NULL REFERENCES planning_events(id) ON DELETE CASCADE,
  user_id     uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  remind_at   timestamptz  NOT NULL,
  channel     text         NOT NULL DEFAULT 'email'
                           CHECK (channel IN ('email','push','both')),
  sent_at     timestamptz,
  sent_ok     boolean,
  created_at  timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE planning_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "pr_select_own" ON planning_reminders FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "pr_insert_own" ON planning_reminders FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "pr_update_own" ON planning_reminders FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "pr_delete_own" ON planning_reminders FOR DELETE
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_pr_pending
  ON planning_reminders(remind_at)
  WHERE sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_pr_user_event
  ON planning_reminders(user_id, event_id);
