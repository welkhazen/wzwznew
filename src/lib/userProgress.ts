import { supabase } from "@/lib/supabase";

export interface UserProgress {
  xp: number;
  level: number;
  totalPollsAnswered: number;
  streakDays: number;
}

export const XP_REWARDS = {
  POLL_VOTE: 10,
  ONBOARDING_COMPLETE: 50,
  COMMUNITY_MESSAGE: 5,
  DAILY_LOGIN: 50,
} as const;

// XP needed to reach each level (1-indexed, level 11 = max sentinel)
export const LEVEL_THRESHOLDS = [0, 0, 500, 1500, 3500, 7000, 12000, 19000, 28000, 38000, 50000, Infinity];
const LOCAL_PROGRESS_KEY_PREFIX = "raw.local-user-progress.";
const LOCAL_CLAIMS_KEY_PREFIX = "raw.local-user-xp-claims.";
const LOCAL_LOGIN_DAYS_KEY_PREFIX = "raw.local-login-days.";
const USE_LOCAL_XP_ONLY = true;

export function xpForLevel(level: number): number {
  return LEVEL_THRESHOLDS[Math.min(level, LEVEL_THRESHOLDS.length - 1)] ?? Infinity;
}

export function xpProgressInLevel(xp: number, level: number): { current: number; needed: number; pct: number } {
  const start = xpForLevel(level);
  const end = xpForLevel(level + 1);
  if (end === Infinity) return { current: xp - start, needed: 0, pct: 100 };
  const current = xp - start;
  const needed = end - start;
  return { current, needed, pct: Math.min(100, Math.round((current / needed) * 100)) };
}

function calculateLevel(xp: number): number {
  for (let level = 10; level >= 1; level -= 1) {
    if (xp >= xpForLevel(level)) return level;
  }
  return 1;
}

function readLocalProgress(userId: string): UserProgress {
  if (typeof window === "undefined") {
    return { xp: 0, level: 1, totalPollsAnswered: 0, streakDays: 0 };
  }

  try {
    const raw = window.localStorage.getItem(`${LOCAL_PROGRESS_KEY_PREFIX}${userId}`);
    if (!raw) return { xp: 0, level: 1, totalPollsAnswered: 0, streakDays: 0 };
    const parsed = JSON.parse(raw) as Partial<UserProgress>;
    const xp = Math.max(0, Number(parsed.xp) || 0);
    return {
      xp,
      level: calculateLevel(xp),
      totalPollsAnswered: Math.max(0, Number(parsed.totalPollsAnswered) || 0),
      streakDays: Math.max(0, Number(parsed.streakDays) || 0),
    };
  } catch {
    return { xp: 0, level: 1, totalPollsAnswered: 0, streakDays: 0 };
  }
}

function writeLocalProgress(userId: string, progress: UserProgress): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${LOCAL_PROGRESS_KEY_PREFIX}${userId}`, JSON.stringify(progress));
}

function awardLocalXP(userId: string, amount: number): AwardXPResult {
  const previous = readLocalProgress(userId);
  const xp = previous.xp + Math.max(0, amount);
  const level = calculateLevel(xp);
  writeLocalProgress(userId, { ...previous, xp, level });
  return { xp, level, leveledUp: level > previous.level };
}

export interface AwardXPResult {
  xp: number;
  level: number;
  leveledUp: boolean;
  awarded?: boolean;
}

export async function loadUserProgress(userId: string): Promise<UserProgress | null> {
  if (USE_LOCAL_XP_ONLY) return readLocalProgress(userId);

  const { data, error } = await supabase.rpc("get_user_progress", {
    p_user_id: userId,
  }).catch(() => ({ data: null, error: true }));

  if (error || !data) return readLocalProgress(userId);
  const progress = data as { xp: number; level: number; total_polls_answered: number; streak_days: number };
  return {
    xp: progress.xp,
    level: progress.level,
    totalPollsAnswered: progress.total_polls_answered,
    streakDays: progress.streak_days,
  };
}

export async function awardXP(
  userId: string,
  amount: number
): Promise<AwardXPResult | null> {
  if (USE_LOCAL_XP_ONLY) return awardLocalXP(userId, amount);

  const { data, error } = await supabase.rpc("award_xp", {
    p_user_id: userId,
    p_amount: amount,
  }).catch(() => ({ data: null, error: true }));

  if (error || !data) return awardLocalXP(userId, amount);
  return {
    xp: (data as { xp: number; level: number; leveled_up: boolean }).xp,
    level: (data as { xp: number; level: number; leveled_up: boolean }).level,
    leveledUp: (data as { xp: number; level: number; leveled_up: boolean }).leveled_up,
  };
}

export async function awardXPOnce(
  userId: string,
  source: string,
  claimKey: string,
  amount: number
): Promise<AwardXPResult | null> {
  if (USE_LOCAL_XP_ONLY) {
    const claims = new Set(loadLocalXPClaimKeys(userId, source));
    if (claims.has(claimKey)) {
      const progress = readLocalProgress(userId);
      return { xp: progress.xp, level: progress.level, leveledUp: false, awarded: false };
    }

    claims.add(claimKey);
    writeLocalXPClaimKeys(userId, source, [...claims]);
    return { ...awardLocalXP(userId, amount), awarded: true };
  }

  const { data, error } = await supabase.rpc("award_xp_once", {
    p_user_id: userId,
    p_source: source,
    p_claim_key: claimKey,
    p_amount: amount,
  }).catch(() => ({ data: null, error: true }));

  if (error || !data) {
    const claims = new Set(loadLocalXPClaimKeys(userId, source));
    if (claims.has(claimKey)) {
      const progress = readLocalProgress(userId);
      return { xp: progress.xp, level: progress.level, leveledUp: false, awarded: false };
    }

    claims.add(claimKey);
    writeLocalXPClaimKeys(userId, source, [...claims]);
    return { ...awardLocalXP(userId, amount), awarded: true };
  }
  const result = data as { xp: number; level: number; leveled_up: boolean; awarded: boolean };
  return {
    xp: result.xp,
    level: result.level,
    leveledUp: result.leveled_up,
    awarded: result.awarded,
  };
}

export async function loadUserXPClaimKeys(userId: string, source: string): Promise<string[]> {
  if (USE_LOCAL_XP_ONLY) return loadLocalXPClaimKeys(userId, source);

  const { data, error } = await supabase.rpc("get_user_xp_claim_keys", {
    p_user_id: userId,
    p_source: source,
  }).catch(() => ({ data: null, error: true }));

  if (error || !data) return loadLocalXPClaimKeys(userId, source);
  return data as string[];
}

function loadLocalXPClaimKeys(userId: string, source: string): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(`${LOCAL_CLAIMS_KEY_PREFIX}${userId}.${source}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeLocalXPClaimKeys(userId: string, source: string, claimKeys: string[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${LOCAL_CLAIMS_KEY_PREFIX}${userId}.${source}`, JSON.stringify(claimKeys));
}

export function recordLocalLoginDay(userId: string, dayKey: string): string[] {
  if (typeof window === "undefined") return [dayKey];

  const key = `${LOCAL_LOGIN_DAYS_KEY_PREFIX}${userId}`;
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    const days = new Set(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []);
    days.add(dayKey);
    const next = [...days].sort();
    window.localStorage.setItem(key, JSON.stringify(next));
    return next;
  } catch {
    window.localStorage.setItem(key, JSON.stringify([dayKey]));
    return [dayKey];
  }
}

export function loadLocalLoginDays(userId: string): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(`${LOCAL_LOGIN_DAYS_KEY_PREFIX}${userId}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}
