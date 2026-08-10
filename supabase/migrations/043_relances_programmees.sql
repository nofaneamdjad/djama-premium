-- Relances automatiques programmées
-- relance_config : préférences par utilisateur
-- relance_log    : anti-spam — une relance par seuil et par document

CREATE TABLE IF NOT EXISTS relance_config (
  user_id    uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled    boolean     NOT NULL DEFAULT false,
  delays     int[]       NOT NULL DEFAULT '{7,14,30}',
  email_cc   text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE relance_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "relance_config_select" ON relance_config
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "relance_config_insert" ON relance_config
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "relance_config_update" ON relance_config
  FOR UPDATE USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS relance_log (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid        NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delay_days  int         NOT NULL,
  sent_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE relance_log ENABLE ROW LEVEL SECURITY;

-- Lecture seule côté client
CREATE POLICY "relance_log_select" ON relance_log
  FOR SELECT USING (auth.uid() = user_id);
-- Écriture uniquement via service_role (cron)

CREATE INDEX IF NOT EXISTS relance_log_doc_delay_idx
  ON relance_log (document_id, delay_days);
CREATE INDEX IF NOT EXISTS relance_log_user_sent_idx
  ON relance_log (user_id, sent_at DESC);
