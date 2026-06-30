import { supabase } from "@/lib/supabase";
import type { AvatarRarity } from "@/lib/avatarRarity";
import { GENERATED_AVATAR_ENTRIES } from "@/lib/generatedAvatarEntries";
import { avatarDisplayName, avatarIdFromImageSrc } from "@/config/avatarNames";

export type AvatarCatalogItem = {
  id: string;
  level: number;
  name: string;
  price: string;
  imageSrc?: string;
  bg: string;
  figure: string;
  ring: string;
  glow: string;
  isActive?: boolean;
  isNew?: boolean;
  showIn?: "landing" | "app" | "both";
  rarity?: AvatarRarity;
  dropWeight?: number;
  /** Optional explicit frame color tier, e.g. "grey" / "platinum" / "rainbow". */
  frame_color?: string;
  /** Optional explicit rank tier (1..10). Overrides frame_color when set. */
  rank_tier?: number;
};

const CATALOG_STORAGE_KEY = "raw.avatar.catalog.v2";
const FULL_CATALOG_STORAGE_KEY = "raw.avatar.catalog.full.v2";
const INVENTORY_STORAGE_PREFIX = "raw.avatar.inventory.v1.";
const SELECTED_STORAGE_PREFIX = "raw.avatar.selected.v1.";
const DAILY_SPIN_AVATAR_CLAIM_PREFIX = "raw.daily-spin.avatar-claim.v1.";
export const LANDING_WHEEL_SPIN_KEY = "raw.landing-wheel.spin.v1";
let avatarBackendMissingTables = false;
let avatarCatalogLocalWriteFailed = false;
let _catalogCache: AvatarCatalogItem[] | null = null;

function withNumberedAvatarName(item: AvatarCatalogItem): AvatarCatalogItem {
  const imageId = avatarIdFromImageSrc(item.imageSrc);
  if (imageId === null) return item;
  return { ...item, name: avatarDisplayName(imageId) };
}

export function consumeAvatarCatalogLocalWriteFailure(): boolean {
  const failed = avatarCatalogLocalWriteFailed;
  avatarCatalogLocalWriteFailed = false;
  return failed;
}

function isMissingAvatarTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { code?: string; message?: string; details?: string; hint?: string };
  // PGRST204 = column not found in schema cache — not a missing table, don't block future fetches
  if (maybe.code === "PGRST204") return false;
  if (maybe.code === "PGRST205" || maybe.code === "42P01") return true;
  const haystack = `${maybe.message ?? ""} ${maybe.details ?? ""} ${maybe.hint ?? ""}`.toLowerCase();
  return haystack.includes("could not find the table") ||
    (haystack.includes("does not exist") && !haystack.includes("column"));
}

function markBackendMissingIfNeeded(error: unknown): void {
  if (isMissingAvatarTableError(error)) {
    avatarBackendMissingTables = true;
  }
}

