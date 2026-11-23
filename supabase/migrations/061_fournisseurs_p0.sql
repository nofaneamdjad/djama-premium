-- ════════════════════════════════════════════════════════════════
-- FOURNISSEURS P0 — Sécurité financière
-- ════════════════════════════════════════════════════════════════

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='fournisseur_orders') THEN
    ALTER TABLE fournisseur_orders
      ADD COLUMN IF NOT EXISTS vat_rate numeric(5,2) NOT NULL DEFAULT 20;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='fournisseur_invoices') THEN
    ALTER TABLE fournisseur_invoices
      ADD COLUMN IF NOT EXISTS vat_rate numeric(5,2) NOT NULL DEFAULT 20;
  END IF;
END $$;

-- Fonctions trigger (safe à créer même si les tables n'existent pas encore)
CREATE OR REPLACE FUNCTION recalculate_fourn_order_amounts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.vat_amount   := ROUND((NEW.subtotal * NEW.vat_rate / 100.0)::numeric, 2);
  NEW.total_amount := NEW.subtotal + NEW.vat_amount;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION recalculate_fourn_invoice_amounts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.vat_amount   := ROUND((NEW.subtotal * NEW.vat_rate / 100.0)::numeric, 2);
  NEW.total_amount := NEW.subtotal + NEW.vat_amount;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='fournisseur_orders') THEN
    EXECUTE $t$
      DROP TRIGGER IF EXISTS trg_fourn_order_amounts ON fournisseur_orders;
      CREATE TRIGGER trg_fourn_order_amounts
        BEFORE INSERT OR UPDATE OF subtotal, vat_rate ON fournisseur_orders
        FOR EACH ROW EXECUTE FUNCTION recalculate_fourn_order_amounts();
    $t$;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='fournisseur_invoices') THEN
    EXECUTE $t$
      DROP TRIGGER IF EXISTS trg_fourn_invoice_amounts ON fournisseur_invoices;
      CREATE TRIGGER trg_fourn_invoice_amounts
        BEFORE INSERT OR UPDATE OF subtotal, vat_rate ON fournisseur_invoices
        FOR EACH ROW EXECUTE FUNCTION recalculate_fourn_invoice_amounts();
    $t$;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='fournisseur_invoices')
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='expenses') THEN
    ALTER TABLE expenses
      ADD COLUMN IF NOT EXISTS supplier_invoice_id uuid
        REFERENCES fournisseur_invoices(id) ON DELETE SET NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_expenses_supplier_invoice
      ON expenses(supplier_invoice_id)
      WHERE supplier_invoice_id IS NOT NULL;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION sync_supplier_invoice_expense()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'paid' THEN
    INSERT INTO expenses (
      user_id, date, amount, currency, category, description,
      payment_method, status, vat_amount, vat_recoverable,
      invoice_number, notes, supplier_invoice_id
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

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='fournisseur_invoices') THEN
    EXECUTE $t$
      DROP TRIGGER IF EXISTS trg_sync_supplier_invoice_expense ON fournisseur_invoices;
      CREATE TRIGGER trg_sync_supplier_invoice_expense
        AFTER INSERT OR UPDATE OF status ON fournisseur_invoices
        FOR EACH ROW EXECUTE FUNCTION sync_supplier_invoice_expense();
    $t$;
  END IF;
END $$;
