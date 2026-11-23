-- Migration S2 v2 : identifiants distincts + payload authentifié + déduplication métier
-- Numéro : 20261108000002
-- Corrige : confusion transmission_id / event_id / resource_id + absence de raw_payload
-- Réversible : ALTER TABLE paypal_webhook_events DROP COLUMN resource_id, resource_type, raw_payload;
--              DROP INDEX idx_paypal_webhook_events_event_id_status;

-- ─────────────────────────────────────────────────────────────────────────────
-- Les 3 identifiants PayPal — clarification documentée en base
-- ─────────────────────────────────────────────────────────────────────────────
-- id              = paypal-transmission-id  : identifiant de LIVRAISON (unique par tentative)
-- event_id        = event.id               : identifiant de l'ÉVÉNEMENT MÉTIER (même pour
--                                            plusieurs livraisons du même événement)
-- resource_id     = resource.id            : identifiant de l'OBJET FINANCIER (I-xxxx
--                                            abonnement, 1234567890 capture, etc.)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.paypal_webhook_events
  ADD COLUMN IF NOT EXISTS resource_id    TEXT,
  ADD COLUMN IF NOT EXISTS resource_type  TEXT,
  ADD COLUMN IF NOT EXISTS raw_payload    JSONB;

-- Commentaires (documentation dans pg_description)
COMMENT ON COLUMN public.paypal_webhook_events.id
  IS 'paypal-transmission-id — identifiant de livraison, unique par tentative PayPal';
COMMENT ON COLUMN public.paypal_webhook_events.event_id
  IS 'event.id PayPal — identifiant métier partagé entre plusieurs livraisons du même événement';
COMMENT ON COLUMN public.paypal_webhook_events.resource_id
  IS 'resource.id — identifiant de l''objet financier (abonnement I-xxxx, capture, etc.)';
COMMENT ON COLUMN public.paypal_webhook_events.resource_type
  IS 'Type d''objet financier : SUBSCRIPTION | CAPTURE | SALE | OTHER';
COMMENT ON COLUMN public.paypal_webhook_events.raw_payload
  IS 'Payload JSON vérifié et authentifié — base exclusive du replay. Ne jamais reconstruire un événement financier sans lui.';

-- Index pour déduplication métier (vérifier si event_id déjà traité)
CREATE INDEX IF NOT EXISTS idx_paypal_webhook_events_event_id_status
  ON public.paypal_webhook_events (event_id, status)
  WHERE event_id IS NOT NULL;
