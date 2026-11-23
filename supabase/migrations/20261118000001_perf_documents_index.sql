-- Performance: index on (user_id, updated_at) for ORDER BY updated_at queries
-- Applied locally only — requires remote authorization before prod deployment
CREATE INDEX IF NOT EXISTS idx_documents_updated_at
  ON documents (user_id, updated_at DESC)
  WHERE deleted_at IS NULL;

-- Performance: index on user_settings (user_id, key) for LIKE 'brand.%' queries
CREATE INDEX IF NOT EXISTS idx_user_settings_user_key
  ON user_settings (user_id, key);
