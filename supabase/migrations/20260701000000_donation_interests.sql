create table if not exists public.donation_interests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null default '',
  submitted_at timestamptz not null default now(),
  status text not null default 'pending',
  constraint donation_interests_name_not_blank check (length(btrim(name)) > 0),
  constraint donation_interests_email_not_blank check (length(btrim(email)) > 0)
);

alter table public.donation_interests enable row level security;

-- Anyone (even unauthenticated visitors) can submit their interest
create policy "Anyone can submit donation interest"
  on public.donation_interests
  for insert
  to anon, authenticated
  with check (true);

-- Only admins can read submissions
create policy "Admins can read donation interests"
  on public.donation_interests
  for select
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
        and users.role = 'admin'
        and users.status <> 'banned'
    )
  );

-- Only admins can update status
create policy "Admins can update donation interest status"
  on public.donation_interests
  for update
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
        and users.role = 'admin'
        and users.status <> 'banned'
    )
  );

-- Only admins can delete
create policy "Admins can delete donation interests"
  on public.donation_interests
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
        and users.role = 'admin'
        and users.status <> 'banned'
    )
  );
