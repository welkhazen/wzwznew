-- Add user attribution to poll_comments so comments can show who wrote them.
-- Existing rows stay anonymous (NULLs).

ALTER TABLE public.poll_comments
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS author_name text;

CREATE INDEX IF NOT EXISTS poll_comments_user_id_idx
  ON public.poll_comments(user_id);

NOTIFY pgrst, 'reload schema';
