-- Create poll_votes if it doesn't exist (some envs may have it already)
create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id text not null references polls(id) on delete cascade,
  option_id text not null,
  created_at timestamptz not null default now()
);

alter table public.poll_votes enable row level security;

-- Allow anon and authenticated to read and insert votes
drop policy if exists poll_votes_read on public.poll_votes;
create policy poll_votes_read on public.poll_votes
  for select to anon, authenticated using (true);

drop policy if exists poll_votes_insert on public.poll_votes;
create policy poll_votes_insert on public.poll_votes
  for insert to anon, authenticated with check (true);

grant select, insert on public.poll_votes to anon, authenticated;
