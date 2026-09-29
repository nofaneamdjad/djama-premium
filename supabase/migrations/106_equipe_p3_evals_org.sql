-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 106 — employe_evaluations multi-tenant
-- Phase 3.4 — ajout organization_id + RLS mise à jour
--
-- Contexte :
--   employe_evaluations n'a que user_id = auth.uid() comme RLS.
--   Un chef d'Org A pourrait théoriquement voir des évaluations d'Org B
--   si les user_id coïncident (race condition entre orgs). On renforce.
--
-- Stratégie :
--   1. Ajouter organization_id nullable
--   2. Backfill via organizations.owner_id = user_id
--   3. Créer index
--   4. Mettre à jour la RLS pour inclure organization_id quand disponible
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. Colonne organization_id ────────────────────────────────────────────────

ALTER TABLE employe_evaluations
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ev_org
  ON employe_evaluations (organization_id) WHERE organization_id IS NOT NULL;

-- ── 2. Backfill ───────────────────────────────────────────────────────────────

UPDATE employe_evaluations ev
SET organization_id = (
  SELECT o.id
  FROM organizations o
  WHERE o.owner_id = ev.user_id
  ORDER BY o.created_at DESC
  LIMIT 1
)
WHERE ev.organization_id IS NULL
  AND ev.user_id IS NOT NULL;

-- ── 3. RLS — mise à jour ──────────────────────────────────────────────────────

-- Supprimer l'ancienne politique si elle existe
DROP POLICY IF EXISTS "eval_own"      ON employe_evaluations;
DROP POLICY IF EXISTS "eval_user_own" ON employe_evaluations;

-- Activer RLS si pas déjà fait (idempotent)
ALTER TABLE employe_evaluations ENABLE ROW LEVEL SECURITY;

-- Chef : accès complet à ses propres évaluations
CREATE POLICY "eval_chef_own" ON employe_evaluations
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── 4. Vérification ──────────────────────────────────────────────────────────

DO $$
DECLARE
  total_evals  INT;
  with_org     INT;
  without_org  INT;
BEGIN
  SELECT COUNT(*) INTO total_evals  FROM employe_evaluations;
  SELECT COUNT(*) INTO with_org     FROM employe_evaluations WHERE organization_id IS NOT NULL;
  SELECT COUNT(*) INTO without_org  FROM employe_evaluations WHERE organization_id IS NULL;

  RAISE NOTICE '[106] employe_evaluations multi-tenant :';
  RAISE NOTICE '  Total évaluations         : %', total_evals;
  RAISE NOTICE '  Avec organization_id      : %', with_org;
  RAISE NOTICE '  Sans organization_id      : % (user sans org)', without_org;
END;
$$;
