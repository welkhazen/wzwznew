import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth";
import { isUserAdmin } from "../lib/admin";
import { supabaseAdmin } from "../lib/supabaseClient";
import { normalizeText, invalidateBannedWordsCache } from "../lib/moderation";
import { audit } from "../lib/audit";
import type { AuthSessionData } from "../types";

export const moderationRouter = Router();

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const session = req.session as unknown as AuthSessionData;
  const admin = await isUserAdmin(session.userId!);
  if (!admin) return res.status(403).json({ error: "Admin access required." });
  return next();
}

// ── Flags ───────────────────────────────────────────────────────────────────

moderationRouter.get("/flags", requireAuth, requireAdmin, async (_req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "Database unavailable." });
  const { data, error } = await supabaseAdmin
    .from("moderation_flags")
    .select("*, community_messages(id, text, sender_name, community_id, created_at)")
    .eq("reviewed", false)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return res.status(500).json({ error: "Failed to fetch flags." });
  return res.json({ flags: data ?? [] });
});

moderationRouter.post("/flags/:id/approve", requireAuth, requireAdmin, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "Database unavailable." });
  const session = req.session as unknown as AuthSessionData;
  const actorId = session.userId!;
  const { data: flag } = await supabaseAdmin
    .from("moderation_flags")
    .select("message_id")
    .eq("id", req.params.id)
    .maybeSingle();
  await supabaseAdmin.from("moderation_flags").update({
    reviewed: true, reviewed_by: actorId, reviewed_at: new Date().toISOString(),
  }).eq("id", req.params.id);
  if (flag && (flag as { message_id?: string }).message_id) {
    await supabaseAdmin.from("community_messages")
      .update({ moderation_status: "ok" })
      .eq("id", (flag as { message_id: string }).message_id);
  }
  return res.json({ ok: true });
});

moderationRouter.post("/flags/:id/remove", requireAuth, requireAdmin, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "Database unavailable." });
  const session = req.session as unknown as AuthSessionData;
  const actorId = session.userId!;
  const { data: flag } = await supabaseAdmin
    .from("moderation_flags")
    .select("message_id, sender_id")
    .eq("id", req.params.id)
    .maybeSingle();
  await supabaseAdmin.from("moderation_flags").update({
    reviewed: true, reviewed_by: actorId, reviewed_at: new Date().toISOString(),
  }).eq("id", req.params.id);
  if (flag && (flag as { message_id?: string }).message_id) {
    await supabaseAdmin.from("community_messages").update({
      is_deleted: true, deleted_by: actorId, deleted_reason: "moderation_flag",
    }).eq("id", (flag as { message_id: string }).message_id);
  }
  audit("moderation.flag.removed", { flagId: req.params.id, actorId }, "warn");
  return res.json({ ok: true });
});

// ── Reports ─────────────────────────────────────────────────────────────────

moderationRouter.get("/reports", requireAuth, requireAdmin, async (_req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "Database unavailable." });
  const { data, error } = await supabaseAdmin
    .from("chat_reports")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return res.status(500).json({ error: "Failed to fetch reports." });
  return res.json({ reports: data ?? [] });
});

const resolveReportSchema = z.object({
  status: z.enum(["dismissed", "warned", "banned", "reviewed"]),
  deleteMessage: z.boolean().optional(),
});

moderationRouter.post("/reports/:id/resolve", requireAuth, requireAdmin, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "Database unavailable." });
  const session = req.session as unknown as AuthSessionData;
  const actorId = session.userId!;
  const parsed = resolveReportSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input." });
  const { status, deleteMessage } = parsed.data;

  const { data: report } = await supabaseAdmin
    .from("chat_reports").select("*").eq("id", req.params.id).maybeSingle();
  if (!report) return res.status(404).json({ error: "Report not found." });

  const r = report as Record<string, unknown>;

  if ((status === "warned" || status === "banned") && r.reported_user_id) {
    await supabaseAdmin.from("users").update({
      moderation_status: status,
      moderated_by: actorId,
      last_moderated_at: new Date().toISOString(),
    }).eq("id", r.reported_user_id as string);
    await supabaseAdmin.from("moderation_actions").insert({
      target_user_id: r.reported_user_id,
      actor_id: actorId,
      action: status === "warned" ? "warn" : "ban",
      reason: `report:${req.params.id}`,
    });
  }

  if (deleteMessage && r.message_id) {
    await supabaseAdmin.from("community_messages").update({
      is_deleted: true, deleted_by: actorId, deleted_reason: `report:${req.params.id}`,
    }).eq("id", r.message_id as string);
  }

  const { error } = await supabaseAdmin.from("chat_reports").update({
    status, resolved_at: new Date().toISOString(), resolved_by: actorId,
  }).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: "Failed to resolve report." });

  audit("moderation.report.resolved", { reportId: req.params.id, status, actorId }, "warn");
  return res.json({ ok: true });
});

// ── Actions ──────────────────────────────────────────────────────────────────

