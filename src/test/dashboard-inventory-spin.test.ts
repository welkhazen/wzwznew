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
});
