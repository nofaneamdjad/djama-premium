-- ──────────────────────────────────────────────────────────────────
-- Activer le compte test DJAMA
-- Colonnes utilisées : email (unique), abonnement, statut
--
-- À exécuter UNE FOIS dans :
--   Supabase Dashboard → SQL Editor → New Query → Run
--
-- Aucune clé service role, aucune route API nécessaire.
-- Après exécution : connexion sur /login → redirection directe /client
-- ──────────────────────────────────────────────────────────────────

INSERT INTO clients (email, abonnement, statut)
VALUES ('nofamdjad@gmail.com', 'outils_djama', 'actif')
ON CONFLICT (email)
DO UPDATE SET
  abonnement = 'outils_djama',
  statut     = 'actif';

-- Vérification
SELECT email, abonnement, statut
FROM clients
WHERE email = 'nofamdjad@gmail.com';

-- Résultat attendu :
--   email      | nofamdjad@gmail.com
--   abonnement | outils_djama
--   statut     | actif
