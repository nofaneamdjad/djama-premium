-- ════════════════════════════════════════════════════════════════════════
-- Migration 20261108000011 — C-01 : Colonne alert_admin_at
--
-- Périmètre :
--   1. alert_admin_at : timestamp de la dernière alerte admin envoyée
--      pour un remboursement uncertain nécessitant intervention humaine.
--      Anti-doublon : si non-NULL, l'alerte a déjà été envoyée.
--
-- Contraintes absolues C-01 :
--   - LOCAL ONLY — ne pas appliquer en production
--   - Idempotent — sûr à rejouer
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE admin_refund_requests
  ADD COLUMN IF NOT EXISTS alert_admin_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN admin_refund_requests.alert_admin_at IS
  'Date d''envoi de la dernière alerte admin (NULL = aucune alerte envoyée). '
  'Anti-doublon : la réconciliation ne renvoie pas d''alerte si cette colonne est non-NULL. '
  'Remise à NULL si le remboursement est résolu (passage à succeeded/failed).';

-- Index pour trouver rapidement les uncertain sans alerte envoyée
CREATE INDEX IF NOT EXISTS idx_refund_req_uncertain_no_alert
  ON admin_refund_requests(id)
  WHERE status = 'uncertain' AND alert_admin_at IS NULL;
