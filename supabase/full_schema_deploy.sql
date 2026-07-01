-- =============================================================
-- FULL SCHEMA DEPLOY — clean consolidated script
-- Run this in Supabase SQL Editor on a fresh project.
-- Safe to re-run: uses IF NOT EXISTS and DROP POLICY IF EXISTS.
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
  voter_key  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS poll_votes_poll_voter_key_unique
  ON public.poll_votes (poll_id, voter_key)
  WHERE voter_key IS NOT NULL;

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

-- Auto-create users row from Supabase Auth (not used by this app's custom auth, kept for compat)
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

-- =============================================================
-- SEED DATA — Communities
-- =============================================================

INSERT INTO public.communities (id, abbr, title, description, topic, status, locked, created_at) VALUES
  ('lnt',  'LNT', 'Late Night Talks',       'Real talk after midnight.',                          'What thought has been following you all week?',             'Active',       false, '2026-04-01T00:00:00Z'),
  ('syt',  'SYT', 'Speak Your Truth',        'Say what you''ve been holding back.',  'What''s something you''ve been afraid to say out loud?',    'Active',       false, '2026-04-01T00:00:00Z'),
  ('iijm', 'IIM', 'Is It Just Me?',          'It''s never just you.',                 'What''s something you do or feel that you thought was only you?', 'Active', false, '2026-04-01T00:00:00Z'),
  ('li',   'LI',  'Lebanese Initiatives',    'Lebanese builders making real moves.', 'What initiative or project are you working on right now?', 'Early Access', true,  '2026-04-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- SEED DATA — Polls (20 core + 100 more)
-- =============================================================

INSERT INTO public.polls (id, question, status, is_onboarding, created_at) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Do you think money buys happiness?', 'active', false, now() - interval '20 days'),
  ('a1000000-0000-0000-0000-000000000002', 'Would you rather be respected or liked?', 'active', false, now() - interval '19 days'),
  ('a1000000-0000-0000-0000-000000000003', 'Is social media making us more lonely?', 'active', false, now() - interval '18 days'),
  ('a1000000-0000-0000-0000-000000000004', 'Do you believe people can truly change?', 'active', false, now() - interval '17 days'),
  ('a1000000-0000-0000-0000-000000000005', 'Would you give up your phone for a week for $1,000?', 'active', false, now() - interval '16 days'),
  ('a1000000-0000-0000-0000-000000000006', 'Is it ever okay to lie to protect someone''s feelings?', 'active', false, now() - interval '15 days'),
  ('a1000000-0000-0000-0000-000000000007', 'Do you trust your gut more than data?', 'active', false, now() - interval '14 days'),
  ('a1000000-0000-0000-0000-000000000008', 'Would you move to another country for love?', 'active', false, now() - interval '13 days'),
  ('a1000000-0000-0000-0000-000000000009', 'Is success mostly luck or hard work?', 'active', false, now() - interval '12 days'),
  ('a1000000-0000-0000-0000-000000000010', 'Is being alone the same as being lonely?', 'active', false, now() - interval '11 days'),
  ('a1000000-0000-0000-0000-000000000011', 'Would you read your partner''s messages if you could?', 'active', false, now() - interval '10 days'),
  ('a1000000-0000-0000-0000-000000000012', 'Do you think first impressions are usually right?', 'active', false, now() - interval '9 days'),
  ('a1000000-0000-0000-0000-000000000013', 'Is it possible to be friends with an ex?', 'active', false, now() - interval '8 days'),
  ('a1000000-0000-0000-0000-000000000014', 'Do you believe in love at first sight?', 'active', false, now() - interval '7 days'),
  ('a1000000-0000-0000-0000-000000000015', 'Would you rather know when you''ll die or how?', 'active', false, now() - interval '6 days'),
  ('a1000000-0000-0000-0000-000000000016', 'Is jealousy a sign of love or insecurity?', 'active', false, now() - interval '5 days'),
  ('a1000000-0000-0000-0000-000000000017', 'Do you think most people are fundamentally good?', 'active', false, now() - interval '4 days'),
  ('a1000000-0000-0000-0000-000000000018', 'Would you take a pill that removes painful memories?', 'active', false, now() - interval '3 days'),
  ('a1000000-0000-0000-0000-000000000019', 'Is it selfish to prioritize your happiness over others?', 'active', false, now() - interval '2 days'),
  ('a1000000-0000-0000-0000-000000000020', 'Do you think you are the main character of your life?', 'active', false, now() - interval '1 day'),
  ('d1000000-0000-0000-0000-000000000001', 'Do you prefer silence or background noise when working?', 'active', false, now() - interval '100 days'),
  ('d1000000-0000-0000-0000-000000000002', 'Would you rather work from home forever or always in an office?', 'active', false, now() - interval '99 days'),
  ('d1000000-0000-0000-0000-000000000003', 'Is it possible to have too much ambition?', 'active', false, now() - interval '98 days'),
  ('d1000000-0000-0000-0000-000000000004', 'Do you think competition makes people better?', 'active', false, now() - interval '97 days'),
  ('d1000000-0000-0000-0000-000000000005', 'Would you choose fame over privacy?', 'active', false, now() - interval '96 days'),
  ('d1000000-0000-0000-0000-000000000006', 'Do you believe in karma?', 'active', false, now() - interval '95 days'),
  ('d1000000-0000-0000-0000-000000000007', 'Is it better to be feared or respected?', 'active', false, now() - interval '94 days'),
  ('d1000000-0000-0000-0000-000000000008', 'Would you live in another country permanently?', 'active', false, now() - interval '93 days'),
  ('d1000000-0000-0000-0000-000000000009', 'Do you think people reveal their true character under pressure?', 'active', false, now() - interval '92 days'),
  ('d1000000-0000-0000-0000-000000000010', 'Is forgiveness always the right choice?', 'active', false, now() - interval '91 days'),
  ('d1000000-0000-0000-0000-000000000011', 'Would you take a pay cut to do work you love?', 'active', false, now() - interval '90 days'),
  ('d1000000-0000-0000-0000-000000000012', 'Do you think social class affects personality?', 'active', false, now() - interval '89 days'),
  ('d1000000-0000-0000-0000-000000000013', 'Is perfection a realistic goal?', 'active', false, now() - interval '88 days'),
  ('d1000000-0000-0000-0000-000000000014', 'Would you rather know the truth or a comforting lie?', 'active', false, now() - interval '87 days'),
  ('d1000000-0000-0000-0000-000000000015', 'Do you think envy is ever a healthy motivator?', 'active', false, now() - interval '86 days'),
  ('d1000000-0000-0000-0000-000000000016', 'Is it selfish to spend money on yourself when others are in need?', 'active', false, now() - interval '85 days'),
  ('d1000000-0000-0000-0000-000000000017', 'Do you think childhood shapes your personality more than adulthood?', 'active', false, now() - interval '84 days'),
  ('d1000000-0000-0000-0000-000000000018', 'Would you confront someone who wronged you years ago?', 'active', false, now() - interval '83 days'),
  ('d1000000-0000-0000-0000-000000000019', 'Do you think most relationships have an expiry date?', 'active', false, now() - interval '82 days'),
  ('d1000000-0000-0000-0000-000000000020', 'Is loyalty more important than honesty?', 'active', false, now() - interval '81 days'),
  ('d1000000-0000-0000-0000-000000000021', 'Do you believe everything happens for a reason?', 'active', false, now() - interval '80 days'),
  ('d1000000-0000-0000-0000-000000000022', 'Would you give up social media for a year for $10,000?', 'active', false, now() - interval '79 days'),
  ('d1000000-0000-0000-0000-000000000023', 'Do you think beauty standards cause more harm than good?', 'active', false, now() - interval '78 days'),
  ('d1000000-0000-0000-0000-000000000024', 'Is vulnerability a strength or a weakness?', 'active', false, now() - interval '77 days'),
  ('d1000000-0000-0000-0000-000000000025', 'Do you prefer to lead or to follow?', 'active', false, now() - interval '76 days'),
  ('d1000000-0000-0000-0000-000000000026', 'Would you rather be the smartest or the happiest person in the room?', 'active', false, now() - interval '75 days'),
  ('d1000000-0000-0000-0000-000000000027', 'Do you think AI will replace human creativity?', 'active', false, now() - interval '74 days'),
  ('d1000000-0000-0000-0000-000000000028', 'Is it okay to cut off family members who are toxic?', 'active', false, now() - interval '73 days'),
  ('d1000000-0000-0000-0000-000000000029', 'Do you think people are more good than evil?', 'active', false, now() - interval '72 days'),
  ('d1000000-0000-0000-0000-000000000030', 'Would you rather remember everything or forget selectively?', 'active', false, now() - interval '71 days'),
  ('d1000000-0000-0000-0000-000000000031', 'Do you believe in second chances?', 'active', false, now() - interval '70 days'),
  ('d1000000-0000-0000-0000-000000000032', 'Is it possible to love someone you don''t fully trust?', 'active', false, now() - interval '69 days'),
  ('d1000000-0000-0000-0000-000000000033', 'Would you prefer a short life full of adventure over a long quiet life?', 'active', false, now() - interval '68 days'),
  ('d1000000-0000-0000-0000-000000000034', 'Do you think age gaps in relationships matter?', 'active', false, now() - interval '67 days'),
  ('d1000000-0000-0000-0000-000000000035', 'Is it okay to ghost someone instead of confronting them?', 'active', false, now() - interval '66 days'),
  ('d1000000-0000-0000-0000-000000000036', 'Do you think online friends can be as real as offline ones?', 'active', false, now() - interval '65 days'),
  ('d1000000-0000-0000-0000-000000000037', 'Would you rather know your future or be surprised?', 'active', false, now() - interval '64 days'),
  ('d1000000-0000-0000-0000-000000000038', 'Is regret useful or just painful?', 'active', false, now() - interval '63 days'),
  ('d1000000-0000-0000-0000-000000000039', 'Do you believe in fate?', 'active', false, now() - interval '62 days'),
  ('d1000000-0000-0000-0000-000000000040', 'Would you rather be rich and unhappy or average income and happy?', 'active', false, now() - interval '61 days'),
  ('d1000000-0000-0000-0000-000000000041', 'Is being too empathetic a problem?', 'active', false, now() - interval '60 days'),
  ('d1000000-0000-0000-0000-000000000042', 'Do you think success changes people''s character?', 'active', false, now() - interval '59 days'),
  ('d1000000-0000-0000-0000-000000000043', 'Would you read the diary of someone you love if you found it open?', 'active', false, now() - interval '58 days'),
  ('d1000000-0000-0000-0000-000000000044', 'Is ambition more nature or nurture?', 'active', false, now() - interval '57 days'),
  ('d1000000-0000-0000-0000-000000000045', 'Do you think people can be truly unselfish?', 'active', false, now() - interval '56 days'),
  ('d1000000-0000-0000-0000-000000000046', 'Would you sacrifice your career for the right relationship?', 'active', false, now() - interval '55 days'),
  ('d1000000-0000-0000-0000-000000000047', 'Is it better to apologize even when you''re not wrong?', 'active', false, now() - interval '54 days'),
  ('d1000000-0000-0000-0000-000000000048', 'Do you think humor is a sign of intelligence?', 'active', false, now() - interval '53 days'),
  ('d1000000-0000-0000-0000-000000000049', 'Would you tell a friend their partner is cheating on them?', 'active', false, now() - interval '52 days'),
  ('d1000000-0000-0000-0000-000000000050', 'Is overthinking more harmful than underthinking?', 'active', false, now() - interval '51 days'),
  ('d1000000-0000-0000-0000-000000000051', 'Do you believe in life after death?', 'active', false, now() - interval '50 days'),
  ('d1000000-0000-0000-0000-000000000052', 'Would you rather be loved or admired?', 'active', false, now() - interval '49 days'),
  ('d1000000-0000-0000-0000-000000000053', 'Is it possible to be happy alone for the rest of your life?', 'active', false, now() - interval '48 days'),
  ('d1000000-0000-0000-0000-000000000054', 'Do you think trauma can make someone stronger?', 'active', false, now() - interval '47 days'),
  ('d1000000-0000-0000-0000-000000000055', 'Would you choose to know if someone secretly disliked you?', 'active', false, now() - interval '46 days'),
  ('d1000000-0000-0000-0000-000000000056', 'Is it ever too late to change your life?', 'active', false, now() - interval '45 days'),
  ('d1000000-0000-0000-0000-000000000057', 'Do you think dreams have hidden meaning?', 'active', false, now() - interval '44 days'),
  ('d1000000-0000-0000-0000-000000000058', 'Would you rather be the person who gives or receives in a relationship?', 'active', false, now() - interval '43 days'),
  ('d1000000-0000-0000-0000-000000000059', 'Is it normal to feel lost in your 20s?', 'active', false, now() - interval '42 days'),
  ('d1000000-0000-0000-0000-000000000060', 'Do you think most people are performing a version of themselves?', 'active', false, now() - interval '41 days'),
  ('d1000000-0000-0000-0000-000000000061', 'Would you forgive infidelity if the relationship was otherwise perfect?', 'active', false, now() - interval '40 days'),
  ('d1000000-0000-0000-0000-000000000062', 'Is it possible to truly know another person?', 'active', false, now() - interval '39 days'),
  ('d1000000-0000-0000-0000-000000000063', 'Do you think confidence is born or built?', 'active', false, now() - interval '38 days'),
  ('d1000000-0000-0000-0000-000000000064', 'Would you accept help even if it came with strings attached?', 'active', false, now() - interval '37 days'),
  ('d1000000-0000-0000-0000-000000000065', 'Is nostalgia mostly positive or mostly painful?', 'active', false, now() - interval '36 days'),
  ('d1000000-0000-0000-0000-000000000066', 'Do you think people underestimate how much they influence others?', 'active', false, now() - interval '35 days'),
  ('d1000000-0000-0000-0000-000000000067', 'Would you rather know you were lied to or never find out?', 'active', false, now() - interval '34 days'),
  ('d1000000-0000-0000-0000-000000000068', 'Is it possible to love two people equally at the same time?', 'active', false, now() - interval '33 days'),
  ('d1000000-0000-0000-0000-000000000069', 'Do you think most people are living their true purpose?', 'active', false, now() - interval '32 days'),
  ('d1000000-0000-0000-0000-000000000070', 'Would you rather be deeply understood by one person or liked by many?', 'active', false, now() - interval '31 days'),
  ('d1000000-0000-0000-0000-000000000071', 'Is patience a virtue or just avoidance?', 'active', false, now() - interval '30 days'),
  ('d1000000-0000-0000-0000-000000000072', 'Do you believe in soul mates?', 'active', false, now() - interval '29 days'),
  ('d1000000-0000-0000-0000-000000000073', 'Would you swap your life with someone else''s for a month?', 'active', false, now() - interval '28 days'),
  ('d1000000-0000-0000-0000-000000000074', 'Is it possible to be too self-aware?', 'active', false, now() - interval '27 days'),
  ('d1000000-0000-0000-0000-000000000075', 'Do you think most people are secretly unhappy?', 'active', false, now() - interval '26 days'),
  ('d1000000-0000-0000-0000-000000000076', 'Would you rather lose your past memories or your ability to make new ones?', 'active', false, now() - interval '25 days'),
  ('d1000000-0000-0000-0000-000000000077', 'Is it possible to grow without pain?', 'active', false, now() - interval '24 days'),
  ('d1000000-0000-0000-0000-000000000078', 'Do you think people who say they don''t care about money are lying?', 'active', false, now() - interval '23 days'),
  ('d1000000-0000-0000-0000-000000000079', 'Would you rather be invisible or able to read minds?', 'active', false, now() - interval '22 days'),
  ('d1000000-0000-0000-0000-000000000080', 'Is emotional intelligence more important than IQ?', 'active', false, now() - interval '21 days'),
  ('d1000000-0000-0000-0000-000000000081', 'Do you think humans are naturally violent?', 'active', false, now() - interval '20 days'),
  ('d1000000-0000-0000-0000-000000000082', 'Would you tell your best friend a painful truth about themselves?', 'active', false, now() - interval '19 days'),
  ('d1000000-0000-0000-0000-000000000083', 'Is it possible to change someone you love?', 'active', false, now() - interval '18 days'),
  ('d1000000-0000-0000-0000-000000000084', 'Do you think most people settle in life?', 'active', false, now() - interval '17 days'),
  ('d1000000-0000-0000-0000-000000000085', 'Would you choose a guaranteed safe life over a risky great one?', 'active', false, now() - interval '16 days'),
  ('d1000000-0000-0000-0000-000000000086', 'Is it healthy to be emotionally detached?', 'active', false, now() - interval '15 days'),
  ('d1000000-0000-0000-0000-000000000087', 'Do you believe in the concept of the "right person wrong time"?', 'active', false, now() - interval '14 days'),
  ('d1000000-0000-0000-0000-000000000088', 'Would you prefer a world without conflict or without boredom?', 'active', false, now() - interval '13 days'),
  ('d1000000-0000-0000-0000-000000000089', 'Is it brave or foolish to wear your heart on your sleeve?', 'active', false, now() - interval '12 days'),
  ('d1000000-0000-0000-0000-000000000090', 'Do you think self-love is a prerequisite to loving others?', 'active', false, now() - interval '11 days'),
  ('d1000000-0000-0000-0000-000000000091', 'Would you rather be in a relationship that is passionate but unstable or stable but boring?', 'active', false, now() - interval '10 days'),
  ('d1000000-0000-0000-0000-000000000092', 'Is gratitude something that comes naturally or needs to be practiced?', 'active', false, now() - interval '9 days'),
  ('d1000000-0000-0000-0000-000000000093', 'Do you think procrastination is a sign of fear?', 'active', false, now() - interval '8 days'),
  ('d1000000-0000-0000-0000-000000000094', 'Would you rather be the most disciplined or the most creative person you know?', 'active', false, now() - interval '7 days'),
  ('d1000000-0000-0000-0000-000000000095', 'Is it possible to be truly objective about yourself?', 'active', false, now() - interval '6 days'),
  ('d1000000-0000-0000-0000-000000000096', 'Do you think social pressure makes people conform too much?', 'active', false, now() - interval '5 days'),
  ('d1000000-0000-0000-0000-000000000097', 'Would you rather be always right or always kind?', 'active', false, now() - interval '4 days'),
  ('d1000000-0000-0000-0000-000000000098', 'Is it possible to truly forgive without forgetting?', 'active', false, now() - interval '3 days'),
  ('d1000000-0000-0000-0000-000000000099', 'Do you think happiness is a choice?', 'active', false, now() - interval '2 days'),
  ('d1000000-0000-0000-0000-000000000100', 'Would you rather live a life of meaning or a life of pleasure?', 'active', false, now() - interval '1 day')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  status = EXCLUDED.status,
  is_onboarding = EXCLUDED.is_onboarding;

-- =============================================================
-- SEED DATA — Poll options
-- =============================================================

INSERT INTO public.poll_options (id, poll_id, label, position) VALUES
  ('b1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','Yes',0),
  ('b1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000001','No',1),
  ('b1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000002','Respected',0),
  ('b1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000002','Liked',1),
  ('b1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000003','Yes',0),
  ('b1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000003','No',1),
  ('b1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000004','Yes',0),
  ('b1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000004','No',1),
  ('b1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-000000000005','Yes',0),
  ('b1000000-0000-0000-0000-000000000010','a1000000-0000-0000-0000-000000000005','No',1),
  ('b1000000-0000-0000-0000-000000000011','a1000000-0000-0000-0000-000000000006','Yes',0),
  ('b1000000-0000-0000-0000-000000000012','a1000000-0000-0000-0000-000000000006','No',1),
  ('b1000000-0000-0000-0000-000000000013','a1000000-0000-0000-0000-000000000007','Gut',0),
  ('b1000000-0000-0000-0000-000000000014','a1000000-0000-0000-0000-000000000007','Data',1),
  ('b1000000-0000-0000-0000-000000000015','a1000000-0000-0000-0000-000000000008','Yes',0),
  ('b1000000-0000-0000-0000-000000000016','a1000000-0000-0000-0000-000000000008','No',1),
  ('b1000000-0000-0000-0000-000000000017','a1000000-0000-0000-0000-000000000009','Hard work',0),
  ('b1000000-0000-0000-0000-000000000018','a1000000-0000-0000-0000-000000000009','Luck',1),
  ('b1000000-0000-0000-0000-000000000019','a1000000-0000-0000-0000-000000000010','Yes',0),
  ('b1000000-0000-0000-0000-000000000020','a1000000-0000-0000-0000-000000000010','No',1),
  ('b1000000-0000-0000-0000-000000000021','a1000000-0000-0000-0000-000000000011','Yes',0),
  ('b1000000-0000-0000-0000-000000000022','a1000000-0000-0000-0000-000000000011','No',1),
  ('b1000000-0000-0000-0000-000000000023','a1000000-0000-0000-0000-000000000012','Yes',0),
  ('b1000000-0000-0000-0000-000000000024','a1000000-0000-0000-0000-000000000012','No',1),
  ('b1000000-0000-0000-0000-000000000025','a1000000-0000-0000-0000-000000000013','Yes',0),
  ('b1000000-0000-0000-0000-000000000026','a1000000-0000-0000-0000-000000000013','No',1),
  ('b1000000-0000-0000-0000-000000000027','a1000000-0000-0000-0000-000000000014','Yes',0),
  ('b1000000-0000-0000-0000-000000000028','a1000000-0000-0000-0000-000000000014','No',1),
  ('b1000000-0000-0000-0000-000000000029','a1000000-0000-0000-0000-000000000015','When',0),
  ('b1000000-0000-0000-0000-000000000030','a1000000-0000-0000-0000-000000000015','How',1),
  ('b1000000-0000-0000-0000-000000000031','a1000000-0000-0000-0000-000000000016','Love',0),
  ('b1000000-0000-0000-0000-000000000032','a1000000-0000-0000-0000-000000000016','Insecurity',1),
  ('b1000000-0000-0000-0000-000000000033','a1000000-0000-0000-0000-000000000017','Yes',0),
  ('b1000000-0000-0000-0000-000000000034','a1000000-0000-0000-0000-000000000017','No',1),
  ('b1000000-0000-0000-0000-000000000035','a1000000-0000-0000-0000-000000000018','Yes',0),
  ('b1000000-0000-0000-0000-000000000036','a1000000-0000-0000-0000-000000000018','No',1),
  ('b1000000-0000-0000-0000-000000000037','a1000000-0000-0000-0000-000000000019','Yes',0),
  ('b1000000-0000-0000-0000-000000000038','a1000000-0000-0000-0000-000000000019','No',1),
  ('b1000000-0000-0000-0000-000000000039','a1000000-0000-0000-0000-000000000020','Yes',0),
  ('b1000000-0000-0000-0000-000000000040','a1000000-0000-0000-0000-000000000020','No',1),
  ('e1000000-0000-0000-0000-000000000001','d1000000-0000-0000-0000-000000000001','Silence',0),
  ('e1000000-0000-0000-0000-000000000002','d1000000-0000-0000-0000-000000000001','Noise',1),
  ('e1000000-0000-0000-0000-000000000003','d1000000-0000-0000-0000-000000000002','Home',0),
  ('e1000000-0000-0000-0000-000000000004','d1000000-0000-0000-0000-000000000002','Office',1),
  ('e1000000-0000-0000-0000-000000000005','d1000000-0000-0000-0000-000000000003','Yes',0),
  ('e1000000-0000-0000-0000-000000000006','d1000000-0000-0000-0000-000000000003','No',1),
  ('e1000000-0000-0000-0000-000000000007','d1000000-0000-0000-0000-000000000004','Yes',0),
  ('e1000000-0000-0000-0000-000000000008','d1000000-0000-0000-0000-000000000004','No',1),
  ('e1000000-0000-0000-0000-000000000009','d1000000-0000-0000-0000-000000000005','Fame',0),
  ('e1000000-0000-0000-0000-000000000010','d1000000-0000-0000-0000-000000000005','Privacy',1),
  ('e1000000-0000-0000-0000-000000000011','d1000000-0000-0000-0000-000000000006','Yes',0),
  ('e1000000-0000-0000-0000-000000000012','d1000000-0000-0000-0000-000000000006','No',1),
  ('e1000000-0000-0000-0000-000000000013','d1000000-0000-0000-0000-000000000007','Feared',0),
  ('e1000000-0000-0000-0000-000000000014','d1000000-0000-0000-0000-000000000007','Respected',1),
  ('e1000000-0000-0000-0000-000000000015','d1000000-0000-0000-0000-000000000008','Yes',0),
  ('e1000000-0000-0000-0000-000000000016','d1000000-0000-0000-0000-000000000008','No',1),
  ('e1000000-0000-0000-0000-000000000017','d1000000-0000-0000-0000-000000000009','Yes',0),
  ('e1000000-0000-0000-0000-000000000018','d1000000-0000-0000-0000-000000000009','No',1),
  ('e1000000-0000-0000-0000-000000000019','d1000000-0000-0000-0000-000000000010','Yes',0),
  ('e1000000-0000-0000-0000-000000000020','d1000000-0000-0000-0000-000000000010','No',1),
  ('e1000000-0000-0000-0000-000000000021','d1000000-0000-0000-0000-000000000011','Yes',0),
  ('e1000000-0000-0000-0000-000000000022','d1000000-0000-0000-0000-000000000011','No',1),
  ('e1000000-0000-0000-0000-000000000023','d1000000-0000-0000-0000-000000000012','Yes',0),
  ('e1000000-0000-0000-0000-000000000024','d1000000-0000-0000-0000-000000000012','No',1),
  ('e1000000-0000-0000-0000-000000000025','d1000000-0000-0000-0000-000000000013','Yes',0),
  ('e1000000-0000-0000-0000-000000000026','d1000000-0000-0000-0000-000000000013','No',1),
  ('e1000000-0000-0000-0000-000000000027','d1000000-0000-0000-0000-000000000014','Truth',0),
  ('e1000000-0000-0000-0000-000000000028','d1000000-0000-0000-0000-000000000014','Comfort',1),
  ('e1000000-0000-0000-0000-000000000029','d1000000-0000-0000-0000-000000000015','Yes',0),
  ('e1000000-0000-0000-0000-000000000030','d1000000-0000-0000-0000-000000000015','No',1),
  ('e1000000-0000-0000-0000-000000000031','d1000000-0000-0000-0000-000000000016','Yes',0),
  ('e1000000-0000-0000-0000-000000000032','d1000000-0000-0000-0000-000000000016','No',1),
  ('e1000000-0000-0000-0000-000000000033','d1000000-0000-0000-0000-000000000017','Childhood',0),
  ('e1000000-0000-0000-0000-000000000034','d1000000-0000-0000-0000-000000000017','Adulthood',1),
  ('e1000000-0000-0000-0000-000000000035','d1000000-0000-0000-0000-000000000018','Yes',0),
  ('e1000000-0000-0000-0000-000000000036','d1000000-0000-0000-0000-000000000018','No',1),
  ('e1000000-0000-0000-0000-000000000037','d1000000-0000-0000-0000-000000000019','Yes',0),
  ('e1000000-0000-0000-0000-000000000038','d1000000-0000-0000-0000-000000000019','No',1),
  ('e1000000-0000-0000-0000-000000000039','d1000000-0000-0000-0000-000000000020','Loyalty',0),
  ('e1000000-0000-0000-0000-000000000040','d1000000-0000-0000-0000-000000000020','Honesty',1),
  ('e1000000-0000-0000-0000-000000000041','d1000000-0000-0000-0000-000000000021','Yes',0),
  ('e1000000-0000-0000-0000-000000000042','d1000000-0000-0000-0000-000000000021','No',1),
  ('e1000000-0000-0000-0000-000000000043','d1000000-0000-0000-0000-000000000022','Yes',0),
  ('e1000000-0000-0000-0000-000000000044','d1000000-0000-0000-0000-000000000022','No',1),
  ('e1000000-0000-0000-0000-000000000045','d1000000-0000-0000-0000-000000000023','Yes',0),
  ('e1000000-0000-0000-0000-000000000046','d1000000-0000-0000-0000-000000000023','No',1),
  ('e1000000-0000-0000-0000-000000000047','d1000000-0000-0000-0000-000000000024','Strength',0),
  ('e1000000-0000-0000-0000-000000000048','d1000000-0000-0000-0000-000000000024','Weakness',1),
  ('e1000000-0000-0000-0000-000000000049','d1000000-0000-0000-0000-000000000025','Lead',0),
  ('e1000000-0000-0000-0000-000000000050','d1000000-0000-0000-0000-000000000025','Follow',1),
  ('e1000000-0000-0000-0000-000000000051','d1000000-0000-0000-0000-000000000026','Smartest',0),
  ('e1000000-0000-0000-0000-000000000052','d1000000-0000-0000-0000-000000000026','Happiest',1),
  ('e1000000-0000-0000-0000-000000000053','d1000000-0000-0000-0000-000000000027','Yes',0),
  ('e1000000-0000-0000-0000-000000000054','d1000000-0000-0000-0000-000000000027','No',1),
  ('e1000000-0000-0000-0000-000000000055','d1000000-0000-0000-0000-000000000028','Yes',0),
  ('e1000000-0000-0000-0000-000000000056','d1000000-0000-0000-0000-000000000028','No',1),
  ('e1000000-0000-0000-0000-000000000057','d1000000-0000-0000-0000-000000000029','Yes',0),
  ('e1000000-0000-0000-0000-000000000058','d1000000-0000-0000-0000-000000000029','No',1),
  ('e1000000-0000-0000-0000-000000000059','d1000000-0000-0000-0000-000000000030','Remember all',0),
  ('e1000000-0000-0000-0000-000000000060','d1000000-0000-0000-0000-000000000030','Forget selectively',1),
  ('e1000000-0000-0000-0000-000000000061','d1000000-0000-0000-0000-000000000031','Yes',0),
  ('e1000000-0000-0000-0000-000000000062','d1000000-0000-0000-0000-000000000031','No',1),
  ('e1000000-0000-0000-0000-000000000063','d1000000-0000-0000-0000-000000000032','Yes',0),
  ('e1000000-0000-0000-0000-000000000064','d1000000-0000-0000-0000-000000000032','No',1),
  ('e1000000-0000-0000-0000-000000000065','d1000000-0000-0000-0000-000000000033','Adventure',0),
  ('e1000000-0000-0000-0000-000000000066','d1000000-0000-0000-0000-000000000033','Long & quiet',1),
  ('e1000000-0000-0000-0000-000000000067','d1000000-0000-0000-0000-000000000034','Yes',0),
  ('e1000000-0000-0000-0000-000000000068','d1000000-0000-0000-0000-000000000034','No',1),
  ('e1000000-0000-0000-0000-000000000069','d1000000-0000-0000-0000-000000000035','Yes',0),
  ('e1000000-0000-0000-0000-000000000070','d1000000-0000-0000-0000-000000000035','No',1),
  ('e1000000-0000-0000-0000-000000000071','d1000000-0000-0000-0000-000000000036','Yes',0),
  ('e1000000-0000-0000-0000-000000000072','d1000000-0000-0000-0000-000000000036','No',1),
  ('e1000000-0000-0000-0000-000000000073','d1000000-0000-0000-0000-000000000037','Know future',0),
  ('e1000000-0000-0000-0000-000000000074','d1000000-0000-0000-0000-000000000037','Be surprised',1),
  ('e1000000-0000-0000-0000-000000000075','d1000000-0000-0000-0000-000000000038','Useful',0),
  ('e1000000-0000-0000-0000-000000000076','d1000000-0000-0000-0000-000000000038','Just painful',1),
  ('e1000000-0000-0000-0000-000000000077','d1000000-0000-0000-0000-000000000039','Yes',0),
  ('e1000000-0000-0000-0000-000000000078','d1000000-0000-0000-0000-000000000039','No',1),
  ('e1000000-0000-0000-0000-000000000079','d1000000-0000-0000-0000-000000000040','Rich & unhappy',0),
  ('e1000000-0000-0000-0000-000000000080','d1000000-0000-0000-0000-000000000040','Average & happy',1),
  ('e1000000-0000-0000-0000-000000000081','d1000000-0000-0000-0000-000000000041','Yes',0),
  ('e1000000-0000-0000-0000-000000000082','d1000000-0000-0000-0000-000000000041','No',1),
  ('e1000000-0000-0000-0000-000000000083','d1000000-0000-0000-0000-000000000042','Yes',0),
  ('e1000000-0000-0000-0000-000000000084','d1000000-0000-0000-0000-000000000042','No',1),
  ('e1000000-0000-0000-0000-000000000085','d1000000-0000-0000-0000-000000000043','Yes',0),
  ('e1000000-0000-0000-0000-000000000086','d1000000-0000-0000-0000-000000000043','No',1),
  ('e1000000-0000-0000-0000-000000000087','d1000000-0000-0000-0000-000000000044','Nature',0),
  ('e1000000-0000-0000-0000-000000000088','d1000000-0000-0000-0000-000000000044','Nurture',1),
  ('e1000000-0000-0000-0000-000000000089','d1000000-0000-0000-0000-000000000045','Yes',0),
  ('e1000000-0000-0000-0000-000000000090','d1000000-0000-0000-0000-000000000045','No',1),
  ('e1000000-0000-0000-0000-000000000091','d1000000-0000-0000-0000-000000000046','Yes',0),
  ('e1000000-0000-0000-0000-000000000092','d1000000-0000-0000-0000-000000000046','No',1),
  ('e1000000-0000-0000-0000-000000000093','d1000000-0000-0000-0000-000000000047','Yes',0),
  ('e1000000-0000-0000-0000-000000000094','d1000000-0000-0000-0000-000000000047','No',1),
  ('e1000000-0000-0000-0000-000000000095','d1000000-0000-0000-0000-000000000048','Yes',0),
  ('e1000000-0000-0000-0000-000000000096','d1000000-0000-0000-0000-000000000048','No',1),
  ('e1000000-0000-0000-0000-000000000097','d1000000-0000-0000-0000-000000000049','Yes',0),
  ('e1000000-0000-0000-0000-000000000098','d1000000-0000-0000-0000-000000000049','No',1),
  ('e1000000-0000-0000-0000-000000000099','d1000000-0000-0000-0000-000000000050','Overthinking',0),
  ('e1000000-0000-0000-0000-000000000100','d1000000-0000-0000-0000-000000000050','Underthinking',1),
  ('e1000000-0000-0000-0000-000000000101','d1000000-0000-0000-0000-000000000051','Yes',0),
  ('e1000000-0000-0000-0000-000000000102','d1000000-0000-0000-0000-000000000051','No',1),
  ('e1000000-0000-0000-0000-000000000103','d1000000-0000-0000-0000-000000000052','Loved',0),
  ('e1000000-0000-0000-0000-000000000104','d1000000-0000-0000-0000-000000000052','Admired',1),
  ('e1000000-0000-0000-0000-000000000105','d1000000-0000-0000-0000-000000000053','Yes',0),
  ('e1000000-0000-0000-0000-000000000106','d1000000-0000-0000-0000-000000000053','No',1),
  ('e1000000-0000-0000-0000-000000000107','d1000000-0000-0000-0000-000000000054','Yes',0),
  ('e1000000-0000-0000-0000-000000000108','d1000000-0000-0000-0000-000000000054','No',1),
  ('e1000000-0000-0000-0000-000000000109','d1000000-0000-0000-0000-000000000055','Yes',0),
  ('e1000000-0000-0000-0000-000000000110','d1000000-0000-0000-0000-000000000055','No',1),
  ('e1000000-0000-0000-0000-000000000111','d1000000-0000-0000-0000-000000000056','Yes',0),
  ('e1000000-0000-0000-0000-000000000112','d1000000-0000-0000-0000-000000000056','No',1),
  ('e1000000-0000-0000-0000-000000000113','d1000000-0000-0000-0000-000000000057','Yes',0),
  ('e1000000-0000-0000-0000-000000000114','d1000000-0000-0000-0000-000000000057','No',1),
  ('e1000000-0000-0000-0000-000000000115','d1000000-0000-0000-0000-000000000058','Give',0),
  ('e1000000-0000-0000-0000-000000000116','d1000000-0000-0000-0000-000000000058','Receive',1),
  ('e1000000-0000-0000-0000-000000000117','d1000000-0000-0000-0000-000000000059','Yes',0),
  ('e1000000-0000-0000-0000-000000000118','d1000000-0000-0000-0000-000000000059','No',1),
  ('e1000000-0000-0000-0000-000000000119','d1000000-0000-0000-0000-000000000060','Yes',0),
  ('e1000000-0000-0000-0000-000000000120','d1000000-0000-0000-0000-000000000060','No',1),
  ('e1000000-0000-0000-0000-000000000121','d1000000-0000-0000-0000-000000000061','Yes',0),
  ('e1000000-0000-0000-0000-000000000122','d1000000-0000-0000-0000-000000000061','No',1),
  ('e1000000-0000-0000-0000-000000000123','d1000000-0000-0000-0000-000000000062','Yes',0),
  ('e1000000-0000-0000-0000-000000000124','d1000000-0000-0000-0000-000000000062','No',1),
  ('e1000000-0000-0000-0000-000000000125','d1000000-0000-0000-0000-000000000063','Born',0),
  ('e1000000-0000-0000-0000-000000000126','d1000000-0000-0000-0000-000000000063','Built',1),
  ('e1000000-0000-0000-0000-000000000127','d1000000-0000-0000-0000-000000000064','Yes',0),
  ('e1000000-0000-0000-0000-000000000128','d1000000-0000-0000-0000-000000000064','No',1),
  ('e1000000-0000-0000-0000-000000000129','d1000000-0000-0000-0000-000000000065','Positive',0),
  ('e1000000-0000-0000-0000-000000000130','d1000000-0000-0000-0000-000000000065','Painful',1),
  ('e1000000-0000-0000-0000-000000000131','d1000000-0000-0000-0000-000000000066','Yes',0),
  ('e1000000-0000-0000-0000-000000000132','d1000000-0000-0000-0000-000000000066','No',1),
  ('e1000000-0000-0000-0000-000000000133','d1000000-0000-0000-0000-000000000067','Know',0),
  ('e1000000-0000-0000-0000-000000000134','d1000000-0000-0000-0000-000000000067','Never find out',1),
  ('e1000000-0000-0000-0000-000000000135','d1000000-0000-0000-0000-000000000068','Yes',0),
  ('e1000000-0000-0000-0000-000000000136','d1000000-0000-0000-0000-000000000068','No',1),
  ('e1000000-0000-0000-0000-000000000137','d1000000-0000-0000-0000-000000000069','Yes',0),
  ('e1000000-0000-0000-0000-000000000138','d1000000-0000-0000-0000-000000000069','No',1),
  ('e1000000-0000-0000-0000-000000000139','d1000000-0000-0000-0000-000000000070','Understood by one',0),
  ('e1000000-0000-0000-0000-000000000140','d1000000-0000-0000-0000-000000000070','Liked by many',1),
  ('e1000000-0000-0000-0000-000000000141','d1000000-0000-0000-0000-000000000071','Virtue',0),
  ('e1000000-0000-0000-0000-000000000142','d1000000-0000-0000-0000-000000000071','Avoidance',1),
  ('e1000000-0000-0000-0000-000000000143','d1000000-0000-0000-0000-000000000072','Yes',0),
  ('e1000000-0000-0000-0000-000000000144','d1000000-0000-0000-0000-000000000072','No',1),
  ('e1000000-0000-0000-0000-000000000145','d1000000-0000-0000-0000-000000000073','Yes',0),
  ('e1000000-0000-0000-0000-000000000146','d1000000-0000-0000-0000-000000000073','No',1),
  ('e1000000-0000-0000-0000-000000000147','d1000000-0000-0000-0000-000000000074','Yes',0),
  ('e1000000-0000-0000-0000-000000000148','d1000000-0000-0000-0000-000000000074','No',1),
  ('e1000000-0000-0000-0000-000000000149','d1000000-0000-0000-0000-000000000075','Yes',0),
  ('e1000000-0000-0000-0000-000000000150','d1000000-0000-0000-0000-000000000075','No',1),
  ('e1000000-0000-0000-0000-000000000151','d1000000-0000-0000-0000-000000000076','Lose past',0),
  ('e1000000-0000-0000-0000-000000000152','d1000000-0000-0000-0000-000000000076','Lose future',1),
  ('e1000000-0000-0000-0000-000000000153','d1000000-0000-0000-0000-000000000077','Yes',0),
  ('e1000000-0000-0000-0000-000000000154','d1000000-0000-0000-0000-000000000077','No',1),
  ('e1000000-0000-0000-0000-000000000155','d1000000-0000-0000-0000-000000000078','Yes',0),
  ('e1000000-0000-0000-0000-000000000156','d1000000-0000-0000-0000-000000000078','No',1),
  ('e1000000-0000-0000-0000-000000000157','d1000000-0000-0000-0000-000000000079','Invisible',0),
  ('e1000000-0000-0000-0000-000000000158','d1000000-0000-0000-0000-000000000079','Read minds',1),
  ('e1000000-0000-0000-0000-000000000159','d1000000-0000-0000-0000-000000000080','Yes',0),
  ('e1000000-0000-0000-0000-000000000160','d1000000-0000-0000-0000-000000000080','No',1),
  ('e1000000-0000-0000-0000-000000000161','d1000000-0000-0000-0000-000000000081','Yes',0),
  ('e1000000-0000-0000-0000-000000000162','d1000000-0000-0000-0000-000000000081','No',1),
  ('e1000000-0000-0000-0000-000000000163','d1000000-0000-0000-0000-000000000082','Yes',0),
  ('e1000000-0000-0000-0000-000000000164','d1000000-0000-0000-0000-000000000082','No',1),
  ('e1000000-0000-0000-0000-000000000165','d1000000-0000-0000-0000-000000000083','Yes',0),
  ('e1000000-0000-0000-0000-000000000166','d1000000-0000-0000-0000-000000000083','No',1),
  ('e1000000-0000-0000-0000-000000000167','d1000000-0000-0000-0000-000000000084','Yes',0),
  ('e1000000-0000-0000-0000-000000000168','d1000000-0000-0000-0000-000000000084','No',1),
  ('e1000000-0000-0000-0000-000000000169','d1000000-0000-0000-0000-000000000085','Safe life',0),
  ('e1000000-0000-0000-0000-000000000170','d1000000-0000-0000-0000-000000000085','Risky great one',1),
  ('e1000000-0000-0000-0000-000000000171','d1000000-0000-0000-0000-000000000086','Yes',0),
  ('e1000000-0000-0000-0000-000000000172','d1000000-0000-0000-0000-000000000086','No',1),
  ('e1000000-0000-0000-0000-000000000173','d1000000-0000-0000-0000-000000000087','Yes',0),
  ('e1000000-0000-0000-0000-000000000174','d1000000-0000-0000-0000-000000000087','No',1),
  ('e1000000-0000-0000-0000-000000000175','d1000000-0000-0000-0000-000000000088','No conflict',0),
  ('e1000000-0000-0000-0000-000000000176','d1000000-0000-0000-0000-000000000088','No boredom',1),
  ('e1000000-0000-0000-0000-000000000177','d1000000-0000-0000-0000-000000000089','Brave',0),
  ('e1000000-0000-0000-0000-000000000178','d1000000-0000-0000-0000-000000000089','Foolish',1),
  ('e1000000-0000-0000-0000-000000000179','d1000000-0000-0000-0000-000000000090','Yes',0),
  ('e1000000-0000-0000-0000-000000000180','d1000000-0000-0000-0000-000000000090','No',1),
  ('e1000000-0000-0000-0000-000000000181','d1000000-0000-0000-0000-000000000091','Passionate',0),
  ('e1000000-0000-0000-0000-000000000182','d1000000-0000-0000-0000-000000000091','Stable',1),
  ('e1000000-0000-0000-0000-000000000183','d1000000-0000-0000-0000-000000000092','Natural',0),
  ('e1000000-0000-0000-0000-000000000184','d1000000-0000-0000-0000-000000000092','Practiced',1),
  ('e1000000-0000-0000-0000-000000000185','d1000000-0000-0000-0000-000000000093','Yes',0),
  ('e1000000-0000-0000-0000-000000000186','d1000000-0000-0000-0000-000000000093','No',1),
  ('e1000000-0000-0000-0000-000000000187','d1000000-0000-0000-0000-000000000094','Disciplined',0),
  ('e1000000-0000-0000-0000-000000000188','d1000000-0000-0000-0000-000000000094','Creative',1),
  ('e1000000-0000-0000-0000-000000000189','d1000000-0000-0000-0000-000000000095','Yes',0),
  ('e1000000-0000-0000-0000-000000000190','d1000000-0000-0000-0000-000000000095','No',1),
  ('e1000000-0000-0000-0000-000000000191','d1000000-0000-0000-0000-000000000096','Yes',0),
  ('e1000000-0000-0000-0000-000000000192','d1000000-0000-0000-0000-000000000096','No',1),
  ('e1000000-0000-0000-0000-000000000193','d1000000-0000-0000-0000-000000000097','Always right',0),
  ('e1000000-0000-0000-0000-000000000194','d1000000-0000-0000-0000-000000000097','Always kind',1),
  ('e1000000-0000-0000-0000-000000000195','d1000000-0000-0000-0000-000000000098','Yes',0),
  ('e1000000-0000-0000-0000-000000000196','d1000000-0000-0000-0000-000000000098','No',1),
  ('e1000000-0000-0000-0000-000000000197','d1000000-0000-0000-0000-000000000099','Yes',0),
  ('e1000000-0000-0000-0000-000000000198','d1000000-0000-0000-0000-000000000099','No',1),
  ('e1000000-0000-0000-0000-000000000199','d1000000-0000-0000-0000-000000000100','Meaning',0),
  ('e1000000-0000-0000-0000-000000000200','d1000000-0000-0000-0000-000000000100','Pleasure',1)
ON CONFLICT (id) DO UPDATE SET
  poll_id  = EXCLUDED.poll_id,
  label    = EXCLUDED.label,
  position = EXCLUDED.position;

-- =============================================================
-- Final cache reload
-- =============================================================
NOTIFY pgrst, 'reload schema';
