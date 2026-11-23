-- ══════════════════════════════════════════════════════════════════
-- Migration 20261117000001 : Correction récursion RLS organizations
--
-- PROBLÈME :
--   La politique "org_members_select" sur organization_members contient
--   un sous-SELECT sur organization_members elle-même. Quand PostgREST
--   exécute un INNER JOIN (organizations!inner), les deux politiques
--   (org_members_select + organizations_select_member) s'enchaînent et
--   génèrent une récursion infinie → HTTP 500.
--
-- SOLUTION :
--   Remplacer les sous-SELECT récursifs par des appels à is_org_member(),
--   fonction SECURITY DEFINER (migration 058) qui interroge organization_members
--   en contournant le RLS → plus de cycle.
--
-- SÉCURITÉ :
--   is_org_member(id) ≡ "l'utilisateur est membre de cet org" — même
--   restriction que l'ancienne politique, sans récursion.
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Politique SELECT sur organizations ────────────────────────────────────
-- Ancienne : id IN (SELECT ... FROM organization_members) → potentiellement
--            récursif quand organization_members a sa propre politique récursive
-- Nouvelle : is_org_member(id) — SECURITY DEFINER, pas de récursion
DROP POLICY IF EXISTS "organizations_select_member" ON organizations;
CREATE POLICY "organizations_select_member"
  ON organizations FOR SELECT
  USING (is_org_member(id));

-- ── 2. Politique SELECT sur organization_members ─────────────────────────────
-- Ancienne : organization_id IN (SELECT organization_id FROM organization_members
--             WHERE user_id = auth.uid()) → auto-référentielle → récursion
-- Nouvelle : is_org_member(organization_id) — SECURITY DEFINER, pas de récursion
DROP POLICY IF EXISTS "org_members_select" ON organization_members;
DROP POLICY IF EXISTS "org_members_select_same_org" ON organization_members;
CREATE POLICY "org_members_select"
  ON organization_members FOR SELECT
  USING (is_org_member(organization_id));
