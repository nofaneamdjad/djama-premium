-- Migration 065 : Phase 3 — Org settings + document_payments org RLS

-- ── 1. Table org_settings ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_settings (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key             TEXT        NOT NULL,
  value           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, key)
);

CREATE INDEX IF NOT EXISTS idx_org_settings_org_key ON org_settings (organization_id, key);

ALTER TABLE org_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_settings_select" ON org_settings;
CREATE POLICY "org_settings_select" ON org_settings FOR SELECT USING (is_org_member(organization_id));
DROP POLICY IF EXISTS "org_settings_insert" ON org_settings;
CREATE POLICY "org_settings_insert" ON org_settings FOR INSERT WITH CHECK (is_org_admin(organization_id));
DROP POLICY IF EXISTS "org_settings_update" ON org_settings;
CREATE POLICY "org_settings_update" ON org_settings FOR UPDATE USING (is_org_admin(organization_id));
DROP POLICY IF EXISTS "org_settings_delete" ON org_settings;
CREATE POLICY "org_settings_delete" ON org_settings FOR DELETE USING (is_org_admin(organization_id));

CREATE OR REPLACE FUNCTION _update_org_settings_ts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_org_settings_ts ON org_settings;
CREATE TRIGGER trg_org_settings_ts
  BEFORE UPDATE ON org_settings
  FOR EACH ROW EXECUTE FUNCTION _update_org_settings_ts();


-- ── 2. S'assurer que document_payments existe (idempotent avec 064) ──
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='documents')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='document_payments')
  THEN
    CREATE TABLE document_payments (
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
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS montant_paye NUMERIC(12,2) NOT NULL DEFAULT 0;
  END IF;
END $$;


-- ── 3. Policies RLS org sur document_payments ─────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='document_payments') THEN
    DROP POLICY IF EXISTS "pay_select_org" ON document_payments;
    CREATE POLICY "pay_select_org" ON document_payments
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM documents d
          WHERE d.id = document_payments.document_id
            AND d.organization_id IS NOT NULL
            AND is_org_member(d.organization_id)
        )
      );

    DROP POLICY IF EXISTS "pay_insert_org" ON document_payments;
    CREATE POLICY "pay_insert_org" ON document_payments
      FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM documents d
          WHERE d.id = document_id
            AND d.organization_id IS NOT NULL
            AND is_org_member(d.organization_id)
        )
      );

    DROP POLICY IF EXISTS "pay_delete_org" ON document_payments;
    CREATE POLICY "pay_delete_org" ON document_payments
      FOR DELETE USING (
        user_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM documents d
          WHERE d.id = document_payments.document_id
            AND d.organization_id IS NOT NULL
            AND is_org_member(d.organization_id)
        )
      );
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
