-- ════════════════════════════════════════════════════════════════
-- FOURNISSEURS P1.4 — Lien Fournisseurs ↔ Stocks
-- 1. stock_suppliers.fournisseur_id    → FK nullable vers fournisseurs
-- 2. fournisseur_order_items.stock_product_id → FK nullable vers stock_products
-- 3. fournisseur_orders.reception_processed   → idempotence trigger
-- 4. Trigger : réception commande → mise à jour stock + mouvement
-- ════════════════════════════════════════════════════════════════

-- ── 1. Lien stock_suppliers → fournisseurs ────────────────────────────────────
ALTER TABLE stock_suppliers
  ADD COLUMN IF NOT EXISTS fournisseur_id uuid
    REFERENCES fournisseurs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ssup_fournisseur ON stock_suppliers(fournisseur_id)
  WHERE fournisseur_id IS NOT NULL;

-- ── 2. Lien fournisseur_order_items → stock_products ─────────────────────────
ALTER TABLE fournisseur_order_items
  ADD COLUMN IF NOT EXISTS stock_product_id uuid
    REFERENCES stock_products(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_fitem_stock_product ON fournisseur_order_items(stock_product_id)
  WHERE stock_product_id IS NOT NULL;

-- ── 3. Flag idempotence réception ─────────────────────────────────────────────
-- Empêche le double-comptage si le statut repasse à "received" après modification.
ALTER TABLE fournisseur_orders
  ADD COLUMN IF NOT EXISTS reception_processed boolean NOT NULL DEFAULT false;

-- ── 4. Trigger réception → mise à jour stock ──────────────────────────────────
-- BEFORE UPDATE (pour pouvoir modifier NEW.reception_processed et retourner NEW).
-- SECURITY DEFINER : doit mettre à jour stock_products et stock_movements
-- même si le user n'a pas de policy d'écriture directe sur ces tables via cet appel.
-- La sécurité est garantie par : (a) trigger déclenché uniquement par une MAJ
-- authentifiée de fournisseur_orders soumise à RLS, (b) on utilise le user_id
-- de la commande, pas un user arbitraire.

CREATE OR REPLACE FUNCTION sync_fourn_order_to_stock()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  r RECORD;
BEGIN
  -- Condition : première fois que la commande passe à "received"
  IF NEW.status = 'received'
     AND OLD.status IS DISTINCT FROM 'received'
     AND NOT OLD.reception_processed
  THEN
    NEW.reception_processed := true;

    -- Boucle sur les lignes liées à un produit stock avec quantité reçue > 0
    FOR r IN
      SELECT foi.stock_product_id,
             foi.name           AS item_name,
             foi.received_quantity,
             foi.unit_price,
             sp.stock_current   AS before_qty
      FROM   fournisseur_order_items foi
      JOIN   stock_products sp ON sp.id = foi.stock_product_id
      WHERE  foi.order_id = NEW.id
        AND  foi.stock_product_id IS NOT NULL
        AND  foi.received_quantity > 0
    LOOP
      -- Mise à jour du stock courant
      UPDATE stock_products
         SET stock_current = stock_current + r.received_quantity
       WHERE id = r.stock_product_id;

      -- Enregistrement du mouvement d'entrée
      INSERT INTO stock_movements (
        user_id, product_id, product_name,
        type, quantity, before_qty, after_qty,
        reason, reference, unit_cost, date
      ) VALUES (
        NEW.user_id,
        r.stock_product_id,
        r.item_name,
        'entree',
        r.received_quantity,
        r.before_qty,
        r.before_qty + r.received_quantity,
        'Réception commande fournisseur',
        NEW.order_number,
        r.unit_price,
        COALESCE(NEW.received_date, CURRENT_DATE)
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fourn_order_reception ON fournisseur_orders;
CREATE TRIGGER trg_fourn_order_reception
  BEFORE UPDATE OF status ON fournisseur_orders
  FOR EACH ROW EXECUTE FUNCTION sync_fourn_order_to_stock();
