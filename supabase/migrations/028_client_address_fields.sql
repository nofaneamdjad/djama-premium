-- Ajout des champs adresse détaillée et TVA client sur la table documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS client_ville        text NOT NULL DEFAULT '';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS client_code_postal  text NOT NULL DEFAULT '';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS client_pays         text NOT NULL DEFAULT '';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS client_tva          text NOT NULL DEFAULT '';
