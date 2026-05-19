create table if not exists public.notification_consents (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  platform text not null check (platform in ('apple-ios', 'samsung-android', 'web')),
  status text not null check (status in ('granted', 'denied', 'dismissed', 'unsupported')),
  provider text not null default 'none',
  device_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform)
);

alter table public.notification_consents enable row level security;

drop policy if exists "notification_consents_select_all" on public.notification_consents;
create policy "notification_consents_select_all"
  on public.notification_consents for select
  to anon, authenticated
  using (true);

drop policy if exists "notification_consents_write_all" on public.notification_consents;
create policy "notification_consents_write_all"
  on public.notification_consents for insert
  to anon, authenticated
  with check (true);

drop policy if exists "notification_consents_update_all" on public.notification_consents;
create policy "notification_consents_update_all"
  on public.notification_consents for update
  to anon, authenticated
  using (true)
  with check (true);

grant select, insert, update on public.notification_consents to anon, authenticated;
