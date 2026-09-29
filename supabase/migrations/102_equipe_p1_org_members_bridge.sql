-- ══════════════════════════════════════════════════════════════════════════════
-- Phase 1.3 (migration) — Bridge team_members ↔ organization_members
--
-- Pour tout membre existant ayant un auth_user_id, on l'inscrit dans
-- organization_members de son organisation si ce n'est pas déjà fait.
--
-- Idempotent grâce à ON CONFLICT DO NOTHING.
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO organization_members (organization_id, user_id, role, invite_email)
SELECT
  tm.organization_id,
  tm.auth_user_id,
  'member',
  tm.email
FROM team_members tm
WHERE tm.auth_user_id IS NOT NULL
  AND tm.organization_id IS NOT NULL
  -- Ne pas insérer si c'est l'owner lui-même
  AND tm.auth_user_id != (
    SELECT o.owner_id FROM organizations o WHERE o.id = tm.organization_id
  )
ON CONFLICT (organization_id, user_id) DO NOTHING;
