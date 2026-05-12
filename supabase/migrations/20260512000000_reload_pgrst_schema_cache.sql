-- Force PostgREST to reload its schema cache so that columns added by
-- recent migrations (e.g. is_new on avatar_catalog) are visible to
-- SELECT queries and no longer return 500.
notify pgrst, 'reload schema';
