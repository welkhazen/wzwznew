import { describe, it, expect } from "vitest";
import { DEFAULT_AVATAR_CATALOG, CANONICAL_OVERRIDES_BY_ID } from "@/lib/avatarCatalog";
import {
  AVATAR_RANK_MAP,
  AVATAR_RANK_LABELS,
  NUMBERED_AVATAR_RANKS,
  SLUG_AVATAR_RANKS,
  getAvatarRank,
} from "@/lib/avatarRank";

// One guard for the whole rank system. Every "fix avatar rank / remove
// duplicate / rename to Rn" commit was a drift between the rank maps and the
// catalog that no test caught. These four invariants catch the next one.
// ponytail: asserts data consistency only — no runtime logic is exercised.

const LABELED_TIERS = new Set(Object.keys(AVATAR_RANK_LABELS).map(Number));

describe("avatar rank data stays in lockstep with the catalog", () => {
  it("every rank value in every map is a labeled tier", () => {
    const offenders: string[] = [];
    const check = (name: string, map: Record<string | number, number>) => {
      for (const [key, rank] of Object.entries(map)) {
        if (!LABELED_TIERS.has(rank)) offenders.push(`${name}[${key}] = ${rank}`);
      }
    };
    check("AVATAR_RANK_MAP", AVATAR_RANK_MAP);
    check("NUMBERED_AVATAR_RANKS", NUMBERED_AVATAR_RANKS);
    check("SLUG_AVATAR_RANKS", SLUG_AVATAR_RANKS);
    expect(offenders, `unlabeled ranks (add to AVATAR_RANK_LABELS or fix): ${offenders.join(", ")}`).toEqual([]);
  });

  it("every catalog avatar resolves to a labeled rank", () => {
    const offenders = DEFAULT_AVATAR_CATALOG
      .filter((item) => !LABELED_TIERS.has(getAvatarRank(item)))
      .map((item) => `${item.id} -> ${getAvatarRank(item)}`);
    expect(offenders, `catalog items resolving to an unlabeled rank: ${offenders.join(", ")}`).toEqual([]);
  });

  it("has no duplicate catalog ids", () => {
    const ids = DEFAULT_AVATAR_CATALOG.map((item) => item.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes, `duplicate catalog ids: ${[...new Set(dupes)].join(", ")}`).toEqual([]);
  });

  it("the authoritative rank sources agree for every shared id", () => {
    const offenders: string[] = [];
    const catalogRankById = new Map(
      DEFAULT_AVATAR_CATALOG.filter((i) => typeof i.rank_tier === "number").map((i) => [i.id, i.rank_tier!]),
    );
    const ids = new Set([
      ...Object.keys(SLUG_AVATAR_RANKS),
      ...Object.keys(CANONICAL_OVERRIDES_BY_ID),
      ...catalogRankById.keys(),
    ]);
    for (const id of ids) {
      const sources: Record<string, number> = {};
      if (SLUG_AVATAR_RANKS[id] !== undefined) sources.slug = SLUG_AVATAR_RANKS[id];
      const overrideRank = CANONICAL_OVERRIDES_BY_ID[id]?.rank_tier;
      if (typeof overrideRank === "number") sources.override = overrideRank;
      if (catalogRankById.has(id)) sources.catalog = catalogRankById.get(id)!;
      const distinct = new Set(Object.values(sources));
      if (distinct.size > 1) offenders.push(`${id}: ${JSON.stringify(sources)}`);
    }
    expect(offenders, `rank sources disagree (sync slug table, canonical override, and catalog rank_tier): ${offenders.join("; ")}`).toEqual([]);
  });
});
