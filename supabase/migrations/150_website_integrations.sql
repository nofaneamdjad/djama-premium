-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 150 — Website Builder : intégrations CRM, stats, formulaires
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Visites (analytics) ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS website_visits (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id  uuid        NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL,
  page_slug   text        NOT NULL DEFAULT '/',
  referrer    text,
  ip_hash     text,
  ua          text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS website_visits_website_id_idx ON website_visits(website_id);
CREATE INDEX IF NOT EXISTS website_visits_created_at_idx ON website_visits(created_at);
CREATE INDEX IF NOT EXISTS website_visits_user_id_idx    ON website_visits(user_id);

ALTER TABLE website_visits ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'website_visits' AND policyname = 'website_visits_owner'
  ) THEN
    CREATE POLICY "website_visits_owner" ON website_visits
      USING  (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Insert public (visiteurs sans compte) via service_role seulement — pas de POLICY INSERT pour anon

-- ── 2. Soumissions de formulaires ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS website_contact_submissions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id       uuid        NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  user_id          uuid        NOT NULL,
  data             jsonb       NOT NULL DEFAULT '{}',
  crm_contact_id   uuid,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wcs_website_id_idx ON website_contact_submissions(website_id);
CREATE INDEX IF NOT EXISTS wcs_user_id_idx    ON website_contact_submissions(user_id);

ALTER TABLE website_contact_submissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'website_contact_submissions' AND policyname = 'wcs_owner'
  ) THEN
    CREATE POLICY "wcs_owner" ON website_contact_submissions
      USING  (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
