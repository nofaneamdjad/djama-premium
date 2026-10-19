-- ════════════════════════════════════════════════════════════════════════
-- 164_rls_shop_audio.sql — Tables boutique manquantes + RLS + bucket audio
-- ════════════════════════════════════════════════════════════════════════
--
-- La migration 126_shop.sql a un bug de forward-reference :
-- shop_orders référence shop_promotions qui est défini APRÈS dans le même
-- fichier → PostgreSQL échoue sur la FK → toutes les tables shop manquent
-- en production.
--
-- Cette migration crée les tables dans le bon ordre (shop_promotions d'abord)
-- et est entièrement idempotente (CREATE TABLE IF NOT EXISTS).
--
-- Corrections incluses :
--   1. Créer toutes les tables shop manquantes dans le bon ordre
--   2. RLS sur shop_order_items (via shop_orders.user_id)
--   3. RLS sur shop_product_collections (via shop_collections.user_id)
--   4. Bucket audio-notes (privé, per-user)

-- ─── Extensions stock_products pour e-commerce ───────────────────────────
ALTER TABLE stock_products ADD COLUMN IF NOT EXISTS sell_online          boolean       DEFAULT false;
ALTER TABLE stock_products ADD COLUMN IF NOT EXISTS sell_pos             boolean       DEFAULT true;
ALTER TABLE stock_products ADD COLUMN IF NOT EXISTS short_description    text          DEFAULT '';
ALTER TABLE stock_products ADD COLUMN IF NOT EXISTS long_description     text          DEFAULT '';
ALTER TABLE stock_products ADD COLUMN IF NOT EXISTS slug                 text;
ALTER TABLE stock_products ADD COLUMN IF NOT EXISTS compare_price        numeric(12,2);
ALTER TABLE stock_products ADD COLUMN IF NOT EXISTS weight               numeric(8,3);
ALTER TABLE stock_products ADD COLUMN IF NOT EXISTS allow_backorder      boolean       DEFAULT false;
ALTER TABLE stock_products ADD COLUMN IF NOT EXISTS featured             boolean       DEFAULT false;
ALTER TABLE stock_products ADD COLUMN IF NOT EXISTS meta_title           text          DEFAULT '';
ALTER TABLE stock_products ADD COLUMN IF NOT EXISTS meta_description     text          DEFAULT '';
ALTER TABLE stock_products ADD COLUMN IF NOT EXISTS is_digital           boolean       DEFAULT false;
ALTER TABLE stock_products ADD COLUMN IF NOT EXISTS digital_file_url     text          DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_stock_products_slug     ON stock_products(user_id, slug)         WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stock_products_online   ON stock_products(user_id, sell_online)  WHERE sell_online = true;
CREATE INDEX IF NOT EXISTS idx_stock_products_featured ON stock_products(user_id, featured)     WHERE featured = true;

-- ─── Configuration boutique ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_config (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id  uuid    REFERENCES organizations(id) ON DELETE SET NULL,
  shop_name        text    NOT NULL DEFAULT '',
  shop_description text    DEFAULT '',
  logo_url         text    DEFAULT '',
  favicon_url      text    DEFAULT '',
  domain           text    DEFAULT '',
  subdomain        text    DEFAULT '',
  currency         text    NOT NULL DEFAULT 'EUR',
  currency_symbol  text    NOT NULL DEFAULT '€',
  tax_rate         numeric(5,2) NOT NULL DEFAULT 20,
  tax_included     boolean NOT NULL DEFAULT false,
  guest_checkout   boolean NOT NULL DEFAULT true,
  is_published     boolean NOT NULL DEFAULT false,
  primary_color    text    DEFAULT '#c9a55a',
  storefront_config jsonb  DEFAULT '{}',
  seo_title        text    DEFAULT '',
  seo_description  text    DEFAULT '',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shop_config_user ON shop_config(user_id);

ALTER TABLE shop_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shop_config_own" ON shop_config;
CREATE POLICY "shop_config_own" ON shop_config
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ─── Collections ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_collections (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             text    NOT NULL,
  slug             text    NOT NULL,
  description      text    DEFAULT '',
  image_url        text    DEFAULT '',
  is_active        boolean NOT NULL DEFAULT true,
  sort_order       integer NOT NULL DEFAULT 0,
  meta_title       text    DEFAULT '',
  meta_description text    DEFAULT '',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shop_collections_slug ON shop_collections(user_id, slug);
CREATE INDEX IF NOT EXISTS idx_shop_collections_user ON shop_collections(user_id);

ALTER TABLE shop_collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shop_collections_own" ON shop_collections;
CREATE POLICY "shop_collections_own" ON shop_collections
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ─── Promotions / codes promo (doit exister AVANT shop_orders) ────────────
CREATE TABLE IF NOT EXISTS shop_promotions (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code          text    NOT NULL,
  description   text    DEFAULT '',
  type          text    NOT NULL DEFAULT 'pct'
    CHECK (type IN ('pct','fixed','free_shipping')),
  value         numeric(12,2) NOT NULL DEFAULT 0 CHECK (value >= 0),
  min_order     numeric(12,2),
  max_uses      integer,
  used_count    integer NOT NULL DEFAULT 0,
  starts_at     timestamptz,
  expires_at    timestamptz,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shop_promotions_code ON shop_promotions(user_id, code);

ALTER TABLE shop_promotions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shop_promotions_own" ON shop_promotions;
CREATE POLICY "shop_promotions_own" ON shop_promotions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ─── Commandes (après shop_promotions pour la FK) ─────────────────────────
CREATE TABLE IF NOT EXISTS shop_orders (
  id                        uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id           uuid    REFERENCES organizations(id),
  order_number              text    NOT NULL,
  contact_id                uuid    REFERENCES contacts(id) ON DELETE SET NULL,
  customer_name             text    NOT NULL DEFAULT '',
  customer_email            text    NOT NULL DEFAULT '',
  customer_phone            text    DEFAULT '',
  shipping_name             text    DEFAULT '',
  shipping_address1         text    DEFAULT '',
  shipping_address2         text    DEFAULT '',
  shipping_city             text    DEFAULT '',
  shipping_zip              text    DEFAULT '',
  shipping_country          text    DEFAULT 'FR',
  payment_status            text    NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending','paid','partial','refunded','failed')),
  fulfillment_status        text    NOT NULL DEFAULT 'unfulfilled'
    CHECK (fulfillment_status IN ('unfulfilled','preparing','ready','shipped','delivered','cancelled')),
  subtotal                  numeric(12,2) NOT NULL DEFAULT 0,
  shipping_amount           numeric(12,2) NOT NULL DEFAULT 0,
  discount_amount           numeric(12,2) NOT NULL DEFAULT 0,
  tax_amount                numeric(12,2) NOT NULL DEFAULT 0,
  total                     numeric(12,2) NOT NULL DEFAULT 0,
  promo_code                text    DEFAULT '',
  promotion_id              uuid    REFERENCES shop_promotions(id) ON DELETE SET NULL,
  payment_method            text    DEFAULT '',
  payment_reference         text    DEFAULT '',
  stripe_payment_intent_id  text    DEFAULT '',
  paid_at                   timestamptz,
  shipped_at                timestamptz,
  delivered_at              timestamptz,
  tracking_number           text    DEFAULT '',
  tracking_url              text    DEFAULT '',
  customer_note             text    DEFAULT '',
  internal_note             text    DEFAULT '',
  document_id               uuid    REFERENCES documents(id) ON DELETE SET NULL,
  source                    text    NOT NULL DEFAULT 'storefront'
    CHECK (source IN ('storefront','admin','api')),
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shop_orders_user    ON shop_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_status  ON shop_orders(user_id, payment_status, fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_shop_orders_contact ON shop_orders(contact_id) WHERE contact_id IS NOT NULL;

ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shop_orders_own" ON shop_orders;
CREATE POLICY "shop_orders_own" ON shop_orders
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ─── Lignes commandes + RLS via shop_orders ───────────────────────────────
CREATE TABLE IF NOT EXISTS shop_order_items (
  id                       uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                 uuid    NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
  product_id               uuid    REFERENCES stock_products(id) ON DELETE SET NULL,
  product_name             text    NOT NULL,
  product_sku              text    DEFAULT '',
  variant_info             text    DEFAULT '',
  quantity                 integer NOT NULL CHECK (quantity > 0),
  unit_price               numeric(12,2) NOT NULL,
  compare_price            numeric(12,2),
  discount_pct             numeric(5,2)  NOT NULL DEFAULT 0,
  vat_rate                 numeric(5,2)  NOT NULL DEFAULT 20,
  line_total               numeric(12,2) NOT NULL,
  image_url                text    DEFAULT '',
  is_digital               boolean NOT NULL DEFAULT false,
  digital_download_token   text    DEFAULT '',
  digital_downloaded_at    timestamptz,
  created_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shop_order_items_order ON shop_order_items(order_id);

ALTER TABLE shop_order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shop_order_items_own" ON shop_order_items;
CREATE POLICY "shop_order_items_own" ON shop_order_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shop_orders
      WHERE id = shop_order_items.order_id
        AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shop_orders
      WHERE id = shop_order_items.order_id
        AND user_id = auth.uid()
    )
  );

-- ─── Produit ↔ collection + RLS via shop_collections ─────────────────────
CREATE TABLE IF NOT EXISTS shop_product_collections (
  product_id    uuid NOT NULL REFERENCES stock_products(id) ON DELETE CASCADE,
  collection_id uuid NOT NULL REFERENCES shop_collections(id) ON DELETE CASCADE,
  sort_order    integer NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, collection_id)
);

ALTER TABLE shop_product_collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shop_product_collections_own" ON shop_product_collections;
CREATE POLICY "shop_product_collections_own" ON shop_product_collections
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shop_collections
      WHERE id = shop_product_collections.collection_id
        AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shop_collections
      WHERE id = shop_product_collections.collection_id
        AND user_id = auth.uid()
    )
  );

-- ─── Zones livraison ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_shipping_zones (
  id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                text    NOT NULL,
  countries           text[]  NOT NULL DEFAULT '{FR}',
  type                text    NOT NULL DEFAULT 'flat'
    CHECK (type IN ('flat','free','pickup')),
  rate                numeric(8,2) NOT NULL DEFAULT 0,
  free_above          numeric(12,2),
  estimated_days_min  integer,
  estimated_days_max  integer,
  is_active           boolean NOT NULL DEFAULT true,
  sort_order          integer NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE shop_shipping_zones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shop_shipping_own" ON shop_shipping_zones;
CREATE POLICY "shop_shipping_own" ON shop_shipping_zones
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ─── Bucket audio-notes (privé, per-user) ─────────────────────────────────
-- Chemin attendu : {user_id}/{timestamp}.{ext}
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-notes',
  'audio-notes',
  false,
  52428800,
  ARRAY[
    'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4',
    'audio/wav',  'audio/aac', 'video/webm'
  ]
) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "audio_notes_insert_own" ON storage.objects;
CREATE POLICY "audio_notes_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'audio-notes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "audio_notes_select_own" ON storage.objects;
CREATE POLICY "audio_notes_select_own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'audio-notes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "audio_notes_delete_own" ON storage.objects;
CREATE POLICY "audio_notes_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'audio-notes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
