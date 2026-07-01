import { describe, expect, it } from "vitest";
import type { AvatarCatalogItem } from "@/lib/avatarCatalog";
import { avatarImageKey, isCatalogAvatarOwned, ownedAvatarImageKeys } from "@/lib/avatarOwnership";

describe("avatar ownership helpers", () => {
  it("checks ownership by current catalog position instead of stale avatar level", () => {
    const ownedAvatarLevels = new Set([2]);

    expect(isCatalogAvatarOwned(0, ownedAvatarLevels)).toBe(false);
    expect(isCatalogAvatarOwned(1, ownedAvatarLevels)).toBe(true);
  });

  it("marks owned image keys by current catalog position", () => {
    const catalog = [
      {
        id: "silver-ghost",
        level: 1,
        name: "Silver Ghost",
        price: "25",
        imageSrc: "/avatars/43.png",
      },
      {
        id: "grey-sentinel",
        level: 1,
        name: "Grey Sentinel",
        price: "25",
        imageSrc: "/avatars/11.png",
      },
    ] as AvatarCatalogItem[];

    expect(ownedAvatarImageKeys(catalog, new Set([2]))).toEqual(new Set([avatarImageKey(catalog[1])]));
  });
});
