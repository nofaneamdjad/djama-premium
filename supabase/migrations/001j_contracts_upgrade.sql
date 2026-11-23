-- ════════════════════════════════════════════════════════
-- CONTRATS IA — Upgrade schema : nouvelles colonnes + tables
-- ════════════════════════════════════════════════════════

-- ── 1. Nouvelles colonnes sur contracts ──────────────────────────────────────
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_email        text        DEFAULT '';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_company      text        DEFAULT '';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS jurisdiction        text        DEFAULT 'France';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS language            text        DEFAULT 'fr';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS duration_months     integer     DEFAULT 12;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS is_recurring        boolean     DEFAULT false;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS renewal_alert_days  integer     DEFAULT 30;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS specific_clauses    text        DEFAULT '';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS ai_summary          text        DEFAULT '';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS ai_risks            text        DEFAULT '';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS validation_manager  boolean     DEFAULT false;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS validation_legal    boolean     DEFAULT false;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS validation_finance  boolean     DEFAULT false;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS sent_at             timestamptz;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS viewed_at           timestamptz;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS expires_at          timestamptz;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS invoice_ref         text        DEFAULT '';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS project             text        DEFAULT '';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS updated_at          timestamptz DEFAULT now();

-- Index utiles
CREATE INDEX IF NOT EXISTS idx_contracts_user   ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_date   ON contracts(created_at);

-- ── 2. Trigger updated_at ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_contract_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contract_updated_at ON contracts;
CREATE TRIGGER contract_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_contract_timestamp();

-- ── 3. Signataires ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contract_signatures (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id   uuid        REFERENCES contracts(id) ON DELETE CASCADE,
  user_id       uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  signer_name   text        NOT NULL,
  signer_email  text        NOT NULL DEFAULT '',
  signer_role   text        DEFAULT 'signataire',   -- signataire | validateur | témoin
  order_index   integer     DEFAULT 0,
  status        text        DEFAULT 'pending',       -- pending | sent | viewed | signed | refused
  signed_at     timestamptz,
  signature_data text       DEFAULT '',              -- base64 dessin ou nom tapé
  certificate   text        DEFAULT '',
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_csig_contract ON contract_signatures(contract_id);
ALTER TABLE contract_signatures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "csig_own" ON contract_signatures;
CREATE POLICY "csig_own" ON contract_signatures
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 4. Journal d'activité (audit trail) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS contract_activities (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid        REFERENCES contracts(id) ON DELETE CASCADE,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  action      text        NOT NULL,   -- created | edited | sent | viewed | signed | refused | commented | validated | status_changed
  details     text        DEFAULT '',
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cact_contract ON contract_activities(contract_id);
ALTER TABLE contract_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cact_own" ON contract_activities;
CREATE POLICY "cact_own" ON contract_activities
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 5. Commentaires collaboratifs ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contract_comments (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id  uuid        REFERENCES contracts(id) ON DELETE CASCADE,
  user_id      uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name  text        DEFAULT '',
  content      text        NOT NULL,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ccomments_contract ON contract_comments(contract_id);
ALTER TABLE contract_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ccomments_own" ON contract_comments;
CREATE POLICY "ccomments_own" ON contract_comments
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
