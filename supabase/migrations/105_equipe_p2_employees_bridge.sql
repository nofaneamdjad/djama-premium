-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 105 — Bridge employes ↔ team_members
-- Phase 2.3 — liaison bidirectionnelle sans double saisie
--
-- Stratégie :
--   1. Ajouter team_member_id (FK nullable) sur employes
--   2. Ajouter employe_id    (FK nullable) sur team_members
--   3. Backfill automatique par (user_id, email)
--   4. Nouvelles RLS : chef peut voir ses employes + membres liés
--
-- RÈGLES :
--   - Aucune colonne existante supprimée
--   - Toutes les colonnes ajoutées sont nullable (jamais de contrainte NOT NULL)
--   - Migration idempotente (IF NOT EXISTS / IF EXISTS partout)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. Colonnes de liaison ────────────────────────────────────────────────────

ALTER TABLE employes
  ADD COLUMN IF NOT EXISTS team_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL;

ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS employe_id UUID REFERENCES employes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employes_team_member_id
  ON employes (team_member_id) WHERE team_member_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tm_employe_id
  ON team_members (employe_id) WHERE employe_id IS NOT NULL;

-- ── 2. Backfill — liaison par (user_id, email normalisé) ─────────────────────
--
-- Un employé dans `employes` appartient à un chef (user_id).
-- Un membre dans `team_members` appartient au même chef (user_id).
-- On les lie si leurs emails correspondent.

DO $$
DECLARE
  emp RECORD;
  tm_id UUID;
BEGIN
  FOR emp IN
    SELECT e.id AS emp_id, e.user_id, lower(trim(e.email)) AS email_norm
    FROM employes e
    WHERE e.email IS NOT NULL
      AND trim(e.email) != ''
      AND e.team_member_id IS NULL
  LOOP
    SELECT tm.id INTO tm_id
    FROM team_members tm
    WHERE tm.user_id = emp.user_id
      AND lower(trim(tm.email)) = emp.email_norm
    LIMIT 1;

    IF tm_id IS NOT NULL THEN
      UPDATE employes   SET team_member_id = tm_id   WHERE id = emp.emp_id;
      UPDATE team_members SET employe_id   = emp.emp_id WHERE id = tm_id;
    END IF;
  END LOOP;
END;
$$;

-- ── 3. Vue de convenance pour l'interface de liaison ─────────────────────────
--
-- Fournit une vue joignant employes + team_members pour le chef,
-- utile pour afficher les correspondances et lacunes.

CREATE OR REPLACE VIEW v_employe_member_bridge AS
  SELECT
    e.id            AS employe_id,
    e.user_id       AS chef_id,
    e.organization_id,
    e.nom           AS employe_nom,
    e.poste,
    e.email         AS employe_email,
    e.team_member_id,
    tm.id           AS tm_id,
    tm.name         AS tm_name,
    tm.email        AS tm_email,
    tm.auth_user_id,
    tm.employe_id   AS tm_employe_id,
    CASE
      WHEN e.team_member_id IS NOT NULL AND tm.employe_id IS NOT NULL THEN 'lié'
      WHEN e.team_member_id IS NOT NULL OR tm.employe_id IS NOT NULL  THEN 'partiel'
      ELSE 'non_lié'
    END             AS statut_liaison
  FROM employes e
  LEFT JOIN team_members tm
    ON tm.id = e.team_member_id
    OR (tm.employe_id = e.id);

-- ── 4. RLS sur employes (ajout accès chef pour team_member lié) ──────────────
--
-- La RLS existante sur employes : user_id = auth.uid()
-- On la préserve. Pas besoin d'en rajouter — le chef accède déjà à ses
-- employes via user_id, et les membres n'ont pas accès direct à employes.
-- L'API fera les joins nécessaires avec service_role.

-- ── Vérification ─────────────────────────────────────────────────────────────

DO $$
DECLARE
  linked_count   INT;
  unlinked_emp   INT;
  unlinked_tm    INT;
BEGIN
  SELECT COUNT(*) INTO linked_count
  FROM employes e
  JOIN team_members tm ON tm.id = e.team_member_id;

  SELECT COUNT(*) INTO unlinked_emp
  FROM employes e
  WHERE e.email IS NOT NULL AND trim(e.email) != ''
    AND e.team_member_id IS NULL;

  SELECT COUNT(*) INTO unlinked_tm
  FROM team_members tm
  WHERE tm.email IS NOT NULL AND trim(tm.email) != ''
    AND tm.employe_id IS NULL;

  RAISE NOTICE '[105] Bridge employes<>team_members :';
  RAISE NOTICE '  Liaisons créées     : %', linked_count;
  RAISE NOTICE '  Employes non liés   : % (email sans correspondance team_member)', unlinked_emp;
  RAISE NOTICE '  Membres non liés    : % (email sans correspondance employe)',      unlinked_tm;
END;
$$;
