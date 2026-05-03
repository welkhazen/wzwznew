create table if not exists public.avatar_catalog (
  id text primary key,
  level integer not null,
  name text not null,
  price text not null default '0',
  image_src text,
  bg text not null,
  figure text not null,
  ring text not null,
  glow text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists avatar_catalog_level_unique on public.avatar_catalog(level) where is_active = true;

create table if not exists public.user_avatar_inventory (
  user_id text not null,
  avatar_id text not null references public.avatar_catalog(id) on delete cascade,
  purchased_at timestamptz not null default now(),
  primary key (user_id, avatar_id)
);

create table if not exists public.user_avatar_selection (
  user_id text primary key,
  avatar_id text not null references public.avatar_catalog(id) on delete cascade,
  selected_at timestamptz not null default now()
);

alter table public.avatar_catalog enable row level security;
alter table public.user_avatar_inventory enable row level security;
alter table public.user_avatar_selection enable row level security;

create policy if not exists avatar_catalog_read_all on public.avatar_catalog
for select to anon, authenticated
using (is_active = true);

create policy if not exists avatar_catalog_write_all on public.avatar_catalog
for all to anon, authenticated
using (true)
with check (true);

create policy if not exists avatar_inventory_read_all on public.user_avatar_inventory
for select to anon, authenticated
using (true);

create policy if not exists avatar_inventory_write_all on public.user_avatar_inventory
for all to anon, authenticated
using (true)
with check (true);

create policy if not exists avatar_selection_read_all on public.user_avatar_selection
for select to anon, authenticated
using (true);

create policy if not exists avatar_selection_write_all on public.user_avatar_selection
for all to anon, authenticated
using (true)
with check (true);

create or replace function public.set_updated_at_avatar_catalog()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_avatar_catalog_updated_at on public.avatar_catalog;
create trigger set_avatar_catalog_updated_at
before update on public.avatar_catalog
for each row
execute function public.set_updated_at_avatar_catalog();
