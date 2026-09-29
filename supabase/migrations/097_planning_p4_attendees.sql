-- ════════════════════════════════════════════════════════════════════════
-- 097_planning_p4_attendees.sql
-- Phase 4 Planning : Participants réels (membres de l'organisation)
--
-- Crée planning_event_attendees :
--   event_id        → planning_events(id) ON DELETE CASCADE
--   user_id         → auth.users(id) ON DELETE CASCADE
--   status          : invited | accepted | declined | tentative
--   invited_at      TIMESTAMPTZ
--
-- RLS : visible par le propriétaire de l'événement ou le membre invité
-- Idempotent
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS planning_event_attendees (
  event_id    uuid         NOT NULL REFERENCES planning_events(id) ON DELETE CASCADE,
  user_id     uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status      text         NOT NULL DEFAULT 'invited'
                           CHECK (status IN ('invited','accepted','declined','tentative')),
  invited_at  timestamptz  NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

ALTER TABLE planning_event_attendees ENABLE ROW LEVEL SECURITY;

-- Voir ses propres invitations OU les invitations d'un événement dont on est propriétaire
CREATE POLICY IF NOT EXISTS "pea_select" ON planning_event_attendees FOR SELECT
  USING (
    user_id = auth.uid()
    OR event_id IN (
      SELECT id FROM planning_events WHERE user_id = auth.uid()
    )
  );

-- Seul le propriétaire de l'événement peut inviter
CREATE POLICY IF NOT EXISTS "pea_insert" ON planning_event_attendees FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM planning_events WHERE user_id = auth.uid()
    )
  );

-- L'invité peut mettre à jour son propre statut
CREATE POLICY IF NOT EXISTS "pea_update" ON planning_event_attendees FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Le propriétaire peut retirer un participant
CREATE POLICY IF NOT EXISTS "pea_delete" ON planning_event_attendees FOR DELETE
  USING (
    user_id = auth.uid()
    OR event_id IN (
      SELECT id FROM planning_events WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_pea_event_id ON planning_event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_pea_user_id  ON planning_event_attendees(user_id);
