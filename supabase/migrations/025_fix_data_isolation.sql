-- ══════════════════════════════════════════════════════════════════
-- Migration 025 : Isolation complète des données utilisateurs
--
-- Problème : plusieurs tables avaient des politiques RLS USING (true)
-- permettant à n'importe quel utilisateur authentifié de lire les
-- données de tous les autres utilisateurs.
--
-- Ce script est IDEMPOTENT (DROP POLICY IF EXISTS avant chaque CREATE).
-- Exécuter dans : Supabase Dashboard → SQL Editor → Run
-- ══════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────
-- 1. USER_ACCESS — chaque utilisateur ne voit QUE sa propre ligne
-- ────────────────────────────────────────────────────────────────────
-- Était USING(true) → tout le monde pouvait lire la liste complète
-- des abonnés (plan, coaching_ia, etc.)

ALTER TABLE user_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select user_access" ON user_access;
DROP POLICY IF EXISTS "insert user_access" ON user_access;
DROP POLICY IF EXISTS "update user_access" ON user_access;
DROP POLICY IF EXISTS "delete user_access" ON user_access;

-- SELECT : seulement sa propre ligne
CREATE POLICY "select user_access"
  ON user_access FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT : ouvert (webhook Stripe / inscription initiale)
CREATE POLICY "insert user_access"
  ON user_access FOR INSERT
  WITH CHECK (true);

-- UPDATE : seulement sa propre ligne (profil, préférences)
CREATE POLICY "update user_access"
  ON user_access FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE : personne (admin uniquement via service role)
-- (aucune politique DELETE = accès refusé pour auth + anon)


-- ────────────────────────────────────────────────────────────────────
-- 2. QUOTES (admin) — inaccessibles aux utilisateurs réguliers
-- ────────────────────────────────────────────────────────────────────
-- L'admin utilise SUPABASE_SERVICE_ROLE_KEY (bypass RLS total).
-- Les utilisateurs clients n'ont aucune raison d'accéder à cette table.

DROP POLICY IF EXISTS "select quotes"  ON quotes;
DROP POLICY IF EXISTS "insert quotes"  ON quotes;
DROP POLICY IF EXISTS "update quotes"  ON quotes;
DROP POLICY IF EXISTS "delete quotes"  ON quotes;
DROP POLICY IF EXISTS "anon all quotes" ON quotes;

CREATE POLICY "select quotes"
  ON quotes FOR SELECT
  USING (false);

-- INSERT/UPDATE/DELETE: aucune politique = refusé (service role bypass)


-- ────────────────────────────────────────────────────────────────────
-- 3. QUOTE_ITEMS (admin) — inaccessibles aux utilisateurs réguliers
-- ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "select quote_items"  ON quote_items;
DROP POLICY IF EXISTS "insert quote_items"  ON quote_items;
DROP POLICY IF EXISTS "update quote_items"  ON quote_items;
DROP POLICY IF EXISTS "delete quote_items"  ON quote_items;

CREATE POLICY "select quote_items"
  ON quote_items FOR SELECT
  USING (false);


-- ────────────────────────────────────────────────────────────────────
-- 4. INVOICES (admin) — inaccessibles aux utilisateurs réguliers
-- ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "select invoices"  ON invoices;
DROP POLICY IF EXISTS "insert invoices"  ON invoices;
DROP POLICY IF EXISTS "update invoices"  ON invoices;
DROP POLICY IF EXISTS "delete invoices"  ON invoices;

CREATE POLICY "select invoices"
  ON invoices FOR SELECT
  USING (false);


-- ────────────────────────────────────────────────────────────────────
-- 5. INVOICE_ITEMS (admin) — inaccessibles aux utilisateurs réguliers
-- ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "select invoice_items"  ON invoice_items;
DROP POLICY IF EXISTS "insert invoice_items"  ON invoice_items;
DROP POLICY IF EXISTS "update invoice_items"  ON invoice_items;
DROP POLICY IF EXISTS "delete invoice_items"  ON invoice_items;

