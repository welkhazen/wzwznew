import { timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import { Router } from "express";
import { env } from "../config/env";
import { runStreakResetAtUtc, sendStreakAtRiskEmailsUtc } from "../lib/streakCron";

export const cronRouter = Router();

/**
 * Constant-time string comparison to prevent timing attacks on the cron secret.
 * Returns false immediately if lengths differ (no information leak from length).
 */
function safeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function isAuthorized(req: Request): boolean {
  if (!env.CRON_SECRET) return false;

  const authHeader = req.headers.authorization;
  if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) return false;

  const token = authHeader.slice("Bearer ".length);
  return safeCompare(token, env.CRON_SECRET);
}

cronRouter.post("/streaks/reset", async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized cron request." });
  }

  const result = await runStreakResetAtUtc();
  return res.status(200).json({ ok: true, ...result });
});

cronRouter.post("/streaks/at-risk", async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized cron request." });
  }

  const result = await sendStreakAtRiskEmailsUtc();
  return res.status(200).json({ ok: true, ...result });
});
