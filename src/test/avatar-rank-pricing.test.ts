import { describe, expect, it } from "vitest";
import { DEFAULT_AVATAR_CATALOG } from "@/lib/avatarCatalog";
import { RANK_TIER_PRICING } from "@/lib/avatarRarity";
import { getAvatarRank, SLUG_AVATAR_RANKS } from "@/lib/avatarRank";

describe("avatar rank pricing", () => {
  it("matches the published token ladder", () => {
    expect(Object.fromEntries(
      Object.entries(RANK_TIER_PRICING).map(([rank, config]) => [rank, config.price]),
    )).toEqual({
      "1": 25,
      "2": 75,
      "3": 100,
      "4": 150,
      "5": 300,
      "6": 600,
      "7": 1200,
      "8": 2500,
      "9": 5000,
      "10": 10000,
      "11": 25000,
      "12": 50000,
    });
  });

  it("prices known R2 shop avatars at 75 tokens", () => {
    const names = ["Neon Lynx", "Teal Siren", "Aqua Phantom", "Teal Ghost", "Blue Cipher", "Cyan Relic"];
    const offenders = names
      .map((name) => {
        const avatar = DEFAULT_AVATAR_CATALOG.find((item) => item.name === name);
        if (!avatar) return `${name}: missing from catalog`;

        const rank = getAvatarRank(avatar);
        const price = RANK_TIER_PRICING[rank]?.price;
        return rank === 2 && price === 75 ? null : `${name}: R${rank}, ${price ?? "missing"} tokens`;
      })
      .filter((message): message is string => message !== null);

    expect(offenders, `R2 shop avatar price drift: ${offenders.join("; ")}`).toEqual([]);
  });

  it("prices known R3 shop avatars at 100 tokens", () => {
    const names = ["Quartz Reaper", "Green Relic", "Lime Warden", "Night Prism"];
    const offenders = names
      .map((name) => {
        const avatar = DEFAULT_AVATAR_CATALOG.find((item) => item.name === name);
        if (!avatar) return `${name}: missing from catalog`;

        const rank = getAvatarRank(avatar);
        const price = RANK_TIER_PRICING[rank]?.price;
        return rank === 3 && price === 100 ? null : `${name}: R${rank}, ${price ?? "missing"} tokens`;
      })
      .filter((message): message is string => message !== null);

    expect(offenders, `R3 shop avatar price drift: ${offenders.join("; ")}`).toEqual([]);
  });

  it("prices known R4 shop avatars at 150 tokens", () => {
    const names = ["Crimson Muse", "Void Runner", "Orange Vortex"];
    const offenders = names
      .map((name) => {
        const avatar = DEFAULT_AVATAR_CATALOG.find((item) => item.name === name);
        if (!avatar) return `${name}: missing from catalog`;

        const rank = getAvatarRank(avatar);
        const price = RANK_TIER_PRICING[rank]?.price;
        return rank === 4 && price === 150 ? null : `${name}: R${rank}, ${price ?? "missing"} tokens`;
      })
      .filter((message): message is string => message !== null);

    expect(offenders, `R4 shop avatar price drift: ${offenders.join("; ")}`).toEqual([]);
  });

  it("prices known R5 shop avatars at 300 tokens", () => {
    const names = [
      "Violet Mask",
      "Violet Fang",
      "Ivory Glitch",
      "Purple Hex",
      "Purple Oracle",
      "Lilac Runner",
      "Indigo Circuit",
      "Magenta Shade",
      "Lavender Prism",
    ];
    const offenders = names
      .map((name) => {
        const avatar = DEFAULT_AVATAR_CATALOG.find((item) => item.name === name);
        if (!avatar) return `${name}: missing from catalog`;

        const rank = getAvatarRank(avatar);
        const price = RANK_TIER_PRICING[rank]?.price;
        return rank === 5 && price === 300 ? null : `${name}: R${rank}, ${price ?? "missing"} tokens`;
      })
      .filter((message): message is string => message !== null);

    expect(offenders, `R5 shop avatar price drift: ${offenders.join("; ")}`).toEqual([]);
  });

  it("prices known R6 shop avatars at 600 tokens", () => {
    const names = ["Black Comet", "Ruby Signal"];
    const offenders = names
      .map((name) => {
        const avatar = DEFAULT_AVATAR_CATALOG.find((item) => item.name === name);
        if (!avatar) return `${name}: missing from catalog`;

        const rank = getAvatarRank(avatar);
        const price = RANK_TIER_PRICING[rank]?.price;
        return rank === 6 && price === 600 ? null : `${name}: R${rank}, ${price ?? "missing"} tokens`;
      })
      .filter((message): message is string => message !== null);

    const redFiferRank = SLUG_AVATAR_RANKS["blu-fifer"];
    const redFiferPrice = redFiferRank ? RANK_TIER_PRICING[redFiferRank]?.price : undefined;
    if (redFiferRank !== 6 || redFiferPrice !== 600) {
      offenders.push(`Red Fifer: R${redFiferRank ?? "missing"}, ${redFiferPrice ?? "missing"} tokens`);
    }

    expect(offenders, `R6 shop avatar price drift: ${offenders.join("; ")}`).toEqual([]);
  });

  it("prices known R7 shop avatars at 1200 tokens", () => {
    const names = ["Pink Circuit", "Pink Nova", "Crimson Echo"];
    const offenders = names
      .map((name) => {
        const avatar = DEFAULT_AVATAR_CATALOG.find((item) => item.name === name);
        if (!avatar) return `${name}: missing from catalog`;

        const rank = getAvatarRank(avatar);
        const price = RANK_TIER_PRICING[rank]?.price;
        return rank === 7 && price === 1200 ? null : `${name}: R${rank}, ${price ?? "missing"} tokens`;
      })
      .filter((message): message is string => message !== null);

    expect(offenders, `R7 shop avatar price drift: ${offenders.join("; ")}`).toEqual([]);
  });

  it("prices known R8 shop avatars at 2500 tokens", () => {
    const names = ["Rose Warden", "Bronze Herald", "Gold Warden", "Pearl Siren", "Blush Monarch"];
    const offenders = names
      .map((name) => {
        const avatar = DEFAULT_AVATAR_CATALOG.find((item) => item.name === name);
        if (!avatar) return `${name}: missing from catalog`;

        const rank = getAvatarRank(avatar);
        const price = RANK_TIER_PRICING[rank]?.price;
        return rank === 8 && price === 2500 ? null : `${name}: R${rank}, ${price ?? "missing"} tokens`;
      })
      .filter((message): message is string => message !== null);

    expect(offenders, `R8 shop avatar price drift: ${offenders.join("; ")}`).toEqual([]);
  });

  it("prices known R9 shop avatars at 5000 tokens", () => {
    const names = ["Gold Specter", "Glass Monarch", "Ember Core"];
    const offenders = names
      .map((name) => {
        const avatar = DEFAULT_AVATAR_CATALOG.find((item) => item.name === name);
        if (!avatar) return `${name}: missing from catalog`;

        const rank = getAvatarRank(avatar);
        const price = RANK_TIER_PRICING[rank]?.price;
        return rank === 9 && price === 5000 ? null : `${name}: R${rank}, ${price ?? "missing"} tokens`;
      })
      .filter((message): message is string => message !== null);

    expect(offenders, `R9 shop avatar price drift: ${offenders.join("; ")}`).toEqual([]);
  });
});
