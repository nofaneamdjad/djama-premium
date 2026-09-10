-- ══════════════════════════════════════════════════════════════════
-- Migration 052 : Fermer les écritures dangereuses
--
-- PROBLÈMES CORRIGÉS :
--   1. user_access : INSERT WITH CHECK(true) permet à n'importe quel
--      utilisateur authentifié de s'insérer avec outils_saas=true
--   2. user_access : UPDATE sur sa propre ligne permet de modifier
--      ses droits (ex: SET outils_saas=true)
--   3. budget_alert_log : INSERT/UPDATE permet de manipuler le
--      système anti-doublon des alertes
--
-- SOLUTION :
--   - Fermer INSERT et UPDATE sur user_access aux utilisateurs réguliers
--     (les webhooks utilisent service_role qui bypass RLS)
--   - Fermer INSERT/UPDATE/DELETE sur budget_alert_log
--     (le cron backend utilise service_role)
-- ══════════════════════════════════════════════════════════════════

-- ── 1. user_access : fermer INSERT et UPDATE ──────────────────────
ALTER TABLE user_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert user_access" ON user_access;
DROP POLICY IF EXISTS "update user_access" ON user_access;

-- SELECT reste autorisé (chaque utilisateur lit sa propre ligne)
-- INSERT : supprimé → seul service_role peut créer des entrées (webhooks)
-- UPDATE : supprimé → seul service_role peut mettre à jour les droits
-- DELETE : déjà fermé (aucune policy = refusé pour auth role)

-- ── 2. budget_alert_log : lecture seule pour les utilisateurs ─────
ALTER TABLE budget_alert_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "budget_alert_log_user" ON budget_alert_log;

-- Recréer en lecture seule
CREATE POLICY "budget_alert_log_select_own"
  ON budget_alert_log FOR SELECT
  USING (user_id = auth.uid());

-- INSERT / UPDATE / DELETE : service_role uniquement (cron job)

-- ── 3. stripe_webhook_events : confirmer que c'est bien fermé ─────
-- Déjà correct : aucune policy publique (migration 039)
-- Le service_role bypass RLS pour l'idempotence des webhooks Stripe.
