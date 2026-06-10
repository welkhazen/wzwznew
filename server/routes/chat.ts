import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth";
import { supabaseAdmin } from "../lib/supabaseClient";
import { moderateText } from "../lib/moderation";
import { isUserAdmin } from "../lib/admin";
import { audit } from "../lib/audit";
import type { AuthSessionData } from "../types";

export const chatRouter = Router();

const sendMessageSchema = z.object({
  communityId: z.string().min(1).max(100),
  text: z.string().min(1).max(2000).transform((s) => s.trim()),
  identityAlias: z.string().max(50).nullable().optional(),
  avatarLevel: z.number().int().min(1).max(100).nullable().optional(),
  replyToMessageId: z.string().uuid().nullable().optional(),
});

chatRouter.post("/send", requireAuth, async (req, res) => {
  const session = req.session as unknown as AuthSessionData;
  const userId = session.userId!;

  const parsed = sendMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input.", details: parsed.error.flatten() });
  }

  const { communityId, text, identityAlias, avatarLevel, replyToMessageId } = parsed.data;

  if (!supabaseAdmin) {
    return res.status(503).json({ error: "Database unavailable." });
  }

  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("id, username, avatar_level, moderation_status")
    .eq("id", userId)
    .single();

  if (userError || !user) {
    return res.status(401).json({ error: "User not found." });
  }

  if ((user as { moderation_status?: string }).moderation_status === "banned") {
    return res.status(403).json({ error: "Your account is banned from posting." });
  }

  const { data: member } = await supabaseAdmin
    .from("community_members")
    .select("user_id")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .maybeSingle();

  const adminUser = await isUserAdmin(userId);

  if (!member && !adminUser) {
    return res.status(403).json({ error: "You are not a member of this community." });
  }

  let senderName: string = (user as { username: string }).username;
  let senderAvatarLevel: number = (user as { avatar_level?: number }).avatar_level ?? 1;

  if (identityAlias) {
    const { data: alias } = await supabaseAdmin
      .from("user_aliases")
      .select("alias")
      .eq("user_id", userId)
      .eq("is_public", false)
      .ilike("alias", identityAlias)
      .maybeSingle();

    if (!alias) {
      return res.status(403).json({ error: "Invalid identity alias." });
    }
    senderName = (alias as { alias: string }).alias;
  }

  if (avatarLevel && avatarLevel >= 1 && avatarLevel <= 100) {
    senderAvatarLevel = avatarLevel;
  }

  let replyToSenderName: string | null = null;
  let replyToText: string | null = null;

  if (replyToMessageId) {
    const { data: original } = await supabaseAdmin
      .from("community_messages")
      .select("sender_name, text")
      .eq("id", replyToMessageId)
      .eq("community_id", communityId)
      .maybeSingle();

    if (original) {
      replyToSenderName = (original as { sender_name: string }).sender_name;
      replyToText = (original as { text: string }).text;
    }
  }

  const modResult = await moderateText(text, userId, communityId);

  if (modResult.verdict === "BLOCK") {
    audit("chat.send.blocked", { userId, communityId, reason: modResult.reason }, "warn");
    return res.status(403).json({ error: "Message blocked by content policy.", reason: modResult.reason });
  }

  const moderationStatus = modResult.verdict === "ALLOW" ? "ok" : modResult.verdict.toLowerCase();

  const { data: message, error: insertError } = await supabaseAdmin
    .from("community_messages")
    .insert({
      community_id: communityId,
      sender_id: userId,
      sender_name: senderName,
      sender_avatar_level: senderAvatarLevel,
      text,
      reply_to_message_id: replyToMessageId ?? null,
      reply_to_sender_name: replyToSenderName,
      reply_to_text: replyToText,
      moderation_status: moderationStatus,
    })
    .select("*")
    .single();

  if (insertError || !message) {
    console.error("[chat.send] insert error", insertError);
    return res.status(500).json({ error: "Failed to send message." });
  }

  if (modResult.verdict === "WARN" || modResult.verdict === "HOLD") {
    void supabaseAdmin.from("moderation_flags").insert({
      message_id: (message as { id: string }).id,
      community_id: communityId,
      sender_id: userId,
      matched_word: modResult.matchedWord ?? null,
      reason: modResult.reason ?? modResult.verdict,
      verdict: modResult.verdict.toLowerCase(),
    });
    audit("chat.send.flagged", { userId, communityId, verdict: modResult.verdict, reason: modResult.reason }, "warn");
  }

  const row = message as Record<string, unknown>;

  return res.status(200).json({
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
});
