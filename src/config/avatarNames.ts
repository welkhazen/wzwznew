export const NUMBERED_AVATAR_NAMES: Record<number, string> = {
  1: "Silver Ghost",
  2: "Amber Circuit",
  3: "Verdant Shade",
  4: "Rose Signal",
  5: "Violet Fang",
  6: "Crimson Muse",
  7: "Solar Flame",
  8: "Obsidian Drift",
  9: "Neon Husk",
  10: "Blue Signal",
  11: "Iron Halo",
  12: "Frost Oracle",
  13: "Red Phantom",
  // 41/42/52: names corrected to match the actual artwork colors (see avatarRank.ts).
  14: "Copper Saint",
  15: "Chrome Pulse",
  16: "Pink Circuit",
  17: "Void Runner",
  18: "Neon Lynx",
  19: "Static Crown",
  20: "White Mirage",
  21: "Rose Warden",
  22: "Night Prism",
  23: "Cyan Specter",
  24: "Violet Mask",
  25: "Teal Siren",
  26: "Rainbow Pulse",
  27: "Black Comet",
  28: "Copper Echo",
  29: "Bronze Herald",
  30: "Quartz Reaper",
  31: "Glass Monarch",
  32: "Ivory Glitch",
  33: "Azure Shade",
  34: "Scarlet Node",
  36: "Green Relic",
  37: "Purple Hex",
  38: "Ember Core",
  39: "Ruby Signal",
  40: "Gold Warden",
  41: "Purple Oracle",
  42: "Orange Vortex",
  43: "Grey Sentinel",
  44: "Aqua Phantom",
  46: "Lilac Runner",
  47: "Pink Nova",
  48: "Teal Ghost",
  49: "Indigo Circuit",
  51: "Crimson Echo",
  52: "Blue Cipher",
  53: "Lime Warden",
  54: "Pearl Siren",
  55: "Blush Monarch",
  56: "Cyan Relic",
  57: "Magenta Shade",
  58: "Lavender Prism",
};

export function avatarDisplayName(imageId: number): string {
  const canonicalId = canonicalAvatarImageId(imageId);
  return NUMBERED_AVATAR_NAMES[canonicalId] ?? `Avatar ${canonicalId}`;
}

export function avatarIdFromImageSrc(imageSrc: string | undefined): number | null {
  const match = imageSrc?.match(/\/avatars\/(\d+)\.(?:png|webp|svg)$/);
  if (!match) return null;
  return Number(match[1]);
}

const DUPLICATE_AVATAR_IMAGE_IDS: Record<number, number> = {
  33: 29,
};

export function canonicalAvatarImageId(imageId: number): number {
  return DUPLICATE_AVATAR_IMAGE_IDS[imageId] ?? imageId;
}
