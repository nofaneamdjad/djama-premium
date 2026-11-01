-- Migration 173 : Table admin_logs pour la console d'administration SaaS
-- Reprend la définition 059_admin_logs.sql dans le schéma numéroté 1xx.
-- INSERT uniquement via service_role (routes API) — jamais depuis le navigateur.
-- Les logs sont immuables : aucune UPDATE ni DELETE autorisée.

CREATE TABLE IF NOT EXISTS admin_logs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  action      text        NOT NULL,
  admin_id    text,                          -- email ou id de l'admin ayant agi
  target_type text,                          -- 'user', 'access', 'subscription', etc.
  target_id   text,                          -- id ou email de la cible
  details     jsonb       DEFAULT '{}',      -- données avant/après ou infos libres
  ip          text,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS : lecture réservée au service_role (routes API admin avec requireAdmin)
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Aucune policy anon/authenticated → refus par défaut pour le client browser
-- Le service_role bypasse le RLS → seules les routes /api/admin/* peuvent lire/écrire

-- Ajouter admin_id si absent (admin_logs créé en 059 sans cette colonne)
ALTER TABLE admin_logs ADD COLUMN IF NOT EXISTS admin_id text;

-- Index pour les requêtes tableau de bord
CREATE INDEX IF NOT EXISTS admin_logs_created_at_idx  ON admin_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_logs_action_idx      ON admin_logs (action);
CREATE INDEX IF NOT EXISTS admin_logs_target_id_idx   ON admin_logs (target_id);
CREATE INDEX IF NOT EXISTS admin_logs_admin_id_idx    ON admin_logs (admin_id);
