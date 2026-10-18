-- ── Migration 156 — Chatbot IA ────────────────────────────────────────────────

-- ── Table principale : chatbots ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chatbots (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id  uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identité
  name        text NOT NULL DEFAULT 'Mon Chatbot',
  description text,
  status      text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'disabled')),

  -- Comportement
  language            text     NOT NULL DEFAULT 'fr',
  secondary_languages text[]   NOT NULL DEFAULT '{}',
  personality         text     NOT NULL DEFAULT 'professional'
    CHECK (personality IN ('professional', 'friendly', 'technical', 'formal', 'empathetic')),
  instructions        text     NOT NULL DEFAULT '',
  welcome_message     text     NOT NULL DEFAULT 'Bonjour ! Comment puis-je vous aider ?',
  fallback_message    text     NOT NULL DEFAULT 'Je n''ai pas trouvé de réponse à votre question. Souhaitez-vous contacter notre équipe ?',

  -- IA
  model       text    NOT NULL DEFAULT 'claude-haiku-4-5',
  max_tokens  integer NOT NULL DEFAULT 1024
    CHECK (max_tokens BETWEEN 256 AND 4096),

  -- Fonctionnalités
  tools_enabled  jsonb NOT NULL DEFAULT '[]',
  channels       jsonb NOT NULL DEFAULT '["widget"]',
  allowed_domains text[] NOT NULL DEFAULT '{}',
  require_consent boolean NOT NULL DEFAULT false,
  rate_limit_per_hour integer NOT NULL DEFAULT 30,

  -- Apparence widget
  widget_config jsonb NOT NULL DEFAULT '{}',

  -- Compteurs (dénormalisés)
  conversation_count integer NOT NULL DEFAULT 0,
  message_count      integer NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chatbots ENABLE ROW LEVEL SECURITY;

CREATE POLICY cb_select ON chatbots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY cb_insert ON chatbots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY cb_update ON chatbots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY cb_delete ON chatbots FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS chatbots_user_id_idx      ON chatbots(user_id);
CREATE INDEX IF NOT EXISTS chatbots_public_id_idx     ON chatbots(public_id);
CREATE INDEX IF NOT EXISTS chatbots_status_idx        ON chatbots(status);

-- ── Conversations ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,

  -- Visiteur
  visitor_id    text,
  visitor_name  text,
  visitor_email text,

  -- État
  status  text NOT NULL DEFAULT 'ai_active'
    CHECK (status IN ('ai_active', 'waiting_agent', 'agent_connected', 'closed')),
  channel text NOT NULL DEFAULT 'widget',

  -- Contexte
  metadata    jsonb NOT NULL DEFAULT '{}',
  assigned_to uuid REFERENCES auth.users(id),
  notes       text,

  -- Dates
  last_message_at timestamptz,
  closed_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY cc_select ON chatbot_conversations FOR SELECT
  USING (EXISTS (SELECT 1 FROM chatbots WHERE chatbots.id = chatbot_id AND chatbots.user_id = auth.uid()));

CREATE POLICY cc_insert ON chatbot_conversations FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM chatbots WHERE chatbots.id = chatbot_id AND chatbots.user_id = auth.uid()));

CREATE POLICY cc_update ON chatbot_conversations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM chatbots WHERE chatbots.id = chatbot_id AND chatbots.user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS cc_chatbot_id_idx        ON chatbot_conversations(chatbot_id);
CREATE INDEX IF NOT EXISTS cc_status_idx            ON chatbot_conversations(status);
CREATE INDEX IF NOT EXISTS cc_last_message_at_idx   ON chatbot_conversations(last_message_at DESC);

-- ── Messages ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chatbot_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  chatbot_id      uuid NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,

  role    text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,

  -- IA
  tokens_used integer DEFAULT 0,
  model       text,
  sources     jsonb NOT NULL DEFAULT '[]',

  is_escalation_request boolean NOT NULL DEFAULT false,

  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY cm_select ON chatbot_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM chatbot_conversations cc
    JOIN chatbots cb ON cb.id = cc.chatbot_id
    WHERE cc.id = conversation_id AND cb.user_id = auth.uid()
  ));

CREATE POLICY cm_insert ON chatbot_messages FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS cm_conversation_id_idx ON chatbot_messages(conversation_id);
CREATE INDEX IF NOT EXISTS cm_chatbot_id_idx      ON chatbot_messages(chatbot_id);
CREATE INDEX IF NOT EXISTS cm_created_at_idx      ON chatbot_messages(created_at);

-- ── Triggers updated_at ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_chatbot()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_chatbot_updated_at
  BEFORE UPDATE ON chatbots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_chatbot();

CREATE TRIGGER trg_cc_updated_at
  BEFORE UPDATE ON chatbot_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_chatbot();
