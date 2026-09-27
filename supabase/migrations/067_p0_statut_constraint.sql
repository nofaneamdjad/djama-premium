-- Migration 067 — P0.1 : Correction contrainte documents.statut
-- Raison : 'partiellement_payé' était rejeté par la BD (constraint violation)
--          + ajout des statuts devis : accepté, refusé, expiré
-- Idempotent : DROP CONSTRAINT IF EXISTS avant ADD
DO $$
BEGIN
  ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_statut_check;
  ALTER TABLE documents ADD CONSTRAINT documents_statut_check
    CHECK (statut IN (
      'brouillon',
      'envoyé',
      'payé',
      'en_retard',
      'partiellement_payé',
      'accepté',
      'refusé',
      'expiré'
    ));
END;
$$;
