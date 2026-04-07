-- ═══════════════════════════════════════════════════════════════
-- DJAMA — Migration 014 : Code d'accès dans user_access
-- ═══════════════════════════════════════════════════════════════
--
-- Ajoute la colonne access_code à la table user_access.
-- Ce code est généré automatiquement lors de la création d'un accès
-- (paiement Stripe ou ajout manuel admin) et envoyé par email.
-- Format : DJAM-XXXXXX (6 caractères alphanumériques majuscules)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE user_access
  ADD COLUMN IF NOT EXISTS access_code text;

-- Index de lookup rapide par code d'accès
CREATE INDEX IF NOT EXISTS user_access_code_idx ON user_access (access_code);
