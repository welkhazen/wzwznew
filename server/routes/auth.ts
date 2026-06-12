import { randomUUID } from "node:crypto";
import type { Request } from "express";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { env } from "../config/env";
import { audit } from "../lib/audit";
import { getUserRepository } from "../lib/userRepository";
import { getAnonymousVotes } from "../lib/store";
import { hashPassword, verifyPassword } from "../lib/password";
import { hashPhone, normalizePhone } from "../lib/phoneHash";
import { sendOtp, verifyOtp } from "../lib/otp";
import { sendTransactionalEmail } from "../lib/email";
import type { AuthSessionData } from "../types";

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

type SignupRateEntry = {
  count: number;
  resetAt: number;
};

const loginAttempts = new Map<string, LoginAttempt>();
const magicLinks = new Map<string, { userId: string; email: string; expiresAt: number }>();
const signupByPhone = new Map<string, SignupRateEntry>();

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

  for (const [hash, entry] of signupByPhone) {
    if (entry.resetAt < now) signupByPhone.delete(hash);
  }
}, 5 * 60 * 1000).unref();

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const authErrorMessage = "Invalid username or password.";
const usernameRegex = /^[a-zA-Z0-9._-]{3,24}$/;

const signupRequestSchema = z.object({
  username: z.string().regex(usernameRegex),
  password: z
    .string()
    .min(8)
    .max(128)
    .refine((value) => /[A-Z]/.test(value), "missing uppercase")
    .refine((value) => /[a-z]/.test(value), "missing lowercase")
    .refine((value) => /\d/.test(value), "missing number")
    .refine((value) => /[^A-Za-z0-9]/.test(value), "missing symbol"),
  phone: z.string().min(8).max(24),
  referralCode: z.string().trim().toUpperCase().min(4).max(16).optional(),
});

const loginSchema = z.object({
  username: z.string().regex(usernameRegex),
  password: z.string().min(8).max(128),
});

const codeSchema = z.object({
  code: z.string().regex(/^\d{6}$/),
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

function isPhoneRateLimited(phoneHash: string): boolean {
  const entry = signupByPhone.get(phoneHash);
  if (!entry) return false;
  if (Date.now() > entry.resetAt) {
    signupByPhone.delete(phoneHash);
    return false;
  }
  return entry.count >= 3;
}

function incrementPhoneSendCount(phoneHash: string): void {
  const entry = signupByPhone.get(phoneHash);
  if (!entry || Date.now() > entry.resetAt) {
    signupByPhone.set(phoneHash, { count: 1, resetAt: Date.now() + 10 * 60 * 1000 });
  } else {
    entry.count += 1;
  }
}

// Generic response for magic-link requests — same for existing and non-existing emails.
const MAGIC_LINK_GENERIC_RESPONSE = {
  message: "If that email is registered, you'll receive a link shortly.",
} as const;

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const authRouter = Router();
const userRepository = getUserRepository();

authRouter.post("/signup/request-otp", signupLimiter, async (req, res) => {
  const parsed = signupRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Unable to start signup." });
  }

  const { username, password, phone, referralCode } = parsed.data;
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return res.status(400).json({ error: "Please enter a valid phone number with country code, e.g. +447911123456." });
  }

  if (env.SIGNUP_INVITE_ONLY === "true") {
    if (!referralCode) {
      return res.status(403).json({ error: "Signup requires an invite code." });
    }
    const inviter = await userRepository.findByReferralCode(referralCode);
    if (!inviter) {
      return res.status(403).json({ error: "Invalid invite code." });
    }
  }

  if (await userRepository.usernameExists(username)) {
    return res.status(409).json({ error: "That username already exists." });
  }

  const phoneHash = hashPhone(normalizedPhone);
  if (await userRepository.phoneHashExists(phoneHash)) {
    return res.status(409).json({ error: "That phone number is already in use." });
  }

  if (isPhoneRateLimited(phoneHash)) {
    audit("auth.signup.rate_limited", { username, ip: req.ip }, "warn");
    return res.status(429).json({ error: "Too many verification requests. Try again in 10 minutes." });
  }

  incrementPhoneSendCount(phoneHash);
  const result = await sendOtp(normalizedPhone);
  if (!result.ok) {
    audit("auth.signup.otp_send_failed", { username, ip: req.ip, reason: result.error }, "warn");
    return res.status(502).json({ error: result.error });
  }

  const passwordHash = await hashPassword(password);
  const sessionData = getSessionData(req);
  sessionData.pendingSignup = {
    username,
    passwordHash,
    phone: normalizedPhone,
    phoneHash,
    referralCode,
    sentAt: Date.now(),
    attempts: 0,
  };

  audit("auth.signup.otp_sent", { username, ip: req.ip, channels: result.channels });
  return res.status(200).json({ ok: true, channels: result.channels });
});

authRouter.post("/signup/verify", async (req, res) => {
  const sessionData = getSessionData(req);
  const pendingSignup = sessionData.pendingSignup;

  if (!pendingSignup) {
    return res.status(400).json({ error: "No pending signup verification. Please request a new code." });
  }

  if (Date.now() - pendingSignup.sentAt > 10 * 60 * 1000) {
    delete sessionData.pendingSignup;
    return res.status(400).json({ error: "Verification code expired. Please request a new one." });
  }

  if (
    (await userRepository.usernameExists(pendingSignup.username)) ||
    (await userRepository.phoneHashExists(pendingSignup.phoneHash))
  ) {
    delete sessionData.pendingSignup;
    return res.status(409).json({ error: "That account can no longer be created. Start signup again." });
  }

  const parsed = codeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Enter the 6-digit code we sent you." });
  }

  const approved = await verifyOtp(pendingSignup.phone, parsed.data.code);
  if (!approved) {
    pendingSignup.attempts += 1;
    if (pendingSignup.attempts >= 5) {
      delete sessionData.pendingSignup;
      audit("auth.signup.otp_locked", { username: pendingSignup.username, ip: req.ip }, "warn");
      return res.status(429).json({ error: "Too many failed attempts. Start signup again." });
    }

    audit("auth.signup.otp_failed", { username: pendingSignup.username, ip: req.ip, attempts: pendingSignup.attempts }, "warn");
    return res.status(401).json({ error: "Incorrect code. Please try again." });
  }

  const previousAnonymousVotes = getAnonymousVotes(sessionData);
  const user = await userRepository.create({
    username: pendingSignup.username,
    passwordHash: pendingSignup.passwordHash,
    phoneHash: pendingSignup.phoneHash,
  });

  if (pendingSignup.referralCode) {
    await userRepository.registerReferralActivation(pendingSignup.referralCode, user.id);
  }

  await regenerateSession(req.session);
  const newSession = getSessionData(req);
  newSession.userId = user.id;
  newSession.anonymousVotes = previousAnonymousVotes;

  audit("auth.signup.success", { username: user.username, ip: req.ip });
  return res.status(201).json({ ok: true });
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
  return res.status(200).json({ ok: true });
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
