-- Migration : Chantier E — nouveaux champs documents (paiement, langue, fiscalité, banque)
-- Toutes les colonnes sont nullable ou ont un DEFAULT pour ne pas affecter les lignes existantes.

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS doc_lang           text    DEFAULT 'fr',
  ADD COLUMN IF NOT EXISTS tax_system         text    DEFAULT 'tva',
  ADD COLUMN IF NOT EXISTS remise_type        text    DEFAULT 'pct',
  ADD COLUMN IF NOT EXISTS remise_fixe        numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS acompte_type       text    DEFAULT 'Acompte',
  ADD COLUMN IF NOT EXISTS mode_reglement     text,
  ADD COLUMN IF NOT EXISTS delai_paiement     text    DEFAULT '30 jours',
  ADD COLUMN IF NOT EXISTS bank_mode          text    DEFAULT 'iban',
  ADD COLUMN IF NOT EXISTS bank_account       text,
  ADD COLUMN IF NOT EXISTS bank_routing       text,
  ADD COLUMN IF NOT EXISTS bank_correspondant text;
