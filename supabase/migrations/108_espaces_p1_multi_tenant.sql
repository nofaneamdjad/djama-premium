-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 108 — Espaces Privés : multi-tenant + space_members
-- Phase 1 — Sécurité & architecture
--
-- Stratégie :
--   1. Ajouter organization_id (nullable) sur private_spaces
--   2. Backfill via organizations.owner_id
--   3. Fonction helper is_space_member() SECURITY DEFINER
--   4. Créer table space_members (rôles owner/admin/member/viewer)
--   5. Réécrire RLS private_spaces (owner + members)
--   6. Backfill space_members depuis team_members.space_id (existant)
--
-- RÈGLES :
--   - Aucune colonne existante supprimée
--   - Migration idempotente (IF NOT EXISTS / IF EXISTS partout)
--   - Aucune donnée détruite
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. organization_id sur private_spaces ────────────────────────────────────

ALTER TABLE private_spaces
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ps_org
  ON private_spaces (organization_id) WHERE organization_id IS NOT NULL;

-- ── 2. Backfill organization_id ───────────────────────────────────────────────

UPDATE private_spaces ps
SET organization_id = (
  SELECT o.id FROM organizations o
  WHERE o.owner_id = ps.user_id
  ORDER BY o.created_at DESC
  LIMIT 1
)
WHERE ps.organization_id IS NULL
  AND ps.user_id IS NOT NULL;

-- ── 3. Fonction is_space_member() ────────────────────────────────────────────
-- Retourne TRUE si auth.uid() est owner de l'org de l'espace
-- OU est dans space_members pour cet espace.

CREATE OR REPLACE FUNCTION is_space_member(p_space_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM space_members sm
    WHERE sm.space_id = p_space_id
      AND sm.user_id  = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM private_spaces ps
    JOIN organizations o ON o.id = ps.organization_id
    WHERE ps.id          = p_space_id
      AND o.owner_id     = auth.uid()
  ) OR EXISTS (
    -- Fallback legacy : espaces sans organization_id (user_id = auth.uid())
    SELECT 1 FROM private_spaces ps2
    WHERE ps2.id         = p_space_id
      AND ps2.user_id    = auth.uid()
      AND ps2.organization_id IS NULL
  )
$$;

-- ── 4. Table space_members ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS space_members (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id    UUID        NOT NULL REFERENCES private_spaces(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id)     ON DELETE CASCADE,
  org_id      UUID        REFERENCES organizations(id)           ON DELETE SET NULL,
  role        TEXT        NOT NULL DEFAULT 'member'
                          CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by  UUID        REFERENCES auth.users(id)              ON DELETE SET NULL,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (space_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_sm_space ON space_members (space_id);
CREATE INDEX IF NOT EXISTS idx_sm_user  ON space_members (user_id);
CREATE INDEX IF NOT EXISTS idx_sm_org   ON space_members (org_id);

ALTER TABLE space_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sm_read"   ON space_members;
DROP POLICY IF EXISTS "sm_manage" ON space_members;

-- Membres peuvent lire les memberships des espaces auxquels ils appartiennent
CREATE POLICY "sm_read" ON space_members
  FOR SELECT
  USING (is_space_member(space_id));

-- Owner org peut tout gérer (INSERT/UPDATE/DELETE via admin client en pratique)
CREATE POLICY "sm_manage" ON space_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM private_spaces ps
      JOIN organizations o ON o.id = ps.organization_id
      WHERE ps.id = space_id AND o.owner_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM private_spaces ps2
      WHERE ps2.id = space_id AND ps2.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM private_spaces ps
      JOIN organizations o ON o.id = ps.organization_id
      WHERE ps.id = space_id AND o.owner_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM private_spaces ps2
      WHERE ps2.id = space_id AND ps2.user_id = auth.uid()
    )
  );

-- ── 5. Réécrire RLS private_spaces ───────────────────────────────────────────

-- Supprimer l'ancienne politique unique
DROP POLICY IF EXISTS "ps_own" ON private_spaces;

-- Owner : accès complet (INSERT/UPDATE/DELETE)
CREATE POLICY IF NOT EXISTS "ps_owner_all" ON private_spaces
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Membres autorisés : lecture seulement
CREATE POLICY IF NOT EXISTS "ps_member_select" ON private_spaces
  FOR SELECT
  USING (is_space_member(id));

-- ── 6. Backfill space_members depuis team_members.space_id (existant) ────────
-- Les membres qui avaient déjà un space_id FK sur team_members
-- et qui ont un auth_user_id sont intégrés comme 'member' dans space_members.

DO $$
DECLARE
  tm RECORD;
  sp_org UUID;
BEGIN
  FOR tm IN
    SELECT t.auth_user_id, t.space_id, p.organization_id
    FROM team_members t
    JOIN private_spaces p ON p.id = t.space_id
    WHERE t.space_id IS NOT NULL
      AND t.auth_user_id IS NOT NULL
  LOOP
    INSERT INTO space_members (space_id, user_id, org_id, role)
    VALUES (tm.space_id, tm.auth_user_id, tm.organization_id, 'member')
    ON CONFLICT (space_id, user_id) DO NOTHING;
  END LOOP;
END;
$$;

-- ── 7. Vérification ──────────────────────────────────────────────────────────

DO $$
DECLARE
  ps_total    INT;
  ps_with_org INT;
  sm_total    INT;
BEGIN
  SELECT COUNT(*) INTO ps_total    FROM private_spaces;
  SELECT COUNT(*) INTO ps_with_org FROM private_spaces WHERE organization_id IS NOT NULL;
  SELECT COUNT(*) INTO sm_total    FROM space_members;
  RAISE NOTICE '[108] private_spaces: total=%, avec_org=%', ps_total, ps_with_org;
  RAISE NOTICE '[108] space_members: total=% (backfill depuis team_members)', sm_total;
  RAISE NOTICE '[108] is_space_member() créée — RLS multi-tenant opérationnelle';
END;
$$;
