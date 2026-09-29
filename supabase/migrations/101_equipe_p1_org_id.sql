-- ══════════════════════════════════════════════════════════════════════════════
-- Phase 1.2 — Ajout organization_id sur toutes les tables team_*
-- Backfill via organizations.owner_id = team_*.user_id
-- Idempotent : peut être rejoué sans risque
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Ajout de organization_id sur team_members ──────────────────────────────
ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tm_org ON team_members(organization_id);

-- ── 2. Ajout de organization_id sur team_tasks ────────────────────────────────
ALTER TABLE team_tasks
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tt_org ON team_tasks(organization_id);

-- ── 3. Ajout de organization_id sur team_messages ────────────────────────────
ALTER TABLE team_messages
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tmsg_org ON team_messages(organization_id);

-- ── 4. Ajout de organization_id sur team_leaves ──────────────────────────────
ALTER TABLE team_leaves
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tl_org ON team_leaves(organization_id);

-- ── 5. Ajout de organization_id sur team_meetings ────────────────────────────
ALTER TABLE team_meetings
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tmeet_org ON team_meetings(organization_id);

-- ── 6. Backfill : on rattache chaque enregistrement à l'organisation dont
--       le chef (owner_id) est l'utilisateur propriétaire (user_id).
--       Un chef peut avoir plusieurs organisations : on prend la plus récente
--       (ORDER BY created_at DESC LIMIT 1) — comportement prévisible et sûr.
--
--       WHERE organization_id IS NULL → idempotent, ne touche pas les lignes
--       déjà renseignées lors de créations futures.
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE team_members tm
SET organization_id = (
  SELECT o.id FROM organizations o
  WHERE o.owner_id = tm.user_id
  ORDER BY o.created_at DESC
  LIMIT 1
)
WHERE tm.organization_id IS NULL
  AND EXISTS (
    SELECT 1 FROM organizations o WHERE o.owner_id = tm.user_id
  );

UPDATE team_tasks tt
SET organization_id = (
  SELECT o.id FROM organizations o
  WHERE o.owner_id = tt.user_id
  ORDER BY o.created_at DESC
  LIMIT 1
)
WHERE tt.organization_id IS NULL
  AND EXISTS (
    SELECT 1 FROM organizations o WHERE o.owner_id = tt.user_id
  );

UPDATE team_messages tm
SET organization_id = (
  SELECT o.id FROM organizations o
  WHERE o.owner_id = tm.user_id
  ORDER BY o.created_at DESC
  LIMIT 1
)
WHERE tm.organization_id IS NULL
  AND EXISTS (
    SELECT 1 FROM organizations o WHERE o.owner_id = tm.user_id
  );

UPDATE team_leaves tl
SET organization_id = (
  SELECT o.id FROM organizations o
  WHERE o.owner_id = tl.user_id
  ORDER BY o.created_at DESC
  LIMIT 1
)
WHERE tl.organization_id IS NULL
  AND EXISTS (
    SELECT 1 FROM organizations o WHERE o.owner_id = tl.user_id
  );

UPDATE team_meetings tm
SET organization_id = (
  SELECT o.id FROM organizations o
  WHERE o.owner_id = tm.user_id
  ORDER BY o.created_at DESC
  LIMIT 1
)
WHERE tm.organization_id IS NULL
  AND EXISTS (
    SELECT 1 FROM organizations o WHERE o.owner_id = tm.user_id
  );
