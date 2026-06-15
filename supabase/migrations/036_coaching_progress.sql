-- 036_coaching_progress.sql
-- Progression coaching IA par utilisateur

CREATE TABLE IF NOT EXISTS coaching_progress (
  id           uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cours_id     text        NOT NULL,
  completed    boolean     NOT NULL DEFAULT false,
  quiz_score   integer,
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, cours_id)
);

ALTER TABLE coaching_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coaching_progress_own" ON coaching_progress
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_coaching_progress_user ON coaching_progress (user_id);
