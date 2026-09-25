-- ══════════════════════════════════════════════════════════════════
-- Migration 079 : Soft delete contacts
--
-- PROBLÈME :
--   deleteContact() fait un DELETE physique irréversible.
--   Un contact supprimé par erreur est perdu définitivement,
--   et ses activités/opportunités/tâches/tickets (ON DELETE CASCADE
--   ou SET NULL) peuvent être perdus ou orphelins.
--
-- SOLUTION :
--   Ajout deleted_at (nullable) sur contacts.
--   La suppression positionne deleted_at = now().
--   Les requêtes normales filtrent WHERE deleted_at IS NULL.
--   Un admin peut restaurer ou supprimer définitivement.
--
-- AUCUNE DONNÉE SUPPRIMÉE — migration additive uniquement.
-- IDEMPOTENT : IF NOT EXISTS partout
-- ORDRE : après 078_crm_contact_documents.sql
-- ══════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Colonne deleted_at ─────────────────────────────────────────
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- ── 2. Index partiel — contacts actifs (requêtes courantes) ───────
CREATE INDEX IF NOT EXISTS idx_contacts_active
  ON contacts(user_id, updated_at DESC)
  WHERE deleted_at IS NULL;

-- ── 3. Index partiel — contacts supprimés (corbeille) ────────────
CREATE INDEX IF NOT EXISTS idx_contacts_deleted
  ON contacts(user_id, deleted_at DESC)
  WHERE deleted_at IS NOT NULL;

COMMIT;
