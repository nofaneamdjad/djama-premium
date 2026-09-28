-- ════════════════════════════════════════════════════════════════════════
-- 091_prod_p3_multitenant.sql
-- Phase 3 : Multi-tenant pour les modules Productivité & Projets
-- Idempotent — données existantes inchangées (organization_id nullable)
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. productivity_tasks — organization_id + assigned_to ────────────────
ALTER TABLE productivity_tasks
  ADD COLUMN IF NOT EXISTS organization_id uuid
    REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE productivity_tasks
  ADD COLUMN IF NOT EXISTS assigned_to uuid
    REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_prod_org
  ON productivity_tasks (organization_id)
  WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_prod_assigned
  ON productivity_tasks (assigned_to)
  WHERE assigned_to IS NOT NULL;

-- Mise à jour RLS : personnel OU membre de l'organisation
DROP POLICY IF EXISTS "prod_own"       ON productivity_tasks;
DROP POLICY IF EXISTS "prod_org_read"  ON productivity_tasks;
DROP POLICY IF EXISTS "prod_org_write" ON productivity_tasks;

-- SELECT : propres tâches OU tâches de l'organisation
CREATE POLICY "prod_select" ON productivity_tasks FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      organization_id IS NOT NULL
      AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- INSERT : user_id doit être auth.uid()
CREATE POLICY "prod_insert" ON productivity_tasks FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      organization_id IS NULL
      OR organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin', 'member')
      )
    )
  );

-- UPDATE : propriétaire OU admin/owner de l'org
CREATE POLICY "prod_update" ON productivity_tasks FOR UPDATE
  USING (
    user_id = auth.uid()
    OR (
      organization_id IS NOT NULL
      AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin')
      )
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (
      organization_id IS NOT NULL
      AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin')
      )
    )
  );

-- DELETE : propriétaire uniquement OU admin/owner de l'org
CREATE POLICY "prod_delete" ON productivity_tasks FOR DELETE
  USING (
    user_id = auth.uid()
    OR (
      organization_id IS NOT NULL
      AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin')
      )
    )
  );

-- ── 2. task_comments — lecture org ───────────────────────────────────────
-- Les commentaires restent filtrés par la tâche (FK) donc la RLS suffit
-- Aucun changement nécessaire sur task_comments RLS

-- ── 3. projects — organization_id ────────────────────────────────────────
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS organization_id uuid
    REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_projects_org
  ON projects (organization_id)
  WHERE organization_id IS NOT NULL;

DROP POLICY IF EXISTS "projects_own" ON projects;

CREATE POLICY "projects_select" ON projects FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      organization_id IS NOT NULL
      AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "projects_insert" ON projects FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      organization_id IS NULL
      OR organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin', 'member')
      )
    )
  );

CREATE POLICY "projects_update" ON projects FOR UPDATE
  USING (auth.uid() = user_id OR organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('owner','admin')
  ));

CREATE POLICY "projects_delete" ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- ── 4. project_team — member_user_id FK réel ─────────────────────────────
ALTER TABLE project_team
  ADD COLUMN IF NOT EXISTS member_user_id uuid
    REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pteam_member_uid
  ON project_team (member_user_id)
  WHERE member_user_id IS NOT NULL;

-- ── 5. project_tasks — RLS org ───────────────────────────────────────────
-- project_tasks est sécurisé via project_id (le projet est déjà sécurisé)
-- On ajoute organization_id hérité pour les requêtes directes
ALTER TABLE project_tasks
  ADD COLUMN IF NOT EXISTS organization_id uuid
    REFERENCES organizations(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "users_own_project_tasks" ON project_tasks;
CREATE POLICY "project_tasks_access" ON project_tasks FOR ALL
  USING (
    auth.uid() = user_id
    OR (
      organization_id IS NOT NULL
      AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR (
      organization_id IS NOT NULL
      AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
          AND role IN ('owner','admin','member')
      )
    )
  );

-- project_milestones idem
ALTER TABLE project_milestones
  ADD COLUMN IF NOT EXISTS organization_id uuid
    REFERENCES organizations(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "users_own_project_milestones" ON project_milestones;
CREATE POLICY "project_milestones_access" ON project_milestones FOR ALL
  USING (
    auth.uid() = user_id
    OR (
      organization_id IS NOT NULL
      AND organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR (
      organization_id IS NOT NULL
      AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND role IN ('owner','admin','member')
      )
    )
  );

-- ── 6. Fonction utilitaire : org courante d'un utilisateur ───────────────
CREATE OR REPLACE FUNCTION get_user_primary_org(p_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT organization_id
  FROM organization_members
  WHERE user_id = p_user_id
  ORDER BY joined_at ASC
  LIMIT 1;
$$;