export const DEFAULT_AVATAR_CATALOG: readonly AvatarCatalogItem[] = [
  { id: "ember", level: 1, name: "Ember", price: "50", imageSrc: "/avatars/avatar-3.svg", bg: "#1f0a05", figure: "#cbd5e1", ring: "#cbd5e1", glow: "#cbd5e180", isActive: true, showIn: "both", rarity: "common", frame_color: "grey" },
  { id: "verdant", level: 2, name: "Verdant", price: "50", imageSrc: "/avatars/avatar-1.svg", bg: "#08160b", figure: "#3b82f6", ring: "#3b82f6", glow: "#3b82f680", isActive: true, showIn: "both", rarity: "common", frame_color: "blue" },
  { id: "horned", level: 3, name: "Horned", price: "50", imageSrc: "/avatars/avatar-5.svg", bg: "#1f0808", figure: "#d946ef", ring: "#d946ef", glow: "#d946ef80", isActive: true, showIn: "both", rarity: "common", frame_color: "purple" },
  { id: "pharaoh", level: 4, name: "Pharaoh", price: "50", imageSrc: "/avatars/avatar-6.svg", bg: "#1f1605", figure: "#fb923c", ring: "#fb923c", glow: "#fb923c80", isActive: true, showIn: "both", rarity: "common", frame_color: "orange" },
  { id: "violet", level: 5, name: "Violet", price: "50", imageSrc: "/avatars/avatar-2.svg", bg: "#150a22", figure: "#ef4444", ring: "#ef4444", glow: "#ef444480", isActive: true, showIn: "both", rarity: "common", frame_color: "red" },
  { id: "rose", level: 6, name: "Rose", price: "50", imageSrc: "/avatars/avatar-4.svg", bg: "#1f0a14", figure: "#fb7185", ring: "#fb7185", glow: "#fb718580", isActive: true, showIn: "both", rarity: "common", frame_color: "pink" },
  { id: "black", level: 7, name: "Black", price: "50", imageSrc: "/avatars/avatar-7.svg", bg: "#0a0a0a", figure: "#fbbf24", ring: "#fbbf24", glow: "#fbbf2490", isActive: true, showIn: "both", rarity: "common", frame_color: "rose" },
  { id: "blue", level: 8, name: "Blue", price: "50", imageSrc: "/avatars/avatar-10.svg", bg: "#0a1424", figure: "#fbbf24", ring: "#fbbf24", glow: "#fbbf2490", isActive: true, showIn: "both", rarity: "common", frame_color: "gold" },
  { id: "silver-void", level: 9, name: avatarDisplayName(1), price: "50", imageSrc: "/avatars/1.webp", bg: "#111827", figure: "#cbd5e1", ring: "#cbd5e1", glow: "#cbd5e180", isActive: true, showIn: "both", rarity: "common" },
  { id: "neon-lynx", level: 10, name: avatarDisplayName(18), price: "50", imageSrc: "/avatars/18.png", bg: "#170f2e", figure: "#a855f7", ring: "#c084fc", glow: "#a855f780", isActive: true, showIn: "both", rarity: "common" },
  { id: "blue-signal", level: 11, name: avatarDisplayName(23), price: "50", imageSrc: "/avatars/23.png", bg: "#16100a", figure: "#facc15", ring: "#facc15", glow: "#facc1590", isActive: true, showIn: "both", rarity: "common", frame_color: "gold", rank_tier: 9 },
  { id: "violet-mask", level: 12, name: avatarDisplayName(24), price: "50", imageSrc: "/avatars/24.png", bg: "#1a1028", figure: "#d946ef", ring: "#d946ef", glow: "#d946ef80", isActive: true, showIn: "both", rarity: "common" },
  { id: "horned-iron", level: 13, name: avatarDisplayName(5), price: "50", imageSrc: "/avatars/5.png", bg: "#1f0a05", figure: "#fb923c", ring: "#fb923c", glow: "#fb923c80", isActive: true, showIn: "both", rarity: "common" },
  { id: "crimson-muse", level: 14, name: avatarDisplayName(6), price: "50", imageSrc: "/avatars/6.webp", bg: "#2a0b0b", figure: "#f97316", ring: "#f97316", glow: "#f9731680", isActive: true, showIn: "both", rarity: "common" },
  { id: "solar-flame", level: 15, name: avatarDisplayName(7), price: "50", imageSrc: "/avatars/landing/solar-flame.webp", bg: "#241005", figure: "#facc15", ring: "#facc15", glow: "#facc1590", isActive: true, showIn: "both", rarity: "common" },
  { id: "pink-circuit", level: 16, name: "Pink Circuit", price: "50", imageSrc: "/avatars/landing/pink-circuit.webp", bg: "#2a0b1c", figure: "#fb7185", ring: "#fb7185", glow: "#fb718580", isActive: true, showIn: "both", rarity: "common" },
  { id: "s1-custom", level: 100, name: "S1 Custom", price: "40000", imageSrc: "/avatars/s1-custom.png", bg: "#0a0a0a", figure: "#ffd700", ring: "#ffd700", glow: "#ffd700cc", isActive: true, showIn: "app", rarity: "legendary", rank_tier: 11, frame_color: "gold" },
  ...Array.from({ length: 18 }, (_, index): AvatarCatalogItem | null => {
    const level = index + 17;
    // Skip image ids already represented by a semantic alias above
    // (avoids duplicate "Neon Lynx" / "Blue Signal" / "Violet Mask" entries).
    if (level === 18 || level === 23 || level === 24) return null;
    return {
      id: `avatar-${level}`,
      level,
      name: avatarDisplayName(level),
      price: "50",
      imageSrc: `/avatars/${level}.${[20, 21, 26].includes(level) ? "webp" : "png"}`,
      bg: "#111827",
      figure: "#cbd5e1",
      ring: "#cbd5e1",
      glow: "#cbd5e180",
      isActive: true,
      showIn: "both",
      rarity: "common",
    };
  }).filter((item): item is AvatarCatalogItem => item !== null),
  ...GENERATED_AVATAR_ENTRIES.map(withNumberedAvatarName),
];

const LANDING_WHEEL_PRIZE_TO_AVATAR_ID: Record<string, string> = {
  "wheel-avatar-1": "silver-void",
  "wheel-avatar-2": "neon-lynx",
  "wheel-avatar-3": "blue-signal",
  "wheel-avatar-4": "violet-mask",
  "wheel-avatar-5": "horned-iron",
  "wheel-avatar-6": "crimson-muse",
  "wheel-avatar-7": "solar-flame",
  "wheel-avatar-8": "pink-circuit",
};

