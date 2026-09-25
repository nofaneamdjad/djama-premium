-- ══════════════════════════════════════════════════════════════════
-- Migration 082 : Templates email CRM (org-scoped)
--
-- PROBLÈME :
--   Les templates email sont hardcodés dans le front-end.
--   Il est impossible de les personnaliser ni de les partager
--   au sein d'une organisation.
--
-- SOLUTION :
--   Table email_templates : templates personnalisés par organisation.
--   Les templates built-in restent dans le code ; cette table
--   contient uniquement les templates créés par les membres.
--
-- AUCUNE DONNÉE SUPPRIMÉE.
-- IDEMPOTENT : IF NOT EXISTS partout
-- ORDRE : après 081_tickets_sla.sql
-- ══════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_templates (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  subject     text        NOT NULL,
  body        text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ── 2. Index ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_email_templates_org
  ON email_templates(org_id, created_at DESC);

-- ── 3. RLS ────────────────────────────────────────────────────────
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_members_can_read_templates"  ON email_templates;
DROP POLICY IF EXISTS "org_members_can_create_templates" ON email_templates;
DROP POLICY IF EXISTS "creator_can_update_template"     ON email_templates;
DROP POLICY IF EXISTS "creator_can_delete_template"     ON email_templates;

-- Tous les membres de l'org peuvent lire
CREATE POLICY "org_members_can_read_templates" ON email_templates
  FOR SELECT USING (
    org_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND suspended_at IS NULL
    )
  );

-- Tout membre peut créer un template pour son org
CREATE POLICY "org_members_can_create_templates" ON email_templates
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    org_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND suspended_at IS NULL
    )
  );

-- Seul le créateur peut modifier
CREATE POLICY "creator_can_update_template" ON email_templates
  FOR UPDATE USING (created_by = auth.uid());

-- Seul le créateur peut supprimer
CREATE POLICY "creator_can_delete_template" ON email_templates
  FOR DELETE USING (created_by = auth.uid());

-- ── 4. Updated_at auto ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_email_templates_updated_at ON email_templates;
CREATE TRIGGER trg_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_email_templates_updated_at();

COMMIT;
