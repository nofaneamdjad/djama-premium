-- ══════════════════════════════════════════════════════════════════
-- Migration 180 : Idempotence atomique webhook Stripe (S1 — FIN-02/03)
-- Compatible avec 039_webhook_events.sql (ADD COLUMN IF NOT EXISTS)
-- Rollback : voir ROLLBACK section en bas
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE stripe_webhook_events
  ADD COLUMN IF NOT EXISTS status      text NOT NULL DEFAULT 'processed'
    CONSTRAINT stripe_webhook_events_status_check
      CHECK (status IN ('processing', 'processed', 'failed')),
  ADD COLUMN IF NOT EXISTS event_type  text,
  ADD COLUMN IF NOT EXISTS failed_at   timestamptz,
  ADD COLUMN IF NOT EXISTS error       text;

-- Backfill : les events existants (processed_at non null) → processed
UPDATE stripe_webhook_events
  SET status = 'processed'
  WHERE status = 'processed';  -- no-op mais idempotent

-- Index pour monitoring des events échoués (reprise manuelle)
CREATE INDEX IF NOT EXISTS idx_stripe_events_failed
  ON stripe_webhook_events (failed_at)
  WHERE status = 'failed';

-- Index event_type pour diagnostic
CREATE INDEX IF NOT EXISTS idx_stripe_events_type
  ON stripe_webhook_events (event_type, processed_at DESC);

COMMENT ON TABLE stripe_webhook_events IS
  'Idempotence Stripe webhooks. INSERT atomique sur id (PK unique).
   Flux : INSERT status=processing → UPDATE status=processed|failed.
   Conflict code 23505 = event déjà reçu → ignorer.
   status=failed : reprise via dashboard Stripe → renvoyer l''event.';

COMMENT ON COLUMN stripe_webhook_events.status IS
  'processing = en cours | processed = ok | failed = erreur handler';
COMMENT ON COLUMN stripe_webhook_events.error IS
  'Message d''erreur tronqué à 500 chars — consulter les logs pour détail complet';

-- ── ROLLBACK ──────────────────────────────────────────────────────
-- ALTER TABLE stripe_webhook_events
--   DROP COLUMN IF EXISTS status,
--   DROP COLUMN IF EXISTS event_type,
--   DROP COLUMN IF EXISTS failed_at,
--   DROP COLUMN IF EXISTS error;
-- DROP INDEX IF EXISTS idx_stripe_events_failed;
-- DROP INDEX IF EXISTS idx_stripe_events_type;
