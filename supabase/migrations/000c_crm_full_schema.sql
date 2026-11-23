-- ════════════════════════════════════════════════════════
-- CRM FULL SCHEMA — Extension contacts + 4 nouvelles tables
-- ════════════════════════════════════════════════════════

-- ── 1. Extension de la table contacts existante ───────────────────────────────
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS address       text    DEFAULT '';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS city          text    DEFAULT '';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS country       text    DEFAULT '';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS sector        text    DEFAULT '';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS company_size  text    DEFAULT '';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source        text    DEFAULT '';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS priority      text    DEFAULT 'normal';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS type          text    DEFAULT 'prospect';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS website       text    DEFAULT '';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS linkedin      text    DEFAULT '';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS budget        numeric DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS interest_level integer DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tags          text[]  DEFAULT '{}';

-- ── 2. Activités / Historique des échanges ────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_activities (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id    uuid        REFERENCES contacts(id)   ON DELETE CASCADE,
  type          text        NOT NULL DEFAULT 'note',   -- call | email | meeting | note | document | rdv
  title         text        NOT NULL,
  description   text        DEFAULT '',
  activity_date timestamptz DEFAULT now(),
  duration_min  integer     DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activities_contact ON contact_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_user    ON contact_activities(user_id);

ALTER TABLE contact_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activities_own" ON contact_activities;
CREATE POLICY "activities_own" ON contact_activities
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 3. Opportunités / Pipeline commercial ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS opportunities (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid    REFERENCES auth.users(id)  ON DELETE CASCADE,
  contact_id      uuid    REFERENCES contacts(id)    ON DELETE SET NULL,
  title           text    NOT NULL,
  amount          numeric DEFAULT 0,
  stage           text    DEFAULT 'nouveau',          -- nouveau | qualifié | proposition | négociation | gagné | perdu
  probability     integer DEFAULT 20,                 -- 0-100
  close_date      date,
  product_service text    DEFAULT '',
  notes           text    DEFAULT '',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_opps_contact ON opportunities(contact_id);
CREATE INDEX IF NOT EXISTS idx_opps_user    ON opportunities(user_id);

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "opportunities_own" ON opportunities;
CREATE POLICY "opportunities_own" ON opportunities
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION update_opportunity_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS opportunity_updated_at ON opportunities;
CREATE TRIGGER opportunity_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_opportunity_timestamp();

-- ── 4. Tâches & Rappels ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_tasks (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid    REFERENCES auth.users(id)  ON DELETE CASCADE,
  contact_id     uuid    REFERENCES contacts(id)    ON DELETE SET NULL,
  opportunity_id uuid    REFERENCES opportunities(id) ON DELETE SET NULL,
  title          text    NOT NULL,
  description    text    DEFAULT '',
  due_date       date,
  priority       text    DEFAULT 'normal',  -- low | normal | high | urgent
  done           boolean DEFAULT false,
  type           text    DEFAULT 'action',  -- relance | rdv | deadline | action | appel
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_contact ON crm_tasks(contact_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user    ON crm_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due     ON crm_tasks(due_date);

ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "crm_tasks_own" ON crm_tasks;
CREATE POLICY "crm_tasks_own" ON crm_tasks
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 5. Tickets Support ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id   uuid    REFERENCES contacts(id)   ON DELETE SET NULL,
  title        text    NOT NULL,
  description  text    DEFAULT '',
  status       text    DEFAULT 'ouvert',    -- ouvert | en_cours | résolu | fermé
  priority     text    DEFAULT 'normale',   -- basse | normale | haute | urgente
  satisfaction integer DEFAULT 0,           -- 0 = non noté, 1-5
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_contact ON tickets(contact_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user    ON tickets(user_id);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tickets_own" ON tickets;
CREATE POLICY "tickets_own" ON tickets
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ticket_updated_at ON tickets;
CREATE TRIGGER ticket_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_ticket_timestamp();
