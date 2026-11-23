-- ══════════════════════════════════════════════════════════════════
-- Migration 058 : Partage des données professionnelles entre membres d'une org
-- ══════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════
-- 1. Fonctions helper is_org_member / is_org_admin
-- ══════════════════════════════════════════════════════════════════

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

-- ══════════════════════════════════════════════════════════════════
-- 2. Ajouter organization_id aux tables CRM/achat manquantes
--    (conditionnels car ces tables peuvent ne pas encore exister)
-- ══════════════════════════════════════════════════════════════════

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='clients_crm') THEN
    ALTER TABLE clients_crm ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_clients_crm_org ON clients_crm(organization_id) WHERE organization_id IS NOT NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='fournisseurs') THEN
    ALTER TABLE fournisseurs ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_fournisseurs_org ON fournisseurs(organization_id) WHERE organization_id IS NOT NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='contracts') THEN
    ALTER TABLE contracts ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_contracts_org ON contracts(organization_id) WHERE organization_id IS NOT NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='stock_products') THEN
    ALTER TABLE stock_products ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_stock_products_org ON stock_products(organization_id) WHERE organization_id IS NOT NULL;
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════════
-- 3. Policies SELECT pour les membres d'organisation
-- ══════════════════════════════════════════════════════════════════

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='organization_id') THEN
    DROP POLICY IF EXISTS "org_select_documents" ON documents;
    CREATE POLICY "org_select_documents" ON documents FOR SELECT
      USING (organization_id IS NOT NULL AND is_org_member(organization_id));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='document_items')
  AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='organization_id') THEN
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
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' AND column_name='organization_id') THEN
    DROP POLICY IF EXISTS "org_select_expenses" ON expenses;
    CREATE POLICY "org_select_expenses" ON expenses FOR SELECT
      USING (organization_id IS NOT NULL AND is_org_member(organization_id));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contacts' AND column_name='organization_id') THEN
    DROP POLICY IF EXISTS "org_select_contacts" ON contacts;
    CREATE POLICY "org_select_contacts" ON contacts FOR SELECT
      USING (organization_id IS NOT NULL AND is_org_member(organization_id));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contacts' AND column_name='organization_id') THEN
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
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='opportunities' AND column_name='organization_id') THEN
    DROP POLICY IF EXISTS "org_select_opportunities" ON opportunities;
    CREATE POLICY "org_select_opportunities" ON opportunities FOR SELECT
      USING (organization_id IS NOT NULL AND is_org_member(organization_id));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='crm_tasks' AND column_name='organization_id') THEN
    DROP POLICY IF EXISTS "org_select_crm_tasks" ON crm_tasks;
    CREATE POLICY "org_select_crm_tasks" ON crm_tasks FOR SELECT
      USING (organization_id IS NOT NULL AND is_org_member(organization_id));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients_crm' AND column_name='organization_id') THEN
    DROP POLICY IF EXISTS "org_select_clients_crm" ON clients_crm;
    CREATE POLICY "org_select_clients_crm" ON clients_crm FOR SELECT
      USING (organization_id IS NOT NULL AND is_org_member(organization_id));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='organization_id') THEN
    DROP POLICY IF EXISTS "org_select_projects" ON projects;
    CREATE POLICY "org_select_projects" ON projects FOR SELECT
      USING (organization_id IS NOT NULL AND is_org_member(organization_id));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='organization_id') THEN
    DROP POLICY IF EXISTS "org_select_employees" ON employees;
    CREATE POLICY "org_select_employees" ON employees FOR SELECT
      USING (organization_id IS NOT NULL AND is_org_member(organization_id));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fournisseurs' AND column_name='organization_id') THEN
    DROP POLICY IF EXISTS "org_select_fournisseurs" ON fournisseurs;
    CREATE POLICY "org_select_fournisseurs" ON fournisseurs FOR SELECT
      USING (organization_id IS NOT NULL AND is_org_member(organization_id));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contracts' AND column_name='organization_id') THEN
    DROP POLICY IF EXISTS "org_select_contracts" ON contracts;
    CREATE POLICY "org_select_contracts" ON contracts FOR SELECT
      USING (organization_id IS NOT NULL AND is_org_member(organization_id));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='stock_products' AND column_name='organization_id') THEN
    DROP POLICY IF EXISTS "org_select_stock_products" ON stock_products;
    CREATE POLICY "org_select_stock_products" ON stock_products FOR SELECT
      USING (organization_id IS NOT NULL AND is_org_member(organization_id));
  END IF;
