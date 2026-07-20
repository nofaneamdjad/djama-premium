-- ═══════════════════════════════════════════════════════════
-- ESPACES PRIVÉS — Multi-espace membre isolé par abonné
-- ═══════════════════════════════════════════════════════════

-- 1. Table des espaces privés
CREATE TABLE IF NOT EXISTS private_spaces (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT DEFAULT '',
  color        TEXT DEFAULT '#c9a55a',
  access_code  TEXT NOT NULL,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, access_code)
);

CREATE INDEX IF NOT EXISTS idx_ps_user ON private_spaces(user_id);
ALTER TABLE private_spaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ps_own" ON private_spaces;
CREATE POLICY "ps_own" ON private_spaces
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 2. Lier les membres à un espace privé
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS
  space_id UUID REFERENCES private_spaces(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tm_space ON team_members(space_id);

-- 3. Lier les contenus à un espace privé
ALTER TABLE team_messages ADD COLUMN IF NOT EXISTS
  space_id UUID REFERENCES private_spaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_tmsg_space ON team_messages(space_id);

ALTER TABLE team_tasks ADD COLUMN IF NOT EXISTS
  space_id UUID REFERENCES private_spaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_tt_space ON team_tasks(space_id);

ALTER TABLE team_meetings ADD COLUMN IF NOT EXISTS
  space_id UUID REFERENCES private_spaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_tmeet_space ON team_meetings(space_id);
