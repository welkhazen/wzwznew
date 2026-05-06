-- The partial unique index on level causes upsert 500s when the catalog is
-- re-leveled (different row IDs get the same level temporarily).
-- Ordering by level still works without the constraint.
drop index if exists public.avatar_catalog_level_unique;
