-- ══════════════════════════════════════════════════════════════════
-- Migration 039 : Table d'idempotence pour les webhooks Stripe
-- Idempotent — CREATE TABLE IF NOT EXISTS
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id           text        PRIMARY KEY,          -- event.id Stripe (evt_...)
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- Nettoyage automatique : supprimer les events > 7 jours
-- (les webhooks Stripe ne sont jamais réenvoyés après 72 h)
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed
  ON stripe_webhook_events (processed_at);

-- RLS : table interne uniquement (service role)
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
-- Aucune policy publique : accessible uniquement via service_role key
