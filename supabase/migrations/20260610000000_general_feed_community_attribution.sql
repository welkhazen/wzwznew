-- Add optional community attribution columns to general_feed_posts
alter table public.general_feed_posts
  add column if not exists community_id   text,
  add column if not exists community_name text;

-- Trigger function: cross-post every new community message to the general feed.
-- Best-effort: exceptions are swallowed so the original community_messages insert
-- never fails because of this side-effect.
create or replace function public.sync_community_msg_to_general_feed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into public.general_feed_posts (
      sender_id,
      sender_name,
      sender_avatar_level,
      text,
      community_id,
      community_name
    )
    select
      new.sender_id::uuid,
      new.sender_name,
      new.sender_avatar_level,
      -- Truncate to 500 chars to satisfy the general_feed_posts check constraint
      left(new.text, 500),
      new.community_id,
      c.title
    from public.communities c
    where c.id = new.community_id;
  exception when others then
    null; -- never fail the community message insert
  end;
  return new;
end;
$$;

-- Fire after every non-deleted community message insert
drop trigger if exists trg_community_msg_to_general_feed on public.community_messages;
create trigger trg_community_msg_to_general_feed
after insert on public.community_messages
for each row
when (new.deleted_at is null)
execute function public.sync_community_msg_to_general_feed();
