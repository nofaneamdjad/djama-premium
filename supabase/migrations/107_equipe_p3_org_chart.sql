-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 107 — Organigramme persistant
-- Phase 3.3 — table org_departments + department_id sur team_members
--
-- Structure :
--   org_departments : id, organization_id, name, parent_id, manager_id, color, position
--   team_members    : department_id FK → org_departments
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. Table org_departments ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS org_departments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  parent_id       UUID        REFERENCES org_departments(id) ON DELETE SET NULL,
  manager_id      UUID        REFERENCES team_members(id)    ON DELETE SET NULL,
  color           TEXT        NOT NULL DEFAULT '#c9a55a',
  position        INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_od_org    ON org_departments (organization_id);
CREATE INDEX IF NOT EXISTS idx_od_parent ON org_departments (parent_id) WHERE parent_id IS NOT NULL;

-- ── 2. RLS sur org_departments ────────────────────────────────────────────────

ALTER TABLE org_departments ENABLE ROW LEVEL SECURITY;

-- Owner : accès complet
CREATE POLICY IF NOT EXISTS "od_owner" ON org_departments
  FOR ALL
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- Membres actifs : lecture seule
CREATE POLICY IF NOT EXISTS "od_member_select" ON org_departments
  FOR SELECT
  USING (
    is_org_member(organization_id)
  );

-- ── 3. Colonne department_id sur team_members ─────────────────────────────────

ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES org_departments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tm_department_id
  ON team_members (department_id) WHERE department_id IS NOT NULL;

-- ── 4. Trigger updated_at ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_od_updated_at ON org_departments;
CREATE TRIGGER trg_od_updated_at
  BEFORE UPDATE ON org_departments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── 5. Vérification ──────────────────────────────────────────────────────────

DO $$
BEGIN
  RAISE NOTICE '[107] org_departments créée — organigramme persistant opérationnel.';
  RAISE NOTICE '  Colonnes team_members.department_id ajoutée.';
END;
$$;
