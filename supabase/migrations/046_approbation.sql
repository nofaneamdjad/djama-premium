-- ── Migration 046 : Workflow d'approbation ────────────────────────────────
-- Ajoute les colonnes nécessaires au suivi de l'approbation par dépense :
--   approval_comment : note laissée lors de l'approbation ou du rejet
--   approved_at      : horodatage de l'approbation

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS approval_comment text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS approved_at      timestamptz;
