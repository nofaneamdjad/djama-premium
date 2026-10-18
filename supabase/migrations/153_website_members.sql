-- ─────────────────────────────────────────────────────────────────────────────
-- 153 — website_members : rôles et permissions multi-utilisateurs par site
-- ─────────────────────────────────────────────────────────────────────────────

-- Table des membres
CREATE TABLE IF NOT EXISTS website_members (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id  uuid        NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text        NOT NULL DEFAULT 'viewer'
              CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by  uuid        REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(website_id, user_id)
);

-- Index pour accès rapide par site et par utilisateur
CREATE INDEX IF NOT EXISTS idx_website_members_website ON website_members(website_id);
CREATE INDEX IF NOT EXISTS idx_website_members_user    ON website_members(user_id);

-- RLS
ALTER TABLE website_members ENABLE ROW LEVEL SECURITY;

-- Lecture : seulement les membres du même site (ou le propriétaire du site)
DROP POLICY IF EXISTS "wm_select" ON website_members;
CREATE POLICY "wm_select" ON website_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM websites w
      WHERE w.id = website_members.website_id
        AND w.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM website_members wm2
      WHERE wm2.website_id = website_members.website_id
        AND wm2.user_id = auth.uid()
    )
  );

-- Insertion : uniquement le propriétaire du site ou un admin membre
DROP POLICY IF EXISTS "wm_insert" ON website_members;
CREATE POLICY "wm_insert" ON website_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites w
      WHERE w.id = website_members.website_id
        AND w.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM website_members wm2
      WHERE wm2.website_id = website_members.website_id
        AND wm2.user_id = auth.uid()
        AND wm2.role = 'admin'
    )
  );

-- Mise à jour : uniquement le propriétaire
DROP POLICY IF EXISTS "wm_update" ON website_members;
CREATE POLICY "wm_update" ON website_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM websites w
      WHERE w.id = website_members.website_id
        AND w.user_id = auth.uid()
    )
  );

-- Suppression : propriétaire, admin, ou l'utilisateur lui-même
DROP POLICY IF EXISTS "wm_delete" ON website_members;
CREATE POLICY "wm_delete" ON website_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM websites w
      WHERE w.id = website_members.website_id
        AND w.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM website_members wm2
      WHERE wm2.website_id = website_members.website_id
        AND wm2.user_id = auth.uid()
        AND wm2.role = 'admin'
    )
  );

-- ── Étendre les policies de websites pour inclure les membres ────────────────

-- Lecture du site par ses membres
DROP POLICY IF EXISTS "ws_select_members" ON websites;
CREATE POLICY "ws_select_members" ON websites FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM website_members wm
      WHERE wm.website_id = websites.id
        AND wm.user_id = auth.uid()
    )
  );

-- Mise à jour du site par les membres admin/éditeur
DROP POLICY IF EXISTS "ws_update_members" ON websites;
CREATE POLICY "ws_update_members" ON websites FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM website_members wm
      WHERE wm.website_id = websites.id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('admin', 'editor')
    )
  );

-- Lecture des pages par les membres
DROP POLICY IF EXISTS "wp_select_members" ON website_pages;
CREATE POLICY "wp_select_members" ON website_pages FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM website_members wm
      WHERE wm.website_id = website_pages.website_id
        AND wm.user_id = auth.uid()
    )
  );

-- Lecture des sections par les membres
DROP POLICY IF EXISTS "wsec_select_members" ON website_sections;
CREATE POLICY "wsec_select_members" ON website_sections FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM website_members wm
      WHERE wm.website_id = website_sections.website_id
        AND wm.user_id = auth.uid()
    )
  );
