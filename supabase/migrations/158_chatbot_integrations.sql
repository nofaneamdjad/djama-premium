-- ── Migration 158 — Chatbot IA : Intégrations DJAMA ────────────────────────────

CREATE TABLE IF NOT EXISTS chatbot_integrations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id  uuid NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  type        text NOT NULL
    CHECK (type IN ('crm', 'rdv', 'boutique', 'factures')),
  enabled     boolean NOT NULL DEFAULT false,
  config      jsonb   NOT NULL DEFAULT '{}',

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  UNIQUE(chatbot_id, type)
);

CREATE INDEX IF NOT EXISTS chatbot_integrations_chatbot_idx
  ON chatbot_integrations(chatbot_id);

CREATE OR REPLACE TRIGGER chatbot_integrations_updated_at
  BEFORE UPDATE ON chatbot_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE chatbot_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chatbot_integrations_owner" ON chatbot_integrations
  FOR ALL USING (user_id = auth.uid());
