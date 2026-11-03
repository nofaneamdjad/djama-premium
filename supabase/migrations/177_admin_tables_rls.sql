-- Migration 177 : RLS deny-all pour tables admin-only + fix site_settings
-- Failles P-RLS-INV, P-RLS-QUOTES, P-RLS-SETTINGS
--
-- CONTEXTE :
--   invoices/invoice_items/quotes/quote_items :
--     - Tables admin-only (pas de user_id ni organization_id)
--     - Politique actuelle : ALL WHERE auth.uid() IS NOT NULL → tout utilisateur authentifié accède
--     - Fix : supprimer la politique et n'autoriser que service_role (via bypass RLS)
--
--   site_settings :
--     - Politique "upsert site_settings" : ALL, qual=true → TOUT le monde (anon inclus) peut écrire
--     - Fix : supprimer la politique ALL, conserver uniquement SELECT public + accès service_role
--
-- RÉVERSIBLE : voir DOWN ci-dessous (commenté)

-- ────────────────────────────────────────────────────────────────
-- 1. INVOICES
-- ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "invoices_authenticated" ON public.invoices;

-- Pas de nouvelle politique : service_role bypass RLS automatiquement
-- Les routes admin utilisent createSupabaseAdmin() (service_role) — pas d'impact

-- ────────────────────────────────────────────────────────────────
-- 2. INVOICE_ITEMS
-- ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "invoice_items_authenticated" ON public.invoice_items;

-- ────────────────────────────────────────────────────────────────
-- 3. QUOTES
-- ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "quotes_authenticated" ON public.quotes;

-- ────────────────────────────────────────────────────────────────
-- 4. QUOTE_ITEMS
-- ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "quote_items_authenticated" ON public.quote_items;

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
-- CREATE POLICY "invoices_authenticated" ON public.invoices FOR ALL USING (auth.uid() IS NOT NULL);
-- CREATE POLICY "invoice_items_authenticated" ON public.invoice_items FOR ALL USING (auth.uid() IS NOT NULL);
-- CREATE POLICY "quotes_authenticated" ON public.quotes FOR ALL USING (auth.uid() IS NOT NULL);
-- CREATE POLICY "quote_items_authenticated" ON public.quote_items FOR ALL USING (auth.uid() IS NOT NULL);
-- CREATE POLICY "upsert site_settings" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);
