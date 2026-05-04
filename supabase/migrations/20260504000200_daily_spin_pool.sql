create table if not exists public.daily_spin_pool (
  id text primary key,
  name text not null,
  image_src text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.daily_spin_pool enable row level security;

grant usage on schema public to anon, authenticated;
grant all on table public.daily_spin_pool to anon, authenticated;

drop policy if exists daily_spin_pool_read_all on public.daily_spin_pool;
drop policy if exists daily_spin_pool_write_all on public.daily_spin_pool;

create policy daily_spin_pool_read_all on public.daily_spin_pool
  for select to anon, authenticated
  using (true);

create policy daily_spin_pool_write_all on public.daily_spin_pool
  for all to anon, authenticated
  using (true)
  with check (true);
