-- ── Analytics DJAMA — Jalon A ────────────────────────────────────────────────
-- Fonctions RPC server-side pour les calculs analytics (Supabase)

-- CA mensuel des factures payées sur une plage de dates
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
    to_char(date_trunc('month', d.date::date), 'YYYY-MM') AS month_key,
    COALESCE(SUM(d.total_ttc), 0)::numeric               AS ca_paye,
    COUNT(*)::bigint                                      AS nb_factures
  FROM documents d
  WHERE d.user_id  = p_user_id
    AND d.type     = 'invoice'
    AND d.status   = 'paid'
    AND d.date::date BETWEEN p_start::date AND p_end::date
  GROUP BY 1
  ORDER BY 1;
$$;

-- Dépenses mensuelles sur une plage de dates
CREATE OR REPLACE FUNCTION analytics_depenses_mensuel(
  p_user_id uuid,
  p_start   text,
  p_end     text
)
RETURNS TABLE (
  month_key text,
  total     numeric,
  nb        bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    to_char(date_trunc('month', e.date::date), 'YYYY-MM') AS month_key,
    COALESCE(SUM(e.amount), 0)::numeric                   AS total,
    COUNT(*)::bigint                                       AS nb
  FROM expenses e
  WHERE e.user_id   = p_user_id
    AND e.date::date BETWEEN p_start::date AND p_end::date
  GROUP BY 1
  ORDER BY 1;
$$;

-- Top N clients par CA payé sur une période
CREATE OR REPLACE FUNCTION analytics_top_clients(
  p_user_id uuid,
  p_start   text,
  p_end     text,
  p_limit   int DEFAULT 10
)
RETURNS TABLE (
  client_name text,
  ca_total    numeric,
  nb_factures bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    d.client_name,
    COALESCE(SUM(d.total_ttc), 0)::numeric AS ca_total,
    COUNT(*)::bigint                        AS nb_factures
  FROM documents d
  WHERE d.user_id     = p_user_id
    AND d.type        = 'invoice'
    AND d.status      = 'paid'
    AND d.date::date BETWEEN p_start::date AND p_end::date
    AND d.client_name IS NOT NULL
    AND d.client_name <> ''
  GROUP BY d.client_name
  ORDER BY ca_total DESC
  LIMIT p_limit;
$$;

-- Dépenses par catégorie sur une période
CREATE OR REPLACE FUNCTION analytics_depenses_cat(
  p_user_id uuid,
  p_start   text,
  p_end     text
)
RETURNS TABLE (
  category text,
  total    numeric,
  nb       bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(NULLIF(TRIM(e.category), ''), 'Autre') AS category,
    COALESCE(SUM(e.amount), 0)::numeric              AS total,
    COUNT(*)::bigint                                  AS nb
  FROM expenses e
  WHERE e.user_id   = p_user_id
    AND e.date::date BETWEEN p_start::date AND p_end::date
  GROUP BY 1
  ORDER BY total DESC;
$$;
