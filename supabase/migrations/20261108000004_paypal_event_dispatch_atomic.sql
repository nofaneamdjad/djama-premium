-- Migration 20261108000004 : Idempotence métier atomique + protection désordre d'événements
-- Réversible :
--   DROP TABLE IF EXISTS paypal_event_dispatches;
--   ALTER TABLE public.user_subscriptions
--     DROP COLUMN IF EXISTS last_event_time,
--     DROP COLUMN IF EXISTS last_event_type;
--   DROP FUNCTION IF EXISTS claim_paypal_event_dispatch(TEXT,TEXT,INTEGER);
--   DROP FUNCTION IF EXISTS release_paypal_event_dispatch(TEXT,BOOLEAN,TEXT);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE : paypal_event_dispatches
-- Acquisition atomique du droit de dispatcher un event_id.
-- Un seul vainqueur possible, même en cas de livraisons parallèles
-- (deux transmission_id différents pour le même event_id).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS paypal_event_dispatches (
  event_id         TEXT        PRIMARY KEY,
  transmission_id  TEXT        NOT NULL,
  status           TEXT        NOT NULL DEFAULT 'processing'
                               CHECK (status IN ('processing', 'processed', 'failed')),
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at     TIMESTAMPTZ,
  failed_at        TIMESTAMPTZ,
  error            TEXT
);

COMMENT ON TABLE paypal_event_dispatches IS
  'Acquisition atomique par event_id — garantit qu''un event métier n''est dispatché qu''une seule fois';
COMMENT ON COLUMN paypal_event_dispatches.event_id IS
  'event.id PayPal — identifiant métier partagé entre plusieurs livraisons du même événement';
COMMENT ON COLUMN paypal_event_dispatches.transmission_id IS
  'paypal-transmission-id qui a remporté la course (FK implicite paypal_webhook_events.id)';

-- RLS : accessible uniquement via service_role (aucune politique pour authenticated/anon)
ALTER TABLE paypal_event_dispatches ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- COLONNES : ordre d'événements sur user_subscriptions
-- Permet de détecter les événements obsolètes (désordre de livraison)
-- et d'ignorer une désactivation arrivée après une réactivation plus récente.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS last_event_time  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_event_type  TEXT;

COMMENT ON COLUMN public.user_subscriptions.last_event_time IS
  'create_time de l''événement PayPal qui a produit la dernière mise à jour — utilisé pour ignorer les events obsolètes';
COMMENT ON COLUMN public.user_subscriptions.last_event_type IS
  'event_type de l''événement PayPal qui a produit la dernière mise à jour';

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC : claim_paypal_event_dispatch
--
-- Tente d'acquérir atomiquement le droit de dispatcher un event_id.
-- Retourne TRUE  si le claim est acquis (nouveau, failed, ou bail expiré).
-- Retourne FALSE si un claim actif existe (processing dans le bail) ou si
--               l'event a déjà été dispatché avec succès (processed).
--
-- Mécanisme :
--   1. INSERT → succeed → TRUE (nouvel event_id, cas le plus courant)
--   2. 23505  → UPDATE WHERE status='failed' OR bail_expiré → TRUE/FALSE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION claim_paypal_event_dispatch(
  p_event_id        TEXT,
  p_transmission_id TEXT,
  p_lease_secs      INTEGER DEFAULT 300
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
BEGIN
  -- Tentative 1 : INSERT pour un event_id jamais vu
  BEGIN
    INSERT INTO paypal_event_dispatches (event_id, transmission_id, status, started_at)
    VALUES (p_event_id, p_transmission_id, 'processing', v_now);
    RETURN TRUE;
  EXCEPTION WHEN unique_violation THEN
    -- Conflict — un claim existe déjà pour cet event_id
    NULL;
  END;

  -- Tentative 2 : Reclaimer si le claim précédent a échoué ou si le bail est expiré
  UPDATE paypal_event_dispatches
  SET
    transmission_id = p_transmission_id,
    status          = 'processing',
    started_at      = v_now,
    processed_at    = NULL,
    failed_at       = NULL,
    error           = NULL
  WHERE event_id = p_event_id
    AND (
      status = 'failed'
      OR (
        status    = 'processing'
        AND started_at < v_now - (p_lease_secs * INTERVAL '1 second')
      )
    );

  -- FOUND = TRUE si UPDATE a affecté une ligne (reclaim réussi)
  -- FOUND = FALSE si status='processed' ou bail actif (aucune ligne mise à jour)
  RETURN FOUND;
END;
$$;

REVOKE EXECUTE ON FUNCTION claim_paypal_event_dispatch(TEXT, TEXT, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION claim_paypal_event_dispatch(TEXT, TEXT, INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION claim_paypal_event_dispatch(TEXT, TEXT, INTEGER) FROM authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC : release_paypal_event_dispatch
--
-- Libère le claim après dispatch (succès ou échec).
-- Un claim 'failed' est reclaimable par claim_paypal_event_dispatch.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION release_paypal_event_dispatch(
  p_event_id TEXT,
  p_success  BOOLEAN,
  p_error    TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
BEGIN
  IF p_success THEN
    UPDATE paypal_event_dispatches
    SET
      status       = 'processed',
      processed_at = v_now,
      failed_at    = NULL,
      error        = NULL
    WHERE event_id = p_event_id;
  ELSE
    UPDATE paypal_event_dispatches
    SET
      status    = 'failed',
      failed_at = v_now,
      error     = p_error
    WHERE event_id = p_event_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION release_paypal_event_dispatch(TEXT, BOOLEAN, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION release_paypal_event_dispatch(TEXT, BOOLEAN, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION release_paypal_event_dispatch(TEXT, BOOLEAN, TEXT) FROM authenticated;