export type DailySpinAvatarGrantResult =
  | { status: "granted"; avatarId: string; level: number }
  | { status: "already_claimed"; avatarId: string; level: number }
  | { status: "unknown_avatar" };

function cloneCatalog(items: readonly AvatarCatalogItem[]): AvatarCatalogItem[] {
  return items.map((item) => ({ ...item }));
}

function includeMissingDefaultAvatars(items: AvatarCatalogItem[]): AvatarCatalogItem[] {
  const ids = new Set(items.map((item) => item.id));
  return [
    ...items,
    ...DEFAULT_AVATAR_CATALOG.filter((item) => !ids.has(item.id)).map((item) => ({ ...item })),
  ].sort((a, b) => a.level - b.level);
}

function sanitizeCatalog(items: AvatarCatalogItem[]): AvatarCatalogItem[] {
  const unique = new Map<string, AvatarCatalogItem>();

  items.filter(Boolean).forEach((item, idx) => {
    const id = (item.id || `avatar-${idx + 1}`).trim();
    if (!id) return;

    unique.set(id, {
      id,
      level: idx + 1,
      name: item.name?.trim() || `Avatar ${idx + 1}`,
      price: item.price?.trim() || "0",
      imageSrc: item.imageSrc || undefined,
      bg: item.bg || DEFAULT_AVATAR_CATALOG[Math.min(idx, DEFAULT_AVATAR_CATALOG.length - 1)].bg,
      figure: item.figure || DEFAULT_AVATAR_CATALOG[Math.min(idx, DEFAULT_AVATAR_CATALOG.length - 1)].figure,
      ring: item.ring || DEFAULT_AVATAR_CATALOG[Math.min(idx, DEFAULT_AVATAR_CATALOG.length - 1)].ring,
      glow: item.glow || DEFAULT_AVATAR_CATALOG[Math.min(idx, DEFAULT_AVATAR_CATALOG.length - 1)].glow,
      isActive: item.isActive !== false,
      isNew: item.isNew ?? false,
      rarity: item.rarity,
      dropWeight: item.dropWeight,
      frame_color: item.frame_color,
      rank_tier: item.rank_tier,
    });
  });

  const ordered = Array.from(unique.values()).filter((item) => item.isActive !== false);
  return ordered.length > 0 ? ordered : cloneCatalog(DEFAULT_AVATAR_CATALOG);
}

function dispatchCatalogUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("raw:avatar-catalog-updated"));
}

export function getDefaultAvatarCatalog(): AvatarCatalogItem[] {
  return cloneCatalog(DEFAULT_AVATAR_CATALOG);
}

export function readAvatarCatalogLocal(): AvatarCatalogItem[] {
  if (_catalogCache) return _catalogCache;
  if (typeof window === "undefined") return cloneCatalog(DEFAULT_AVATAR_CATALOG);

  try {
    const raw = window.localStorage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) { _catalogCache = cloneCatalog(DEFAULT_AVATAR_CATALOG); return _catalogCache; }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) { _catalogCache = cloneCatalog(DEFAULT_AVATAR_CATALOG); return _catalogCache; }
    const items = includeMissingDefaultAvatars(sanitizeCatalog(parsed as AvatarCatalogItem[]));
    _catalogCache = items.map((item) => ({
      ...item,
      imageSrc: DEFAULT_IMAGE_SRC_BY_ID.get(item.id) ?? item.imageSrc,
      ...CANONICAL_OVERRIDES_BY_ID[item.id],
    }));
    return _catalogCache;
  } catch {
    _catalogCache = cloneCatalog(DEFAULT_AVATAR_CATALOG);
    return _catalogCache;
  }
}

/** O(1) catalog lookup by avatar id. Pass the result of readAvatarCatalogLocal(). */
export function buildAvatarIdToLevelMap(catalog: AvatarCatalogItem[]): Map<string, number> {
  const map = new Map<string, number>();
  catalog.forEach((item, index) => map.set(item.id, index + 1));
  return map;
}

export function writeAvatarCatalogLocal(items: AvatarCatalogItem[]): AvatarCatalogItem[] {
  const next = sanitizeCatalog(items);
  if (typeof window !== "undefined") {
    _catalogCache = null;
    avatarCatalogLocalWriteFailed = false;
    try {
      window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Large base64 images can exceed localStorage limits; keep runtime state and
      // remote persistence flowing instead of hard-failing publish.
      avatarCatalogLocalWriteFailed = true;
    }
    dispatchCatalogUpdated();
  }
  return next;
}

export function readAvatarThemesFromCache(): AvatarCatalogItem[] {
  return readAvatarCatalogLocal();
}

