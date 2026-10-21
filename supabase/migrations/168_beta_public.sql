-- ─────────────────────────────────────────────────────────────
-- Migration 168 — Bêta publique DJAMA
-- Tables : beta_config, beta_feedback
-- Colonnes : user_subscriptions.beta_*
-- ─────────────────────────────────────────────────────────────

-- ── 1. beta_config ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS beta_config (
  id                text        PRIMARY KEY DEFAULT 'default',
  signups_open      boolean     NOT NULL DEFAULT false,
  max_testers       integer     NOT NULL DEFAULT 50,
  current_testers   integer     NOT NULL DEFAULT 0,
  beta_ends_at      timestamptz,
  ai_quota_per_user integer     NOT NULL DEFAULT 200,
  storage_quota_mb  integer     NOT NULL DEFAULT 500,
  updated_at        timestamptz DEFAULT now()
);

-- Ligne de configuration par défaut
INSERT INTO beta_config (id, signups_open, max_testers)
VALUES ('default', false, 50)
ON CONFLICT (id) DO NOTHING;

-- ── 2. beta_feedback ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS beta_feedback (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  type           text        NOT NULL CHECK (type IN ('bug','feature','difficulty','rating','general')),
  app_name       text,
  message        text        NOT NULL CHECK (char_length(message) BETWEEN 1 AND 5000),
  rating         integer     CHECK (rating BETWEEN 1 AND 5),
  screenshot_url text,
  status         text        NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','closed')),
  admin_reply    text,
  replied_at     timestamptz,
  metadata       jsonb       NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- RLS beta_feedback
ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "beta_feedback_insert_own" ON beta_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "beta_feedback_select_own" ON beta_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS beta_feedback_user_id_idx ON beta_feedback (user_id);
CREATE INDEX IF NOT EXISTS beta_feedback_status_idx  ON beta_feedback (status);
CREATE INDEX IF NOT EXISTS beta_feedback_created_idx ON beta_feedback (created_at DESC);

-- ── 3. Étendre user_subscriptions avec les champs bêta ─────────
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS beta_access      boolean     DEFAULT false,
  ADD COLUMN IF NOT EXISTS beta_expires_at  timestamptz,
  ADD COLUMN IF NOT EXISTS ai_calls_used    integer     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_calls_reset_at timestamptz DEFAULT now();

-- ── 4. Index utile pour admin beta ─────────────────────────────
CREATE INDEX IF NOT EXISTS us_beta_access_idx ON user_subscriptions (beta_access)
  WHERE beta_access = true;
