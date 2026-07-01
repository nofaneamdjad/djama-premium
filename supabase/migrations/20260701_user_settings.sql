-- Table user_settings : préférences et paramètres persistants par utilisateur
CREATE TABLE IF NOT EXISTS user_settings (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key         TEXT NOT NULL,
  value       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, key)
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_select_user_settings" ON user_settings
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_insert_user_settings" ON user_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_update_user_settings" ON user_settings
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "user_delete_user_settings" ON user_settings
  FOR DELETE USING (user_id = auth.uid());

-- Index pour les lookups rapides
CREATE INDEX IF NOT EXISTS user_settings_user_key ON user_settings(user_id, key);
