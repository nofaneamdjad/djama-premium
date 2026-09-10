-- Migration 059 : Table journal d'audit admin
-- Enregistre chaque action sensible effectuée par un administrateur.
-- INSERT uniquement via service_role (routes API) — jamais depuis le browser.
-- Aucune modification ni suppression permise : les logs sont immuables.

CREATE TABLE IF NOT EXISTS admin_logs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  action      text        NOT NULL,
  target_type text,                          -- 'user', 'virement', 'access', etc.
  target_id   text,                          -- id ou email de la cible
  details     jsonb       DEFAULT '{}',      -- données avant/après ou infos libres
  ip          text,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS : personne ne peut lire ni écrire directement
-- Lecture réservée au service_role (routes API admin avec requireAdmin)
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Aucune policy anon/authenticated → tout est refusé par défaut pour le client browser
-- Les routes API utilisent service_role qui bypasse le RLS

-- Index pour les requêtes dashboard
CREATE INDEX IF NOT EXISTS admin_logs_created_at_idx ON admin_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_logs_action_idx     ON admin_logs (action);
CREATE INDEX IF NOT EXISTS admin_logs_target_id_idx  ON admin_logs (target_id);
