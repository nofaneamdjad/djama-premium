-- ══════════════════════════════════════════════════════════════════
-- Migration 080 : Tâches CRM — assignation + rappels
--
-- PROBLÈME :
--   Les tâches CRM n'ont pas de notion d'assignation à un membre
--   de l'organisation ni de date de rappel. Il est impossible de
--   déléguer une tâche ou de programmer une notification.
--
-- SOLUTION :
--   1. assigned_to (uuid FK → auth.users) : membre assigné
--   2. reminder_at (timestamptz)           : date/heure du rappel
--
-- AUCUNE DONNÉE SUPPRIMÉE — colonnes nullables, ajout uniquement.
-- IDEMPOTENT : IF NOT EXISTS partout
-- ORDRE : après 079_contacts_soft_delete.sql
-- ══════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Colonnes ───────────────────────────────────────────────────
ALTER TABLE crm_tasks
  ADD COLUMN IF NOT EXISTS assigned_to uuid
    REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reminder_at timestamptz DEFAULT NULL;

-- ── 2. Index ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_crm_tasks_assigned
  ON crm_tasks(assigned_to)
  WHERE assigned_to IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crm_tasks_reminder
  ON crm_tasks(reminder_at)
  WHERE reminder_at IS NOT NULL;

COMMIT;
