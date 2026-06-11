-- Moderation foundation: banned words, flags, actions, appeals, safety scores.
-- Adds moderation columns to community_messages.

-- ── community_messages: moderation columns ─────────────────────────────────
ALTER TABLE public.community_messages
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'ok'
    CHECK (moderation_status IN ('ok', 'warn', 'hold', 'blocked', 'removed')),
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_by text,
  ADD COLUMN IF NOT EXISTS deleted_reason text;

-- ── banned_words ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.banned_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL,
  normalized_word text NOT NULL,
  action text NOT NULL DEFAULT 'block' CHECK (action IN ('warn', 'hold', 'block')),
  category text NOT NULL DEFAULT 'general',
  added_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS banned_words_normalized_idx
  ON public.banned_words (normalized_word);

ALTER TABLE public.banned_words ENABLE ROW LEVEL SECURITY;

-- Only service_role (server) can read/write banned_words — no client access
CREATE POLICY "banned_words_service_only" ON public.banned_words
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.banned_words TO service_role;

-- Seed safe placeholder words (not real offensive content — placeholders only)
INSERT INTO public.banned_words (word, normalized_word, action, category, added_by)
VALUES
  ('placeholder_spam_1', 'placeholder_spam_1', 'hold', 'spam', 'system'),
  ('placeholder_block_1', 'placeholder_block_1', 'block', 'general', 'system'),
  ('placeholder_warn_1', 'placeholder_warn_1', 'warn', 'general', 'system')
ON CONFLICT (normalized_word) DO NOTHING;

-- ── moderation_flags ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.moderation_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.community_messages(id) ON DELETE CASCADE,
  community_id text REFERENCES public.communities(id) ON DELETE CASCADE,
  sender_id text NOT NULL,
  matched_word text,
  reason text NOT NULL,
  verdict text NOT NULL CHECK (verdict IN ('warn', 'hold', 'block')),
  reviewed boolean NOT NULL DEFAULT false,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS moderation_flags_reviewed_created_idx
  ON public.moderation_flags (reviewed, created_at DESC);

ALTER TABLE public.moderation_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "moderation_flags_service_only" ON public.moderation_flags
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

GRANT SELECT, INSERT, UPDATE ON public.moderation_flags TO service_role;

-- ── moderation_actions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id text NOT NULL,
  actor_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('warn', 'mute', 'unmute', 'ban', 'unban', 'delete_message', 'approve_message')),
  reason text NOT NULL DEFAULT '',
  message_id uuid REFERENCES public.community_messages(id) ON DELETE SET NULL,
  community_id text REFERENCES public.communities(id) ON DELETE SET NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS moderation_actions_target_idx
  ON public.moderation_actions (target_user_id, created_at DESC);

ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "moderation_actions_service_only" ON public.moderation_actions
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

GRANT SELECT, INSERT ON public.moderation_actions TO service_role;

-- ── appeals ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  action_id uuid REFERENCES public.moderation_actions(id) ON DELETE CASCADE,
  text text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;

-- Users can submit their own appeals and view their own
DROP POLICY IF EXISTS "appeals_own_read"   ON public.appeals;
DROP POLICY IF EXISTS "appeals_own_insert" ON public.appeals;
CREATE POLICY "appeals_own_read"   ON public.appeals
  FOR SELECT TO authenticated USING (user_id = (SELECT id::text FROM public.users WHERE id::text = auth.uid()::text LIMIT 1));
CREATE POLICY "appeals_own_insert" ON public.appeals
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT id::text FROM public.users WHERE id::text = auth.uid()::text LIMIT 1));

GRANT SELECT, INSERT ON public.appeals TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.appeals TO service_role;

-- ── user_safety_scores ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_safety_scores (
  user_id text PRIMARY KEY,
  score integer NOT NULL DEFAULT 100 CHECK (score BETWEEN 0 AND 100),
  total_flags integer NOT NULL DEFAULT 0,
  total_reports_against integer NOT NULL DEFAULT 0,
  total_actions integer NOT NULL DEFAULT 0,
  last_action_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_safety_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "safety_scores_service_only" ON public.user_safety_scores
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

GRANT SELECT, INSERT, UPDATE ON public.user_safety_scores TO service_role;

NOTIFY pgrst, 'reload schema';
