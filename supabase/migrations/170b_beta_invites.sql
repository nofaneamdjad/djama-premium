-- 170_beta_invites.sql — Système d'invitations bêta privée

CREATE TABLE IF NOT EXISTS beta_invites (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text NOT NULL UNIQUE,
  token        text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','accepted','expired','revoked')),
  invited_by   text DEFAULT 'admin',
  notes        text,
  modules      text[] DEFAULT '{}',
  accepted_at  timestamptz,
  expires_at   timestamptz DEFAULT (now() + INTERVAL '30 days'),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Pas de RLS sur cette table — lecture/écriture via service_role uniquement (admin)
-- Les utilisateurs vérifient leur invite via /api/beta/verify?token=...
