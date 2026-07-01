import { describe, expect, it } from "vitest";
import type { AvatarCatalogItem } from "@/lib/avatarCatalog";
import { getEligibleSpinAvatars, resolveAvatarCatalogLevel } from "@/lib/avatarSpin";

describe("rank spin avatar pool", () => {
  it("only includes avatars from the spun rank", () => {
    const catalog: AvatarCatalogItem[] = [
      {
        id: "grey-test",
        level: 1,
        name: "Grey Test",
        price: "25",
        imageSrc: "/avatars/1.webp",
        bg: "#111827",
        figure: "#cbd5e1",
        ring: "#cbd5e1",
        glow: "#cbd5e180",
        rarity: "common",
        rank_tier: 1,
      },
      {
        id: "blu-fifer",
        level: 2,
        name: "Red Fifer",
        price: "600",
        imageSrc: "/avatars/landing/blu-fifer.webp",
        bg: "#2a0b0b",
        figure: "#ef4444",
        ring: "#ef4444",
        glow: "#ef444480",
        rarity: "common",
        rank_tier: 6,
      },
    ];

    expect(getEligibleSpinAvatars(catalog, 1, new Set()).map((avatar) => avatar.id)).toEqual(["grey-test"]);
  });

  it("resolves claimed avatars by current catalog position", () => {
    const catalog = [
      { id: "first", level: 99 },
      { id: "won-avatar", level: 1 },
    ] as AvatarCatalogItem[];

    expect(resolveAvatarCatalogLevel(catalog, "won-avatar")).toBe(2);
  });

  it("checks ownership by current catalog position, not stale avatar level", () => {
    const catalog: AvatarCatalogItem[] = [
      {
        id: "owned-base",
        level: 1,
        name: "Owned Base",
        price: "0",
        imageSrc: "/avatars/avatar-1.svg",
        bg: "#111827",
        figure: "#cbd5e1",
        ring: "#cbd5e1",
        glow: "#cbd5e180",
      },
      {
        id: "r3-with-stale-level",
        level: 1,
        name: "Green Relic",
        price: "100",
        imageSrc: "/avatars/53.png",
        bg: "#111827",
        figure: "#22c55e",
        ring: "#22c55e",
        glow: "#22c55e80",
        rank_tier: 3,
      },
    ];

    expect(getEligibleSpinAvatars(catalog, 3, new Set([1])).map((avatar) => avatar.id)).toEqual(["r3-with-stale-level"]);
  });

  it("keeps every wheel rank available when avatar levels are stale", () => {
    const catalog: AvatarCatalogItem[] = [
      {
        id: "owned-base",
        level: 1,
        name: "Owned Base",
        price: "0",
        imageSrc: "/avatars/avatar-1.svg",
        bg: "#111827",
        figure: "#cbd5e1",
        ring: "#cbd5e1",
        glow: "#cbd5e180",
      },
      ...Array.from({ length: 11 }, (_, index) => {
        const rank = index + 1;
        return {
          id: `rank-${rank}-stale-level`,
          level: 1,
          name: `Rank ${rank} Test`,
          price: "100",
          imageSrc: `/avatars/rank-${rank}.png`,
          bg: "#111827",
          figure: "#cbd5e1",
          ring: "#cbd5e1",
          glow: "#cbd5e180",
          rank_tier: rank,
        };
      }),
    ] as AvatarCatalogItem[];

    for (let rank = 1; rank <= 11; rank += 1) {
      expect(getEligibleSpinAvatars(catalog, rank, new Set([1])).map((avatar) => avatar.id)).toEqual([
        `rank-${rank}-stale-level`,
      ]);
    }
  });
});
