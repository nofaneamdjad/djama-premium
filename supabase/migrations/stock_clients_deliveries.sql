-- ──────────────────────────────────────────────────────────────────────
-- Clients fidèles (stock_loyal_clients) + Livraisons (stock_client_deliveries)
-- Safe to run multiple times (IF NOT EXISTS / idempotent)
-- ──────────────────────────────────────────────────────────────────────

-- 1. Clients fidèles
CREATE TABLE IF NOT EXISTS stock_loyal_clients (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text NOT NULL DEFAULT '',
  email         text NOT NULL DEFAULT '',
  phone         text NOT NULL DEFAULT '',
  address       text NOT NULL DEFAULT '',
  notes         text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE stock_loyal_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_owner" ON stock_loyal_clients;
CREATE POLICY "clients_owner" ON stock_loyal_clients
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS stock_loyal_clients_user_id_idx ON stock_loyal_clients(user_id);

-- 2. Livraisons clients
CREATE TABLE IF NOT EXISTS stock_client_deliveries (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id     uuid REFERENCES stock_loyal_clients(id) ON DELETE SET NULL,
  client_name   text NOT NULL DEFAULT '',
  product_id    uuid REFERENCES stock_products(id) ON DELETE SET NULL,
  product_name  text NOT NULL DEFAULT '',
  quantity      numeric NOT NULL DEFAULT 1,
  unit          text NOT NULL DEFAULT 'pièce',
  delivery_date date NOT NULL DEFAULT CURRENT_DATE,
  notes         text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE stock_client_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deliveries_owner" ON stock_client_deliveries;
CREATE POLICY "deliveries_owner" ON stock_client_deliveries
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS stock_client_deliveries_user_id_idx ON stock_client_deliveries(user_id);
CREATE INDEX IF NOT EXISTS stock_client_deliveries_client_id_idx ON stock_client_deliveries(client_id);
CREATE INDEX IF NOT EXISTS stock_client_deliveries_date_idx ON stock_client_deliveries(delivery_date DESC);
