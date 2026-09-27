-- Phase 2 : Paiements partiels des factures
-- Idempotent : CREATE TABLE IF NOT EXISTS + DROP/CREATE POLICY + ADD COLUMN IF NOT EXISTS

-- ── Table des paiements ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_payments (
  id          UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID          NOT NULL REFERENCES documents(id)  ON DELETE CASCADE,
  amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  date        DATE          NOT NULL DEFAULT CURRENT_DATE,
  method      TEXT          NOT NULL DEFAULT 'virement',
  notes       TEXT          NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS doc_payments_doc_idx  ON document_payments(document_id);
CREATE INDEX IF NOT EXISTS doc_payments_user_idx ON document_payments(user_id);

ALTER TABLE document_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pay_select_own" ON document_payments;
DROP POLICY IF EXISTS "pay_insert_own" ON document_payments;
DROP POLICY IF EXISTS "pay_delete_own" ON document_payments;

CREATE POLICY "pay_select_own" ON document_payments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "pay_insert_own" ON document_payments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "pay_delete_own" ON document_payments FOR DELETE USING (user_id = auth.uid());

-- ── Colonne dénormalisée sur documents ────────────────────────────────────
-- Maintenue par l'application après chaque INSERT/DELETE dans document_payments
ALTER TABLE documents ADD COLUMN IF NOT EXISTS montant_paye NUMERIC(12,2) NOT NULL DEFAULT 0;

NOTIFY pgrst, 'reload schema';
