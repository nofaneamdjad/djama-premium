-- ============================================================
-- Migration 169 — DJAMA HQ Fondations (Jalon A)
-- Employés internes, RBAC, départements, invitations, audit
-- ============================================================

-- Départements DJAMA
CREATE TABLE IF NOT EXISTS hq_departments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  description text,
  color       text NOT NULL DEFAULT '#c9a55a',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Rôles HQ (système + personnalisés)
CREATE TABLE IF NOT EXISTS hq_roles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text NOT NULL UNIQUE,
  description   text,
  level         integer NOT NULL DEFAULT 3 CHECK (level BETWEEN 1 AND 3), -- 1=direction, 2=manager, 3=employé
  is_system     boolean NOT NULL DEFAULT false,
  department_id uuid REFERENCES hq_departments(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Permissions granulaires
CREATE TABLE IF NOT EXISTS hq_permissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  label       text NOT NULL,
  description text,
  category    text NOT NULL
);

-- Liaison rôles ↔ permissions
CREATE TABLE IF NOT EXISTS hq_role_permissions (
  role_id       uuid NOT NULL REFERENCES hq_roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES hq_permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Employés DJAMA (≠ entreprises clientes)
CREATE TABLE IF NOT EXISTS hq_employees (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email         text NOT NULL UNIQUE,
  first_name    text NOT NULL,
  last_name     text NOT NULL,
  job_title     text,
  department_id uuid REFERENCES hq_departments(id) ON DELETE SET NULL,
  manager_id    uuid REFERENCES hq_employees(id) ON DELETE SET NULL,
  status        text NOT NULL DEFAULT 'invited'
                CHECK (status IN ('invited','active','suspended','offboarded')),
  avatar_url    text,
  phone         text,
  started_at    date,
  ended_at      date,
  metadata      jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- head_employee_id ajouté ici pour éviter la dépendance circulaire
ALTER TABLE hq_departments
  ADD COLUMN IF NOT EXISTS head_employee_id uuid REFERENCES hq_employees(id) ON DELETE SET NULL;

-- Liaison employés ↔ rôles
CREATE TABLE IF NOT EXISTS hq_employee_roles (
  employee_id uuid NOT NULL REFERENCES hq_employees(id) ON DELETE CASCADE,
  role_id     uuid NOT NULL REFERENCES hq_roles(id) ON DELETE CASCADE,
  granted_by  uuid REFERENCES hq_employees(id) ON DELETE SET NULL,
  granted_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (employee_id, role_id)
);

-- Invitations employés (token sécurisé, 7 jours)
CREATE TABLE IF NOT EXISTS hq_invitations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL,
  token         text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  role_id       uuid REFERENCES hq_roles(id) ON DELETE SET NULL,
  department_id uuid REFERENCES hq_departments(id) ON DELETE SET NULL,
  job_title     text,
  invited_by    uuid REFERENCES hq_employees(id) ON DELETE SET NULL,
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','accepted','expired','revoked')),
  expires_at    timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Journal d'audit HQ (immuable)
CREATE TABLE IF NOT EXISTS hq_audit_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      uuid,
  actor_type    text NOT NULL DEFAULT 'admin' CHECK (actor_type IN ('admin','employee')),
  action        text NOT NULL,
  resource_type text,
  resource_id   uuid,
  details       jsonb NOT NULL DEFAULT '{}',
  ip_address    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Index de performance
CREATE INDEX IF NOT EXISTS hq_employees_department_idx ON hq_employees (department_id);
CREATE INDEX IF NOT EXISTS hq_employees_status_idx ON hq_employees (status);
CREATE INDEX IF NOT EXISTS hq_employees_user_id_idx ON hq_employees (user_id);
CREATE INDEX IF NOT EXISTS hq_invitations_token_idx ON hq_invitations (token);
CREATE INDEX IF NOT EXISTS hq_invitations_email_idx ON hq_invitations (email);
CREATE INDEX IF NOT EXISTS hq_audit_log_actor_idx ON hq_audit_log (actor_id);
CREATE INDEX IF NOT EXISTS hq_audit_log_action_idx ON hq_audit_log (action);
CREATE INDEX IF NOT EXISTS hq_audit_log_created_idx ON hq_audit_log (created_at DESC);

-- RLS (toutes les routes passent par service_role via requireAdmin)
ALTER TABLE hq_departments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_roles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_permissions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_employees       ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_employee_roles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_invitations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_audit_log       ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Seed : Départements
-- ============================================================
INSERT INTO hq_departments (name, slug, description, color) VALUES
  ('Direction',            'direction',    'Direction générale de DJAMA',                    '#c9a55a'),
  ('Commercial',           'commercial',   'Équipe commerciale et développement des ventes',  '#3b82f6'),
  ('Support',              'support',      'Assistance client et relation utilisateurs',       '#22c55e'),
  ('Informatique',         'informatique', 'Développement, infrastructure et technique',       '#8b5cf6'),
  ('Marketing',            'marketing',    'Marketing, acquisition et communication',          '#f59e0b'),
  ('Finance',              'finance',      'Comptabilité, finances et facturation',            '#06b6d4'),
  ('Ressources Humaines',  'rh',           'Recrutement et gestion des talents',               '#ec4899')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Seed : Rôles système
-- ============================================================
INSERT INTO hq_roles (name, slug, description, level, is_system, department_id)
SELECT name, slug, description, level, true, d.id
FROM (VALUES
  ('Directeur Général',      'director',           'Accès complet DJAMA HQ',                           1, 'direction'),
  ('Responsable Commercial', 'manager-commercial', 'Responsable de l''équipe commerciale',              2, 'commercial'),
  ('Responsable Support',    'manager-support',    'Responsable du service client',                     2, 'support'),
  ('Responsable Technique',  'manager-tech',       'Responsable de l''équipe informatique',             2, 'informatique'),
  ('Responsable Marketing',  'manager-marketing',  'Responsable marketing et communication',            2, 'marketing'),
  ('Responsable Finance',    'manager-finance',    'Responsable financier',                             2, 'finance'),
  ('Responsable RH',         'manager-rh',         'Responsable des ressources humaines',               2, 'rh'),
  ('Commercial',             'employee-commercial','Commercial DJAMA',                                  3, 'commercial'),
  ('Agent Support',          'employee-support',   'Agent de support client',                           3, 'support'),
  ('Développeur',            'employee-dev',       'Développeur ou technicien informatique',            3, 'informatique'),
  ('Chargé Marketing',       'employee-marketing', 'Chargé de marketing ou communication',              3, 'marketing'),
  ('Comptable',              'employee-finance',   'Comptable ou gestionnaire financier',               3, 'finance'),
  ('Assistant RH',           'employee-rh',        'Assistant ou gestionnaire RH',                      3, 'rh')
) AS v(name, slug, description, level, dept_slug)
LEFT JOIN hq_departments d ON d.slug = v.dept_slug
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Seed : Permissions granulaires
-- ============================================================
INSERT INTO hq_permissions (slug, label, category, description) VALUES
  ('customers.read',              'Voir les clients',             'customers',      'Liste et profils clients'),
  ('customers.support_access',    'Accès support client',         'customers',      'Infos limitées pour traiter un ticket'),
  ('customers.manage',            'Gérer les clients',            'customers',      'Modifier, suspendre, réactiver'),
  ('subscriptions.read',          'Voir les abonnements',         'subscriptions',  NULL),
  ('subscriptions.manage',        'Gérer les abonnements',        'subscriptions',  'Modifier, annuler'),
  ('finance.read',                'Voir les finances',            'finance',        'Rapports et revenus'),
  ('finance.manage',              'Gérer les finances',           'finance',        'Paiements, remboursements'),
  ('employees.read',              'Voir les employés',            'employees',      NULL),
  ('employees.invite',            'Inviter des employés',         'employees',      NULL),
  ('employees.manage',            'Gérer les employés',           'employees',      'Modifier, suspendre'),
  ('roles.read',                  'Voir les rôles',               'roles',          NULL),
  ('roles.manage',                'Gérer les rôles',              'roles',          'Créer et modifier des rôles'),
  ('incidents.read',              'Voir les incidents',           'incidents',      NULL),
  ('incidents.manage',            'Gérer les incidents',          'incidents',      NULL),
  ('platform.settings.read',      'Voir les paramètres',          'platform',       NULL),
  ('platform.settings.manage',    'Gérer les paramètres',         'platform',       'Configuration globale'),
  ('platform.apps.manage',        'Gérer les applications',       'platform',       'Feature flags'),
  ('audit_logs.read',             'Voir les logs d''audit',       'audit',          NULL),
  ('crm.read',                    'Voir le CRM interne',          'crm',            NULL),
  ('crm.manage',                  'Gérer le CRM interne',         'crm',            'Prospects, pipeline'),
  ('support.read',                'Voir les tickets support',     'support',        NULL),
  ('support.manage',              'Gérer les tickets support',    'support',        'Répondre, escalader'),
  ('marketing.read',              'Voir les campagnes',           'marketing',      NULL),
  ('marketing.manage',            'Gérer les campagnes',          'marketing',      NULL),
  ('data.export',                 'Exporter les données',         'data',           'Rapports et exports')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Permissions du Directeur Général (accès total)
-- ============================================================
INSERT INTO hq_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM hq_roles r
CROSS JOIN hq_permissions p
WHERE r.slug = 'director'
ON CONFLICT DO NOTHING;

-- Responsable Commercial
INSERT INTO hq_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM hq_roles r, hq_permissions p
WHERE r.slug = 'manager-commercial'
  AND p.slug IN ('customers.read','subscriptions.read','crm.read','crm.manage','employees.read','audit_logs.read')
ON CONFLICT DO NOTHING;

-- Responsable Support
INSERT INTO hq_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM hq_roles r, hq_permissions p
WHERE r.slug = 'manager-support'
  AND p.slug IN ('customers.read','customers.support_access','support.read','support.manage','incidents.read','incidents.manage','employees.read')
ON CONFLICT DO NOTHING;

-- Responsable Technique
INSERT INTO hq_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM hq_roles r, hq_permissions p
WHERE r.slug = 'manager-tech'
  AND p.slug IN ('incidents.read','incidents.manage','platform.settings.read','platform.apps.manage','audit_logs.read','employees.read')
ON CONFLICT DO NOTHING;

-- Responsable Finance
INSERT INTO hq_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM hq_roles r, hq_permissions p
WHERE r.slug = 'manager-finance'
  AND p.slug IN ('finance.read','finance.manage','subscriptions.read','data.export','customers.read')
ON CONFLICT DO NOTHING;

-- Employés de base (rôles niveau 3)
INSERT INTO hq_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM hq_roles r, hq_permissions p
WHERE r.slug = 'employee-commercial' AND p.slug IN ('crm.read','crm.manage','customers.read')
ON CONFLICT DO NOTHING;

INSERT INTO hq_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM hq_roles r, hq_permissions p
WHERE r.slug = 'employee-support' AND p.slug IN ('support.read','support.manage','customers.support_access')
ON CONFLICT DO NOTHING;

INSERT INTO hq_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM hq_roles r, hq_permissions p
WHERE r.slug = 'employee-dev' AND p.slug IN ('incidents.read','incidents.manage','platform.settings.read')
ON CONFLICT DO NOTHING;

INSERT INTO hq_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM hq_roles r, hq_permissions p
WHERE r.slug = 'employee-finance' AND p.slug IN ('finance.read','subscriptions.read')
ON CONFLICT DO NOTHING;

INSERT INTO hq_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM hq_roles r, hq_permissions p
WHERE r.slug = 'employee-marketing' AND p.slug IN ('marketing.read','marketing.manage')
ON CONFLICT DO NOTHING;

INSERT INTO hq_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM hq_roles r, hq_permissions p
WHERE r.slug = 'employee-rh' AND p.slug IN ('employees.read')
ON CONFLICT DO NOTHING;
