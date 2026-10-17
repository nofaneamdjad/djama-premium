-- Migration 151 : redirections URL pour le Website Builder
-- À appliquer via le SQL editor Supabase

CREATE TABLE IF NOT EXISTS website_redirections (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id   UUID        NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL,
  from_path    TEXT        NOT NULL,
  to_url       TEXT        NOT NULL,
  status_code  INTEGER     NOT NULL DEFAULT 301 CHECK (status_code IN (301, 302, 307, 308)),
  enabled      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE website_redirections IS 'Redirections URL configurables par site Website Builder';

ALTER TABLE website_redirections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_redirections" ON website_redirections
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_website_redirections_site  ON website_redirections (website_id);
CREATE INDEX idx_website_redirections_path  ON website_redirections (website_id, from_path)
  WHERE enabled = TRUE;
