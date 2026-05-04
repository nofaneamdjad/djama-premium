-- ═══════════════════════════════════════════════════════════════
-- DJAMA — Migration 022 : Tables Planification
--   employees · shifts
-- Copie-colle ce fichier dans l'éditeur SQL de Supabase Dashboard
-- ═══════════════════════════════════════════════════════════════

-- ── 1. EMPLOYEES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id         uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text        NOT NULL DEFAULT '',
  email      text,
  role       text,
  color      text        NOT NULL DEFAULT '#38bdf8',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 2. SHIFTS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shifts (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id uuid        REFERENCES employees(id) ON DELETE SET NULL,
  title       text        NOT NULL DEFAULT '',
  date        date        NOT NULL DEFAULT CURRENT_DATE,
  start_time  text        NOT NULL DEFAULT '09:00',
  end_time    text        NOT NULL DEFAULT '17:00',
  type        text        NOT NULL DEFAULT 'tache',
  -- tache | chantier | reunion | formation | conge | autre
  note        text,
  status      text        NOT NULL DEFAULT 'draft',
  -- draft | published
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ── RLS ─────────────────────────────────────────────────────────
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts    ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='employees' AND policyname='employees_own') THEN
    CREATE POLICY "employees_own" ON employees
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='shifts' AND policyname='shifts_own') THEN
    CREATE POLICY "shifts_own" ON shifts
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── Index ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_employees_user ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_shifts_user    ON shifts(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_shifts_emp     ON shifts(employee_id);

-- ── Trigger updated_at ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_col()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='employees_updated_at') THEN
    CREATE TRIGGER employees_updated_at
      BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_col();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='shifts_updated_at') THEN
    CREATE TRIGGER shifts_updated_at
      BEFORE UPDATE ON shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_col();
  END IF;
END $$;
