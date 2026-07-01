-- Drop existing community tables (empty, wrong schema) and recreate with correct schema
DROP TABLE IF EXISTS community_requests CASCADE;
DROP TABLE IF EXISTS community_messages CASCADE;
DROP TABLE IF EXISTS community_members CASCADE;
DROP TABLE IF EXISTS communities CASCADE;

-- Communities table
CREATE TABLE communities (
  id text PRIMARY KEY,
  abbr text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  topic text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Early Access')),
  locked boolean NOT NULL DEFAULT false,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);

-- Community members
CREATE TABLE community_members (
  community_id text NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  username text NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz,
  notifications_enabled boolean NOT NULL DEFAULT true,
  PRIMARY KEY (community_id, user_id)
);

-- Community messages
CREATE TABLE community_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id text NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  sender_id text NOT NULL,
  sender_name text NOT NULL,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  reply_to_message_id uuid,
  reply_to_sender_name text,
  reply_to_text text,
  deleted_at timestamptz,
  deleted_by_user_id text,
  liked_by text[] NOT NULL DEFAULT '{}'
);

-- Community requests
CREATE TABLE community_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id text NOT NULL,
  requester_name text NOT NULL,
  community_name text NOT NULL,
  focus_area text NOT NULL,
  audience text NOT NULL,
  why_now text NOT NULL,
  sample_prompt text NOT NULL DEFAULT '',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by text
);

-- RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read" ON communities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read" ON community_messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read" ON community_members FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read" ON community_requests FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_write" ON community_members FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update" ON community_members FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "anon_write" ON community_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update" ON community_messages FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "anon_write" ON community_requests FOR INSERT TO anon, authenticated WITH CHECK (true);

GRANT SELECT ON communities TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON community_members TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON community_messages TO anon, authenticated;
GRANT SELECT, INSERT ON community_requests TO anon, authenticated;

-- Toggle like RPC (atomic array add/remove)
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

-- Seed the 3 active communities + Lebanese Initiatives (empty — messages start blank)
INSERT INTO communities (id, abbr, title, description, topic, status, locked, created_at) VALUES
  ('lnt', 'LNT', 'Late Night Talks', 'Honest conversation when the world gets quiet and people finally say what they actually mean.', 'What thought has been following you all week?', 'Active', false, '2026-04-01T00:00:00Z'),
  ('syt', 'SYT', 'Speak Your Truth', 'A space to say what you''ve been holding back. No filters, no judgment — just real voices sharing real experiences.', 'What''s something you''ve been afraid to say out loud?', 'Active', false, '2026-04-01T00:00:00Z'),
  ('iijm', 'IIM', 'Is It Just Me?', 'Relatable moments, shared observations, and the quiet comfort of realizing you''re not the only one.', 'What''s something you do or feel that you thought was only you?', 'Active', false, '2026-04-01T00:00:00Z'),
  ('li', 'LI', 'Lebanese Initiatives', 'A space for Lebanese change-makers, community builders, and people driving impact inside Lebanon and across the diaspora.', 'What initiative or project are you working on right now?', 'Early Access', true, '2026-04-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
