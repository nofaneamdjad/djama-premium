-- ============================================================
-- Migration 20261123000001 — Sécurité module Dépenses
-- Non-destructive : aucune suppression de données.
-- ============================================================

-- 1. Rendre le bucket justificatifs privé
--    Les URL signées via /api/depenses/receipt-url restent fonctionnelles.
UPDATE storage.buckets
   SET public = false
 WHERE id = 'receipts';

-- 2. Table de rapprochement bancaire persistant
CREATE TABLE IF NOT EXISTS public.bank_reconciliations (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label      text,
  txs        jsonb       NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bank_reconciliations_user_id_idx
  ON public.bank_reconciliations (user_id);

ALTER TABLE public.bank_reconciliations ENABLE ROW LEVEL SECURITY;

-- Un utilisateur ne voit et ne modifie que ses propres rapprochements
DROP POLICY IF EXISTS "bank_reconciliations_own" ON public.bank_reconciliations;
CREATE POLICY "bank_reconciliations_own"
  ON public.bank_reconciliations
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
