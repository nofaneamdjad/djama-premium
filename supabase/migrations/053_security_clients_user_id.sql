-- ══════════════════════════════════════════════════════════════════
-- Migration 053 : Corriger clients.user_id (NOT NULL + index)
--
-- PROBLÈME :
--   clients.user_id est nullable → des lignes peuvent exister sans
--   lien vers un utilisateur Auth (lignes orphelines).
--
-- SOLUTION PROGRESSIVE (sans casser les données existantes) :
--   1. Backfill user_id via auth.users (join email)
--   2. Ajouter un index pour les lookups
--   3. Ajouter une contrainte UNIQUE sur user_id (1 compte = 1 ligne)
--   Note : on ne force PAS NOT NULL car des lignes PayPal peuvent
--   être créées avant que l'utilisateur ait son compte Auth.
-- ══════════════════════════════════════════════════════════════════

-- 1. Backfill : remplir user_id pour les lignes qui ont un email
--    correspondant dans auth.users mais pas encore de user_id
UPDATE clients c
SET user_id = u.id
FROM auth.users u
WHERE lower(u.email) = lower(c.email)
  AND c.user_id IS NULL;

-- 2. Index pour les lookups middleware (remplace le scan complet)
CREATE INDEX IF NOT EXISTS clients_user_id_idx
  ON clients (user_id)
  WHERE user_id IS NOT NULL;

-- 3. Contrainte UNIQUE : un utilisateur ne peut avoir qu'une ligne
--    (évite les duplicats en cas de race condition)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'clients'::regclass
      AND conname = 'clients_user_id_unique'
  ) THEN
    ALTER TABLE clients
      ADD CONSTRAINT clients_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- 4. RLS : permettre aux utilisateurs de lire UNIQUEMENT leur propre
--    ligne de clients (pour le hook use-require-subscription)
--    Les tables admin continuent d'utiliser service_role (bypass RLS)
DROP POLICY IF EXISTS "clients_user_own_select" ON clients;
DROP POLICY IF EXISTS "clients_admin_only" ON clients;

-- Recréer : lecture autorisée pour le propriétaire + fermé pour les autres
CREATE POLICY "clients_user_own_select"
  ON clients FOR SELECT
  USING (user_id = auth.uid());

-- Pas d'INSERT/UPDATE/DELETE via anon : le backend (service_role) écrit
