-- ── Table : push_subscriptions ────────────────────────────────────
-- Stocke les abonnements Web Push de chaque utilisateur
-- (endpoint + clés de chiffrement)
-- ─────────────────────────────────────────────────────────────────

create table if not exists push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  endpoint     text not null unique,
  p256dh       text not null,   -- clé publique chiffrement
  auth_key     text not null,   -- clé d'authentification
  created_at   timestamptz default now()
);

-- Index pour retrouver les abonnements d'un utilisateur
create index if not exists push_subscriptions_user_idx
  on push_subscriptions(user_id);

-- RLS
alter table push_subscriptions enable row level security;

create policy "Users manage own subscriptions"
  on push_subscriptions for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
