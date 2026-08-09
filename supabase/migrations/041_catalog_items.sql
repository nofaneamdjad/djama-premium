-- ── Migration 041 : Catalogue articles persistant ────────────────────────────
-- Table pour mémoriser les articles/prestations fréquemment utilisés

CREATE TABLE IF NOT EXISTS catalog_items (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  unit        text DEFAULT '',
  unit_price  numeric(12,2) DEFAULT 0,
  vat_rate    numeric(5,2)  DEFAULT 20,
  created_at  timestamptz   DEFAULT now()
);

ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalog_items_user_policy"
  ON catalog_items FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS catalog_items_user_id_idx ON catalog_items(user_id);
