-- ═══════════════════════════════════════════════════════════════════════════
-- 148 — MODULE BANQUE : connexions, imports, rapprochements, règles auto
-- Complète treasury_* (comptes + transactions existants) sans les modifier.
-- Idempotent, sûr à rejouer.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── 1. Colonnes supplémentaires sur treasury_transactions ────────────────
-- bank_ref             : référence bancaire brute (N° opération banque)
-- source               : origine de la transaction
-- reconciliation_status: état du rapprochement
-- tags                 : étiquettes libres
-- import_file_id       : lien vers le fichier importé

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='treasury_transactions' AND column_name='bank_ref') THEN
    ALTER TABLE treasury_transactions ADD COLUMN bank_ref text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='treasury_transactions' AND column_name='source') THEN
    ALTER TABLE treasury_transactions ADD COLUMN source text NOT NULL DEFAULT 'manual'
      CHECK (source IN ('manual','import_csv','import_ofx','import_mt940','bank_sync','treasury_sync'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='treasury_transactions' AND column_name='reconciliation_status') THEN
    ALTER TABLE treasury_transactions ADD COLUMN reconciliation_status text NOT NULL DEFAULT 'unmatched'
      CHECK (reconciliation_status IN ('unmatched','suggested','reconciled','excluded'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='treasury_transactions' AND column_name='tags') THEN
    ALTER TABLE treasury_transactions ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='treasury_transactions' AND column_name='import_file_id') THEN
    ALTER TABLE treasury_transactions ADD COLUMN import_file_id uuid;
  END IF;
END $$;

-- Mettre à jour les transactions existantes synchronisées depuis treasury-sync
UPDATE treasury_transactions
   SET source = 'treasury_sync'
 WHERE source = 'manual'
   AND (document_payment_id IS NOT NULL OR expense_id IS NOT NULL);

-- Index pour filtres fréquents
CREATE INDEX IF NOT EXISTS idx_trtx_source
  ON treasury_transactions(source);
CREATE INDEX IF NOT EXISTS idx_trtx_reconciliation_status
  ON treasury_transactions(reconciliation_status);
CREATE INDEX IF NOT EXISTS idx_trtx_tags
  ON treasury_transactions USING gin(tags);

-- ─── 2. bank_connections : connexions Open Banking ────────────────────────
-- Aucun jeton bancaire ne transite par cette table en clair.
-- access_token_encrypted réservé au chiffrement serveur (AES-256) — jamais exposé en RLS SELECT.

CREATE TABLE IF NOT EXISTS bank_connections (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id       uuid        REFERENCES organizations(id) ON DELETE SET NULL,

  provider              text        NOT NULL
    CHECK (provider IN ('gocardless','powens','plaid','tink','trueplayer','manual','other')),

  institution_id        text,         -- ID de l'établissement chez le provider
  institution_name      text NOT NULL DEFAULT '',
  institution_country   text,         -- code ISO-2

  status                text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','active','expired','error','revoked')),

  -- Sécurité : jamais retourné dans les queries SELECT publiques
  access_token_encrypted text,

  requisition_id        text,         -- ID de la session de consentement
  consent_expires_at    timestamptz,  -- Expiration du consentement

  accounts_count        integer     NOT NULL DEFAULT 0,
  last_sync_at          timestamptz,
  last_error            text,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bconn_user   ON bank_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_bconn_org    ON bank_connections(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bconn_status ON bank_connections(status);

ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bc_select" ON bank_connections;
DROP POLICY IF EXISTS "bc_insert" ON bank_connections;
DROP POLICY IF EXISTS "bc_update" ON bank_connections;
DROP POLICY IF EXISTS "bc_delete" ON bank_connections;

-- Le token chiffré n'est jamais retourné en SELECT (sécurité)
CREATE POLICY "bc_select" ON bank_connections FOR SELECT
  USING (
    user_id = auth.uid()
    OR (organization_id IS NOT NULL AND is_org_member(organization_id))
  );

CREATE POLICY "bc_insert" ON bank_connections FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "bc_update" ON bank_connections FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "bc_delete" ON bank_connections FOR DELETE
  USING (user_id = auth.uid());

-- Trigger updated_at
CREATE OR REPLACE FUNCTION trg_bconn_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_bconn_updated_at ON bank_connections;
CREATE TRIGGER trg_bconn_updated_at
  BEFORE UPDATE ON bank_connections
  FOR EACH ROW EXECUTE FUNCTION trg_bconn_updated_at();

-- ─── 3. bank_import_files : fichiers importés ─────────────────────────────

CREATE TABLE IF NOT EXISTS bank_import_files (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id       uuid        REFERENCES organizations(id) ON DELETE SET NULL,
  account_id            uuid        REFERENCES treasury_accounts(id) ON DELETE SET NULL,

  filename              text        NOT NULL,
  file_format           text        NOT NULL DEFAULT 'csv'
    CHECK (file_format IN ('csv','ofx','qif','camt053','mt940')),

  status                text        NOT NULL DEFAULT 'done'
    CHECK (status IN ('pending','processing','done','error')),

  transactions_total    integer     NOT NULL DEFAULT 0,
  transactions_imported integer     NOT NULL DEFAULT 0,
  transactions_skipped  integer     NOT NULL DEFAULT 0,  -- doublons ou hors période
  error_message         text,

  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bimport_user ON bank_import_files(user_id);
CREATE INDEX IF NOT EXISTS idx_bimport_account ON bank_import_files(account_id) WHERE account_id IS NOT NULL;

ALTER TABLE bank_import_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bif_select" ON bank_import_files;
DROP POLICY IF EXISTS "bif_insert" ON bank_import_files;
DROP POLICY IF EXISTS "bif_delete" ON bank_import_files;

CREATE POLICY "bif_select" ON bank_import_files FOR SELECT
  USING (user_id = auth.uid() OR (organization_id IS NOT NULL AND is_org_member(organization_id)));
CREATE POLICY "bif_insert" ON bank_import_files FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "bif_delete" ON bank_import_files FOR DELETE
  USING (user_id = auth.uid());

-- Lien FK import_file_id → bank_import_files (ajouté après la table)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_trtx_import_file'
  ) THEN
    ALTER TABLE treasury_transactions
      ADD CONSTRAINT fk_trtx_import_file
      FOREIGN KEY (import_file_id) REFERENCES bank_import_files(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ─── 4. bank_reconciliations : rapprochements ─────────────────────────────

CREATE TABLE IF NOT EXISTS bank_reconciliations (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id   uuid        REFERENCES organizations(id) ON DELETE SET NULL,

  transaction_id    uuid        NOT NULL REFERENCES treasury_transactions(id) ON DELETE CASCADE,

  -- Ce à quoi est rapproché la transaction
  match_type        text        NOT NULL
    CHECK (match_type IN ('invoice','expense','document_payment','transfer','fee','salary','other')),
  document_id       uuid,         -- facture/avoir (documents table)
  expense_id_ref    uuid,         -- dépense (expenses table)

  match_score       numeric(5,4) NOT NULL DEFAULT 0  -- 0-1
    CHECK (match_score BETWEEN 0 AND 1),
  match_reason      text,          -- explication courte

  status            text        NOT NULL DEFAULT 'suggested'
    CHECK (status IN ('suggested','validated','rejected')),

  validated_at      timestamptz,
  notes             text,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brec_user          ON bank_reconciliations(user_id);
CREATE INDEX IF NOT EXISTS idx_brec_transaction   ON bank_reconciliations(transaction_id);
CREATE INDEX IF NOT EXISTS idx_brec_status        ON bank_reconciliations(status);
CREATE INDEX IF NOT EXISTS idx_brec_document      ON bank_reconciliations(document_id) WHERE document_id IS NOT NULL;

ALTER TABLE bank_reconciliations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "br_select" ON bank_reconciliations;
DROP POLICY IF EXISTS "br_insert" ON bank_reconciliations;
DROP POLICY IF EXISTS "br_update" ON bank_reconciliations;
DROP POLICY IF EXISTS "br_delete" ON bank_reconciliations;

CREATE POLICY "br_select" ON bank_reconciliations FOR SELECT
  USING (user_id = auth.uid() OR (organization_id IS NOT NULL AND is_org_member(organization_id)));
CREATE POLICY "br_insert" ON bank_reconciliations FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "br_update" ON bank_reconciliations FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "br_delete" ON bank_reconciliations FOR DELETE
  USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS trg_brec_updated_at ON bank_reconciliations;
CREATE TRIGGER trg_brec_updated_at
  BEFORE UPDATE ON bank_reconciliations
  FOR EACH ROW EXECUTE FUNCTION trg_bconn_updated_at();

-- ─── 5. bank_rules : règles de catégorisation automatique ─────────────────

CREATE TABLE IF NOT EXISTS bank_rules (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid        REFERENCES organizations(id) ON DELETE SET NULL,

  name            text        NOT NULL,
  description     text,

  -- Conditions (JSON array) : [{field, operator, value}]
  -- field: label | amount | category | payment_method | client_supplier
  -- operator: contains | equals | starts_with | greater_than | less_than
  conditions      jsonb       NOT NULL DEFAULT '[]',

  -- Actions (JSON object) : {set_category, add_tag, set_reconciliation_status}
  actions         jsonb       NOT NULL DEFAULT '{}',

  priority        integer     NOT NULL DEFAULT 100,
  active          boolean     NOT NULL DEFAULT true,
  match_count     integer     NOT NULL DEFAULT 0,  -- compteur d'applications

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brules_user   ON bank_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_brules_active ON bank_rules(active) WHERE active = true;

ALTER TABLE bank_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brule_select" ON bank_rules;
DROP POLICY IF EXISTS "brule_insert" ON bank_rules;
DROP POLICY IF EXISTS "brule_update" ON bank_rules;
DROP POLICY IF EXISTS "brule_delete" ON bank_rules;

CREATE POLICY "brule_select" ON bank_rules FOR SELECT
  USING (user_id = auth.uid() OR (organization_id IS NOT NULL AND is_org_member(organization_id)));
CREATE POLICY "brule_insert" ON bank_rules FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "brule_update" ON bank_rules FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "brule_delete" ON bank_rules FOR DELETE
  USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS trg_brules_updated_at ON bank_rules;
CREATE TRIGGER trg_brules_updated_at
  BEFORE UPDATE ON bank_rules
  FOR EACH ROW EXECUTE FUNCTION trg_bconn_updated_at();

-- ─── 6. bank_sync_logs : journal des synchronisations ────────────────────

CREATE TABLE IF NOT EXISTS bank_sync_logs (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id         uuid        REFERENCES bank_connections(id) ON DELETE SET NULL,
  import_file_id        uuid        REFERENCES bank_import_files(id) ON DELETE SET NULL,

  source                text        NOT NULL DEFAULT 'manual',  -- 'bank_sync' | 'import_csv' | ...
  status                text        NOT NULL DEFAULT 'success'
    CHECK (status IN ('success','partial','error')),

  transactions_fetched  integer     NOT NULL DEFAULT 0,
  transactions_new      integer     NOT NULL DEFAULT 0,
  transactions_updated  integer     NOT NULL DEFAULT 0,
  transactions_skipped  integer     NOT NULL DEFAULT 0,
  error_message         text,

  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bslog_user       ON bank_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_bslog_created_at ON bank_sync_logs(created_at DESC);

ALTER TABLE bank_sync_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bslog_select" ON bank_sync_logs;
DROP POLICY IF EXISTS "bslog_insert" ON bank_sync_logs;

CREATE POLICY "bslog_select" ON bank_sync_logs FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "bslog_insert" ON bank_sync_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

COMMIT;
