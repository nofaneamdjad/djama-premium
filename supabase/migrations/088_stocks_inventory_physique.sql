-- ════════════════════════════════════════════════════════════════════════════════
-- 088 — Stocks : inventaire physique (Phase 5)
--
-- Tables créées (idempotent) :
--   public.stock_inventory_sessions — sessions de comptage
--   public.stock_inventory_lines    — lignes de comptage (snapshot + saisie)
--
-- RPC (SECURITY DEFINER) :
--   validate_inventory_session(p_session_id) — génère les mouvements AJUSTEMENT
--     atomiques et met à jour les stocks, puis clôt la session.
-- ════════════════════════════════════════════════════════════════════════════════

-- ── 1. stock_inventory_sessions ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stock_inventory_sessions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text        NOT NULL,
  status       text        NOT NULL DEFAULT 'ouvert'
               CHECK (status IN ('ouvert', 'valide', 'annule')),
  warehouse_id uuid        REFERENCES public.stock_warehouses(id) ON DELETE SET NULL,
  notes        text        NOT NULL DEFAULT '',
  validated_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_inventory_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE tablename = 'stock_inventory_sessions'
       AND policyname = 'own_inv_sessions'
  ) THEN
    CREATE POLICY own_inv_sessions ON public.stock_inventory_sessions
      FOR ALL USING (user_id = auth.uid());
  END IF;
END; $$;

-- ── 2. stock_inventory_lines ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stock_inventory_lines (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid        NOT NULL
                REFERENCES public.stock_inventory_sessions(id) ON DELETE CASCADE,
  product_id    uuid        NOT NULL
                REFERENCES public.stock_products(id) ON DELETE CASCADE,
  product_name  text        NOT NULL DEFAULT '',
  sku           text        NOT NULL DEFAULT '',
  unit          text        NOT NULL DEFAULT '',
  expected_qty  numeric     NOT NULL DEFAULT 0,   -- snapshot au démarrage de la session
  counted_qty   numeric,                           -- NULL = non encore compté
  justification text        NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_inventory_lines ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE tablename = 'stock_inventory_lines'
       AND policyname = 'own_inv_lines'
  ) THEN
    CREATE POLICY own_inv_lines ON public.stock_inventory_lines
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.stock_inventory_sessions s
           WHERE s.id = session_id AND s.user_id = auth.uid()
        )
      );
  END IF;
END; $$;

-- ── 3. Index ─────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_inv_sessions_user    ON public.stock_inventory_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_inv_sessions_status  ON public.stock_inventory_sessions (status);
CREATE INDEX IF NOT EXISTS idx_inv_lines_session    ON public.stock_inventory_lines (session_id);
CREATE INDEX IF NOT EXISTS idx_inv_lines_product    ON public.stock_inventory_lines (product_id);

-- ── 4. RPC validate_inventory_session ────────────────────────────────────────────
-- Valide une session d'inventaire ouverte :
--   • Pour chaque ligne comptée (counted_qty IS NOT NULL) dont la valeur diffère
--     du stock courant : insère un mouvement AJUSTEMENT + met à jour stock_current.
--   • Toutes les opérations sont dans la même transaction (atomicité totale).
--   • Ne fait jamais confiance à l'identité fournie par le client : auth.uid().
--   • Verrouille les produits dans l'ordre (ORDER BY product_id) pour éviter tout
--     deadlock si deux sessions validées en parallèle touchent les mêmes produits.
--   • N'utilise pas atomic_stock_movement() car 'ajustement' y est additionnel ;
--     ici la quantité comptée EST le nouveau stock cible.

CREATE OR REPLACE FUNCTION public.validate_inventory_session(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    uuid := auth.uid();
  v_session    stock_inventory_sessions%ROWTYPE;
  v_line       stock_inventory_lines%ROWTYPE;
  v_before_qty numeric;
  v_delta      numeric;
BEGIN
  -- ── Authentification ──────────────────────────────────────────────────────────
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  -- ── Verrouiller + vérifier la session ─────────────────────────────────────────
  SELECT * INTO v_session
    FROM stock_inventory_sessions
   WHERE id = p_session_id AND user_id = v_user_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session introuvable ou accès refusé';
  END IF;

  IF v_session.status != 'ouvert' THEN
    RAISE EXCEPTION 'La session doit être ouverte pour être validée (statut actuel : %)', v_session.status;
  END IF;

  -- ── Traiter chaque ligne comptée, dans un ordre stable (anti-deadlock) ─────────
  FOR v_line IN
    SELECT * FROM stock_inventory_lines
     WHERE session_id = p_session_id
       AND counted_qty IS NOT NULL
     ORDER BY product_id
  LOOP
    -- Lire le stock courant réel (peut diverger du snapshot si des mouvements
    -- ont eu lieu pendant la session de comptage)
    SELECT stock_current INTO v_before_qty
      FROM stock_products
     WHERE id = v_line.product_id AND user_id = v_user_id
       FOR UPDATE;

    IF NOT FOUND THEN CONTINUE; END IF;

    -- Pas d'écart entre le compté et le stock actuel → rien à faire
    IF v_line.counted_qty = v_before_qty THEN CONTINUE; END IF;

    v_delta := ABS(v_line.counted_qty - v_before_qty);

    -- Insérer le mouvement AJUSTEMENT (before_qty = stock réel, after_qty = compté)
    INSERT INTO stock_movements (
      user_id, product_id, product_name,
      type, quantity, before_qty, after_qty,
      warehouse_id, warehouse_name,
      to_warehouse_id, to_warehouse_name,
      reason, reference, unit_cost,
      date, created_at
    ) VALUES (
      v_user_id, v_line.product_id, v_line.product_name,
      'ajustement', v_delta, v_before_qty, v_line.counted_qty,
      v_session.warehouse_id, '',
      NULL, '',
      CASE WHEN v_line.justification != ''
           THEN v_line.justification
           ELSE 'Inventaire physique' END,
      '', 0,
      CURRENT_DATE::text, now()
    );

    -- Mettre à jour le stock (atomique dans cette transaction)
    UPDATE stock_products
       SET stock_current = v_line.counted_qty,
           updated_at    = now()
     WHERE id = v_line.product_id AND user_id = v_user_id;
  END LOOP;

  -- ── Clôturer la session ───────────────────────────────────────────────────────
  UPDATE stock_inventory_sessions
     SET status       = 'valide',
         validated_at = now()
   WHERE id = p_session_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.validate_inventory_session(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.validate_inventory_session(uuid) TO authenticated;
