-- ═══════════════════════════════════════════════════════════════════════════
-- DJAMA — Audit P0 : 11 requêtes de lecture seule
-- À exécuter dans : Supabase Dashboard → SQL Editor → "New Query"
-- ⚠️  LECTURE SEULE : aucun INSERT, UPDATE, DELETE, ALTER, DROP
-- ⚠️  Résultats CONFIDENTIELS : ne pas partager hors du fondateur
-- Date de préparation : 28 novembre 2026
-- ═══════════════════════════════════════════════════════════════════════════



-- ═══════════════════════════════════════════════════════════════════════════
-- REQUÊTE 1 — Contrainte CHECK en production
-- ═══════════════════════════════════════════════════════════════════════════
-- Objectif  : Vérifier quelle version de la contrainte de rôles est active.
--             4 rôles = migration 174 appliquée (sans P0.3).
--             8 rôles = migration 20261128000002 appliquée (P0.3 en place).
-- Résultat  : Une ligne avec le nom de la contrainte et sa définition.
-- Si anomalie : Contacter Claude pour décider d'appliquer P0.3 ou pas.
-- ═══════════════════════════════════════════════════════════════════════════
SELECT
  conname                              AS "Nom contrainte",
  pg_get_constraintdef(oid)            AS "Définition"
FROM pg_constraint
WHERE conrelid = 'public.admin_users'::regclass
  AND contype  = 'c'
ORDER BY conname;



-- ═══════════════════════════════════════════════════════════════════════════
-- REQUÊTE 2 — Inventaire complet des comptes admin
-- ═══════════════════════════════════════════════════════════════════════════
-- Objectif  : Voir tous les comptes admin, leur rôle, et leur état.
-- Résultat  : Liste de tous les admins (email, rôle, actif, Supabase lié).
-- Si anomalie : Un compte inconnu, désactiver immédiatement (is_active=false)
--               via Supabase Dashboard → Authentication → Users.
-- ═══════════════════════════════════════════════════════════════════════════
SELECT
  id,
  email,
  role,
  is_active,
  supabase_user_id IS NOT NULL         AS "Lié Supabase Auth",
  created_at,
  last_login_at
FROM public.admin_users
ORDER BY created_at DESC;



-- ═══════════════════════════════════════════════════════════════════════════
-- REQUÊTE 3 — Comptes admin non liés à Supabase Auth
-- ═══════════════════════════════════════════════════════════════════════════
-- Objectif  : Ces comptes ne peuvent pas utiliser Strategy 1 (AAL2 Supabase).
--             Ils sont une surface d'attaque si Strategy 0 est compromise.
-- Résultat  : Idéalement 0 ligne (tous les admins doivent être liés).
-- Si anomalie : Lier chaque compte via la procédure de mise en correspondance,
--               ou désactiver les comptes non utilisés.
-- ═══════════════════════════════════════════════════════════════════════════
SELECT
  id,
  email,
  role,
  is_active,
  created_at
FROM public.admin_users
WHERE supabase_user_id IS NULL
ORDER BY created_at DESC;



-- ═══════════════════════════════════════════════════════════════════════════
-- REQUÊTE 4 — Sessions actives avec leur niveau AAL
-- ═══════════════════════════════════════════════════════════════════════════
-- Objectif  : Vérifier que les sessions actives ont le bon niveau AAL.
--             Toute session super_admin doit avoir aal2.
-- Résultat  : Sessions actives non expirées non révoquées.
-- Si anomalie : Session aal1 pour super_admin → révoquer manuellement
--               (UPDATE admin_sessions SET revoked_at = now() WHERE id = '...')
--               Mais UNIQUEMENT avec autorisation du fondateur.
-- ═══════════════════════════════════════════════════════════════════════════
SELECT
  s.id                                 AS "Session ID",
  au.email                             AS "Email admin",
  au.role                              AS "Rôle",
  s.aal                                AS "Niveau AAL",
  s.created_at                         AS "Créée le",
  s.expires_at                         AS "Expire le",
  s.revoked_at IS NULL                 AS "Active"
