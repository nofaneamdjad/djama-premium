-- ════════════════════════════════════════════════════════════════════════
-- Migration 20261108000010 — S6 V2 : Corrections remboursements
--
-- Périmètre :
--   1. Modèle de réservation : get_already_refunded compte amount_requested
--      pour les statuts pending/processing/approved (anti-race-condition)
--   2. Statut "uncertain" : pour les pannes réseau post-envoi provider
--   3. notification_sent_at : traçage des emails client (anti-doublon)
--   4. Index provider_refund_id pour les lookups webhook
--
-- Contraintes absolues S6 V2 :
--   - LOCAL ONLY — ne pas appliquer en production
--   - Idempotent — sûr à rejouer
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. Ajouter le statut "uncertain" et "notification_sent_at" ──────────

ALTER TABLE admin_refund_requests
  ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ;

-- Étendre le CHECK status pour inclure "uncertain"
-- PostgreSQL ne permet pas de modifier directement une contrainte CHECK ;
-- on la supprime et la recrée.
ALTER TABLE admin_refund_requests
  DROP CONSTRAINT IF EXISTS admin_refund_requests_status_check;

ALTER TABLE admin_refund_requests
  ADD CONSTRAINT admin_refund_requests_status_check
  CHECK (status IN (
    'pending',      -- demande créée, en attente d'approbation
    'approved',     -- approuvée, en attente de traitement provider
    'processing',   -- appel provider en cours
    'uncertain',    -- appel envoyé, réponse inconnue (panne réseau)
    'succeeded',    -- remboursement confirmé par le provider
    'failed',       -- appel provider échoué
    'rejected',     -- refusée par un admin
    'cancelled'     -- annulée avant traitement
  ));

-- ── 2. Remplacer get_already_refunded par un modèle de réservation ──────
--
-- Ancienne logique : SUM(amount_refunded) WHERE status IN (approved, processing, succeeded)
--   → Pendant processing, amount_refunded = 0 → race condition possible
--
-- Nouvelle logique (reservation model) :
--   - Statuts terminaux (succeeded, uncertain) : compter amount_refunded (réel)
--   - Statuts en cours (pending, approved, processing) : compter amount_requested (réservé)
--
-- Cette somme représente le maximum qui pourrait être remboursé, évitant les
-- doubles remboursements même sous concurrence.
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_already_refunded(p_transaction_id UUID)
RETURNS NUMERIC
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(
    SUM(
      CASE
        -- Montant réel pour les opérations terminées ou incertaines
        WHEN status IN ('succeeded', 'uncertain')
          THEN amount_refunded
        -- Montant réservé pour les opérations en cours
        WHEN status IN ('pending', 'approved', 'processing')
          THEN amount_requested
        -- Ignorés : failed, rejected, cancelled
        ELSE 0
      END
    ),
    0
  )
  FROM admin_refund_requests
  WHERE transaction_id = p_transaction_id
$$;

COMMENT ON FUNCTION get_already_refunded(UUID) IS
  'Modèle de réservation S6 V2 : somme le montant demandé pour les états en cours (pending/approved/processing) et le montant réel remboursé pour les états terminaux (succeeded/uncertain). Évite les doubles remboursements sous concurrence.';

-- ── 3. Index webhook : lookup rapide par provider_refund_id ─────────────

CREATE INDEX IF NOT EXISTS idx_refund_req_provider_id_status
  ON admin_refund_requests(provider_refund_id, status)
  WHERE provider_refund_id IS NOT NULL;

-- Index sur transaction_id + status pour les vérifications de solde
CREATE INDEX IF NOT EXISTS idx_refund_req_tx_active
  ON admin_refund_requests(transaction_id, status)
  WHERE transaction_id IS NOT NULL
    AND status IN ('pending', 'approved', 'processing', 'uncertain', 'succeeded');

COMMENT ON COLUMN admin_refund_requests.notification_sent_at IS
  'Date d''envoi de la notification email client (NULL = non envoyée). Protège contre les doublons.';

COMMENT ON COLUMN admin_refund_requests.status IS
  'Cycle de vie S6 V2 : pending → approved/processing → succeeded/failed/uncertain | rejected/cancelled. "uncertain" = appel provider envoyé mais réponse inconnue (panne réseau post-envoi).';
