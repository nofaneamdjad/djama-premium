-- ════════════════════════════════════════════════════════════════════════════════
-- 089 — Stocks avancés : Phases 6 + 7
--
-- Phase 6 — Clients/Ventes → Stocks :
--   document_items.stock_product_id  — lien ligne de facture ↔ produit stock
--   documents.stock_applied          — flag idempotence (appliqué au stock)
--   RPC apply_document_to_stock()    — facture → SORTIE, avoir → RETOUR
--
-- Phase 7 — Fonctions avancées :
--   stock_lots                       — lots / numéros de série / DLC
--   stock_product_locations          — stock par entrepôt pour un même produit
--   stock_alert_config               — seuils d'alerte email/push par produit
--   Index composites sur stock_products
-- ════════════════════════════════════════════════════════════════════════════════

-- ── Phase 6 : liaison document_items ↔ stock_products ────────────────────────

-- Colonne optionnelle sur les lignes de facture/devis/avoir
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name   = 'document_items'
       AND column_name  = 'stock_product_id'
  ) THEN
    ALTER TABLE public.document_items
      ADD COLUMN stock_product_id uuid
        REFERENCES public.stock_products(id) ON DELETE SET NULL;
  END IF;
END; $$;

-- Flag idempotence : évite de doubler les mouvements sur la même facture
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name   = 'documents'
       AND column_name  = 'stock_applied'
  ) THEN
    ALTER TABLE public.documents
      ADD COLUMN stock_applied boolean NOT NULL DEFAULT false;
  END IF;
END; $$;

-- ── Phase 6 : RPC apply_document_to_stock ────────────────────────────────────
-- Génère des mouvements stock à partir d'une facture ou d'un avoir.
--   • facture  (type = 'facture') → mouvement SORTIE par ligne avec stock_product_id
--   • avoir    (type = 'avoir')   → mouvement RETOUR par ligne avec stock_product_id
--              L'avoir peut pointer vers sa facture source via documents.source_id.
-- Garanties :
--   • Idempotent : bloqué si stock_applied = true.
--   • user_id vérifié via auth.uid() — pas de confiance au frontend.
--   • Verrouillage produit FOR UPDATE dans la transaction.
--   • SECURITY DEFINER + SET search_path = public.

