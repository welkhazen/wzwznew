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

create unique index if not exists avatar_catalog_level_unique
  on public.avatar_catalog(level)
  where is_active = true;

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

grant usage on schema public to anon, authenticated;
grant all on table public.avatar_catalog to anon, authenticated;
grant all on table public.user_avatar_inventory to anon, authenticated;
grant all on table public.user_avatar_selection to anon, authenticated;

drop policy if exists avatar_catalog_read_all on public.avatar_catalog;
drop policy if exists avatar_catalog_write_all on public.avatar_catalog;
drop policy if exists avatar_inventory_read_all on public.user_avatar_inventory;
drop policy if exists avatar_inventory_write_all on public.user_avatar_inventory;
drop policy if exists avatar_selection_read_all on public.user_avatar_selection;
drop policy if exists avatar_selection_write_all on public.user_avatar_selection;

create policy if not exists avatar_catalog_read_all on public.avatar_catalog
for select to anon, authenticated
using (is_active = true);

create policy if not exists avatar_catalog_write_admin_only on public.avatar_catalog
for all to authenticated
using (
  exists (
    select 1
    from public.users u
    where u.id::text = auth.uid()::text
      and u.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.users u
    where u.id::text = auth.uid()::text
      and u.role = 'admin'
  )
);

create policy if not exists avatar_inventory_read_own on public.user_avatar_inventory
for select to authenticated
using (user_id = auth.uid()::text);

create policy if not exists avatar_inventory_insert_own on public.user_avatar_inventory
for insert to authenticated
with check (user_id = auth.uid()::text);

create policy if not exists avatar_inventory_delete_own on public.user_avatar_inventory
for delete to authenticated
using (user_id = auth.uid()::text);

create policy if not exists avatar_selection_read_own on public.user_avatar_selection
for select to authenticated
using (user_id = auth.uid()::text);

create policy if not exists avatar_selection_upsert_own on public.user_avatar_selection
for all to authenticated
using (user_id = auth.uid()::text)
with check (user_id = auth.uid()::text);

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
