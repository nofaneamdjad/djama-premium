-- Migration 068 — P0.2 : is_org_admin() doit exclure les admins suspendus
-- Raison : migration 060 a correctement mis à jour is_org_member() avec
--          AND suspended_at IS NULL, mais a oublié is_org_admin().
--          Un admin suspendu gardait donc tous ses droits RLS.
-- Idempotent : CREATE OR REPLACE FUNCTION
CREATE OR REPLACE FUNCTION is_org_admin(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_id = p_org_id
      AND user_id         = auth.uid()
      AND role            IN ('owner', 'admin')
      AND suspended_at    IS NULL
  );
$$;
