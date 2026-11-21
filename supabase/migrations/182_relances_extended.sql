-- Relances — Extension du module (migration locale uniquement)
-- Étend relance_config, relance_log et crée relance_templates

-- ── Étendre relance_config ──────────────────────────────────────
ALTER TABLE relance_config
  ADD COLUMN IF NOT EXISTS send_time        time        DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS timezone         text        DEFAULT 'Europe/Paris',
  ADD COLUMN IF NOT EXISTS language         text        DEFAULT 'fr',
  ADD COLUMN IF NOT EXISTS draft_mode       boolean     DEFAULT false,
  ADD COLUMN IF NOT EXISTS excluded_clients uuid[]      DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS stop_on_dispute  boolean     DEFAULT true,
  ADD COLUMN IF NOT EXISTS max_relances     int         DEFAULT 5;

-- ── Étendre relance_log ─────────────────────────────────────────
ALTER TABLE relance_log
  ADD COLUMN IF NOT EXISTS status           text        DEFAULT 'sent'
    CHECK (status IN ('sent','failed','pending','cancelled','scheduled')),
  ADD COLUMN IF NOT EXISTS channel          text        DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS template_level   text,
  ADD COLUMN IF NOT EXISTS message_id       text,
  ADD COLUMN IF NOT EXISTS error_message    text,
  ADD COLUMN IF NOT EXISTS scheduled_at     timestamptz;

-- Index pour l'historique paginé
CREATE INDEX IF NOT EXISTS relance_log_status_idx
  ON relance_log (user_id, status, sent_at DESC);

-- ── relance_templates ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS relance_templates (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  level         text        NOT NULL
    CHECK (level IN ('rappel','amical','professionnel','ferme','dernier','mise_en_demeure')),
  name          text        NOT NULL,
  subject       text        NOT NULL,
  body          text        NOT NULL,
  is_default    boolean     DEFAULT false,
  is_system     boolean     DEFAULT false,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE relance_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "relance_tpl_select" ON relance_templates
  FOR SELECT USING (auth.uid() = user_id OR is_system = true);
CREATE POLICY "relance_tpl_insert" ON relance_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "relance_tpl_update" ON relance_templates
  FOR UPDATE USING (auth.uid() = user_id AND is_system = false);
CREATE POLICY "relance_tpl_delete" ON relance_templates
  FOR DELETE USING (auth.uid() = user_id AND is_system = false);

-- Index
CREATE UNIQUE INDEX IF NOT EXISTS relance_tpl_user_level_idx
  ON relance_templates (user_id, level);
