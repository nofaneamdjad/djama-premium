-- ══════════════════════════════════════════════════════════════════
-- Migration 065 : Phase 3 — Org settings + document_payments org RLS
--
-- 1. Table org_settings — paramètres de marque partagés au niveau org
--    (équivalent de user_settings mais pour l'organisation entière)
--    Tous les membres peuvent lire ; seuls les admins/owners peuvent écrire.
--
-- 2. Policies RLS sur document_payments pour les membres d'org :
--    Un membre actif peut voir et enregistrer des paiements sur les
--    documents qui appartiennent à son organisation.
--
-- IDEMPOTENT : CREATE TABLE IF NOT EXISTS + DROP POLICY IF EXISTS
-- ══════════════════════════════════════════════════════════════════

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

CREATE INDEX IF NOT EXISTS idx_org_settings_org_key
  ON org_settings (organization_id, key);

ALTER TABLE org_settings ENABLE ROW LEVEL SECURITY;

-- Lecture : tout membre actif de l'org
DROP POLICY IF EXISTS "org_settings_select" ON org_settings;
CREATE POLICY "org_settings_select" ON org_settings
  FOR SELECT USING (is_org_member(organization_id));

-- Écriture : admins/owners uniquement
DROP POLICY IF EXISTS "org_settings_insert" ON org_settings;
CREATE POLICY "org_settings_insert" ON org_settings
  FOR INSERT WITH CHECK (is_org_admin(organization_id));

DROP POLICY IF EXISTS "org_settings_update" ON org_settings;
CREATE POLICY "org_settings_update" ON org_settings
  FOR UPDATE USING (is_org_admin(organization_id));

DROP POLICY IF EXISTS "org_settings_delete" ON org_settings;
CREATE POLICY "org_settings_delete" ON org_settings
  FOR DELETE USING (is_org_admin(organization_id));

-- Trigger updated_at
CREATE OR REPLACE FUNCTION _update_org_settings_ts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_org_settings_ts ON org_settings;
CREATE TRIGGER trg_org_settings_ts
  BEFORE UPDATE ON org_settings
  FOR EACH ROW EXECUTE FUNCTION _update_org_settings_ts();


-- ── 2. Policies RLS sur document_payments pour les orgs ──────────
--
-- Les policies existantes (pay_select_own / pay_insert_own / pay_delete_own)
-- ne couvrent que user_id = auth.uid(). Elles restent inchangées.
-- On ajoute des policies parallèles pour les documents d'organisation.
-- Supabase combine les policies SELECT / INSERT / DELETE par OR.

-- SELECT : voir les paiements des documents de son org
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

-- INSERT : enregistrer un paiement sur un document de son org
--          (l'enregistreur signe avec son propre user_id)
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

-- DELETE : supprimer uniquement ses propres paiements sur un doc d'org
--          (les admins passent par service_role pour supprimer les paiements d'autrui)
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

NOTIFY pgrst, 'reload schema';
