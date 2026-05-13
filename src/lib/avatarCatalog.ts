import { supabase } from "@/lib/supabase";

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
};

const CATALOG_STORAGE_KEY = "raw.avatar.catalog.v1";
const FULL_CATALOG_STORAGE_KEY = "raw.avatar.catalog.full.v1";
const INVENTORY_STORAGE_PREFIX = "raw.avatar.inventory.v1.";
const SELECTED_STORAGE_PREFIX = "raw.avatar.selected.v1.";
let avatarBackendMissingTables = false;
let avatarCatalogLocalWriteFailed = false;

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

const DEFAULT_AVATAR_CATALOG: AvatarCatalogItem[] = [
  { id: "avatar-2", level: 2, name: "Chrome Ghost", price: "Free", imageSrc: "/avatars/avatar-2.svg", bg: "#0c1a24", figure: "#5ed6ff", ring: "#2ea6d6", glow: "#5ed6ff80", isActive: true },
  { id: "avatar-3", level: 3, name: "Iron Specter", price: "0", imageSrc: "/avatars/avatar-3.svg", bg: "#0a1124", figure: "#3f8bff", ring: "#2557c4", glow: "#3f8bff80", isActive: true },
  { id: "avatar-5", level: 5, name: "Solar Enforcer", price: "0", imageSrc: "/avatars/avatar-5.svg", bg: "#0b1a0e", figure: "#16a34a", ring: "#0f7a36", glow: "#16a34a80", isActive: true },
  { id: "avatar-6", level: 6, name: "Neon Oracle", price: "0", imageSrc: "/avatars/avatar-6.svg", bg: "#1f0d18", figure: "#ec4899", ring: "#a6235f", glow: "#ec489980", isActive: true },
  { id: "avatar-7", level: 7, name: "Void Phantom", price: "0", imageSrc: "/avatars/avatar-7.svg", bg: "#150a22", figure: "#8b5cf6", ring: "#5b2aa8", glow: "#8b5cf680", isActive: true },
  { id: "avatar-8", level: 8, name: "Copper Wraith", price: "0", imageSrc: "/avatars/avatar-8.svg", bg: "#1f1208", figure: "#f97316", ring: "#b0550f", glow: "#f9731680", isActive: true },
  { id: "avatar-9", level: 9, name: "Inferno Shade", price: "0", imageSrc: "/avatars/avatar-9.svg", bg: "#1f0a0a", figure: "#dc2626", ring: "#8a1515", glow: "#dc262680", isActive: true },
  { id: "avatar-10", level: 10, name: "Golden Reaper", price: "0", imageSrc: "/avatars/avatar-10.svg", bg: "#1f1705", figure: "#facc15", ring: "#b8900b", glow: "#facc1590", isActive: true },
];

function cloneCatalog(items: AvatarCatalogItem[]): AvatarCatalogItem[] {
  return items.map((item) => ({ ...item }));
}

function sanitizeCatalog(items: AvatarCatalogItem[]): AvatarCatalogItem[] {
  const unique = new Map<string, AvatarCatalogItem>();

  items.forEach((item, idx) => {
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
    });
  });

  const ordered = Array.from(unique.values()).filter((item) => item.isActive !== false);
  return ordered.length > 0 ? ordered : cloneCatalog(DEFAULT_AVATAR_CATALOG);
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function dispatchCatalogUpdated(): void {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent("raw:avatar-catalog-updated"));
}

export function getDefaultAvatarCatalog(): AvatarCatalogItem[] {
  return cloneCatalog(DEFAULT_AVATAR_CATALOG);
}

export function readAvatarCatalogLocal(): AvatarCatalogItem[] {
  if (!isBrowser()) return cloneCatalog(DEFAULT_AVATAR_CATALOG);

  try {
    const raw = window.localStorage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) return cloneCatalog(DEFAULT_AVATAR_CATALOG);
    const parsed = JSON.parse(raw) as AvatarCatalogItem[];
    return sanitizeCatalog(parsed);
  } catch {
    return cloneCatalog(DEFAULT_AVATAR_CATALOG);
  }
}

