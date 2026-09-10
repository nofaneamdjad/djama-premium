-- ══════════════════════════════════════════════════════════════════
-- Migration 055 : Sécurisation des fonctions SECURITY DEFINER
--
-- PROBLÈME :
--   link_user_access_on_signup() est SECURITY DEFINER sans
--   SET search_path = public → vulnérable à l'injection via search_path
--   (un attaquant peut créer une table homonyme dans un autre schema
--    et la faire exécuter à la place de public.user_access)
--
-- CORRECTION :
--   Recréer la fonction avec SET search_path = public
--
-- BONUS :
--   Refermer définitivement la politique UPDATE sur user_access
--   que la migration 20260713 avait réouverte (conflict avec 052).
--   La migration 052 l'avait fermée, mais si les migrations sont
--   rejouées dans l'ordre alphabétique, 20260713 (> 052) la rouvre.
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Corriger la fonction SECURITY DEFINER ──────────────────────
CREATE OR REPLACE FUNCTION link_user_access_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_access
  SET user_id = NEW.id
  WHERE email = NEW.email
    AND user_id IS NULL;
  RETURN NEW;
END;
$$;

-- Le trigger reste inchangé (pas besoin de le recréer)

-- ── 2. Refermer UPDATE sur user_access (définitif) ────────────────
-- Les utilisateurs ne peuvent PAS modifier leurs propres droits.
-- Seul service_role (webhooks Stripe/PayPal) peut écrire user_access.
DROP POLICY IF EXISTS "update user_access" ON user_access;

-- ── 3. Vérification rapide ────────────────────────────────────────
-- Après application, vérifiez avec :
-- SELECT prosrc FROM pg_proc WHERE proname = 'link_user_access_on_signup';
-- → Doit contenir "SET search_path = public"
--
-- SELECT policyname, cmd FROM pg_policies
-- WHERE tablename = 'user_access' AND cmd = 'UPDATE';
-- → Doit retourner 0 lignes
