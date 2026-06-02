-- User favorite communities (max 3) and user pinned chat message (1).
-- Both tables are publicly readable so other users see them on the
-- Chat profile dialog; only the owner can edit their own rows.

CREATE TABLE IF NOT EXISTS public.user_favorite_communities (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  community_id text NOT NULL,
  position smallint NOT NULL CHECK (position BETWEEN 1 AND 3),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, community_id),
  UNIQUE (user_id, position)
);

ALTER TABLE public.user_favorite_communities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "favorites readable by everyone" ON public.user_favorite_communities;
CREATE POLICY "favorites readable by everyone"
  ON public.user_favorite_communities
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "favorites editable by owner" ON public.user_favorite_communities;
CREATE POLICY "favorites editable by owner"
  ON public.user_favorite_communities
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.user_pinned_message (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  message_id text NOT NULL,
  community_id text NOT NULL,
  community_title text,
  sender_name text,
  message_text text NOT NULL,
  message_created_at timestamptz,
  pinned_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_pinned_message ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pinned messages readable by everyone" ON public.user_pinned_message;
CREATE POLICY "pinned messages readable by everyone"
  ON public.user_pinned_message
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "pinned messages editable by owner" ON public.user_pinned_message;
CREATE POLICY "pinned messages editable by owner"
  ON public.user_pinned_message
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
