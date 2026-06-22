# Avatar Registry

Single reference for every avatar: its id, name, rank tier (color), and which
reward pool (if any) it belongs to — plus exactly how to add a new one.

> Keep this file in sync whenever an avatar is added, renamed, re-ranked, or
> moved between pools. It mirrors the four source-of-truth files listed below.

## Source-of-truth files

The avatar system is defined across four files. This doc documents them; edit
the code files to change behavior, then update the table here.

| Concern | File | What it holds |
|---|---|---|
| Image files | `public/avatars/<id>.png` | The artwork. Filename is the numeric **id**. |
| Names | `src/config/avatarNames.ts` | `NUMBERED_AVATAR_NAMES` (id → display name) and `DUPLICATE_AVATAR_IMAGE_IDS` (id → canonical id for re-used artwork). |
| Ranks | `src/lib/avatarRank.ts` | `NUMBERED_AVATAR_RANKS` (id → rank 1–10) and `AVATAR_RANK_LABELS` (rank → color label). |
| Pools | `src/config/avatarConfig.ts` | `FREE_SPIN_AVATAR_IDS` (the 10 spin-wheel avatars, **in rank order**) and `EARLY_SIGNUP_AVATAR_IDS` (now empty — the early-signup pool was retired). |

The server also keeps an `avatar_catalog` table (Supabase). Reward claims are
validated against it (`spin-<id>` / `signup-<id>` must exist and be active), so
**a pool can only reference ids that exist in `avatar_catalog`** — see "Adding a
new avatar" below.

## Rank tiers (the color ladder)

Rank = rarity. The wheel orders its segments by this ladder and weights the spin
so lower ranks win more often (rank 1 is 10× more likely than rank 10).

| Rank | Tier / color | | Rank | Tier / color |
|---:|---|---|---:|---|
| 1 | Grey | | 6 | Pink |
| 2 | Blue | | 7 | Rose |
| 3 | Purple | | 8 | Gold |
| 4 | Orange | | 9 | White |
| 5 | Red | | 10 | Rainbow |

**Naming rule:** an avatar's name should start with a word that matches its rank
tier and its artwork color (e.g. a rank‑3 purple avatar → "Purple Oracle"). Name,
rank, and image must all agree.

> Id 35 ("Platinum Echo") was removed — its artwork was mis-colored red, not
> platinum/silver. There is no rank-8 tier in the artwork anymore; "Platinum"
> was replaced by inserting "Rose" at rank 7 and shifting "Gold" up to rank 8.

## The reward pools

**Free-spin wheel** — `FREE_SPIN_AVATAR_IDS`, listed in rank order (slot 1 = rank 1):

| Slot | Rank | Tier | ID | Name |
|---:|---:|---|---:|---|
| 1 | 1 | Grey | 43 | Grey Sentinel |
| 2 | 2 | Blue | 52 | Blue Cipher |
| 3 | 3 | Purple | 41 | Purple Oracle |
| 4 | 4 | Orange | 42 | Orange Vortex |
| 5 | 5 | Red | 13 | Red Phantom |
| 6 | 6 | Pink | 47 | Pink Nova |
| 7 | 7 | Rose | 21 | Rose Warden |
| 8 | 8 | Gold | 40 | Gold Warden |
| 9 | 9 | White | 20 | White Mirage |
| 10 | 10 | Rainbow | 26 | Rainbow Pulse |

**Early-signup** — `EARLY_SIGNUP_AVATAR_IDS` is now empty. The feature was
retired: id 21 ("Rose Warden") was promoted into the spin pool (slot 7 above),
and ids 29, 25, 33 were dropped from every pool. `EarlySignupClaim.tsx` and the
`claim_early_signup_avatar` RPC still exist but are unused/inert.

## Full catalog (all 54 avatars)

