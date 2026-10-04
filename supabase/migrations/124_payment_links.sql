-- ════════════════════════════════════════════════════════════════════════
-- 124_payment_links.sql
-- Liens de paiement — tables + RLS
-- Idempotent — non-destructif
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. payment_links ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payment_links (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug                   text        NOT NULL UNIQUE,

  -- Contenu
  title                  text        NOT NULL DEFAULT '',
  description            text        NOT NULL DEFAULT '',
  amount                 numeric(12,2),            -- NULL = montant libre
  currency               text        NOT NULL DEFAULT 'eur',

  -- Statut
  status                 text        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','paid','partial','expired','disabled','archived')),

  -- Liaisons optionnelles (jamais de duplication)
  document_id            uuid        REFERENCES documents(id)  ON DELETE SET NULL,
  contact_id             uuid        REFERENCES contacts(id)   ON DELETE SET NULL,
  project_id             uuid        REFERENCES projects(id)   ON DELETE SET NULL,

  -- Options
  is_free_amount         boolean     NOT NULL DEFAULT false,
  collect_name           boolean     NOT NULL DEFAULT true,
  collect_email          boolean     NOT NULL DEFAULT true,
  collect_phone          boolean     NOT NULL DEFAULT false,
  quantity_enabled       boolean     NOT NULL DEFAULT false,
  after_payment_message  text        NOT NULL DEFAULT '',

  -- Stripe
  stripe_payment_link_id text,
  stripe_payment_link_url text,
  stripe_price_id        text,

  -- Compteurs (mis à jour par le webhook)
  total_collected        numeric(12,2) NOT NULL DEFAULT 0,
  payment_count          integer     NOT NULL DEFAULT 0,

  -- Expiration
  expires_at             timestamptz,
  paid_at                timestamptz,

  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pl_user    ON payment_links(user_id);
CREATE INDEX IF NOT EXISTS idx_pl_slug    ON payment_links(slug);
CREATE INDEX IF NOT EXISTS idx_pl_status  ON payment_links(user_id, status);
CREATE INDEX IF NOT EXISTS idx_pl_doc     ON payment_links(document_id) WHERE document_id IS NOT NULL;

ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pl_own" ON payment_links;
CREATE POLICY "pl_own" ON payment_links
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Lecture publique pour /pay/[slug] (montant libre = pas de montant exposé)
DROP POLICY IF EXISTS "pl_public_read" ON payment_links;
CREATE POLICY "pl_public_read" ON payment_links
  FOR SELECT USING (
    status IN ('active','partial')
    AND (expires_at IS NULL OR expires_at > now())
  );

-- ── 2. payment_transactions ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payment_transactions (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_link_id           uuid        REFERENCES payment_links(id) ON DELETE SET NULL,
  user_id                   uuid        REFERENCES auth.users(id)    ON DELETE SET NULL,
  document_id               uuid        REFERENCES documents(id)     ON DELETE SET NULL,

  -- Idempotence Stripe
  stripe_payment_intent_id  text        UNIQUE,
  stripe_charge_id          text,
  stripe_refund_id          text,

  -- Montants (toujours validés côté Stripe/webhook)
  amount                    numeric(12,2) NOT NULL CHECK (amount >= 0),
  refunded_amount           numeric(12,2) NOT NULL DEFAULT 0,
  currency                  text        NOT NULL DEFAULT 'eur',

  -- Statut
  status                    text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','succeeded','failed','refunded','partially_refunded')),

  -- Info acheteur (pas de numéro de carte, jamais)
  customer_name             text,
  customer_email            text,

  metadata                  jsonb       NOT NULL DEFAULT '{}',

  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pt_link    ON payment_transactions(payment_link_id);
CREATE INDEX IF NOT EXISTS idx_pt_user    ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pt_doc     ON payment_transactions(document_id) WHERE document_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pt_pi      ON payment_transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_pt_status  ON payment_transactions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_pt_created ON payment_transactions(created_at DESC);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pt_own" ON payment_transactions;
CREATE POLICY "pt_own" ON payment_transactions
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── 3. stripe_webhook_events (idempotence) — déjà créée en migration 039 ──
-- Idempotent si la table existe déjà.
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id           text        PRIMARY KEY,
  processed_at timestamptz DEFAULT now()
);
