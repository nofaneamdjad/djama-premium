-- Migration 20261103-1 : REVOKE EXECUTE sur 3 RPCs SECURITY DEFINER accessibles publiquement
-- Faille P-SEC-RPC : get_monthly_revenue, get_revenue_by_month, get_inscriptions_by_month
-- exposés à PUBLIC/anon/authenticated — données financières et inscriptions lisibles sans auth
--
-- AVANT  : proacl = {=X/postgres, anon=X/postgres, authenticated=X/postgres, ...}
-- APRÈS  : seuls postgres + service_role conservent EXECUTE
--
-- Réversible : voir DOWN ci-dessous (commenté)

-- Révoquer l'accès PUBLIC implicite (=X) et explicite à anon + authenticated
REVOKE EXECUTE ON FUNCTION public.get_monthly_revenue(timestamp with time zone, timestamp with time zone)
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_revenue_by_month(date, integer)
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_inscriptions_by_month(date)
  FROM PUBLIC, anon, authenticated;

-- Fixer le search_path pour éviter la substitution de schéma
ALTER FUNCTION public.get_monthly_revenue(timestamp with time zone, timestamp with time zone)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.get_revenue_by_month(date, integer)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.get_inscriptions_by_month(date)
  SET search_path = public, pg_temp;

-- Garantir que service_role conserve l'accès (dashboard admin)
GRANT EXECUTE ON FUNCTION public.get_monthly_revenue(timestamp with time zone, timestamp with time zone)
  TO service_role;

GRANT EXECUTE ON FUNCTION public.get_revenue_by_month(date, integer)
  TO service_role;

GRANT EXECUTE ON FUNCTION public.get_inscriptions_by_month(date)
  TO service_role;

-- DOWN (pour rollback) :
-- GRANT EXECUTE ON FUNCTION public.get_monthly_revenue(text, text) TO anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.get_revenue_by_month(text, integer) TO anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.get_inscriptions_by_month(text) TO anon, authenticated;
