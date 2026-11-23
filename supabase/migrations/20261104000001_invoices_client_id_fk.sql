-- ══════════════════════════════════════════════════════════════════════════
-- Migration 20261104000001 — invoices/quotes : owner policy via client_id FK
-- ══════════════════════════════════════════════════════════════════════════
-- Contexte : la policy auth.email() = client_email est fragile si
-- enable_confirmations = false (inscription immédiate avec l'email d'un client).
-- Solution : ajouter client_id (FK → auth.users), renseigné lors de la première
-- connexion au portail. Policy : auth.uid() = client_id.
--
-- Rétro-compatibilité : la colonne est nullable — les factures existantes ont
-- client_id NULL et restent inaccessibles au portail jusqu'au premier login.
-- ══════════════════════════════════════════════════════════════════════════

-- ── 1. Colonne client_id sur invoices ────────────────────────────────────────
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id)
  WHERE client_id IS NOT NULL;

-- ── 2. Colonne client_id sur quotes ──────────────────────────────────────────
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON public.quotes(client_id)
  WHERE client_id IS NOT NULL;

-- ── 3. Remplacer les policies email → uid ────────────────────────────────────
DROP POLICY IF EXISTS "invoices_owner_select" ON public.invoices;
DROP POLICY IF EXISTS "invoice_items_owner_select" ON public.invoice_items;
DROP POLICY IF EXISTS "quotes_owner_select" ON public.quotes;
DROP POLICY IF EXISTS "quote_items_owner_select" ON public.quote_items;

-- invoices : un client voit ses factures si son uid correspond au client_id
-- OU si son email correspond (pour les factures antérieures sans client_id)
-- après migration complète, retirer la branche email
CREATE POLICY "invoices_owner_select" ON public.invoices
  FOR SELECT USING (
    auth.uid() = client_id
    OR (client_id IS NULL AND auth.email() = client_email)
  );

CREATE POLICY "invoice_items_owner_select" ON public.invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND (
          invoices.client_id = auth.uid()
          OR (invoices.client_id IS NULL AND invoices.client_email = auth.email())
        )
    )
  );

CREATE POLICY "quotes_owner_select" ON public.quotes
  FOR SELECT USING (
    auth.uid() = client_id
    OR (client_id IS NULL AND auth.email() = client_email)
  );

CREATE POLICY "quote_items_owner_select" ON public.quote_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quotes
      WHERE quotes.id = quote_items.quote_id
        AND (
          quotes.client_id = auth.uid()
          OR (quotes.client_id IS NULL AND quotes.client_email = auth.email())
        )
    )
  );

-- ── 4. Fonction pour lier un client à ses documents lors de son premier login ─
-- À appeler depuis le portail : POST /api/client/link-account
-- ou via un trigger sur auth.users (insert) si l'email correspond.
CREATE OR REPLACE FUNCTION public.link_client_to_documents(p_user_id uuid, p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Relier toutes les factures dont client_email correspond
  UPDATE public.invoices
  SET client_id = p_user_id
  WHERE client_email = p_email
    AND client_id IS NULL;

  -- Relier tous les devis
  UPDATE public.quotes
  SET client_id = p_user_id
  WHERE client_email = p_email
    AND client_id IS NULL;
END;
$$;

-- Seul service_role peut appeler cette fonction
REVOKE EXECUTE ON FUNCTION public.link_client_to_documents(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.link_client_to_documents(uuid, text) TO service_role;

-- ── DOWN (rollback) ───────────────────────────────────────────────────────────
-- DROP POLICY IF EXISTS "invoices_owner_select" ON public.invoices;
-- DROP POLICY IF EXISTS "invoice_items_owner_select" ON public.invoice_items;
-- DROP POLICY IF EXISTS "quotes_owner_select" ON public.quotes;
-- DROP POLICY IF EXISTS "quote_items_owner_select" ON public.quote_items;
-- ALTER TABLE public.invoices DROP COLUMN IF EXISTS client_id;
-- ALTER TABLE public.quotes   DROP COLUMN IF EXISTS client_id;
-- DROP FUNCTION IF EXISTS public.link_client_to_documents(uuid,text);
-- -- Puis recréer les policies auth.email() de la migration 20261103000003
