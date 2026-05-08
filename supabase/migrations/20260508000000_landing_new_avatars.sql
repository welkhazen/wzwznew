create table if not exists landing_new_avatars (
  id text primary key,
  name text not null,
  image_src text not null default '',
  position integer not null default 0,
  created_at timestamptz default now()
);

alter table landing_new_avatars enable row level security;

create policy "Public read landing_new_avatars"
  on landing_new_avatars for select
  using (true);

create policy "Authenticated write landing_new_avatars"
  on landing_new_avatars for all
  using (auth.role() = 'authenticated');
