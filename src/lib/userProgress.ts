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
  DAILY_LOGIN: 15,
} as const;

// XP needed to reach each level (1-indexed, level 11 = max sentinel)
export const LEVEL_THRESHOLDS = [0, 0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, Infinity];

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

export async function loadUserProgress(userId: string): Promise<UserProgress | null> {
  const { data, error } = await supabase
    .from("user_progress")
    .select("xp, level, total_polls_answered, streak_days")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return {
    xp: data.xp,
    level: data.level,
    totalPollsAnswered: data.total_polls_answered,
    streakDays: data.streak_days,
  };
}

export async function awardXP(
  userId: string,
  amount: number
): Promise<{ xp: number; level: number; leveledUp: boolean } | null> {
  const { data, error } = await supabase.rpc("award_xp", {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error || !data) return null;
  return {
    xp: (data as { xp: number; level: number; leveled_up: boolean }).xp,
    level: (data as { xp: number; level: number; leveled_up: boolean }).level,
    leveledUp: (data as { xp: number; level: number; leveled_up: boolean }).leveled_up,
  };
}
