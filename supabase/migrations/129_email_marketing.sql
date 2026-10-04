-- 129_email_marketing.sql
-- Email Marketing complet — campagnes, audience, automatisations, analytics
-- Idempotent. Pas de DROP TABLE, pas de suppression de données.

/* ═══════════════════════════════════════════════════════════════
   1. Paramètres provider email (par organisation)
════════════════════════════════════════════════════════════════ */
CREATE TABLE IF NOT EXISTS em_provider_settings (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider        text        NOT NULL DEFAULT 'resend'
                  CHECK (provider IN ('resend','sendgrid','mailgun','smtp','ses')),
  api_key_enc     text,           -- chiffré, jamais retourné au front
  from_email      text,
  from_name       text,
  reply_to        text,
  webhook_secret  text,           -- pour valider webhooks entrants
  is_active       boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id)
);

ALTER TABLE em_provider_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "em_provider_org" ON em_provider_settings;
CREATE POLICY "em_provider_org" ON em_provider_settings
  USING (org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND suspended_at IS NULL));

/* ═══════════════════════════════════════════════════════════════
   2. Domaines d'envoi
════════════════════════════════════════════════════════════════ */
CREATE TABLE IF NOT EXISTS em_domains (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain          text        NOT NULL,
  status          text        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','verifying','verified','failed')),
  spf_ok          boolean     NOT NULL DEFAULT false,
  dkim_ok         boolean     NOT NULL DEFAULT false,
  dmarc_ok        boolean     NOT NULL DEFAULT false,
  provider_domain_id text,        -- ID domaine chez le provider
  dns_records     jsonb       NOT NULL DEFAULT '[]',
  last_checked_at timestamptz,
  verified_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, domain)
);

ALTER TABLE em_domains ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "em_domains_org" ON em_domains;
CREATE POLICY "em_domains_org" ON em_domains
  USING (org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND suspended_at IS NULL));

/* ═══════════════════════════════════════════════════════════════
   3. Campagnes email
════════════════════════════════════════════════════════════════ */
CREATE TABLE IF NOT EXISTS em_campaigns (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  subject         text        NOT NULL DEFAULT '',
  preheader       text        NOT NULL DEFAULT '',
  from_email      text,
  from_name       text,
  reply_to        text,

  -- Contenu (structure JSON pour l'éditeur blocs)
  blocks          jsonb       NOT NULL DEFAULT '[]',
  html_cache      text,           -- HTML généré depuis blocks
  plain_text      text,

  -- Audience
  list_id         uuid,           -- liste statique (null = segment)
  segment_id      uuid,           -- segment dynamique
  -- ou audience directe (JSON de filtres)
  audience_filter jsonb       NOT NULL DEFAULT '{}',

  -- Statut
  status          text        NOT NULL DEFAULT 'brouillon'
                  CHECK (status IN ('brouillon','a_valider','planifiee','en_cours','envoyee','annulee','echec')),
  approved_by     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at     timestamptz,

  -- Planification
  scheduled_at    timestamptz,
  send_timezone   text        NOT NULL DEFAULT 'Europe/Paris',
  started_at      timestamptz,
  completed_at    timestamptz,

  -- Stats agrégées (mis à jour par webhooks)
  stats_recipients    int     NOT NULL DEFAULT 0,
  stats_sent          int     NOT NULL DEFAULT 0,
  stats_delivered     int     NOT NULL DEFAULT 0,
  stats_bounced       int     NOT NULL DEFAULT 0,
  stats_opened        int     NOT NULL DEFAULT 0,
  stats_clicked       int     NOT NULL DEFAULT 0,
  stats_unsubscribed  int     NOT NULL DEFAULT 0,
  stats_complained    int     NOT NULL DEFAULT 0,

  -- IA
  ai_generated    boolean     NOT NULL DEFAULT false,
  ai_brief        text,

  -- A/B test
  ab_enabled      boolean     NOT NULL DEFAULT false,
  ab_variant      text        CHECK (ab_variant IN ('A','B')),
  ab_parent_id    uuid        REFERENCES em_campaigns(id) ON DELETE SET NULL,
  ab_winner       text        CHECK (ab_winner IN ('A','B')),

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE em_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "em_campaigns_org" ON em_campaigns;
CREATE POLICY "em_campaigns_org" ON em_campaigns
  USING (org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND suspended_at IS NULL))
  WITH CHECK (org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND suspended_at IS NULL));

