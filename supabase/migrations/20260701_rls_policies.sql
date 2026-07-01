-- ============================================================
-- RLS POLICIES — DJAMA
-- Chaque utilisateur ne voit que ses propres données
-- Appliquer via : supabase db push ou dashboard SQL editor
-- ============================================================

-- ── Activer RLS sur toutes les tables ──────────────────────

ALTER TABLE IF EXISTS documents             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS document_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expenses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expense_reports       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expense_budgets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS treasury_accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS treasury_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS treasury_recurring    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contacts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contact_activities    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS opportunities         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS crm_tasks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tickets               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fournisseurs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fournisseur_orders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fournisseur_invoices  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fournisseur_ratings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS portail_clients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contracts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contract_signatures   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contract_activities   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contract_comments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stock_products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stock_warehouses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stock_movements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stock_orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stock_deliveries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS productivity_tasks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS projects              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS planning_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS planning_tasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS planning_goals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS agenda_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notes                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notebooks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notebook_pages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS note_folders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS time_entries          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chrono_projects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chrono_goals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_members          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_leaves           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_meetings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_messages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employees             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_conversations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS social_posts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS coaching_progress     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_settings         ENABLE ROW LEVEL SECURITY;

-- ── Policies standard : user_id = auth.uid() ──────────────
-- Appliqué dynamiquement sur toutes les tables

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'documents','expenses','expense_reports','expense_budgets',
    'treasury_accounts','treasury_transactions','treasury_recurring',
    'contacts','contact_activities','opportunities','crm_tasks','tickets',
    'fournisseurs','fournisseur_orders','fournisseur_invoices','fournisseur_ratings',
    'portail_clients','contracts','contract_signatures','contract_activities','contract_comments',
    'stock_products','stock_warehouses','stock_movements','stock_orders','stock_deliveries',
    'productivity_tasks','projects','planning_events','planning_tasks','planning_goals','agenda_events',
    'notes','notebooks','notebook_pages','note_folders',
    'time_entries','chrono_projects','chrono_goals',
    'team_members','team_tasks','team_leaves','team_meetings','team_messages','employees',
    'ai_conversations','ai_messages','social_posts','coaching_progress','user_settings'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "user_select_%s" ON %I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "user_insert_%s" ON %I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "user_update_%s" ON %I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "user_delete_%s" ON %I', tbl, tbl);

    EXECUTE format(
      'CREATE POLICY "user_select_%s" ON %I FOR SELECT USING (user_id = auth.uid())',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "user_insert_%s" ON %I FOR INSERT WITH CHECK (user_id = auth.uid())',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "user_update_%s" ON %I FOR UPDATE USING (user_id = auth.uid())',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "user_delete_%s" ON %I FOR DELETE USING (user_id = auth.uid())',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ── document_items : accès via le document parent ─────────
-- Si document_items n'a pas de user_id direct, on passe par documents
DROP POLICY IF EXISTS "user_select_document_items" ON document_items;
DROP POLICY IF EXISTS "user_insert_document_items" ON document_items;
DROP POLICY IF EXISTS "user_update_document_items" ON document_items;
DROP POLICY IF EXISTS "user_delete_document_items" ON document_items;

CREATE POLICY "user_select_document_items" ON document_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.user_id = auth.uid())
  );
CREATE POLICY "user_insert_document_items" ON document_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.user_id = auth.uid())
  );
CREATE POLICY "user_update_document_items" ON document_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.user_id = auth.uid())
  );
CREATE POLICY "user_delete_document_items" ON document_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.user_id = auth.uid())
  );

-- ── Vérification ───────────────────────────────────────────
-- SELECT tablename, policyname, cmd FROM pg_policies
-- WHERE schemaname = 'public' ORDER BY tablename, cmd;
