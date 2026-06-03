-- ══════════════════════════════════════════════════════════════════
-- Migration 027 : Correction policy RLS user_access
-- ══════════════════════════════════════════════════════════════════
--
-- Problème : Migration 025 a fait DROP de "select user_access" (USING true)
-- puis a tenté de créer USING (auth.uid() = user_id) mais user_access
-- n'a PAS de colonne user_id → la création a ÉCHOUÉ silencieusement.
-- Résultat : aucune policy SELECT → la table retourne 0 lignes pour
-- tous les clients browser (anon key), y compris le panel admin.
--
-- Solution :
--   • SELECT : USING (auth.email() = email)
--     → chaque utilisateur ne voit QUE sa propre ligne
--     → l'admin utilise service_role (bypass RLS total) via /api/admin/*
--   • INSERT : ouvert (webhooks Stripe/PayPal créent les lignes)
--   • UPDATE : seulement sa propre ligne (par email)
--   • DELETE : service_role uniquement (aucune policy = refusé pour anon/auth)
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE user_access ENABLE ROW LEVEL SECURITY;

-- Nettoyer toutes les anciennes policies (idempotent)
DROP POLICY IF EXISTS "select user_access"  ON user_access;
DROP POLICY IF EXISTS "insert user_access"  ON user_access;
DROP POLICY IF EXISTS "update user_access"  ON user_access;
DROP POLICY IF EXISTS "delete user_access"  ON user_access;

-- SELECT : chaque utilisateur voit sa propre ligne (par email)
-- Admin lit via service_role (bypass RLS)
CREATE POLICY "select user_access"
  ON user_access FOR SELECT
  USING (auth.email() = email);

-- INSERT : ouvert pour les webhooks Stripe/PayPal (service_role + anon)
CREATE POLICY "insert user_access"
  ON user_access FOR INSERT
  WITH CHECK (true);

-- UPDATE : chaque utilisateur met à jour sa propre ligne
-- Les routes admin utilisent service_role (bypass RLS)
CREATE POLICY "update user_access"
  ON user_access FOR UPDATE
  USING  (auth.email() = email)
  WITH CHECK (auth.email() = email);

-- DELETE : aucune policy → seul service_role peut supprimer
-- (les routes /api/admin/user-access utilisent service_role)
