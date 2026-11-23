-- ──────────────────────────────────────────────────────────────────────────
-- Migration : table agenda_events — Planning & Agenda espace client DJAMA
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agenda_events (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text         NOT NULL DEFAULT '',
  description text         NOT NULL DEFAULT '',
  date        date         NOT NULL,
  start_time  time,
  end_time    time,
  category    text         NOT NULL DEFAULT 'personnel'
                           CHECK (category IN ('travail','réunion','personnel','autre')),
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);

-- Index pour chargement rapide par mois
CREATE INDEX IF NOT EXISTS agenda_events_user_date_idx ON agenda_events(user_id, date);

-- Mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION set_agenda_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS agenda_events_set_updated_at ON agenda_events;
CREATE TRIGGER agenda_events_set_updated_at
  BEFORE UPDATE ON agenda_events
  FOR EACH ROW EXECUTE FUNCTION set_agenda_updated_at();

-- ── Row Level Security ─────────────────────────────────────────────────────
ALTER TABLE agenda_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agenda_select_own" ON agenda_events;
DROP POLICY IF EXISTS "agenda_insert_own" ON agenda_events;
DROP POLICY IF EXISTS "agenda_update_own" ON agenda_events;
DROP POLICY IF EXISTS "agenda_delete_own" ON agenda_events;

CREATE POLICY "agenda_select_own"
  ON agenda_events FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "agenda_insert_own"
  ON agenda_events FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "agenda_update_own"
  ON agenda_events FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "agenda_delete_own"
  ON agenda_events FOR DELETE USING (auth.uid() = user_id);
