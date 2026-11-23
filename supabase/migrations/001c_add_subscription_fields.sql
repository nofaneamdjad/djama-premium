-- ──────────────────────────────────────────────────────────────
-- Migration : champs abonnement sur la table clients
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ──────────────────────────────────────────────────────────────

-- Ajouter les colonnes si elles n'existent pas déjà
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS abonnement            text         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS statut                text         DEFAULT 'inactif',
  ADD COLUMN IF NOT EXISTS paid                  boolean      DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_customer_id    text         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS subscribed_at         timestamptz  DEFAULT NULL;

-- Index pour les lookups fréquents
CREATE INDEX IF NOT EXISTS clients_paid_idx        ON clients(paid);
CREATE INDEX IF NOT EXISTS clients_statut_idx      ON clients(statut);
CREATE INDEX IF NOT EXISTS clients_stripe_cust_idx ON clients(stripe_customer_id);

-- RLS : un client ne voit que ses propres données
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_select_own" ON clients;
CREATE POLICY "clients_select_own"
  ON clients FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "clients_insert_own" ON clients;
CREATE POLICY "clients_insert_own"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "clients_update_own" ON clients;
CREATE POLICY "clients_update_own"
  ON clients FOR UPDATE
  USING (auth.uid() = user_id);
