-- Migration 1 created polls.options as NOT NULL without a default.
-- Later seed migrations insert polls without specifying options, relying on the default.
ALTER TABLE public.polls ALTER COLUMN options SET DEFAULT '[]'::jsonb;