| ID | Name | Rank | Tier (color) | Pool | Image | Notes |
|---:|------|:---:|--------------|------|-------|-------|
| 2 | Amber Circuit | 4 | Orange | — | `/avatars/2.png` |  |
| 3 | Verdant Shade | 1 | Grey | — | `/avatars/3.png` |  |
| 4 | Rose Signal | 6 | Pink | — | `/avatars/4.png` |  |
| 5 | Violet Fang | 3 | Purple | — | `/avatars/5.png` |  |
| 7 | Solar Flame | 8 | Gold | — | `/avatars/7.png` |  |
| 11 | Iron Halo | 1 | Grey | — | `/avatars/11.png` |  |
| 12 | Frost Oracle | 2 | Blue | — | `/avatars/12.png` |  |
| 13 | Red Phantom | 5 | Red | Spin · slot 5 | `/avatars/13.png` |  |
| 14 | Copper Saint | 4 | Orange | — | `/avatars/14.png` |  |
| 15 | Chrome Pulse | 1 | Grey | — | `/avatars/15.png` | name reads white-ish; rank kept at 1 |
| 16 | Pink Circuit | 6 | Pink | — | `/avatars/16.png` |  |
| 17 | Void Runner | 1 | Grey | — | `/avatars/17.png` |  |
| 18 | Neon Lynx | 2 | Blue | — | `/avatars/18.png` |  |
| 19 | Static Crown | 10 | Rainbow | — | `/avatars/19.png` |  |
| 20 | White Mirage | 9 | White | Spin · slot 9 | `/avatars/20.png` |  |
| 21 | Rose Warden | 7 | Rose | Spin · slot 7 | `/avatars/21.png` |  |
| 22 | Night Prism | 10 | Rainbow | — | `/avatars/22.png` |  |
| 23 | Cyan Specter | 2 | Blue | — | `/avatars/23.png` |  |
| 24 | Violet Mask | 3 | Purple | — | `/avatars/24.png` |  |
| 25 | Teal Siren | 2 | Blue | — | `/avatars/25.png` |  |
| 26 | Rainbow Pulse | 10 | Rainbow | Spin · slot 10 | `/avatars/26.png` |  |
| 27 | Black Comet | 1 | Grey | — | `/avatars/27.png` |  |
| 28 | Copper Echo | 4 | Orange | — | `/avatars/28.png` |  |
| 29 | Bronze Herald | 4 | Orange | — | `/avatars/29.png` |  |
| 30 | Quartz Reaper | 9 | White | — | `/avatars/30.png` |  |
| 31 | Glass Monarch | 9 | White | — | `/avatars/31.png` |  |
| 32 | Ivory Glitch | 9 | White | — | `/avatars/32.png` |  |
| 33 | Azure Shade | 2 | Blue | — | `/avatars/33.png` | duplicate of #29 (shown as "Bronze Herald") |
| 34 | Scarlet Node | 5 | Red | — | `/avatars/34.png` |  |
| 36 | Green Relic | 2 | Blue | — | `/avatars/36.png` |  |
| 37 | Purple Hex | 3 | Purple | — | `/avatars/37.png` |  |
| 38 | Ember Core | 4 | Orange | — | `/avatars/38.png` |  |
| 39 | Ruby Signal | 5 | Red | — | `/avatars/39.png` |  |
| 40 | Gold Warden | 8 | Gold | Spin · slot 8 | `/avatars/40.png` | artwork pending replacement with new skull design |
| 41 | Purple Oracle | 3 | Purple | Spin · slot 3 | `/avatars/41.png` |  |
| 42 | Orange Vortex | 4 | Orange | Spin · slot 4 | `/avatars/42.png` |  |
| 43 | Grey Sentinel | 1 | Grey | Spin · slot 1 | `/avatars/43.png` |  |
| 44 | Aqua Phantom | 2 | Blue | — | `/avatars/44.png` |  |
| 45 | Rust Revenant | 5 | Red | — | `/avatars/45.png` | "Rust" reads orange; rank kept at 5 |
| 46 | Lilac Runner | 3 | Purple | — | `/avatars/46.png` |  |
| 47 | Pink Nova | 6 | Pink | Spin · slot 6 | `/avatars/47.png` |  |
| 48 | Teal Ghost | 2 | Blue | — | `/avatars/48.png` |  |
| 49 | Indigo Circuit | 3 | Purple | — | `/avatars/49.png` | "Indigo" reads blue; rank kept at 3 |
| 50 | Violet Pulse | 3 | Purple | — | `/avatars/50.png` |  |
| 51 | Crimson Echo | 5 | Red | — | `/avatars/51.png` |  |
| 52 | Blue Cipher | 2 | Blue | Spin · slot 2 | `/avatars/52.png` |  |
| 53 | Lime Warden | 1 | Grey | — | `/avatars/53.png` |  |
| 54 | Pearl Siren | 9 | White | — | `/avatars/54.png` |  |
| 55 | Blush Monarch | 6 | Pink | — | `/avatars/55.png` |  |
| 56 | Cyan Relic | 2 | Blue | — | `/avatars/56.png` |  |
| 57 | Magenta Shade | 6 | Pink | — | `/avatars/57.png` |  |
| 58 | Lavender Prism | 3 | Purple | — | `/avatars/58.png` |  |
| 59 | Rose Comet | 6 | Pink | — | `/avatars/59.png` |  |

