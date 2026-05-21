DROP POLICY IF EXISTS "anon_delete" ON public.community_members;

CREATE POLICY "anon_delete"
  ON public.community_members
  FOR DELETE
  TO anon, authenticated
  USING (true);

GRANT DELETE ON public.community_members TO anon, authenticated;
