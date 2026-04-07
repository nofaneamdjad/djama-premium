-- ═══════════════════════════════════════════════════════════════
-- DJAMA — Migration 013 : Table user_access (accès par email)
-- ═══════════════════════════════════════════════════════════════
--
-- Table unique pour tous les accès utilisateurs.
-- L'email est l'identifiant principal — indépendant de Supabase Auth.
-- Alimentée par :
--   · Paiement Stripe/PayPal → source = 'stripe' / 'paypal'
--   · Activation admin manuelle → source = 'manual'
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_access (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email            text        UNIQUE NOT NULL,
  name             text        NOT NULL DEFAULT '',
  espace_premium   boolean     NOT NULL DEFAULT false,
  coaching_ia      boolean     NOT NULL DEFAULT false,
  soutien_scolaire boolean     NOT NULL DEFAULT false,
  outils_saas      boolean     NOT NULL DEFAULT false,
  source           text        NOT NULL DEFAULT 'manual',
  -- source : 'manual' | 'stripe' | 'paypal' | 'migrated'
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Index de lookup rapide par email
CREATE INDEX IF NOT EXISTS user_access_email_idx ON user_access (email);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE user_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select user_access"  ON user_access FOR SELECT  USING (true);
CREATE POLICY "insert user_access"  ON user_access FOR INSERT  WITH CHECK (true);
CREATE POLICY "update user_access"  ON user_access FOR UPDATE  USING (true) WITH CHECK (true);
CREATE POLICY "delete user_access"  ON user_access FOR DELETE  USING (true);

-- ── Migration optionnelle depuis access_rights ──────────────
-- (À décommenter si vous voulez récupérer les données existantes)
--
-- INSERT INTO user_access (email, name, coaching_ia, source)
-- SELECT c.email, ar.client_name, ar.coaching_ia, 'migrated'
-- FROM access_rights ar
-- JOIN clients c ON ar.client_id = c.id
-- WHERE c.email IS NOT NULL
-- ON CONFLICT (email) DO NOTHING;
