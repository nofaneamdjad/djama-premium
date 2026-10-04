-- ============================================================
-- Migration 118 — DJAMA Mind Maps : modèle nodes/edges/history
-- Additive. Les anciennes mind maps dans notes restent intactes.
-- ============================================================

-- ── Mind Maps (cartes) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS mind_maps (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           text        NOT NULL DEFAULT 'Nouvelle mind map',
  description     text,
  theme           text        NOT NULL DEFAULT 'djama',
  layout          text        NOT NULL DEFAULT 'mindmap',
  visibility      text        NOT NULL DEFAULT 'private',
  pinned          boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mind_maps_visibility_check CHECK (visibility IN ('private','team','shared')),
  CONSTRAINT mind_maps_layout_check     CHECK (layout IN ('mindmap','tree-h','tree-v','org','free'))
);

CREATE INDEX IF NOT EXISTS mind_maps_user_id_idx  ON mind_maps(user_id);
CREATE INDEX IF NOT EXISTS mind_maps_org_id_idx   ON mind_maps(organization_id);
CREATE INDEX IF NOT EXISTS mind_maps_updated_idx  ON mind_maps(updated_at DESC);

-- ── Nodes ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mind_map_nodes (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  mind_map_id     uuid        NOT NULL REFERENCES mind_maps(id) ON DELETE CASCADE,
  organization_id uuid,
  parent_id       uuid        REFERENCES mind_map_nodes(id) ON DELETE SET NULL,
  label           text        NOT NULL DEFAULT 'Idée',
  description     text,
  color           text        NOT NULL DEFAULT '#c9a55a',
  icon            text,
  shape           text        NOT NULL DEFAULT 'rounded',
  priority        text        NOT NULL DEFAULT 'normal',
  status          text        NOT NULL DEFAULT 'none',
  tags            text[]      DEFAULT '{}',
  due_date        date,
  assignee_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  position_x      float       NOT NULL DEFAULT 0,
  position_y      float       NOT NULL DEFAULT 0,
  width           float       NOT NULL DEFAULT 180,
  height          float       NOT NULL DEFAULT 44,
  is_root         boolean     NOT NULL DEFAULT false,
  sort_order      integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mind_map_nodes_priority_check CHECK (priority IN ('low','normal','high','urgent')),
  CONSTRAINT mind_map_nodes_status_check   CHECK (status   IN ('none','todo','in_progress','done'))
);

CREATE INDEX IF NOT EXISTS mind_map_nodes_map_idx    ON mind_map_nodes(mind_map_id);
CREATE INDEX IF NOT EXISTS mind_map_nodes_parent_idx ON mind_map_nodes(parent_id);

-- ── Edges ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mind_map_edges (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  mind_map_id uuid        NOT NULL REFERENCES mind_maps(id) ON DELETE CASCADE,
  source_id   uuid        NOT NULL REFERENCES mind_map_nodes(id) ON DELETE CASCADE,
  target_id   uuid        NOT NULL REFERENCES mind_map_nodes(id) ON DELETE CASCADE,
  label       text,
  style       text        NOT NULL DEFAULT 'bezier',
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_id, target_id)
);

CREATE INDEX IF NOT EXISTS mind_map_edges_map_idx    ON mind_map_edges(mind_map_id);
CREATE INDEX IF NOT EXISTS mind_map_edges_source_idx ON mind_map_edges(source_id);

