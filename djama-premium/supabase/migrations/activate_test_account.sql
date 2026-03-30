-- ══════════════════════════════════════════════════════════════════
-- Activation du compte test DJAMA admin
-- À exécuter dans : Supabase Dashboard → SQL Editor → Run
--
-- Compte : nofamdjad@gmail.com
-- User ID Supabase : 4cf716cd-e1b3-4695-aa53-c9694bafa5ec
-- ══════════════════════════════════════════════════════════════════

-- ── Étape 1 : S'assurer que user_id existe dans clients ──────────
-- (au cas où la colonne n'aurait pas encore été créée)
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS user_id       uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS abonnement    text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS statut        text DEFAULT 'inactif',
  ADD COLUMN IF NOT EXISTS paid          boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscribed_at timestamptz DEFAULT NULL;

-- Contrainte unique sur user_id (nécessaire pour le upsert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'clients_user_id_key' AND conrelid = 'clients'::regclass
  ) THEN
    ALTER TABLE clients ADD CONSTRAINT clients_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- ── Étape 2 : Activer le compte test ─────────────────────────────
INSERT INTO clients (
  user_id,
  email,
  nom,
  abonnement,
  statut,
  paid,
  subscribed_at
)
VALUES (
  '4cf716cd-e1b3-4695-aa53-c9694bafa5ec',  -- user_id Supabase
  'nofamdjad@gmail.com',
  'DJAMA Admin',
  'outils_djama',
  'actif',
  true,
  now()
)
ON CONFLICT (user_id) DO UPDATE SET
  email         = EXCLUDED.email,
  nom           = EXCLUDED.nom,
  abonnement    = 'outils_djama',
  statut        = 'actif',
  paid          = true,
  subscribed_at = now();

-- ── Étape 3 : Vérification ───────────────────────────────────────
SELECT
  user_id,
  email,
  nom,
  abonnement,
  statut,
  paid,
  subscribed_at
FROM clients
WHERE email = 'nofamdjad@gmail.com';

-- Résultat attendu :
--  user_id      | 4cf716cd-e1b3-4695-aa53-c9694bafa5ec
--  email        | nofamdjad@gmail.com
--  abonnement   | outils_djama
--  statut       | actif
--  paid         | true
-- ════════════════════════════════════════════════════════════════
-- IMPORTANT : Après avoir exécuté ce SQL, reconnectez-vous sur /login.
-- Le middleware vérifiera la table clients et accordera l'accès.
-- ════════════════════════════════════════════════════════════════
