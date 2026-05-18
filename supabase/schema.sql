-- =============================================================
-- SCHEMA — extensions, tables, indexes, RLS, policies, functions
-- Run this FIRST in Supabase SQL Editor on a fresh project.
-- Safe to re-run: uses IF NOT EXISTS and DROP POLICY IF EXISTS.
-- After this succeeds, run seed.sql.
-- =============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

GRANT USAGE ON SCHEMA extensions TO postgres;
GRANT USAGE ON SCHEMA cron TO postgres;

-- =============================================================
-- TABLES
-- =============================================================

-- Users
CREATE TABLE IF NOT EXISTS public.users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username        TEXT NOT NULL UNIQUE,
  password_hash   TEXT,
  role            TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin','member')),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','warned','banned')),
  warnings        INT NOT NULL DEFAULT 0,
  avatar_level    INT NOT NULL DEFAULT 1,
  token_balance   INT NOT NULL DEFAULT 0,
  email           TEXT,
  phone           TEXT,
  stytch_user_id  TEXT,
  last_seen_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Polls
CREATE TABLE IF NOT EXISTS public.polls (
  id            TEXT PRIMARY KEY,
  question      TEXT NOT NULL,
  options       JSONB NOT NULL DEFAULT '[]'::jsonb,
  locked        BOOLEAN DEFAULT false,
  status        TEXT NOT NULL DEFAULT 'active',
  is_onboarding BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Poll options
CREATE TABLE IF NOT EXISTS public.poll_options (
  id       TEXT PRIMARY KEY,
  poll_id  TEXT NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  label    TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);

-- Poll votes
CREATE TABLE IF NOT EXISTS public.poll_votes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id    TEXT NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id  TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Poll comments
CREATE TABLE IF NOT EXISTS public.poll_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id    TEXT NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  text       TEXT NOT NULL CHECK (char_length(text) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Communities
CREATE TABLE IF NOT EXISTS public.communities (
  id          TEXT PRIMARY KEY,
  abbr        TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  topic       TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Early Access')),
  locked      BOOLEAN NOT NULL DEFAULT false,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by  TEXT
);

-- Community members
CREATE TABLE IF NOT EXISTS public.community_members (
  community_id           TEXT NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id                TEXT NOT NULL,
  username               TEXT NOT NULL,
  joined_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_read_at           TIMESTAMPTZ,
  notifications_enabled  BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (community_id, user_id)
);

-- Community messages
CREATE TABLE IF NOT EXISTS public.community_messages (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id          TEXT NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  sender_id             TEXT NOT NULL,
  sender_name           TEXT NOT NULL,
  text                  TEXT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  pinned                BOOLEAN NOT NULL DEFAULT false,
  reply_to_message_id   UUID,
  reply_to_sender_name  TEXT,
  reply_to_text         TEXT,
  deleted_at            TIMESTAMPTZ,
  deleted_by_user_id    TEXT,
  liked_by              TEXT[] NOT NULL DEFAULT '{}'
);

-- Community requests
CREATE TABLE IF NOT EXISTS public.community_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id   TEXT NOT NULL,
  requester_name TEXT NOT NULL,
  community_name TEXT NOT NULL,
  genre          TEXT NOT NULL DEFAULT '',
  focus_area     TEXT NOT NULL,
  audience       TEXT NOT NULL,
  why_now        TEXT NOT NULL,
  sample_prompt  TEXT NOT NULL DEFAULT '',
  submitted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at    TIMESTAMPTZ,
  reviewed_by    TEXT
);

-- Community waitlist
CREATE TABLE IF NOT EXISTS public.community_waitlist (
  community_id TEXT NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL,
  username     TEXT NOT NULL,
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);

-- Avatar catalog
CREATE TABLE IF NOT EXISTS public.avatar_catalog (
  id         TEXT PRIMARY KEY,
  level      INTEGER NOT NULL,
  name       TEXT NOT NULL,
  price      TEXT NOT NULL DEFAULT '0',
  image_src  TEXT,
  bg         TEXT NOT NULL,
  figure     TEXT NOT NULL,
  ring       TEXT NOT NULL,
  glow       TEXT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  is_new     BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User avatar inventory
CREATE TABLE IF NOT EXISTS public.user_avatar_inventory (
  user_id      TEXT NOT NULL,
  avatar_id    TEXT NOT NULL REFERENCES public.avatar_catalog(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, avatar_id)
);

-- User avatar selection
CREATE TABLE IF NOT EXISTS public.user_avatar_selection (
  user_id     TEXT PRIMARY KEY,
  avatar_id   TEXT NOT NULL REFERENCES public.avatar_catalog(id) ON DELETE CASCADE,
  selected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Daily spin pool
CREATE TABLE IF NOT EXISTS public.daily_spin_pool (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  image_src  TEXT NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Landing new avatars
CREATE TABLE IF NOT EXISTS public.landing_new_avatars (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  image_src  TEXT NOT NULL DEFAULT '',
  position   INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- INDEXES
-- =============================================================

CREATE INDEX IF NOT EXISTS poll_comments_poll_id_idx
  ON public.poll_comments(poll_id, created_at DESC);

CREATE INDEX IF NOT EXISTS community_waitlist_community_idx
  ON public.community_waitlist(community_id);

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_comments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_waitlist  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_avatar_inventory  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_avatar_selection  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_spin_pool     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_new_avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatar_catalog      DISABLE ROW LEVEL SECURITY;

-- =============================================================
-- POLICIES — drop before create to make re-runs safe
-- =============================================================

-- users
DROP POLICY IF EXISTS "users_select_all"  ON public.users;
DROP POLICY IF EXISTS "users_insert_self" ON public.users;
DROP POLICY IF EXISTS "users_update_self" ON public.users;
CREATE POLICY "users_select_all"  ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert_self" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update_self" ON public.users FOR UPDATE USING (true);

-- polls
DROP POLICY IF EXISTS "Public read"   ON public.polls;
DROP POLICY IF EXISTS "Public insert" ON public.polls;
DROP POLICY IF EXISTS "Public delete" ON public.polls;
CREATE POLICY "Public read"   ON public.polls FOR SELECT USING (true);
CREATE POLICY "Public insert" ON public.polls FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete" ON public.polls FOR DELETE USING (true);

-- poll_options
DROP POLICY IF EXISTS "public_read"   ON public.poll_options;
DROP POLICY IF EXISTS "public_insert" ON public.poll_options;
DROP POLICY IF EXISTS "public_delete" ON public.poll_options;
CREATE POLICY "public_read"   ON public.poll_options FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_insert" ON public.poll_options FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public_delete" ON public.poll_options FOR DELETE TO anon, authenticated USING (true);

-- poll_votes
DROP POLICY IF EXISTS "poll_votes_read"   ON public.poll_votes;
DROP POLICY IF EXISTS "poll_votes_insert" ON public.poll_votes;
CREATE POLICY "poll_votes_read"   ON public.poll_votes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "poll_votes_insert" ON public.poll_votes FOR INSERT TO anon, authenticated WITH CHECK (true);

-- poll_comments
DROP POLICY IF EXISTS "Public read"   ON public.poll_comments;
DROP POLICY IF EXISTS "Public insert" ON public.poll_comments;
CREATE POLICY "Public read"   ON public.poll_comments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert" ON public.poll_comments FOR INSERT TO anon, authenticated WITH CHECK (true);

-- communities
DROP POLICY IF EXISTS "public_read" ON public.communities;
DROP POLICY IF EXISTS "anon_write"  ON public.communities;
DROP POLICY IF EXISTS "anon_update" ON public.communities;
CREATE POLICY "public_read" ON public.communities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_write"  ON public.communities FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update" ON public.communities FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- community_members
DROP POLICY IF EXISTS "public_read" ON public.community_members;
DROP POLICY IF EXISTS "anon_write"  ON public.community_members;
DROP POLICY IF EXISTS "anon_update" ON public.community_members;
CREATE POLICY "public_read" ON public.community_members FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_write"  ON public.community_members FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update" ON public.community_members FOR UPDATE TO anon, authenticated USING (true);

-- community_messages
DROP POLICY IF EXISTS "public_read" ON public.community_messages;
DROP POLICY IF EXISTS "anon_write"  ON public.community_messages;
DROP POLICY IF EXISTS "anon_update" ON public.community_messages;
CREATE POLICY "public_read" ON public.community_messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_write"  ON public.community_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update" ON public.community_messages FOR UPDATE TO anon, authenticated USING (true);

-- community_requests
DROP POLICY IF EXISTS "public_read" ON public.community_requests;
DROP POLICY IF EXISTS "anon_write"  ON public.community_requests;
DROP POLICY IF EXISTS "anon_update" ON public.community_requests;
CREATE POLICY "public_read" ON public.community_requests FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_write"  ON public.community_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update" ON public.community_requests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- community_waitlist
DROP POLICY IF EXISTS "public_read" ON public.community_waitlist;
DROP POLICY IF EXISTS "anon_write"  ON public.community_waitlist;
CREATE POLICY "public_read" ON public.community_waitlist FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_write"  ON public.community_waitlist FOR INSERT TO anon, authenticated WITH CHECK (true);

-- user_avatar_inventory
DROP POLICY IF EXISTS "avatar_inventory_read_anon"  ON public.user_avatar_inventory;
DROP POLICY IF EXISTS "avatar_inventory_write_anon" ON public.user_avatar_inventory;
CREATE POLICY "avatar_inventory_read_anon"  ON public.user_avatar_inventory FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "avatar_inventory_write_anon" ON public.user_avatar_inventory FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- user_avatar_selection
DROP POLICY IF EXISTS "avatar_selection_read_anon"  ON public.user_avatar_selection;
DROP POLICY IF EXISTS "avatar_selection_write_anon" ON public.user_avatar_selection;
CREATE POLICY "avatar_selection_read_anon"  ON public.user_avatar_selection FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "avatar_selection_write_anon" ON public.user_avatar_selection FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- daily_spin_pool
DROP POLICY IF EXISTS "daily_spin_pool_read_all"  ON public.daily_spin_pool;
DROP POLICY IF EXISTS "daily_spin_pool_write_all" ON public.daily_spin_pool;
CREATE POLICY "daily_spin_pool_read_all"  ON public.daily_spin_pool FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "daily_spin_pool_write_all" ON public.daily_spin_pool FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- landing_new_avatars
DROP POLICY IF EXISTS "Public read landing_new_avatars" ON public.landing_new_avatars;
DROP POLICY IF EXISTS "Authenticated write landing_new_avatars" ON public.landing_new_avatars;
CREATE POLICY "Public read landing_new_avatars" ON public.landing_new_avatars FOR SELECT USING (true);
CREATE POLICY "Authenticated write landing_new_avatars" ON public.landing_new_avatars FOR ALL USING (true) WITH CHECK (true);

-- =============================================================
-- GRANTS
-- =============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO anon, authenticated;
GRANT ALL ON public.polls TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.poll_options TO anon, authenticated;
GRANT SELECT, INSERT ON public.poll_votes TO anon, authenticated;
GRANT SELECT, INSERT ON public.poll_comments TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.communities TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.community_members TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.community_messages TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.community_requests TO anon, authenticated;
GRANT SELECT, INSERT ON public.community_waitlist TO anon, authenticated;
GRANT ALL ON public.avatar_catalog TO anon, authenticated;
GRANT ALL ON public.user_avatar_inventory TO anon, authenticated;
GRANT ALL ON public.user_avatar_selection TO anon, authenticated;
GRANT ALL ON public.daily_spin_pool TO anon, authenticated;
GRANT ALL ON public.landing_new_avatars TO anon, authenticated;

-- =============================================================
-- FUNCTIONS
-- =============================================================

-- Auto-create users row from Supabase Auth (kept for compat)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE _username text;
BEGIN
  _username := trim(new.raw_user_meta_data->>'username');
  IF _username IS NULL OR _username = '' THEN RETURN new; END IF;
  INSERT INTO public.users (id, username, role, status, warnings, avatar_level)
  VALUES (new.id, _username, 'user', 'active', 0, 1)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Custom auth: signup
CREATE OR REPLACE FUNCTION public.signup_user(p_username text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE v_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE username = p_username) THEN
    RETURN json_build_object('ok', false, 'error', 'Username is already taken');
  END IF;
  v_id := gen_random_uuid();
  INSERT INTO users (id, username, password_hash, role, status, warnings, avatar_level)
  VALUES (v_id, trim(p_username), crypt(p_password, gen_salt('bf')), 'user', 'active', 0, 1);
  RETURN json_build_object('ok', true, 'user', json_build_object(
    'id', v_id, 'username', trim(p_username), 'role', 'user', 'status', 'active', 'avatar_level', 1
  ));
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('ok', false, 'error', 'Username is already taken');
END;
$$;
GRANT EXECUTE ON FUNCTION public.signup_user(text, text) TO anon, authenticated;

-- Custom auth: login
CREATE OR REPLACE FUNCTION public.login_user(p_username text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE v_user users%ROWTYPE;
BEGIN
  SELECT * INTO v_user FROM users WHERE username = p_username;
  IF NOT FOUND OR v_user.password_hash IS NULL
     OR v_user.password_hash != crypt(p_password, v_user.password_hash) THEN
    RETURN json_build_object('ok', false, 'error', 'Invalid username or password');
  END IF;
  RETURN json_build_object('ok', true, 'user', json_build_object(
    'id', v_user.id, 'username', v_user.username, 'role', v_user.role,
    'status', v_user.status, 'avatar_level', v_user.avatar_level
  ));
END;
$$;
GRANT EXECUTE ON FUNCTION public.login_user(text, text) TO anon, authenticated;

-- Toggle message like
CREATE OR REPLACE FUNCTION public.toggle_message_like(p_message_id uuid, p_user_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, extensions
AS $$
BEGIN
  UPDATE community_messages
  SET liked_by = CASE
    WHEN p_user_id = ANY(liked_by) THEN array_remove(liked_by, p_user_id)
    ELSE array_append(liked_by, p_user_id)
  END
  WHERE id = p_message_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.toggle_message_like(uuid, text) TO anon, authenticated;

-- Join community waitlist
CREATE OR REPLACE FUNCTION public.join_community_waitlist(
  p_community_id text, p_user_id text, p_username text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE v_count integer;
BEGIN
  INSERT INTO community_waitlist (community_id, user_id, username)
  VALUES (p_community_id, p_user_id, p_username)
  ON CONFLICT (community_id, user_id) DO NOTHING;
  SELECT count(*)::int INTO v_count FROM community_waitlist WHERE community_id = p_community_id;
  RETURN v_count;
END;
$$;
GRANT EXECUTE ON FUNCTION public.join_community_waitlist(text, text, text) TO anon, authenticated;

-- Avatar catalog updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at_avatar_catalog()
RETURNS trigger AS $$
BEGIN new.updated_at = now(); RETURN new; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_avatar_catalog_updated_at ON public.avatar_catalog;
CREATE TRIGGER set_avatar_catalog_updated_at
  BEFORE UPDATE ON public.avatar_catalog
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_avatar_catalog();

-- Trim community messages (keep newest 150 per community)
CREATE OR REPLACE FUNCTION public.trim_community_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM community_messages
  WHERE id IN (
    SELECT id FROM (
      SELECT id, row_number() OVER (PARTITION BY community_id ORDER BY created_at DESC) AS rn
      FROM community_messages
    ) ranked WHERE rn > 150
  );
END;
$$;

SELECT cron.schedule(
  'trim-community-messages',
  '0 * * * *',
  $$ SELECT public.trim_community_messages(); $$
);

-- =============================================================
-- STORAGE
-- =============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "avatars: public read"  ON storage.objects;
DROP POLICY IF EXISTS "avatars: admin upload" ON storage.objects;
DROP POLICY IF EXISTS "avatars: admin delete" ON storage.objects;

CREATE POLICY "avatars: public read"
  ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'avatars');
CREATE POLICY "avatars: admin upload"
  ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "avatars: admin delete"
  ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'avatars');

NOTIFY pgrst, 'reload schema';
