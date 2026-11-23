-- ════════════════════════════════════════════════════════════════════════
-- Migration 20261108000009 — S6 : Système de remboursements admin
--
-- Périmètre :
--   1. Colonnes de remboursement sur payment_transactions
--      (refunded_amount, stripe_refund_id, stripe_charge_id, stripe_payment_intent_id)
--   2. Table admin_refund_requests — demandes de remboursement admin
--      (idempotence, audit, double-protection, Stripe + PayPal)
--   3. RLS : admin-only via service_role
--   4. Index de recherche et de déduplication
--
-- Contraintes absolues S6 :
--   - Aucun appel réel Stripe/PayPal dans cette migration (SQL pur)
--   - LOCAL ONLY — ne pas appliquer en production
--   - Idempotent — sûr à rejouer
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. Colonnes de remboursement sur payment_transactions ─────────────

ALTER TABLE payment_transactions
  ADD COLUMN IF NOT EXISTS refunded_amount           NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_charge_id          TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id  TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_refund_id          TEXT,
  ADD COLUMN IF NOT EXISTS paypal_capture_id         TEXT,
  ADD COLUMN IF NOT EXISTS paypal_refund_id          TEXT;

-- Index idempotence Stripe
CREATE INDEX IF NOT EXISTS idx_payment_tx_stripe_pi
  ON payment_transactions(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_tx_user_status
  ON payment_transactions(user_id, status);

-- ── 2. Table admin_refund_requests ─────────────────────────────────────
--
-- Chaque demande de remboursement admin = 1 ligne.
-- Une transaction peut avoir plusieurs remboursements partiels.
-- idempotency_key = unique par (source_id, montant, admin) → empêche doublons.
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admin_refund_requests (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),

  -- Source du remboursement (au moins un des deux doit être non-nul)
  transaction_id      UUID          REFERENCES payment_transactions(id) ON DELETE SET NULL,
  invoice_id          UUID,         -- référence vers invoices si remboursement sur facture

  -- Fournisseur
  provider            TEXT          NOT NULL
    CHECK (provider IN ('stripe', 'paypal', 'manual')),

  -- Montants
  amount_requested    NUMERIC(12,2) NOT NULL CHECK (amount_requested > 0),
  amount_refunded     NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency            TEXT          NOT NULL DEFAULT 'EUR',

  -- Statut du cycle de vie
  status              TEXT          NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',      -- demande créée, en attente d'approbation
      'approved',     -- approuvée, en attente de traitement provider
      'processing',   -- appel provider en cours
      'succeeded',    -- remboursement confirmé par le provider
      'failed',       -- appel provider échoué
      'rejected',     -- refusée par un admin
      'cancelled'     -- annulée avant traitement
    )),

  -- Raison / motif
  reason              TEXT,
  rejection_reason    TEXT,

  -- Idempotence : empêche d'émettre deux fois la même demande
  idempotency_key     TEXT          UNIQUE,

  -- Réponse provider
  provider_refund_id  TEXT,         -- refund.id Stripe ou equivalent PayPal
  provider_error      TEXT,         -- message d'erreur en cas d'échec

  -- Traçabilité admin
  requested_by_admin_id  UUID       NOT NULL,
  approved_by_admin_id   UUID,
  processed_at           TIMESTAMPTZ,
  approved_at            TIMESTAMPTZ,

  -- Métadonnées
  raw_provider_response  JSONB      DEFAULT '{}'
);

-- Index courants
CREATE INDEX IF NOT EXISTS idx_refund_req_status
  ON admin_refund_requests(status);

CREATE INDEX IF NOT EXISTS idx_refund_req_transaction
  ON admin_refund_requests(transaction_id)
  WHERE transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_refund_req_invoice
  ON admin_refund_requests(invoice_id)
  WHERE invoice_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_refund_req_created
  ON admin_refund_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_refund_req_provider_refund_id
  ON admin_refund_requests(provider_refund_id)
  WHERE provider_refund_id IS NOT NULL;

-- ── 3. Fonction utilitaire : montant déjà remboursé sur une transaction ─

CREATE OR REPLACE FUNCTION get_already_refunded(p_transaction_id UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(
    SUM(amount_refunded),
    0
  )
  FROM admin_refund_requests
  WHERE transaction_id = p_transaction_id
    AND status IN ('approved', 'processing', 'succeeded')
$$ LANGUAGE SQL STABLE;

-- ── 4. RLS — service_role uniquement (jamais accessible côté client) ───

ALTER TABLE admin_refund_requests ENABLE ROW LEVEL SECURITY;

-- Service role contourne RLS → admins peuvent lire/écrire via createSupabaseAdmin()
-- Aucune policy côté anon/authenticated pour garantir l'isolation

-- ── 5. Trigger updated_at ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refund_req_updated_at ON admin_refund_requests;
CREATE TRIGGER trg_refund_req_updated_at
  BEFORE UPDATE ON admin_refund_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── 6. Commentaires de documentation ──────────────────────────────────

COMMENT ON TABLE admin_refund_requests IS
  'Demandes de remboursement admin — S6. Chaque ligne = 1 remboursement demandé par un admin. Idempotent via idempotency_key UNIQUE.';

COMMENT ON COLUMN admin_refund_requests.idempotency_key IS
  'SHA-256 de (transaction_id|amount_requested|requested_by_admin_id) — empêche les doublons.';

COMMENT ON COLUMN admin_refund_requests.provider_refund_id IS
  'Identifiant retourné par Stripe (re_xxx) ou PayPal après appel API réussi.';

COMMENT ON FUNCTION get_already_refunded(UUID) IS
  'Somme des montants déjà remboursés (ou en cours) pour une transaction — utilisé pour le contrôle de solde remboursable.';