// Correct image paths from local source code always win over whatever
// Supabase has stored — guards against stale .png paths in the DB when
// the actual file on disk is .webp (or vice-versa).
const DEFAULT_IMAGE_SRC_BY_ID = new Map(
  DEFAULT_AVATAR_CATALOG.filter((i) => i.imageSrc).map((i) => [i.id, i.imageSrc!])
);

// Supabase avatar_catalog is the source of truth. Keep these overrides as a
// temporary guard only for users with stale local/Supabase cache data; new
// avatar corrections should be fixed in migrations first, not added here by
// default.
export const CANONICAL_OVERRIDES_BY_ID: Record<string, Partial<Pick<AvatarCatalogItem, "name" | "frame_color" | "rank_tier">>> = {
  "blue-signal": { name: "Gold Specter", frame_color: "gold", rank_tier: 9 },
  "blu-fifer":   { name: "Red Fifer",    frame_color: "red",  rank_tier: 6 },
  "crimson-muse": { frame_color: "orange", rank_tier: 4 },
  "avatar-17": { frame_color: "orange", rank_tier: 4 },
  "avatar-42": { frame_color: "orange", rank_tier: 4 },
  "violet-mask": { frame_color: "purple", rank_tier: 5 },
  "horned-iron": { frame_color: "purple", rank_tier: 5 },
  "avatar-32": { frame_color: "purple", rank_tier: 5 },
  "avatar-37": { frame_color: "purple", rank_tier: 5 },
  "avatar-41": { frame_color: "purple", rank_tier: 5 },
  "avatar-46": { frame_color: "purple", rank_tier: 5 },
  "avatar-49": { frame_color: "purple", rank_tier: 5 },
  "avatar-57": { frame_color: "purple", rank_tier: 5 },
  "avatar-58": { frame_color: "purple", rank_tier: 5 },
};

export const CANONICAL_OVERRIDE_MIGRATIONS_BY_ID: Record<keyof typeof CANONICAL_OVERRIDES_BY_ID, string> = {
  "blue-signal": "20260630124500_avatar_catalog_authoritative_backfill.sql",
  "blu-fifer": "20260630124500_avatar_catalog_authoritative_backfill.sql",
  "crimson-muse": "20260630133000_avatar_r4_authoritative_backfill.sql",
  "avatar-17": "20260630133000_avatar_r4_authoritative_backfill.sql",
  "avatar-42": "20260630133000_avatar_r4_authoritative_backfill.sql",
  "violet-mask": "20260630134500_avatar_r5_authoritative_backfill.sql",
  "horned-iron": "20260630134500_avatar_r5_authoritative_backfill.sql",
  "avatar-32": "20260630134500_avatar_r5_authoritative_backfill.sql",
  "avatar-37": "20260630134500_avatar_r5_authoritative_backfill.sql",
  "avatar-41": "20260630134500_avatar_r5_authoritative_backfill.sql",
  "avatar-46": "20260630134500_avatar_r5_authoritative_backfill.sql",
  "avatar-49": "20260630134500_avatar_r5_authoritative_backfill.sql",
  "avatar-57": "20260630134500_avatar_r5_authoritative_backfill.sql",
  "avatar-58": "20260630134500_avatar_r5_authoritative_backfill.sql",
};

async function refreshAvatarCatalogFromSupabase(): Promise<void> {
  try {
    let data: Record<string, unknown>[] | null = null;
    for (const cols of [FULL_COLS, BASE_COLS]) {
      const { data: d, error } = await supabase
        .from("avatar_catalog")
        .select(cols)
        .eq("is_active", true)
        .order("level", { ascending: true });
      if (!error) { data = d as unknown as Record<string, unknown>[]; break; }
      markBackendMissingIfNeeded(error);
      if (cols === BASE_COLS) return;
    }

    const mapped = (data ?? []).map((row) => {
      const id = row.id as string;
      return {
        id,
        level: row.level as number,
        name: (row.name as string),
        price: row.price as string,
        imageSrc: DEFAULT_IMAGE_SRC_BY_ID.get(id) ?? (row.image_src as string | undefined) ?? undefined,
        bg: row.bg as string,
        figure: row.figure as string,
        ring: row.ring as string,
        glow: row.glow as string,
        isActive: row.is_active as boolean,
        isNew: false,
        rarity: (row.rarity as AvatarRarity | undefined) ?? "common",
        dropWeight: (row.drop_weight as number | undefined) ?? 100,
        ...CANONICAL_OVERRIDES_BY_ID[id],
      };
    });

    if (mapped.length > 0) writeAvatarCatalogLocal(mapped);
  } catch { /* stay on local cache */ }
}

export function loadAvatarCatalog(): Promise<AvatarCatalogItem[]> {
  if (!avatarBackendMissingTables) void refreshAvatarCatalogFromSupabase();
  return Promise.resolve(readAvatarCatalogLocal());
}