CREATE INDEX IF NOT EXISTS idx_em_campaigns_org    ON em_campaigns (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_em_campaigns_status ON em_campaigns (org_id, status);

CREATE OR REPLACE FUNCTION em_campaigns_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_em_campaigns_updated_at ON em_campaigns;
CREATE TRIGGER trg_em_campaigns_updated_at BEFORE UPDATE ON em_campaigns FOR EACH ROW EXECUTE FUNCTION em_campaigns_updated_at();

/* ═══════════════════════════════════════════════════════════════
   4. Envois individuels (un par destinataire)
════════════════════════════════════════════════════════════════ */
CREATE TABLE IF NOT EXISTS em_sends (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id     uuid        NOT NULL REFERENCES em_campaigns(id) ON DELETE CASCADE,
  org_id          uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id      uuid,           -- référence CRM (contacts table)
  email           text        NOT NULL,
  first_name      text,
  last_name       text,

  -- Statut de livraison (mis à jour par webhooks provider)
  status          text        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','queued','sending','delivered','bounced','complained','failed')),
  provider_message_id text,       -- ID message chez Resend/Sendgrid/etc.
  bounce_type     text        CHECK (bounce_type IN ('hard','soft')),
  error_code      text,
  error_message   text,

  -- Tracking (mis à jour par webhooks)
  opened_at       timestamptz,
  first_click_at  timestamptz,
  unsubscribed_at timestamptz,
  opened_count    int         NOT NULL DEFAULT 0,
  clicked_count   int         NOT NULL DEFAULT 0,

  sent_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE em_sends ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "em_sends_org" ON em_sends;
CREATE POLICY "em_sends_org" ON em_sends
  USING (org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND suspended_at IS NULL));

CREATE INDEX IF NOT EXISTS idx_em_sends_campaign ON em_sends (campaign_id);
CREATE INDEX IF NOT EXISTS idx_em_sends_email    ON em_sends (email);
CREATE INDEX IF NOT EXISTS idx_em_sends_status   ON em_sends (campaign_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_em_sends_uniq ON em_sends (campaign_id, email);

/* ═══════════════════════════════════════════════════════════════
   5. Propriétés marketing des contacts (extend CRM)
════════════════════════════════════════════════════════════════ */
CREATE TABLE IF NOT EXISTS em_contact_marketing (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id      uuid        NOT NULL,       -- ref contacts table
  email           text        NOT NULL,

  -- Consentement (RGPD)
  consent_marketing   boolean NOT NULL DEFAULT false,
  consent_date        timestamptz,
  consent_source      text,   -- 'import','form','manual','crm'
  consent_ip          text,

  -- Statut global
  global_status   text        NOT NULL DEFAULT 'subscribed'
                  CHECK (global_status IN ('subscribed','unsubscribed','bounced','complained','deleted')),
  unsubscribed_at timestamptz,
  unsubscribe_reason text,

  -- Préférences
  pref_newsletter     boolean NOT NULL DEFAULT true,
  pref_promotions     boolean NOT NULL DEFAULT true,
  pref_updates        boolean NOT NULL DEFAULT true,
  pref_transactional  boolean NOT NULL DEFAULT true,

  -- Métriques agrégées
  total_sent      int         NOT NULL DEFAULT 0,
  total_opened    int         NOT NULL DEFAULT 0,
  total_clicked   int         NOT NULL DEFAULT 0,
  last_opened_at  timestamptz,
  last_clicked_at timestamptz,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, contact_id),
  UNIQUE (org_id, email)
);

ALTER TABLE em_contact_marketing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "em_contact_marketing_org" ON em_contact_marketing;
CREATE POLICY "em_contact_marketing_org" ON em_contact_marketing
  USING (org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND suspended_at IS NULL))
  WITH CHECK (org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND suspended_at IS NULL));

