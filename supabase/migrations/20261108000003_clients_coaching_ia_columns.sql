-- Migration 20261108000003 : Colonnes coaching IA dans clients
-- Ajout des colonnes manquantes utilisées par la route PAYMENT.CAPTURE.COMPLETED
-- Ces colonnes étaient référencées dans le code mais absentes du schéma.

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS coaching_ia_active          BOOLEAN     DEFAULT false,
  ADD COLUMN IF NOT EXISTS coaching_ia_expires         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS coaching_ia_payment_method  TEXT,
  ADD COLUMN IF NOT EXISTS coaching_ia_pending_transfer BOOLEAN    DEFAULT false;

COMMENT ON COLUMN public.clients.coaching_ia_active           IS 'Accès coaching IA actuellement actif';
COMMENT ON COLUMN public.clients.coaching_ia_expires          IS 'Date d''expiration de l''accès coaching IA';
COMMENT ON COLUMN public.clients.coaching_ia_payment_method   IS 'Méthode de paiement coaching IA (paypal, stripe…)';
COMMENT ON COLUMN public.clients.coaching_ia_pending_transfer IS 'Transfert de session coaching en attente';
