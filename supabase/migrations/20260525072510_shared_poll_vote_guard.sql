alter table public.poll_votes
  add column if not exists voter_key text;

create unique index if not exists poll_votes_poll_voter_key_unique
  on public.poll_votes (poll_id, voter_key)
  where voter_key is not null;
