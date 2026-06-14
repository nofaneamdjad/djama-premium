-- Migration 032 : ajoute la colonne next_relance sur contacts
-- Utilisée par la page CRM pour planifier les relances clients

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS next_relance date;
