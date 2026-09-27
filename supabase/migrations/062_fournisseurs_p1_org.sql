-- ════════════════════════════════════════════════════════════════
-- FOURNISSEURS P1 — Isolation organisation + total_late_orders
-- 1. organization_id sur les tables enfants fournisseurs
-- 2. Policies RLS org (SELECT + INSERT) — même pattern que 058
-- 3. Trigger total_late_orders : incrémente si réception tardive
-- ════════════════════════════════════════════════════════════════

-- ── 1. organization_id sur les tables enfants ─────────────────────────────

ALTER TABLE fournisseur_orders
  ADD COLUMN IF NOT EXISTS organization_id uuid
    REFERENCES organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_ford_org ON fournisseur_orders(organization_id)
  WHERE organization_id IS NOT NULL;

ALTER TABLE fournisseur_invoices
  ADD COLUMN IF NOT EXISTS organization_id uuid
    REFERENCES organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_finv_org ON fournisseur_invoices(organization_id)
  WHERE organization_id IS NOT NULL;

ALTER TABLE fournisseur_catalog
  ADD COLUMN IF NOT EXISTS organization_id uuid
    REFERENCES organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_fcat_org ON fournisseur_catalog(organization_id)
  WHERE organization_id IS NOT NULL;

ALTER TABLE fournisseur_documents
  ADD COLUMN IF NOT EXISTS organization_id uuid
    REFERENCES organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_fdoc_org ON fournisseur_documents(organization_id)
  WHERE organization_id IS NOT NULL;

ALTER TABLE fournisseur_ratings
  ADD COLUMN IF NOT EXISTS organization_id uuid
    REFERENCES organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_frat_org ON fournisseur_ratings(organization_id)
  WHERE organization_id IS NOT NULL;

-- ── 2. Policies RLS org — SELECT : un membre voit les données de son org ──

-- fournisseur_orders
DROP POLICY IF EXISTS "ford_org_select" ON fournisseur_orders;
CREATE POLICY "ford_org_select" ON fournisseur_orders
  FOR SELECT
  USING (organization_id IS NOT NULL AND is_org_member(organization_id));

DROP POLICY IF EXISTS "ford_org_insert" ON fournisseur_orders;
CREATE POLICY "ford_org_insert" ON fournisseur_orders
  FOR INSERT WITH CHECK (organization_id IS NOT NULL AND is_org_member(organization_id));

-- fournisseur_invoices
DROP POLICY IF EXISTS "finv_org_select" ON fournisseur_invoices;
CREATE POLICY "finv_org_select" ON fournisseur_invoices
  FOR SELECT
  USING (organization_id IS NOT NULL AND is_org_member(organization_id));

DROP POLICY IF EXISTS "finv_org_insert" ON fournisseur_invoices;
CREATE POLICY "finv_org_insert" ON fournisseur_invoices
  FOR INSERT WITH CHECK (organization_id IS NOT NULL AND is_org_member(organization_id));

-- fournisseur_catalog
DROP POLICY IF EXISTS "fcat_org_select" ON fournisseur_catalog;
CREATE POLICY "fcat_org_select" ON fournisseur_catalog
  FOR SELECT
  USING (organization_id IS NOT NULL AND is_org_member(organization_id));

DROP POLICY IF EXISTS "fcat_org_insert" ON fournisseur_catalog;
CREATE POLICY "fcat_org_insert" ON fournisseur_catalog
  FOR INSERT WITH CHECK (organization_id IS NOT NULL AND is_org_member(organization_id));

-- fournisseur_documents
DROP POLICY IF EXISTS "fdoc_org_select" ON fournisseur_documents;
CREATE POLICY "fdoc_org_select" ON fournisseur_documents
  FOR SELECT
  USING (organization_id IS NOT NULL AND is_org_member(organization_id));

DROP POLICY IF EXISTS "fdoc_org_insert" ON fournisseur_documents;
CREATE POLICY "fdoc_org_insert" ON fournisseur_documents
  FOR INSERT WITH CHECK (organization_id IS NOT NULL AND is_org_member(organization_id));

-- fournisseur_ratings
DROP POLICY IF EXISTS "frat_org_select" ON fournisseur_ratings;
CREATE POLICY "frat_org_select" ON fournisseur_ratings
  FOR SELECT
  USING (organization_id IS NOT NULL AND is_org_member(organization_id));

DROP POLICY IF EXISTS "frat_org_insert" ON fournisseur_ratings;
CREATE POLICY "frat_org_insert" ON fournisseur_ratings
  FOR INSERT WITH CHECK (organization_id IS NOT NULL AND is_org_member(organization_id));

-- ── 3. Trigger total_late_orders — incrémente/décrémente lors de la réception ──
-- Déclenché quand une commande passe à/depuis le statut "received".

CREATE OR REPLACE FUNCTION update_fourn_late_orders()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Transition vers "received" → vérifier si tardif
  IF NEW.status = 'received' AND OLD.status IS DISTINCT FROM 'received' THEN
    IF NEW.received_date IS NOT NULL
       AND NEW.expected_date IS NOT NULL
       AND NEW.received_date > NEW.expected_date
       AND NEW.fournisseur_id IS NOT NULL THEN
      UPDATE fournisseurs
        SET total_late_orders = total_late_orders + 1
        WHERE id = NEW.fournisseur_id;
    END IF;
  END IF;

  -- Retour depuis "received" (correction manuelle) → annuler l'incrément
  IF OLD.status = 'received' AND NEW.status != 'received' THEN
    IF OLD.received_date IS NOT NULL
       AND OLD.expected_date IS NOT NULL
       AND OLD.received_date > OLD.expected_date
       AND NEW.fournisseur_id IS NOT NULL THEN
      UPDATE fournisseurs
        SET total_late_orders = GREATEST(0, total_late_orders - 1)
        WHERE id = NEW.fournisseur_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fourn_late_orders ON fournisseur_orders;
CREATE TRIGGER trg_fourn_late_orders
  AFTER UPDATE OF status ON fournisseur_orders
  FOR EACH ROW EXECUTE FUNCTION update_fourn_late_orders();
