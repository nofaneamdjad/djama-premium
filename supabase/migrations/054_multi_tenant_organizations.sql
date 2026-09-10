-- ══════════════════════════════════════════════════════════════════
-- Migration 054 : Structure multi-tenant — organisations et rôles
--
-- Architecture :
--   • Chaque utilisateur a son propre compte (user_id = auth.uid())
--   • Une entreprise est une Organization
--   • Un utilisateur peut appartenir à plusieurs organizations
--   • Chaque membre a un rôle : owner | admin | member | accountant | readonly
--   • Les permissions app-par-app sont dans organization_permissions
--
-- Isolation garantie par RLS :
--   • Un utilisateur ne voit que les organizations dont il est membre
--   • Un utilisateur ne peut accéder qu'aux données de ses organizations
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Table organizations ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  slug        text        UNIQUE,
  owner_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  plan        text        NOT NULL DEFAULT 'free',
  logo_url    text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Lecture : membres uniquement (via organization_members)
CREATE POLICY "organizations_select_member"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Création : tout utilisateur peut créer une organization (il devient owner)
CREATE POLICY "organizations_insert_owner"
  ON organizations FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Mise à jour : owner uniquement
CREATE POLICY "organizations_update_owner"
  ON organizations FOR UPDATE
  USING (owner_id = auth.uid());

-- Suppression : owner uniquement
CREATE POLICY "organizations_delete_owner"
  ON organizations FOR DELETE
  USING (owner_id = auth.uid());

-- ── 2. Table organization_members ─────────────────────────────────
CREATE TABLE IF NOT EXISTS organization_members (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
  role            text        NOT NULL DEFAULT 'member'
    CHECK (role IN ('owner', 'admin', 'member', 'accountant', 'readonly')),
  invited_by      uuid        REFERENCES auth.users(id),
  invite_email    text,
  joined_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Lecture : membres de la même organization
CREATE POLICY "org_members_select_same_org"
  ON organization_members FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Ajout de membres : owner ou admin uniquement
CREATE POLICY "org_members_insert_admin"
  ON organization_members FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Modification de rôle : owner ou admin uniquement
CREATE POLICY "org_members_update_admin"
  ON organization_members FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Suppression : owner/admin peut retirer n'importe qui,
-- un membre peut quitter de lui-même
CREATE POLICY "org_members_delete"
  ON organization_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- ── 3. Table organization_permissions (granulaire par app) ─────────
CREATE TABLE IF NOT EXISTS organization_permissions (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid    NOT NULL REFERENCES organizations(id)      ON DELETE CASCADE,
  user_id         uuid    NOT NULL REFERENCES auth.users(id)         ON DELETE CASCADE,
  app_slug        text    NOT NULL,
  can_view        boolean NOT NULL DEFAULT true,
  can_create      boolean NOT NULL DEFAULT false,
  can_edit        boolean NOT NULL DEFAULT false,
  can_delete      boolean NOT NULL DEFAULT false,
  can_export      boolean NOT NULL DEFAULT false,
  UNIQUE (organization_id, user_id, app_slug)
);

ALTER TABLE organization_permissions ENABLE ROW LEVEL SECURITY;

-- Lecture : membre de la même organization ou propriétaire de la permission
CREATE POLICY "org_perms_select"
  ON organization_permissions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Gestion des permissions : owner ou admin uniquement
CREATE POLICY "org_perms_write_admin"
  ON organization_permissions FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- ── 4. Index de performance ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS org_members_user_id_idx
  ON organization_members (user_id);
CREATE INDEX IF NOT EXISTS org_members_org_id_idx
  ON organization_members (organization_id);
CREATE INDEX IF NOT EXISTS org_perms_user_org_idx
  ON organization_permissions (user_id, organization_id);
CREATE INDEX IF NOT EXISTS org_perms_org_app_idx
  ON organization_permissions (organization_id, app_slug);

-- ── 5. Ajouter organization_id en option sur les tables principales ─
-- (nullable pour l'instant — la migration des données existantes
--  se fera manuellement lors de l'onboarding multi-tenant)
ALTER TABLE documents      ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE expenses       ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE contacts       ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE employees      ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE projects       ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);

CREATE INDEX IF NOT EXISTS documents_org_idx  ON documents  (organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS expenses_org_idx   ON expenses   (organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS contacts_org_idx   ON contacts   (organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS employees_org_idx  ON employees  (organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS projects_org_idx   ON projects   (organization_id) WHERE organization_id IS NOT NULL;
