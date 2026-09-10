-- ══════════════════════════════════════════════════════════════════
-- Migration 058 : Partage des données professionnelles entre membres d'une org
--
-- PROBLÈME IDENTIFIÉ :
--   La migration 20260701_rls_policies.sql a recréé toutes les policies
--   en "user_id = auth.uid()" pur, ignorant complètement l'appartenance
--   à une organisation. Un membre invité voyait un tableau vide même
--   après acceptation de l'invitation.
--
-- CORRECTION :
--   1. Fonction helper is_org_member() pour éviter de répéter la
--      sous-requête org_members dans chaque policy (SECURITY DEFINER
--      + SET search_path = public pour éviter la vulnérabilité search_path)
--
--   2. Nouvelles policies SELECT "org_select_XXX" sur toutes les tables
--      partagées : elles s'ajoutent aux policies user_id existantes
--      (Supabase fait un OR entre toutes les policies SELECT d'une table).
--
--   3. Nouvelles policies INSERT "org_insert_XXX" : un membre peut
--      insérer des données tagguées avec l'organization_id si et
--      seulement s'il est bien membre de cette org.
--
--   4. Ajout de organization_id sur clients_crm et fournisseurs
--      (tables CRM/achat non couvertes par la migration 054).
--
-- ISOLATION GARANTIE :
--   • Un utilisateur ne voit les données d'une org que s'il y est membre.
--   • Les données personnelles (organization_id IS NULL) restent isolées
--     par user_id = auth.uid() (policies existantes non modifiées).
--   • Les mutations sensibles (UPDATE/DELETE d'un enregistrement d'autrui)
--     doivent passer par les API routes Next.js (service_role) qui
--     vérifient les organization_permissions (can_edit, can_delete).
--
-- ORDRE D'APPLICATION : après 057_org_activity_log.sql
-- IDEMPOTENT : oui (DROP POLICY IF EXISTS + CREATE OR REPLACE)
-- ══════════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════════
-- 1. Fonction helper is_org_member(p_org_id)
-- ══════════════════════════════════════════════════════════════════
-- Vérifie que auth.uid() est membre de l'organisation p_org_id.
-- STABLE : résultat constant dans la même transaction (optimisation).
-- SECURITY DEFINER : peut lire organization_members sans restriction RLS.
-- SET search_path = public : protège contre l'injection via search_path.

CREATE OR REPLACE FUNCTION is_org_member(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_id = p_org_id
      AND user_id = auth.uid()
  )
$$;

-- ══════════════════════════════════════════════════════════════════
-- 2. Ajouter organization_id aux tables CRM/achat manquantes
-- ══════════════════════════════════════════════════════════════════

-- clients_crm (table CRM principale, absente de la migration 054)
ALTER TABLE clients_crm
  ADD COLUMN IF NOT EXISTS organization_id uuid
  REFERENCES organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_clients_crm_org
  ON clients_crm(organization_id)
  WHERE organization_id IS NOT NULL;

-- fournisseurs
ALTER TABLE fournisseurs
  ADD COLUMN IF NOT EXISTS organization_id uuid
  REFERENCES organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_fournisseurs_org
  ON fournisseurs(organization_id)
  WHERE organization_id IS NOT NULL;

-- contracts
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS organization_id uuid
  REFERENCES organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_contracts_org
  ON contracts(organization_id)
  WHERE organization_id IS NOT NULL;

-- stock_products
ALTER TABLE stock_products
  ADD COLUMN IF NOT EXISTS organization_id uuid
  REFERENCES organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_stock_products_org
  ON stock_products(organization_id)
  WHERE organization_id IS NOT NULL;


-- ══════════════════════════════════════════════════════════════════
-- 3. Policies SELECT pour les membres d'organisation
--    (s'ajoutent aux policies user_id existantes = OR implicite)
-- ══════════════════════════════════════════════════════════════════

-- ── documents (factures, devis, avoirs) ──────────────────────────
DROP POLICY IF EXISTS "org_select_documents" ON documents;
CREATE POLICY "org_select_documents" ON documents FOR SELECT
  USING (organization_id IS NOT NULL AND is_org_member(organization_id));

-- ── document_items (lignes de factures) ──────────────────────────
DROP POLICY IF EXISTS "org_select_document_items" ON document_items;
CREATE POLICY "org_select_document_items" ON document_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_items.document_id
        AND d.organization_id IS NOT NULL
        AND is_org_member(d.organization_id)
    )
  );

-- ── expenses ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "org_select_expenses" ON expenses;
CREATE POLICY "org_select_expenses" ON expenses FOR SELECT
  USING (organization_id IS NOT NULL AND is_org_member(organization_id));

