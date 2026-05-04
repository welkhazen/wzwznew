create table if not exists poll_comments (
  id uuid primary key default gen_random_uuid(),
  poll_id text not null references polls(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 500),
  created_at timestamptz default now()
);

alter table poll_comments enable row level security;

create policy "Public read" on poll_comments for select using (true);
create policy "Public insert" on poll_comments for insert with check (true);

create index poll_comments_poll_id_idx on poll_comments(poll_id, created_at desc);
