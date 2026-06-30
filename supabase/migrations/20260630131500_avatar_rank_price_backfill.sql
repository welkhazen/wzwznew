-- Backfill shop avatar prices from the rank ladder. Reward-only rows stay free;
-- active paid rows should price from their authoritative rank_tier/frame_color.

with rank_prices(rank_tier, price) as (
  values
    (1, '25'),
    (2, '75'),
    (3, '100'),
    (4, '150'),
    (5, '300'),
    (6, '600'),
    (7, '1200'),
    (8, '2500'),
    (9, '5000'),
    (10, '10000'),
    (11, '25000'),
    (12, '50000')
),
catalog_ranks as (
  select
    id,
    least(
      greatest(
        coalesce(
          rank_tier,
          case lower(coalesce(frame_color, 'grey'))
            when 'grey' then 1
            when 'gray' then 1
            when 'blue' then 2
            when 'green' then 3
            when 'orange' then 4
            when 'purple' then 5
            when 'red' then 6
            when 'pink' then 7
            when 'rose' then 8
            when 'gold' then 9
            when 'white' then 10
            when 'rainbow' then 11
            when 'custom' then 12
            else 1
          end
        ),
        1
      ),
      12
    ) as rank_tier
  from public.avatar_catalog
  where is_active = true
    and price not in ('0', 'Free')
)
update public.avatar_catalog as catalog
set price = rank_prices.price
from catalog_ranks
join rank_prices on rank_prices.rank_tier = catalog_ranks.rank_tier
where catalog.id = catalog_ranks.id;

notify pgrst, 'reload schema';
