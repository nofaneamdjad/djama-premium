-- ============================================================
-- DJAMA — Table portail_clients
-- Stocke les clients invités dans le portail client PRO
-- ============================================================

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

-- Index sur user_id pour les requêtes filtrées
create index if not exists portail_clients_user_id_idx on portail_clients(user_id);

-- RLS — chaque utilisateur ne voit que ses propres clients
alter table portail_clients enable row level security;

create policy "portail_clients_owner_only"
  on portail_clients
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
