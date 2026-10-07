-- ════════════════════════════════════════════════════════════════════
-- Migration 134 — RDV Phase 12 : assignation aux membres de l'équipe
-- Idempotente — aucune modification destructive
-- ════════════════════════════════════════════════════════════════════

-- Ajoute la colonne d'assignation (référence team_members, pas auth.users)
ALTER TABLE rdv_appointments
  ADD COLUMN IF NOT EXISTS assigned_staff_id uuid
    REFERENCES team_members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_rdv_appts_staff
  ON rdv_appointments(assigned_staff_id)
  WHERE assigned_staff_id IS NOT NULL;
