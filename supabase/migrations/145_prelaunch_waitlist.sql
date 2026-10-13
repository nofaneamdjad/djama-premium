-- Migration 145 : Liste d'attente pré-lancement DJAMA
-- Créée le 2026-10-13

CREATE TABLE IF NOT EXISTS prelaunch_waitlist (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom         TEXT NOT NULL,
  email       TEXT NOT NULL,
  entreprise  TEXT,
  pays        TEXT,
  consent     BOOLEAN NOT NULL DEFAULT FALSE,
  ip_hash     TEXT,
  source      TEXT NOT NULL DEFAULT 'djama.space',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (email)
);

ALTER TABLE prelaunch_waitlist ENABLE ROW LEVEL SECURITY;
-- Aucune policy publique — lecture uniquement via service_role (admin).
-- L'insertion se fait exclusivement via l'API Route /api/waitlist
-- qui utilise la service_role key côté serveur.

COMMENT ON TABLE prelaunch_waitlist IS 'Liste d''attente pré-lancement djama.space';
COMMENT ON COLUMN prelaunch_waitlist.ip_hash IS 'SHA-256 de l''IP pour anti-spam — non réversible';
COMMENT ON COLUMN prelaunch_waitlist.consent IS 'Consentement RGPD explicite au moment de l''inscription';
