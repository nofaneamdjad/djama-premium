-- ══════════════════════════════════════════════════════════════════
-- Migration 051 : Table sécurisée des apps gratuites sélectionnées
--
-- PROBLÈME CORRIGÉ :
--   clients.free_apps a RLS USING(false) → le middleware ne peut jamais
--   lire cette colonne → les utilisateurs gratuits sont toujours
--   redirigés vers /demarrer même après avoir choisi leurs apps.
--
-- SOLUTION :
--   Table user_free_apps avec SELECT autorisé pour le propriétaire.
--   INSERT autorisé uniquement pour son propre user_id avec max 2 apps
--   (CHECK constraint SQL = impossible de contourner même via SDK direct).
--   UPDATE interdit → sélection verrouillée définitivement.
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_free_apps (
  user_id       uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_apps text[] NOT NULL DEFAULT '{}',
  locked_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT max_two_free_apps CHECK (array_length(selected_apps, 1) BETWEEN 1 AND 2)
);

ALTER TABLE user_free_apps ENABLE ROW LEVEL SECURITY;

-- Lecture : chaque utilisateur voit uniquement ses propres apps
CREATE POLICY "user_free_apps_select_own"
  ON user_free_apps FOR SELECT
  USING (user_id = auth.uid());

-- Insertion : autorisée pour son propre compte avec max 2 apps
-- (la contrainte CHECK ci-dessus bloque tout dépassement, même via SDK direct)
CREATE POLICY "user_free_apps_insert_own"
  ON user_free_apps FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND array_length(selected_apps, 1) BETWEEN 1 AND 2
  );

-- Pas de policy UPDATE → la sélection est verrouillée après insertion
-- Pas de policy DELETE → seul service_role peut supprimer (cas support)

-- ─────────────────────────────────────────────────────────────────
-- Migrer les données existantes depuis clients.free_apps
-- ─────────────────────────────────────────────────────────────────
INSERT INTO user_free_apps (user_id, selected_apps, locked_at)
SELECT
  c.user_id,
  c.free_apps,
  COALESCE(c.free_apps_locked_at, now())
FROM clients c
WHERE c.user_id IS NOT NULL
  AND c.free_apps IS NOT NULL
  AND array_length(c.free_apps, 1) BETWEEN 1 AND 2
ON CONFLICT (user_id) DO NOTHING;
