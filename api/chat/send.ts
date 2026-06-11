import { json, readJsonBody } from "../_lib/authServer.js";
import { isTrustedOrigin } from "../_lib/requestSecurity.js";
import { supabaseServerClient } from "../_lib/supabaseServerClient.js";
import { getRequestUserId } from "../_lib/sessionAuth.js";

export const config = { runtime: "edge" };

// ---------------------------------------------------------------------------
// Inline moderation helpers (ported from server/lib/moderation.ts)
// ---------------------------------------------------------------------------

const L33T_MAP: Record<string, string> = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s",
  "7": "t", "@": "a", "$": "s", "!": "i",
};

function normalizeText(text: string): string {
  let s = text.toLowerCase();
  s = s.replace(/[0134@$!57]/g, (ch) => L33T_MAP[ch] ?? ch);
  s = s.replace(/(.)\1{2,}/g, "$1$1");
  s = s.replace(/[^a-z0-9\s]/g, "");
  return s.replace(/\s+/g, " ").trim();
}

const LINK_PATTERN = /\b(?:https?:\/\/|www\.|(?:[a-z0-9-]+\.)+(?:com|net|org|io|co|app|dev|me|gg|xyz|ly|link|site|info|biz)(?:\/\S*)?)/gi;
const MAX_LINKS = 2;
const NEW_USER_WINDOW_MS = 10 * 60_000;
const MAX_DUP_REPEATS = 3;
const AI_HOLD_THRESHOLD = 0.85;
const AI_WARN_THRESHOLD = 0.65;

type BannedWordRow = { normalized_word: string; action: string };
type ModerationVerdict = "ALLOW" | "WARN" | "HOLD" | "BLOCK";
interface ModerationResult {
  verdict: ModerationVerdict;
  reason?: string;
  matchedWord?: string;
  aiScore?: number;
}

async function getBannedWords(): Promise<BannedWordRow[]> {
  if (!supabaseServerClient) return [];
  const { data } = await supabaseServerClient
    .from("banned_words")
    .select("normalized_word, action")
    .limit(1000);
  return (data ?? []) as BannedWordRow[];
}

async function getAiToxicityScore(text: string): Promise<number | null> {
  const enabled = process.env.MODERATION_AI_ENABLED;
  if (enabled !== "true") return null;
  const apiKey = process.env.MODERATION_AI_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
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
  if (!supabaseServerClient) return false;
  const { data } = await supabaseServerClient
    .from("community_messages")
    .select("text")
    .eq("sender_id", userId)
    .order("created_at", { ascending: false })
    .limit(MAX_DUP_REPEATS);
  const repeats = (data ?? []).filter((m) => (m as { text: string }).text === text).length;
  return repeats >= MAX_DUP_REPEATS;
}

async function isNewUser(userId: string): Promise<boolean> {
  if (!supabaseServerClient) return false;
  const { data } = await supabaseServerClient
    .from("users")
    .select("created_at")
    .eq("id", userId)
    .maybeSingle();
  const createdAt = (data as { created_at?: string } | null)?.created_at;
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < NEW_USER_WINDOW_MS;
}

async function moderateText(text: string, userId: string): Promise<ModerationResult> {
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
  const linkCount = (text.match(LINK_PATTERN) ?? []).length;
  if (linkCount > MAX_LINKS) return { verdict: "BLOCK", reason: "too_many_links" };
  if (linkCount > 0 && (await isNewUser(userId))) return { verdict: "BLOCK", reason: "new_user_link_restricted" };
  if (await isDuplicateSpam(userId, text)) return { verdict: "BLOCK", reason: "duplicate_message" };
  const aiScore = await getAiToxicityScore(text);
  if (aiScore != null) {
    if (aiScore >= AI_HOLD_THRESHOLD) return { verdict: "HOLD", reason: "ai_toxicity_high", aiScore };
    if (aiScore >= AI_WARN_THRESHOLD) return { verdict: "WARN", reason: "ai_toxicity_elevated", aiScore };
    return { verdict: "ALLOW", aiScore };
  }
  return { verdict: "ALLOW" };
}

// ---------------------------------------------------------------------------
// Admin check
// ---------------------------------------------------------------------------

