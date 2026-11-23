-- Migration 061: Messagerie interne par organisation
-- Tables : org_messages, org_message_groups, org_message_group_members, org_message_reads
-- Isolation totale par organization_id — un membre de l'org A ne peut JAMAIS
-- voir les conversations de l'org B.

-- ─── 1. Groupes de discussion (canaux / conversations de groupe) ──────────────
CREATE TABLE IF NOT EXISTS org_message_groups (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  description     TEXT,
  created_by      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_direct       BOOLEAN     NOT NULL DEFAULT FALSE, -- TRUE = DM entre 2 personnes
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_msg_groups_org ON org_message_groups (organization_id);

-- ─── 2. Membres d'un groupe ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_message_group_members (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        UUID        NOT NULL REFERENCES org_message_groups(id) ON DELETE CASCADE,
  organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_msg_group_members_group ON org_message_group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_msg_group_members_user  ON org_message_group_members (user_id, organization_id);

-- ─── 3. Messages ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  group_id        UUID        NOT NULL REFERENCES org_message_groups(id) ON DELETE CASCADE,
  sender_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content         TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 10000),
  file_url        TEXT,               -- pièce jointe (Supabase Storage)
  file_name       TEXT,
  is_deleted      BOOLEAN     NOT NULL DEFAULT FALSE,
  edited_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_messages_group   ON org_messages (group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_org_messages_org     ON org_messages (organization_id);
CREATE INDEX IF NOT EXISTS idx_org_messages_sender  ON org_messages (sender_id);

-- ─── 4. Lectures (indicateur "vu") ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_message_reads (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        UUID        NOT NULL REFERENCES org_message_groups(id) ON DELETE CASCADE,
  organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_msg_reads_user  ON org_message_reads (user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_msg_reads_group ON org_message_reads (group_id);

-- ─── 5. Trigger : mettre à jour updated_at sur les groupes ───────────────────
CREATE OR REPLACE FUNCTION update_msg_group_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE org_message_groups
  SET updated_at = NOW()
  WHERE id = NEW.group_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_msg_group_ts ON org_messages;
CREATE TRIGGER trg_update_msg_group_ts
  AFTER INSERT ON org_messages
  FOR EACH ROW EXECUTE FUNCTION update_msg_group_timestamp();

-- ─── 6. Activer RLS ───────────────────────────────────────────────────────────
ALTER TABLE org_message_groups          ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_message_group_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_messages                ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_message_reads           ENABLE ROW LEVEL SECURITY;

-- ─── 7. Politiques RLS : org_message_groups ──────────────────────────────────
-- Voir un groupe : être membre actif du groupe ET de l'organisation
CREATE POLICY "msg_groups_select" ON org_message_groups
  FOR SELECT USING (
    is_org_member(organization_id)
    AND EXISTS (
      SELECT 1 FROM org_message_group_members mgm
      WHERE mgm.group_id = id
        AND mgm.user_id  = auth.uid()
    )
  );

CREATE POLICY "msg_groups_insert" ON org_message_groups
  FOR INSERT WITH CHECK (
    is_org_member(organization_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "msg_groups_update" ON org_message_groups
  FOR UPDATE USING (
    is_org_member(organization_id)
    AND (created_by = auth.uid() OR is_org_admin(organization_id))
  );

CREATE POLICY "msg_groups_delete" ON org_message_groups
  FOR DELETE USING (
    is_org_admin(organization_id)
  );

-- ─── 8. Politiques RLS : org_message_group_members ───────────────────────────
CREATE POLICY "msg_group_members_select" ON org_message_group_members
  FOR SELECT USING (
    is_org_member(organization_id)
    AND EXISTS (
      SELECT 1 FROM org_message_group_members mgm2
      WHERE mgm2.group_id = group_id
        AND mgm2.user_id  = auth.uid()
    )
  );

CREATE POLICY "msg_group_members_insert" ON org_message_group_members
  FOR INSERT WITH CHECK (
    is_org_member(organization_id)
    AND (
      -- admin peut ajouter n'importe qui
      is_org_admin(organization_id)
      OR
      -- un membre ne peut s'ajouter que lui-même
      user_id = auth.uid()
    )
  );

CREATE POLICY "msg_group_members_delete" ON org_message_group_members
  FOR DELETE USING (
    -- quitter un groupe ou admin qui retire quelqu'un
    user_id = auth.uid()
    OR is_org_admin(organization_id)
  );

-- ─── 9. Politiques RLS : org_messages ────────────────────────────────────────
-- Lire un message : être membre actif du groupe
CREATE POLICY "org_messages_select" ON org_messages
  FOR SELECT USING (
    is_org_member(organization_id)
    AND EXISTS (
      SELECT 1 FROM org_message_group_members mgm
      WHERE mgm.group_id = group_id
        AND mgm.user_id  = auth.uid()
    )
  );

CREATE POLICY "org_messages_insert" ON org_messages
  FOR INSERT WITH CHECK (
    is_org_member(organization_id)
    AND sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM org_message_group_members mgm
      WHERE mgm.group_id = group_id
        AND mgm.user_id  = auth.uid()
    )
  );

-- Modifier son propre message (édition uniquement)
CREATE POLICY "org_messages_update" ON org_messages
  FOR UPDATE USING (
    sender_id = auth.uid()
    AND is_org_member(organization_id)
    AND is_deleted = FALSE
  ) WITH CHECK (
    sender_id = auth.uid()
  );

-- Supprimer (soft delete) : auteur ou admin
CREATE POLICY "org_messages_delete" ON org_messages
  FOR DELETE USING (
    sender_id = auth.uid()
    OR is_org_admin(organization_id)
  );

-- ─── 10. Politiques RLS : org_message_reads ──────────────────────────────────
CREATE POLICY "msg_reads_select" ON org_message_reads
  FOR SELECT USING (
    user_id = auth.uid()
    AND is_org_member(organization_id)
  );

CREATE POLICY "msg_reads_upsert" ON org_message_reads
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND is_org_member(organization_id)
  );

CREATE POLICY "msg_reads_update" ON org_message_reads
  FOR UPDATE USING (
    user_id = auth.uid()
    AND is_org_member(organization_id)
  );
