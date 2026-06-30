import { randomUUID } from "node:crypto";
import type { Request } from "express";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { env } from "../config/env";
import { audit } from "../lib/audit";
import { userRepository } from "../lib/userRepository";
import { getAnonymousVotes } from "../lib/store";
import { hashPassword, verifyPassword } from "../lib/password";
import { sendTransactionalEmail } from "../lib/email";
import type { AuthSessionData, UserRecord } from "../types";

// ---------------------------------------------------------------------------
// In-memory state
// NOTE: These maps are single-process only. In a multi-instance production
// deployment, migrate to a shared store (Redis/Postgres).
// All entries are TTL-bounded and swept by the cleanup interval below.
// ---------------------------------------------------------------------------

type LoginAttempt = {
  failures: number;
  lockedUntil: number;
  lastAttemptAt: number;
};

const loginAttempts = new Map<string, LoginAttempt>();
const magicLinks = new Map<string, { userId: string; email: string; expiresAt: number }>();

// Sweep all maps every 5 minutes so they cannot grow without bound.
setInterval(() => {
  const now = Date.now();
  const LOGIN_MAX_AGE_MS = 30 * 60 * 1000; // 2× lockout window

  for (const [key, entry] of loginAttempts) {
    const refTime = entry.lastAttemptAt > 0 ? entry.lastAttemptAt : entry.lockedUntil;
    if (refTime + LOGIN_MAX_AGE_MS < now) loginAttempts.delete(key);
  }

  for (const [token, entry] of magicLinks) {
    if (entry.expiresAt < now) magicLinks.delete(token);
  }

}, 5 * 60 * 1000).unref();

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const authErrorMessage = "Invalid username or password.";
const usernameRegex = /^[a-zA-Z0-9._-]{3,24}$/;

const signupSchema = z.object({
  username: z.string().regex(usernameRegex),
  password: z.string().min(8).max(128),
  referralCode: z.string().trim().toUpperCase().min(4).max(16),
});

const foundingInviteCodeRegex = /^RAW-[12]-[A-Z0-9]{4,16}$/;

const loginSchema = z.object({
  username: z.string().regex(usernameRegex),
  password: z.string().min(8).max(128),
});

const magicLinkRequestSchema = z.object({
  email: z.string().email(),
});

const magicLinkVerifySchema = z.object({
  token: z.string().min(20),
});

// ---------------------------------------------------------------------------
// Rate limiters
// ---------------------------------------------------------------------------

const signupLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again later." },
});

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again later." },
});

const magicLinkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many magic link requests. Try again later." },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSessionData(req: Request): AuthSessionData {
  return req.session as unknown as AuthSessionData;
}

function toAuthUser(user: UserRecord) {
  return {
    id: user.id,
    username: user.username,
    role: "member",
    status: "active",
    avatar_level: 1,
    onboarding_completed: false,
    profile_public: false,
  };
}

async function regenerateSession(session: { regenerate: (callback: (err: unknown) => void) => void }): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    session.regenerate((err: unknown) => (err ? reject(err) : resolve()));
  });
}

function getAttemptKey(username: string, ip: string): string {
  return `${username.toLowerCase()}|${ip}`;
}

function isLocked(attempt: LoginAttempt | undefined): boolean {
  return Boolean(attempt && attempt.lockedUntil > Date.now());
}

function registerFailure(key: string) {
  const attempt = loginAttempts.get(key) ?? { failures: 0, lockedUntil: 0, lastAttemptAt: 0 };
  attempt.failures += 1;
  attempt.lastAttemptAt = Date.now();

  if (attempt.failures >= 5) {
    attempt.lockedUntil = Date.now() + 15 * 60 * 1000;
    attempt.failures = 0;
  }

  loginAttempts.set(key, attempt);
}

function clearFailures(key: string) {
  loginAttempts.delete(key);
}

// Generic response for magic-link requests — same for existing and non-existing emails.
const MAGIC_LINK_GENERIC_RESPONSE = {
  message: "If that email is registered, you'll receive a link shortly.",
} as const;

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const authRouter = Router();

