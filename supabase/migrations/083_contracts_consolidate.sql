-- ─────────────────────────────────────────────────────────────────────────────
-- 083_contracts_consolidate.sql
-- Consolidation idempotente des migrations contrats hors-séquence
--
-- Corrige :
--   - Colonnes manquantes (contracts_missing_columns.sql + contracts_upgrade.sql)
--   - Sync type → contract_type pour les anciens enregistrements
--   - FK manquante sur contract_versions.user_id → auth.users(id)
--   - Index pour la pagination curseur (updated_at DESC, created_at DESC)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Colonnes manquantes sur contracts ─────────────────────────────────────
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_type      text        DEFAULT 'prestation';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS logo_url           text;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS currency           text        DEFAULT 'EUR';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_email       text        DEFAULT '';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_company     text        DEFAULT '';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS jurisdiction       text        DEFAULT 'France';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS language           text        DEFAULT 'fr';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS duration_months    integer     DEFAULT 12;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS is_recurring       boolean     DEFAULT false;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS renewal_alert_days integer     DEFAULT 30;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS specific_clauses   text        DEFAULT '';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS ai_summary         text        DEFAULT '';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS ai_risks           text        DEFAULT '';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS validation_manager boolean     DEFAULT false;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS validation_legal   boolean     DEFAULT false;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS validation_finance boolean     DEFAULT false;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS sent_at            timestamptz;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS viewed_at          timestamptz;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS expires_at         timestamptz;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS invoice_ref        text        DEFAULT '';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS project            text        DEFAULT '';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS updated_at         timestamptz DEFAULT now();

-- ── 2. Sync type → contract_type pour les anciens enregistrements ────────────
-- Le frontend n'utilise que contract_type. Les contrats créés avant la migration
-- contracts_missing_columns.sql peuvent avoir contract_type NULL ou vide.
UPDATE contracts
SET    contract_type = COALESCE(NULLIF(type, ''), 'prestation')
WHERE  (contract_type IS NULL OR contract_type = '')
  AND  type IS NOT NULL;

-- ── 3. Trigger updated_at (idempotent) ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_contract_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contract_updated_at ON contracts;
CREATE TRIGGER contract_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_contract_timestamp();

-- ── 4. Indexes pour pagination curseur ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contracts_user_updated ON contracts(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_user_created ON contracts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_status       ON contracts(status);

-- ── 5. FK manquante : contract_versions.user_id → auth.users(id) ─────────────
-- Supprime les orphelins éventuels avant d'ajouter la contrainte
DELETE FROM contract_versions cv
WHERE  NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = cv.user_id
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   information_schema.table_constraints
    WHERE  table_name      = 'contract_versions'
      AND  constraint_name = 'contract_versions_user_id_fkey'
  ) THEN
    ALTER TABLE contract_versions
      ADD CONSTRAINT contract_versions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;
