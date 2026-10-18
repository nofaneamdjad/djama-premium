-- ─────────────────────────────────────────────────────────────────────────────
-- 155 — Module Carte de Visite Digitale
-- Tables : business_cards, card_contacts, card_visits
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Table principale ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS business_cards (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug            text        UNIQUE NOT NULL,
  status          text        NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('active', 'draft', 'archived', 'disabled')),
  name            text        NOT NULL DEFAULT '',

  -- Profil
  first_name      text,
  last_name       text,
  job_title       text,
  company         text,
  department      text,
  bio             text,
  avatar_url      text,
  logo_url        text,

  -- Contact
  phone           text,
  phone_whatsapp  text,
  email           text,
  website         text,
  address         text,
  city            text,
  country         text,

  -- Réseaux sociaux (clé → URL)
  social          jsonb       NOT NULL DEFAULT '{}',

  -- Liens custom [{label, url, icon}]
  links           jsonb       NOT NULL DEFAULT '[]',

  -- Horaires [{day, open, close, closed}]
  hours           jsonb,

  -- Design / thème
  template_id     text        NOT NULL DEFAULT 'minimaliste',
  theme           jsonb       NOT NULL DEFAULT '{}',

  -- Paramètres
  lang                  text    NOT NULL DEFAULT 'fr',
  show_contact_form     boolean NOT NULL DEFAULT false,
  allow_save_contact    boolean NOT NULL DEFAULT true,
  password_hash         text,   -- protection optionnelle

  -- Compteurs (dénormalisés pour perf)
  view_count      int         NOT NULL DEFAULT 0,
  contact_count   int         NOT NULL DEFAULT 0,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  published_at    timestamptz
);

CREATE INDEX IF NOT EXISTS idx_bc_user    ON business_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_bc_slug    ON business_cards(slug);
CREATE INDEX IF NOT EXISTS idx_bc_status  ON business_cards(status);

-- ── Contacts reçus ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS card_contacts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id     uuid        NOT NULL REFERENCES business_cards(id) ON DELETE CASCADE,
  owner_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text,
  email       text,
  phone       text,
  message     text,
  company     text,
  source      text        NOT NULL DEFAULT 'form' CHECK (source IN ('form', 'vcf', 'qr', 'nfc')),
  ip_hash     text,
  consent     boolean     NOT NULL DEFAULT false,
  added_to_crm boolean   NOT NULL DEFAULT false,
  crm_contact_id uuid,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cc_card    ON card_contacts(card_id);
CREATE INDEX IF NOT EXISTS idx_cc_owner   ON card_contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_cc_created ON card_contacts(created_at DESC);

-- ── Visites et événements ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS card_visits (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id     uuid        NOT NULL REFERENCES business_cards(id) ON DELETE CASCADE,
  event_type  text        NOT NULL CHECK (event_type IN (
                'view', 'click_phone', 'click_email', 'click_whatsapp',
                'vcf_download', 'qr_scan', 'nfc_tap', 'share',
                'click_website', 'click_social', 'click_link'
              )),
  source      text        DEFAULT 'direct' CHECK (source IN ('direct', 'qr', 'nfc', 'link', 'social')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cv_card    ON card_visits(card_id);
CREATE INDEX IF NOT EXISTS idx_cv_event   ON card_visits(event_type);
CREATE INDEX IF NOT EXISTS idx_cv_created ON card_visits(created_at DESC);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE business_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_contacts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_visits    ENABLE ROW LEVEL SECURITY;

-- business_cards — propriétaire
DROP POLICY IF EXISTS "bc_select" ON business_cards;
CREATE POLICY "bc_select" ON business_cards FOR SELECT
  USING (user_id = auth.uid() OR status = 'active');

DROP POLICY IF EXISTS "bc_insert" ON business_cards;
CREATE POLICY "bc_insert" ON business_cards FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "bc_update" ON business_cards;
CREATE POLICY "bc_update" ON business_cards FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "bc_delete" ON business_cards;
CREATE POLICY "bc_delete" ON business_cards FOR DELETE
  USING (user_id = auth.uid());

-- card_contacts — le propriétaire voit ses contacts, tout le monde peut insérer
DROP POLICY IF EXISTS "cc_select" ON card_contacts;
CREATE POLICY "cc_select" ON card_contacts FOR SELECT
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "cc_insert" ON card_contacts;
CREATE POLICY "cc_insert" ON card_contacts FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "cc_delete" ON card_contacts;
CREATE POLICY "cc_delete" ON card_contacts FOR DELETE
  USING (owner_id = auth.uid());

-- card_visits — insert public (tracking), read owner
DROP POLICY IF EXISTS "cv_insert" ON card_visits;
CREATE POLICY "cv_insert" ON card_visits FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "cv_select" ON card_visits;
CREATE POLICY "cv_select" ON card_visits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_cards bc
      WHERE bc.id = card_visits.card_id AND bc.user_id = auth.uid()
    )
  );

-- ── Trigger updated_at ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_bc_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_bc_updated_at ON business_cards;
CREATE TRIGGER trg_bc_updated_at
  BEFORE UPDATE ON business_cards
  FOR EACH ROW EXECUTE FUNCTION update_bc_updated_at();
