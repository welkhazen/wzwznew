import { describe, expect, it } from "vitest";
import { RANK_TIER_PRICING } from "@/lib/avatarRarity";

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
});
