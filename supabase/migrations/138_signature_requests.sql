-- ═══════════════════════════════════════════════
-- Migration 138 — Module Signature électronique
-- Idempotente (IF NOT EXISTS / OR REPLACE)
-- Ne touche pas aux tables existantes
-- ═══════════════════════════════════════════════

-- ── Table principale : demandes de signature ──
CREATE TABLE IF NOT EXISTS signature_requests (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title       text NOT NULL,
  message     text DEFAULT '',
  status      text NOT NULL DEFAULT 'draft',
  -- draft | sent | partially_signed | completed | refused | expired | cancelled
  sign_order  text NOT NULL DEFAULT 'parallel',
  -- parallel | sequential
  expires_at  timestamptz DEFAULT NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE signature_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sig_req_own" ON signature_requests;
CREATE POLICY "sig_req_own" ON signature_requests
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS sig_req_user_idx  ON signature_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sig_req_status_idx ON signature_requests(user_id, status);

-- ── Signataires ──
CREATE TABLE IF NOT EXISTS signature_request_signers (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id     uuid REFERENCES signature_requests(id) ON DELETE CASCADE NOT NULL,
  name           text NOT NULL,
  email          text NOT NULL,
  phone          text DEFAULT NULL,
  role           text DEFAULT 'signataire',
  -- signataire | validateur | temoin
  order_index    integer DEFAULT 0,
  status         text NOT NULL DEFAULT 'pending',
  -- pending | sent | viewed | signed | refused
  token          uuid DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  token_used_at  timestamptz DEFAULT NULL,
  signed_at      timestamptz DEFAULT NULL,
  viewed_at      timestamptz DEFAULT NULL,
  refused_reason text DEFAULT NULL,
  ip_address     text DEFAULT NULL,
  user_agent     text DEFAULT NULL,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE signature_request_signers ENABLE ROW LEVEL SECURITY;

-- Le propriétaire de la demande peut tout lire/modifier
DROP POLICY IF EXISTS "sig_signer_owner" ON signature_request_signers;
CREATE POLICY "sig_signer_owner" ON signature_request_signers
  USING (
    EXISTS (
      SELECT 1 FROM signature_requests r
      WHERE r.id = request_id AND r.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM signature_requests r
      WHERE r.id = request_id AND r.user_id = auth.uid()
    )
  );

-- Accès public via API route (contourné par service_role)
CREATE INDEX IF NOT EXISTS sig_signer_req_idx   ON signature_request_signers(request_id);
CREATE INDEX IF NOT EXISTS sig_signer_token_idx ON signature_request_signers(token);
CREATE INDEX IF NOT EXISTS sig_signer_email_idx ON signature_request_signers(email);

-- ── Journal d'événements ──
CREATE TABLE IF NOT EXISTS signature_events (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id  uuid REFERENCES signature_requests(id) ON DELETE CASCADE NOT NULL,
  signer_id   uuid REFERENCES signature_request_signers(id) ON DELETE SET NULL,
  event_type  text NOT NULL,
  -- created | sent | viewed | signed | refused | expired | cancelled
  -- reminder_sent | completed | error
  metadata    jsonb DEFAULT '{}',
  ip_address  text DEFAULT NULL,
  user_agent  text DEFAULT NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE signature_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sig_event_owner" ON signature_events;
CREATE POLICY "sig_event_owner" ON signature_events
  USING (
    EXISTS (
      SELECT 1 FROM signature_requests r
      WHERE r.id = request_id AND r.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS sig_event_req_idx  ON signature_events(request_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sig_event_type_idx ON signature_events(event_type, created_at DESC);

-- ── Trigger updated_at ──
CREATE OR REPLACE FUNCTION update_signature_request_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS set_sig_req_updated_at ON signature_requests;
CREATE TRIGGER set_sig_req_updated_at
  BEFORE UPDATE ON signature_requests
  FOR EACH ROW EXECUTE FUNCTION update_signature_request_updated_at();
