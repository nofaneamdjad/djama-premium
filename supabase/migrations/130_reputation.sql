-- ════════════════════════════════════════════════════════════════════
--  Migration 130 — Réputation (multi-tenant, non destructif)
--  Conserve la table reviews existante (user_id) intacte.
--  Crée rep_* pour l'architecture multi-org complète.
-- ════════════════════════════════════════════════════════════════════

-- ── Extensions ──────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ════════════════════════════════════════════════════════════════════
--  rep_campaigns — Campagnes de collecte d'avis
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS rep_campaigns (
  id            uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id        uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by    uuid        REFERENCES auth.users(id),
  name          text        NOT NULL,
  type          text        NOT NULL DEFAULT 'general'
                            CHECK (type IN ('after_purchase','after_service','after_appointment','after_project','general')),
  slug          text        NOT NULL UNIQUE,
  question      text        NOT NULL DEFAULT 'Comment s''était passée votre expérience avec nous ?',
  is_active     boolean     NOT NULL DEFAULT true,
  collect_name  boolean     NOT NULL DEFAULT true,
  collect_email boolean     NOT NULL DEFAULT false,
  auto_trigger  text        CHECK (auto_trigger IN ('boutique_delivered','project_done','appointment_done','marketplace_done')),
  delay_days    integer     NOT NULL DEFAULT 1 CHECK (delay_days >= 0),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════════════
--  rep_reviews — Avis centralisés (multi-sources)
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS rep_reviews (
  id                uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id            uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id       uuid        REFERENCES rep_campaigns(id) ON DELETE SET NULL,
  contact_id        uuid        REFERENCES contacts(id) ON DELETE SET NULL,

  -- Auteur
  author_name       text,
  author_email      text,

  -- Contenu
  rating            integer     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  message           text,
  source            text        NOT NULL DEFAULT 'djama'
                                CHECK (source IN ('djama','boutique','marketplace','external')),
  provider          text,       -- 'google','trustpilot', etc.
  provider_review_id text,
  provider_url      text,

  -- Réponse
  response_text     text,
  response_at       timestamptz,
  responded_by      uuid        REFERENCES auth.users(id),
  response_published boolean    NOT NULL DEFAULT false,

  -- Modération / état
  status            text        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','published','hidden','flagged')),
  is_featured       boolean     NOT NULL DEFAULT false,
  moderated_by      uuid        REFERENCES auth.users(id),
  moderated_at      timestamptz,
  moderation_note   text,

  -- IA
  sentiment         text        CHECK (sentiment IN ('positive','neutral','negative')),
  themes            jsonb       NOT NULL DEFAULT '[]',
  ai_reply_draft    text,

  -- Consentement
  consent_publish   boolean     NOT NULL DEFAULT false,
  consent_date      timestamptz,

  -- Audit
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════════════
--  rep_sources — Sources externes configurées
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS rep_sources (
  id            uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id        uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider      text        NOT NULL CHECK (provider IN ('google','trustpilot','tripadvisor','yelp','facebook','custom')),
  label         text        NOT NULL,
  api_key_enc   text,           -- chiffré côté serveur, jamais retourné au frontend
  config        jsonb       NOT NULL DEFAULT '{}',
  is_active     boolean     NOT NULL DEFAULT false,
  last_sync_at  timestamptz,
  total_synced  integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, provider)
);

-- ════════════════════════════════════════════════════════════════════
--  rep_widgets — Configuration des widgets d'avis
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS rep_widgets (
  id            uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id        uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name          text        NOT NULL,
  widget_type   text        NOT NULL DEFAULT 'badge'
                            CHECK (widget_type IN ('badge','carousel','grid','testimonial','rating')),
  config        jsonb       NOT NULL DEFAULT '{
    "theme": "dark",
    "min_rating": 4,
    "max_count": 6,
    "show_source": true,
    "sources": ["djama"],
    "accent": "#c9a55a"
  }',
  is_active     boolean     NOT NULL DEFAULT true,
  embed_key     text        NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex') UNIQUE,
  view_count    integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════════════
--  rep_audit_log — Audit trail
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS rep_audit_log (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     uuid        REFERENCES auth.users(id),
  review_id   uuid        REFERENCES rep_reviews(id) ON DELETE SET NULL,
  action      text        NOT NULL,
  details     jsonb       NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════════════
--  Index
-- ════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_rep_campaigns_org   ON rep_campaigns(org_id);
CREATE INDEX IF NOT EXISTS idx_rep_campaigns_slug  ON rep_campaigns(slug);
CREATE INDEX IF NOT EXISTS idx_rep_reviews_org     ON rep_reviews(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rep_reviews_contact ON rep_reviews(contact_id);
CREATE INDEX IF NOT EXISTS idx_rep_reviews_status  ON rep_reviews(org_id, status);
CREATE INDEX IF NOT EXISTS idx_rep_reviews_rating  ON rep_reviews(org_id, rating);
CREATE INDEX IF NOT EXISTS idx_rep_sources_org     ON rep_sources(org_id);
CREATE INDEX IF NOT EXISTS idx_rep_widgets_org     ON rep_widgets(org_id);
CREATE INDEX IF NOT EXISTS idx_rep_widgets_key     ON rep_widgets(embed_key);
CREATE INDEX IF NOT EXISTS idx_rep_audit_org       ON rep_audit_log(org_id, created_at DESC);

-- ════════════════════════════════════════════════════════════════════
--  RLS — Organisation A ne voit jamais les données de B
-- ════════════════════════════════════════════════════════════════════
ALTER TABLE rep_campaigns  ENABLE ROW LEVEL SECURITY;
ALTER TABLE rep_reviews    ENABLE ROW LEVEL SECURITY;
ALTER TABLE rep_sources    ENABLE ROW LEVEL SECURITY;
ALTER TABLE rep_widgets    ENABLE ROW LEVEL SECURITY;
ALTER TABLE rep_audit_log  ENABLE ROW LEVEL SECURITY;

-- rep_campaigns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='rep_campaigns' AND policyname='rep_campaigns_org') THEN
    CREATE POLICY "rep_campaigns_org" ON rep_campaigns
      USING (org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND suspended_at IS NULL))
      WITH CHECK (org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND suspended_at IS NULL));
  END IF;
