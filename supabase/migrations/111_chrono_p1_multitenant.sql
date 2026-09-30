-- ════════════════════════════════════════════════════════════════════════════
-- 111_chrono_p1_multitenant.sql
-- Chrono Pro — Phase 1 : Multi-tenant + RLS + started_at/ended_at + timer_sessions
--
-- RÈGLES :
--   • Idempotent (IF NOT EXISTS / IF EXISTS / OR REPLACE partout)
--   • Non-destructif : aucune donnée existante perdue
--   • organization_id nullable pendant le backfill
--   • RLS : user_id = auth.uid() OR organisation dont l'utilisateur est membre
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Supprimer les policies en doublon sur time_entries ────────────────────
-- La migration 018_new_tools.sql a créé "time_entries_own" (ALL).
-- La migration 20260701_rls_policies.sql a recréé user_select/insert/update/delete.
-- On supprime l'ancienne policy ALL pour ne garder qu'un seul jeu de policies.
DROP POLICY IF EXISTS "time_entries_own"   ON time_entries;
DROP POLICY IF EXISTS "cpro_own"           ON chrono_projects;
DROP POLICY IF EXISTS "cgoal_own"          ON chrono_goals;

-- ── 2. Ajouter organization_id aux tables Chrono (nullable) ─────────────────
ALTER TABLE time_entries
  ADD COLUMN IF NOT EXISTS organization_id uuid
    REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE chrono_projects
  ADD COLUMN IF NOT EXISTS organization_id uuid
    REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE chrono_goals
  ADD COLUMN IF NOT EXISTS organization_id uuid
    REFERENCES organizations(id) ON DELETE CASCADE;

-- ── 3. Backfill organization_id depuis organization_members ─────────────────
-- Pour chaque utilisateur, on prend l'organisation dont il est owner/admin/member
-- (priorité : owner > admin > member, puis la plus ancienne si plusieurs).
-- Si un user n'appartient à aucune organisation, organization_id reste NULL.

UPDATE time_entries te
SET organization_id = (
  SELECT om.organization_id
  FROM organization_members om
  WHERE om.user_id = te.user_id
  ORDER BY
    CASE om.role
      WHEN 'owner'  THEN 1
      WHEN 'admin'  THEN 2
      ELSE 3
    END,
    om.created_at ASC
  LIMIT 1
)
WHERE te.organization_id IS NULL;

UPDATE chrono_projects cp
SET organization_id = (
  SELECT om.organization_id
  FROM organization_members om
  WHERE om.user_id = cp.user_id
  ORDER BY
    CASE om.role
      WHEN 'owner'  THEN 1
      WHEN 'admin'  THEN 2
      ELSE 3
    END,
    om.created_at ASC
  LIMIT 1
)
WHERE cp.organization_id IS NULL;

UPDATE chrono_goals cg
SET organization_id = (
  SELECT om.organization_id
  FROM organization_members om
  WHERE om.user_id = cg.user_id
  ORDER BY
    CASE om.role
      WHEN 'owner'  THEN 1
      WHEN 'admin'  THEN 2
      ELSE 3
    END,
    om.created_at ASC
  LIMIT 1
)
WHERE cg.organization_id IS NULL;

-- ── 4. Ajouter started_at et ended_at à time_entries ───────────────────────
-- Nullable : les entrées existantes gardent uniquement duration_minutes.
-- Les nouvelles entrées via l'API auront les deux timestamps.
ALTER TABLE time_entries
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS ended_at   timestamptz;

-- Backfill approximatif pour les entrées existantes :
-- started_at = created_at, ended_at = created_at + duration_minutes * interval '1 min'
UPDATE time_entries
SET
  started_at = created_at,
  ended_at   = created_at + (duration_minutes * interval '1 minute')
WHERE started_at IS NULL
  AND duration_minutes > 0;