FROM public.admin_sessions s
JOIN public.admin_users au ON au.id = s.admin_user_id
WHERE s.revoked_at IS NULL
  AND s.expires_at > now()
ORDER BY s.created_at DESC;



-- ═══════════════════════════════════════════════════════════════════════════
-- REQUÊTE 5 — Sessions sans MFA pour les rôles sensibles
-- ═══════════════════════════════════════════════════════════════════════════
-- Objectif  : Détecter les rôles sensibles avec des sessions non-MFA (aal1).
--             super_admin et direction ne doivent jamais avoir de session aal1.
-- Résultat  : Idéalement 0 ligne (si MFA activé).
-- Si anomalie : Contacter le propriétaire de la session pour re-authentification.
-- ═══════════════════════════════════════════════════════════════════════════
SELECT
  s.id                                 AS "Session ID",
  au.email                             AS "Email admin",
  au.role                              AS "Rôle (sensible)",
  s.aal                                AS "AAL (devrait être aal2)",
  s.created_at                         AS "Créée le"
FROM public.admin_sessions s
JOIN public.admin_users au ON au.id = s.admin_user_id
WHERE s.revoked_at IS NULL
  AND s.expires_at > now()
  AND au.role IN ('super_admin', 'direction', 'admin')
  AND s.aal != 'aal2'
ORDER BY s.created_at DESC;



-- ═══════════════════════════════════════════════════════════════════════════
-- REQUÊTE 6 — Comptes désactivés avec sessions actives
-- ═══════════════════════════════════════════════════════════════════════════
-- Objectif  : Un compte is_active=false ne devrait JAMAIS avoir de session active.
--             Si c'est le cas, les tokens existants ne sont pas révoqués.
-- Résultat  : Idéalement 0 ligne.
-- Si anomalie : Révoquer immédiatement ces sessions
--               (UPDATE admin_sessions SET revoked_at = now() WHERE admin_user_id = '...' AND revoked_at IS NULL)
--               UNIQUEMENT avec autorisation du fondateur.
-- ═══════════════════════════════════════════════════════════════════════════
SELECT
  s.id                                 AS "Session ID",
  au.email                             AS "Email admin (désactivé)",
  au.role                              AS "Rôle",
  au.is_active                         AS "Actif ?",
  s.created_at                         AS "Session créée",
  s.expires_at                         AS "Session expire"
FROM public.admin_sessions s
JOIN public.admin_users au ON au.id = s.admin_user_id
WHERE au.is_active = false
  AND s.revoked_at IS NULL
  AND s.expires_at > now();



-- ═══════════════════════════════════════════════════════════════════════════
-- REQUÊTE 7 — Sessions expirées non révoquées (nettoyage manquant)
-- ═══════════════════════════════════════════════════════════════════════════
-- Objectif  : Les sessions expirées devraient être marquées revoked pour
--             cohérence de l'audit log. Pas un risque direct, mais indicateur
--             de qualité du cycle de vie des tokens.
-- Résultat  : Sessions expirées mais sans revoked_at.
-- Si anomalie : Pas critique — documenter pour nettoyage programmé futur.
-- ═══════════════════════════════════════════════════════════════════════════
SELECT
  count(*)                             AS "Sessions expirées non révoquées",
  min(expires_at)                      AS "Plus ancienne",
  max(expires_at)                      AS "Plus récente"
FROM public.admin_sessions
WHERE expires_at < now()
  AND revoked_at IS NULL;



-- ═══════════════════════════════════════════════════════════════════════════
-- REQUÊTE 8 — Codes de récupération MFA disponibles par admin
-- ═══════════════════════════════════════════════════════════════════════════
-- Objectif  : Vérifier l'état des codes de récupération après migration.
--             Chaque admin enrôlé doit avoir 8 codes disponibles.
-- Résultat  : Count par admin. Idéalement 0 ligne (table vide si migration pas encore appliquée).
-- Si anomalie : Admin avec 0 codes → régénérer via l'API (après enrôlement TOTP).
-- ═══════════════════════════════════════════════════════════════════════════
SELECT
  au.email                             AS "Email admin",
  au.role                              AS "Rôle",
  COUNT(r.id) FILTER (WHERE r.used_at IS NULL) AS "Codes disponibles",
  COUNT(r.id) FILTER (WHERE r.used_at IS NOT NULL) AS "Codes utilisés",
  COUNT(r.id)                          AS "Total codes"
