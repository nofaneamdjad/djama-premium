-- ============================================================
-- 116_checklists.sql — Module Checklists v2 (multi-tenant, IA)
-- RÈGLE : migration 100% additive — aucune table existante modifiée
-- Les anciennes checklists dans `notes` restent accessibles en RO
-- ============================================================

-- ── 1. Table principale : checklists ──────────────────────────
CREATE TABLE IF NOT EXISTS checklists (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  owner_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title          text NOT NULL DEFAULT 'Sans titre',
  description    text,
  color          text NOT NULL DEFAULT '#6366f1',
  icon           text,
  visibility     text NOT NULL DEFAULT 'private'
                 CHECK (visibility IN ('private','team','shared')),
  status         text NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','archived','completed')),
  template_id    text,            -- référence à un template prédéfini
  sort_order     integer NOT NULL DEFAULT 0,
  pinned         boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ── 2. Sections (groupes optionnels dans une checklist) ────────
CREATE TABLE IF NOT EXISTS checklist_sections (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id   uuid NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  title          text NOT NULL DEFAULT 'Section',
  collapsed      boolean NOT NULL DEFAULT false,
  sort_order     integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ── 3. Items (tâches) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS checklist_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id   uuid NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  section_id     uuid REFERENCES checklist_sections(id) ON DELETE SET NULL,
  organization_id uuid NOT NULL,
  text           text NOT NULL DEFAULT '',
  description    text,
  done           boolean NOT NULL DEFAULT false,
  starred        boolean NOT NULL DEFAULT false,
  priority       text NOT NULL DEFAULT 'normal'
                 CHECK (priority IN ('low','normal','high','urgent')),
  due_date       date,
  assignee_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tags           text[] NOT NULL DEFAULT '{}',
  subtasks       jsonb NOT NULL DEFAULT '[]',
  sort_order     integer NOT NULL DEFAULT 0,
  done_at        timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ── 4. Collaborateurs ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS checklist_collaborators (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id   uuid NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  role           text NOT NULL DEFAULT 'viewer'
                 CHECK (role IN ('owner','editor','viewer')),
  invited_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (checklist_id, user_id)
);

-- ── 5. Historique (pour AI Undo) ──────────────────────────────
CREATE TABLE IF NOT EXISTS checklist_history (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id   uuid NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  actor_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action         text NOT NULL,              -- 'ai_batch','item_add','item_delete','item_update', etc.
  snapshot_before jsonb,                     -- état avant (pour undo)
  snapshot_after  jsonb,                     -- état après
  ai_session_id  text,                       -- regrouper les ops d'une même session IA
  description    text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ── 6. Index ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS checklists_org_owner  ON checklists(organization_id, owner_id);
CREATE INDEX IF NOT EXISTS checklists_org_vis    ON checklists(organization_id, visibility);
CREATE INDEX IF NOT EXISTS cl_items_checklist    ON checklist_items(checklist_id, sort_order);
CREATE INDEX IF NOT EXISTS cl_items_org          ON checklist_items(organization_id);
CREATE INDEX IF NOT EXISTS cl_sections_checklist ON checklist_sections(checklist_id, sort_order);
CREATE INDEX IF NOT EXISTS cl_collab_checklist   ON checklist_collaborators(checklist_id);
CREATE INDEX IF NOT EXISTS cl_collab_user        ON checklist_collaborators(user_id);
CREATE INDEX IF NOT EXISTS cl_history_checklist  ON checklist_history(checklist_id, created_at DESC);

-- ── 7. Trigger updated_at ─────────────────────────────────────
CREATE OR REPLACE FUNCTION update_checklist_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS checklists_updated_at ON checklists;
CREATE TRIGGER checklists_updated_at
  BEFORE UPDATE ON checklists
  FOR EACH ROW EXECUTE FUNCTION update_checklist_timestamp();

DROP TRIGGER IF EXISTS checklist_items_updated_at ON checklist_items;
CREATE TRIGGER checklist_items_updated_at
  BEFORE UPDATE ON checklist_items
  FOR EACH ROW EXECUTE FUNCTION update_checklist_timestamp();

-- ── 8. RLS ────────────────────────────────────────────────────
ALTER TABLE checklists              ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_sections      ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_history       ENABLE ROW LEVEL SECURITY;

-- Helper : l'user a-t-il accès à une checklist (owner ou collab) ?
-- Utilisé UNIQUEMENT par les policies — jamais côté client
CREATE OR REPLACE FUNCTION checklist_user_role(p_checklist_id uuid, p_user_id uuid)
RETURNS text LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(
    (SELECT role FROM checklist_collaborators
     WHERE checklist_id = p_checklist_id AND user_id = p_user_id
     LIMIT 1),
    CASE WHEN EXISTS (
      SELECT 1 FROM checklists
      WHERE id = p_checklist_id AND owner_id = p_user_id
    ) THEN 'owner' ELSE NULL END
  );
$$;

-- ── checklists ────
DROP POLICY IF EXISTS checklists_select ON checklists;
CREATE POLICY checklists_select ON checklists FOR SELECT
  USING (
    owner_id = auth.uid()
    OR checklist_user_role(id, auth.uid()) IS NOT NULL
    OR (visibility = 'team' AND organization_id IN (
      SELECT organization_id FROM org_members WHERE user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS checklists_insert ON checklists;
CREATE POLICY checklists_insert ON checklists FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM org_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS checklists_update ON checklists;
CREATE POLICY checklists_update ON checklists FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR checklist_user_role(id, auth.uid()) IN ('owner','editor')
  );

DROP POLICY IF EXISTS checklists_delete ON checklists;
CREATE POLICY checklists_delete ON checklists FOR DELETE
  USING (owner_id = auth.uid());

-- ── checklist_sections ────
DROP POLICY IF EXISTS cl_sections_select ON checklist_sections;
CREATE POLICY cl_sections_select ON checklist_sections FOR SELECT
  USING (checklist_user_role(checklist_id, auth.uid()) IS NOT NULL
    OR EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_id AND (
      c.owner_id = auth.uid()
      OR (c.visibility = 'team' AND c.organization_id IN (
        SELECT organization_id FROM org_members WHERE user_id = auth.uid()
      ))
    ))
  );

DROP POLICY IF EXISTS cl_sections_write ON checklist_sections;
CREATE POLICY cl_sections_write ON checklist_sections FOR ALL
  USING (checklist_user_role(checklist_id, auth.uid()) IN ('owner','editor')
    OR EXISTS (SELECT 1 FROM checklists WHERE id = checklist_id AND owner_id = auth.uid())
  );

-- ── checklist_items ────
DROP POLICY IF EXISTS cl_items_select ON checklist_items;
CREATE POLICY cl_items_select ON checklist_items FOR SELECT
  USING (checklist_user_role(checklist_id, auth.uid()) IS NOT NULL
    OR EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_id AND (
      c.owner_id = auth.uid()
      OR (c.visibility = 'team' AND c.organization_id IN (
        SELECT organization_id FROM org_members WHERE user_id = auth.uid()
      ))
    ))
  );

DROP POLICY IF EXISTS cl_items_write ON checklist_items;
CREATE POLICY cl_items_write ON checklist_items FOR ALL
  USING (checklist_user_role(checklist_id, auth.uid()) IN ('owner','editor')
    OR EXISTS (SELECT 1 FROM checklists WHERE id = checklist_id AND owner_id = auth.uid())
  );

-- ── checklist_collaborators ────
DROP POLICY IF EXISTS cl_collab_select ON checklist_collaborators;
CREATE POLICY cl_collab_select ON checklist_collaborators FOR SELECT
  USING (user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM checklists WHERE id = checklist_id AND owner_id = auth.uid())
  );

DROP POLICY IF EXISTS cl_collab_write ON checklist_collaborators;
CREATE POLICY cl_collab_write ON checklist_collaborators FOR ALL
  USING (EXISTS (SELECT 1 FROM checklists WHERE id = checklist_id AND owner_id = auth.uid()));

-- ── checklist_history ────
DROP POLICY IF EXISTS cl_history_select ON checklist_history;
CREATE POLICY cl_history_select ON checklist_history FOR SELECT
  USING (checklist_user_role(checklist_id, auth.uid()) IS NOT NULL
    OR EXISTS (SELECT 1 FROM checklists WHERE id = checklist_id AND owner_id = auth.uid())
  );

DROP POLICY IF EXISTS cl_history_insert ON checklist_history;
CREATE POLICY cl_history_insert ON checklist_history FOR INSERT
  WITH CHECK (actor_id = auth.uid());