CREATE INDEX IF NOT EXISTS idx_em_contact_mktg_org   ON em_contact_marketing (org_id);
CREATE INDEX IF NOT EXISTS idx_em_contact_mktg_email ON em_contact_marketing (org_id, email);

/* ═══════════════════════════════════════════════════════════════
   6. Listes statiques
════════════════════════════════════════════════════════════════ */
CREATE TABLE IF NOT EXISTS em_lists (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  description     text,
  color           text        NOT NULL DEFAULT '#c9a55a',
  member_count    int         NOT NULL DEFAULT 0,
  created_by      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE em_lists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "em_lists_org" ON em_lists;
CREATE POLICY "em_lists_org" ON em_lists
  USING (org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND suspended_at IS NULL))
  WITH CHECK (org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND suspended_at IS NULL));

CREATE INDEX IF NOT EXISTS idx_em_lists_org ON em_lists (org_id);

CREATE TABLE IF NOT EXISTS em_list_members (
  list_id         uuid        NOT NULL REFERENCES em_lists(id) ON DELETE CASCADE,
  contact_id      uuid        NOT NULL,
  email           text        NOT NULL,
  added_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (list_id, contact_id)
);

ALTER TABLE em_list_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "em_list_members_org" ON em_list_members;
CREATE POLICY "em_list_members_org" ON em_list_members
  USING (list_id IN (SELECT id FROM em_lists WHERE org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND suspended_at IS NULL)));

/* ═══════════════════════════════════════════════════════════════
   7. Segments dynamiques
════════════════════════════════════════════════════════════════ */
CREATE TABLE IF NOT EXISTS em_segments (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  description     text,
  -- conditions JSON : [{field, operator, value}] combinés AND/OR
  conditions      jsonb       NOT NULL DEFAULT '{"operator":"AND","rules":[]}',
  estimated_count int         NOT NULL DEFAULT 0,
  last_computed   timestamptz,
  created_by      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE em_segments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "em_segments_org" ON em_segments;
CREATE POLICY "em_segments_org" ON em_segments
  USING (org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND suspended_at IS NULL))
  WITH CHECK (org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND suspended_at IS NULL));

CREATE INDEX IF NOT EXISTS idx_em_segments_org ON em_segments (org_id);

/* ═══════════════════════════════════════════════════════════════
   8. Automatisations
════════════════════════════════════════════════════════════════ */
CREATE TABLE IF NOT EXISTS em_automations (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  description     text,
  trigger_type    text        NOT NULL DEFAULT 'manual'
                  CHECK (trigger_type IN ('manual','new_contact','contact_tag','purchase','invoice','appointment','form_submit','date','crm_status')),
  trigger_config  jsonb       NOT NULL DEFAULT '{}',
  is_active       boolean     NOT NULL DEFAULT false,
  ai_generated    boolean     NOT NULL DEFAULT false,
  ai_brief        text,
  run_count       int         NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE em_automations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "em_automations_org" ON em_automations;
CREATE POLICY "em_automations_org" ON em_automations
  USING (org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND suspended_at IS NULL))
  WITH CHECK (org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND suspended_at IS NULL));

CREATE INDEX IF NOT EXISTS idx_em_automations_org ON em_automations (org_id);

CREATE TABLE IF NOT EXISTS em_automation_steps (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  automation_id   uuid        NOT NULL REFERENCES em_automations(id) ON DELETE CASCADE,
  step_order      int         NOT NULL DEFAULT 0,
  step_type       text        NOT NULL
                  CHECK (step_type IN ('send_email','wait','condition','add_tag','remove_tag','update_property','create_task','notify_member','add_to_list','webhook')),
  config          jsonb       NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE em_automation_steps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "em_auto_steps_org" ON em_automation_steps;
CREATE POLICY "em_auto_steps_org" ON em_automation_steps
  USING (automation_id IN (SELECT id FROM em_automations WHERE org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND suspended_at IS NULL)));

