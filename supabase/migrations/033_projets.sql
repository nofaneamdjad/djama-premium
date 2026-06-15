-- 033_projets.sql
-- Table projets : suivi de projets clients pour freelances et TPE

CREATE TABLE IF NOT EXISTS projects (
  id          uuid          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text          NOT NULL DEFAULT '',
  client      text          NOT NULL DEFAULT '',
  status      text          NOT NULL DEFAULT 'en_cours'
                            CHECK (status IN ('en_cours', 'terminé', 'en_attente', 'annulé')),
  category    text          NOT NULL DEFAULT 'Autre',
  start_date  date,
  end_date    date,
  budget      numeric(12,2) NOT NULL DEFAULT 0,
  spent       numeric(12,2) NOT NULL DEFAULT 0,
  description text          NOT NULL DEFAULT '',
  color       text          NOT NULL DEFAULT '#8b5cf6',
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_own" ON projects
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_projects_user   ON projects (user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (user_id, status);
