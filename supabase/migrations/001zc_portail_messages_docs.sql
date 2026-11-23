-- Migration : Portail Client — messages et documents partagés
-- À exécuter dans Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS portail_messages (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  portail_client_id UUID        NOT NULL REFERENCES portail_clients(id) ON DELETE CASCADE,
  user_id           UUID        NOT NULL,
  from_role         TEXT        NOT NULL CHECK (from_role IN ('admin', 'client')),
  text              TEXT        NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portail_docs (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  portail_client_id UUID        NOT NULL REFERENCES portail_clients(id) ON DELETE CASCADE,
  user_id           UUID        NOT NULL,
  name              TEXT        NOT NULL,
  file_type         TEXT,
  size              BIGINT,
  url               TEXT        NOT NULL,
  storage_path      TEXT,
  uploaded_by       TEXT        NOT NULL CHECK (uploaded_by IN ('admin', 'client')),
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Index pour les requêtes par portail_client_id
CREATE INDEX IF NOT EXISTS portail_messages_client_idx ON portail_messages(portail_client_id);
CREATE INDEX IF NOT EXISTS portail_docs_client_idx     ON portail_docs(portail_client_id);

-- RLS
ALTER TABLE portail_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE portail_docs     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_portail_messages" ON portail_messages
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_portail_docs" ON portail_docs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