> Ids 1, 6, 8, 9, 10, 35 are intentionally absent (removed / never shipped). The
> "Pool" column is "—" for avatars not currently used in any reward pool; they
> still exist as artwork and can be promoted into a pool later.

## Adding a new avatar

1. **Pick the next free id.** Use the lowest unused number (currently the next
   id is **60**). The filename *is* the id.
2. **Drop the artwork** at `public/avatars/<id>.png`. Match the existing style:
   square, transparent background, the figure centered inside a colored ring.
   The dominant color must match the rank tier you intend (see ladder above).
3. **Name it** in `src/config/avatarNames.ts` → add `  <id>: "Color Noun",`.
   The first word must be the tier color (Grey/Blue/Purple/Orange/Red/Pink/
   Rose/Gold/White/Rainbow or a synonym the rank resolver understands).
4. **Rank it** in `src/lib/avatarRank.ts` → add `  <id>: <rank>,` to
   `NUMBERED_AVATAR_RANKS`. Rank must match the name color and the artwork.
5. **(Optional) Add it to a pool** in `src/config/avatarConfig.ts`:
   - Spin wheel: insert the id into `FREE_SPIN_AVATAR_IDS` **at the position for
     its rank** (the array is ordered rank 1 → rank 10). The wheel shows exactly
     these ids, in this order, and weights odds by rank.
   - Early-signup: add to `EARLY_SIGNUP_AVATAR_IDS`. It must **not** also be in
     the spin pool (a dev-time check logs an error on overlap).
   - **Server requirement:** the pool id `spin-<id>` / `signup-<id>` must exist
     in the `avatar_catalog` table (`is_active = true`), or claims will be
     rejected. Add a Supabase migration inserting the catalog row before relying
     on it in production. Avatars left out of both pools need no catalog row.
6. **Re-using existing artwork?** Map the new id to the canonical one in
   `DUPLICATE_AVATAR_IMAGE_IDS` (`<newId>: <canonicalId>`) so it shows the
   canonical name/rank.
7. **Update this file**: add the row to the full catalog table and, if pooled,
   to the pool table above.

### Where it shows up

A pooled avatar automatically appears in:
- the **spin wheel** and its result banner (`src/components/landing/WheelReward.tsx`),
- the landing **"Unlockable Avatars"** grid (`src/components/landing/AvatarShowcaseSection.tsx`),
- onboarding pickers and the shop/inventory, which sort by rank via `getAvatarRank`.

No component lists avatars by hand — they all read the four source files above,
so the four edits in steps 2–5 are all that's needed.