-- ── History (AI undo) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mind_map_history (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  mind_map_id     uuid        NOT NULL REFERENCES mind_maps(id) ON DELETE CASCADE,
  organization_id uuid,
  actor_id        uuid        REFERENCES auth.users(id),
  action          text        NOT NULL,
  description     text,
  snapshot_nodes  jsonb,
  snapshot_edges  jsonb,
  ai_session_id   text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mind_map_history_map_idx ON mind_map_history(mind_map_id);
CREATE INDEX IF NOT EXISTS mind_map_history_ts_idx  ON mind_map_history(created_at DESC);

-- ── updated_at triggers ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_mind_maps_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS mind_maps_updated_at ON mind_maps;
CREATE TRIGGER mind_maps_updated_at BEFORE UPDATE ON mind_maps FOR EACH ROW EXECUTE FUNCTION update_mind_maps_updated_at();

CREATE OR REPLACE FUNCTION update_mind_map_nodes_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS mind_map_nodes_updated_at ON mind_map_nodes;
CREATE TRIGGER mind_map_nodes_updated_at BEFORE UPDATE ON mind_map_nodes FOR EACH ROW EXECUTE FUNCTION update_mind_map_nodes_updated_at();

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE mind_maps         ENABLE ROW LEVEL SECURITY;
ALTER TABLE mind_map_nodes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE mind_map_edges    ENABLE ROW LEVEL SECURITY;
ALTER TABLE mind_map_history  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION mindmap_is_org_member(p_org_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_org_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION mindmap_can_access(p_map_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM mind_maps
    WHERE id = p_map_id
      AND (
        user_id = auth.uid()
        OR visibility = 'shared'
        OR (visibility = 'team' AND organization_id IS NOT NULL AND mindmap_is_org_member(organization_id))
      )
  );
$$;

-- mind_maps
DROP POLICY IF EXISTS "mindmaps_select"  ON mind_maps;
CREATE POLICY "mindmaps_select"  ON mind_maps FOR SELECT USING (
  user_id = auth.uid()
  OR visibility = 'shared'
  OR (visibility = 'team' AND organization_id IS NOT NULL AND mindmap_is_org_member(organization_id))
);
DROP POLICY IF EXISTS "mindmaps_insert" ON mind_maps;
CREATE POLICY "mindmaps_insert" ON mind_maps FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "mindmaps_update" ON mind_maps;
CREATE POLICY "mindmaps_update" ON mind_maps FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "mindmaps_delete" ON mind_maps;
CREATE POLICY "mindmaps_delete" ON mind_maps FOR DELETE USING (user_id = auth.uid());

-- nodes (accès via la carte parente)
DROP POLICY IF EXISTS "mmn_select" ON mind_map_nodes;
CREATE POLICY "mmn_select" ON mind_map_nodes FOR SELECT USING (mindmap_can_access(mind_map_id));
DROP POLICY IF EXISTS "mmn_insert" ON mind_map_nodes;
CREATE POLICY "mmn_insert" ON mind_map_nodes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM mind_maps WHERE id = mind_map_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "mmn_update" ON mind_map_nodes;
CREATE POLICY "mmn_update" ON mind_map_nodes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM mind_maps WHERE id = mind_map_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "mmn_delete" ON mind_map_nodes;
CREATE POLICY "mmn_delete" ON mind_map_nodes FOR DELETE USING (
  EXISTS (SELECT 1 FROM mind_maps WHERE id = mind_map_id AND user_id = auth.uid())
);

-- edges
DROP POLICY IF EXISTS "mme_select" ON mind_map_edges;
CREATE POLICY "mme_select" ON mind_map_edges FOR SELECT USING (mindmap_can_access(mind_map_id));
DROP POLICY IF EXISTS "mme_insert" ON mind_map_edges;
CREATE POLICY "mme_insert" ON mind_map_edges FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM mind_maps WHERE id = mind_map_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "mme_delete" ON mind_map_edges;
CREATE POLICY "mme_delete" ON mind_map_edges FOR DELETE USING (
  EXISTS (SELECT 1 FROM mind_maps WHERE id = mind_map_id AND user_id = auth.uid())
);

-- history
DROP POLICY IF EXISTS "mmh_select" ON mind_map_history;
CREATE POLICY "mmh_select" ON mind_map_history FOR SELECT USING (mindmap_can_access(mind_map_id));
DROP POLICY IF EXISTS "mmh_insert" ON mind_map_history;
CREATE POLICY "mmh_insert" ON mind_map_history FOR INSERT WITH CHECK (actor_id = auth.uid());
