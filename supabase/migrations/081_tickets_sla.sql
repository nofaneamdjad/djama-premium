-- ══════════════════════════════════════════════════════════════════
-- Migration 081 : Tickets support — SLA + catégorie
--
-- PROBLÈME :
--   Les tickets support n'ont pas de date de résolution ni de
--   catégorie. Il est impossible de calculer les SLA réels ni
--   de filtrer/rapporter par type de problème.
--
-- SOLUTION :
--   1. resolved_at (timestamptz)  : horodatage de résolution
--   2. category   (text)          : bug / question / facturation
--                                   accès / autre
--
-- AUCUNE DONNÉE SUPPRIMÉE — colonnes nullables, ajout uniquement.
-- IDEMPOTENT : IF NOT EXISTS partout
-- ORDRE : après 080_crm_tasks_assignation.sql
-- ══════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Colonnes ───────────────────────────────────────────────────
ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS category text DEFAULT NULL
    CHECK (category IS NULL OR category IN ('bug','question','facturation','accès','autre'));

-- ── 2. Index ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_support_tickets_resolved
  ON support_tickets(resolved_at)
  WHERE resolved_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_support_tickets_category
  ON support_tickets(category)
  WHERE category IS NOT NULL;

COMMIT;
