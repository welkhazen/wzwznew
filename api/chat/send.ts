import { json, readJsonBody } from "../_lib/authServer.js";
import { isTrustedOrigin } from "../_lib/requestSecurity.js";
import { supabaseServerClient } from "../_lib/supabaseServerClient.js";
import { getRequestUserId } from "../_lib/sessionAuth.js";
import {
  assertUserTextAllowed,
  getUserTextModerationMessage,
  UserTextModerationError,
} from "../_lib/userTextModeration.js";

export const config = { runtime: "edge" };

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

  let moderatedText: string;
  try {
    moderatedText = assertUserTextAllowed(text);
  } catch (error) {
    if (error instanceof UserTextModerationError) {
      return json({ error: "moderation_blocked", details: getUserTextModerationMessage(error.result) }, 400);
    }
    throw error;
  }

  const { data: user, error: userError } = await supabaseServerClient
    .from("users")
    .select("id, username, avatar_level")
    .eq("id", userId)
    .single();

  if (userError || !user) return json({ error: "User not found." }, 401);

  const userRow = user as { id: string; username: string; avatar_level?: number };

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

  const { data: message, error: insertError } = await supabaseServerClient
    .from("community_messages")
    .insert({
      community_id: communityId,
      sender_id: userId,
      sender_name: senderName,
      sender_avatar_level: senderAvatarLevel,
      text: moderatedText,
      reply_to_message_id: replyToMessageId ?? null,
      reply_to_sender_name: replyToSenderName,
      reply_to_text: replyToText,
    })
    .select("*")
    .single();

  if (insertError || !message) {
    console.error("[chat.send] insert error", insertError);
    return json({ error: "Failed to send message." }, 500);
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
    },
  });
}
