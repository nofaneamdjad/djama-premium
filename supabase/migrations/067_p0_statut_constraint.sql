-- Migration 067 — P0.1 : Correction contrainte documents.statut
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='documents') THEN
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
  END IF;
END;
$$;
