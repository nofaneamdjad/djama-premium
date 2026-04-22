-- Migration 017 — Ajoute la colonne template à la table documents (espace client)
-- Valeur par défaut : 'modern' (compatible avec l'existant)

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS template TEXT NOT NULL DEFAULT 'modern';

-- Contrainte optionnelle pour valider les valeurs autorisées
ALTER TABLE documents
  ADD CONSTRAINT IF NOT EXISTS documents_template_check
    CHECK (template IN ('modern', 'minimal', 'classic', 'premium', 'colorful'));

-- Index si on veut filtrer par template un jour
CREATE INDEX IF NOT EXISTS idx_documents_template ON documents (template);
