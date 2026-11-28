-- ═══════════════════════════════════════════════════════════════════════════
-- DJAMA — Migration P0.3 : Extension contrainte CHECK à 8 valeurs de rôles
-- ═══════════════════════════════════════════════════════════════════════════
-- ⚠️  PROD — à appliquer après validation fondateur + requête audit lecture seule.
-- Prérequis : vérifier la contrainte actuelle en prod (voir REQUÊTE AUDIT ci-dessous).
-- ═══════════════════════════════════════════════════════════════════════════
--
-- REQUÊTE D'AUDIT PRÉALABLE (lecture seule — exécuter dans Supabase SQL Editor AVANT) :
--
--   SELECT conname, pg_get_constraintdef(oid)
--   FROM pg_constraint
--   WHERE conrelid = 'public.admin_users'::regclass
--     AND contype = 'c';
--
-- Résultat attendu (migration 174 en prod) :
--   admin_users_role_check | CHECK (role IN ('super_admin', 'admin', 'support', 'viewer'))
--
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- Étape 1 : Supprimer l'ancienne contrainte (4 rôles)
ALTER TABLE public.admin_users
  DROP CONSTRAINT IF EXISTS admin_users_role_check;

-- Étape 2 : Ajouter la nouvelle contrainte (8 valeurs SQL, 7 rôles fonctionnels)
-- Rappel : 'admin' est un alias de rétrocompatibilité pour 'direction'
ALTER TABLE public.admin_users
  ADD CONSTRAINT admin_users_role_check
  CHECK (role IN (
    'super_admin',   -- Niveau 7 — tous droits + sécurité système
    'direction',     -- Niveau 6 — management opérationnel
    'admin',         -- Niveau 5 — alias rétrocompat → traité comme direction
    'finance',       -- Niveau 4 — responsable financier
    'commercial',    -- Niveau 3 — commercial / abonnements
    'support',       -- Niveau 2 — support client
    'tech',          -- Niveau 1 — équipe informatique
    'viewer'         -- Niveau 0 — lecture seule
  ));

