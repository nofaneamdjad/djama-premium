-- 169_support_tickets.sql — Système de support client bêta

CREATE TABLE IF NOT EXISTS support_tickets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email       text NOT NULL,
  category    text NOT NULL CHECK (category IN ('bug','question','feature','billing','other')),
  subject     text NOT NULL,
  message     text NOT NULL,
  status      text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  priority    text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),
  admin_reply text,
  replied_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Utilisateurs : lisent / créent leurs propres tickets
CREATE POLICY "support_tickets_own_read" ON support_tickets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "support_tickets_own_insert" ON support_tickets
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Index
CREATE INDEX IF NOT EXISTS support_tickets_user_idx   ON support_tickets (user_id);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets (status);
CREATE INDEX IF NOT EXISTS support_tickets_created_idx ON support_tickets (created_at DESC);
