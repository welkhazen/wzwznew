-- Replace long, AI-slop community descriptions with short, catchy one-liners.
-- These render as the mini description under each community title in the dashboard.
UPDATE public.communities SET description = CASE id
  WHEN 'lnt' THEN 'Real talk after midnight.'
  WHEN 'syt' THEN 'Say what you''ve been holding back.'
  WHEN 'iijm' THEN 'It''s never just you.'
  WHEN 'li' THEN 'Lebanese builders making real moves.'
  WHEN 'bw' THEN 'Honest talk about your body.'
  WHEN 'the-ick' THEN 'Tiny turnoffs, instant ick.'
  WHEN 'am-i-evil' THEN 'Confess. The jury decides.'
  WHEN 'weirdest-thoughts' THEN 'Shower thoughts, said anonymously.'
  WHEN 'is-this-normal' THEN 'A quick gut-check from strangers.'
  WHEN 'mancave' THEN 'Guy stuff, said straight.'
  WHEN 'gamer-gang' THEN 'Squads, clutch wins, salty losses.'
  WHEN 'bizniz-minded' THEN 'Money moves, no guru energy.'
  WHEN 'match-maker' THEN 'Green flags, red flags, honest reads.'
  WHEN 'fucking-bored' THEN 'Chaos for a bored brain.'
  WHEN 'advice-now' THEN 'Fast advice before you overthink.'
  WHEN 'feeling-like-shit' THEN 'A soft place for heavy days.'
  WHEN 'best-story' THEN 'Wild stories worth retelling.'
  ELSE description END
WHERE id IN (
  'lnt','syt','iijm','li','bw','the-ick','am-i-evil','weirdest-thoughts',
  'is-this-normal','mancave','gamer-gang','bizniz-minded','match-maker',
  'fucking-bored','advice-now','feeling-like-shit','best-story'
);
