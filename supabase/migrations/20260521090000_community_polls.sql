-- Community-scoped polls. Only the community owner (communities.created_by)
-- or a global app admin should create/delete polls; this is enforced in the
-- app layer (matches the existing community_messages anon_write pattern).

CREATE TABLE IF NOT EXISTS public.community_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id text NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  question text NOT NULL,
  created_by_user_id text NOT NULL,
  created_by_username text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_polls_community_id_idx
  ON public.community_polls (community_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.community_poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_poll_id uuid NOT NULL REFERENCES public.community_polls(id) ON DELETE CASCADE,
  label text NOT NULL,
  position integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS community_poll_options_poll_id_idx
  ON public.community_poll_options (community_poll_id, position);

-- Single-choice voting: one vote per (poll, user).
CREATE TABLE IF NOT EXISTS public.community_poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_poll_id uuid NOT NULL REFERENCES public.community_polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES public.community_poll_options(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (community_poll_id, user_id)
);

CREATE INDEX IF NOT EXISTS community_poll_votes_option_id_idx
  ON public.community_poll_votes (option_id);

ALTER TABLE public.community_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read" ON public.community_polls
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_write" ON public.community_polls
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_delete" ON public.community_polls
  FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "public_read" ON public.community_poll_options
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_write" ON public.community_poll_options
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_delete" ON public.community_poll_options
  FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "public_read" ON public.community_poll_votes
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_write" ON public.community_poll_votes
  FOR INSERT TO anon, authenticated WITH CHECK (true);
-- Allow voters to change their vote (UPSERT on conflict updates the option_id).
CREATE POLICY "anon_update" ON public.community_poll_votes
  FOR UPDATE TO anon, authenticated USING (true);

GRANT SELECT, INSERT, DELETE ON public.community_polls TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.community_poll_options TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_poll_votes TO anon, authenticated;