COMMENT ON COLUMN public.admin_users.role IS
  '8 valeurs SQL, 7 rôles fonctionnels. '
  'super_admin(7) > direction(6) > admin=5(alias) > finance(4) > commercial(3) > support(2) > tech(1) > viewer(0). '
  'Niveaux définis dans ROLE_HIERARCHY (admin-auth-v2.ts).';

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- ROLLBACK V1 — avant toute attribution des nouveaux rôles (simple)
-- À utiliser si migration annulée immédiatement, avant d'assigner finance/commercial/tech/direction
-- ═══════════════════════════════════════════════════════════════════════════
-- BEGIN;
-- ALTER TABLE public.admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
-- ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_role_check
--   CHECK (role IN ('super_admin', 'admin', 'support', 'viewer'));
-- COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- PRÉCISION — Distinction admin(5) vs direction(6)
-- ───────────────────────────────────────────────────────────────────────────
-- Bien que les deux valeurs coexistent dans la contrainte CHECK :
--   - 'direction' (niveau 6) : rôle fonctionnel. Accès management, lecture financière,
--     pilotage des équipes. Dans ROLE_HIERARCHY : valeur canonique.
--   - 'admin'     (niveau 5) : ALIAS de rétrocompatibilité pour les comptes créés
--     avant la migration 174. Dans ROLE_HIERARCHY, admin_users.role='admin' est
--     traité comme direction (même ACL) SAUF pour les vérifications de niveau strict.
-- → Ne plus attribuer 'admin' à de nouveaux comptes. Utiliser 'direction'.
-- → Les comptes existants avec role='admin' peuvent rester en l'état (alias sûr).
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- PRÉCISION — Vérification contournement des permissions personnalisées
-- ───────────────────────────────────────────────────────────────────────────
-- La colonne admin_users.permissions (JSONB) peut contenir des surcharges
-- de permissions par fonctionnalité. Ces surcharges sont ignorées quand
-- is_active = false : verifyAdminSession() vérifie is_active EN PREMIER
-- (retour 403 immédiat) avant tout check de permission personnalisée.
-- → is_active = false désactive le compte même si permissions contient
--   des entrées comme {"can_access_finance": true}. Pas de contournement possible.
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- ROLLBACK V2 — APRÈS attribution de nouveaux rôles — MOINDRE PRIVILÈGE
-- ⚠️  V1 du rollback V2 était incorrect : downgrade finance/commercial→admin = ÉLÉVATION
--     (admin = niveau 5, finance = niveau 4, commercial = niveau 3)
-- Principe V2 corrigé :
--   - Downgrade vers 'viewer' (niveau 0 = moindre privilège)
--   - Désactivation préventive (is_active = false)
--   - Révocation Strategy 0 : sessions admin_sessions (token djama_admin_tok)
--   - Révocation Strategy 1 : sessions Supabase Auth — ATTENTION : SQL seul ne suffit pas
--     → Les sessions Supabase Auth actives survivent au rollback SQL si elles ne sont pas
--       révoquées via l'API Supabase Auth admin (signOut globale ou invalidation JWT).
--       Procédure complémentaire requise : appeler DELETE /auth/v1/admin/users/{id}/sessions
--       via le Supabase Dashboard ou l'API Admin pour chaque admin concerné.
--   - Conservation du rôle original dans permissions (audit trail + restauration)
--   - Aucune élévation de privilèges
--   - Aucune suppression de compte
-- ═══════════════════════════════════════════════════════════════════════════
-- BEGIN;
--
-- -- Étape 1a : Révocation Strategy 0 — sessions admin_sessions (djama_admin_tok)
-- UPDATE public.admin_sessions
-- SET revoked_at = now()
-- WHERE admin_user_id IN (
--   SELECT id FROM public.admin_users WHERE role NOT IN ('super_admin', 'admin', 'support', 'viewer')
-- ) AND revoked_at IS NULL;
--
-- -- Étape 1b : Révocation Strategy 1 — sessions Supabase Auth (AAL1/AAL2)
-- -- ⚠️  Cette étape NE PEUT PAS être faite en SQL pur — elle nécessite l'API Supabase Auth admin.
-- -- Procédure manuelle à exécuter APRÈS ce rollback SQL :
-- --   1. Dans Supabase Dashboard → Authentication → Users
-- --   2. Pour chaque admin concerné (rôle finance/commercial/tech/direction) :
-- --      Cliquer "Sign out" sur toutes les sessions actives.
-- --   OU via l'API Supabase Auth admin (service_role key) :
-- --   POST /auth/v1/admin/users/{supabase_user_id}/sign-out?scope=global
-- --   Headers: { apikey: SERVICE_ROLE_KEY, Authorization: Bearer SERVICE_ROLE_KEY }
-- -- Sans cette étape, les tokens Supabase Auth restent valides jusqu'à leur expiration naturelle.
--
-- -- Étape 2 : Downgrade vers 'viewer' + désactivation + audit trail
-- -- viewer = niveau 0 = moindre privilège → aucune élévation possible
-- UPDATE public.admin_users
-- SET
--   role      = 'viewer',              -- moindre privilège (niveau 0)
--   is_active = false,                 -- désactivation préventive (réactivation manuelle requise)
--   permissions = COALESCE(permissions, '{}'::jsonb) ||
--     jsonb_build_object(
--       '_rollback_original_role', role,
--       '_rollback_at',            to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
--       '_rollback_note',          'P0.3 rollback V2 — réactivation manuelle requise, voir procédure de restauration'
--     )
-- WHERE role NOT IN ('super_admin', 'admin', 'support', 'viewer');
--
-- -- Étape 3 : Restaurer l'ancienne contrainte (toutes les lignes sont maintenant conformes)
-- ALTER TABLE public.admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
-- ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_role_check
--   CHECK (role IN ('super_admin', 'admin', 'support', 'viewer'));
--
-- COMMIT;
--
-- ── Procédure de restauration post-rollback V2 ───────────────────────────
-- Après avoir résolu le problème à l'origine du rollback :
-- 1. Identifier les comptes affectés :
--    SELECT id, email, permissions->>'_rollback_original_role' AS ancien_role
--    FROM admin_users WHERE permissions ? '_rollback_original_role';
--
-- 2. Réactiver manuellement chaque compte (en vérifiant son identité) :
--    UPDATE admin_users SET
--      role = permissions->>'_rollback_original_role',  -- restaure le rôle d'origine
--      is_active = true,
--      permissions = permissions - '_rollback_original_role' - '_rollback_at' - '_rollback_note'
--    WHERE id = '<id_du_compte>';  -- un compte à la fois, validation individuelle
--
-- 3. Vérifier que le rôle restauré est dans la contrainte CHECK en vigueur.
-- ════════════════════════════════════════════════════════════════════════════
