import { supabase } from "@/lib/supabase";

export type DailySpinAvatarPoolItem = {
  id: string;
  name: string;
  imageSrc: string;
};

const DAILY_SPIN_AVATAR_POOL_KEY = "raw.daily-spin.avatar-pool.v1";

export function readDailySpinAvatarPool(): DailySpinAvatarPoolItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(DAILY_SPIN_AVATAR_POOL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DailySpinAvatarPoolItem[];
    return parsed.filter((item) => Boolean(item.id) && Boolean(item.name) && Boolean(item.imageSrc));
  } catch {
    return [];
  }
}

export function writeDailySpinAvatarPool(items: DailySpinAvatarPoolItem[]): DailySpinAvatarPoolItem[] {
  const next = items.filter((item) => Boolean(item.id) && Boolean(item.name) && Boolean(item.imageSrc));
  if (typeof window !== "undefined") {
    window.localStorage.setItem(DAILY_SPIN_AVATAR_POOL_KEY, JSON.stringify(next));
  }
  return next;
}

export function upsertDailySpinAvatarPool(items: DailySpinAvatarPoolItem[]): DailySpinAvatarPoolItem[] {
  const current = readDailySpinAvatarPool();
  const byId = new Map<string, DailySpinAvatarPoolItem>();

  current.forEach((item) => byId.set(item.id, item));
  items.forEach((item) => byId.set(item.id, item));

  return writeDailySpinAvatarPool(Array.from(byId.values()));
}

export async function loadDailySpinPoolFromSupabase(): Promise<DailySpinAvatarPoolItem[]> {
  const { data, error } = await supabase
    .from("daily_spin_pool")
    .select("id, name, image_src, position")
    .order("position", { ascending: true });

  if (error) {
    throw new Error(error.message || "Could not load spin pool from Supabase.");
  }

  const items = (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    imageSrc: row.image_src as string,
  }));

  // Keep localStorage in sync for wheel fallback reads
  writeDailySpinAvatarPool(items);
  return items;
}

export async function saveDailySpinPoolToSupabase(items: DailySpinAvatarPoolItem[]): Promise<DailySpinAvatarPoolItem[]> {
  // Delete all existing rows then re-insert to reflect the new ordered list
  const { error: deleteError } = await supabase
    .from("daily_spin_pool")
    .delete()
    .neq("id", "__never_matches__");

  if (deleteError) {
    throw new Error(deleteError.message || "Could not clear spin pool.");
  }

  if (items.length === 0) {
    writeDailySpinAvatarPool([]);
    return [];
  }

  const rows = items.map((item, index) => ({
    id: item.id,
    name: item.name,
    image_src: item.imageSrc,
    position: index,
  }));

  const { data, error: insertError } = await supabase
    .from("daily_spin_pool")
    .insert(rows)
    .select("id, name, image_src, position");

  if (insertError) {
    throw new Error(insertError.message || "Could not save spin pool.");
  }

  const saved = (data ?? [])
    .sort((a, b) => (a.position as number) - (b.position as number))
    .map((row) => ({
      id: row.id as string,
      name: row.name as string,
      imageSrc: row.image_src as string,
    }));

  writeDailySpinAvatarPool(saved);
  return saved;
}
