-- ════════════════════════════════════════════════════════
-- ASSISTANT IA — Conversations & Messages
-- ════════════════════════════════════════════════════════

-- ── 1. Conversations ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_conversations (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text        DEFAULT 'Nouvelle conversation',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aiconv_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_aiconv_date ON ai_conversations(updated_at DESC);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "aiconv_own" ON ai_conversations;
CREATE POLICY "aiconv_own" ON ai_conversations
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 2. Messages ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid        REFERENCES ai_conversations(id) ON DELETE CASCADE,
  -- user | assistant
  role            text        NOT NULL DEFAULT 'user',
  content         text        NOT NULL,
  -- modules consultés lors de la génération
  modules_used    text[]      DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aimsg_conv ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_aimsg_user ON ai_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_aimsg_date ON ai_messages(created_at);

ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "aimsg_own" ON ai_messages;
CREATE POLICY "aimsg_own" ON ai_messages
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 3. Trigger updated_at conversations ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_ai_conv_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS aiconv_updated_at ON ai_conversations;
CREATE TRIGGER aiconv_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_ai_conv_timestamp();
