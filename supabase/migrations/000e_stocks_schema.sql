-- ════════════════════════════════════════════════════════
-- STOCKS / INVENTAIRE — Schéma complet
-- ════════════════════════════════════════════════════════

-- ── 1. Entrepôts / Magasins ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_warehouses (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text    NOT NULL,
  address    text    DEFAULT '',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stock_warehouses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "swh_own" ON stock_warehouses;
CREATE POLICY "swh_own" ON stock_warehouses
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 2. Fournisseurs ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_suppliers (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text    NOT NULL,
  contact         text    DEFAULT '',
  email           text    DEFAULT '',
  phone           text    DEFAULT '',
  address         text    DEFAULT '',
  payment_terms   text    DEFAULT '30 jours',
  lead_time_days  integer DEFAULT 7,
  notes           text    DEFAULT '',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE stock_suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ssup_own" ON stock_suppliers;
CREATE POLICY "ssup_own" ON stock_suppliers
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 3. Produits ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_products (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id     uuid        REFERENCES stock_suppliers(id) ON DELETE SET NULL,
  warehouse_id    uuid        REFERENCES stock_warehouses(id) ON DELETE SET NULL,
  -- Identité
  name            text        NOT NULL,
  sku             text        DEFAULT '',
  barcode         text        DEFAULT '',
  description     text        DEFAULT '',
  category        text        DEFAULT 'autre',
  image_url       text        DEFAULT '',
  unit            text        DEFAULT 'pièce',    -- pièce | kg | litre | m² | boîte | palette
  -- Prix
  purchase_price  numeric     DEFAULT 0,
  sale_price      numeric     DEFAULT 0,
  vat_rate        numeric     DEFAULT 20,
  -- Stocks
  stock_current   numeric     DEFAULT 0,
  stock_minimum   numeric     DEFAULT 0,
  stock_reserved  numeric     DEFAULT 0,
  stock_on_order  numeric     DEFAULT 0,
  location        text        DEFAULT '',         -- rayon / emplacement dans entrepôt
  -- Fournisseur (dénormalisé pour performance)
  supplier_name   text        DEFAULT '',
  -- Métadonnées
  is_active       boolean     DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sprods_user     ON stock_products(user_id);
CREATE INDEX IF NOT EXISTS idx_sprods_category ON stock_products(category);
CREATE INDEX IF NOT EXISTS idx_sprods_supplier ON stock_products(supplier_id);

ALTER TABLE stock_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sprod_own" ON stock_products;
CREATE POLICY "sprod_own" ON stock_products
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 4. Mouvements de stock ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_movements (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id          uuid        REFERENCES stock_products(id) ON DELETE CASCADE,
  product_name        text        DEFAULT '',
  -- Type : entree | sortie | retour | perte | casse | transfert | ajustement
  type                text        NOT NULL,
  quantity            numeric     NOT NULL,
  before_qty          numeric     DEFAULT 0,
  after_qty           numeric     DEFAULT 0,
  -- Entrepôts
  warehouse_id        uuid        REFERENCES stock_warehouses(id) ON DELETE SET NULL,
  warehouse_name      text        DEFAULT '',
  to_warehouse_id     uuid        REFERENCES stock_warehouses(id) ON DELETE SET NULL,
  to_warehouse_name   text        DEFAULT '',
  -- Contexte
  reason              text        DEFAULT '',
  reference           text        DEFAULT '',    -- réf. facture, commande...
  unit_cost           numeric     DEFAULT 0,
  date                date        NOT NULL DEFAULT CURRENT_DATE,
  created_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_smov_user    ON stock_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_smov_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_smov_date    ON stock_movements(date);
CREATE INDEX IF NOT EXISTS idx_smov_type    ON stock_movements(type);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "smov_own" ON stock_movements;
CREATE POLICY "smov_own" ON stock_movements
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 5. Commandes fournisseurs ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_supplier_orders (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id     uuid        REFERENCES stock_suppliers(id) ON DELETE SET NULL,
  supplier_name   text        DEFAULT '',
  -- draft | sent | confirmed | received | cancelled
  status          text        DEFAULT 'draft',
  order_date      date        DEFAULT CURRENT_DATE,
  expected_date   date,
  total_amount    numeric     DEFAULT 0,
  notes           text        DEFAULT '',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE stock_supplier_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sord_own" ON stock_supplier_orders;
CREATE POLICY "sord_own" ON stock_supplier_orders
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 6. Lignes de commandes fournisseurs ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_order_items (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid    REFERENCES stock_supplier_orders(id) ON DELETE CASCADE,
  product_id      uuid    REFERENCES stock_products(id) ON DELETE SET NULL,
  product_name    text    DEFAULT '',
  quantity        numeric DEFAULT 0,
  unit_price      numeric DEFAULT 0,
  total_price     numeric DEFAULT 0
);

-- Pas de RLS direct sur les items (héritage via order_id + user_id sur la commande)
ALTER TABLE stock_order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sitem_own" ON stock_order_items;
CREATE POLICY "sitem_own" ON stock_order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM stock_supplier_orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );

-- ── 7. Triggers updated_at ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_stock_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sprod_updated_at ON stock_products;
CREATE TRIGGER sprod_updated_at
  BEFORE UPDATE ON stock_products
  FOR EACH ROW EXECUTE FUNCTION update_stock_timestamp();

DROP TRIGGER IF EXISTS ssup_updated_at ON stock_suppliers;
CREATE TRIGGER ssup_updated_at
  BEFORE UPDATE ON stock_suppliers
  FOR EACH ROW EXECUTE FUNCTION update_stock_timestamp();

DROP TRIGGER IF EXISTS sord_updated_at ON stock_supplier_orders;
CREATE TRIGGER sord_updated_at
  BEFORE UPDATE ON stock_supplier_orders
  FOR EACH ROW EXECUTE FUNCTION update_stock_timestamp();
