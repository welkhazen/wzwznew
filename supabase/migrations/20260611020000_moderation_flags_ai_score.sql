-- Track the AI toxicity score (if any) that contributed to a moderation flag.
ALTER TABLE public.moderation_flags
  ADD COLUMN IF NOT EXISTS ai_score numeric;
