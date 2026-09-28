-- ════════════════════════════════════════════════════════════════════════════════
-- 085 — Stocks : atomicité des mouvements + contrainte stock >= 0
--
-- P1-05 : CHECK CONSTRAINT stock_current >= 0 (idempotent)
-- P0-01 : Fonction RPC atomic_stock_movement()  — BEGIN/SELECT FOR UPDATE/INSERT/UPDATE/COMMIT
-- P1-06 : before_qty / after_qty calculés côté serveur (dans la fonction RPC)
-- ════════════════════════════════════════════════════════════════════════════════

-- ── 1. Corriger toute valeur négative existante avant d'ajouter la contrainte ──
UPDATE stock_products SET stock_current = 0 WHERE stock_current < 0;

-- ── 2. CHECK CONSTRAINT idempotent ─────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'chk_stock_nn'
       AND conrelid = 'stock_products'::regclass
  ) THEN
    ALTER TABLE stock_products
      ADD CONSTRAINT chk_stock_nn CHECK (stock_current >= 0);
  END IF;
END;
$$;

-- ── 3. Fonction RPC atomic_stock_movement ──────────────────────────────────────
-- Appelée via supabase.rpc('atomic_stock_movement', {...}) depuis le frontend.
-- Identifie l'utilisateur via auth.uid() — ne fait jamais confiance à un userId
-- envoyé par le client.  Verrouille la ligne produit (FOR UPDATE) pour éviter
-- la race condition entre deux appels concurrents.
-- Retourne l'UUID du mouvement créé.

CREATE OR REPLACE FUNCTION atomic_stock_movement(
  p_product_id      uuid,
  p_type            text,
  p_quantity        numeric,
  p_reason          text    DEFAULT '',
  p_reference       text    DEFAULT '',
  p_unit_cost       numeric DEFAULT 0,
  p_warehouse_id    uuid    DEFAULT NULL,
  p_to_warehouse_id uuid    DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id        uuid    := auth.uid();
  v_before_qty     numeric;
  v_after_qty      numeric;
  v_product_name   text;
  v_warehouse_name text    := '';
  v_to_wh_name     text    := '';
  v_movement_id    uuid;
  -- Types qui réduisent le stock courant
  v_outgoing       text[]  := ARRAY['sortie', 'perte', 'casse'];
BEGIN
  -- Vérification authentification
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  -- Validation paramètres basiques
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'La quantité doit être positive (reçu=%)', p_quantity;
  END IF;

  -- Verrouiller la ligne produit pour éviter la race condition
  SELECT stock_current, name
    INTO v_before_qty, v_product_name
    FROM stock_products
   WHERE id = p_product_id AND user_id = v_user_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produit introuvable ou accès refusé';
  END IF;

  -- Valider les mouvements sortants (stock ne peut pas devenir négatif)
  IF p_type = ANY(v_outgoing) AND v_before_qty < p_quantity THEN
    RAISE EXCEPTION 'Stock insuffisant : disponible=%, demandé=%', v_before_qty, p_quantity;
  END IF;

  -- Calculer le stock après mouvement (P1-06 : côté serveur)
  IF p_type = ANY(v_outgoing) THEN
    v_after_qty := v_before_qty - p_quantity;
  ELSE
    -- entree, retour, ajustement, transfert → ajout
    v_after_qty := v_before_qty + p_quantity;
  END IF;

  -- Résoudre les noms d'entrepôts (côté serveur, pas confiance au frontend)
  IF p_warehouse_id IS NOT NULL THEN
    SELECT COALESCE(name, '') INTO v_warehouse_name
      FROM stock_warehouses
     WHERE id = p_warehouse_id AND user_id = v_user_id;
    v_warehouse_name := COALESCE(v_warehouse_name, '');
  END IF;

  IF p_to_warehouse_id IS NOT NULL THEN
    SELECT COALESCE(name, '') INTO v_to_wh_name
      FROM stock_warehouses
     WHERE id = p_to_warehouse_id AND user_id = v_user_id;
    v_to_wh_name := COALESCE(v_to_wh_name, '');
  END IF;

  -- Insérer le mouvement (P1-06 : before_qty et after_qty calculés ici)
  INSERT INTO stock_movements (
    user_id, product_id, product_name,
    type, quantity, before_qty, after_qty,
    warehouse_id, warehouse_name,
    to_warehouse_id, to_warehouse_name,
    reason, reference, unit_cost,
    date, created_at
  ) VALUES (
    v_user_id, p_product_id, v_product_name,
    p_type, p_quantity, v_before_qty, v_after_qty,
    p_warehouse_id, v_warehouse_name,
    p_to_warehouse_id, v_to_wh_name,
    p_reason, p_reference, p_unit_cost,
    CURRENT_DATE, now()
  )
  RETURNING id INTO v_movement_id;

  -- Mettre à jour le stock courant (atomique avec l'INSERT ci-dessus)
  UPDATE stock_products
     SET stock_current = v_after_qty,
         updated_at    = now()
   WHERE id = p_product_id AND user_id = v_user_id;

  RETURN v_movement_id;
END;
$$;

-- ── 4. Permissions ─────────────────────────────────────────────────────────────
-- Seuls les utilisateurs authentifiés peuvent appeler cette fonction.
-- L'anonyme n'y a pas accès.
REVOKE EXECUTE ON FUNCTION atomic_stock_movement(uuid, text, numeric, text, text, numeric, uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION atomic_stock_movement(uuid, text, numeric, text, text, numeric, uuid, uuid) TO authenticated;
