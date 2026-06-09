-- Migration : colonnes adresses séparées pour la table documents
-- Client : client_ville, client_code_postal, client_pays, client_tva
-- Emetteur : emetteur_ville, emetteur_code_postal, emetteur_pays

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS client_ville        text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS client_code_postal  text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS client_pays         text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS client_tva          text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS emetteur_ville      text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS emetteur_code_postal text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS emetteur_pays       text NOT NULL DEFAULT '';