CREATE INDEX IF NOT EXISTS idx_em_auto_steps ON em_automation_steps (automation_id, step_order);

CREATE TABLE IF NOT EXISTS em_automation_logs (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  automation_id   uuid        NOT NULL REFERENCES em_automations(id) ON DELETE CASCADE,
  contact_id      uuid,
  email           text,
  status          text        NOT NULL DEFAULT 'running'
                  CHECK (status IN ('running','completed','failed','stopped')),
  current_step    int         NOT NULL DEFAULT 0,
  error           text,
  started_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz
);

ALTER TABLE em_automation_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "em_auto_logs_org" ON em_automation_logs;
CREATE POLICY "em_auto_logs_org" ON em_automation_logs
  USING (automation_id IN (SELECT id FROM em_automations WHERE org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND suspended_at IS NULL)));

/* ═══════════════════════════════════════════════════════════════
   9. Formulaires d'inscription
════════════════════════════════════════════════════════════════ */
CREATE TABLE IF NOT EXISTS em_forms (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  form_type       text        NOT NULL DEFAULT 'newsletter'
                  CHECK (form_type IN ('newsletter','download','contact','event')),
  fields          jsonb       NOT NULL DEFAULT '[]',
  list_id         uuid        REFERENCES em_lists(id) ON DELETE SET NULL,
  success_message text        NOT NULL DEFAULT 'Merci pour votre inscription !',
  is_active       boolean     NOT NULL DEFAULT true,
  submission_count int        NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE em_forms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "em_forms_org" ON em_forms;
CREATE POLICY "em_forms_org" ON em_forms
  USING (org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND suspended_at IS NULL))
  WITH CHECK (org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND suspended_at IS NULL));

-- Soumissions publiques (pas d'auth requise)
CREATE TABLE IF NOT EXISTS em_form_submissions (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id         uuid        NOT NULL REFERENCES em_forms(id) ON DELETE CASCADE,
  org_id          uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  data            jsonb       NOT NULL DEFAULT '{}',
  email           text,
  first_name      text,
  last_name       text,
  ip_address      text,
  submitted_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE em_form_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "em_form_sub_org" ON em_form_submissions;
CREATE POLICY "em_form_sub_org" ON em_form_submissions
  USING (org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND suspended_at IS NULL));
-- Insert public (sans auth) via service_role seulement

/* ═══════════════════════════════════════════════════════════════
   10. Liste de suppression (désabonnements, bounces, plaintes)
════════════════════════════════════════════════════════════════ */
CREATE TABLE IF NOT EXISTS em_suppressions (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email           text        NOT NULL,
  reason          text        NOT NULL
                  CHECK (reason IN ('unsubscribe','hard_bounce','complaint','manual')),
  campaign_id     uuid        REFERENCES em_campaigns(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, email)
);

ALTER TABLE em_suppressions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "em_suppressions_org" ON em_suppressions;
CREATE POLICY "em_suppressions_org" ON em_suppressions
  USING (org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND suspended_at IS NULL));

CREATE INDEX IF NOT EXISTS idx_em_suppressions_email ON em_suppressions (org_id, email);

/* ═══════════════════════════════════════════════════════════════
   11. Clics (tracking liens)
════════════════════════════════════════════════════════════════ */
CREATE TABLE IF NOT EXISTS em_clicks (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id     uuid        NOT NULL REFERENCES em_campaigns(id) ON DELETE CASCADE,
  send_id         uuid        REFERENCES em_sends(id) ON DELETE CASCADE,
  url             text        NOT NULL,
  clicked_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE em_clicks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "em_clicks_org" ON em_clicks;
CREATE POLICY "em_clicks_org" ON em_clicks
  USING (campaign_id IN (SELECT id FROM em_campaigns WHERE org_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND suspended_at IS NULL)));

CREATE INDEX IF NOT EXISTS idx_em_clicks_campaign ON em_clicks (campaign_id);
CREATE INDEX IF NOT EXISTS idx_em_clicks_url      ON em_clicks (campaign_id, url);