END $$;

-- rep_campaigns public (lecture seule pour la page publique via slug)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='rep_campaigns' AND policyname='rep_campaigns_public_read') THEN
    CREATE POLICY "rep_campaigns_public_read" ON rep_campaigns
      FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- rep_reviews
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='rep_reviews' AND policyname='rep_reviews_org') THEN
    CREATE POLICY "rep_reviews_org" ON rep_reviews
      USING (org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND suspended_at IS NULL))
      WITH CHECK (org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND suspended_at IS NULL));
  END IF;
END $$;

-- rep_reviews : insertion publique (soumission page collecte — via service_role uniquement côté API)
-- Pas de politique INSERT publique : l'API route utilise service_role

-- rep_sources
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='rep_sources' AND policyname='rep_sources_org') THEN
    CREATE POLICY "rep_sources_org" ON rep_sources
      USING (org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND suspended_at IS NULL))
      WITH CHECK (org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND suspended_at IS NULL));
  END IF;
END $$;

-- rep_widgets
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='rep_widgets' AND policyname='rep_widgets_org') THEN
    CREATE POLICY "rep_widgets_org" ON rep_widgets
      USING (org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND suspended_at IS NULL))
      WITH CHECK (org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND suspended_at IS NULL));
  END IF;
END $$;

-- rep_widgets : lecture publique pour embed
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='rep_widgets' AND policyname='rep_widgets_public_read') THEN
    CREATE POLICY "rep_widgets_public_read" ON rep_widgets
      FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- rep_audit_log
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='rep_audit_log' AND policyname='rep_audit_org') THEN
    CREATE POLICY "rep_audit_org" ON rep_audit_log
      USING (org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND suspended_at IS NULL));
  END IF;
END $$;