-- ── contacts (CRM contacts avancé) ───────────────────────────────
DROP POLICY IF EXISTS "org_select_contacts" ON contacts;
CREATE POLICY "org_select_contacts" ON contacts FOR SELECT
  USING (organization_id IS NOT NULL AND is_org_member(organization_id));

-- Tables liées à contacts
DROP POLICY IF EXISTS "org_select_contact_activities" ON contact_activities;
CREATE POLICY "org_select_contact_activities" ON contact_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contacts c
      WHERE c.id = contact_activities.contact_id
        AND c.organization_id IS NOT NULL
        AND is_org_member(c.organization_id)
    )
  );

DROP POLICY IF EXISTS "org_select_opportunities" ON opportunities;
CREATE POLICY "org_select_opportunities" ON opportunities FOR SELECT
  USING (organization_id IS NOT NULL AND is_org_member(organization_id));

DROP POLICY IF EXISTS "org_select_crm_tasks" ON crm_tasks;
CREATE POLICY "org_select_crm_tasks" ON crm_tasks FOR SELECT
  USING (organization_id IS NOT NULL AND is_org_member(organization_id));

-- ── clients_crm ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "org_select_clients_crm" ON clients_crm;
CREATE POLICY "org_select_clients_crm" ON clients_crm FOR SELECT
  USING (organization_id IS NOT NULL AND is_org_member(organization_id));

-- ── projects ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "org_select_projects" ON projects;
CREATE POLICY "org_select_projects" ON projects FOR SELECT
  USING (organization_id IS NOT NULL AND is_org_member(organization_id));

-- ── employees (module RH) ─────────────────────────────────────────
DROP POLICY IF EXISTS "org_select_employees" ON employees;
CREATE POLICY "org_select_employees" ON employees FOR SELECT
  USING (organization_id IS NOT NULL AND is_org_member(organization_id));

-- ── fournisseurs ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "org_select_fournisseurs" ON fournisseurs;
CREATE POLICY "org_select_fournisseurs" ON fournisseurs FOR SELECT
  USING (organization_id IS NOT NULL AND is_org_member(organization_id));

-- ── contracts ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "org_select_contracts" ON contracts;
CREATE POLICY "org_select_contracts" ON contracts FOR SELECT
  USING (organization_id IS NOT NULL AND is_org_member(organization_id));

-- ── stock_products ────────────────────────────────────────────────
DROP POLICY IF EXISTS "org_select_stock_products" ON stock_products;
CREATE POLICY "org_select_stock_products" ON stock_products FOR SELECT
  USING (organization_id IS NOT NULL AND is_org_member(organization_id));

-- ── team_members, team_tasks, team_meetings (module équipe) ──────
-- Ces tables ont déjà organization_id via equipe_schema.sql (à vérifier)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'team_members'
      AND column_name = 'organization_id'
  ) THEN
    EXECUTE $p$
      DROP POLICY IF EXISTS "org_select_team_members" ON team_members;
      CREATE POLICY "org_select_team_members" ON team_members FOR SELECT
        USING (organization_id IS NOT NULL AND is_org_member(organization_id))
    $p$;
  END IF;
END $$;


