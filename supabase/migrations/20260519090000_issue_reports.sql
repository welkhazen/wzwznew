CREATE TABLE IF NOT EXISTS public.issue_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id text NOT NULL,
  reporter_name text NOT NULL,
  issue_type text NOT NULL,
  details text NOT NULL DEFAULT '',
  screenshot_data_url text,
  screenshot_name text,
  page_url text NOT NULL DEFAULT '',
  user_agent text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'dismissed', 'reviewed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by text
);

CREATE INDEX IF NOT EXISTS issue_reports_status_created_idx
  ON public.issue_reports (status, created_at DESC);

ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "issue_reports_read" ON public.issue_reports;
CREATE POLICY "issue_reports_read" ON public.issue_reports
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "issue_reports_insert" ON public.issue_reports;
CREATE POLICY "issue_reports_insert" ON public.issue_reports
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "issue_reports_update" ON public.issue_reports;
CREATE POLICY "issue_reports_update" ON public.issue_reports
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.issue_reports TO anon, authenticated;
