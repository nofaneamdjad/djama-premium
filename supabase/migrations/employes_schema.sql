-- ============================================================
-- DJAMA — Table employes
-- Stocke les employés pour le module Paie & RH PRO
-- ============================================================

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

-- Index sur user_id pour les requêtes filtrées
create index if not exists employes_user_id_idx on employes(user_id);

-- RLS — chaque utilisateur ne voit que ses propres employés
alter table employes enable row level security;

create policy "employes_owner_only"
  on employes
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
