-- Server-side chat reports + user moderation status, with realtime.

CREATE TABLE IF NOT EXISTS public.chat_reports (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id        text,
  community_title     text,
  message_id          text,
  message_text        text,
  reporter_id         uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reporter_name       text,
  reported_user_id    uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reported_username   text,
  reason              text NOT NULL,
  details             text,
  status              text NOT NULL DEFAULT 'open'
                        CHECK (status IN ('open', 'dismissed', 'warned', 'banned')),
  resolved_at         timestamptz,
  resolved_by         text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_reports_status_idx
  ON public.chat_reports(status, created_at DESC);

ALTER TABLE public.chat_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_reports_read"   ON public.chat_reports;
DROP POLICY IF EXISTS "chat_reports_insert" ON public.chat_reports;
DROP POLICY IF EXISTS "chat_reports_update" ON public.chat_reports;
CREATE POLICY "chat_reports_read"   ON public.chat_reports FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "chat_reports_insert" ON public.chat_reports FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "chat_reports_update" ON public.chat_reports FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.chat_reports TO anon, authenticated;

-- Add to the realtime publication so admin UI gets live updates.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_reports';
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;

-- User moderation status used when a report is resolved as 'warned' or 'banned'.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'active'
    CHECK (moderation_status IN ('active', 'warned', 'banned')),
  ADD COLUMN IF NOT EXISTS moderated_by text,
  ADD COLUMN IF NOT EXISTS last_moderated_at timestamptz;

NOTIFY pgrst, 'reload schema';
