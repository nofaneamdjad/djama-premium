-- Migration 060: Améliorations organization_members
-- Ajoute suspended_at, display_name, last_seen_at
-- Met à jour les politiques RLS pour bloquer les membres suspendus

-- ─── 1. Colonnes supplémentaires ──────────────────────────────────────────────
ALTER TABLE organization_members
  ADD COLUMN IF NOT EXISTS suspended_at   TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS suspended_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT     DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS display_name   TEXT        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_seen_at   TIMESTAMPTZ DEFAULT NULL;

-- ─── 2. Index pour les requêtes fréquentes ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_org_members_suspended
  ON organization_members (organization_id, suspended_at)
  WHERE suspended_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_org_members_last_seen
  ON organization_members (organization_id, last_seen_at DESC NULLS LAST);

-- ─── 3. Mettre à jour is_org_member pour exclure les suspendus ────────────────
-- Remplace la fonction existante (migration 058)
CREATE OR REPLACE FUNCTION is_org_member(p_org_id UUID)
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
      AND suspended_at    IS NULL
  );
$$;

-- ─── 4. Nouvelle fonction : vérifier si actif (non suspendu) ──────────────────
CREATE OR REPLACE FUNCTION is_org_member_active(p_org_id UUID, p_user_id UUID)
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
      AND user_id         = p_user_id
      AND suspended_at    IS NULL
  );
$$;

-- ─── 5. Fonction pour mettre à jour last_seen_at (appelée par les pages /membre) ──
CREATE OR REPLACE FUNCTION update_member_last_seen(p_org_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE organization_members
  SET last_seen_at = NOW()
  WHERE organization_id = p_org_id
    AND user_id         = auth.uid()
    AND suspended_at    IS NULL;
END;
$$;

-- ─── 6. Politiques RLS sur organization_members ───────────────────────────────
-- Supprimer les anciennes et recréer avec contrôle de suspension

-- SELECT : un membre peut voir les autres membres de son org (même suspendu, pour le login)
DROP POLICY IF EXISTS "org_members_select" ON organization_members;
CREATE POLICY "org_members_select" ON organization_members
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members om2
      WHERE om2.user_id = auth.uid()
    )
  );

-- INSERT : seuls les admins/owners peuvent ajouter des membres (via service_role pour invitations)
DROP POLICY IF EXISTS "org_members_insert" ON organization_members;
CREATE POLICY "org_members_insert" ON organization_members
  FOR INSERT WITH CHECK (
    is_org_admin(organization_id)
  );

-- UPDATE : admins peuvent modifier, membres peuvent MAJ leur propre last_seen_at/display_name
DROP POLICY IF EXISTS "org_members_update" ON organization_members;
CREATE POLICY "org_members_update" ON organization_members
  FOR UPDATE USING (
    -- admin peut tout modifier
    is_org_admin(organization_id)
    OR
    -- membre peut mettre à jour ses propres champs non-sensibles
    (user_id = auth.uid() AND suspended_at IS NULL)
  ) WITH CHECK (
    is_org_admin(organization_id)
    OR
    (user_id = auth.uid() AND suspended_at IS NULL)
  );

-- DELETE : seuls les admins/owners
DROP POLICY IF EXISTS "org_members_delete" ON organization_members;
CREATE POLICY "org_members_delete" ON organization_members
  FOR DELETE USING (
    is_org_admin(organization_id)
  );