CREATE POLICY "select invoice_items"
  ON invoice_items FOR SELECT
  USING (false);


-- ────────────────────────────────────────────────────────────────────
-- 6. RESERVATIONS (admin) — inaccessibles aux utilisateurs réguliers
-- ────────────────────────────────────────────────────────────────────
-- Les réservations sont gérées uniquement par l'admin.
-- La table n'a pas de colonne user_id côté client.

DROP POLICY IF EXISTS "select reservations"     ON reservations;
DROP POLICY IF EXISTS "insert reservations"     ON reservations;
DROP POLICY IF EXISTS "update reservations"     ON reservations;
DROP POLICY IF EXISTS "delete reservations"     ON reservations;
DROP POLICY IF EXISTS "anon all reservations"   ON reservations;

CREATE POLICY "select reservations"
  ON reservations FOR SELECT
  USING (false);

-- INSERT reste ouvert (formulaire de réservation public)
CREATE POLICY "insert reservations"
  ON reservations FOR INSERT
  WITH CHECK (true);

-- UPDATE/DELETE : aucune politique = service role uniquement


-- ────────────────────────────────────────────────────────────────────
-- 7. CLIENTS_CRM — table client-side (si elle existe)
-- ────────────────────────────────────────────────────────────────────
-- Créer la table si elle n'existe pas encore, avec user_id obligatoire.
CREATE TABLE IF NOT EXISTS clients_crm (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom         text        NOT NULL DEFAULT '',
  societe     text        DEFAULT '',
  email       text        DEFAULT '',
  telephone   text        DEFAULT '',
  adresse     text        DEFAULT '',
  notes       text        DEFAULT '',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Ajouter user_id si la table existait sans cette colonne
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'clients_crm'
      AND column_name  = 'user_id'
  ) THEN
    ALTER TABLE clients_crm ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_clients_crm_user ON clients_crm(user_id);

ALTER TABLE clients_crm ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_crm_own"   ON clients_crm;
DROP POLICY IF EXISTS "select clients_crm" ON clients_crm;
DROP POLICY IF EXISTS "insert clients_crm" ON clients_crm;
DROP POLICY IF EXISTS "update clients_crm" ON clients_crm;
DROP POLICY IF EXISTS "delete clients_crm" ON clients_crm;

CREATE POLICY "clients_crm_own"
  ON clients_crm
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────────────
-- 8. FACTURES (table client-side) — si elle existe
-- ────────────────────────────────────────────────────────────────────
-- Table utilisée dans client/page.tsx pour les KPIs du cockpit.
-- Distincte de la table admin "invoices".
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'factures'
  ) THEN
    -- S'assurer que user_id existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name   = 'factures'
        AND column_name  = 'user_id'
    ) THEN
      ALTER TABLE factures ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    ALTER TABLE factures ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "factures_own"    ON factures;
    DROP POLICY IF EXISTS "select factures" ON factures;
    DROP POLICY IF EXISTS "insert factures" ON factures;
    DROP POLICY IF EXISTS "update factures" ON factures;
    DROP POLICY IF EXISTS "delete factures" ON factures;

    EXECUTE 'CREATE POLICY "factures_own" ON factures FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';

    CREATE INDEX IF NOT EXISTS idx_factures_user ON factures(user_id);
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────────────
-- 9. DOCUMENTS — s'assurer que user_id existe, puis fixer RLS
-- ────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- Vérifier que la table documents existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'documents'
  ) THEN
    RAISE NOTICE 'Table documents inexistante — section ignorée';
    RETURN;
  END IF;

  -- Ajouter user_id si absent
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'documents'
      AND column_name  = 'user_id'
  ) THEN
    ALTER TABLE documents ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
    RAISE NOTICE 'Colonne user_id ajoutée à documents';
  END IF;

  -- Activer RLS
  ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

  -- Recréer les policies
  DROP POLICY IF EXISTS "docs_select_own" ON documents;
  DROP POLICY IF EXISTS "docs_insert_own" ON documents;
  DROP POLICY IF EXISTS "docs_update_own" ON documents;
  DROP POLICY IF EXISTS "docs_delete_own" ON documents;

  EXECUTE 'CREATE POLICY "docs_select_own" ON documents FOR SELECT USING (auth.uid() = user_id)';
  EXECUTE 'CREATE POLICY "docs_insert_own" ON documents FOR INSERT WITH CHECK (auth.uid() = user_id)';
  EXECUTE 'CREATE POLICY "docs_update_own" ON documents FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  EXECUTE 'CREATE POLICY "docs_delete_own" ON documents FOR DELETE USING (auth.uid() = user_id)';

  RAISE NOTICE 'RLS documents configuré';
