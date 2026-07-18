create table if not exists public.client_requests (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  client_name      text not null,
  client_email     text,
  client_phone     text,
  subject          text not null,
  message          text,
  consent_email    boolean not null default false,
  consent_sms      boolean not null default false,
  consent_whatsapp boolean not null default false,
  status           text not null default 'nouveau',
  created_at       timestamptz not null default now()
);

alter table public.client_requests enable row level security;

create policy "owner_read" on public.client_requests
  for select using (auth.uid() = user_id);

create policy "public_insert" on public.client_requests
  for insert with check (true);
