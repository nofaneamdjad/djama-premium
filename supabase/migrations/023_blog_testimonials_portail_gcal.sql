-- ═══════════════════════════════════════════════════════════════
-- DJAMA — Migration 023 : Blog · Témoignages · Portail · Google Calendar
-- Copie-colle ce fichier dans l'éditeur SQL de Supabase Dashboard
-- ═══════════════════════════════════════════════════════════════

-- ── 1. BLOG_ARTICLES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_articles (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  titre        text        NOT NULL DEFAULT '',
  slug         text        NOT NULL,
  extrait      text        DEFAULT '',
  contenu      text        DEFAULT '',
  image_url    text,
  categorie    text        NOT NULL DEFAULT 'Conseils',
  tags         text[]      NOT NULL DEFAULT '{}',
  published    boolean     NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blog_articles_slug_unique UNIQUE (slug)
);

ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'blog_articles' AND policyname = 'blog_articles_own'
  ) THEN
    CREATE POLICY "blog_articles_own" ON blog_articles
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Articles publiés lisibles par tous (portail public)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'blog_articles' AND policyname = 'blog_articles_public_read'
  ) THEN
    CREATE POLICY "blog_articles_public_read" ON blog_articles
      FOR SELECT USING (published = true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_blog_articles_user      ON blog_articles(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_articles_slug      ON blog_articles(slug);
CREATE INDEX IF NOT EXISTS idx_blog_articles_published ON blog_articles(published, published_at DESC);

-- ── 2. TESTIMONIALS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS testimonials (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  nom         text        NOT NULL DEFAULT '',
  role        text        DEFAULT '',
  entreprise  text        DEFAULT '',
  texte       text        NOT NULL DEFAULT '',
  note        integer     NOT NULL DEFAULT 5 CHECK (note >= 1 AND note <= 5),
  avatar_url  text,
  published   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'testimonials' AND policyname = 'testimonials_own'
  ) THEN
    CREATE POLICY "testimonials_own" ON testimonials
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Témoignages publiés lisibles par tous
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'testimonials' AND policyname = 'testimonials_public_read'
  ) THEN
    CREATE POLICY "testimonials_public_read" ON testimonials
      FOR SELECT USING (published = true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_testimonials_user      ON testimonials(user_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_published ON testimonials(published, created_at DESC);

-- ── 3. PORTAIL_CLIENTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portail_clients (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  client_nom  text        NOT NULL DEFAULT '',
  client_email text,
  token       text        NOT NULL,
  expires_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT portail_clients_token_unique UNIQUE (token),
  CONSTRAINT portail_clients_user_client_unique UNIQUE (user_id, client_nom)
);

ALTER TABLE portail_clients ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'portail_clients' AND policyname = 'portail_clients_own'
  ) THEN
    CREATE POLICY "portail_clients_own" ON portail_clients
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Service role peut lire par token (pas d'auth utilisateur côté portail)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'portail_clients' AND policyname = 'portail_clients_service_read'
  ) THEN
    CREATE POLICY "portail_clients_service_read" ON portail_clients
      FOR SELECT USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_portail_clients_user  ON portail_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_portail_clients_token ON portail_clients(token);

-- ── 4. GOOGLE_CALENDAR_TOKENS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  access_token  text        NOT NULL,
  refresh_token text,
  token_type    text        NOT NULL DEFAULT 'Bearer',
  expires_at    timestamptz,
  scope         text,
  calendar_id   text        NOT NULL DEFAULT 'primary',
  last_sync_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'google_calendar_tokens' AND policyname = 'gcal_tokens_own'
  ) THEN
    CREATE POLICY "gcal_tokens_own" ON google_calendar_tokens
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_gcal_tokens_user ON google_calendar_tokens(user_id);

-- ── 5. AGENDA_EVENTS — colonne gcal_event_id (sync) ───────────
ALTER TABLE agenda_events
  ADD COLUMN IF NOT EXISTS gcal_event_id text;

CREATE INDEX IF NOT EXISTS idx_agenda_events_gcal ON agenda_events(gcal_event_id)
  WHERE gcal_event_id IS NOT NULL;

-- ── Trigger updated_at pour blog_articles ─────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_col()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'blog_articles_updated_at'
  ) THEN
    CREATE TRIGGER blog_articles_updated_at
      BEFORE UPDATE ON blog_articles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_col();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'gcal_tokens_updated_at'
  ) THEN
    CREATE TRIGGER gcal_tokens_updated_at
      BEFORE UPDATE ON google_calendar_tokens
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_col();
  END IF;
END $$;
