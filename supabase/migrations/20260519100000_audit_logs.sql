create table if not exists audit_logs (
  id          bigserial primary key,
  event       text        not null,
  level       text        not null default 'info',
  payload     jsonb       not null default '{}',
  occurred_at timestamptz not null default now()
);

-- index for querying recent events by type
create index audit_logs_event_idx       on audit_logs (event);
create index audit_logs_occurred_at_idx on audit_logs (occurred_at desc);

-- only the service role can read/write; no public access
alter table audit_logs enable row level security;
