type CacheEntry<T> = { data: T; ts: number };

export function makeLocalStorageCache<T>(hardTtlMs: number) {
  const memory = new Map<string, CacheEntry<T>>();

  function read(key: string): CacheEntry<T> | null {
    const hit = memory.get(key);
    if (hit) return hit;
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CacheEntry<T>;
      if (!parsed || typeof parsed.ts !== "number") return null;
      if (Date.now() - parsed.ts > hardTtlMs) return null;
      memory.set(key, parsed);
      return parsed;
    } catch {
      return null;
    }
  }

  function write(key: string, data: T): void {
    const entry: CacheEntry<T> = { data, ts: Date.now() };
    memory.set(key, entry);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(entry));
    } catch {
      // Quota exceeded or storage unavailable — in-memory cache still works.
    }
  }

  function getWithAge(key: string): { data: T; ageMs: number } | null {
    const entry = read(key);
    if (!entry) return null;
    return { data: entry.data, ageMs: Date.now() - entry.ts };
  }

  return { read, write, getWithAge };
}
