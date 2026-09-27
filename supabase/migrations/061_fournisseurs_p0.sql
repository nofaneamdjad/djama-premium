-- ════════════════════════════════════════════════════════════════
-- FOURNISSEURS P0 — Sécurité financière
-- 1. vat_rate paramétrable (0 / 5.5 / 10 / 20 %) sur commandes et factures
-- 2. Recalcul serveur des montants via trigger (subtotal + vat_rate → vat_amount + total_amount)
--    Le frontend ne peut pas soumettre de montants incorrects.
-- 3. Lien idempotent facture fournisseur → Dépense (supplier_invoice_id FK UNIQUE)
-- ════════════════════════════════════════════════════════════════

-- ── 1. vat_rate sur fournisseur_orders ───────────────────────────────────
ALTER TABLE fournisseur_orders
  ADD COLUMN IF NOT EXISTS vat_rate numeric(5,2) NOT NULL DEFAULT 20;

-- ── 2. vat_rate sur fournisseur_invoices ──────────────────────────────────
ALTER TABLE fournisseur_invoices
  ADD COLUMN IF NOT EXISTS vat_rate numeric(5,2) NOT NULL DEFAULT 20;

-- ── 3. Trigger : recalcul server-side HT → TVA → TTC (commandes) ─────────
CREATE OR REPLACE FUNCTION recalculate_fourn_order_amounts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.vat_amount   := ROUND((NEW.subtotal * NEW.vat_rate / 100.0)::numeric, 2);
  NEW.total_amount := NEW.subtotal + NEW.vat_amount;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fourn_order_amounts ON fournisseur_orders;
CREATE TRIGGER trg_fourn_order_amounts
  BEFORE INSERT OR UPDATE OF subtotal, vat_rate ON fournisseur_orders
  FOR EACH ROW EXECUTE FUNCTION recalculate_fourn_order_amounts();

-- ── 4. Trigger : recalcul server-side HT → TVA → TTC (factures) ──────────
CREATE OR REPLACE FUNCTION recalculate_fourn_invoice_amounts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.vat_amount   := ROUND((NEW.subtotal * NEW.vat_rate / 100.0)::numeric, 2);
  NEW.total_amount := NEW.subtotal + NEW.vat_amount;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fourn_invoice_amounts ON fournisseur_invoices;
CREATE TRIGGER trg_fourn_invoice_amounts
  BEFORE INSERT OR UPDATE OF subtotal, vat_rate ON fournisseur_invoices
  FOR EACH ROW EXECUTE FUNCTION recalculate_fourn_invoice_amounts();

-- ── 5. Colonne supplier_invoice_id sur expenses (lien idempotent) ─────────
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS supplier_invoice_id uuid
    REFERENCES fournisseur_invoices(id) ON DELETE SET NULL;

-- Index unique partiel : une facture fournisseur crée au plus une dépense.
CREATE UNIQUE INDEX IF NOT EXISTS idx_expenses_supplier_invoice
  ON expenses(supplier_invoice_id)
  WHERE supplier_invoice_id IS NOT NULL;

-- ── 6. Trigger : création automatique d'une dépense au paiement ───────────
-- SECURITY DEFINER pour bypasser RLS tout en conservant le user_id correct.
CREATE OR REPLACE FUNCTION sync_supplier_invoice_expense()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'paid' THEN
    INSERT INTO expenses (
      user_id,
      date,
      amount,
      currency,
      category,
      description,
      payment_method,
      status,
      vat_amount,
      vat_recoverable,
      invoice_number,
      notes,
      supplier_invoice_id
    ) VALUES (
      NEW.user_id,
      COALESCE(NEW.payment_date, CURRENT_DATE),
      NEW.total_amount,
      NEW.currency,
      'fournitures',
      NEW.fournisseur_name ||
        CASE WHEN NEW.invoice_number <> '' THEN ' — ' || NEW.invoice_number ELSE '' END,
      COALESCE(NULLIF(NEW.payment_method, ''), 'virement'),
      'approved',
      NEW.vat_amount,
      false,
      NEW.invoice_number,
      NEW.notes,
      NEW.id
    )
    ON CONFLICT (supplier_invoice_id) WHERE supplier_invoice_id IS NOT NULL
    DO UPDATE SET
      amount         = EXCLUDED.amount,
      vat_amount     = EXCLUDED.vat_amount,
      payment_method = EXCLUDED.payment_method,
      description    = EXCLUDED.description,
      date           = EXCLUDED.date,
      notes          = EXCLUDED.notes;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_supplier_invoice_expense ON fournisseur_invoices;
CREATE TRIGGER trg_sync_supplier_invoice_expense
  AFTER INSERT OR UPDATE OF status ON fournisseur_invoices
  FOR EACH ROW EXECUTE FUNCTION sync_supplier_invoice_expense();
