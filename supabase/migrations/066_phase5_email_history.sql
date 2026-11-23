-- 066_phase5_email_history.sql
-- Historique des emails envoyés pour les documents (factures, devis).

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='documents') THEN

    CREATE TABLE IF NOT EXISTS document_email_history (
      id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id  UUID        NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      user_id      UUID        NOT NULL,
      to_email     TEXT        NOT NULL,
      to_name      TEXT,
      subject      TEXT,
      type         TEXT        NOT NULL DEFAULT 'initial'
                               CHECK (type IN ('initial', 'relance')),
      pdf_attached BOOLEAN     NOT NULL DEFAULT FALSE,
      resend_id    TEXT,
      sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS email_history_document_idx
      ON document_email_history (document_id, sent_at DESC);
    CREATE INDEX IF NOT EXISTS email_history_relance_idx
      ON document_email_history (document_id, type, sent_at DESC)
      WHERE type = 'relance';

    ALTER TABLE document_email_history ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "email_history_select_own" ON document_email_history;
    CREATE POLICY "email_history_select_own" ON document_email_history
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM documents d WHERE d.id = document_email_history.document_id AND d.user_id = auth.uid())
      );

    DROP POLICY IF EXISTS "email_history_select_org" ON document_email_history;
    CREATE POLICY "email_history_select_org" ON document_email_history
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM documents d
          WHERE d.id = document_email_history.document_id
            AND d.organization_id IS NOT NULL
            AND is_org_member(d.organization_id)
        )
      );

  END IF;
END $$;
