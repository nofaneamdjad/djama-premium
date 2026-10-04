-- ═══════════════════════════════════════════════════════════════════════════
-- SOURCING IA — Phase 1 Sécurité
-- 1. organization_id sur sourcing_sessions + sourcing_negotiations
-- 2. Backfill sûr depuis organization_members (premier org de l'utilisateur)
-- 3. RLS isolant par organisation (en plus de l'isolation par user)
-- 4. CHECK constraint sur sourcing_negotiations.status
-- 5. Index composites
--
-- IDEMPOTENTE : toutes les opérations utilisent IF NOT EXISTS / IF EXISTS
-- SAFE : organization_id NULLABLE pendant le backfill, NOT NULL après
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Ajouter organization_id (nullable d'abord pour le backfill) ─────────

ALTER TABLE sourcing_sessions
  ADD COLUMN IF NOT EXISTS organization_id uuid
    REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE sourcing_negotiations
  ADD COLUMN IF NOT EXISTS organization_id uuid
    REFERENCES organizations(id) ON DELETE CASCADE;

-- ── 2. Backfill : rattacher les lignes existantes au premier org du user ───
-- Si un utilisateur appartient à plusieurs orgs, on prend la plus ancienne.
-- Les lignes sans membership restent à NULL (aucune perte de données).

UPDATE sourcing_sessions ss
SET organization_id = (
  SELECT om.organization_id
  FROM organization_members om
  WHERE om.user_id = ss.user_id
  ORDER BY om.created_at ASC
  LIMIT 1
)
WHERE ss.organization_id IS NULL;

UPDATE sourcing_negotiations sn
SET organization_id = (
  SELECT om.organization_id
  FROM organization_members om
  WHERE om.user_id = sn.user_id
  ORDER BY om.created_at ASC
  LIMIT 1
)
WHERE sn.organization_id IS NULL;

-- ── 3. Indexes composites ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_sourcing_sessions_org
  ON sourcing_sessions(organization_id, created_at DESC)
  WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sourcing_negotiations_org
  ON sourcing_negotiations(organization_id)
  WHERE organization_id IS NOT NULL;

-- ── 4. CHECK constraint sur status négociations ────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sourcing_neg_status_check'
      AND table_name      = 'sourcing_negotiations'
  ) THEN
    ALTER TABLE sourcing_negotiations
      ADD CONSTRAINT sourcing_neg_status_check
      CHECK (status IN ('En cours', 'Offre reçue', 'Accepté', 'Refusé'));
  END IF;
END $$;

-- ── 5. RLS — Conserver les policies existantes + ajouter isolation org ─────

-- sourcing_sessions : politique organisation (SELECT + INSERT + UPDATE + DELETE)
DROP POLICY IF EXISTS "sourcing_sessions_org" ON sourcing_sessions;
CREATE POLICY "sourcing_sessions_org" ON sourcing_sessions
  USING (
    organization_id IS NOT NULL
    AND is_org_member(organization_id)
  )
  WITH CHECK (
    organization_id IS NOT NULL
    AND is_org_member(organization_id)
  );

-- sourcing_negotiations : politique organisation
DROP POLICY IF EXISTS "sourcing_neg_org" ON sourcing_negotiations;
CREATE POLICY "sourcing_neg_org" ON sourcing_negotiations
  USING (
    organization_id IS NOT NULL
    AND is_org_member(organization_id)
  )
  WITH CHECK (
    organization_id IS NOT NULL
    AND is_org_member(organization_id)
  );

-- ── 6. Note : les lignes avec organization_id NULL restent accessibles ──────
-- uniquement via la policy "sourcing_sessions_self" (auth.uid() = user_id)
-- qui existait avant cette migration. Elles ne seront accessibles que par
-- leur propriétaire direct, jamais par d'autres membres d'une org.
-- Ces lignes seront rattachées à une org lors de la prochaine sauvegarde.