-- ══════════════════════════════════════════════════════════════════
-- 4. Policies INSERT pour les membres d'organisation
--    Un membre peut insérer des données avec organization_id = son org,
--    à condition que user_id = auth.uid() (il signe son propre enregistrement)
-- ══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "org_insert_documents" ON documents;
CREATE POLICY "org_insert_documents" ON documents FOR INSERT
  WITH CHECK (
    organization_id IS NOT NULL
    AND is_org_member(organization_id)
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "org_insert_expenses" ON expenses;
CREATE POLICY "org_insert_expenses" ON expenses FOR INSERT
  WITH CHECK (
    organization_id IS NOT NULL
    AND is_org_member(organization_id)
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "org_insert_contacts" ON contacts;
CREATE POLICY "org_insert_contacts" ON contacts FOR INSERT
  WITH CHECK (
    organization_id IS NOT NULL
    AND is_org_member(organization_id)
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "org_insert_clients_crm" ON clients_crm;
CREATE POLICY "org_insert_clients_crm" ON clients_crm FOR INSERT
  WITH CHECK (
    organization_id IS NOT NULL
    AND is_org_member(organization_id)
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "org_insert_projects" ON projects;
CREATE POLICY "org_insert_projects" ON projects FOR INSERT
  WITH CHECK (
    organization_id IS NOT NULL
    AND is_org_member(organization_id)
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "org_insert_fournisseurs" ON fournisseurs;
CREATE POLICY "org_insert_fournisseurs" ON fournisseurs FOR INSERT
  WITH CHECK (
    organization_id IS NOT NULL
    AND is_org_member(organization_id)
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "org_insert_contracts" ON contracts;
CREATE POLICY "org_insert_contracts" ON contracts FOR INSERT
  WITH CHECK (
    organization_id IS NOT NULL
    AND is_org_member(organization_id)
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "org_insert_stock_products" ON stock_products;
CREATE POLICY "org_insert_stock_products" ON stock_products FOR INSERT
  WITH CHECK (
    organization_id IS NOT NULL
    AND is_org_member(organization_id)
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "org_insert_employees" ON employees;
CREATE POLICY "org_insert_employees" ON employees FOR INSERT
  WITH CHECK (
    organization_id IS NOT NULL
    AND is_org_member(organization_id)
    AND user_id = auth.uid()
  );


-- ══════════════════════════════════════════════════════════════════
-- 5. Policies UPDATE/DELETE pour admins d'organisation
--    Un owner/admin peut modifier/supprimer n'importe quel enregistrement
--    de son organisation (même s'il ne l'a pas créé).
--    Les membres non-admin ne peuvent modifier que leurs propres enregistrements
--    (user_id = auth.uid() → couvert par les policies existantes).
-- ══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION is_org_admin(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_id = p_org_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
$$;

-- documents
DROP POLICY IF EXISTS "org_admin_update_documents" ON documents;
CREATE POLICY "org_admin_update_documents" ON documents FOR UPDATE
  USING (organization_id IS NOT NULL AND is_org_admin(organization_id));

DROP POLICY IF EXISTS "org_admin_delete_documents" ON documents;
CREATE POLICY "org_admin_delete_documents" ON documents FOR DELETE
  USING (organization_id IS NOT NULL AND is_org_admin(organization_id));

-- contacts
DROP POLICY IF EXISTS "org_admin_update_contacts" ON contacts;
CREATE POLICY "org_admin_update_contacts" ON contacts FOR UPDATE
  USING (organization_id IS NOT NULL AND is_org_admin(organization_id));

DROP POLICY IF EXISTS "org_admin_delete_contacts" ON contacts;
CREATE POLICY "org_admin_delete_contacts" ON contacts FOR DELETE
  USING (organization_id IS NOT NULL AND is_org_admin(organization_id));

-- clients_crm
DROP POLICY IF EXISTS "org_admin_update_clients_crm" ON clients_crm;
CREATE POLICY "org_admin_update_clients_crm" ON clients_crm FOR UPDATE
  USING (organization_id IS NOT NULL AND is_org_admin(organization_id));

DROP POLICY IF EXISTS "org_admin_delete_clients_crm" ON clients_crm;
CREATE POLICY "org_admin_delete_clients_crm" ON clients_crm FOR DELETE
  USING (organization_id IS NOT NULL AND is_org_admin(organization_id));

-- expenses
DROP POLICY IF EXISTS "org_admin_update_expenses" ON expenses;
CREATE POLICY "org_admin_update_expenses" ON expenses FOR UPDATE
  USING (organization_id IS NOT NULL AND is_org_admin(organization_id));

DROP POLICY IF EXISTS "org_admin_delete_expenses" ON expenses;
CREATE POLICY "org_admin_delete_expenses" ON expenses FOR DELETE
  USING (organization_id IS NOT NULL AND is_org_admin(organization_id));

-- projects
DROP POLICY IF EXISTS "org_admin_update_projects" ON projects;
CREATE POLICY "org_admin_update_projects" ON projects FOR UPDATE
  USING (organization_id IS NOT NULL AND is_org_admin(organization_id));

DROP POLICY IF EXISTS "org_admin_delete_projects" ON projects;
CREATE POLICY "org_admin_delete_projects" ON projects FOR DELETE
  USING (organization_id IS NOT NULL AND is_org_admin(organization_id));


-- ══════════════════════════════════════════════════════════════════
-- 6. Vérification post-application
-- ══════════════════════════════════════════════════════════════════
-- Après application, vérifier avec :
--
-- SELECT tablename, policyname, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND policyname LIKE 'org_%'
-- ORDER BY tablename, cmd;
-- → Doit lister toutes les policies org_select_*, org_insert_*, org_admin_*
--
-- SELECT proname, prosrc FROM pg_proc
-- WHERE proname IN ('is_org_member', 'is_org_admin');
-- → Doit retourner 2 fonctions avec SET search_path = public
