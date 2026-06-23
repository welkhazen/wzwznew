-- Threaded replies for poll comments.
-- Adds a self-referential parent pointer so a comment can be a reply to
-- another comment. Top-level comments keep parent_comment_id NULL.

ALTER TABLE public.poll_comments
  ADD COLUMN IF NOT EXISTS parent_comment_id uuid
    REFERENCES public.poll_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS poll_comments_parent_idx
  ON public.poll_comments(parent_comment_id);

NOTIFY pgrst, 'reload schema';
