-- Migration S2 : Idempotence atomique + bail pour webhooks PayPal
-- Numéro : 20261108000001
-- Réversible : DROP TABLE paypal_webhook_events; DROP FUNCTION acquire_paypal_webhook_lease;

-- Table de suivi des événements PayPal reçus
-- Clé primaire : transmission_id (unique par livraison PayPal, header paypal-transmission-id)
CREATE TABLE IF NOT EXISTS paypal_webhook_events (
  id              TEXT        PRIMARY KEY,           -- paypal-transmission-id (unique par livraison)
  event_id        TEXT,                              -- PayPal event ID (resource.id ou id champ racine)
  event_type      TEXT        NOT NULL,              -- ex: BILLING.SUBSCRIPTION.ACTIVATED
  status          TEXT        NOT NULL DEFAULT 'processing'
                              CHECK (status IN ('processing', 'processed', 'failed')),
  processing_since TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at    TIMESTAMPTZ,
  failed_at       TIMESTAMPTZ,
  error           TEXT,
  attempt_count   INTEGER     NOT NULL DEFAULT 1,
  raw_body_hash   TEXT,                              -- SHA-256 du corps brut (détection replay)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les requêtes admin (events nécessitant intervention)
CREATE INDEX IF NOT EXISTS idx_paypal_webhook_events_status
  ON paypal_webhook_events (status, processing_since);

CREATE INDEX IF NOT EXISTS idx_paypal_webhook_events_event_id
  ON paypal_webhook_events (event_id)
  WHERE event_id IS NOT NULL;

-- RLS : table accessible uniquement via service_role
ALTER TABLE paypal_webhook_events ENABLE ROW LEVEL SECURITY;

-- Aucune politique pour authenticated/anon → accès uniquement via service_role (bypass RLS)
-- La route webhook utilise SUPABASE_SERVICE_ROLE_KEY

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC : acquire_paypal_webhook_lease
-- Acquiert atomiquement le bail sur un event PayPal failed ou processing-expiré.
-- Retourne la ligne si le bail est acquis, 0 lignes sinon.
-- Appelée exclusivement par la route admin/webhook/paypal/retry avec service_role.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION acquire_paypal_webhook_lease(
  p_transmission_id  TEXT,
  p_lease_secs       INTEGER DEFAULT 300
)
RETURNS TABLE (
  id               TEXT,
  event_id         TEXT,
  event_type       TEXT,
  attempt_count    INTEGER,
  previous_status  TEXT,
  previous_error   TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
BEGIN
  RETURN QUERY
  UPDATE paypal_webhook_events AS e
  SET
    status           = 'processing',
    processing_since = v_now,
    attempt_count    = e.attempt_count + 1,
    updated_at       = v_now
  WHERE e.id = p_transmission_id
    AND (
      e.status = 'failed'
      OR (
        e.status = 'processing'
        AND e.processing_since < v_now - (p_lease_secs * INTERVAL '1 second')
      )
    )
  RETURNING
    e.id,
    e.event_id,
    e.event_type,
    e.attempt_count,
    'reclaimed'::TEXT AS previous_status,
    e.error           AS previous_error;
END;
$$;

-- Révoquer l'accès public à la fonction (exécution uniquement via service_role)
REVOKE EXECUTE ON FUNCTION acquire_paypal_webhook_lease(TEXT, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION acquire_paypal_webhook_lease(TEXT, INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION acquire_paypal_webhook_lease(TEXT, INTEGER) FROM authenticated;
