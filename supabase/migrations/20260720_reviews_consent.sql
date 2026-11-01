alter table public.reviews
  add column if not exists consent_email    boolean not null default false,
  add column if not exists consent_sms      boolean not null default false,
  add column if not exists consent_whatsapp boolean not null default false;
