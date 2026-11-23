-- Migration : localStorage → Supabase
-- Modules : Projets, Équipe, Contrats, Paie, Bloc-notes
-- À exécuter dans Supabase Dashboard > SQL Editor

-- ─────────────────────────────────────────
-- PROJETS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_tasks (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL,
  project_id  UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  done        BOOLEAN     DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_milestones (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL,
  project_id  UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  date        DATE,
  done        BOOLEAN     DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_team (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL,
  project_id  UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  member_name TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, member_name)
);

CREATE INDEX IF NOT EXISTS project_tasks_proj_idx      ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS project_milestones_proj_idx ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS project_team_proj_idx       ON project_team(project_id);

ALTER TABLE project_tasks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_team       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_project_tasks"      ON project_tasks      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_project_milestones" ON project_milestones FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_project_team"       ON project_team       FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- ÉQUIPE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employe_evaluations (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        NOT NULL,
  member_id    TEXT        NOT NULL,
  member_name  TEXT        NOT NULL,
  date         DATE        NOT NULL,
  score        INT         CHECK (score BETWEEN 1 AND 10),
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS timesheets (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL,
  member_id   TEXT        NOT NULL,
  day_key     DATE        NOT NULL,
  hours       DECIMAL(4,2) DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, member_id, day_key)
);

CREATE INDEX IF NOT EXISTS employe_evals_member_idx ON employe_evaluations(member_id);
CREATE INDEX IF NOT EXISTS timesheets_member_idx    ON timesheets(member_id);
CREATE INDEX IF NOT EXISTS timesheets_user_idx      ON timesheets(user_id);

ALTER TABLE employe_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets          ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_evaluations" ON employe_evaluations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_timesheets"  ON timesheets          FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- CONTRATS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contract_versions (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        NOT NULL,
  contract_id  UUID        NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  content      TEXT        NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contract_templates (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        NOT NULL,
  name         TEXT        NOT NULL,
  type         TEXT        NOT NULL,
  content      TEXT        NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contract_versions_contract_idx  ON contract_versions(contract_id);
CREATE INDEX IF NOT EXISTS contract_templates_user_idx     ON contract_templates(user_id);

ALTER TABLE contract_versions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_templates  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_contract_versions"   ON contract_versions   FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_contract_templates"  ON contract_templates  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- PAIE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employe_absences (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        NOT NULL,
  employee_id  TEXT        NOT NULL,
  cp           INT         DEFAULT 0,
  rtt          INT         DEFAULT 0,
  maladie      INT         DEFAULT 0,
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, employee_id)
);

CREATE TABLE IF NOT EXISTS payslips (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        NOT NULL,
  employee_id  TEXT        NOT NULL,
  month_key    TEXT        NOT NULL,
  html_content TEXT        NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS urssaf_declarations (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        NOT NULL,
  month_key    TEXT        NOT NULL,
  done         BOOLEAN     DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month_key)
);

CREATE INDEX IF NOT EXISTS employe_absences_user_idx     ON employe_absences(user_id);
CREATE INDEX IF NOT EXISTS payslips_employee_idx         ON payslips(employee_id);
CREATE INDEX IF NOT EXISTS urssaf_declarations_user_idx  ON urssaf_declarations(user_id);

ALTER TABLE employe_absences    ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips            ENABLE ROW LEVEL SECURITY;
ALTER TABLE urssaf_declarations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_absences"            ON employe_absences    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_payslips"            ON payslips            FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_urssaf_declarations" ON urssaf_declarations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- BLOC-NOTES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS note_versions (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL,
  note_id     UUID        NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL DEFAULT '',
  content     TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- is_favorite column on notes (may already exist — IF NOT EXISTS guard)
ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS note_versions_note_idx ON note_versions(note_id);

ALTER TABLE note_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_note_versions" ON note_versions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
