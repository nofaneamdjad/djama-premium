-- ════════════════════════════════════════════════════════
-- PLANNING — Calendrier + Tâches + Objectifs
-- ════════════════════════════════════════════════════════

-- ── 1. Événements calendrier ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS planning_events (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  title            text        NOT NULL,
  description      text        DEFAULT '',
  -- event | meeting | task | reminder
  event_type       text        DEFAULT 'event',
  start_at         timestamptz NOT NULL,
  end_at           timestamptz NOT NULL,
  is_all_day       boolean     DEFAULT false,
  location         text        DEFAULT '',
  color            text        DEFAULT '#6366f1',
  participants     text[]      DEFAULT '{}',
  reminder_minutes integer     DEFAULT 30,
  meet_link        text        DEFAULT '',
  -- Lien avec un autre module (crm / contract / project / …)
  linked_module    text        DEFAULT '',
  linked_id        text        DEFAULT '',
  -- none | daily | weekly | monthly
  recurrence       text        DEFAULT 'none',
  -- confirmed | tentative | cancelled
  status           text        DEFAULT 'confirmed',
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pe_user    ON planning_events(user_id);
CREATE INDEX IF NOT EXISTS idx_pe_start   ON planning_events(start_at);
CREATE INDEX IF NOT EXISTS idx_pe_type    ON planning_events(event_type);

ALTER TABLE planning_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pe_own" ON planning_events;
CREATE POLICY "pe_own" ON planning_events
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 2. Tâches planning ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS planning_tasks (
  id                 uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  title              text    NOT NULL,
  description        text    DEFAULT '',
  due_date           date,
  due_time           text    DEFAULT '',
  -- low | normal | high | urgent
  priority           text    DEFAULT 'normal',
  -- todo | in_progress | done | late
  status             text    DEFAULT 'todo',
  tags               text[]  DEFAULT '{}',
  estimated_minutes  integer DEFAULT 30,
  event_id           uuid    REFERENCES planning_events(id) ON DELETE SET NULL,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pt_user     ON planning_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_pt_due      ON planning_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_pt_status   ON planning_tasks(status);

ALTER TABLE planning_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pt_own" ON planning_tasks;
CREATE POLICY "pt_own" ON planning_tasks
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 3. Objectifs ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS planning_goals (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text    NOT NULL,
  -- week | month
  period      text    DEFAULT 'week',
  target_date date,
  progress    integer DEFAULT 0,   -- 0-100
  -- active | done | abandoned
  status      text    DEFAULT 'active',
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pg_user ON planning_goals(user_id);

ALTER TABLE planning_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pg_own" ON planning_goals;
CREATE POLICY "pg_own" ON planning_goals
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 4. Triggers updated_at ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_planning_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pe_updated_at ON planning_events;
CREATE TRIGGER pe_updated_at
  BEFORE UPDATE ON planning_events
  FOR EACH ROW EXECUTE FUNCTION update_planning_timestamp();

DROP TRIGGER IF EXISTS pt_updated_at ON planning_tasks;
CREATE TRIGGER pt_updated_at
  BEFORE UPDATE ON planning_tasks
  FOR EACH ROW EXECUTE FUNCTION update_planning_timestamp();
