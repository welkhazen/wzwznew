-- One round-trip aggregate for the profile stats grid.
-- All counts are bigint; the function returns a single JSON row.
-- Read-only, marked STABLE so PostgREST can cache where applicable.

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
      from public.community_polls
      where created_by_user_id = p_user_id
    ),
    communities_joined as (
      select count(*) as n
      from public.community_members
      where user_id = p_user_id
    ),
    messages_pinned as (
      select count(*) as n
      from public.community_messages
      where sender_id = p_user_id
        and pinned = true
        and deleted_at is null
    )
  select jsonb_build_object(
    'polls',              (select n from polls),
    'comments_on_polls',  (select n from poll_comments_count),
    'likes_received',     (select n from likes_received),
    'hosts_made',         (select n from hosts_made),
    'communities_joined', (select n from communities_joined),
    'messages_pinned',    (select n from messages_pinned)
  );
$function$;

grant execute on function public.get_profile_stats(text) to anon, authenticated;
