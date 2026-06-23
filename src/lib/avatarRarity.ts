export type AvatarRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic"
  | "exotic"
  | "gold"
  | "platinum"
  | "white"
  | "rainbow";

export interface RarityConfig {
  label: string;
  rank: number;
  color: string;
  glow: string;
  defaultWeight: number;
}

/** Token price and owner cap per rank tier. Higher rank = higher price = fewer owners. */
export const RANK_TIER_PRICING: Record<number, { price: number; maxOwners: number | null }> = {
  1:  { price: 25,     maxOwners: null  }, // Grey     — unlimited
  2:  { price: 75,     maxOwners: 10000 }, // Blue
  3:  { price: 150,    maxOwners: 5000  }, // Purple
  4:  { price: 300,    maxOwners: 2000  }, // Orange
  5:  { price: 600,    maxOwners: 800   }, // Red
  6:  { price: 1200,   maxOwners: 300   }, // Pink
  7:  { price: 2500,   maxOwners: 100   }, // Rose
  8:  { price: 5000,   maxOwners: 40    }, // Gold
  9:  { price: 10000,  maxOwners: 15    }, // White
  10: { price: 25000,  maxOwners: 5     }, // Rainbow
};

export const RARITY_CONFIG: Record<AvatarRarity, RarityConfig> = {
  common:    { label: "Common",    rank: 1,  color: "#9ca3af", glow: "#9ca3af60", defaultWeight: 1000 },
  uncommon:  { label: "Uncommon",  rank: 2,  color: "#f97316", glow: "#f9731660", defaultWeight: 400  },
  rare:      { label: "Rare",      rank: 3,  color: "#3b82f6", glow: "#3b82f660", defaultWeight: 160  },
  epic:      { label: "Epic",      rank: 4,  color: "#a855f7", glow: "#a855f760", defaultWeight: 64   },
  legendary: { label: "Legendary", rank: 5,  color: "#ef4444", glow: "#ef444460", defaultWeight: 25   },
  mythic:    { label: "Mythic",    rank: 6,  color: "#ec4899", glow: "#ec489960", defaultWeight: 10   },
  exotic:    { label: "Exotic",    rank: 7,  color: "#facc15", glow: "#facc1560", defaultWeight: 4    },
  gold:      { label: "Gold",      rank: 8,  color: "#e2e8f0", glow: "#e2e8f060", defaultWeight: 2    },
  platinum:  { label: "Platinum",  rank: 9,  color: "#f8fafc", glow: "#f8fafc60", defaultWeight: 1    },
  white:     { label: "White",     rank: 9,  color: "#f8fafc", glow: "#f8fafc60", defaultWeight: 1    },
  rainbow:   { label: "Rainbow",   rank: 10, color: "#ff6b6b", glow: "#ff6b6b60", defaultWeight: 1    },
};

export const RARITY_ORDER: AvatarRarity[] = [
  "common", "uncommon", "rare", "epic", "legendary", "mythic", "exotic", "gold", "platinum",
];

// Rank 1–10 with colors: grey/orange/blue/purple/red/pink/gold/platinum/white/rainbow
export const RANK_TIERS = [
  { rank: 1,  label: "Rank 1",  rarity: "common"    as AvatarRarity, color: "#9ca3af", glow: "#9ca3af40", weight: 1000 },
  { rank: 2,  label: "Rank 2",  rarity: "uncommon"  as AvatarRarity, color: "#f97316", glow: "#f9731640", weight: 400  },
  { rank: 3,  label: "Rank 3",  rarity: "rare"      as AvatarRarity, color: "#3b82f6", glow: "#3b82f640", weight: 160  },
  { rank: 4,  label: "Rank 4",  rarity: "epic"      as AvatarRarity, color: "#a855f7", glow: "#a855f740", weight: 64   },
  { rank: 5,  label: "Rank 5",  rarity: "legendary" as AvatarRarity, color: "#ef4444", glow: "#ef444440", weight: 25   },
  { rank: 6,  label: "Rank 6",  rarity: "mythic"    as AvatarRarity, color: "#ec4899", glow: "#ec489940", weight: 10   },
  { rank: 7,  label: "Rank 7",  rarity: "exotic"    as AvatarRarity, color: "#facc15", glow: "#facc1540", weight: 4    },
  { rank: 8,  label: "Rank 8",  rarity: "gold"      as AvatarRarity, color: "#e2e8f0", glow: "#e2e8f040", weight: 2    },
  { rank: 9,  label: "Rank 9",  rarity: "platinum"  as AvatarRarity, color: "#f8fafc", glow: "#f8fafc40", weight: 1    },
  { rank: 10, label: "Rank 10", rarity: "rainbow"   as AvatarRarity, color: "#a78bfa", glow: "#a78bfa40", weight: 1    },
] as const;