export function writeAvatarCatalogLocal(items: AvatarCatalogItem[]): AvatarCatalogItem[] {
  const next = sanitizeCatalog(items);
  if (isBrowser()) {
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

async function refreshAvatarCatalogFromSupabase(): Promise<void> {
  try {
    const { data, error } = await supabase
      .from("avatar_catalog")
      .select("*")
      .eq("is_active", true)
      .order("level", { ascending: true });

    if (error) { markBackendMissingIfNeeded(error); return; }

    const mapped = (data ?? []).map((row) => ({
      id: row.id,
      level: row.level,
      name: row.name,
      price: row.price,
      imageSrc: row.image_src ?? undefined,
      bg: row.bg,
      figure: row.figure,
      ring: row.ring,
      glow: row.glow,
      isActive: row.is_active,
      isNew: false,
    }));

    if (mapped.length > 0) writeAvatarCatalogLocal(mapped); // dispatches raw:avatar-catalog-updated
  } catch { /* stay on local cache */ }
}

export function loadAvatarCatalog(): Promise<AvatarCatalogItem[]> {
  if (!avatarBackendMissingTables) void refreshAvatarCatalogFromSupabase();
  return Promise.resolve(readAvatarCatalogLocal());
}

export async function loadAvatarCatalogSupabaseOnly(): Promise<AvatarCatalogItem[]> {
  const { data, error } = await supabase
    .from("avatar_catalog")
    .select("*")
    .eq("is_active", true)
    .order("level", { ascending: true });

  if (error) {
    throw new Error(error.message || "Could not load avatar catalog from Supabase.");
  }

  const mapped = sanitizeCatalog(
    (data ?? []).map((row) => ({
      id: row.id,
      level: row.level,
      name: row.name,
      price: row.price,
      imageSrc: row.image_src ?? undefined,
      bg: row.bg,
      figure: row.figure,
      ring: row.ring,
      glow: row.glow,
      isActive: row.is_active,
      isNew: false,
    }))
  );

  writeAvatarCatalogLocal(mapped);
  return mapped;
}

export function readFullAvatarCatalogLocal(): AvatarCatalogItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(FULL_CATALOG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as AvatarCatalogItem[];
  } catch {
    return [];
  }
}

function writeFullAvatarCatalogLocal(items: AvatarCatalogItem[]): void {
  if (!isBrowser()) return;
  try { window.localStorage.setItem(FULL_CATALOG_STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore */ }
}

export async function loadFullAvatarCatalog(): Promise<AvatarCatalogItem[]> {
  const { data, error } = await supabase
    .from("avatar_catalog")
    .select("*")
    .order("level", { ascending: true });

  if (error) {
    throw new Error(error.message || "Could not load full avatar catalog from Supabase.");
  }

  const mapped = (data ?? []).map((row, idx) => ({
    id: row.id,
    level: idx + 1,
    name: row.name,
    price: row.price,
    imageSrc: row.image_src ?? undefined,
    bg: row.bg || DEFAULT_AVATAR_CATALOG[Math.min(idx, DEFAULT_AVATAR_CATALOG.length - 1)].bg,
    figure: row.figure || DEFAULT_AVATAR_CATALOG[Math.min(idx, DEFAULT_AVATAR_CATALOG.length - 1)].figure,
    ring: row.ring || DEFAULT_AVATAR_CATALOG[Math.min(idx, DEFAULT_AVATAR_CATALOG.length - 1)].ring,
    glow: row.glow || DEFAULT_AVATAR_CATALOG[Math.min(idx, DEFAULT_AVATAR_CATALOG.length - 1)].glow,
    isActive: row.is_active,
    isNew: false,
  }));

  if (mapped.length > 0) writeFullAvatarCatalogLocal(mapped);
  return mapped;
}

export async function loadAvatarCatalogRange(startLevel: number, endLevel: number): Promise<AvatarCatalogItem[]> {
  const { data, error } = await supabase
    .from("avatar_catalog")
    .select("id, level, name, price, bg, figure, ring, glow, is_active, is_new")
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
      imageSrc: undefined,
      bg: row.bg || fallback.bg,
      figure: row.figure || fallback.figure,
      ring: row.ring || fallback.ring,
      glow: row.glow || fallback.glow,
      isActive: row.is_active,
      isNew: row.is_new ?? false,
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

export async function saveAvatarCatalogSupabaseOnly(items: AvatarCatalogItem[]): Promise<AvatarCatalogItem[]> {
  const next = sanitizeCatalog(items);
  const baseRow = (item: AvatarCatalogItem) => ({
    id: item.id, level: item.level, name: item.name, price: item.price,
    bg: item.bg, figure: item.figure, ring: item.ring, glow: item.glow, is_active: true, is_new: item.isNew ?? false,
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

function defaultOwnedIds(catalog: AvatarCatalogItem[]): string[] {
  return catalog.length > 0 ? [catalog[0].id] : [];
}

export function readOwnedAvatarIdsLocal(userId: string, catalog: AvatarCatalogItem[]): string[] {
  if (!isBrowser()) return defaultOwnedIds(catalog);

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
  if (!isBrowser()) return;
  window.localStorage.setItem(inventoryKey(userId), JSON.stringify(Array.from(new Set(ownedAvatarIds))));
}

export function readSelectedAvatarIdLocal(userId: string, catalog: AvatarCatalogItem[], ownedAvatarIds: string[]): string {
  if (!isBrowser()) return ownedAvatarIds[0] ?? catalog[0]?.id ?? "avatar-1";

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
  if (!isBrowser()) return;
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
    const ownedAvatarIds = serverOwned.length > 0 ? Array.from(new Set(serverOwned)) : localOwned;
    const selectedCandidate = selectedRow?.avatar_id ?? localSelected;
    const selectedAvatarId = ownedAvatarIds.includes(selectedCandidate) ? selectedCandidate : ownedAvatarIds[0] ?? localSelected;

    writeOwnedAvatarIdsLocal(userId, ownedAvatarIds);
    writeSelectedAvatarIdLocal(userId, selectedAvatarId);

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

export async function equipAvatarForUser(userId: string, avatarId: string): Promise<void> {
  writeSelectedAvatarIdLocal(userId, avatarId);

  if (avatarBackendMissingTables) {
    return;
  }

  try {
    const { error } = await supabase.from("user_avatar_selection").upsert({ user_id: userId, avatar_id: avatarId }, { onConflict: "user_id" });
    if (error) {
      markBackendMissingIfNeeded(error);
    }
  } catch {
    // Local save already completed.
  }
}
