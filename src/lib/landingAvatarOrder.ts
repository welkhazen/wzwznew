import { SPIN_POOL, EARLY_SIGNUP_POOL } from "@/backend/supabase/controllers/avatarRewardsController";
import { avatarDisplayName } from "@/config/avatarNames";
import type { AvatarCatalogItem } from "@/lib/avatarCatalog";

export const LANDING_CHOOSER_AVATARS: readonly AvatarCatalogItem[] = [
  { id: "ember", level: 2, name: "Ember", price: "0", imageSrc: "/avatars/avatar-3.svg", bg: "#1f0a05", figure: "#ff8a1f", ring: "#ff8a1f", glow: "#ff8a1f80", isActive: true, rarity: "common" },
  { id: "verdant", level: 3, name: "Verdant", price: "0", imageSrc: "/avatars/avatar-1.svg", bg: "#08160b", figure: "#22c55e", ring: "#22c55e", glow: "#22c55e80", isActive: true, rarity: "common" },
  { id: "horned", level: 5, name: "Horned", price: "0", imageSrc: "/avatars/avatar-5.svg", bg: "#1f0808", figure: "#ff2d3d", ring: "#ff2d3d", glow: "#ff2d3d80", isActive: true, rarity: "common" },
  { id: "pharaoh", level: 6, name: "Pharaoh", price: "0", imageSrc: "/avatars/avatar-6.svg", bg: "#1f1605", figure: "#f2d21a", ring: "#f2d21a", glow: "#f2d21a80", isActive: true, rarity: "common" },
  { id: "violet", level: 7, name: "Violet", price: "0", imageSrc: "/avatars/avatar-2.svg", bg: "#150a22", figure: "#b84dff", ring: "#b84dff", glow: "#b84dff80", isActive: true, rarity: "common" },
  { id: "rose", level: 8, name: "Rose", price: "0", imageSrc: "/avatars/avatar-4.svg", bg: "#1f0a14", figure: "#f43f5e", ring: "#f43f5e", glow: "#f43f5e80", isActive: true, rarity: "common" },
  { id: "black", level: 9, name: "Black", price: "0", imageSrc: "/avatars/avatar-7.svg", bg: "#0a0a0a", figure: "#cfd3da", ring: "#cfd3da", glow: "#cfd3da80", isActive: true, rarity: "common" },
  { id: "blue", level: 10, name: "Blue", price: "0", imageSrc: "/avatars/avatar-10.svg", bg: "#0a1424", figure: "#3b82f6", ring: "#3b82f6", glow: "#3b82f680", isActive: true, rarity: "common" },
];

export const LANDING_REVEAL_AVATARS: readonly AvatarCatalogItem[] = [
  ...SPIN_POOL.map((entry, i): AvatarCatalogItem => ({
    id: `reveal-spin-${i + 1}`,
    level: 11 + i,
    name: avatarDisplayName(entry.imageId),
    price: "0",
    imageSrc: entry.imageSrc,
    bg: "#111827", figure: "#cbd5e1", ring: "#cbd5e1", glow: "#cbd5e180",
    isActive: true, rarity: "common",
  })),
  ...EARLY_SIGNUP_POOL.map((entry, i): AvatarCatalogItem => ({
    id: `reveal-signup-${i + 1}`,
    level: 11 + SPIN_POOL.length + i,
    name: avatarDisplayName(entry.imageId),
    price: "0",
    imageSrc: entry.imageSrc,
    bg: "#111827", figure: "#cbd5e1", ring: "#cbd5e1", glow: "#cbd5e180",
    isActive: true, rarity: "common",
  })),
];

export const LANDING_AVATARS: readonly AvatarCatalogItem[] = [...LANDING_CHOOSER_AVATARS, ...LANDING_REVEAL_AVATARS];

export const LANDING_UNLOCKABLE_FEATURE_ORDER = [
  "Grey Sentinel",
  "Blue Cipher",
  "Green Relic",
  "Orange Vortex",
  "Purple Oracle",
  "Red Phantom",
  "Pink Nova",
  "Pearl Siren",
] as const;

const HIDDEN_UNLOCKABLE_NAMES = new Set(["Bronze Herald"]);

export function getLandingUnlockableAvatars(): AvatarCatalogItem[] {
  const featuredUnlockableNames = new Set<string>(LANDING_UNLOCKABLE_FEATURE_ORDER);
  return [
    ...LANDING_UNLOCKABLE_FEATURE_ORDER
      .map((name) => LANDING_REVEAL_AVATARS.find((avatar) => avatar.name === name))
      .filter((avatar): avatar is AvatarCatalogItem => Boolean(avatar)),
    ...LANDING_REVEAL_AVATARS.filter(
      (avatar) => !featuredUnlockableNames.has(avatar.name) && !HIDDEN_UNLOCKABLE_NAMES.has(avatar.name),
    ),
  ];
}
