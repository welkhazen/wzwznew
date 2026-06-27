import type { AuthSessionData, BootstrapResponse, Poll, ReferralActivationRecord, User, UserRecord } from "../types";
import { POLL_QUESTION_SEEDS } from "../../src/features/polls/pollQuestions";

const polls: Poll[] = POLL_QUESTION_SEEDS.map((poll, index) => ({
  id: poll.id,
  question: poll.question,
  options: [
    { id: `p${index + 1}-yes`, text: "Yes", votes: poll.yesVotes },
    { id: `p${index + 1}-no`, text: "No", votes: poll.noVotes },
  ],
  locked: false,
}));

const usersById = new Map<string, UserRecord>();
const userIdByUsername = new Map<string, string>();
const userIdByReferralCode = new Map<string, string>();
const referralActivationsByInviterId = new Map<string, ReferralActivationRecord[]>();

function normalizeUsername(username: string): string {
  return username.toLowerCase();
}

export type UpdateUserProfileInput = {
  username?: string;
  displayName?: string | null;
  bio?: string | null;
};

export function findUserById(userId: string): UserRecord | null {
  return usersById.get(userId) ?? null;
}

export function findUserByUsername(username: string): UserRecord | null {
  const userId = userIdByUsername.get(normalizeUsername(username));
  return userId ? usersById.get(userId) ?? null : null;
}

export function findUserByReferralCode(referralCode: string): UserRecord | null {
  const userId = userIdByReferralCode.get(referralCode.toUpperCase());
  return userId ? usersById.get(userId) ?? null : null;
}

export function recordReferralActivation(referralCode: string, referredUserId: string): void {
  const normalizedReferralCode = referralCode.toUpperCase();
  const inviter = findUserByReferralCode(normalizedReferralCode);
  const referredUser = findUserById(referredUserId);
  if (!inviter || !referredUser || inviter.id === referredUser.id) return;

  const existing = referralActivationsByInviterId.get(inviter.id) ?? [];
  if (existing.some((activation) => activation.referredUserId === referredUser.id)) return;

  referralActivationsByInviterId.set(inviter.id, [
    {
      id: crypto.randomUUID(),
      inviterUserId: inviter.id,
      referredUserId: referredUser.id,
      referredUsername: referredUser.username,
      referralCode: normalizedReferralCode,
      createdAt: Date.now(),
    },
    ...existing,
  ]);
}

export function listReferralActivationsForInviter(userId: string): ReferralActivationRecord[] {
  return [...(referralActivationsByInviterId.get(userId) ?? [])];
}

function buildReferralCode(username: string): string {
  const base = username.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "RAW";
  let candidate = `${base}${Math.floor(Math.random() * 900 + 100)}`;
  while (userIdByReferralCode.has(candidate)) {
    candidate = `${base}${Math.floor(Math.random() * 900 + 100)}`;
  }
  return candidate;
}

export function createUser(username: string, passwordHash: string, referralCode?: string): UserRecord {
  const id = crypto.randomUUID();
  const now = Date.now();
  const normalizedReferralCode = (referralCode ?? buildReferralCode(username)).toUpperCase();
  const user: UserRecord = {
    id,
    username,
    displayName: null,
    bio: null,
    referralCode: normalizedReferralCode,
    createdAt: now,
    updatedAt: now,
    passwordChangedAt: now,
    passwordHash,
    votedPollIds: new Set<string>(),
  };

  usersById.set(id, user);
  userIdByUsername.set(normalizeUsername(username), id);
  userIdByReferralCode.set(normalizedReferralCode, id);
  return user;
}

export function usernameExists(username: string): boolean {
  return userIdByUsername.has(normalizeUsername(username));
}

export function updateUserProfile(
  userId: string,
  updates: UpdateUserProfileInput
): { status: "not_found" | "username_taken" | "ok"; user?: UserRecord } {
  const user = usersById.get(userId);
  if (!user) {
    return { status: "not_found" };
  }

  if (typeof updates.username === "string") {
    const requestedUsernameKey = normalizeUsername(updates.username);
    const existingUserId = userIdByUsername.get(requestedUsernameKey);

    if (existingUserId && existingUserId !== user.id) {
      return { status: "username_taken" };
    }

    const currentUsernameKey = normalizeUsername(user.username);
    if (requestedUsernameKey !== currentUsernameKey) {
      userIdByUsername.delete(currentUsernameKey);
      userIdByUsername.set(requestedUsernameKey, user.id);
      user.username = updates.username;
    }
  }

  if (Object.prototype.hasOwnProperty.call(updates, "displayName")) {
    user.displayName = updates.displayName ?? null;
  }

  if (Object.prototype.hasOwnProperty.call(updates, "bio")) {
    user.bio = updates.bio ?? null;
  }

  user.updatedAt = Date.now();
  return { status: "ok", user };
}

export function updateUserPasswordHash(userId: string, passwordHash: string): boolean {
  const user = usersById.get(userId);
  if (!user) {
    return false;
  }

  const now = Date.now();
  user.passwordHash = passwordHash;
  user.passwordChangedAt = now;
  user.updatedAt = now;
  return true;
}

function clonePolls(): Poll[] {
  return polls.map((poll) => ({
    ...poll,
    options: poll.options.map((option) => ({ ...option })),
  }));
}

export function getAnonymousVotes(sessionData: AuthSessionData): string[] {
  if (!Array.isArray(sessionData.anonymousVotes)) {
    sessionData.anonymousVotes = [];
  }

  return sessionData.anonymousVotes;
}

export function buildBootstrap(user: UserRecord | null, sessionData: AuthSessionData): BootstrapResponse {
  const votedPollIds = user ? [...user.votedPollIds] : getAnonymousVotes(sessionData);

  return {
    user: user ? toPublicUser(user) : null,
    isLoggedIn: Boolean(user),
    polls: clonePolls(),
    votedPollIds,
    freeVotesUsed: votedPollIds.length,
  };
}

export function toPublicUser(user: UserRecord): User {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    referralCode: user.referralCode,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    passwordChangedAt: user.passwordChangedAt,
  };
}

export function canVote(user: UserRecord | null, sessionData: AuthSessionData, pollId: string) {
  if (user) {
    if (user.votedPollIds.has(pollId)) {
      return { ok: false, reason: "already_voted" as const };
    }

    return { ok: true as const };
  }

  const anonVotes = getAnonymousVotes(sessionData);
  if (anonVotes.includes(pollId)) {
    return { ok: false, reason: "already_voted" as const };
  }

  if (anonVotes.length >= 3) {
    return { ok: false, reason: "auth_required" as const };
  }

  return { ok: true as const };
}

export function applyVote(user: UserRecord | null, sessionData: AuthSessionData, pollId: string, optionId: string): boolean {
  const poll = polls.find((item) => item.id === pollId);
  if (!poll) {
    return false;
  }

  const option = poll.options.find((item) => item.id === optionId);
  if (!option) {
    return false;
  }

  option.votes += 1;

  if (user) {
    user.votedPollIds.add(pollId);
  } else {
    getAnonymousVotes(sessionData).push(pollId);
  }

  return true;
}

export function recordPollVote(user: UserRecord | null, sessionData: AuthSessionData, pollId: string): void {
  if (user) {
    user.votedPollIds.add(pollId);
    return;
  }

  getAnonymousVotes(sessionData).push(pollId);
}
