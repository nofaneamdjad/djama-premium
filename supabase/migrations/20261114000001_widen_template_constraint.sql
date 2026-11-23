-- Migration : élargir la contrainte template pour accepter les 24 nouveaux modèles PDF
-- Remplace le CHECK limité aux 5 anciens noms par un CHECK incluant tous les nouveaux noms.

DO $$
BEGIN
  -- Supprime l'ancienne contrainte si elle existe
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'documents' AND constraint_name = 'documents_template_check'
  ) THEN
    ALTER TABLE documents DROP CONSTRAINT documents_template_check;
  END IF;

  -- Recrée la contrainte élargie : anciens noms (rétrocompat) + 24 nouveaux noms
  ALTER TABLE documents
    ADD CONSTRAINT documents_template_check
      CHECK (template IN (
        -- Anciens noms (rétrocompatibilité)
        'modern', 'minimal', 'classic', 'premium', 'colorful',
        -- Famille Minimaliste
        'min-blanc', 'min-ligne', 'min-grille', 'min-mono',
        -- Famille Corporate
        'corp-marine', 'corp-bipart', 'corp-tampon', 'corp-lateral',
        -- Famille Premium
        'prem-or', 'prem-nuit', 'prem-creme', 'prem-deco',
        -- Famille Créatif
        'creat-bloc', 'creat-angle', 'creat-cadre', 'creat-vif',
        -- Famille Technologie
        'tech-sombre', 'tech-code', 'tech-schema', 'tech-circuit',
        -- Famille Services & Commerce
        'serv-chaud', 'serv-nature', 'comm-boutique', 'comm-classique'
      ));
END $$;
