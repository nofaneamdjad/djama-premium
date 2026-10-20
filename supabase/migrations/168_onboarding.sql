-- 168_onboarding.sql — Suivi de l'onboarding utilisateur
-- Table légère pour enregistrer la progression de l'onboarding sans bloquer

CREATE TABLE IF NOT EXISTS onboarding_progress (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step        text NOT NULL,
  completed   boolean NOT NULL DEFAULT false,
  skipped     boolean NOT NULL DEFAULT false,
  data        jsonb,
  completed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, step)
);

ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onboarding_own" ON onboarding_progress
  FOR ALL USING (user_id = auth.uid());

-- Index pour lookup rapide
CREATE INDEX IF NOT EXISTS onboarding_progress_user_idx
  ON onboarding_progress (user_id);

-- Table pour les préférences de l'entreprise saisies à l'onboarding
CREATE TABLE IF NOT EXISTS company_profile (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_name    text,
  activity        text,
  country         text DEFAULT 'FR',
  currency        text DEFAULT 'EUR',
  phone           text,
  address         text,
  logo_url        text,
  selected_modules text[] DEFAULT '{}',
  onboarding_done boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE company_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_profile_own" ON company_profile
  FOR ALL USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS company_profile_user_idx ON company_profile (user_id);
