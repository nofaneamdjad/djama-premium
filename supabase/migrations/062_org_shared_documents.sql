-- Migration 062: Partage de documents dans l'organisation
-- Table org_shared_documents avec ciblage (org-wide / groupe / membre individuel)
-- Un membre ne peut JAMAIS récupérer un document qui ne lui a pas été partagé.

-- ─── 1. Table principale ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_shared_documents (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Référence au document source (table documents existante)
  document_id      UUID        REFERENCES documents(id) ON DELETE CASCADE,

  -- Ou fichier uploadé directement (Supabase Storage)
  file_url         TEXT,
  file_name        TEXT,
  file_size        BIGINT,     -- bytes
  file_type        TEXT,       -- MIME type

  title            TEXT        NOT NULL,
  description      TEXT,

  -- Qui partage
  shared_by        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Cible du partage
  share_target     TEXT        NOT NULL DEFAULT 'all'
                   CHECK (share_target IN ('all', 'group', 'member')),
  target_group_id  UUID        REFERENCES org_message_groups(id) ON DELETE CASCADE,
  target_user_id   UUID        REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Permissions
  can_view         BOOLEAN     NOT NULL DEFAULT TRUE,
  can_download     BOOLEAN     NOT NULL DEFAULT TRUE,
  can_edit         BOOLEAN     NOT NULL DEFAULT FALSE,

  -- Métadonnées
  expires_at       TIMESTAMPTZ,        -- NULL = pas d'expiration
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contraintes de cohérence selon share_target
  CONSTRAINT chk_target_group  CHECK (share_target <> 'group'  OR target_group_id IS NOT NULL),
  CONSTRAINT chk_target_member CHECK (share_target <> 'member' OR target_user_id  IS NOT NULL),
  CONSTRAINT chk_source        CHECK (document_id IS NOT NULL OR file_url IS NOT NULL)
);

-- ─── 2. Index ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_shared_docs_org    ON org_shared_documents (organization_id);
CREATE INDEX IF NOT EXISTS idx_shared_docs_shared_by ON org_shared_documents (shared_by);
CREATE INDEX IF NOT EXISTS idx_shared_docs_target_user  ON org_shared_documents (organization_id, target_user_id)
  WHERE target_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shared_docs_target_group ON org_shared_documents (organization_id, target_group_id)
  WHERE target_group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shared_docs_all    ON org_shared_documents (organization_id)
  WHERE share_target = 'all';

-- ─── 3. Trigger updated_at ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_shared_doc_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_shared_docs_updated_at ON org_shared_documents;
CREATE TRIGGER trg_shared_docs_updated_at
  BEFORE UPDATE ON org_shared_documents
  FOR EACH ROW EXECUTE FUNCTION update_shared_doc_timestamp();

-- ─── 4. Activer RLS ───────────────────────────────────────────────────────────
ALTER TABLE org_shared_documents ENABLE ROW LEVEL SECURITY;

-- ─── 5. Fonction helper : peut-on voir ce document ? ─────────────────────────
-- Utilisée dans la politique SELECT pour éviter la répétition
CREATE OR REPLACE FUNCTION can_view_shared_doc(p_doc_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM org_shared_documents osd
    WHERE osd.id = p_doc_id
      -- Doit être membre actif de l'organisation
      AND is_org_member(osd.organization_id)
      -- Pas expiré
      AND (osd.expires_at IS NULL OR osd.expires_at > NOW())
      -- Ciblage : org-wide OU membre direct OU via groupe
      AND (
        osd.share_target = 'all'
        OR (osd.share_target = 'member' AND osd.target_user_id = auth.uid())
        OR (
          osd.share_target = 'group'
          AND EXISTS (
            SELECT 1 FROM org_message_group_members mgm
            WHERE mgm.group_id = osd.target_group_id
              AND mgm.user_id  = auth.uid()
          )
        )
      )
      AND osd.can_view = TRUE
  );
$$;

-- ─── 6. Politiques RLS ───────────────────────────────────────────────────────

-- SELECT : membre actif + document partagé avec lui + non expiré
CREATE POLICY "shared_docs_select" ON org_shared_documents
  FOR SELECT USING (
    -- Être membre actif de l'organisation
    is_org_member(organization_id)
    -- Document non expiré
    AND (expires_at IS NULL OR expires_at > NOW())
    -- Ciblage correct
    AND (
      share_target = 'all'
      OR (share_target = 'member' AND target_user_id = auth.uid())
      OR (
        share_target = 'group'
        AND EXISTS (
          SELECT 1 FROM org_message_group_members mgm
          WHERE mgm.group_id = target_group_id
            AND mgm.user_id  = auth.uid()
        )
      )
      -- Ou c'est moi qui ai partagé (pour gérer mon propre partage)
      OR shared_by = auth.uid()
    )
  );

-- INSERT : admin ou membre actif qui partage
CREATE POLICY "shared_docs_insert" ON org_shared_documents
  FOR INSERT WITH CHECK (
    is_org_member(organization_id)
    AND shared_by = auth.uid()
    -- Seuls les admins peuvent partager avec org-wide
    AND (
      share_target <> 'all'
      OR is_org_admin(organization_id)
    )
  );

-- UPDATE : celui qui a partagé ou un admin
CREATE POLICY "shared_docs_update" ON org_shared_documents
  FOR UPDATE USING (
    (shared_by = auth.uid() OR is_org_admin(organization_id))
    AND is_org_member(organization_id)
  );

-- DELETE : celui qui a partagé ou un admin
CREATE POLICY "shared_docs_delete" ON org_shared_documents
  FOR DELETE USING (
    (shared_by = auth.uid() OR is_org_admin(organization_id))
    AND is_org_member(organization_id)
  );

-- ─── 7. Vue utilitaire pour récupérer les docs avec info expéditeur ───────────
CREATE OR REPLACE VIEW v_my_shared_docs AS
SELECT
  osd.id,
  osd.organization_id,
  osd.document_id,
  osd.file_url,
  osd.file_name,
  osd.file_size,
  osd.file_type,
  osd.title,
  osd.description,
  osd.share_target,
  osd.target_user_id,
  osd.target_group_id,
  osd.can_view,
  osd.can_download,
  osd.can_edit,
  osd.expires_at,
  osd.created_at,
  osd.shared_by,
  -- Infos sur l'expéditeur (depuis les métadonnées Supabase Auth)
  u.raw_user_meta_data ->> 'name'   AS shared_by_name,
  u.email                           AS shared_by_email
FROM org_shared_documents osd
JOIN auth.users u ON u.id = osd.shared_by
WHERE
  is_org_member(osd.organization_id)
  AND (osd.expires_at IS NULL OR osd.expires_at > NOW())
  AND (
    osd.share_target = 'all'
    OR (osd.share_target = 'member' AND osd.target_user_id = auth.uid())
    OR (
      osd.share_target = 'group'
      AND EXISTS (
        SELECT 1 FROM org_message_group_members mgm
        WHERE mgm.group_id = osd.target_group_id
          AND mgm.user_id  = auth.uid()
      )
    )
    OR osd.shared_by = auth.uid()
  );
