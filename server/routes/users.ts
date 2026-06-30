import type { Request } from "express";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth";
import { audit } from "../lib/audit";
import { userRepository } from "../lib/userRepository";
import { hashPassword, verifyPassword } from "../lib/password";
import { resolveUserRole } from "../lib/admin";
import type { AuthSessionData, UserRecord } from "../types";

const usernameRegex = /^[a-zA-Z0-9._-]{3,24}$/;

const updateProfileSchema = z
  .object({
    username: z.string().regex(usernameRegex).optional(),
    displayName: z
      .string()
      .trim()
      .min(1)
      .max(60)
      .nullable()
      .optional(),
    bio: z
      .string()
      .trim()
      .max(280)
      .nullable()
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one profile field is required.",
  });

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8).max(128),
    newPassword: z
      .string()
      .min(8)
      .max(128)
      .refine((value) => /[A-Z]/.test(value), "missing uppercase")
      .refine((value) => /[a-z]/.test(value), "missing lowercase")
      .refine((value) => /\d/.test(value), "missing number")
      .refine((value) => /[^A-Za-z0-9]/.test(value), "missing symbol"),
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    path: ["newPassword"],
    message: "New password must be different from your current password.",
  });

const changePasswordLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many password change attempts. Try again later." },
});

function getSessionData(req: Request): AuthSessionData {
  return req.session as unknown as AuthSessionData;
}

async function findAuthenticatedUser(req: Request) {
  const sessionData = getSessionData(req);
  if (!sessionData.userId) {
    return null;
  }

  const user = await userRepository.findById(sessionData.userId);
  if (!user) {
    sessionData.userId = undefined;
  }

  return user;
}

function toApiUser(user: UserRecord) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    createdAt: new Date(user.createdAt).toISOString(),
    updatedAt: new Date(user.updatedAt).toISOString(),
    passwordChangedAt: new Date(user.passwordChangedAt).toISOString(),
  };
}

export const usersRouter = Router();

// All user routes require an authenticated session.
// Individual handlers still call findAuthenticatedUser() to load the DB record,
// which also handles the edge case where a session references a deleted user.
usersRouter.use(requireAuth);

usersRouter.get("/me", async (req, res) => {
  const user = await findAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  const role = await resolveUserRole(user.id);
  return res.status(200).json({ user: { ...toApiUser(user), role } });
});

usersRouter.get("/me/referral-notifications", async (req, res) => {
  const user = await findAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  const activations = await userRepository.listReferralActivations(user.id);
  return res.status(200).json({
    notifications: activations.slice(0, 20).map((activation) => ({
      id: activation.id,
      referredUsername: activation.referredUsername,
      referralCode: activation.referralCode,
      createdAt: new Date(activation.createdAt).toISOString(),
    })),
  });
});

usersRouter.patch("/me", async (req, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid profile update payload." });
  }

  const user = await findAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  const updates = parsed.data;
  const result = await userRepository.updateProfile(user.id, {
    username: updates.username,
    displayName: updates.displayName,
    bio: updates.bio,
  });

  if (result.status === "not_found") {
    return res.status(404).json({ error: "User not found." });
  }

  if (result.status === "username_taken") {
    return res.status(409).json({ error: "That username is already taken." });
  }

  audit("user.profile.updated", {
    userId: user.id,
    ip: req.ip,
    updated: Object.keys(updates),
  });

  return res.status(200).json({ user: toApiUser(result.user) });
});

usersRouter.post("/me/change-password", changePasswordLimiter, async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid password update payload." });
  }

  const user = await findAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  const validCurrentPassword = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!validCurrentPassword) {
    audit("user.password.change_failed", { userId: user.id, ip: req.ip, reason: "invalid_current_password" }, "warn");
    return res.status(401).json({ error: "Current password is incorrect." });
  }

  const newPasswordHash = await hashPassword(parsed.data.newPassword);
  const updated = await userRepository.updatePasswordHash(user.id, newPasswordHash);
  if (!updated) {
    return res.status(404).json({ error: "User not found." });
  }

  audit("user.password.changed", { userId: user.id, ip: req.ip });
  return res.status(200).json({ ok: true });
});
