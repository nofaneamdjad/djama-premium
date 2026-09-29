-- ══════════════════════════════════════════════════════════════════════════════
-- Phase 1.4 — RLS team_tasks : accès chef + accès membre assigné
--
-- Avant : une seule policy "tt_own" → user_id = auth.uid() (chef uniquement)
-- Après :
--   • chef  : ALL si user_id = auth.uid()
--   • membre: SELECT + UPDATE si auth_user_id = auth.uid() ET même org
--
-- Idempotent : DROP POLICY IF EXISTS avant CREATE POLICY
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Supprimer l'ancienne policy chef-only ─────────────────────────────────────
DROP POLICY IF EXISTS "tt_own"           ON team_tasks;

-- ── Policy chef : toutes opérations sur ses propres tâches ────────────────────
CREATE POLICY "tt_chef"
  ON team_tasks FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── Policy membre : lecture des tâches qui lui sont assignées ─────────────────
-- Condition :
--   1. La tâche a un organization_id
--   2. Il existe un team_members qui lie auth_user_id = auth.uid()
--      ET dont l'id = assigned_to
--      ET dont l'organization_id = la tâche
CREATE POLICY "tt_member_select"
  ON team_tasks FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.auth_user_id = auth.uid()
        AND tm.id = team_tasks.assigned_to
        AND tm.organization_id = team_tasks.organization_id
    )
  );

-- ── Policy membre : mise à jour du statut de ses propres tâches ──────────────
CREATE POLICY "tt_member_update"
  ON team_tasks FOR UPDATE
  USING (
    organization_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.auth_user_id = auth.uid()
        AND tm.id = team_tasks.assigned_to
        AND tm.organization_id = team_tasks.organization_id
    )
  );
