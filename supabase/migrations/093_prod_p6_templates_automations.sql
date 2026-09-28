-- ════════════════════════════════════════════════════════════════════════
-- 093_prod_p6_templates_automations.sql
-- Phase 6 : Templates persistants + automatisations (récurrence, rappels)
-- Idempotent
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. Table productivity_templates ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS productivity_templates (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name         text NOT NULL,
  description  text NOT NULL DEFAULT '',
  icon         text NOT NULL DEFAULT '',
  color        text NOT NULL DEFAULT '#8b5cf6',
  priority     text NOT NULL DEFAULT 'normal',
  category     text NOT NULL DEFAULT '',
  estimated_minutes integer NOT NULL DEFAULT 30,
  tags         text[] NOT NULL DEFAULT '{}',
  subtasks     jsonb NOT NULL DEFAULT '[]',
  recurrence   text NOT NULL DEFAULT 'none',
  is_recurring boolean NOT NULL DEFAULT false,
  is_shared    boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE productivity_templates ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ptpl_user   ON productivity_templates (user_id);
CREATE INDEX IF NOT EXISTS idx_ptpl_org    ON productivity_templates (organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ptpl_shared ON productivity_templates (is_shared) WHERE is_shared = true;

DROP POLICY IF EXISTS "ptpl_select" ON productivity_templates;
DROP POLICY IF EXISTS "ptpl_insert" ON productivity_templates;
DROP POLICY IF EXISTS "ptpl_update" ON productivity_templates;
DROP POLICY IF EXISTS "ptpl_delete" ON productivity_templates;

CREATE POLICY "ptpl_select" ON productivity_templates FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_shared = true
    OR (
      organization_id IS NOT NULL
      AND organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "ptpl_insert" ON productivity_templates FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "ptpl_update" ON productivity_templates FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "ptpl_delete" ON productivity_templates FOR DELETE
  USING (user_id = auth.uid());

-- ── 2. Rappels sur les tâches ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_reminders (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    uuid NOT NULL REFERENCES productivity_tasks(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  remind_at  timestamptz NOT NULL,
  channel    text NOT NULL DEFAULT 'push',  -- 'push' | 'email'
  sent       boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE task_reminders ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_treminder_task     ON task_reminders (task_id);
CREATE INDEX IF NOT EXISTS idx_treminder_user     ON task_reminders (user_id);
CREATE INDEX IF NOT EXISTS idx_treminder_pending  ON task_reminders (remind_at) WHERE sent = false;

DROP POLICY IF EXISTS "treminder_own" ON task_reminders;
CREATE POLICY "treminder_own" ON task_reminders FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── 3. Colonnes récurrence sur productivity_tasks ────────────────────────
-- (is_recurring et recurrence existent déjà — on ajoute recurrence_parent_id
--  pour tracer la tâche source d'une série récurrente)
ALTER TABLE productivity_tasks
  ADD COLUMN IF NOT EXISTS recurrence_parent_id uuid
    REFERENCES productivity_tasks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_prod_recur_parent
  ON productivity_tasks (recurrence_parent_id)
  WHERE recurrence_parent_id IS NOT NULL;
