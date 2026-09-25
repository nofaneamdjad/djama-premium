-- ══════════════════════════════════════════════════════════════════
-- Migration 077 : CRM — Permissions granulaires par membre
--
-- PROBLÈME (audit) :
--   Les permissions can_create/can_edit/can_delete/can_export de la
--   table organization_permissions existent mais ne sont jamais
--   vérifiées par le CRM. Un membre avec can_view=true peut
--   supprimer des contacts via Supabase direct.
--
-- SOLUTION :
--   1. Fonction has_crm_perm(p_permission) — SECURITY DEFINER
--      • Solo (pas d'org) → true (accès complet à ses propres données)
--      • Admin/owner org → true
--      • Autre membre → lit organization_permissions pour app_slug='crm'
--
--   2. Mise à jour des policies INSERT/UPDATE/DELETE sur les 5 tables CRM
--      pour inclure has_crm_perm() en plus des checks user_id existants.
--
-- NOTE : les policies SELECT ne bougent pas (can_view est géré par
-- le middleware Next.js, qui redirige déjà les non-autorisés).
--
-- IDEMPOTENT : oui (CREATE OR REPLACE, DROP POLICY IF EXISTS)
-- NE SUPPRIME AUCUNE DONNÉE EXISTANTE
-- ORDRE : après 076_crm_org_multi_tenant.sql
-- ══════════════════════════════════════════════════════════════════

BEGIN;

-- ══════════════════════════════════════════════════════════════════
-- 1. Fonction has_crm_perm(p_permission text)
--
--    Renvoie true si auth.uid() peut effectuer l'opération p_permission
--    sur les données CRM de son contexte (solo OU org).
--
--    p_permission : 'can_create' | 'can_edit' | 'can_delete' | 'can_export' | 'can_view'
-- ══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION has_crm_perm(p_permission text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_uid        uuid := auth.uid();
  v_is_member  boolean;
  v_is_admin   boolean;
  v_perm       boolean;
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  -- Vérifier si l'utilisateur est membre d'une org
  SELECT EXISTS (
    SELECT 1 FROM organization_members WHERE user_id = v_uid
  ) INTO v_is_member;

  -- Solo (pas d'org) : accès complet à ses propres données
  IF NOT v_is_member THEN
    RETURN true;
  END IF;

  -- Admin ou propriétaire d'une org : accès complet
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = v_uid AND role IN ('owner', 'admin')
  ) INTO v_is_admin;

  IF v_is_admin THEN
    RETURN true;
  END IF;

  -- Membre standard : vérifier organization_permissions pour app_slug='crm'
  SELECT
    CASE p_permission
      WHEN 'can_create' THEN COALESCE(op.can_create, false)
      WHEN 'can_edit'   THEN COALESCE(op.can_edit,   false)
      WHEN 'can_delete' THEN COALESCE(op.can_delete,  false)
      WHEN 'can_export' THEN COALESCE(op.can_export,  false)
      WHEN 'can_view'   THEN COALESCE(op.can_view,    false)
      ELSE false
    END
  INTO v_perm
  FROM organization_members om
  JOIN organization_permissions op
    ON op.organization_id = om.organization_id
    AND op.user_id = v_uid
    AND op.app_slug = 'crm'
  WHERE om.user_id = v_uid
  LIMIT 1;

  RETURN COALESCE(v_perm, false);
END;
$$;

-- ══════════════════════════════════════════════════════════════════
-- 2. RLS — contacts : INSERT/UPDATE/DELETE avec permission check
-- ══════════════════════════════════════════════════════════════════

-- INSERT
DROP POLICY IF EXISTS "user_insert_contacts" ON contacts;
CREATE POLICY "user_insert_contacts" ON contacts FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND has_crm_perm('can_create')
  );

-- UPDATE
DROP POLICY IF EXISTS "user_update_contacts" ON contacts;
CREATE POLICY "user_update_contacts" ON contacts FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND has_crm_perm('can_edit')
  );

-- DELETE
DROP POLICY IF EXISTS "user_delete_contacts" ON contacts;
CREATE POLICY "user_delete_contacts" ON contacts FOR DELETE
  USING (
    user_id = auth.uid()
    AND has_crm_perm('can_delete')
  );

-- ══════════════════════════════════════════════════════════════════
-- 3. RLS — contact_activities
-- ══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "user_insert_contact_activities" ON contact_activities;
CREATE POLICY "user_insert_contact_activities" ON contact_activities FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND has_crm_perm('can_create')
  );

DROP POLICY IF EXISTS "user_update_contact_activities" ON contact_activities;
CREATE POLICY "user_update_contact_activities" ON contact_activities FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND has_crm_perm('can_edit')
  );

DROP POLICY IF EXISTS "user_delete_contact_activities" ON contact_activities;
CREATE POLICY "user_delete_contact_activities" ON contact_activities FOR DELETE
  USING (
    user_id = auth.uid()
    AND has_crm_perm('can_delete')
  );

