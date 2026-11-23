-- Migration 20261103-3 : RLS deny-all pour tables admin-only + fix site_settings + owner policies clients
-- Failles P-RLS-INV, P-RLS-QUOTES, P-RLS-SETTINGS, B1-OWNER-MISSING
--
-- CONTEXTE :
--   invoices/invoice_items/quotes/quote_items :
--     - Tables admin-only côté admin (pas de user_id ni organization_id)
--     - Politique actuelle : ALL WHERE auth.uid() IS NOT NULL → tout utilisateur authentifié accède
--     - Fix : supprimer la politique broad, ajouter owner SELECT basé sur client_email
--     - Callers admin utilisent createSupabaseAdmin() (service_role) → non affectés
--     - assistant/chat utilise JWT client + anon key → doit voir ses propres factures/devis
--
--   site_settings :
--     - Politique "upsert site_settings" : ALL, qual=true → TOUT le monde (anon inclus) peut écrire
--     - Fix : supprimer la politique ALL, conserver uniquement SELECT public + accès service_role
--
-- RÉVERSIBLE : voir DOWN ci-dessous (commenté)

-- ────────────────────────────────────────────────────────────────
-- 1. INVOICES — supprimer policy broad, ajouter owner SELECT
-- ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "invoices_authenticated" ON public.invoices;

-- Un client peut lire ses propres factures (adressées à son email)
CREATE POLICY "invoices_owner_select" ON public.invoices
  FOR SELECT USING (auth.email() = client_email);

-- ────────────────────────────────────────────────────────────────
-- 2. INVOICE_ITEMS — supprimer policy broad, ajouter owner SELECT
-- ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "invoice_items_authenticated" ON public.invoice_items;

-- Un client peut lire les lignes de ses factures
CREATE POLICY "invoice_items_owner_select" ON public.invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.client_email = auth.email()
    )
  );

-- ────────────────────────────────────────────────────────────────
-- 3. QUOTES — supprimer policy broad, ajouter owner SELECT
-- ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "quotes_authenticated" ON public.quotes;

-- Un client peut lire ses propres devis (adressés à son email)
CREATE POLICY "quotes_owner_select" ON public.quotes
  FOR SELECT USING (auth.email() = client_email);

-- ────────────────────────────────────────────────────────────────
-- 4. QUOTE_ITEMS — supprimer policy broad, ajouter owner SELECT
-- ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "quote_items_authenticated" ON public.quote_items;

-- Un client peut lire les lignes de ses devis
CREATE POLICY "quote_items_owner_select" ON public.quote_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quotes
      WHERE quotes.id = quote_items.quote_id
        AND quotes.client_email = auth.email()
    )
  );

-- ────────────────────────────────────────────────────────────────
-- 5. SITE_SETTINGS : supprimer la politique ALL (qual=true)
-- ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "upsert site_settings" ON public.site_settings;

-- Conserver uniquement SELECT public (lecture par le frontend)
-- Les écritures passent par /api/admin/parametres (service_role via createSupabaseAdmin)
-- La politique SELECT existante "select site_settings" (qual=true) est conservée

-- ────────────────────────────────────────────────────────────────
-- DOWN (rollback)
-- ────────────────────────────────────────────────────────────────
-- DROP POLICY IF EXISTS "invoices_owner_select" ON public.invoices;
-- DROP POLICY IF EXISTS "invoice_items_owner_select" ON public.invoice_items;
-- DROP POLICY IF EXISTS "quotes_owner_select" ON public.quotes;
-- DROP POLICY IF EXISTS "quote_items_owner_select" ON public.quote_items;
-- CREATE POLICY "invoices_authenticated" ON public.invoices FOR ALL USING (auth.uid() IS NOT NULL);
-- CREATE POLICY "invoice_items_authenticated" ON public.invoice_items FOR ALL USING (auth.uid() IS NOT NULL);
-- CREATE POLICY "quotes_authenticated" ON public.quotes FOR ALL USING (auth.uid() IS NOT NULL);
-- CREATE POLICY "quote_items_authenticated" ON public.quote_items FOR ALL USING (auth.uid() IS NOT NULL);
-- CREATE POLICY "upsert site_settings" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);
