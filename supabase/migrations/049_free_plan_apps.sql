-- 049_free_plan_apps.sql
-- Stocke les 2 apps gratuites choisies par l'utilisateur lors de l'inscription

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS free_apps text[]       DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS free_apps_locked_at timestamptz DEFAULT NULL;

COMMENT ON COLUMN clients.free_apps          IS 'Slugs des 2 apps choisies sur le plan gratuit';
COMMENT ON COLUMN clients.free_apps_locked_at IS 'Date de verrouillage définitif de la sélection';
