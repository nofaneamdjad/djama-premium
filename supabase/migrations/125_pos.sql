-- ════════════════════════════════════════════════════════════════════════
-- 125_pos.sql — Caisse / POS
-- Tables sessions, mouvements espèces, paniers en attente
-- Non-destructif — idempotent
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. Sessions de caisse ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos_sessions (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id  uuid          REFERENCES organizations(id) ON DELETE SET NULL,
  terminal_name    text          NOT NULL DEFAULT 'Caisse principale',
  status           text          NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','closed')),
  opened_by        uuid          REFERENCES auth.users(id),
  closed_by        uuid          REFERENCES auth.users(id),
  -- Espèces
  opening_cash     numeric(12,2) NOT NULL DEFAULT 0,
  closing_cash     numeric(12,2),
  expected_cash    numeric(12,2),
  cash_difference  numeric(12,2),
  closing_notes    text          NOT NULL DEFAULT '',
  -- Horodatage
  opened_at        timestamptz   NOT NULL DEFAULT now(),
  closed_at        timestamptz,
  -- Totaux (calculés à la fermeture ou mis à jour à chaque vente)
  total_sales      numeric(12,2) NOT NULL DEFAULT 0,
  sale_count       integer       NOT NULL DEFAULT 0,
  total_cash       numeric(12,2) NOT NULL DEFAULT 0,
  total_card       numeric(12,2) NOT NULL DEFAULT 0,
  total_other      numeric(12,2) NOT NULL DEFAULT 0,
  created_at       timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pos_session_user   ON pos_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_session_status ON pos_sessions(user_id, status);

ALTER TABLE pos_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pos_sessions_own" ON pos_sessions;
CREATE POLICY "pos_sessions_own" ON pos_sessions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 2. Mouvements de caisse (hors ventes) ────────────────────────────────
CREATE TABLE IF NOT EXISTS pos_cash_movements (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id  uuid          NOT NULL REFERENCES pos_sessions(id) ON DELETE CASCADE,
  type        text          NOT NULL CHECK (type IN ('in','out')),
  amount      numeric(12,2) NOT NULL CHECK (amount > 0),
  reason      text          NOT NULL DEFAULT '',
  created_by  uuid          REFERENCES auth.users(id),
  created_at  timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pos_cash_session ON pos_cash_movements(session_id);

ALTER TABLE pos_cash_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pos_cash_own" ON pos_cash_movements;
CREATE POLICY "pos_cash_own" ON pos_cash_movements
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 3. Ventes en attente (paniers sauvegardés) ──────────────────────────
CREATE TABLE IF NOT EXISTS pos_pending_sales (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id  uuid          REFERENCES pos_sessions(id) ON DELETE SET NULL,
  label       text          NOT NULL DEFAULT '',
  cart_data   jsonb         NOT NULL DEFAULT '[]',
  contact_id  uuid          REFERENCES contacts(id) ON DELETE SET NULL,
  discount    numeric(5,2)  NOT NULL DEFAULT 0,
  discount_type text        NOT NULL DEFAULT 'pct' CHECK (discount_type IN ('pct','fixed')),
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pos_pending_user ON pos_pending_sales(user_id);

ALTER TABLE pos_pending_sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pos_pending_own" ON pos_pending_sales;
CREATE POLICY "pos_pending_own" ON pos_pending_sales
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 4. Enrichir documents avec source POS ────────────────────────────────
ALTER TABLE documents ADD COLUMN IF NOT EXISTS source         text DEFAULT '';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS pos_session_id uuid REFERENCES pos_sessions(id) ON DELETE SET NULL;

-- Index pour requêtes historique POS
CREATE INDEX IF NOT EXISTS idx_documents_source     ON documents(user_id, source) WHERE source = 'pos';
CREATE INDEX IF NOT EXISTS idx_documents_pos_session ON documents(pos_session_id) WHERE pos_session_id IS NOT NULL;