const FULL_COLS = "id, level, name, price, image_src, bg, figure, ring, glow, is_active, is_new, rarity, drop_weight, frame_color, rank_tier";
const BASE_COLS = "id, level, name, price, bg, figure, ring, glow, is_active";

export async function loadAvatarCatalogSupabaseOnly(): Promise<AvatarCatalogItem[]> {
  // Try full column set first; fall back to base columns if schema is missing optional fields.
  let data: Record<string, unknown>[] | null = null;
  for (const cols of [FULL_COLS, BASE_COLS]) {
    const { data: d, error } = await supabase
      .from("avatar_catalog")
      .select(cols)
      .eq("is_active", true)
      .order("level", { ascending: true });
    if (!error) { data = d as unknown as Record<string, unknown>[]; break; }
    if (cols === BASE_COLS) throw new Error(error.message || "Could not load avatar catalog from Supabase.");
  }

  const mapped = sanitizeCatalog(
    (data ?? []).map((row) => ({
      id: row.id as string,
      level: row.level as number,
      name: row.name as string,
      price: row.price as string,
      imageSrc: (row.image_src as string | undefined) ?? undefined,
      bg: row.bg as string,
      figure: row.figure as string,
      ring: row.ring as string,
      glow: row.glow as string,
      isActive: row.is_active as boolean,
      isNew: false,
      rarity: (row.rarity as AvatarRarity | undefined) ?? "common",
      dropWeight: (row.drop_weight as number | undefined) ?? 100,
      frame_color: (row.frame_color as string | undefined) ?? undefined,
      rank_tier: (row.rank_tier as number | undefined) ?? undefined,
    }))
  );

  writeAvatarCatalogLocal(mapped);
  return mapped;
}

export function readFullAvatarCatalogLocal(): AvatarCatalogItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FULL_CATALOG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Sanitize to guard against stale/incomplete cache entries
    return sanitizeCatalog(parsed as AvatarCatalogItem[]);
  } catch {
    return [];
  }
}

function writeFullAvatarCatalogLocal(items: AvatarCatalogItem[]): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(FULL_CATALOG_STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore */ }
}

export async function loadFullAvatarCatalog(): Promise<AvatarCatalogItem[]> {
  let data: Record<string, unknown>[] | null = null;
  for (const cols of [FULL_COLS, BASE_COLS]) {
    const { data: d, error } = await supabase
      .from("avatar_catalog")
      .select(cols)
      .order("level", { ascending: true });
    if (!error) { data = d as unknown as Record<string, unknown>[]; break; }
    if (cols === BASE_COLS) throw new Error(error.message || "Could not load full avatar catalog from Supabase.");
  }

  const mapped = (data ?? []).map((row, idx) => ({
    id: row.id as string,
    level: idx + 1,
    name: row.name as string,
    price: row.price as string,
    imageSrc: (row.image_src as string | undefined) ?? undefined,
    bg: (row.bg as string) || DEFAULT_AVATAR_CATALOG[Math.min(idx, DEFAULT_AVATAR_CATALOG.length - 1)].bg,
    figure: (row.figure as string) || DEFAULT_AVATAR_CATALOG[Math.min(idx, DEFAULT_AVATAR_CATALOG.length - 1)].figure,
    ring: (row.ring as string) || DEFAULT_AVATAR_CATALOG[Math.min(idx, DEFAULT_AVATAR_CATALOG.length - 1)].ring,
    glow: (row.glow as string) || DEFAULT_AVATAR_CATALOG[Math.min(idx, DEFAULT_AVATAR_CATALOG.length - 1)].glow,
    isActive: row.is_active as boolean,
    isNew: false,
    rarity: (row.rarity as AvatarRarity | undefined) ?? "common",
    dropWeight: (row.drop_weight as number | undefined) ?? 100,
  }));

  if (mapped.length > 0) writeFullAvatarCatalogLocal(mapped);
  return mapped;
}

export async function loadAvatarCatalogRange(startLevel: number, endLevel: number): Promise<AvatarCatalogItem[]> {
  const { data, error } = await supabase
    .from("avatar_catalog")
    .select("id, level, name, price, image_src, bg, figure, ring, glow, is_active, is_new, rarity, drop_weight")
    .gte("level", startLevel)
    .lte("level", endLevel)
    .order("level", { ascending: true });

  if (error) {
    throw new Error(error.message || "Could not load avatar catalog range from Supabase.");
  }

  return (data ?? []).map((row, idx) => {
    const fallback = DEFAULT_AVATAR_CATALOG[Math.min(idx, DEFAULT_AVATAR_CATALOG.length - 1)];
    return {
      id: row.id,
      level: row.level,
      name: row.name,
      price: row.price,
      imageSrc: row.image_src ?? undefined,
      bg: row.bg || fallback.bg,
      figure: row.figure || fallback.figure,
      ring: row.ring || fallback.ring,
      glow: row.glow || fallback.glow,
      isActive: row.is_active,
      isNew: row.is_new ?? false,
      rarity: row.rarity ?? "common",
      dropWeight: row.drop_weight ?? 100,
    };
  });
}

