alter table public.reviews
  add column if not exists is_visible  boolean not null default true,
  add column if not exists is_featured boolean not null default false;
