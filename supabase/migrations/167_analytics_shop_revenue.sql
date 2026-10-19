-- ════════════════════════════════════════════════════════════════════════
-- 167_analytics_shop_revenue.sql — Intégrer les revenus boutique dans analytics
-- ════════════════════════════════════════════════════════════════════════
--
-- GAP-01 corrigé : analytics_ca_mensuel ne comptait que les documents (factures).
-- Les shop_orders (payment_status = 'paid') n'étaient pas inclus dans le CA.
-- La RPC est remplacée pour cumuler les deux sources de revenus, consolidées
-- par mois, avec la même signature de retour (compatibilité totale).

CREATE OR REPLACE FUNCTION analytics_ca_mensuel(
  p_user_id uuid,
  p_start   text,
  p_end     text
)
RETURNS TABLE (
  month_key   text,
  ca_paye     numeric,
  nb_factures bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    month_key,
    SUM(ca_paye)::numeric    AS ca_paye,
    SUM(nb_factures)::bigint AS nb_factures
  FROM (
    -- Factures payées
    SELECT
      to_char(date_trunc('month', d.date::date), 'YYYY-MM') AS month_key,
      COALESCE(SUM(d.total_ttc), 0)                         AS ca_paye,
      COUNT(*)                                               AS nb_factures
    FROM documents d
    WHERE d.user_id   = p_user_id
      AND d.type      = 'invoice'
      AND d.status    = 'paid'
      AND d.date::date BETWEEN p_start::date AND p_end::date
    GROUP BY 1

    UNION ALL

    -- Commandes boutique payées
    SELECT
      to_char(date_trunc('month', o.created_at::date), 'YYYY-MM') AS month_key,
      COALESCE(SUM(o.total), 0)                                    AS ca_paye,
      COUNT(*)                                                      AS nb_factures
    FROM shop_orders o
    WHERE o.user_id          = p_user_id
      AND o.payment_status   = 'paid'
      AND o.created_at::date BETWEEN p_start::date AND p_end::date
    GROUP BY 1
  ) sub
  GROUP BY month_key
  ORDER BY month_key;
$$;