-- ══════════════════════════════════════════════════════════════════
-- 4. RLS — opportunities
-- ══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "user_insert_opportunities" ON opportunities;
CREATE POLICY "user_insert_opportunities" ON opportunities FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND has_crm_perm('can_create')
  );

DROP POLICY IF EXISTS "user_update_opportunities" ON opportunities;
CREATE POLICY "user_update_opportunities" ON opportunities FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND has_crm_perm('can_edit')
  );

DROP POLICY IF EXISTS "user_delete_opportunities" ON opportunities;
CREATE POLICY "user_delete_opportunities" ON opportunities FOR DELETE
  USING (
    user_id = auth.uid()
    AND has_crm_perm('can_delete')
  );

-- ══════════════════════════════════════════════════════════════════
-- 5. RLS — crm_tasks
-- ══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "user_insert_crm_tasks" ON crm_tasks;
CREATE POLICY "user_insert_crm_tasks" ON crm_tasks FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND has_crm_perm('can_create')
  );

DROP POLICY IF EXISTS "user_update_crm_tasks" ON crm_tasks;
CREATE POLICY "user_update_crm_tasks" ON crm_tasks FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND has_crm_perm('can_edit')
  );

DROP POLICY IF EXISTS "user_delete_crm_tasks" ON crm_tasks;
CREATE POLICY "user_delete_crm_tasks" ON crm_tasks FOR DELETE
  USING (
    user_id = auth.uid()
    AND has_crm_perm('can_delete')
  );

-- ══════════════════════════════════════════════════════════════════
-- 6. RLS — tickets
-- ══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "user_insert_tickets" ON tickets;
CREATE POLICY "user_insert_tickets" ON tickets FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND has_crm_perm('can_create')
  );

DROP POLICY IF EXISTS "user_update_tickets" ON tickets;
CREATE POLICY "user_update_tickets" ON tickets FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND has_crm_perm('can_edit')
  );

DROP POLICY IF EXISTS "user_delete_tickets" ON tickets;
CREATE POLICY "user_delete_tickets" ON tickets FOR DELETE
  USING (
    user_id = auth.uid()
    AND has_crm_perm('can_delete')
  );

-- ══════════════════════════════════════════════════════════════════
-- 7. Policies org INSERT/UPDATE/DELETE : ajout has_crm_perm()
--    (ces policies couvrent le cas org_insert créé en 076/058)
-- ══════════════════════════════════════════════════════════════════

-- contacts org
DROP POLICY IF EXISTS "org_insert_contacts" ON contacts;
CREATE POLICY "org_insert_contacts" ON contacts FOR INSERT
  WITH CHECK (
    organization_id IS NOT NULL
    AND is_org_member(organization_id)
    AND user_id = auth.uid()
    AND has_crm_perm('can_create')
  );

DROP POLICY IF EXISTS "org_admin_update_contacts" ON contacts;
CREATE POLICY "org_admin_update_contacts" ON contacts FOR UPDATE
  USING (organization_id IS NOT NULL AND is_org_admin(organization_id));

DROP POLICY IF EXISTS "org_admin_delete_contacts" ON contacts;
CREATE POLICY "org_admin_delete_contacts" ON contacts FOR DELETE
  USING (organization_id IS NOT NULL AND is_org_admin(organization_id));

-- contact_activities org
DROP POLICY IF EXISTS "org_insert_contact_activities" ON contact_activities;
CREATE POLICY "org_insert_contact_activities" ON contact_activities FOR INSERT
  WITH CHECK (
    organization_id IS NOT NULL
    AND is_org_member(organization_id)
    AND user_id = auth.uid()
    AND has_crm_perm('can_create')
  );

-- opportunities org
DROP POLICY IF EXISTS "org_insert_opportunities" ON opportunities;
CREATE POLICY "org_insert_opportunities" ON opportunities FOR INSERT
  WITH CHECK (
    organization_id IS NOT NULL
    AND is_org_member(organization_id)
    AND user_id = auth.uid()
    AND has_crm_perm('can_create')
  );

-- crm_tasks org
DROP POLICY IF EXISTS "org_insert_crm_tasks" ON crm_tasks;
CREATE POLICY "org_insert_crm_tasks" ON crm_tasks FOR INSERT
  WITH CHECK (
    organization_id IS NOT NULL
    AND is_org_member(organization_id)
    AND user_id = auth.uid()
    AND has_crm_perm('can_create')
  );

-- tickets org
DROP POLICY IF EXISTS "org_insert_tickets" ON tickets;
CREATE POLICY "org_insert_tickets" ON tickets FOR INSERT
  WITH CHECK (
    organization_id IS NOT NULL
    AND is_org_member(organization_id)
    AND user_id = auth.uid()
    AND has_crm_perm('can_create')
  );

COMMIT;
