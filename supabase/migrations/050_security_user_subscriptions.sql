-- ══════════════════════════════════════════════════════════════════
-- Migration 050 : Table sécurisée des abonnements
--
-- PROBLÈME CORRIGÉ :
--   user_metadata.subscription_active peut être forgé par n'importe
--   quel utilisateur via supabase.auth.updateUser({ data: { subscription_active: true } })
--
-- SOLUTION :
--   Table user_subscriptions écrite UNIQUEMENT par le service_role
--   (webhooks Stripe/PayPal via syncSubscriptionAccess).
--   Les utilisateurs peuvent lire leur propre ligne mais ne peuvent
--   jamais écrire, modifier ou supprimer.
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_subscriptions (
  user_id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active          boolean      NOT NULL DEFAULT false,
  plan_name          text,
  provider           text,        -- 'stripe' | 'paypal' | 'admin'
  stripe_customer_id text,
  stripe_sub_id      text,
  paypal_sub_id      text,
  current_period_end timestamptz,
  updated_at         timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Lecture : chaque utilisateur ne voit QUE sa propre ligne
CREATE POLICY "user_subscriptions_select_own"
  ON user_subscriptions FOR SELECT
  USING (user_id = auth.uid());

-- Pas de policy INSERT / UPDATE / DELETE pour les utilisateurs réguliers.
-- Seul le service_role (backend, webhooks) peut écrire dans cette table.

CREATE INDEX IF NOT EXISTS user_subscriptions_active_idx
  ON user_subscriptions (user_id, is_active);

-- ─────────────────────────────────────────────────────────────────
-- Migrer les abonnés existants
-- Source de vérité : user_access.outils_saas / espace_premium
-- On joint sur auth.users via email pour obtenir user_id
-- ─────────────────────────────────────────────────────────────────
INSERT INTO user_subscriptions (user_id, is_active, provider, updated_at)
SELECT
  u.id,
  true,
  COALESCE(ua.source, 'legacy'),
  now()
FROM auth.users u
JOIN user_access ua ON lower(ua.email) = lower(u.email)
WHERE ua.outils_saas = true OR ua.espace_premium = true
ON CONFLICT (user_id) DO UPDATE
  SET is_active  = true,
      updated_at = now();

-- Désactiver les abonnements expirés (expires_at dans le passé)
UPDATE user_subscriptions us
SET is_active = false, updated_at = now()
FROM auth.users u
JOIN user_access ua ON lower(ua.email) = lower(u.email)
WHERE us.user_id = u.id
  AND ua.expires_at IS NOT NULL
  AND ua.expires_at < now();
