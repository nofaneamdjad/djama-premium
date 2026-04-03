-- ──────────────────────────────────────────────────────────────────────────
-- Migration CORRECTRICE — ajoute toutes les colonnes manquantes à documents
-- À exécuter dans Supabase Dashboard → SQL Editor
-- Idempotente : sans danger si déjà exécutée partiellement
-- ──────────────────────────────────────────────────────────────────────────

-- 1. Colonnes logo + couleur (ajoutées dans add_logo_couleur_to_documents.sql)
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS emetteur_logo  text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS couleur        text NOT NULL DEFAULT '#c9a55a';

-- 2. Colonnes RIB / coordonnées bancaires (nouvelles)
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS rib_titulaire  text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS rib_iban       text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS rib_bic        text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS rib_banque     text NOT NULL DEFAULT '';

-- 3. Recharger le cache schema PostgREST
--    (corrige l'erreur "Could not find column X in the schema cache")
NOTIFY pgrst, 'reload schema';

-- Vérification : liste des colonnes après migration
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'documents'
ORDER BY ordinal_position;
