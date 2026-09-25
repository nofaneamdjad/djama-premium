-- ══════════════════════════════════════════════════════════════════
-- Migration 078 : Identité client unifiée — contacts ↔ documents
--
-- PROBLÈME :
--   Les tables documents (factures/devis/avoirs) stockent les données
--   client sous forme de texte libre (client_nom, client_email, …).
--   Le CRM stocke les mêmes clients dans la table contacts.
--   Il n'y a aucun lien entre les deux : un contact CRM ne sait pas
--   combien de factures lui ont été envoyées.
--
-- SOLUTION :
--   1. Ajouter contact_id (nullable FK) sur documents → contacts
--   2. Backfill automatique par correspondance email + user_id
--   3. Index partiel pour les performances
--
-- AUCUNE DONNÉE SUPPRIMÉE — la colonne est nullable, les documents
-- existants sans correspondance email restent intacts.
-- IDEMPOTENT : IF NOT EXISTS sur la colonne et l'index
-- ORDRE : après 077_crm_permissions.sql
-- ══════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Ajouter contact_id sur documents ───────────────────────────
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS contact_id uuid
  REFERENCES contacts(id) ON DELETE SET NULL;

-- ── 2. Index partiel (performances pour jointures CRM → documents) ─
CREATE INDEX IF NOT EXISTS idx_documents_contact
  ON documents(contact_id)
  WHERE contact_id IS NOT NULL;

-- ── 3. Backfill : relier les documents existants à leurs contacts
--       via l'email (même user_id, email non vide, pas déjà rempli)
UPDATE documents d
  SET contact_id = c.id
  FROM contacts c
  WHERE d.user_id     = c.user_id
    AND d.client_email = c.email
    AND c.email        <> ''
    AND d.contact_id  IS NULL;

COMMIT;
