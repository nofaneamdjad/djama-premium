-- Migration 176 : Activer RLS sur beta_config
-- Faille P-RLS-BETA : table sans RLS, exposée à anon via anon key
--
-- Analyse des callers :
--   - /api/beta/apply (POST + GET) : SUPABASE_SERVICE_ROLE_KEY (service_role bypass RLS)
--   - /api/admin/beta/* : requireAdminUser + SUPABASE_SERVICE_ROLE_KEY
-- Conclusion : aucun caller n'utilise le client anon pour lire beta_config.
-- Activer RLS sans politique anon est sûr — les callers service_role ne sont pas affectés.
--
-- AVANT  : RLS = OFF (toute la table exposée)
-- APRÈS  : RLS = ON, aucune politique anon → anon ne peut ni lire ni écrire
--
-- Réversible :
-- ALTER TABLE public.beta_config DISABLE ROW LEVEL SECURITY;

ALTER TABLE public.beta_config ENABLE ROW LEVEL SECURITY;