export async function saveAvatarCatalog(items: AvatarCatalogItem[]): Promise<AvatarCatalogItem[]> {
  const next = writeAvatarCatalogLocal(items);

  if (avatarBackendMissingTables) {
    return next;
  }

  try {
    const baseRow = (item: AvatarCatalogItem) => ({
      id: item.id, level: item.level, name: item.name, price: item.price,
      bg: item.bg, figure: item.figure, ring: item.ring, glow: item.glow, is_active: true, is_new: item.isNew ?? false,
      rarity: item.rarity ?? "common", drop_weight: item.dropWeight ?? 100,
    });
    const withImage = next.filter((i) => i.imageSrc && !i.imageSrc.startsWith("data:"))
      .map((i) => ({ ...baseRow(i), image_src: i.imageSrc! }));
    const withoutImage = next.filter((i) => !i.imageSrc || i.imageSrc.startsWith("data:"))
      .map((i) => baseRow(i));

    if (withImage.length > 0) {
      const { error } = await supabase.from("avatar_catalog").upsert(withImage, { onConflict: "id" });
      if (error) { markBackendMissingIfNeeded(error); return next; }
    }
    if (withoutImage.length > 0) {
      const { error } = await supabase.from("avatar_catalog").upsert(withoutImage, { onConflict: "id" });
      if (error) { markBackendMissingIfNeeded(error); return next; }
    }
  } catch {
    // Local cache remains the source of truth if Supabase write is unavailable.
  }

  return next;
}

export async function deleteAvatarFromCatalog(id: string): Promise<void> {
  const { error } = await supabase.from("avatar_catalog").delete().eq("id", id);
  if (error) throw new Error(error.message || "Could not delete avatar from Supabase.");
}

export async function saveAvatarCatalogSupabaseOnly(items: AvatarCatalogItem[]): Promise<AvatarCatalogItem[]> {
  const next = sanitizeCatalog(items);
  const baseRow = (item: AvatarCatalogItem) => ({
    id: item.id, level: item.level, name: item.name, price: item.price,
    bg: item.bg, figure: item.figure, ring: item.ring, glow: item.glow, is_active: true, is_new: item.isNew ?? false,
    rarity: item.rarity ?? "common", drop_weight: item.dropWeight ?? 100,
  });
  // Split into two batches: rows with a real image URL vs rows without (or with legacy base64).
  // PostgREST requires all rows in a batch to share the same column set, and base64 data URLs
  // would exceed the statement timeout, so we keep image_src out of the second batch entirely
  // (PostgREST then leaves the existing DB value untouched on conflict).
  const withImage = next.filter((i) => i.imageSrc && !i.imageSrc.startsWith("data:"))
    .map((i) => ({ ...baseRow(i), image_src: i.imageSrc! }));
  const withoutImage = next.filter((i) => !i.imageSrc || i.imageSrc.startsWith("data:"))
    .map((i) => baseRow(i));

  if (withImage.length > 0) {
    const { error } = await supabase.from("avatar_catalog").upsert(withImage, { onConflict: "id" });
    if (error) throw new Error(error.message || "Could not save avatar catalog to Supabase.");
  }
  if (withoutImage.length > 0) {
    const { error } = await supabase.from("avatar_catalog").upsert(withoutImage, { onConflict: "id" });
    if (error) throw new Error(error.message || "Could not save avatar catalog to Supabase.");
  }

  return next;
}

function inventoryKey(userId: string): string {
  return `${INVENTORY_STORAGE_PREFIX}${userId}`;
}

function selectedKey(userId: string): string {
  return `${SELECTED_STORAGE_PREFIX}${userId}`;
}

function dailySpinAvatarClaimKey(userId: string): string {
  return `${DAILY_SPIN_AVATAR_CLAIM_PREFIX}${userId}`;
}

function readDailySpinAvatarClaimLocal(userId: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(dailySpinAvatarClaimKey(userId));
}

function writeDailySpinAvatarClaimLocal(userId: string, avatarId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(dailySpinAvatarClaimKey(userId), avatarId);
}

function readLandingWheelAvatarIdLocal(catalog: AvatarCatalogItem[]): string | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(LANDING_WHEEL_SPIN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { prizeId?: unknown; avatarId?: unknown };
    const candidate = typeof parsed.avatarId === "string"
      ? parsed.avatarId
      : typeof parsed.prizeId === "string"
        ? LANDING_WHEEL_PRIZE_TO_AVATAR_ID[parsed.prizeId]
        : null;
    if (!candidate) return null;
    return catalog.some((item) => item.id === candidate) ? candidate : null;
  } catch {
    return null;
  }
}

