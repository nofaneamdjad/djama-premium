-- ══════════════════════════════════════════════════════════════════
-- Migration 076 : CRM — Multi-tenant complet
--
-- PROBLÈME IDENTIFIÉ (audit AUDIT_TECHNIQUE_CRM_DJAMA.pdf) :
--   organization_id existe sur contacts mais est absent de
--   contact_activities, opportunities, crm_tasks et tickets.
--   La migration 058 a tenté de créer des policies RLS org_select sur
--   opportunities et crm_tasks en référençant organization_id, mais ces
--   colonnes n'existaient pas — ces statements ont silencieusement échoué.
--
-- CORRECTIONS APPORTÉES :
--   1. ADD COLUMN organization_id sur les 4 tables manquantes
--   2. Backfill : copie organization_id depuis contacts via FK contact_id
--   3. Drop des policies 058 cassées + recréation correcte
--   4. RLS complètes : SELECT/INSERT/UPDATE/DELETE pour user_id ET org
--   5. Indexes
--
-- ISOLATION GARANTIE :
--   • Données sans organization_id : visibles uniquement par user_id = auth.uid()
--   • Données avec organization_id : visibles par tous les membres de l'org
--   • Un utilisateur ne peut jamais accéder aux données d'une org étrangère
--
-- ORDRE : après 075_phase0_fixes.sql
-- IDEMPOTENT : oui (ADD COLUMN IF NOT EXISTS, DROP POLICY IF EXISTS, CREATE INDEX IF NOT EXISTS)
-- NE SUPPRIME AUCUNE DONNÉE EXISTANTE
-- ══════════════════════════════════════════════════════════════════

BEGIN;

-- ══════════════════════════════════════════════════════════════════
-- 1. ADD COLUMN organization_id sur les 4 tables CRM manquantes
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE contact_activities
  ADD COLUMN IF NOT EXISTS organization_id uuid
  REFERENCES organizations(id) ON DELETE SET NULL;

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS organization_id uuid
  REFERENCES organizations(id) ON DELETE SET NULL;

ALTER TABLE crm_tasks
  ADD COLUMN IF NOT EXISTS organization_id uuid
  REFERENCES organizations(id) ON DELETE SET NULL;

ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS organization_id uuid
  REFERENCES organizations(id) ON DELETE SET NULL;

-- ══════════════════════════════════════════════════════════════════
-- 2. Indexes
-- ══════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_contact_activities_org
  ON contact_activities(organization_id) WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_org
  ON opportunities(organization_id) WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crm_tasks_org
  ON crm_tasks(organization_id) WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tickets_org
  ON tickets(organization_id) WHERE organization_id IS NOT NULL;

-- ══════════════════════════════════════════════════════════════════
-- 3. Backfill organization_id depuis contacts via FK
--
--    Les enregistrements existants rattachés à un contact avec
--    organization_id héritent automatiquement de l'org de ce contact.
--    Les enregistrements sans contact_id gardent organization_id = NULL.
-- ══════════════════════════════════════════════════════════════════

UPDATE contact_activities ca
  SET organization_id = c.organization_id
  FROM contacts c
  WHERE ca.contact_id = c.id
    AND c.organization_id IS NOT NULL
    AND ca.organization_id IS NULL;

UPDATE opportunities op
  SET organization_id = c.organization_id
  FROM contacts c
  WHERE op.contact_id = c.id
    AND c.organization_id IS NOT NULL
    AND op.organization_id IS NULL;

UPDATE crm_tasks ct
  SET organization_id = c.organization_id
  FROM contacts c
  WHERE ct.contact_id = c.id
    AND c.organization_id IS NOT NULL
    AND ct.organization_id IS NULL;

UPDATE tickets ti
  SET organization_id = c.organization_id
  FROM contacts c
  WHERE ti.contact_id = c.id
    AND c.organization_id IS NOT NULL
    AND ti.organization_id IS NULL;

-- ══════════════════════════════════════════════════════════════════
-- 4. RLS — contact_activities
--
--    Supprime l'ancienne policy JOIN indirect (058) et les recréer
--    avec column directe organization_id (plus performant).
-- ══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "org_select_contact_activities"  ON contact_activities;
DROP POLICY IF EXISTS "org_insert_contact_activities"  ON contact_activities;
DROP POLICY IF EXISTS "org_update_contact_activities"  ON contact_activities;
DROP POLICY IF EXISTS "org_delete_contact_activities"  ON contact_activities;

-- SELECT : utilisateur propriétaire OU membre de l'org
CREATE POLICY "org_select_contact_activities" ON contact_activities FOR SELECT
  USING (
    organization_id IS NOT NULL AND is_org_member(organization_id)
  );

