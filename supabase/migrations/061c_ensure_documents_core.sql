-- Migration de récupération minimale : garantit que documents existe.
-- CREATE TABLE IF NOT EXISTS = no-op si documents existe déjà.

CREATE TABLE IF NOT EXISTS documents (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type             text         NOT NULL DEFAULT 'facture',
  numero           text         NOT NULL DEFAULT '',
  statut           text         NOT NULL DEFAULT 'brouillon',
  emetteur_nom     text         NOT NULL DEFAULT '',
  emetteur_email   text         NOT NULL DEFAULT '',
  emetteur_adresse text         NOT NULL DEFAULT '',
  emetteur_siret   text         NOT NULL DEFAULT '',
  client_nom       text         NOT NULL DEFAULT '',
  client_email     text         NOT NULL DEFAULT '',
  client_adresse   text         NOT NULL DEFAULT '',
  date_document    date         NOT NULL DEFAULT CURRENT_DATE,
  date_echeance    date,
  notes            text         NOT NULL DEFAULT '',
  conditions       text         NOT NULL DEFAULT '',
  total_ht         numeric(12,2) NOT NULL DEFAULT 0,
  total_tva        numeric(12,2) NOT NULL DEFAULT 0,
  total_ttc        numeric(12,2) NOT NULL DEFAULT 0,
  created_at       timestamptz  NOT NULL DEFAULT now(),
  updated_at       timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_items (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   uuid          NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  position      integer       NOT NULL DEFAULT 0,
  description   text          NOT NULL DEFAULT '',
  quantity      numeric(10,3) NOT NULL DEFAULT 1,
  unit_price    numeric(12,2) NOT NULL DEFAULT 0,
  vat_rate      numeric(5,2)  NOT NULL DEFAULT 20
);

ALTER TABLE documents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_items ENABLE ROW LEVEL SECURITY;
