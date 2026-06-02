-- ============================================================
-- DJAMA — Migration 026 : Correctifs complets
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. Table virements (paiements par virement bancaire) ────────
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

alter table virements enable row level security;
-- Accès uniquement via service_role (admin)

-- ── 2. Table portail_clients (module Portail Client PRO) ────────
create table if not exists portail_clients (
  id                 uuid        primary key default gen_random_uuid(),
  user_id            uuid        not null references auth.users(id) on delete cascade,
  nom                text        not null,
  email              text        not null,
  phone              text,
  entreprise         text,
  acces_actif        boolean     not null default true,
  derniere_connexion timestamptz,
  created_at         timestamptz not null default now()
);

create index if not exists portail_clients_user_id_idx on portail_clients(user_id);
alter table portail_clients enable row level security;

drop policy if exists "portail_clients_owner_only" on portail_clients;
create policy "portail_clients_owner_only"
  on portail_clients
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 3. Table employes (module Paie & RH PRO) ────────────────────
create table if not exists employes (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users(id) on delete cascade,
  nom            text        not null,
  poste          text        not null,
  salaire_brut   numeric(10,2) not null default 0,
  date_embauche  date,
  type_contrat   text        not null default 'CDI'
                             check (type_contrat in ('CDI','CDD','Freelance','Stage','Alternance')),
  actif          boolean     not null default true,
  created_at     timestamptz not null default now()
);

create index if not exists employes_user_id_idx on employes(user_id);
alter table employes enable row level security;

drop policy if exists "employes_owner_only" on employes;
create policy "employes_owner_only"
  on employes
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 4. Colonnes manquantes sur clients ──────────────────────────
alter table clients
  add column if not exists subscription_active  boolean      default false,
  add column if not exists abonnement           text         default null,
  add column if not exists statut               text         default 'inactif',
  add column if not exists stripe_customer_id   text         default null,
  add column if not exists stripe_subscription_id text       default null,
  add column if not exists paypal_subscription_id text       default null;

-- ── 5. Colonnes manquantes sur user_access ──────────────────────
alter table user_access
  add column if not exists access_code text,
  add column if not exists expires_at  timestamptz;

create index if not exists user_access_code_idx on user_access(access_code);

-- ── 6. Activer l'accès nofane.soufie@gmail.com ──────────────────
-- Paiement reçu par virement — accès complet Espace Client
insert into user_access (email, name, outils_saas, espace_premium, source, notes, updated_at)
values (
  'nofane.soufie@gmail.com',
  'Nofane Soufie',
  true,
  true,
  'virement',
  'Paiement virement confirmé — accès activé manuellement',
  now()
)
on conflict (email) do update set
  outils_saas    = true,
  espace_premium = true,
  source         = 'virement',
  notes          = coalesce(user_access.notes, '') || ' | Activé le ' || to_char(now(), 'DD/MM/YYYY'),
  updated_at     = now();

-- ── 7. Virement récurrent nofane.soufie@gmail.com ───────────────
insert into virements (email, nom, montant, jour_prelevement, dernier_paiement, prochain_paiement, acces_actif, notes)
values (
  'nofane.soufie@gmail.com',
  'Nofane Soufie',
  11.90,
  1,
  current_date,
  (date_trunc('month', current_date) + interval '1 month' + interval '0 days')::date,
  true,
  'Paiement reçu — accès activé'
)
on conflict (email) do update set
  acces_actif       = true,
  dernier_paiement  = current_date,
  prochain_paiement = (date_trunc('month', current_date) + interval '1 month')::date,
  updated_at        = now();
