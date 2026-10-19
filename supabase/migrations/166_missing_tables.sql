-- ════════════════════════════════════════════════════════════════════════
-- 166_missing_tables.sql — Tables manquantes des migrations non-numérotées
-- Entièrement idempotent (IF NOT EXISTS / IF NOT EXISTS sur colonnes)
-- ════════════════════════════════════════════════════════════════════════

-- ─── 1. user_settings — préférences persistantes par utilisateur ──────────
CREATE TABLE IF NOT EXISTS user_settings (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key        text        NOT NULL,
  value      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, key)
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_key ON user_settings(user_id, key);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_select_user_settings" ON user_settings;
DROP POLICY IF EXISTS "user_insert_user_settings" ON user_settings;
DROP POLICY IF EXISTS "user_update_user_settings" ON user_settings;
DROP POLICY IF EXISTS "user_delete_user_settings" ON user_settings;
CREATE POLICY "user_select_user_settings" ON user_settings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_insert_user_settings" ON user_settings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_update_user_settings" ON user_settings FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "user_delete_user_settings" ON user_settings FOR DELETE USING (user_id = auth.uid());

-- ─── 2. client_requests — formulaires de contact public ──────────────────
CREATE TABLE IF NOT EXISTS client_requests (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name      text        NOT NULL,
  client_email     text,
  client_phone     text,
  subject          text        NOT NULL,
  message          text,
  consent_email    boolean     NOT NULL DEFAULT false,
  consent_sms      boolean     NOT NULL DEFAULT false,
  consent_whatsapp boolean     NOT NULL DEFAULT false,
  status           text        NOT NULL DEFAULT 'nouveau',
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE client_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_read"    ON client_requests;
DROP POLICY IF EXISTS "public_insert" ON client_requests;
CREATE POLICY "owner_read"    ON client_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "public_insert" ON client_requests FOR INSERT WITH CHECK (true);

-- ─── 3. private_spaces — espaces privés multi-tenant ─────────────────────
CREATE TABLE IF NOT EXISTS private_spaces (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text    NOT NULL,
  description text    DEFAULT '',
  color       text    DEFAULT '#c9a55a',
  access_code text    NOT NULL,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, access_code)
);

CREATE INDEX IF NOT EXISTS idx_ps_user ON private_spaces(user_id);

ALTER TABLE private_spaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ps_own" ON private_spaces;
CREATE POLICY "ps_own" ON private_spaces
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Lier les contenus equipe à un espace privé
ALTER TABLE team_members  ADD COLUMN IF NOT EXISTS space_id uuid REFERENCES private_spaces(id) ON DELETE SET NULL;
ALTER TABLE team_messages ADD COLUMN IF NOT EXISTS space_id uuid REFERENCES private_spaces(id) ON DELETE CASCADE;
ALTER TABLE team_tasks    ADD COLUMN IF NOT EXISTS space_id uuid REFERENCES private_spaces(id) ON DELETE CASCADE;
ALTER TABLE team_meetings ADD COLUMN IF NOT EXISTS space_id uuid REFERENCES private_spaces(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_tm_space   ON team_members(space_id)   WHERE space_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tmsg_space ON team_messages(space_id)  WHERE space_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tt_space   ON team_tasks(space_id)     WHERE space_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tmeet_space ON team_meetings(space_id) WHERE space_id IS NOT NULL;