function isAdminUsername(username: string): boolean {
  const raw = process.env.ADMIN_USERNAMES ?? "";
  if (!raw) return false;
  const set = new Set(raw.split(",").map((v) => v.trim().toLowerCase()).filter(Boolean));
  return set.has(username.toLowerCase());
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

interface SendBody {
  communityId?: unknown;
  text?: unknown;
  identityAlias?: unknown;
  avatarLevel?: unknown;
  replyToMessageId?: unknown;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!supabaseServerClient) return json({ error: "supabase_not_configured" }, 503);
  if (!isTrustedOrigin(request)) return json({ error: "forbidden_origin" }, 403);

  const userId = await getRequestUserId(request);
  if (!userId) return json({ error: "unauthorized" }, 401);

  const body = await readJsonBody<SendBody>(request);
  if (!body) return json({ error: "invalid_json" }, 400);

  const { communityId, text, identityAlias, avatarLevel, replyToMessageId } = body;

  if (typeof communityId !== "string" || communityId.length === 0 || communityId.length > 100)
    return json({ error: "Invalid input.", details: "communityId" }, 400);
  if (typeof text !== "string" || text.trim().length === 0 || text.length > 2000)
    return json({ error: "Invalid input.", details: "text" }, 400);
  if (identityAlias !== undefined && identityAlias !== null && (typeof identityAlias !== "string" || identityAlias.length > 50))
    return json({ error: "Invalid input.", details: "identityAlias" }, 400);
  if (avatarLevel !== undefined && avatarLevel !== null && (typeof avatarLevel !== "number" || !Number.isInteger(avatarLevel) || avatarLevel < 1 || avatarLevel > 100))
    return json({ error: "Invalid input.", details: "avatarLevel" }, 400);
  if (replyToMessageId !== undefined && replyToMessageId !== null && (typeof replyToMessageId !== "string" || !/^[0-9a-f-]{36}$/.test(replyToMessageId)))
    return json({ error: "Invalid input.", details: "replyToMessageId" }, 400);

  const trimmedText = text.trim();

  const { data: user, error: userError } = await supabaseServerClient
    .from("users")
    .select("id, username, avatar_level, moderation_status")
    .eq("id", userId)
    .single();

  if (userError || !user) return json({ error: "User not found." }, 401);

  const userRow = user as { id: string; username: string; avatar_level?: number; moderation_status?: string };
  if (userRow.moderation_status === "banned") return json({ error: "Your account is banned from posting." }, 403);

  const { data: member } = await supabaseServerClient
    .from("community_members")
    .select("user_id")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!member && !isAdminUsername(userRow.username)) {
    return json({ error: "You are not a member of this community." }, 403);
  }

  let senderName: string = userRow.username;
  let senderAvatarLevel: number = userRow.avatar_level ?? 1;

  if (identityAlias) {
    const { data: alias } = await supabaseServerClient
      .from("user_aliases")
      .select("alias")
      .eq("user_id", userId)
      .eq("is_public", false)
      .ilike("alias", identityAlias as string)
      .maybeSingle();
    if (!alias) return json({ error: "Invalid identity alias." }, 403);
    senderName = (alias as { alias: string }).alias;
  }

  if (typeof avatarLevel === "number" && avatarLevel >= 1 && avatarLevel <= 100) {
    senderAvatarLevel = avatarLevel;
  }

  let replyToSenderName: string | null = null;
  let replyToText: string | null = null;

  if (replyToMessageId) {
    const { data: original } = await supabaseServerClient
      .from("community_messages")
      .select("sender_name, text")
      .eq("id", replyToMessageId as string)
      .eq("community_id", communityId)
      .maybeSingle();
    if (original) {
      replyToSenderName = (original as { sender_name: string }).sender_name;
      replyToText = (original as { text: string }).text;
    }
  }

  const modResult = await moderateText(trimmedText, userId);

  if (modResult.verdict === "BLOCK") {
    return json({ error: "Message blocked by content policy.", reason: modResult.reason }, 403);
  }

  const moderationStatus = modResult.verdict === "ALLOW" ? "ok" : modResult.verdict.toLowerCase();

  const { data: message, error: insertError } = await supabaseServerClient
    .from("community_messages")
    .insert({
      community_id: communityId,
      sender_id: userId,
      sender_name: senderName,
      sender_avatar_level: senderAvatarLevel,
      text: trimmedText,
      reply_to_message_id: replyToMessageId ?? null,
      reply_to_sender_name: replyToSenderName,
      reply_to_text: replyToText,
      moderation_status: moderationStatus,
    })
    .select("*")
    .single();

  if (insertError || !message) {
    console.error("[chat.send] insert error", insertError);
    return json({ error: "Failed to send message." }, 500);
  }

  if (modResult.verdict === "WARN" || modResult.verdict === "HOLD") {
    void supabaseServerClient.from("moderation_flags").insert({
      message_id: (message as { id: string }).id,
      community_id: communityId,
      sender_id: userId,
      matched_word: modResult.matchedWord ?? null,
      reason: modResult.reason ?? modResult.verdict,
      verdict: modResult.verdict.toLowerCase(),
      ai_score: modResult.aiScore ?? null,
    });
  }

  const row = message as Record<string, unknown>;

  return json({
    ok: true,
    message: {
      id: row.id,
      communityId: row.community_id,
      senderId: row.sender_id,
      senderName: row.sender_name,
      text: row.text,
      createdAt: row.created_at,
      pinned: row.pinned,
      replyToMessageId: row.reply_to_message_id ?? undefined,
      replyToSenderName: row.reply_to_sender_name ?? undefined,
      replyToText: row.reply_to_text ?? undefined,
      deletedAt: row.deleted_at ?? undefined,
      deletedByUserId: row.deleted_by_user_id ?? undefined,
      likedBy: (row.liked_by as string[]) ?? [],
      senderAvatarLevel: row.sender_avatar_level ?? undefined,
      moderationStatus: row.moderation_status ?? undefined,
    },
  });
}
