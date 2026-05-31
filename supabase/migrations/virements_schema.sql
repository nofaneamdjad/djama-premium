-- ============================================================
-- DJAMA — Table virements
-- Suivi des abonnés qui paient par virement bancaire récurrent
-- ============================================================

create table if not exists virements (
  id                uuid        primary key default gen_random_uuid(),
  email             text        not null unique,
  nom               text        not null,
  montant           numeric(8,2) not null default 11.90,
  jour_prelevement  int         not null default 1 check (jour_prelevement between 1 and 28),
  dernier_paiement  date,
  prochain_paiement date,
  acces_actif       boolean     not null default false,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Seul l'admin (service role) y accède — pas de RLS publique
alter table virements enable row level security;

-- Aucune politique publique : lecture/écriture uniquement via service_role
