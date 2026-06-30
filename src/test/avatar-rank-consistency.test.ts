import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  DEFAULT_AVATAR_CATALOG,
  CANONICAL_OVERRIDES_BY_ID,
  CANONICAL_OVERRIDE_MIGRATIONS_BY_ID,
} from "@/lib/avatarCatalog";
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
const MIGRATIONS_DIR = path.resolve(process.cwd(), "supabase/migrations");

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

  it("every slug entry matches the rank its catalog item actually resolves to", () => {
    // getAvatarRank tries rank_tier / frame_color / NUMBERED_AVATAR_RANKS before
    // the slug lookup, so a slug entry on an item that resolves earlier is dead
    // and can silently contradict the displayed rank. Catch that here.
    const byId = new Map(DEFAULT_AVATAR_CATALOG.map((item) => [item.id, item]));
    const offenders: string[] = [];
    for (const [id, slugRank] of Object.entries(SLUG_AVATAR_RANKS)) {
      const item = byId.get(id);
      if (!item) continue; // DB-only avatars (blu-fifer, viozen) aren't in the static catalog
      const resolved = getAvatarRank(item);
      if (resolved !== slugRank) offenders.push(`${id}: slug=${slugRank} but getAvatarRank=${resolved}`);
    }
    expect(offenders, `slug rank is overridden by a higher-priority source — remove the dead entry or fix the authoritative one: ${offenders.join("; ")}`).toEqual([]);
  });

  it("documents every temporary canonical override with a matching DB migration", () => {
    const catalogIds = new Set(DEFAULT_AVATAR_CATALOG.map((item) => item.id));
    const offenders: string[] = [];

    for (const [id, override] of Object.entries(CANONICAL_OVERRIDES_BY_ID)) {
      if (typeof override.rank_tier !== "number" || !LABELED_TIERS.has(override.rank_tier)) {
        offenders.push(`${id}: override rank ${override.rank_tier ?? "missing"} is not labeled`);
      }

      if (SLUG_AVATAR_RANKS[id] !== undefined && override.rank_tier !== SLUG_AVATAR_RANKS[id]) {
        offenders.push(`${id}: override rank ${override.rank_tier} does not match SLUG_AVATAR_RANKS ${SLUG_AVATAR_RANKS[id]}`);
      }

      const migrationFile = CANONICAL_OVERRIDE_MIGRATIONS_BY_ID[id];
      if (!migrationFile) {
        offenders.push(`${id}: missing CANONICAL_OVERRIDE_MIGRATIONS_BY_ID entry`);
        continue;
      }

      const migrationPath = path.join(MIGRATIONS_DIR, migrationFile);
      if (!existsSync(migrationPath)) {
        offenders.push(`${id}: documented migration does not exist (${migrationFile})`);
        continue;
      }

      const migrationSql = readFileSync(migrationPath, "utf8");
      if (!catalogIds.has(id) && !migrationSql.includes(id)) {
        offenders.push(`${id}: not in DEFAULT_AVATAR_CATALOG and not present in ${migrationFile}`);
      }
      if (!migrationSql.includes(id)) {
        offenders.push(`${id}: documented migration ${migrationFile} does not mention the override id`);
      }
    }

    expect(offenders, `canonical override drift: ${offenders.join("; ")}`).toEqual([]);
  });
});
