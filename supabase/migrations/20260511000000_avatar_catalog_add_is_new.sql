alter table public.avatar_catalog
  add column if not exists is_new boolean not null default false;
