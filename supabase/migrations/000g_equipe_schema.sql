-- ════════════════════════════════════════════════════════
-- MODULE ÉQUIPE — Membres, Tâches, Chat, RH, Réunions
-- ════════════════════════════════════════════════════════

-- ── 1. Membres ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text        NOT NULL,
  email         text        DEFAULT '',
  phone         text        DEFAULT '',
  position      text        DEFAULT '',
  department    text        DEFAULT '',
  -- admin | manager | employee | accountant | extern
  role          text        DEFAULT 'employee',
  -- active | away | leave | inactive
  status        text        DEFAULT 'active',
  avatar_color  text        DEFAULT '#0ea5e9',
  entry_date    date,
  notes         text        DEFAULT '',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tm_user   ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tm_status ON team_members(status);
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tm_own" ON team_members;
CREATE POLICY "tm_own" ON team_members
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 2. Tâches équipe ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_tasks (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  title           text        NOT NULL,
  description     text        DEFAULT '',
  assigned_to     uuid        REFERENCES team_members(id) ON DELETE SET NULL,
  assigned_name   text        DEFAULT '',
  -- low | normal | high | urgent
  priority        text        DEFAULT 'normal',
  -- todo | in_progress | done | late
  status          text        DEFAULT 'todo',
  due_date        date,
  project         text        DEFAULT '',
  estimated_hours numeric     DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tt_user     ON team_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tt_assigned ON team_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tt_status   ON team_tasks(status);
ALTER TABLE team_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tt_own" ON team_tasks;
CREATE POLICY "tt_own" ON team_tasks
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 3. Messages équipe ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_messages (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name  text        NOT NULL DEFAULT '',
  content      text        NOT NULL,
  channel      text        DEFAULT 'général',
  mentions     text[]      DEFAULT '{}',
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tmsg_user    ON team_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_tmsg_channel ON team_messages(channel);
CREATE INDEX IF NOT EXISTS idx_tmsg_date    ON team_messages(created_at DESC);
ALTER TABLE team_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tmsg_own" ON team_messages;
CREATE POLICY "tmsg_own" ON team_messages
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 4. Congés / Absences ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_leaves (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id    uuid    REFERENCES team_members(id) ON DELETE CASCADE,
  member_name  text    DEFAULT '',
  -- vacation | sick | personal | training | other
  type         text    DEFAULT 'vacation',
  start_date   date    NOT NULL,
  end_date     date    NOT NULL,
  -- pending | approved | rejected
  status       text    DEFAULT 'pending',
  reason       text    DEFAULT '',
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tl_user   ON team_leaves(user_id);
CREATE INDEX IF NOT EXISTS idx_tl_member ON team_leaves(member_id);
ALTER TABLE team_leaves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tl_own" ON team_leaves;
CREATE POLICY "tl_own" ON team_leaves
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 5. Réunions équipe ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_meetings (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  title              text        NOT NULL,
  description        text        DEFAULT '',
  date_at            timestamptz NOT NULL,
  duration_minutes   integer     DEFAULT 60,
  location           text        DEFAULT '',
  meet_link          text        DEFAULT '',
  participants       text[]      DEFAULT '{}',
  notes              text        DEFAULT '',
  -- planned | done | cancelled
  status             text        DEFAULT 'planned',
  created_at         timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tmeet_user ON team_meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_tmeet_date ON team_meetings(date_at);
ALTER TABLE team_meetings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tmeet_own" ON team_meetings;
CREATE POLICY "tmeet_own" ON team_meetings
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 6. Triggers updated_at ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_equipe_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tm_updated_at ON team_members;
CREATE TRIGGER tm_updated_at BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_equipe_timestamp();

DROP TRIGGER IF EXISTS tt_updated_at ON team_tasks;
CREATE TRIGGER tt_updated_at BEFORE UPDATE ON team_tasks
  FOR EACH ROW EXECUTE FUNCTION update_equipe_timestamp();