CREATE OR REPLACE FUNCTION public.apply_document_to_stock(p_document_id uuid)
RETURNS integer   -- nombre de mouvements créés
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    uuid := auth.uid();
  v_doc        documents%ROWTYPE;
  v_item       RECORD;
  v_before_qty numeric;
  v_mov_type   text;
  v_count      integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  -- Verrouiller le document et vérifier l'appartenance
  SELECT * INTO v_doc
    FROM documents
   WHERE id = p_document_id AND user_id = v_user_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document introuvable ou accès refusé';
  END IF;

  IF v_doc.type NOT IN ('facture', 'avoir') THEN
    RAISE EXCEPTION 'Seules les factures et avoirs peuvent être appliqués au stock (type reçu : %)', v_doc.type;
  END IF;

  IF v_doc.stock_applied THEN
    RAISE EXCEPTION 'Ce document a déjà été appliqué au stock';
  END IF;

  -- Type de mouvement selon le type de document
  v_mov_type := CASE v_doc.type WHEN 'avoir' THEN 'retour' ELSE 'sortie' END;

  -- Traiter chaque ligne liée à un produit stock
  FOR v_item IN
    SELECT di.*, p.name AS pname, p.stock_current AS sc
      FROM document_items di
      JOIN stock_products p
        ON p.id = di.stock_product_id AND p.user_id = v_user_id
     WHERE di.document_id = p_document_id
       AND di.stock_product_id IS NOT NULL
       AND di.quantity > 0
     ORDER BY p.id  -- ordre stable pour anti-deadlock
  LOOP
    -- Relire le stock courant et verrouiller le produit
    SELECT stock_current INTO v_before_qty
      FROM stock_products
     WHERE id = v_item.stock_product_id AND user_id = v_user_id
       FOR UPDATE;

    IF NOT FOUND THEN CONTINUE; END IF;

    -- Insérer le mouvement
    INSERT INTO stock_movements (
      user_id, product_id, product_name,
      type, quantity, before_qty, after_qty,
      warehouse_id, warehouse_name,
      to_warehouse_id, to_warehouse_name,
      reason, reference, unit_cost,
      date, created_at
    ) VALUES (
      v_user_id, v_item.stock_product_id, v_item.pname,
      v_mov_type,
      v_item.quantity,
      v_before_qty,
      CASE v_mov_type
        WHEN 'sortie' THEN GREATEST(0, v_before_qty - v_item.quantity)
        ELSE v_before_qty + v_item.quantity
      END,
      NULL, '',
      NULL, '',
      CASE v_doc.type WHEN 'avoir' THEN 'Avoir' ELSE 'Facture' END
        || CASE WHEN v_doc.numero IS NOT NULL AND v_doc.numero != '' THEN ' ' || v_doc.numero ELSE '' END,
      COALESCE(v_doc.numero, ''),
      COALESCE(v_item.unit_price, 0),
      CURRENT_DATE::text,
      now()
    );

    -- Mettre à jour le stock
    UPDATE stock_products
       SET stock_current = CASE v_mov_type
                             WHEN 'sortie' THEN GREATEST(0, v_before_qty - v_item.quantity)
                             ELSE v_before_qty + v_item.quantity
                           END,
           updated_at = now()
     WHERE id = v_item.stock_product_id AND user_id = v_user_id;

    v_count := v_count + 1;
  END LOOP;

  -- Marquer le document comme appliqué
  UPDATE documents SET stock_applied = true WHERE id = p_document_id;

  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.apply_document_to_stock(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.apply_document_to_stock(uuid) TO authenticated;

-- ── Phase 7 : stock_lots ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.stock_lots (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id   uuid        NOT NULL REFERENCES public.stock_products(id) ON DELETE CASCADE,
  lot_number   text        NOT NULL DEFAULT '',
  expiry_date  date,
  quantity     numeric     NOT NULL DEFAULT 0
               CHECK (quantity >= 0),
  notes        text        NOT NULL DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_lots ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE tablename = 'stock_lots' AND policyname = 'own_lots'
  ) THEN
    CREATE POLICY own_lots ON public.stock_lots
      FOR ALL USING (user_id = auth.uid());
  END IF;
END; $$;

CREATE INDEX IF NOT EXISTS idx_lots_product ON public.stock_lots (product_id);
CREATE INDEX IF NOT EXISTS idx_lots_user    ON public.stock_lots (user_id);
CREATE INDEX IF NOT EXISTS idx_lots_expiry  ON public.stock_lots (expiry_date) WHERE expiry_date IS NOT NULL;

-- ── Phase 7 : stock_product_locations ────────────────────────────────────────
-- Stock par entrepôt pour un même produit (multi-entrepôt réel).
-- Complète stock_current (total agrégé) dans stock_products.

CREATE TABLE IF NOT EXISTS public.stock_product_locations (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id   uuid        NOT NULL REFERENCES public.stock_products(id) ON DELETE CASCADE,
  warehouse_id uuid        NOT NULL REFERENCES public.stock_warehouses(id) ON DELETE CASCADE,
  quantity     numeric     NOT NULL DEFAULT 0
               CHECK (quantity >= 0),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, warehouse_id)
);

ALTER TABLE public.stock_product_locations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE tablename = 'stock_product_locations' AND policyname = 'own_locations'
  ) THEN
    CREATE POLICY own_locations ON public.stock_product_locations
      FOR ALL USING (user_id = auth.uid());
  END IF;
END; $$;

CREATE INDEX IF NOT EXISTS idx_sploc_product   ON public.stock_product_locations (product_id);
CREATE INDEX IF NOT EXISTS idx_sploc_warehouse ON public.stock_product_locations (warehouse_id);

-- ── Phase 7 : stock_alert_config ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.stock_alert_config (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id       uuid        NOT NULL REFERENCES public.stock_products(id) ON DELETE CASCADE,
  enabled          boolean     NOT NULL DEFAULT true,
  threshold_qty    numeric     NOT NULL DEFAULT 0,
  email_enabled    boolean     NOT NULL DEFAULT true,
  last_alerted_at  timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE public.stock_alert_config ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE tablename = 'stock_alert_config' AND policyname = 'own_alert_config'
  ) THEN
    CREATE POLICY own_alert_config ON public.stock_alert_config
      FOR ALL USING (user_id = auth.uid());
  END IF;
END; $$;

CREATE INDEX IF NOT EXISTS idx_alertcfg_user    ON public.stock_alert_config (user_id);
CREATE INDEX IF NOT EXISTS idx_alertcfg_product ON public.stock_alert_config (product_id);

-- ── Phase 7 : index composites sur stock_products ────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sprods_user_active
  ON public.stock_products (user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_sprods_user_category
  ON public.stock_products (user_id, category);

CREATE INDEX IF NOT EXISTS idx_sprods_stock_current
  ON public.stock_products (user_id, stock_current);
