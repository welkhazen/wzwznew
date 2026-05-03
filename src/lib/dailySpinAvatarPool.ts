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
