-- Composite index for community_members lookup (community + user join)
create index if not exists community_members_community_user_idx
  on public.community_members (community_id, user_id);

-- Covering index for active-message queries that filter deleted_at
create index if not exists community_messages_community_active_idx
  on public.community_messages (community_id, created_at desc)
  where deleted_at is null;

-- Index for avatar catalog lookup by user
create index if not exists user_avatar_selection_user_id_idx
  on public.user_avatar_selection (user_id);

-- Index for community poll votes lookup by community_poll_id
create index if not exists community_poll_votes_community_poll_id_idx
  on public.community_poll_votes (community_poll_id);
