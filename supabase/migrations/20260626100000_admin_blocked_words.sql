create table if not exists public.blocked_words (
  id uuid primary key default gen_random_uuid(),
  term text not null,
  normalized_term text generated always as (lower(btrim(term))) stored,
  created_at timestamptz not null default now(),
  created_by uuid references public.users(id) on delete set null,
  constraint blocked_words_term_not_blank check (length(btrim(term)) > 0)
);

create unique index if not exists blocked_words_normalized_term_key
  on public.blocked_words (normalized_term);

alter table public.blocked_words enable row level security;

revoke all on public.blocked_words from anon, authenticated;

create policy "Admins can read blocked words"
  on public.blocked_words
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.role = 'admin'
        and users.status <> 'banned'
    )
  );

create policy "Admins can insert blocked words"
  on public.blocked_words
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.role = 'admin'
        and users.status <> 'banned'
    )
  );

create policy "Admins can delete blocked words"
  on public.blocked_words
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.role = 'admin'
        and users.status <> 'banned'
    )
  );
