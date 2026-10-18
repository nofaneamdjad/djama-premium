-- ── Migration 157 — Chatbot IA : Base de connaissances (RAG) ───────────────────

-- pgvector extension (activée par défaut sur Supabase)
CREATE EXTENSION IF NOT EXISTS vector;

-- ── Documents ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chatbot_documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id  uuid NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  type        text NOT NULL DEFAULT 'text'
    CHECK (type IN ('text', 'faq', 'url')),
  title       text NOT NULL,
  content     text,           -- texte brut ou JSON FAQ
  url         text,           -- pour type = 'url'

  status      text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'ready', 'error')),
  chunk_count int  NOT NULL DEFAULT 0,
  error_message text,
  metadata    jsonb NOT NULL DEFAULT '{}',

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chatbot_documents_chatbot_idx ON chatbot_documents(chatbot_id);
CREATE INDEX IF NOT EXISTS chatbot_documents_status_idx  ON chatbot_documents(status);

-- ── Chunks vectorisés ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chatbot_chunks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id   uuid NOT NULL REFERENCES chatbots(id)           ON DELETE CASCADE,
  document_id  uuid NOT NULL REFERENCES chatbot_documents(id)  ON DELETE CASCADE,

  content      text    NOT NULL,
  embedding    vector(1536),   -- text-embedding-3-small
  position     int     NOT NULL DEFAULT 0,
  token_count  int     NOT NULL DEFAULT 0,

  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chatbot_chunks_chatbot_idx ON chatbot_chunks(chatbot_id);
-- Index ivfflat pour la recherche vectorielle (cosine)
CREATE INDEX IF NOT EXISTS chatbot_chunks_embedding_idx
  ON chatbot_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- ── Triggers updated_at ────────────────────────────────────────────────────────

CREATE OR REPLACE TRIGGER chatbot_documents_updated_at
  BEFORE UPDATE ON chatbot_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_chatbot();

-- ── RLS ────────────────────────────────────────────────────────────────────────

ALTER TABLE chatbot_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_chunks    ENABLE ROW LEVEL SECURITY;

-- Documents : lecture/écriture par owner via user_id
CREATE POLICY "chatbot_documents_owner" ON chatbot_documents
  FOR ALL USING (user_id = auth.uid());

-- Chunks : lecture/écriture par owner via chatbots.user_id
CREATE POLICY "chatbot_chunks_owner" ON chatbot_chunks
  FOR ALL USING (
    chatbot_id IN (
      SELECT id FROM chatbots WHERE user_id = auth.uid()
    )
  );

-- ── Colonne rag_enabled sur chatbots ──────────────────────────────────────────

ALTER TABLE chatbots
  ADD COLUMN IF NOT EXISTS rag_enabled     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS document_count  int     NOT NULL DEFAULT 0;
