-- ═══════════════════════════════════════════════════════════════
-- DJAMA — Migration 021 : Fix tables manquantes (018 non appliqué)
-- Copie-colle ce fichier dans l'éditeur SQL de Supabase Dashboard
-- ═══════════════════════════════════════════════════════════════

-- ── 1. CONTACTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL DEFAULT '',
  email       text,
  phone       text,
  company     text,
  status      text        NOT NULL DEFAULT 'prospect',
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ── 2. TIME_ENTRIES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS time_entries (
  id               uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  project          text        NOT NULL DEFAULT '',
  client_name      text,
  description      text,
  date             date        NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes integer     NOT NULL DEFAULT 0,
  hourly_rate      numeric(10,2),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ── 3. EXPENSES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id          uuid          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid          REFERENCES auth.users(id) ON DELETE CASCADE,
  date        date          NOT NULL DEFAULT CURRENT_DATE,
  category    text          NOT NULL DEFAULT 'autre',
  -- fournitures | transport | restaurant | logiciel | formation | autre
  description text          NOT NULL DEFAULT '',
  amount      numeric(10,2) NOT NULL DEFAULT 0,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now()
);

-- ── 4. CONTRACTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contracts (
  id          uuid          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid          REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text          NOT NULL DEFAULT '',
  client_name text          NOT NULL DEFAULT '',
  type        text          NOT NULL DEFAULT 'prestation',
  -- prestation | nda | cdi | cdd | autre
  content     text          NOT NULL DEFAULT '',
  status      text          NOT NULL DEFAULT 'brouillon',
  -- brouillon | envoyé | signé | expiré
  amount      numeric(10,2),
  start_date  date,
  end_date    date,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now()
);

-- ── 5. REVIEWS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name text        NOT NULL DEFAULT '',
  rating      integer     NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  message     text,
  source      text        NOT NULL DEFAULT 'direct',
  -- google | linkedin | direct | autre
  project     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── RLS ─────────────────────────────────────────────────────────
ALTER TABLE contacts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews      ENABLE ROW LEVEL SECURITY;

-- Contacts
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='contacts' AND policyname='contacts_own') THEN
    CREATE POLICY "contacts_own" ON contacts USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Time entries
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='time_entries' AND policyname='time_entries_own') THEN
    CREATE POLICY "time_entries_own" ON time_entries USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Expenses
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='expenses' AND policyname='expenses_own') THEN
    CREATE POLICY "expenses_own" ON expenses USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Contracts
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='contracts' AND policyname='contracts_own') THEN
    CREATE POLICY "contracts_own" ON contracts USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Reviews
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reviews' AND policyname='reviews_own') THEN
    CREATE POLICY "reviews_own" ON reviews USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── Index ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contacts_user      ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user  ON time_entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user      ON expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_user     ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user       ON reviews(user_id);

-- ── Trigger updated_at ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_col()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='contacts_updated_at') THEN
    CREATE TRIGGER contacts_updated_at
      BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_col();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='time_entries_updated_at') THEN
    CREATE TRIGGER time_entries_updated_at
      BEFORE UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_col();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='expenses_updated_at') THEN
    CREATE TRIGGER expenses_updated_at
      BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_col();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='contracts_updated_at') THEN
    CREATE TRIGGER contracts_updated_at
      BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_col();
  END IF;
END $$;
