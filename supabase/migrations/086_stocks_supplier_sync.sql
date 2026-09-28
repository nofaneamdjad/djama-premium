-- ════════════════════════════════════════════════════════════════════════════════
-- 086 — Stocks : synchronisation supplier_name + ON DELETE RESTRICT
--
-- P2-04 : Trigger — quand stock_suppliers.name change, propager à
--          stock_products.supplier_name pour tous les produits liés.
-- P2-05 : Changer ON DELETE SET NULL → ON DELETE RESTRICT sur
--          stock_products.supplier_id (évite la suppression silencieuse).
-- ════════════════════════════════════════════════════════════════════════════════

-- ── 1. Fonction de synchronisation supplier_name ────────────────────────────────
CREATE OR REPLACE FUNCTION sync_stock_supplier_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    UPDATE stock_products
       SET supplier_name = NEW.name,
           updated_at    = now()
     WHERE supplier_id = OLD.id
       AND user_id     = OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_supplier_name ON stock_suppliers;
CREATE TRIGGER trg_sync_supplier_name
  AFTER UPDATE OF name ON stock_suppliers
  FOR EACH ROW EXECUTE FUNCTION sync_stock_supplier_name();

-- ── 2. ON DELETE RESTRICT sur stock_products.supplier_id ───────────────────────
-- Remplace ON DELETE SET NULL : empêche la suppression d'un fournisseur s'il
-- est encore référencé par des produits, plutôt que de silencieusement effacer
-- le lien.  Le frontend affiche un message d'erreur explicite (code 23503).
DO $$
DECLARE v_conname text;
BEGIN
  SELECT conname INTO v_conname
    FROM pg_constraint
   WHERE conrelid  = 'stock_products'::regclass
     AND confrelid = 'stock_suppliers'::regclass
     AND contype   = 'f'
   LIMIT 1;

  IF v_conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE stock_products DROP CONSTRAINT %I', v_conname);
  END IF;
END;
$$;

ALTER TABLE stock_products
  ADD CONSTRAINT stock_products_supplier_id_fkey
  FOREIGN KEY (supplier_id)
  REFERENCES stock_suppliers(id)
  ON DELETE RESTRICT;