authRouter.post("/signup", signupLimiter, async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Unable to start signup." });
  }

  const { username, password, referralCode } = parsed.data;
  const inviter = await userRepository.findByReferralCode(referralCode);
  if (!inviter && !foundingInviteCodeRegex.test(referralCode)) {
    return res.status(403).json({ error: "Invalid invite code." });
  }

  if (await userRepository.usernameExists(username)) {
    return res.status(409).json({ error: "That username already exists." });
  }

  const passwordHash = await hashPassword(password);
  const sessionData = getSessionData(req);
  const previousAnonymousVotes = getAnonymousVotes(sessionData);
  const user = await userRepository.create({
    username,
    passwordHash,
    referralCode,
  });

  await userRepository.registerReferralActivation(referralCode, user.id);

  await regenerateSession(req.session);
  const newSession = getSessionData(req);
  newSession.userId = user.id;
  newSession.anonymousVotes = previousAnonymousVotes;

  audit("auth.signup.success", { username: user.username, ip: req.ip });
  return res.status(201).json({ ok: true, user: toAuthUser(user) });
});

authRouter.post("/login", loginLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(401).json({ error: authErrorMessage });
  }

  const { username, password } = parsed.data;
  const key = getAttemptKey(username, req.ip ?? "unknown");
  const attempt = loginAttempts.get(key);

  if (isLocked(attempt)) {
    audit("auth.login.locked", { username, ip: req.ip }, "warn");
    return res.status(429).json({ error: "Too many attempts. Try again later." });
  }

  const user = await userRepository.findByUsername(username);
  if (!user) {
    registerFailure(key);
    audit("auth.login.failed", { username, ip: req.ip, reason: "missing_user" }, "warn");
    return res.status(401).json({ error: authErrorMessage });
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    registerFailure(key);
    audit("auth.login.failed", { username, ip: req.ip, reason: "bad_password" }, "warn");
    return res.status(401).json({ error: authErrorMessage });
  }

  clearFailures(key);
  const previousAnonymousVotes = getAnonymousVotes(getSessionData(req));

  await regenerateSession(req.session);
  const newSession = getSessionData(req);
  newSession.userId = user.id;
  newSession.anonymousVotes = previousAnonymousVotes;

  audit("auth.login.success", { username, ip: req.ip });
  return res.status(200).json({ ok: true, user: toAuthUser(user) });
});

authRouter.get("/me", async (req, res) => {
  const sessionData = getSessionData(req);
  if (!sessionData.userId) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  const user = await userRepository.findById(sessionData.userId);
  if (!user) {
    sessionData.userId = undefined;
    return res.status(401).json({ error: "Not authenticated." });
  }

  return res.status(200).json({ ok: true, user: toAuthUser(user) });
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Logout failed." });
    res.clearCookie("raw.sid");
    audit("auth.logout", { ip: req.ip });
    return res.status(200).json({ ok: true });
  });
});

authRouter.post("/magic-link/request", magicLinkLimiter, async (req, res) => {
  const parsed = magicLinkRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid email address." });
  }

  const user = await userRepository.findByEmail(parsed.data.email);

  // Always return the same generic response whether the email exists or not.
  // This prevents email enumeration — callers cannot distinguish between
  // "email not registered" and "link sent successfully".
  if (!user) {
    audit("auth.magic_link.unknown_email", { ip: req.ip }, "info");
    return res.status(200).json(MAGIC_LINK_GENERIC_RESPONSE);
  }

  const token = randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "");
  magicLinks.set(token, {
    userId: user.id,
    email: parsed.data.email,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  const link = `${env.APP_BASE_URL}/login?magic_token=${encodeURIComponent(token)}`;
  await sendTransactionalEmail("magic_link", parsed.data.email, { link });

  return res.status(200).json(MAGIC_LINK_GENERIC_RESPONSE);
});

authRouter.post("/magic-link/verify", async (req, res) => {
  const parsed = magicLinkVerifySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid token." });
  }

  const entry = magicLinks.get(parsed.data.token);
  if (!entry || entry.expiresAt < Date.now()) {
    magicLinks.delete(parsed.data.token);
    return res.status(401).json({ error: "Magic link is invalid or expired." });
  }

  const previousAnonymousVotes = getAnonymousVotes(getSessionData(req));
  await regenerateSession(req.session);
  const newSession = getSessionData(req);
  newSession.userId = entry.userId;
  newSession.anonymousVotes = previousAnonymousVotes;
  magicLinks.delete(parsed.data.token);

  return res.status(200).json({ ok: true });
});
