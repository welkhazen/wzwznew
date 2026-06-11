import { supabaseAdmin } from "./supabaseClient";

export type ModerationVerdict = "ALLOW" | "WARN" | "HOLD" | "BLOCK";

export interface ModerationResult {
  verdict: ModerationVerdict;
  reason?: string;
  matchedWord?: string;
}

const L33T_MAP: Record<string, string> = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s",
  "7": "t", "@": "a", "$": "s", "!": "i",
};

export function normalizeText(text: string): string {
  let s = text.toLowerCase();
  s = s.replace(/[0134@$!57]/g, (ch) => L33T_MAP[ch] ?? ch);
  s = s.replace(/(.)\1{2,}/g, "$1$1");
  s = s.replace(/[^a-z0-9\s]/g, "");
  return s.replace(/\s+/g, " ").trim();
}

// In-memory rate limit: userId → sorted timestamps
const messageTimestamps = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = (messageTimestamps.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  timestamps.push(now);
  messageTimestamps.set(userId, timestamps);
  return timestamps.length <= RATE_MAX;
}

type BannedWordRow = { normalized_word: string; action: string };
let cachedWords: BannedWordRow[] | null = null;
let cacheExpiresAt = 0;

async function getBannedWords(): Promise<BannedWordRow[]> {
  if (cachedWords && Date.now() < cacheExpiresAt) {
    return cachedWords;
  }
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin
    .from("banned_words")
    .select("normalized_word, action")
    .limit(1000);
  cachedWords = (data ?? []) as BannedWordRow[];
  cacheExpiresAt = Date.now() + 5 * 60_000;
  return cachedWords;
}

export function invalidateBannedWordsCache(): void {
  cachedWords = null;
  cacheExpiresAt = 0;
}

export async function moderateText(
  text: string,
  userId: string,
  _communityId: string,
): Promise<ModerationResult> {
  if (!checkRateLimit(userId)) {
    return { verdict: "HOLD", reason: "rate_limit" };
  }

  const normalized = normalizeText(text);
  const words = await getBannedWords();

  for (const entry of words) {
    if (normalized.includes(entry.normalized_word)) {
      const action = entry.action as "warn" | "hold" | "block";
      if (action === "block") return { verdict: "BLOCK", reason: "banned_word", matchedWord: entry.normalized_word };
      if (action === "hold") return { verdict: "HOLD", reason: "banned_word", matchedWord: entry.normalized_word };
      if (action === "warn") return { verdict: "WARN", reason: "banned_word", matchedWord: entry.normalized_word };
    }
  }

  return { verdict: "ALLOW" };
}