-- ── 5. Table timer_sessions — état du timer en cours ─────────────────────────
-- Une seule ligne active par utilisateur à la fois.
-- Permet la persistance du timer après refresh/navigation.
CREATE TABLE IF NOT EXISTS timer_sessions (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id      uuid        REFERENCES organizations(id) ON DELETE CASCADE,
  started_at           timestamptz NOT NULL DEFAULT now(),
  paused_at            timestamptz,
  total_paused_seconds integer     NOT NULL DEFAULT 0,
  project              text        NOT NULL DEFAULT '',
  client_name          text        NOT NULL DEFAULT '',
  task_title           text        NOT NULL DEFAULT '',
  hourly_rate          numeric(10,2) NOT NULL DEFAULT 0 CHECK (hourly_rate >= 0 AND hourly_rate <= 100000),
  currency             text        NOT NULL DEFAULT 'EUR',
  is_billable          boolean     NOT NULL DEFAULT true,
  timer_mode           text        NOT NULL DEFAULT 'classic'
                         CHECK (timer_mode IN ('classic','pomodoro','countdown','focus')),
  pomodoro_cycle       integer     NOT NULL DEFAULT 0,
  countdown_target_s   integer,
  notes                text        NOT NULL DEFAULT '',
  category             text        NOT NULL DEFAULT 'autre',
  -- FK optionnelles vers les modules DJAMA (Phase 3)
  contact_id           uuid        REFERENCES contacts(id) ON DELETE SET NULL,
  project_id           uuid        REFERENCES projects(id) ON DELETE SET NULL,
  task_id              uuid        REFERENCES productivity_tasks(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  -- Contrainte : 1 session active par utilisateur
  CONSTRAINT uq_timer_session_user UNIQUE (user_id)
);

ALTER TABLE timer_sessions ENABLE ROW LEVEL SECURITY;

-- ── 6. Index de performance ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_te_org_user
  ON time_entries (organization_id, user_id)
  WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_te_org_date
  ON time_entries (organization_id, date DESC)
  WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_te_org_billable
  ON time_entries (organization_id, is_billable, is_billed)
  WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cpro_org_user
  ON chrono_projects (organization_id, user_id)
  WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cgoal_org_user
  ON chrono_goals (organization_id, user_id)
  WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ts_user
  ON timer_sessions (user_id);

-- ── 7. Contrainte taux horaire sur time_entries ──────────────────────────────
-- Empêche l'insertion d'un taux aberrant côté DB (défense en profondeur).
ALTER TABLE time_entries
  DROP CONSTRAINT IF EXISTS chk_te_hourly_rate;
ALTER TABLE time_entries
  ADD CONSTRAINT chk_te_hourly_rate
    CHECK (hourly_rate IS NULL OR (hourly_rate >= 0 AND hourly_rate <= 100000));

-- Contrainte durée max : 24h par session (1440 minutes)
ALTER TABLE time_entries
  DROP CONSTRAINT IF EXISTS chk_te_duration;
ALTER TABLE time_entries
  ADD CONSTRAINT chk_te_duration
    CHECK (duration_minutes >= 0 AND duration_minutes <= 1440);

-- ── 8. Rebuild RLS — time_entries ────────────────────────────────────────────
DROP POLICY IF EXISTS "user_select_time_entries" ON time_entries;
DROP POLICY IF EXISTS "user_insert_time_entries" ON time_entries;
DROP POLICY IF EXISTS "user_update_time_entries" ON time_entries;
DROP POLICY IF EXISTS "user_delete_time_entries" ON time_entries;

-- SELECT : propre entrée OU membre de l'organisation
CREATE POLICY "te_select" ON time_entries FOR SELECT
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

-- INSERT : user_id doit être auth.uid() + org validée
CREATE POLICY "te_insert" ON time_entries FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      organization_id IS NULL
      OR organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- UPDATE : propriétaire uniquement (l'admin peut lire mais pas modifier le temps d'autrui)
CREATE POLICY "te_update" ON time_entries FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE : propriétaire uniquement
CREATE POLICY "te_delete" ON time_entries FOR DELETE
  USING (user_id = auth.uid());

-- ── 9. Rebuild RLS — chrono_projects ─────────────────────────────────────────
DROP POLICY IF EXISTS "user_select_chrono_projects" ON chrono_projects;
DROP POLICY IF EXISTS "user_insert_chrono_projects" ON chrono_projects;
DROP POLICY IF EXISTS "user_update_chrono_projects" ON chrono_projects;
DROP POLICY IF EXISTS "user_delete_chrono_projects" ON chrono_projects;

CREATE POLICY "cpro_select" ON chrono_projects FOR SELECT
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

CREATE POLICY "cpro_insert" ON chrono_projects FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      organization_id IS NULL
      OR organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "cpro_update" ON chrono_projects FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "cpro_delete" ON chrono_projects FOR DELETE
  USING (user_id = auth.uid());

-- ── 10. Rebuild RLS — chrono_goals ───────────────────────────────────────────
DROP POLICY IF EXISTS "user_select_chrono_goals" ON chrono_goals;
DROP POLICY IF EXISTS "user_insert_chrono_goals" ON chrono_goals;
DROP POLICY IF EXISTS "user_update_chrono_goals" ON chrono_goals;
DROP POLICY IF EXISTS "user_delete_chrono_goals" ON chrono_goals;

CREATE POLICY "cgoal_select" ON chrono_goals FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "cgoal_insert" ON chrono_goals FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      organization_id IS NULL
      OR organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "cgoal_update" ON chrono_goals FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "cgoal_delete" ON chrono_goals FOR DELETE
  USING (user_id = auth.uid());

-- ── 11. RLS — timer_sessions ─────────────────────────────────────────────────
CREATE POLICY "ts_own" ON timer_sessions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── 12. Trigger updated_at sur timer_sessions ────────────────────────────────
DROP TRIGGER IF EXISTS ts_updated_at ON timer_sessions;
CREATE TRIGGER ts_updated_at
  BEFORE UPDATE ON timer_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_col();

-- ── 13. Colonne currency sur time_entries ────────────────────────────────────
ALTER TABLE time_entries
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'EUR';

-- ── 14. FK optionnelles vers CRM/Projets/Tâches (nullable, Phase 3) ──────────
-- Ajoutées maintenant pour que le schéma soit prêt ; non utilisées en Phase 1.
ALTER TABLE time_entries
  ADD COLUMN IF NOT EXISTS contact_id  uuid REFERENCES contacts(id)              ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS project_id  uuid REFERENCES projects(id)              ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS task_id     uuid REFERENCES productivity_tasks(id)    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_te_contact  ON time_entries (contact_id)  WHERE contact_id  IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_te_project  ON time_entries (project_id)  WHERE project_id  IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_te_task     ON time_entries (task_id)     WHERE task_id     IS NOT NULL;

-- ── 15. Colonne monthly_minutes + revenue_goal dans chrono_goals (Phase 6 prep)
ALTER TABLE chrono_goals
  ADD COLUMN IF NOT EXISTS monthly_minutes  integer DEFAULT 10800,  -- 180h
  ADD COLUMN IF NOT EXISTS revenue_goal     numeric(10,2) DEFAULT 0;

-- ── Vérification ─────────────────────────────────────────────────────────────
-- SELECT tablename, policyname, cmd FROM pg_policies
-- WHERE schemaname = 'public' AND tablename IN ('time_entries','chrono_projects','chrono_goals','timer_sessions')
-- ORDER BY tablename, cmd;
