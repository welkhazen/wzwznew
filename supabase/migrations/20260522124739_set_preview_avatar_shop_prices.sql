update public.avatar_catalog
set
  price = '50',
  image_src = case id
    when 'silver-void' then '/avatars/1.webp'
    when 'neon-lynx' then '/avatars/2.webp'
    when 'blue-signal' then '/avatars/3.webp'
    when 'violet-mask' then '/avatars/04.webp'
    when 'horned-iron' then '/avatars/5.webp'
    when 'crimson-muse' then '/avatars/6.webp'
    when 'solar-flame' then '/avatars/07.webp'
    when 'pink-circuit' then '/avatars/08.webp'
    else image_src
  end
where id in (
  'silver-void',
  'neon-lynx',
  'blue-signal',
  'violet-mask',
  'horned-iron',
  'crimson-muse',
  'solar-flame',
  'pink-circuit'
);
