-- ── Migration 159 — Chatbot IA : Avancé (webhooks, business hours, quotas) ────

-- ── Colonnes avancées sur chatbots ───────────────────────────────────────────

ALTER TABLE chatbots
  ADD COLUMN IF NOT EXISTS webhook_url           text,
  ADD COLUMN IF NOT EXISTS webhook_events        jsonb NOT NULL DEFAULT '["new_message"]',
  ADD COLUMN IF NOT EXISTS business_hours        jsonb,
  ADD COLUMN IF NOT EXISTS monthly_message_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_reset_at      timestamptz NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month');

-- ── Logs des webhooks ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chatbot_webhook_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id  uuid NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  event       text NOT NULL,
  payload     jsonb NOT NULL DEFAULT '{}',
  status_code integer,
  error       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chatbot_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_logs_owner" ON chatbot_webhook_logs
  FOR ALL USING (
    chatbot_id IN (SELECT id FROM chatbots WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS chatbot_webhook_logs_chatbot_idx
  ON chatbot_webhook_logs(chatbot_id);
CREATE INDEX IF NOT EXISTS chatbot_webhook_logs_created_at_idx
  ON chatbot_webhook_logs(created_at DESC);

-- ── RPC : statistiques journalières par user ──────────────────────────────────

CREATE OR REPLACE FUNCTION chatbot_daily_stats(
  p_user_id  uuid,
  p_days     int DEFAULT 30
)
RETURNS TABLE (
  stat_date     date,
  conversations bigint,
  messages      bigint
)
LANGUAGE sql STABLE
AS $$
  SELECT
    date_trunc('day', cc.created_at)::date AS stat_date,
    COUNT(DISTINCT cc.id)                   AS conversations,
    COUNT(cm.id)                            AS messages
  FROM chatbot_conversations cc
  JOIN chatbots cb ON cb.id = cc.chatbot_id AND cb.user_id = p_user_id
  LEFT JOIN chatbot_messages cm ON cm.conversation_id = cc.id
  WHERE cc.created_at >= now() - (p_days || ' days')::interval
  GROUP BY 1
  ORDER BY 1;
$$;
