-- Remove the deprecated chat-message pinning feature from deployed databases.

drop function if exists public.notify_message_pinned(text, text, text, text, text);
drop table if exists public.message_pin_notifications cascade;
drop table if exists public.user_pinned_message cascade;

alter table if exists public.community_messages
  drop column if exists pinned;

-- Redefine get_profile_stats WITHOUT the messages_pinned CTE. The pinned-free
-- version already lives in 20260612161000, but that migration is already in
-- deployed history and will not re-run, so its edit never reaches an existing
-- database. Without this forward definition the live RPC would still reference
-- community_messages.pinned (dropped above) and error on every profile view.
create or replace function public.get_profile_stats(p_user_id text)
returns jsonb
language sql
stable
set search_path to 'public'
as $function$
  with
    polls as (
      select count(distinct poll_id) as n
      from public.poll_votes
      where user_id::text = p_user_id
    ),
    poll_comments_count as (
      select count(*) as n
      from public.poll_comments
      where user_id::text = p_user_id
    ),
    likes_received as (
      select coalesce(sum(coalesce(array_length(liked_by, 1), 0)), 0) as n
      from public.community_messages
      where sender_id = p_user_id
        and deleted_at is null
    ),
    hosts_made as (
      select count(*) as n
      from public.community_requests
      where requester_id = p_user_id
        and status = 'approved'
    ),
    communities_joined as (
      select count(*) as n
      from public.community_members
      where user_id = p_user_id
    )
  select jsonb_build_object(
    'polls',              (select n from polls),
    'comments_on_polls',  (select n from poll_comments_count),
    'likes_received',     (select n from likes_received),
    'hosts_made',         (select n from hosts_made),
    'communities_joined', (select n from communities_joined)
  );
$function$;

grant execute on function public.get_profile_stats(text) to anon, authenticated;

notify pgrst, 'reload schema';
