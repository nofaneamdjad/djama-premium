-- ════════════════════════════════════════════════════════════════════════
-- 096_planning_p3_recurrence.sql
-- Phase 3 Planning : Récurrence complète
--
-- Ajoute :
--   planning_events.recurrence_rule      TEXT  (RRULE ex: FREQ=WEEKLY;BYDAY=MO,WE,FR)
--   planning_events.recurrence_parent_id UUID  FK → planning_events(id)
--   planning_events.recurrence_end_date  DATE
--
-- Idempotent — données existantes inchangées (colonnes nullable)
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE planning_events
  ADD COLUMN IF NOT EXISTS recurrence_rule       text,
  ADD COLUMN IF NOT EXISTS recurrence_parent_id  uuid REFERENCES planning_events(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS recurrence_end_date   date;

CREATE INDEX IF NOT EXISTS idx_pe_recurrence_parent
  ON planning_events(recurrence_parent_id)
  WHERE recurrence_parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pe_recurrence_rule
  ON planning_events(user_id, recurrence_rule)
  WHERE recurrence_rule IS NOT NULL;
