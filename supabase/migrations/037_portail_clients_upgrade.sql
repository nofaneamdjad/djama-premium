-- 037_portail_clients_upgrade.sql
-- Ajout colonnes enrichies au portail client

ALTER TABLE portail_clients
  ADD COLUMN IF NOT EXISTS notes    text        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS statut   text        NOT NULL DEFAULT 'actif'
    CHECK (statut IN ('prospect', 'actif', 'pause', 'termine')),
  ADD COLUMN IF NOT EXISTS secteur  text,
  ADD COLUMN IF NOT EXISTS site_web text,
  ADD COLUMN IF NOT EXISTS adresse  text,
  ADD COLUMN IF NOT EXISTS tags     text[]      NOT NULL DEFAULT '{}';
