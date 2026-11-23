-- Recovery: garantit que les tables productivité et projets existent (idempotent).
-- projects vient de 033_projets (migration numérotée) — project_tasks y fait référence.

-- ── Productivité ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS productivity_tasks (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  title             text        NOT NULL,
  description       text        DEFAULT '',
  priority          text        DEFAULT 'normal',
  status            text        DEFAULT 'todo',
  category          text        DEFAULT '',
  due_date          date,
  due_time          text        DEFAULT '',
  responsible       text        DEFAULT '',
  assignees         text[]      DEFAULT '{}',
  subtasks          jsonb       DEFAULT '[]',
  tags              text[]      DEFAULT '{}',
  estimated_minutes integer     DEFAULT 30,
  time_spent        integer     DEFAULT 0,
  timer_started_at  timestamptz,
  is_recurring      boolean     DEFAULT false,
  recurrence        text        DEFAULT 'none',
  linked_module     text        DEFAULT '',
  linked_id         text        DEFAULT '',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prod_user     ON productivity_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_prod_status   ON productivity_tasks(status);
CREATE INDEX IF NOT EXISTS idx_prod_priority ON productivity_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_prod_due      ON productivity_tasks(due_date);
ALTER TABLE productivity_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prod_own" ON productivity_tasks;
CREATE POLICY "prod_own" ON productivity_tasks
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS task_comments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id     uuid        REFERENCES productivity_tasks(id) ON DELETE CASCADE,
  author_name text        NOT NULL DEFAULT '',
  content     text        NOT NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tcmt_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_tcmt_user ON task_comments(user_id);
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tcmt_own" ON task_comments;
CREATE POLICY "tcmt_own" ON task_comments
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── Sous-tables projets (projects vient de 033_projets) ───────────────────────

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
