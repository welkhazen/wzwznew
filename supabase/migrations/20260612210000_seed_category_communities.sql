-- Seed the new visible community categories and their cover art.
INSERT INTO public.communities (id, abbr, title, description, topic, status, locked, logo_url, created_at) VALUES
  ('the-ick', 'ICK', 'The Ick', 'Funny but honest deal-breakers, tiny turnoffs, and the moments that suddenly change the vibe.', 'What gave you the ick faster than you expected?', 'Active', false, '/assets/community-covers/the-ick.svg', '2026-06-12T00:00:00Z'),
  ('am-i-evil', 'AIE', 'Am I Evil?', 'Moral gray areas, guilty thoughts, and the anonymous jury for whether you crossed a line.', 'What choice made you wonder if you were the villain?', 'Active', false, '/assets/community-covers/am-i-evil.svg', '2026-06-12T00:00:00Z'),
  ('weirdest-thoughts', 'MWT', 'My Weirdest Thoughts', 'Odd shower thoughts, intrusive questions, and strange ideas that are safer to say anonymously.', 'What weird thought keeps popping into your head?', 'Active', false, '/assets/community-covers/weirdest-thoughts.svg', '2026-06-12T00:00:00Z'),
  ('is-this-normal', 'ITN', 'Is This Normal?', 'A grounded gut-check room for habits, feelings, and situations you are not sure everyone else gets.', 'What are you wondering is normal right now?', 'Active', false, '/assets/community-covers/is-this-normal.svg', '2026-06-12T00:00:00Z'),
  ('mancave', 'MAN', 'The Mancave', 'Direct conversations about pressure, confidence, friendship, dating, work, and being a guy today.', 'What do men need to talk about more honestly?', 'Active', false, '/assets/community-covers/mancave.svg', '2026-06-12T00:00:00Z'),
  ('gamer-gang', 'GG', 'Gamer Gang', 'Games, squads, salty losses, clutch wins, and the culture around what everyone is playing.', 'What game has your attention right now?', 'Active', false, '/assets/community-covers/gamer-gang.svg', '2026-06-12T00:00:00Z'),
  ('bizniz-minded', 'BIZ', 'Bizniz Minded', 'Ideas, money moves, side hustles, founder lessons, and practical ambition without fake guru energy.', 'What business idea or money lesson are you thinking about?', 'Active', false, '/assets/community-covers/bizniz-minded.svg', '2026-06-12T00:00:00Z'),
  ('match-maker', 'MM', 'Match Maker', 'Dating reads, chemistry checks, green flags, red flags, and honest takes on who fits who.', 'What match or dating situation needs a second opinion?', 'Active', false, '/assets/community-covers/match-maker.svg', '2026-06-12T00:00:00Z'),
  ('fucking-bored', 'FB', 'Fucking Bored', 'Low-stakes chaos, random prompts, mini-rants, and things to say when your brain needs noise.', 'What should bored people argue about for five minutes?', 'Active', false, '/assets/community-covers/fucking-bored.svg', '2026-06-12T00:00:00Z'),
  ('advice-now', 'ADV', 'Advice Now!', 'Fast, honest advice for the decision you need help with before you overthink it all night.', 'What do you need advice on right now?', 'Active', false, '/assets/community-covers/advice-now.svg', '2026-06-12T00:00:00Z'),
  ('feeling-like-shit', 'FLS', 'I''m feeling like shit honestly...', 'A real but careful venting room for heavy days, bad moods, and not pretending everything is fine.', 'What is weighing on you today?', 'Active', false, '/assets/community-covers/feeling-like-shit.svg', '2026-06-12T00:00:00Z'),
  ('best-story', 'BST', 'Best story I’ve been told', 'Unforgettable stories, strange lore, family legends, wild confessions, and tales worth retelling.', 'What is the best story someone ever told you?', 'Active', false, '/assets/community-covers/best-story.svg', '2026-06-12T00:00:00Z')
ON CONFLICT (id) DO UPDATE SET
  abbr = EXCLUDED.abbr,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  topic = EXCLUDED.topic,
  status = EXCLUDED.status,
  locked = EXCLUDED.locked,
  logo_url = EXCLUDED.logo_url;