function clearLandingWheelAvatarLocal(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LANDING_WHEEL_SPIN_KEY);
}

function defaultOwnedIds(catalog: AvatarCatalogItem[]): string[] {
  return catalog
    .filter((item) => {
      if (item.id.startsWith("spin-") || item.id.startsWith("signup-")) return false;
      return item.price === "Free" || item.price === "0" || Number(item.price) === 0;
    })
    .map((item) => item.id);
}

export function readOwnedAvatarIdsLocal(userId: string, catalog: AvatarCatalogItem[]): string[] {
  if (typeof window === "undefined") return defaultOwnedIds(catalog);

  try {
    const raw = window.localStorage.getItem(inventoryKey(userId));
    if (!raw) return defaultOwnedIds(catalog);
    const parsed = JSON.parse(raw) as string[];
    const allowed = new Set(catalog.map((item) => item.id));
    const filtered = parsed.filter((id) => allowed.has(id));
    return filtered.length > 0 ? filtered : defaultOwnedIds(catalog);
  } catch {
    return defaultOwnedIds(catalog);
  }
}

export function writeOwnedAvatarIdsLocal(userId: string, ownedAvatarIds: string[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(inventoryKey(userId), JSON.stringify(Array.from(new Set(ownedAvatarIds))));
}

export function readSelectedAvatarIdLocal(userId: string, catalog: AvatarCatalogItem[], ownedAvatarIds: string[]): string {
  if (typeof window === "undefined") return ownedAvatarIds[0] ?? catalog[0]?.id ?? "avatar-1";

  const fallback = ownedAvatarIds[0] ?? catalog[0]?.id ?? "avatar-1";
  try {
    const raw = window.localStorage.getItem(selectedKey(userId));
    if (!raw) return fallback;
    if (ownedAvatarIds.includes(raw)) return raw;
    return fallback;
  } catch {
    return fallback;
  }
}

export function writeSelectedAvatarIdLocal(userId: string, avatarId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(selectedKey(userId), avatarId);
}

export async function loadUserAvatarState(
  userId: string,
  catalog: AvatarCatalogItem[],
): Promise<{ ownedAvatarIds: string[]; selectedAvatarId: string }> {
  const localOwned = readOwnedAvatarIdsLocal(userId, catalog);
  const localSelected = readSelectedAvatarIdLocal(userId, catalog, localOwned);

  if (avatarBackendMissingTables) {
    return { ownedAvatarIds: localOwned, selectedAvatarId: localSelected };
  }

  try {
    const [{ data: inventoryRows, error: inventoryError }, { data: selectedRow, error: selectedError }] = await Promise.all([
      supabase.from("user_avatar_inventory").select("avatar_id").eq("user_id", userId),
      supabase.from("user_avatar_selection").select("avatar_id").eq("user_id", userId).maybeSingle(),
    ]);

    if (inventoryError || selectedError) {
      markBackendMissingIfNeeded(inventoryError ?? selectedError);
      return { ownedAvatarIds: localOwned, selectedAvatarId: localSelected };
    }

    const allowed = new Set(catalog.map((item) => item.id));
    const serverOwned = (inventoryRows ?? []).map((row) => row.avatar_id).filter((id) => allowed.has(id));
    // Server is the source of truth — drop local extras that aren't on the
    // server. defaultOwnedIds covers the 8 base free avatars that aren't
    // persisted server-side.
    const ownedAvatarIds = Array.from(new Set([
      ...defaultOwnedIds(catalog),
      ...serverOwned,
    ]));
    const selectedCandidate = selectedRow?.avatar_id ?? localSelected;
    const selectedAvatarId = ownedAvatarIds.includes(selectedCandidate) ? selectedCandidate : ownedAvatarIds[0] ?? localSelected;

    writeOwnedAvatarIdsLocal(userId, ownedAvatarIds);
    writeSelectedAvatarIdLocal(userId, selectedAvatarId);
    if (!selectedRow?.avatar_id) {
      const selectedLevel = catalog.findIndex((item) => item.id === selectedAvatarId) + 1;
      void persistSelectedAvatarForUser(userId, selectedAvatarId, selectedLevel > 0 ? selectedLevel : 1);
    }

    return { ownedAvatarIds, selectedAvatarId };
  } catch {
    return { ownedAvatarIds: localOwned, selectedAvatarId: localSelected };
  }
}

export async function purchaseAvatarForUser(userId: string, avatarId: string): Promise<void> {
  const catalog = readAvatarCatalogLocal();
  if (!catalog.some((item) => item.id === avatarId)) {
    throw new Error(`Unknown avatar id: ${avatarId}`);
  }

  const localInventory = readOwnedAvatarIdsLocal(userId, catalog);
  if (!localInventory.includes(avatarId)) {
    writeOwnedAvatarIdsLocal(userId, [...localInventory, avatarId]);
  }

  if (avatarBackendMissingTables) {
    return;
  }

  try {
    const { error } = await supabase.from("user_avatar_inventory").upsert({ user_id: userId, avatar_id: avatarId }, { onConflict: "user_id,avatar_id" });
    if (error) {
      markBackendMissingIfNeeded(error);
    }
  } catch {
    // Local save already completed.
  }
}

export async function grantDailySpinAvatarOnceForUser(userId: string, avatarId: string): Promise<DailySpinAvatarGrantResult> {
  const catalog = readAvatarCatalogLocal();
  const avatar = catalog.find((item) => item.id === avatarId);
  if (!avatar) {
    return { status: "unknown_avatar" };
  }

  const existingLocalClaim = readDailySpinAvatarClaimLocal(userId);
  if (existingLocalClaim) {
    const existingAvatar = catalog.find((item) => item.id === existingLocalClaim) ?? avatar;
    return { status: "already_claimed", avatarId: existingAvatar.id, level: existingAvatar.level };
  }

  try {
    const { data, error } = await supabase.rpc("award_xp_once", {
      p_source: "daily-spin-avatar",
      p_claim_key: "free-avatar",
      p_amount: 0,
    });

    const result = data as { awarded?: unknown } | null;
    if (!error && result?.awarded === false) {
      writeDailySpinAvatarClaimLocal(userId, avatar.id);
      return { status: "already_claimed", avatarId: avatar.id, level: avatar.level };
    }

    if (error) {
      const localClaim = readDailySpinAvatarClaimLocal(userId);
      if (localClaim) {
        const existingAvatar = catalog.find((item) => item.id === localClaim) ?? avatar;
        return { status: "already_claimed", avatarId: existingAvatar.id, level: existingAvatar.level };
      }
    }
  } catch {
    // Fall back to local-only claim state below.
  }

  await purchaseAvatarForUser(userId, avatar.id);
  writeDailySpinAvatarClaimLocal(userId, avatar.id);
  return { status: "granted", avatarId: avatar.id, level: avatar.level };
}

export async function claimPendingLandingWheelAvatarForUser(userId: string): Promise<DailySpinAvatarGrantResult | null> {
  const catalog = readAvatarCatalogLocal();
  const avatarId = readLandingWheelAvatarIdLocal(catalog);
  if (!avatarId) return null;

  // Persist via the new server-side claim RPC so users.free_spin_avatar_*
  // columns get set. Idempotent on the server, safe to retry.
  try {
    const { claimFreeSpinAvatar } = await import("@/backend/supabase/controllers/avatarRewardsController");
    const claim = await claimFreeSpinAvatar(userId, avatarId);
    if (claim.ok && claim.avatarId) {
      const claimedAvatar = catalog.find((item) => item.id === claim.avatarId);
      clearLandingWheelAvatarLocal();
      if (!claimedAvatar) {
        return { status: "unknown_avatar" };
      }
      await purchaseAvatarForUser(userId, claimedAvatar.id);
      return {
        status: claim.alreadyClaimed ? "already_claimed" : "granted",
        avatarId: claimedAvatar.id,
        level: claimedAvatar.level,
      };
    }
  } catch {
    // Best-effort — fall back to the legacy local-first grant below.
  }

  const result = await grantDailySpinAvatarOnceForUser(userId, avatarId);
  clearLandingWheelAvatarLocal();
  return result;
}

export async function equipAvatarForUser(userId: string, avatarId: string): Promise<void> {
  writeSelectedAvatarIdLocal(userId, avatarId);

  if (avatarBackendMissingTables) {
    return;
  }

  const catalog = readAvatarCatalogLocal();
  const selectedLevel = catalog.findIndex((item) => item.id === avatarId) + 1;
  await persistSelectedAvatarForUser(userId, avatarId, selectedLevel > 0 ? selectedLevel : 1);
}

async function persistSelectedAvatarForUser(userId: string, avatarId: string, avatarLevel: number): Promise<void> {
  try {
    const [{ error: selectionError }, { error: userError }] = await Promise.all([
      supabase.from("user_avatar_selection").upsert({ user_id: userId, avatar_id: avatarId }, { onConflict: "user_id" }),
      supabase.from("users").update({ avatar_level: avatarLevel }).eq("id", userId),
    ]);
    if (selectionError || userError) {
      markBackendMissingIfNeeded(selectionError ?? userError);
    }
  } catch {
    // Local save already completed.
  }
}
