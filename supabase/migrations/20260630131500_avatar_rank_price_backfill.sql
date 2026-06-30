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
numbered_ranks(image_id, rank_tier) as (
  values
    (1, 1), (2, 4), (3, 1), (4, 7), (5, 5), (6, 4), (7, 9), (8, 1), (9, 2), (10, 2),
    (11, 1), (12, 2), (13, 6), (14, 4), (15, 1), (16, 7), (17, 4), (18, 2), (19, 11), (20, 10),
    (21, 8), (22, 11), (23, 9), (24, 5), (25, 2), (26, 11), (27, 6), (28, 10), (29, 8), (30, 3),
    (31, 9), (32, 5), (33, 2), (34, 11), (36, 3), (37, 5), (38, 9), (39, 6), (40, 8),
    (41, 5), (42, 4), (43, 1), (44, 2), (46, 5), (47, 7), (48, 2), (49, 5),
    (51, 7), (52, 2), (53, 3), (54, 8), (55, 8), (56, 2), (57, 5), (58, 5)
),
catalog_ranks as (
  select
    catalog.id,
    least(
      greatest(
        coalesce(
          catalog.rank_tier,
          numbered_ranks.rank_tier,
          case lower(coalesce(catalog.frame_color, 'grey'))
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
  from public.avatar_catalog as catalog
  left join numbered_ranks
    on numbered_ranks.image_id = nullif(substring(catalog.image_src from '/avatars/([0-9]+)\.'), '')::integer
  where catalog.is_active = true
    and catalog.price not in ('0', 'Free')
)
update public.avatar_catalog as catalog
set price = rank_prices.price
from catalog_ranks
join rank_prices on rank_prices.rank_tier = catalog_ranks.rank_tier
where catalog.id = catalog_ranks.id;

notify pgrst, 'reload schema';