END $$;

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
-- ══════════════════════════════════════════════════════════════════

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='organization_id') THEN
    DROP POLICY IF EXISTS "org_insert_documents" ON documents;
    CREATE POLICY "org_insert_documents" ON documents FOR INSERT
      WITH CHECK (
        organization_id IS NOT NULL
        AND is_org_member(organization_id)
        AND user_id = auth.uid()
      );
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' AND column_name='organization_id') THEN
    DROP POLICY IF EXISTS "org_insert_expenses" ON expenses;
    CREATE POLICY "org_insert_expenses" ON expenses FOR INSERT
      WITH CHECK (
        organization_id IS NOT NULL
        AND is_org_member(organization_id)
        AND user_id = auth.uid()
      );
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contacts' AND column_name='organization_id') THEN
    DROP POLICY IF EXISTS "org_insert_contacts" ON contacts;
    CREATE POLICY "org_insert_contacts" ON contacts FOR INSERT
      WITH CHECK (
        organization_id IS NOT NULL
        AND is_org_member(organization_id)
        AND user_id = auth.uid()
      );
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients_crm' AND column_name='organization_id') THEN
    DROP POLICY IF EXISTS "org_insert_clients_crm" ON clients_crm;
    CREATE POLICY "org_insert_clients_crm" ON clients_crm FOR INSERT
      WITH CHECK (
        organization_id IS NOT NULL
        AND is_org_member(organization_id)
        AND user_id = auth.uid()
      );
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='organization_id') THEN
    DROP POLICY IF EXISTS "org_insert_projects" ON projects;
    CREATE POLICY "org_insert_projects" ON projects FOR INSERT
      WITH CHECK (
        organization_id IS NOT NULL
        AND is_org_member(organization_id)
        AND user_id = auth.uid()
      );
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fournisseurs' AND column_name='organization_id') THEN
    DROP POLICY IF EXISTS "org_insert_fournisseurs" ON fournisseurs;
    CREATE POLICY "org_insert_fournisseurs" ON fournisseurs FOR INSERT
      WITH CHECK (
        organization_id IS NOT NULL
        AND is_org_member(organization_id)
        AND user_id = auth.uid()
      );
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contracts' AND column_name='organization_id') THEN
    DROP POLICY IF EXISTS "org_insert_contracts" ON contracts;
    CREATE POLICY "org_insert_contracts" ON contracts FOR INSERT
      WITH CHECK (
        organization_id IS NOT NULL
        AND is_org_member(organization_id)
        AND user_id = auth.uid()
      );
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='stock_products' AND column_name='organization_id') THEN
    DROP POLICY IF EXISTS "org_insert_stock_products" ON stock_products;
    CREATE POLICY "org_insert_stock_products" ON stock_products FOR INSERT
      WITH CHECK (
        organization_id IS NOT NULL
        AND is_org_member(organization_id)
        AND user_id = auth.uid()
      );
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='organization_id') THEN
    DROP POLICY IF EXISTS "org_insert_employees" ON employees;
    CREATE POLICY "org_insert_employees" ON employees FOR INSERT
      WITH CHECK (
        organization_id IS NOT NULL
        AND is_org_member(organization_id)
        AND user_id = auth.uid()
      );
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════════
-- 5. Policies UPDATE/DELETE pour admins d'organisation
-- ══════════════════════════════════════════════════════════════════

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='organization_id') THEN
    DROP POLICY IF EXISTS "org_admin_update_documents" ON documents;
    CREATE POLICY "org_admin_update_documents" ON documents FOR UPDATE
      USING (organization_id IS NOT NULL AND is_org_admin(organization_id));
    DROP POLICY IF EXISTS "org_admin_delete_documents" ON documents;
    CREATE POLICY "org_admin_delete_documents" ON documents FOR DELETE
      USING (organization_id IS NOT NULL AND is_org_admin(organization_id));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contacts' AND column_name='organization_id') THEN
    DROP POLICY IF EXISTS "org_admin_update_contacts" ON contacts;
    CREATE POLICY "org_admin_update_contacts" ON contacts FOR UPDATE
      USING (organization_id IS NOT NULL AND is_org_admin(organization_id));
    DROP POLICY IF EXISTS "org_admin_delete_contacts" ON contacts;
    CREATE POLICY "org_admin_delete_contacts" ON contacts FOR DELETE
      USING (organization_id IS NOT NULL AND is_org_admin(organization_id));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients_crm' AND column_name='organization_id') THEN
    DROP POLICY IF EXISTS "org_admin_update_clients_crm" ON clients_crm;
    CREATE POLICY "org_admin_update_clients_crm" ON clients_crm FOR UPDATE
      USING (organization_id IS NOT NULL AND is_org_admin(organization_id));
    DROP POLICY IF EXISTS "org_admin_delete_clients_crm" ON clients_crm;
    CREATE POLICY "org_admin_delete_clients_crm" ON clients_crm FOR DELETE
      USING (organization_id IS NOT NULL AND is_org_admin(organization_id));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' AND column_name='organization_id') THEN
    DROP POLICY IF EXISTS "org_admin_update_expenses" ON expenses;
    CREATE POLICY "org_admin_update_expenses" ON expenses FOR UPDATE
      USING (organization_id IS NOT NULL AND is_org_admin(organization_id));
    DROP POLICY IF EXISTS "org_admin_delete_expenses" ON expenses;
    CREATE POLICY "org_admin_delete_expenses" ON expenses FOR DELETE
      USING (organization_id IS NOT NULL AND is_org_admin(organization_id));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='organization_id') THEN
    DROP POLICY IF EXISTS "org_admin_update_projects" ON projects;
    CREATE POLICY "org_admin_update_projects" ON projects FOR UPDATE
      USING (organization_id IS NOT NULL AND is_org_admin(organization_id));
    DROP POLICY IF EXISTS "org_admin_delete_projects" ON projects;
    CREATE POLICY "org_admin_delete_projects" ON projects FOR DELETE
      USING (organization_id IS NOT NULL AND is_org_admin(organization_id));
  END IF;
END $$;