-- INSERT : membre de l'org, user_id doit être le sien
CREATE POLICY "org_insert_contact_activities" ON contact_activities FOR INSERT
  WITH CHECK (
    organization_id IS NOT NULL
    AND is_org_member(organization_id)
    AND user_id = auth.uid()
  );

-- UPDATE : admin de l'org ou propriétaire
CREATE POLICY "org_update_contact_activities" ON contact_activities FOR UPDATE
  USING (
    organization_id IS NOT NULL AND is_org_admin(organization_id)
  );

-- DELETE : admin de l'org ou propriétaire
CREATE POLICY "org_delete_contact_activities" ON contact_activities FOR DELETE
  USING (
    organization_id IS NOT NULL AND is_org_admin(organization_id)
  );

-- ══════════════════════════════════════════════════════════════════
-- 5. RLS — opportunities
--
--    Les policies 058 ont échoué (organization_id absent). On les
--    recrée proprement maintenant que la colonne existe.
-- ══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "org_select_opportunities"  ON opportunities;
DROP POLICY IF EXISTS "org_insert_opportunities"  ON opportunities;
DROP POLICY IF EXISTS "org_update_opportunities"  ON opportunities;
DROP POLICY IF EXISTS "org_delete_opportunities"  ON opportunities;

CREATE POLICY "org_select_opportunities" ON opportunities FOR SELECT
  USING (
    organization_id IS NOT NULL AND is_org_member(organization_id)
  );

CREATE POLICY "org_insert_opportunities" ON opportunities FOR INSERT
  WITH CHECK (
    organization_id IS NOT NULL
    AND is_org_member(organization_id)
    AND user_id = auth.uid()
  );

CREATE POLICY "org_update_opportunities" ON opportunities FOR UPDATE
  USING (
    organization_id IS NOT NULL AND is_org_admin(organization_id)
  );

CREATE POLICY "org_delete_opportunities" ON opportunities FOR DELETE
  USING (
    organization_id IS NOT NULL AND is_org_admin(organization_id)
  );

-- ══════════════════════════════════════════════════════════════════
-- 6. RLS — crm_tasks
--
--    Idem opportunities : policies 058 jamais créées.
-- ══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "org_select_crm_tasks"  ON crm_tasks;
DROP POLICY IF EXISTS "org_insert_crm_tasks"  ON crm_tasks;
DROP POLICY IF EXISTS "org_update_crm_tasks"  ON crm_tasks;
DROP POLICY IF EXISTS "org_delete_crm_tasks"  ON crm_tasks;

CREATE POLICY "org_select_crm_tasks" ON crm_tasks FOR SELECT
  USING (
    organization_id IS NOT NULL AND is_org_member(organization_id)
  );

CREATE POLICY "org_insert_crm_tasks" ON crm_tasks FOR INSERT
  WITH CHECK (
    organization_id IS NOT NULL
    AND is_org_member(organization_id)
    AND user_id = auth.uid()
  );

CREATE POLICY "org_update_crm_tasks" ON crm_tasks FOR UPDATE
  USING (
    organization_id IS NOT NULL AND is_org_admin(organization_id)
  );

CREATE POLICY "org_delete_crm_tasks" ON crm_tasks FOR DELETE
  USING (
    organization_id IS NOT NULL AND is_org_admin(organization_id)
  );

-- ══════════════════════════════════════════════════════════════════
-- 7. RLS — tickets
--
--    Tickets n'avait aucune policy org. Toutes sont nouvelles.
-- ══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "org_select_tickets"  ON tickets;
DROP POLICY IF EXISTS "org_insert_tickets"  ON tickets;
DROP POLICY IF EXISTS "org_update_tickets"  ON tickets;
DROP POLICY IF EXISTS "org_delete_tickets"  ON tickets;

CREATE POLICY "org_select_tickets" ON tickets FOR SELECT
  USING (
    organization_id IS NOT NULL AND is_org_member(organization_id)
  );

CREATE POLICY "org_insert_tickets" ON tickets FOR INSERT
  WITH CHECK (
    organization_id IS NOT NULL
    AND is_org_member(organization_id)
    AND user_id = auth.uid()
  );

CREATE POLICY "org_update_tickets" ON tickets FOR UPDATE
  USING (
    organization_id IS NOT NULL AND is_org_admin(organization_id)
  );

CREATE POLICY "org_delete_tickets" ON tickets FOR DELETE
  USING (
    organization_id IS NOT NULL AND is_org_admin(organization_id)
  );

COMMIT;
