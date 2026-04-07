-- ═══════════════════════════════════════════════════════════════
-- DJAMA — Migration 007 : Fix reservations RLS
-- Exécuter dans : Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Drop the old combined policy (if it exists)
DROP POLICY IF EXISTS "anon all reservations" ON reservations;

-- Explicit individual policies
CREATE POLICY "select reservations"
  ON reservations FOR SELECT
  USING (true);

CREATE POLICY "insert reservations"
  ON reservations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "update reservations"
  ON reservations FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "delete reservations"
  ON reservations FOR DELETE
  USING (true);
