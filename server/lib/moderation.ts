import { supabaseAdmin } from "./supabaseClient";
import { env } from "../config/env";

export type ModerationVerdict = "ALLOW" | "WARN" | "HOLD" | "BLOCK";

export interface ModerationResult {
  verdict: ModerationVerdict;
  reason?: string;
  matchedWord?: string;
  aiScore?: number;
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

const LINK_PATTERN = /\b(?:https?:\/\/|www\.|(?:[a-z0-9-]+\.)+(?:com|net|org|io|co|app|dev|me|gg|xyz|ly|link|site|info|biz)(?:\/\S*)?)/gi;
const MAX_LINKS_PER_MESSAGE = 2;
const NEW_USER_WINDOW_MS = 10 * 60_000;
const MAX_DUPLICATE_REPEATS = 3;
const AI_HOLD_THRESHOLD = 0.85;
const AI_WARN_THRESHOLD = 0.65;

export function countLinks(text: string): number {
  return (text.match(LINK_PATTERN) ?? []).length;
}

// In-memory rate limit: userId → sorted timestamps
const messageTimestamps = new Map<string, number[]>();
const RATE_WINDOW_MS = 10_000;
const RATE_MAX = 5;

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

/**
 * Optional AI toxicity check via OpenAI's moderation endpoint. Returns the
 * highest category score (0-1), or null if no provider is configured or the
 * request fails — the pipeline falls back to word-filter + spam rules only.
 */
async function getAiToxicityScore(text: string): Promise<number | null> {
  if (env.MODERATION_AI_ENABLED !== "true") return null;
  const apiKey = env.MODERATION_AI_API_KEY ?? env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ input: text }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { results?: Array<{ category_scores?: Record<string, number> }> };
    const scores = data.results?.[0]?.category_scores;
    if (!scores) return null;
    return Math.max(0, ...Object.values(scores));
  } catch {
    return null;
  }
}

async function isDuplicateSpam(userId: string, text: string): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const { data } = await supabaseAdmin
    .from("community_messages")
    .select("text")
    .eq("sender_id", userId)
    .order("created_at", { ascending: false })
    .limit(MAX_DUPLICATE_REPEATS);
  const repeats = (data ?? []).filter((m) => (m as { text: string }).text === text).length;
  return repeats >= MAX_DUPLICATE_REPEATS;
}

async function isNewUser(userId: string): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const { data } = await supabaseAdmin
    .from("users")
    .select("created_at")
    .eq("id", userId)
    .maybeSingle();
  const createdAt = (data as { created_at?: string } | null)?.created_at;
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < NEW_USER_WINDOW_MS;
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

  const linkCount = countLinks(text);
  if (linkCount > MAX_LINKS_PER_MESSAGE) {
    return { verdict: "BLOCK", reason: "too_many_links" };
  }
  if (linkCount > 0 && (await isNewUser(userId))) {
    return { verdict: "BLOCK", reason: "new_user_link_restricted" };
  }

  if (await isDuplicateSpam(userId, text)) {
    return { verdict: "BLOCK", reason: "duplicate_message" };
  }

  const aiScore = await getAiToxicityScore(text);
  if (aiScore != null) {
    if (aiScore >= AI_HOLD_THRESHOLD) return { verdict: "HOLD", reason: "ai_toxicity_high", aiScore };
    if (aiScore >= AI_WARN_THRESHOLD) return { verdict: "WARN", reason: "ai_toxicity_elevated", aiScore };
    return { verdict: "ALLOW", aiScore };
  }

  return { verdict: "ALLOW" };
}
