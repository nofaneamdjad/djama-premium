-- ════════════════════════════════════════════════════════════════════════
-- 094_prod_p8_performance.sql
-- Phase 8 : index de performance + optimisations requêtes
-- ════════════════════════════════════════════════════════════════════════

-- ── Index composites pour les requêtes les plus fréquentes ──────────────

-- Filtre principal : user_id + status + sort_order (load())
CREATE INDEX IF NOT EXISTS idx_prod_user_status_sort
  ON productivity_tasks (user_id, status, sort_order);

-- Filtre org_mode : organization_id + status
CREATE INDEX IF NOT EXISTS idx_prod_org_status
  ON productivity_tasks (organization_id, status)
  WHERE organization_id IS NOT NULL;

-- Filtre date limite pour les vues "aujourd'hui" et "en retard"
CREATE INDEX IF NOT EXISTS idx_prod_due_date
  ON productivity_tasks (due_date)
  WHERE due_date IS NOT NULL AND status <> 'done';

-- Filtre priority + user_id (filtre sidebar)
CREATE INDEX IF NOT EXISTS idx_prod_user_priority
  ON productivity_tasks (user_id, priority);

-- Index created_at pour l'ordre de chargement initial
CREATE INDEX IF NOT EXISTS idx_prod_created
  ON productivity_tasks (user_id, created_at DESC);

-- task_comments : limite par tâche (les 50 plus récents)
CREATE INDEX IF NOT EXISTS idx_tcmt_task_created
  ON task_comments (task_id, created_at DESC);

-- task_reminders : rappels en attente triés par date
CREATE INDEX IF NOT EXISTS idx_treminder_remind_at
  ON task_reminders (remind_at, sent)
  WHERE sent = false;

-- productivity_templates : usage fréquent par user
CREATE INDEX IF NOT EXISTS idx_ptpl_user_name
  ON productivity_templates (user_id, name);