END $$;


-- ────────────────────────────────────────────────────────────────────
-- 10. DOCUMENT_ITEMS — accès via jointure sur documents
-- ────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- Vérifier que les deux tables existent et ont les bonnes colonnes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'document_items'
  ) THEN
    RAISE NOTICE 'Table document_items inexistante — section ignorée';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'documents'
      AND column_name  = 'user_id'
  ) THEN
    RAISE NOTICE 'documents.user_id absent — document_items RLS ignoré';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'document_items'
      AND column_name  = 'document_id'
  ) THEN
    RAISE NOTICE 'document_items.document_id absent — section ignorée';
    RETURN;
  END IF;

  -- Activer RLS
  ALTER TABLE document_items ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "ditems_select_own" ON document_items;
  DROP POLICY IF EXISTS "ditems_insert_own" ON document_items;
  DROP POLICY IF EXISTS "ditems_update_own" ON document_items;
  DROP POLICY IF EXISTS "ditems_delete_own" ON document_items;

  EXECUTE $pol$
    CREATE POLICY "ditems_select_own" ON document_items FOR SELECT
    USING (EXISTS (SELECT 1 FROM documents d WHERE d.id = document_items.document_id AND d.user_id = auth.uid()))
  $pol$;

  EXECUTE $pol$
    CREATE POLICY "ditems_insert_own" ON document_items FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM documents d WHERE d.id = document_items.document_id AND d.user_id = auth.uid()))
  $pol$;

  EXECUTE $pol$
    CREATE POLICY "ditems_update_own" ON document_items FOR UPDATE
    USING (EXISTS (SELECT 1 FROM documents d WHERE d.id = document_items.document_id AND d.user_id = auth.uid()))
  $pol$;

  EXECUTE $pol$
    CREATE POLICY "ditems_delete_own" ON document_items FOR DELETE
    USING (EXISTS (SELECT 1 FROM documents d WHERE d.id = document_items.document_id AND d.user_id = auth.uid()))
  $pol$;

  RAISE NOTICE 'RLS document_items configuré';
END $$;


-- ════════════════════════════════════════════════════════════════════
-- Résumé des permissions après migration :
--
-- Table            SELECT              INSERT          UPDATE/DELETE
-- ──────────────────────────────────────────────────────────────────
-- user_access      ✅ propre ligne     ✅ ouvert       ✅ propre ligne
-- quotes           ❌ (svc role)       ❌ (svc role)   ❌ (svc role)
-- quote_items      ❌ (svc role)       ❌ (svc role)   ❌ (svc role)
-- invoices         ❌ (svc role)       ❌ (svc role)   ❌ (svc role)
-- invoice_items    ❌ (svc role)       ❌ (svc role)   ❌ (svc role)
-- reservations     ❌ (svc role)       ✅ ouvert       ❌ (svc role)
-- clients_crm      ✅ propre user_id   ✅ propre        ✅ propre
-- documents        ✅ propre user_id   ✅ propre        ✅ propre
-- document_items   ✅ via doc.user_id  ✅ via doc       ✅ via doc
-- ════════════════════════════════════════════════════════════════════
