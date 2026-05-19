-- poll_options was missing RLS policies — options were silently dropped on insert

DROP POLICY IF EXISTS "public_read"   ON poll_options;
DROP POLICY IF EXISTS "public_insert" ON poll_options;
DROP POLICY IF EXISTS "public_delete" ON poll_options;
CREATE POLICY "public_read"   ON poll_options FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_insert" ON poll_options FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public_delete" ON poll_options FOR DELETE TO anon, authenticated USING (true);

GRANT SELECT, INSERT, DELETE ON poll_options TO anon, authenticated;