const deleteMessageSchema = z.object({
  messageId: z.string().uuid(),
  reason: z.string().min(1).max(500),
});

moderationRouter.post("/actions/delete-message", requireAuth, requireAdmin, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "Database unavailable." });
  const session = req.session as unknown as AuthSessionData;
  const actorId = session.userId!;
  const parsed = deleteMessageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input." });
  const { messageId, reason } = parsed.data;
  const { error } = await supabaseAdmin.from("community_messages").update({
    is_deleted: true, deleted_by: actorId, deleted_reason: reason,
  }).eq("id", messageId);
  if (error) return res.status(500).json({ error: "Failed to delete message." });
  audit("moderation.message.deleted", { messageId, reason, actorId }, "warn");
  return res.json({ ok: true });
});

const userActionSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(["warn", "ban", "unban"]),
  reason: z.string().min(1).max(500),
});

moderationRouter.post("/actions/user", requireAuth, requireAdmin, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "Database unavailable." });
  const session = req.session as unknown as AuthSessionData;
  const actorId = session.userId!;
  const parsed = userActionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input." });
  const { userId, action, reason } = parsed.data;
  const newStatus = action === "unban" ? "active" : action === "warn" ? "warned" : "banned";
  await supabaseAdmin.from("users").update({
    moderation_status: newStatus,
    moderated_by: actorId,
    last_moderated_at: new Date().toISOString(),
  }).eq("id", userId);
  await supabaseAdmin.from("moderation_actions").insert({
    target_user_id: userId, actor_id: actorId, action, reason,
  });
  audit("moderation.user.action", { userId, action, reason, actorId }, "warn");
  return res.json({ ok: true });
});

// ── User safety score ────────────────────────────────────────────────────────

moderationRouter.get("/users/:userId/safety", requireAuth, requireAdmin, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "Database unavailable." });
  const { data } = await supabaseAdmin
    .from("user_safety_scores").select("*").eq("user_id", req.params.userId).maybeSingle();
  return res.json({ score: data ?? { user_id: req.params.userId, score: 100 } });
});

// ── Banned words ─────────────────────────────────────────────────────────────

moderationRouter.get("/banned-words", requireAuth, requireAdmin, async (_req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "Database unavailable." });
  const { data, error } = await supabaseAdmin
    .from("banned_words")
    .select("id, word, action, category, created_at")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Failed to fetch banned words." });
  return res.json({ words: data ?? [] });
});

const addBannedWordSchema = z.object({
  word: z.string().min(1).max(100),
  action: z.enum(["warn", "hold", "block"]),
  category: z.string().max(50).default("general"),
});

moderationRouter.post("/banned-words", requireAuth, requireAdmin, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "Database unavailable." });
  const session = req.session as unknown as AuthSessionData;
  const actorId = session.userId!;
  const parsed = addBannedWordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input." });
  const { word, action, category } = parsed.data;
  const normalized = normalizeText(word);
  const { error } = await supabaseAdmin.from("banned_words").insert({
    word, normalized_word: normalized, action, category, added_by: actorId,
  });
  if (error) return res.status(409).json({ error: "Word already exists or insert failed." });
  invalidateBannedWordsCache();
  audit("moderation.banned_word.added", { word, action, category, actorId });
  return res.json({ ok: true });
});

moderationRouter.delete("/banned-words/:id", requireAuth, requireAdmin, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "Database unavailable." });
  const { error } = await supabaseAdmin.from("banned_words").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: "Failed to delete." });
  invalidateBannedWordsCache();
  return res.json({ ok: true });
});

// ── Appeals ──────────────────────────────────────────────────────────────────

moderationRouter.get("/appeals", requireAuth, requireAdmin, async (_req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "Database unavailable." });
  const { data, error } = await supabaseAdmin
    .from("appeals")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return res.status(500).json({ error: "Failed to fetch appeals." });
  return res.json({ appeals: data ?? [] });
});

const reviewAppealSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

moderationRouter.post("/appeals/:id/review", requireAuth, requireAdmin, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "Database unavailable." });
  const session = req.session as unknown as AuthSessionData;
  const actorId = session.userId!;
  const parsed = reviewAppealSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input." });
  const { status } = parsed.data;
  const { data: appeal } = await supabaseAdmin
    .from("appeals").select("user_id, action_id").eq("id", req.params.id).maybeSingle();
  if (!appeal) return res.status(404).json({ error: "Appeal not found." });
  await supabaseAdmin.from("appeals").update({
    status, reviewed_by: actorId, reviewed_at: new Date().toISOString(),
  }).eq("id", req.params.id);
  if (status === "approved" && (appeal as { user_id?: string }).user_id) {
    await supabaseAdmin.from("users").update({
      moderation_status: "active", moderated_by: actorId, last_moderated_at: new Date().toISOString(),
    }).eq("id", (appeal as { user_id: string }).user_id);
  }
  audit("moderation.appeal.reviewed", { appealId: req.params.id, status, actorId }, "warn");
  return res.json({ ok: true });
});
