-- SEC-06 — Ajout expires_at sur les tokens partagés (P0)
-- Corrige l'absence d'expiration sur :
--   1. portail_clients.invitation_token
--   2. booking_pages.token
--   3. rdv_booking_pages.token

-- ─── 1. portail_clients — token d'invitation ─────────────────────────────────
ALTER TABLE portail_clients
  ADD COLUMN IF NOT EXISTS invitation_token_expires_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN portail_clients.invitation_token_expires_at IS
  'Expiration du lien d''invitation client. NULL = pas d''expiration (anciens liens).';

-- ─── 2. booking_pages — page de réservation publique ─────────────────────────
ALTER TABLE booking_pages
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN booking_pages.expires_at IS
  'Date d''expiration optionnelle de la page de réservation. NULL = pas d''expiration.';

-- ─── 3. rdv_booking_pages — page de réservation RDV avancé ──────────────────
ALTER TABLE rdv_booking_pages
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN rdv_booking_pages.expires_at IS
  'Date d''expiration optionnelle de la page de réservation. NULL = pas d''expiration.';

-- ─── Index pour les lookups d'expiration ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_portail_clients_inv_token_exp
  ON portail_clients(invitation_token_expires_at)
  WHERE invitation_token_expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_booking_pages_expires_at
  ON booking_pages(expires_at)
  WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rdv_booking_pages_expires_at
  ON rdv_booking_pages(expires_at)
  WHERE expires_at IS NOT NULL;
