-- Founding invite codes were generated client-side and shared by users, but
-- never reached the server, so signup could only validate their format and
-- inviters were never notified when their code was used. This registers
-- codes against their creator and records redemptions so inviters can see
-- when a friend joins with their code.

create table if not exists public.founding_invites (
  code text primary key,
  inviter_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists founding_invites_inviter_idx
  on public.founding_invites (inviter_id);

alter table public.founding_invites enable row level security;

grant select, insert on table public.founding_invites to authenticated;

drop policy if exists "founding_invites_select_own" on public.founding_invites;
create policy "founding_invites_select_own" on public.founding_invites
  for select using (inviter_id = public.current_user_id());

drop policy if exists "founding_invites_insert_own" on public.founding_invites;
create policy "founding_invites_insert_own" on public.founding_invites
  for insert with check (inviter_id = public.current_user_id());

create table if not exists public.founding_invite_redemptions (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references public.users(id) on delete cascade,
  code text not null,
  redeemed_by uuid not null references public.users(id) on delete cascade,
  redeemed_username text not null,
  created_at timestamptz not null default now()
);

create index if not exists founding_invite_redemptions_inviter_idx
  on public.founding_invite_redemptions (inviter_id, created_at desc);

alter table public.founding_invite_redemptions enable row level security;

-- Redemptions are only ever written by the signup edge function via the
-- service role (which bypasses RLS); clients only ever read their own.
grant select on table public.founding_invite_redemptions to authenticated;

drop policy if exists "founding_invite_redemptions_select_own" on public.founding_invite_redemptions;
create policy "founding_invite_redemptions_select_own" on public.founding_invite_redemptions
  for select using (inviter_id = public.current_user_id());

notify pgrst, 'reload schema';
