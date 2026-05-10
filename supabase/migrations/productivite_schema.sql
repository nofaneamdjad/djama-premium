-- ════════════════════════════════════════════════════════
-- PRODUCTIVITÉ — Tâches, Sous-tâches, Commentaires
-- ════════════════════════════════════════════════════════

-- ── 1. Tâches ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS productivity_tasks (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  title             text        NOT NULL,
  description       text        DEFAULT '',
  -- low | normal | high | urgent
  priority          text        DEFAULT 'normal',
  -- todo | in_progress | validation | done | waiting | late
  status            text        DEFAULT 'todo',
  category          text        DEFAULT '',
  due_date          date,
  due_time          text        DEFAULT '',
  responsible       text        DEFAULT '',
  assignees         text[]      DEFAULT '{}',
  subtasks          jsonb       DEFAULT '[]',
  tags              text[]      DEFAULT '{}',
  estimated_minutes integer     DEFAULT 30,
  time_spent        integer     DEFAULT 0,         -- total secondes
  timer_started_at  timestamptz,                   -- NULL = pas en cours
  is_recurring      boolean     DEFAULT false,
  -- none | daily | weekly | monthly
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

-- ── 2. Commentaires ───────────────────────────────────────────────────────────
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

-- ── 3. Trigger updated_at ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_productivity_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prod_updated_at ON productivity_tasks;
CREATE TRIGGER prod_updated_at
  BEFORE UPDATE ON productivity_tasks
  FOR EACH ROW EXECUTE FUNCTION update_productivity_timestamp();
