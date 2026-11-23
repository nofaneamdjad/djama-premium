-- ──────────────────────────────────────────────────────────────────────────
-- Migration : ajout logo + couleur sur la table documents
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ──────────────────────────────────────────────────────────────────────────

-- Ajout des colonnes si elles n'existent pas déjà
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS emetteur_logo text        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS couleur       text        NOT NULL DEFAULT '#c9a55a';

-- Recharger le schema cache PostgREST (utile si erreur "column not found")
NOTIFY pgrst, 'reload schema';
