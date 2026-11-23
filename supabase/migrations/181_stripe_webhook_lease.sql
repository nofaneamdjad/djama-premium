-- ══════════════════════════════════════════════════════════════════
-- Migration 181 : Bail de traitement (lease) + reprise atomique
-- Complète migration 180 (status/event_type/failed_at/error)
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE stripe_webhook_events
  ADD COLUMN IF NOT EXISTS processing_since timestamptz,
  ADD COLUMN IF NOT EXISTS attempt_count    integer NOT NULL DEFAULT 0;

-- Mettre à jour les events 'processing' existants (migration forward-safe)
UPDATE stripe_webhook_events
  SET processing_since = processed_at
  WHERE status = 'processing' AND processing_since IS NULL;

-- Index pour détecter les leases expirés efficacement
CREATE INDEX IF NOT EXISTS idx_stripe_events_lease
  ON stripe_webhook_events (processing_since)
  WHERE status = 'processing';

/* ──────────────────────────────────────────────────────────────
   RPC acquire_webhook_lease(p_event_id, p_lease_secs)

   Acquiert atomiquement le droit de (re)traiter un event si :
     - status = 'failed'                   → reprise après échec
     - status = 'processing'
       AND processing_since < now() - lease → lease expiré (crash serveur)

   Retourne la row si acquise, rien sinon.
   L'appelant DOIT appeler release_webhook_lease après traitement.

   Utilisé par : POST /api/admin/webhook/stripe/retry
────────────────────────────────────────────────────────────── */
CREATE OR REPLACE FUNCTION acquire_webhook_lease(
  p_event_id   text,
  p_lease_secs integer DEFAULT 300
)
RETURNS TABLE (
  id              text,
  event_type      text,
  attempt_count   integer,
  previous_status text,
  previous_error  text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_now timestamptz := now();
BEGIN
  RETURN QUERY
  UPDATE stripe_webhook_events we
  SET
    status           = 'processing',
    processing_since = v_now,
    attempt_count    = we.attempt_count + 1,
    failed_at        = NULL,  -- remettre à zéro pour la nouvelle tentative
    error            = NULL
  WHERE we.id = p_event_id
    AND (
      we.status = 'failed'
      OR (
        we.status = 'processing'
        AND (
          we.processing_since IS NULL
          OR we.processing_since < v_now - (p_lease_secs || ' seconds')::interval
        )
      )
    )
  RETURNING
    we.id,
    we.event_type,
    we.attempt_count,
    'unknown'::text           AS previous_status,
    we.error                  AS previous_error;
END;
$$;

COMMENT ON FUNCTION acquire_webhook_lease IS
  'Acquiert atomiquement le droit de retraiter un event Stripe failed ou processing-expiré.
   p_lease_secs : durée du bail en secondes (défaut 300 = 5 min).
   Retourne la row si acquise, 0 ligne sinon (ne pas traiter si 0 ligne).
   Thread-safe : MVCC PostgreSQL garantit qu''un seul worker gagne la course.';

-- ── ROLLBACK ──────────────────────────────────────────────────────
-- DROP FUNCTION IF EXISTS acquire_webhook_lease(text, integer);
-- ALTER TABLE stripe_webhook_events
--   DROP COLUMN IF EXISTS processing_since,
--   DROP COLUMN IF EXISTS attempt_count;
-- DROP INDEX IF EXISTS idx_stripe_events_lease;
