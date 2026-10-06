-- 132_coaching_rls_phase15.sql
-- Phase 15 — Sécurité / RLS coaching IA
--
-- RÈGLE ABSOLUE : migration 100 % idempotente.
-- Rien n'est supprimé ni modifié sur les données utilisateurs.
--
-- Corrections :
--   1. Restreindre la lecture du catalogue aux utilisateurs authentifiés
--      (précédemment : toute requête anonyme pouvait lire le catalogue)
--   2. Ajouter WITH CHECK aux politiques UPDATE (empêche le changement de user_id)
--   3. Créer coaching_audit_log + trigger de complétion automatique

-- ─────────────────────────────────────────────────────────────────────────
--  1. CATALOGUE — lecture réservée aux utilisateurs authentifiés
-- ─────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "catalog_formations_read"   ON coaching_formations;
DROP POLICY IF EXISTS "catalog_modules_read"      ON coaching_modules_catalog;
DROP POLICY IF EXISTS "catalog_chapters_read"     ON coaching_chapters_catalog;

CREATE POLICY "catalog_formations_read"   ON coaching_formations
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "catalog_modules_read"      ON coaching_modules_catalog
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "catalog_chapters_read"     ON coaching_chapters_catalog
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

-- ─────────────────────────────────────────────────────────────────────────
--  2. WITH CHECK sur les politiques UPDATE
--     (sans WITH CHECK, un UPDATE pourrait changer user_id vers un autre compte)
-- ─────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "enrollment_own_update" ON coaching_enrollments;
CREATE POLICY "enrollment_own_update" ON coaching_enrollments
  FOR UPDATE
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "chapter_progress_own_update" ON coaching_chapter_progress;
CREATE POLICY "chapter_progress_own_update" ON coaching_chapter_progress
  FOR UPDATE
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Idem pour coaching_progress (table legacy 036)
DROP POLICY IF EXISTS "coaching_progress_own" ON coaching_progress;
CREATE POLICY "coaching_progress_own" ON coaching_progress
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
--  3. TABLE coaching_audit_log
--     Immutable — seule la fonction trigger (SECURITY DEFINER) peut écrire.
--     Aucune politique INSERT/UPDATE/DELETE côté client.
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coaching_audit_log (
  id         uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id uuid        REFERENCES coaching_chapters_catalog(id) ON DELETE SET NULL,
  legacy_id  text,
  action     text        NOT NULL,  -- 'chapter_completed'
  metadata   jsonb       NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE coaching_audit_log ENABLE ROW LEVEL SECURITY;

-- L'utilisateur peut lire son propre journal ; personne ne peut écrire via client
DROP POLICY IF EXISTS "coaching_audit_log_select_own" ON coaching_audit_log;
CREATE POLICY "coaching_audit_log_select_own" ON coaching_audit_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_coaching_audit_user_created
  ON coaching_audit_log (user_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────
--  4. TRIGGER — journaliser automatiquement chaque première complétion
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION coaching_log_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Déclencher uniquement lors du premier passage à completed = true
  IF NEW.completed = true
     AND (OLD IS NULL OR OLD.completed IS DISTINCT FROM true) THEN
    INSERT INTO coaching_audit_log (user_id, chapter_id, action)
    VALUES (NEW.user_id, NEW.chapter_id, 'chapter_completed');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_coaching_chapter_completion ON coaching_chapter_progress;
CREATE TRIGGER trg_coaching_chapter_completion
  AFTER INSERT OR UPDATE ON coaching_chapter_progress
  FOR EACH ROW EXECUTE FUNCTION coaching_log_completion();
