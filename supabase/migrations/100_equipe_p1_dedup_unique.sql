-- ══════════════════════════════════════════════════════════════════════════════
-- Phase 1.1 — team_members : auth_user_id + dédoublonnage + contraintes uniques
-- Idempotent : peut être rejoué sans risque en production
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Ajout colonne auth_user_id ─────────────────────────────────────────────
ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tm_auth_user ON team_members(auth_user_id);

-- ── 2. Audit des doublons avant dédoublonnage ─────────────────────────────────
-- On insère dans une table temporaire de log pour traçabilité.
-- Cette table est créée pour la durée du script puis supprimée.
DO $$
DECLARE
  dup RECORD;
  winner_id UUID;
  loser_ids UUID[];
BEGIN
  -- ── 2a. Log des doublons trouvés ──────────────────────────────────────────
  FOR dup IN
    SELECT
      user_id,
      lower(trim(name)) AS norm_name,
      count(*)           AS nb,
      array_agg(id ORDER BY
        CASE WHEN auth_user_id IS NOT NULL THEN 0 ELSE 1 END,
        created_at ASC
      ) AS ids
    FROM team_members
    GROUP BY user_id, lower(trim(name))
    HAVING count(*) > 1
  LOOP
    -- Le gagnant = premier dans l'array (auth_user_id NOT NULL en prio, puis plus ancien)
    winner_id := dup.ids[1];
    -- Les perdants = tout le reste
    loser_ids := dup.ids[2:];

    RAISE NOTICE 'DOUBLON trouvé — user_id=% nom=% gagnant=% perdants=%',
      dup.user_id, dup.norm_name, winner_id, loser_ids;

    -- ── 2b. Réattribuer team_tasks.assigned_to vers le gagnant ───────────────
    UPDATE team_tasks
    SET assigned_to = winner_id
    WHERE assigned_to = ANY(loser_ids);

    -- ── 2c. Réattribuer team_leaves.member_id vers le gagnant ────────────────
    UPDATE team_leaves
    SET member_id = winner_id
    WHERE member_id = ANY(loser_ids);

    -- ── 2d. Supprimer les doublons (données orphelines après réattribution) ───
    DELETE FROM team_members
    WHERE id = ANY(loser_ids);

  END LOOP;
END;
$$;

-- ── 3. Contraintes unicité (après dédoublonnage) ──────────────────────────────

-- Index unique sur (user_id, nom normalisé)
-- Utilise une expression pour être insensible à la casse et aux espaces
DROP INDEX IF EXISTS uidx_tm_user_name;
CREATE UNIQUE INDEX uidx_tm_user_name
  ON team_members (user_id, lower(trim(name)));

-- Index unique partiel sur (user_id, email normalisé) — seulement si email non vide
DROP INDEX IF EXISTS uidx_tm_user_email;
CREATE UNIQUE INDEX uidx_tm_user_email
  ON team_members (user_id, lower(trim(email)))
  WHERE email IS NOT NULL AND trim(email) != '';

-- Index unique sur auth_user_id — un compte Auth ne peut lier qu'un seul membre
DROP INDEX IF EXISTS uidx_tm_auth_user_id;
CREATE UNIQUE INDEX uidx_tm_auth_user_id
  ON team_members (auth_user_id)
  WHERE auth_user_id IS NOT NULL;
