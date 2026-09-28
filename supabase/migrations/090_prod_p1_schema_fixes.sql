-- ════════════════════════════════════════════════════════════════════════
-- 090_prod_p1_schema_fixes.sql
-- Phase 1 : colonnes manquantes du module Productivité
-- Idempotent — sûr pour les données existantes
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. dependencies sur productivity_tasks ───────────────────────────────
ALTER TABLE productivity_tasks
  ADD COLUMN IF NOT EXISTS dependencies uuid[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_prod_deps
  ON productivity_tasks USING GIN (dependencies);

-- ── 2. sort_order sur productivity_tasks (drag & drop Kanban) ────────────
ALTER TABLE productivity_tasks
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_prod_sort
  ON productivity_tasks (status, sort_order);

-- ── 3. position sur project_tasks (ordre IA Gantt) ───────────────────────
ALTER TABLE project_tasks
  ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_ptasks_position
  ON project_tasks (project_id, position);

-- ── 4. Index user_id manquants sur sous-tables projets ───────────────────
CREATE INDEX IF NOT EXISTS idx_ptasks_user
  ON project_tasks (user_id);

CREATE INDEX IF NOT EXISTS idx_pmilestones_user
  ON project_milestones (user_id);

CREATE INDEX IF NOT EXISTS idx_pteam_user
  ON project_team (user_id);

-- ── 5. Index task_comments limites ───────────────────────────────────────
-- idx_tcmt_task et idx_tcmt_user existent déjà dans productivite_schema.sql
-- Aucune action requise.

-- ── 6. Vérification contrainte RLS task_comments ─────────────────────────
-- La colonne user_id existe déjà (productivite_schema.sql).
-- Le bug était uniquement côté frontend (INSERT sans user_id).
-- Aucun changement SQL nécessaire.
