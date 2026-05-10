-- ════════════════════════════════════════════════════════
-- CHRONO PRO — Mise à jour schéma
-- ════════════════════════════════════════════════════════

-- ── 1. Enrichir time_entries existante ───────────────────────────────────────
ALTER TABLE time_entries
  ADD COLUMN IF NOT EXISTS task_title      text    DEFAULT '',
  ADD COLUMN IF NOT EXISTS category        text    DEFAULT 'autre',
  ADD COLUMN IF NOT EXISTS is_billable     boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_billed       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS invoice_ref     text    DEFAULT '',
  ADD COLUMN IF NOT EXISTS timer_mode      text    DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS notes           text    DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_te_date     ON time_entries(date);
CREATE INDEX IF NOT EXISTS idx_te_project  ON time_entries(project);
CREATE INDEX IF NOT EXISTS idx_te_billed   ON time_entries(is_billed);

-- ── 2. Projets Chrono ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chrono_projects (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text    NOT NULL,
  client_name  text    DEFAULT '',
  color        text    DEFAULT '#a78bfa',
  hourly_rate  numeric DEFAULT 0,
  budget_hours numeric DEFAULT 0,
  is_active    boolean DEFAULT true,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cpro_user ON chrono_projects(user_id);
ALTER TABLE chrono_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cpro_own" ON chrono_projects;
CREATE POLICY "cpro_own" ON chrono_projects
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 3. Objectifs Chrono ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chrono_goals (
  id                      uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid    REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  daily_minutes           integer DEFAULT 480,   -- 8h
  weekly_minutes          integer DEFAULT 2400,  -- 40h
  daily_billable_minutes  integer DEFAULT 360,   -- 6h
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

ALTER TABLE chrono_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cgoal_own" ON chrono_goals;
CREATE POLICY "cgoal_own" ON chrono_goals
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 4. Triggers updated_at ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_chrono_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cpro_updated_at ON chrono_projects;
CREATE TRIGGER cpro_updated_at
  BEFORE UPDATE ON chrono_projects
  FOR EACH ROW EXECUTE FUNCTION update_chrono_timestamp();

DROP TRIGGER IF EXISTS cgoal_updated_at ON chrono_goals;
CREATE TRIGGER cgoal_updated_at
  BEFORE UPDATE ON chrono_goals
  FOR EACH ROW EXECUTE FUNCTION update_chrono_timestamp();