FROM public.admin_users au
LEFT JOIN public.admin_mfa_recovery_codes r ON r.admin_user_id = au.id
WHERE au.is_active = true
GROUP BY au.id, au.email, au.role
ORDER BY au.role, au.email;



-- ═══════════════════════════════════════════════════════════════════════════
-- REQUÊTE 9 — Dernières entrées de l'audit log admin
-- ═══════════════════════════════════════════════════════════════════════════
-- Objectif  : Vérifier l'activité récente dans le panneau admin.
--             Détecter des actions suspectes ou non autorisées.
-- Résultat  : 50 dernières entrées d'audit.
-- Si anomalie : Action inconnue ou non autorisée → alerte fondateur immédiate.
-- ═══════════════════════════════════════════════════════════════════════════
SELECT
  al.created_at                        AS "Date",
  au.email                             AS "Admin",
  al.action                            AS "Action",
  al.severity                          AS "Sévérité",
  al.ip_address                        AS "IP",
  al.details                           AS "Détails"
FROM public.admin_audit_log al
LEFT JOIN public.admin_users au ON au.id = al.admin_user_id
ORDER BY al.created_at DESC
LIMIT 50;



-- ═══════════════════════════════════════════════════════════════════════════
-- REQUÊTE 10 — Comptes affectés par un rollback P0.3
-- ═══════════════════════════════════════════════════════════════════════════
-- Objectif  : Après application du rollback V2 de P0.3, identifier les comptes
--             qui ont été rétrogradés à viewer et désactivés.
-- Résultat  : 0 ligne si P0.3 pas encore appliqué (ou aucun compte affecté).
-- Si anomalie : Si des comptes apparaissent, contacter chaque propriétaire
--               pour vérification d'identité avant réactivation manuelle.
-- ═══════════════════════════════════════════════════════════════════════════
SELECT
  id,
  email,
  role                                 AS "Rôle actuel (viewer)",
  is_active                            AS "Actif",
  permissions->>'_rollback_original_role' AS "Rôle d'origine",
  permissions->>'_rollback_at'         AS "Date rollback",
  permissions->>'_rollback_note'       AS "Note rollback"
FROM public.admin_users
WHERE permissions ? '_rollback_original_role'
ORDER BY (permissions->>'_rollback_at') DESC;



-- ═══════════════════════════════════════════════════════════════════════════
-- REQUÊTE 11 — Fonctions SECURITY DEFINER dans le schéma public
-- ═══════════════════════════════════════════════════════════════════════════
-- Objectif  : Inventaire des fonctions avec SECURITY DEFINER.
--             Ces fonctions s'exécutent avec les droits du propriétaire
--             (service_role), pas de l'appelant. Important pour l'audit sécurité.
-- Résultat  : Toutes les fonctions SECURITY DEFINER dans public.
-- Si anomalie : Fonction inconnue → vérifier sa provenance avant tout.
-- ═══════════════════════════════════════════════════════════════════════════
SELECT
  n.nspname                            AS "Schéma",
  p.proname                            AS "Nom fonction",
  pg_catalog.pg_get_function_identity_arguments(p.oid) AS "Arguments",
  r.rolname                            AS "Propriétaire (exécuté comme)",
  CASE p.prosecdef WHEN true THEN 'SECURITY DEFINER ⚠️' ELSE 'SECURITY INVOKER' END AS "Mode sécurité",
  has_function_privilege('PUBLIC', p.oid, 'EXECUTE') AS "Execute PUBLIC ?"
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
JOIN pg_catalog.pg_roles r ON r.oid = p.proowner
WHERE n.nspname = 'public'
  AND p.prosecdef = true
ORDER BY p.proname;
