-- Speeds up batch avatar lookup in useCommunityChat (SELECT ... IN user_ids)
create index if not exists user_avatar_selection_user_id_idx
  on public.user_avatar_selection (user_id);
