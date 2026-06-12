import type { Request } from "express";
import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env";
import { requireAuth } from "../middleware/requireAuth";
import type { AuthSessionData } from "../types";
import { sendTransactionalEmail } from "../lib/email";
import { isUserAdmin } from "../lib/admin";

const inviteSchema = z.object({
  to: z.string().email(),
  communityName: z.string().min(2).max(80),
  inviteLink: z.string().url().refine(
    (url) => {
      try {
        return new URL(url).origin === new URL(env.APP_BASE_URL).origin;
      } catch {
        return false;
      }
    },
    "Invite link must be on the app domain."
  ),
});

const digestSchema = z.object({
  to: z.string().email(),
  summary: z.string().min(4).max(1000),
});

const atRiskSchema = z.object({
  to: z.string().email(),
  username: z.string().min(1).max(30),
  streakDays: z.coerce.number().int().min(1).max(3650),
});

const communityPushSchema = z.object({
  recipientUserIds: z.array(z.string().min(1)).min(1).max(100),
  title: z.string().min(1).max(80),
  body: z.string().min(1).max(180),
  url: z.string().url().optional(),
});

function getUserId(req: Request): string | undefined {
  const session = req.session as unknown as AuthSessionData;
  return session.userId;
}

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

async function sendOneSignalPush(params: z.infer<typeof communityPushSchema>) {
  if (!env.ONESIGNAL_APP_ID || !env.ONESIGNAL_REST_API_KEY) {
    return { ok: false as const, status: 503, error: "onesignal_not_configured" };
  }

  const response = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      "authorization": `Key ${env.ONESIGNAL_REST_API_KEY}`,
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      app_id: env.ONESIGNAL_APP_ID,
      target_channel: "push",
      include_aliases: {
        external_id: [...new Set(params.recipientUserIds)],
      },
      headings: { en: params.title },
      contents: { en: params.body },
      url: params.url ?? env.APP_BASE_URL,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return { ok: false as const, status: response.status, error: detail || "onesignal_send_failed" };
  }

  return { ok: true as const };
}


notificationsRouter.post("/community-push", async (req, res) => {
  const userId = getUserId(req);
  if (!userId || !(await isUserAdmin(userId))) {
    return res.status(403).json({ error: "Admin permissions required." });
  }

  const parsed = communityPushSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid push payload." });
  }

  const result = await sendOneSignalPush(parsed.data);
  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(200).json({ ok: true });
});

notificationsRouter.post("/community-invite", async (req, res) => {
  const userId = getUserId(req);
  if (!userId || !(await isUserAdmin(userId))) {
    return res.status(403).json({ error: "Admin permissions required." });
  }

  const parsed = inviteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid invite payload." });
  }

  await sendTransactionalEmail("community_invite", parsed.data.to, {
    inviter: "raW community",
    communityName: parsed.data.communityName,
    inviteLink: parsed.data.inviteLink,
  });

  return res.status(200).json({ ok: true });
});

notificationsRouter.post("/weekly-digest", async (req, res) => {
  const userId = getUserId(req);
  if (!userId || !(await isUserAdmin(userId))) {
    return res.status(403).json({ error: "Admin permissions required." });
  }

  const parsed = digestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid digest payload." });
  }

  await sendTransactionalEmail("weekly_digest", parsed.data.to, {
    summary: parsed.data.summary,
  });

  return res.status(200).json({ ok: true });
});

notificationsRouter.post("/streak-at-risk", async (req, res) => {
  const userId = getUserId(req);
  if (!userId || !(await isUserAdmin(userId))) {
    return res.status(403).json({ error: "Admin permissions required." });
  }

  const parsed = atRiskSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid streak payload." });
  }

  await sendTransactionalEmail("streak_at_risk", parsed.data.to, {
    username: parsed.data.username,
    streakDays: String(parsed.data.streakDays),
  });

  return res.status(200).json({ ok: true });
});
