-- ══════════════════════════════════════════════════════════════════════════════
-- Phase 1.5 — Unification du chat : org_messages comme architecture unique
--
-- 1. Crée les canaux par défaut (général, annonces, projets, ressources) par org
-- 2. Ajoute l'owner et les membres org existants dans ces canaux
-- 3. Migre les team_messages existants → org_messages
-- 4. Rend team_messages en lecture seule (retire INSERT/UPDATE/DELETE)
--
-- Idempotent : ON CONFLICT DO NOTHING + DROP POLICY IF EXISTS
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Créer les canaux par défaut pour chaque organisation ───────────────────
-- On crée uniquement s'il n'existe pas déjà un canal avec ce nom dans cette org.
DO $$
DECLARE
  org      RECORD;
  channel  TEXT;
  channels TEXT[] := ARRAY['général', 'annonces', 'projets', 'ressources'];
  grp_id   UUID;
BEGIN
  FOR org IN SELECT id, owner_id FROM organizations LOOP
    FOREACH channel IN ARRAY channels LOOP
      -- Vérifier si le canal existe déjà
      SELECT id INTO grp_id
      FROM org_message_groups
      WHERE organization_id = org.id
        AND name = channel
        AND is_direct = FALSE
      LIMIT 1;

      IF grp_id IS NULL THEN
        INSERT INTO org_message_groups (organization_id, name, created_by, is_direct)
        VALUES (org.id, channel, org.owner_id, FALSE)
        RETURNING id INTO grp_id;
      END IF;

      -- Ajouter l'owner au canal (s'il n'y est pas)
      INSERT INTO org_message_group_members (group_id, organization_id, user_id)
      VALUES (grp_id, org.id, org.owner_id)
      ON CONFLICT (group_id, user_id) DO NOTHING;

      -- Ajouter tous les membres org_members actifs (non suspendus) au canal
      INSERT INTO org_message_group_members (group_id, organization_id, user_id)
      SELECT grp_id, org.id, om.user_id
      FROM organization_members om
      WHERE om.organization_id = org.id
        AND om.suspended_at IS NULL
      ON CONFLICT (group_id, user_id) DO NOTHING;

    END LOOP;
  END LOOP;
END;
$$;

-- ── 2. Migrer les team_messages existants → org_messages ─────────────────────
-- Stratégie : mapper team_messages.channel → canal org correspondant
-- Seuls les messages dont l'org a été backfillée (organization_id NOT NULL) sont migrés.
INSERT INTO org_messages (organization_id, group_id, sender_id, content, created_at)
SELECT
  tm.organization_id,
  omg.id,
  tm.user_id,
  tm.content,
  tm.created_at
FROM team_messages tm
JOIN org_message_groups omg
  ON omg.organization_id = tm.organization_id
  AND omg.name = tm.channel
  AND omg.is_direct = FALSE
WHERE tm.organization_id IS NOT NULL
  -- Eviter les doublons si la migration est rejouée
  AND NOT EXISTS (
    SELECT 1 FROM org_messages om
    WHERE om.organization_id = tm.organization_id
      AND om.group_id = omg.id
      AND om.sender_id = tm.user_id
      AND om.created_at = tm.created_at
      AND om.content = tm.content
  );

-- ── 3. Rendre team_messages en lecture seule ──────────────────────────────────
-- On supprime les policies d'écriture, on conserve uniquement la lecture
-- pour que le chef puisse encore voir l'historique via l'ancienne interface.
DROP POLICY IF EXISTS "tmsg_own" ON team_messages;

-- Lecture pour le chef (user_id = auth.uid())
DROP POLICY IF EXISTS "tmsg_read_chef" ON team_messages;
CREATE POLICY "tmsg_read_chef"
  ON team_messages FOR SELECT
  USING (user_id = auth.uid());
