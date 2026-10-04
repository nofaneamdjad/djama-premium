-- ════════════════════════════════════════════════════════════════════════
-- 122_projets_workspace.sql
-- Projets Workspace — nouvelles colonnes + tables satellites
-- Idempotent — non-destructif
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. Nouvelles colonnes sur projects ───────────────────────────────────

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS priority      text    DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','urgent')),
  ADD COLUMN IF NOT EXISTS crm_contact_id uuid   REFERENCES contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS progress      integer DEFAULT 0
    CHECK (progress >= 0 AND progress <= 100);

CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(user_id, priority);

-- ── 2. project_milestones ─────────────────────────────────────────────────
-- NOTE: table may already exist with `done boolean` — we preserve it and
-- ADD columns only if they are missing.

CREATE TABLE IF NOT EXISTS project_milestones (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  project_id  uuid        NOT NULL REFERENCES projects(id)    ON DELETE CASCADE,
  title       text        NOT NULL DEFAULT '',
  date        date,
  done        boolean     DEFAULT false,
  responsible text        DEFAULT '',
  description text        DEFAULT '',
  created_at  timestamptz DEFAULT now()
);

-- Add columns that the refonte needs, compatible with existing rows
ALTER TABLE project_milestones
  ADD COLUMN IF NOT EXISTS done        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS responsible text    DEFAULT '',
  ADD COLUMN IF NOT EXISTS description text    DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_pm_project ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_pm_user    ON project_milestones(user_id);

ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pm_own" ON project_milestones;
CREATE POLICY "pm_own" ON project_milestones
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 3. project_members (permissions projet) ───────────────────────────────

CREATE TABLE IF NOT EXISTS project_members (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text        DEFAULT 'member'
    CHECK (role IN ('owner','manager','member','viewer')),
  name        text        DEFAULT '',
  email       text        DEFAULT '',
  created_at  timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_pmbr_project ON project_members(project_id);

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pmbr_project_owner" ON project_members;
CREATE POLICY "pmbr_project_owner" ON project_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.user_id = auth.uid())
    OR user_id = auth.uid()
  );

-- ── 4. project_risks ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS project_risks (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  project_id  uuid        NOT NULL REFERENCES projects(id)    ON DELETE CASCADE,
  title       text        NOT NULL DEFAULT '',
  probability text        DEFAULT 'moyen'
    CHECK (probability IN ('faible','moyen','élevé')),
  impact      text        DEFAULT 'moyen'
    CHECK (impact IN ('faible','moyen','élevé')),
  responsible text        DEFAULT '',
  action_plan text        DEFAULT '',
  status      text        DEFAULT 'ouvert'
    CHECK (status IN ('ouvert','atténué','fermé')),
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pr_project ON project_risks(project_id);

ALTER TABLE project_risks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pr_own" ON project_risks;
CREATE POLICY "pr_own" ON project_risks
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 5. project_activities (timeline) ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS project_activities (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  project_id  uuid        NOT NULL REFERENCES projects(id)    ON DELETE CASCADE,
  type        text        DEFAULT 'note',
  description text        NOT NULL DEFAULT '',
  metadata    jsonb       DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pa_project ON project_activities(project_id);
CREATE INDEX IF NOT EXISTS idx_pa_user    ON project_activities(user_id);

ALTER TABLE project_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pa_own" ON project_activities;
CREATE POLICY "pa_own" ON project_activities
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 6. expenses.project_id ───────────────────────────────────────────────

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_exp_project
  ON expenses(project_id) WHERE project_id IS NOT NULL;

-- ── 7. time_entries.project_id ───────────────────────────────────────────

ALTER TABLE time_entries
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_te_project
  ON time_entries(project_id) WHERE project_id IS NOT NULL;
