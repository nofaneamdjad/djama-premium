-- 034_social_posts.sql
-- Table posts réseaux sociaux

CREATE TABLE IF NOT EXISTS social_posts (
  id           uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform     text        NOT NULL DEFAULT 'instagram'
                           CHECK (platform IN ('instagram', 'facebook', 'linkedin', 'tiktok')),
  content      text        NOT NULL DEFAULT '',
  hashtags     text[]      NOT NULL DEFAULT '{}',
  status       text        NOT NULL DEFAULT 'brouillon'
                           CHECK (status IN ('brouillon', 'planifié', 'publié')),
  scheduled_at timestamptz,
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_posts_own" ON social_posts
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_social_posts_user     ON social_posts (user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_status   ON social_posts (user_id, status);
CREATE INDEX IF NOT EXISTS idx_social_posts_platform ON social_posts (user_id, platform);
